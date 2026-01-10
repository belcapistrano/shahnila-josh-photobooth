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
  increment
} from 'firebase/firestore'
import { storage, db, isFirebaseConfigured } from '../config/firebase'
import useLocalStorage from './useLocalStorage'
import { processImage } from '../utils/imageOptimization'

const SATURDAY_COLLECTION = 'photobooth-saturday'
const SUNDAY_COLLECTION = 'photobooth-sunday'

function usePhotoboothPhotos() {
  const [saturdayPhotos, setSaturdayPhotos] = useState([])
  const [sundayPhotos, setSundayPhotos] = useState([])
  const [localSaturdayPhotos, setLocalSaturdayPhotos] = useLocalStorage('photobooth-saturday', [])
  const [localSundayPhotos, setLocalSundayPhotos] = useLocalStorage('photobooth-sunday', [])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const useFirebase = isFirebaseConfigured()

  // Real-time listener for Saturday photos
  useEffect(() => {
    if (!useFirebase || !db) {
      setSaturdayPhotos(localSaturdayPhotos)
      setLoading(false)
      return
    }

    const saturdayRef = collection(db, SATURDAY_COLLECTION)
    const q = query(saturdayRef, orderBy('timestamp', 'desc'))

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        setSaturdayPhotos(prevPhotos => {
          const newPhotosList = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          }))

          // Check if this is just a like count update (no new/deleted photos)
          if (prevPhotos.length === newPhotosList.length && prevPhotos.length > 0) {
            const prevIds = prevPhotos.map(p => p.id).join(',')
            const newIds = newPhotosList.map(p => p.id).join(',')

            // If photo IDs are the same, just update the like counts without changing order
            if (prevIds === newIds) {
              const likesMap = new Map(newPhotosList.map(p => [p.id, p.likes]))
              return prevPhotos.map(photo => ({
                ...photo,
                likes: likesMap.get(photo.id) ?? photo.likes
              }))
            }
          }

          // New photos added/deleted, or initial load - replace entire array
          console.log(`Saturday photos loaded: ${newPhotosList.length}`)
          return newPhotosList
        })
        setLoading(false)
      },
      (err) => {
        console.error('Error fetching Saturday photos:', err)
        setError(err.message)
        setSaturdayPhotos(localSaturdayPhotos)
        setLoading(false)
      }
    )

    return () => unsubscribe()
  }, [useFirebase, localSaturdayPhotos])

  // Real-time listener for Sunday photos
  useEffect(() => {
    if (!useFirebase || !db) {
      setSundayPhotos(localSundayPhotos)
      return
    }

    const sundayRef = collection(db, SUNDAY_COLLECTION)
    const q = query(sundayRef, orderBy('timestamp', 'desc'))

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        setSundayPhotos(prevPhotos => {
          const newPhotosList = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          }))

          // Check if this is just a like count update (no new/deleted photos)
          if (prevPhotos.length === newPhotosList.length && prevPhotos.length > 0) {
            const prevIds = prevPhotos.map(p => p.id).join(',')
            const newIds = newPhotosList.map(p => p.id).join(',')

            // If photo IDs are the same, just update the like counts without changing order
            if (prevIds === newIds) {
              const likesMap = new Map(newPhotosList.map(p => [p.id, p.likes]))
              return prevPhotos.map(photo => ({
                ...photo,
                likes: likesMap.get(photo.id) ?? photo.likes
              }))
            }
          }

          // New photos added/deleted, or initial load - replace entire array
          console.log(`Sunday photos loaded: ${newPhotosList.length}`)
          return newPhotosList
        })
      },
      (err) => {
        console.error('Error fetching Sunday photos:', err)
        setError(err.message)
        setSundayPhotos(localSundayPhotos)
      }
    )

    return () => unsubscribe()
  }, [useFirebase, localSundayPhotos])

  // Upload photo to specific day and folder
  const uploadPhoto = async (photoData, day, folder = 'original') => {
    const timestamp = Date.now()
    const creationDate = new Date().toISOString()

    // Assign specific date based on the day folder
    const photoDate = day === 'saturday'
      ? new Date('2025-12-27T12:00:00').toISOString()
      : new Date('2025-12-28T12:00:00').toISOString()

    const collectionName = day === 'saturday' ? SATURDAY_COLLECTION : SUNDAY_COLLECTION
    const storagePath = `photobooth/${day}/${folder}`

    // Detect file type from data URL and get appropriate extension
    const getFileExtension = (dataUrl) => {
      const mimeMatch = dataUrl.match(/data:([^;]+);/)
      if (mimeMatch) {
        const mimeType = mimeMatch[1]
        if (mimeType.startsWith('video/mp4') || mimeType.startsWith('video/mpeg')) {
          return '.mp4'
        } else if (mimeType === 'image/jpeg' || mimeType === 'image/jpg') {
          return '.jpg'
        } else if (mimeType === 'image/png') {
          return '.png'
        } else if (mimeType === 'image/gif') {
          return '.gif'
        } else if (mimeType === 'image/webp') {
          return '.webp'
        }
      }
      return '.jpg' // default fallback
    }

    const fileExtension = getFileExtension(photoData)
    const isVideo = fileExtension === '.mp4'

    // Process images to generate thumbnails and blur placeholders
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
        thumbnail: processedImage?.thumbnail,
        blurPlaceholder: processedImage?.blurPlaceholder,
        timestamp: new Date().toISOString(),
        creationDate: creationDate,
        photoDate: photoDate,
        day: day,
        folder: folder,
        likes: 0,
        fileType: fileExtension,
        isVideo: isVideo
      }

      if (day === 'saturday') {
        setLocalSaturdayPhotos(prev => [newPhoto, ...prev])
      } else {
        setLocalSundayPhotos(prev => [newPhoto, ...prev])
      }
      return newPhoto
    }

    try {
      // Firebase upload to specific folder with correct extension
      const filename = `${storagePath}/${timestamp}${fileExtension}`
      const storageRef = ref(storage, filename)

      // Upload compressed photo data (or original for videos)
      const uploadData = isVideo ? photoData : (processedImage?.compressed || photoData)
      await uploadString(storageRef, uploadData, 'data_url')

      // Get download URL for main file
      const downloadURL = await getDownloadURL(storageRef)

      // Upload thumbnail if available (images only)
      let thumbnailURL = null
      if (!isVideo && processedImage?.thumbnail) {
        const thumbnailFilename = `${storagePath}/thumbnails/${timestamp}${fileExtension}`
        const thumbnailRef = ref(storage, thumbnailFilename)
        await uploadString(thumbnailRef, processedImage.thumbnail, 'data_url')
        thumbnailURL = await getDownloadURL(thumbnailRef)
      }

      // Save metadata to specific Firestore collection
      const photoDoc = await addDoc(collection(db, collectionName), {
        downloadURL,
        thumbnailURL,
        blurPlaceholder: processedImage?.blurPlaceholder || null,
        storagePath: filename,
        timestamp: serverTimestamp(),
        createdAt: new Date().toISOString(),
        creationDate: creationDate,
        photoDate: photoDate,
        day: day,
        folder: folder,
        likes: 0,
        fileType: fileExtension,
        isVideo: isVideo
      })

      return {
        id: photoDoc.id,
        downloadURL,
        thumbnailURL,
        blurPlaceholder: processedImage?.blurPlaceholder,
        timestamp: new Date().toISOString(),
        day: day
      }
    } catch (err) {
      console.error('Firebase upload failed:', err)
      console.warn('Falling back to local storage')

      // Fallback to local storage on error
      const newPhoto = {
        id: timestamp,
        dataUrl: processedImage?.compressed || photoData,
        thumbnail: processedImage?.thumbnail,
        blurPlaceholder: processedImage?.blurPlaceholder,
        timestamp: new Date().toISOString(),
        creationDate: creationDate,
        photoDate: photoDate,
        day: day,
        folder: folder,
        likes: 0,
        fileType: fileExtension,
        isVideo: isVideo
      }

      if (day === 'saturday') {
        setLocalSaturdayPhotos(prev => [newPhoto, ...prev])
      } else {
        setLocalSundayPhotos(prev => [newPhoto, ...prev])
      }
      return newPhoto
    }
  }

  // Delete photo from specific collection
  const deletePhoto = async (photoId, day) => {
    try {
      if (!useFirebase || !storage || !db) {
        if (day === 'saturday') {
          setLocalSaturdayPhotos(prev => prev.filter(photo => photo.id !== photoId))
        } else {
          setLocalSundayPhotos(prev => prev.filter(photo => photo.id !== photoId))
        }
        return
      }

      const collectionName = day === 'saturday' ? SATURDAY_COLLECTION : SUNDAY_COLLECTION
      const photoDocRef = doc(db, collectionName, photoId)
      await deleteDoc(photoDocRef)

      console.log(`Photo deleted from ${day}`)
    } catch (err) {
      console.error('Error deleting photo:', err)
      throw err
    }
  }

  // Like/Unlike a photo
  const likePhoto = async (photoId, day, incrementValue = 1) => {
    // Optimistic update: Update local state immediately for instant feedback
    const updateLocalState = (setter) => {
      setter(prev =>
        prev.map(photo =>
          photo.id === photoId
            ? { ...photo, likes: Math.max(0, (photo.likes || 0) + incrementValue) }
            : photo
        )
      )
    }

    if (day === 'saturday') {
      updateLocalState(setSaturdayPhotos)
    } else {
      updateLocalState(setSundayPhotos)
    }

    // If Firebase is not configured, just use local storage
    if (!useFirebase || !storage || !db) {
      if (day === 'saturday') {
        updateLocalState(setLocalSaturdayPhotos)
      } else {
        updateLocalState(setLocalSundayPhotos)
      }
      return
    }

    // Sync with Firebase in the background
    try {
      const collectionName = day === 'saturday' ? SATURDAY_COLLECTION : SUNDAY_COLLECTION
      const photoRef = doc(db, collectionName, photoId)
      await updateDoc(photoRef, {
        likes: increment(incrementValue)
      })
    } catch (err) {
      console.error('Error updating photo likes:', err)
      // Revert optimistic update on error by refreshing from Firebase
      // The real-time listener will automatically sync the correct state
    }
  }

  // Update photo date
  const updatePhotoDate = async (photoId, day, newDateString) => {
    try {
      // If Firebase is not configured, use local storage
      if (!useFirebase || !storage || !db) {
        const updateLocalState = (setter) => {
          setter(prev =>
            prev.map(photo =>
              photo.id === photoId
                ? { ...photo, photoDate: newDateString, creationDate: newDateString }
                : photo
            )
          )
        }

        if (day === 'saturday') {
          updateLocalState(setLocalSaturdayPhotos)
        } else {
          updateLocalState(setLocalSundayPhotos)
        }
        return
      }

      const collectionName = day === 'saturday' ? SATURDAY_COLLECTION : SUNDAY_COLLECTION
      const photoRef = doc(db, collectionName, photoId)
      await updateDoc(photoRef, {
        photoDate: newDateString,
        creationDate: newDateString
      })

      console.log(`Updated ${day} photo ${photoId} date to ${newDateString}`)
    } catch (err) {
      console.error('Error updating photo date:', err)
      throw err
    }
  }

  return {
    saturdayPhotos,
    sundayPhotos,
    loading,
    error,
    uploadPhoto,
    deletePhoto,
    likePhoto,
    updatePhotoDate,
    isUsingFirebase: useFirebase && storage && db && !error
  }
}

export default usePhotoboothPhotos
