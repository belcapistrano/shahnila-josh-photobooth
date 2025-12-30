import { useState, useEffect } from 'react'
import { ref, uploadString, getDownloadURL } from 'firebase/storage'
import {
  collection,
  addDoc,
  deleteDoc,
  doc,
  query,
  orderBy,
  onSnapshot,
  serverTimestamp,
  updateDoc,
  increment,
  getDoc
} from 'firebase/firestore'
import { storage, db, isFirebaseConfigured } from '../config/firebase'
import useLocalStorage from './useLocalStorage'
import { processImage } from '../utils/imageOptimization'

const PHOTOS_COLLECTION = 'wedding-photos'
const DELETED_PHOTOS_COLLECTION = 'deleted-photos'

function useFirebasePhotos() {
  const [photos, setPhotos] = useState([])
  const [localPhotos, setLocalPhotos] = useLocalStorage('photobooth-photos', [])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [refreshTrigger, setRefreshTrigger] = useState(0)
  const useFirebase = isFirebaseConfigured()

  // Add visibility change listener to refresh on tab focus
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden && useFirebase && db) {
        // Tab became visible, trigger refresh
        console.log('Tab visible, refreshing gallery...')
        setRefreshTrigger(prev => prev + 1)
      }
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange)
  }, [useFirebase])

  // Real-time listener for photos (only if Firebase is configured)
  useEffect(() => {
    if (!useFirebase || !db) {
      // Use local storage fallback
      setPhotos(localPhotos)
      setLoading(false)
      return
    }

    const photosRef = collection(db, PHOTOS_COLLECTION)
    const q = query(photosRef, orderBy('timestamp', 'desc'))

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const photosList = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }))
        setPhotos(photosList)
        setLoading(false)
        console.log(`Gallery refreshed: ${photosList.length} photos loaded`)
      },
      (err) => {
        console.error('Error fetching photos:', err)
        console.warn('Falling back to local storage due to Firebase error')
        setError(err.message)
        // Fallback to local storage on error
        setPhotos(localPhotos)
        setLoading(false)
      }
    )

    return () => unsubscribe()
  }, [useFirebase, localPhotos, refreshTrigger])

  // Upload photo to Firebase Storage and save metadata to Firestore
  const uploadPhoto = async (photoData, filter = 'none', challenge = null) => {
    const timestamp = Date.now()

    // Detect if this is a video
    const isVideo = photoData.startsWith('data:video/')

    // Determine file extension from data URL
    const getFileExtension = (dataUrl) => {
      const mimeMatch = dataUrl.match(/data:([^;]+);/)
      if (mimeMatch) {
        const mimeType = mimeMatch[1]
        if (mimeType.startsWith('video/mp4')) return '.mp4'
        if (mimeType.startsWith('video/')) return '.mp4'
        if (mimeType === 'image/jpeg' || mimeType === 'image/jpg') return '.jpg'
        if (mimeType === 'image/png') return '.png'
      }
      return '.jpg'
    }

    const fileExtension = getFileExtension(photoData)

    // Process image to generate optimized versions (skip for videos)
    let processedImage = null
    if (!isVideo) {
      try {
        processedImage = await processImage(photoData)
      } catch (error) {
        console.error('Error processing image:', error)
      }
    }

    // If Firebase is not configured, use local storage
    if (!useFirebase || !storage || !db) {
      const newPhoto = {
        id: timestamp,
        dataUrl: processedImage?.compressed || photoData,
        originalDataUrl: photoData,
        thumbnail: processedImage?.thumbnail,
        blurPlaceholder: processedImage?.blurPlaceholder,
        timestamp: new Date().toISOString(),
        filter: filter || 'none',
        likes: 0,
        isVideo,
        fileType: fileExtension,
        challenge: challenge ? {
          text: challenge.text,
          emoji: challenge.emoji,
          category: challenge.category
        } : null
      }
      setLocalPhotos(prev => [newPhoto, ...prev])
      return newPhoto
    }

    try {
      // Upload original high-res photo/video
      const originalFilename = `photos/originals/${timestamp}${fileExtension}`
      const originalRef = ref(storage, originalFilename)
      await uploadString(originalRef, photoData, 'data_url')
      const originalURL = await getDownloadURL(originalRef)

      // Upload compressed version for display (images only, videos use original)
      const compressedFilename = `photos/${timestamp}${fileExtension}`
      const compressedRef = ref(storage, compressedFilename)
      const compressedData = isVideo ? photoData : (processedImage?.compressed || photoData)
      await uploadString(compressedRef, compressedData, 'data_url')
      const downloadURL = await getDownloadURL(compressedRef)

      // Upload thumbnail if available (images only)
      let thumbnailURL = null
      if (!isVideo && processedImage?.thumbnail) {
        const thumbnailFilename = `photos/thumbnails/${timestamp}${fileExtension}`
        const thumbnailRef = ref(storage, thumbnailFilename)
        await uploadString(thumbnailRef, processedImage.thumbnail, 'data_url')
        thumbnailURL = await getDownloadURL(thumbnailRef)
      }

      // Save metadata to Firestore
      const photoDoc = await addDoc(collection(db, PHOTOS_COLLECTION), {
        downloadURL,
        originalURL,
        thumbnailURL,
        blurPlaceholder: processedImage?.blurPlaceholder || null,
        storagePath: compressedFilename,
        originalStoragePath: originalFilename,
        filter,
        timestamp: serverTimestamp(),
        createdAt: new Date().toISOString(),
        likes: 0,
        isVideo,
        fileType: fileExtension,
        challenge: challenge ? {
          text: challenge.text,
          emoji: challenge.emoji,
          category: challenge.category
        } : null
      })

      return {
        id: photoDoc.id,
        downloadURL,
        originalURL,
        thumbnailURL,
        blurPlaceholder: processedImage?.blurPlaceholder,
        filter,
        isVideo,
        fileType: fileExtension,
        timestamp: new Date().toISOString()
      }
    } catch (err) {
      console.error('Firebase upload failed:', err)
      console.warn('Falling back to local storage')

      // Fallback to local storage on error
      const newPhoto = {
        id: timestamp,
        dataUrl: processedImage?.compressed || photoData,
        originalDataUrl: photoData,
        thumbnail: processedImage?.thumbnail,
        blurPlaceholder: processedImage?.blurPlaceholder,
        timestamp: new Date().toISOString(),
        filter: filter || 'none',
        likes: 0,
        isVideo,
        fileType: fileExtension,
        challenge: challenge ? {
          text: challenge.text,
          emoji: challenge.emoji,
          category: challenge.category
        } : null
      }
      setLocalPhotos(prev => [newPhoto, ...prev])
      return newPhoto
    }
  }

  // Soft delete: Move metadata to deleted collection, keep photo in storage
  const deletePhoto = async (photoId, storagePath) => {
    try {
      // If Firebase is not configured, use local storage
      if (!useFirebase || !storage || !db) {
        setLocalPhotos(prev => prev.filter(photo => photo.id !== photoId))
        return
      }

      // Get the photo document data before deleting
      const photoDocRef = doc(db, PHOTOS_COLLECTION, photoId)
      const photoDoc = await getDoc(photoDocRef)

      if (!photoDoc.exists()) {
        console.error('Photo document not found')
        return
      }

      const photoData = photoDoc.data()

      // Save to deleted-photos collection with backup info
      // Keep the photo in storage but archive the metadata
      await addDoc(collection(db, DELETED_PHOTOS_COLLECTION), {
        ...photoData,
        originalId: photoId,
        deletedAt: serverTimestamp(),
        deletedTimestamp: new Date().toISOString(),
        storagePath: storagePath
      })

      // Delete from original Firestore collection
      await deleteDoc(photoDocRef)

      console.log('Photo metadata moved to deleted collection successfully')
    } catch (err) {
      console.error('Error deleting photo:', err)
      throw err
    }
  }

  // Delete all photos
  const clearAllPhotos = async () => {
    try {
      // If Firebase is not configured, use local storage
      if (!useFirebase || !storage || !db) {
        setLocalPhotos([])
        return
      }

      const deletePromises = photos.map(photo =>
        deletePhoto(photo.id, photo.storagePath)
      )
      await Promise.all(deletePromises)
    } catch (err) {
      console.error('Error clearing all photos:', err)
      throw err
    }
  }

  // Like/Unlike a photo (increment or decrement likes count)
  const likePhoto = async (photoId, incrementValue = 1) => {
    try {
      // If Firebase is not configured, use local storage
      if (!useFirebase || !storage || !db) {
        setLocalPhotos(prev =>
          prev.map(photo =>
            photo.id === photoId
              ? { ...photo, likes: Math.max(0, (photo.likes || 0) + incrementValue) }
              : photo
          )
        )
        return
      }

      // Update likes count in Firestore
      const photoRef = doc(db, PHOTOS_COLLECTION, photoId)
      await updateDoc(photoRef, {
        likes: increment(incrementValue)
      })
    } catch (err) {
      console.error('Error updating photo likes:', err)
      // Fallback to local update on error
      setLocalPhotos(prev =>
        prev.map(photo =>
          photo.id === photoId
            ? { ...photo, likes: Math.max(0, (photo.likes || 0) + incrementValue) }
            : photo
        )
      )
    }
  }

  return {
    photos,
    loading,
    error,
    uploadPhoto,
    deletePhoto,
    clearAllPhotos,
    likePhoto,
    isUsingFirebase: useFirebase && storage && db && !error
  }
}

export default useFirebasePhotos
