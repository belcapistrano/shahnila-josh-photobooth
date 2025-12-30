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
        const photosList = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }))
        setSaturdayPhotos(photosList)
        setLoading(false)
        console.log(`Saturday photos loaded: ${photosList.length}`)
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
        const photosList = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }))
        setSundayPhotos(photosList)
        console.log(`Sunday photos loaded: ${photosList.length}`)
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

    // If Firebase is not configured, use local storage
    if (!useFirebase || !storage || !db) {
      const newPhoto = {
        id: timestamp,
        dataUrl: photoData,
        timestamp: new Date().toISOString(),
        day: day,
        folder: folder,
        likes: 0,
        fileType: fileExtension
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

      // Upload photo data (base64)
      await uploadString(storageRef, photoData, 'data_url')

      // Get download URL
      const downloadURL = await getDownloadURL(storageRef)

      // Save metadata to specific Firestore collection
      const photoDoc = await addDoc(collection(db, collectionName), {
        downloadURL,
        storagePath: filename,
        timestamp: serverTimestamp(),
        createdAt: new Date().toISOString(),
        day: day,
        folder: folder,
        likes: 0,
        fileType: fileExtension,
        isVideo: fileExtension === '.mp4'
      })

      return {
        id: photoDoc.id,
        downloadURL,
        timestamp: new Date().toISOString(),
        day: day
      }
    } catch (err) {
      console.error('Firebase upload failed:', err)
      console.warn('Falling back to local storage')

      // Fallback to local storage on error
      const newPhoto = {
        id: timestamp,
        dataUrl: photoData,
        timestamp: new Date().toISOString(),
        day: day,
        folder: folder,
        likes: 0,
        fileType: fileExtension,
        isVideo: fileExtension === '.mp4'
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
    try {
      if (!useFirebase || !storage || !db) {
        if (day === 'saturday') {
          setLocalSaturdayPhotos(prev =>
            prev.map(photo =>
              photo.id === photoId
                ? { ...photo, likes: Math.max(0, (photo.likes || 0) + incrementValue) }
                : photo
            )
          )
        } else {
          setLocalSundayPhotos(prev =>
            prev.map(photo =>
              photo.id === photoId
                ? { ...photo, likes: Math.max(0, (photo.likes || 0) + incrementValue) }
                : photo
            )
          )
        }
        return
      }

      const collectionName = day === 'saturday' ? SATURDAY_COLLECTION : SUNDAY_COLLECTION
      const photoRef = doc(db, collectionName, photoId)
      await updateDoc(photoRef, {
        likes: increment(incrementValue)
      })
    } catch (err) {
      console.error('Error updating photo likes:', err)
      // Fallback to local update on error
      if (day === 'saturday') {
        setLocalSaturdayPhotos(prev =>
          prev.map(photo =>
            photo.id === photoId
              ? { ...photo, likes: Math.max(0, (photo.likes || 0) + incrementValue) }
              : photo
          )
        )
      } else {
        setLocalSundayPhotos(prev =>
          prev.map(photo =>
            photo.id === photoId
              ? { ...photo, likes: Math.max(0, (photo.likes || 0) + incrementValue) }
              : photo
          )
        )
      }
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
    isUsingFirebase: useFirebase && storage && db && !error
  }
}

export default usePhotoboothPhotos
