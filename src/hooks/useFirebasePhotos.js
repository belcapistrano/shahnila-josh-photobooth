import { useState, useEffect } from 'react'
import { ref, uploadString, deleteObject, getDownloadURL } from 'firebase/storage'
import {
  collection,
  addDoc,
  deleteDoc,
  doc,
  query,
  orderBy,
  onSnapshot,
  serverTimestamp
} from 'firebase/firestore'
import { storage, db } from '../config/firebase'

const PHOTOS_COLLECTION = 'wedding-photos'

function useFirebasePhotos() {
  const [photos, setPhotos] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  // Real-time listener for photos
  useEffect(() => {
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
      },
      (err) => {
        console.error('Error fetching photos:', err)
        setError(err.message)
        setLoading(false)
      }
    )

    return () => unsubscribe()
  }, [])

  // Upload photo to Firebase Storage and save metadata to Firestore
  const uploadPhoto = async (photoData, filter = 'none') => {
    try {
      // Generate unique filename
      const timestamp = Date.now()
      const filename = `photos/${timestamp}.jpg`
      const storageRef = ref(storage, filename)

      // Upload photo data (base64)
      await uploadString(storageRef, photoData, 'data_url')

      // Get download URL
      const downloadURL = await getDownloadURL(storageRef)

      // Save metadata to Firestore
      const photoDoc = await addDoc(collection(db, PHOTOS_COLLECTION), {
        downloadURL,
        storagePath: filename,
        filter,
        timestamp: serverTimestamp(),
        createdAt: new Date().toISOString()
      })

      return {
        id: photoDoc.id,
        downloadURL,
        filter,
        timestamp: new Date().toISOString()
      }
    } catch (err) {
      console.error('Error uploading photo:', err)
      throw err
    }
  }

  // Delete photo from Storage and Firestore
  const deletePhoto = async (photoId, storagePath) => {
    try {
      // Delete from Firestore
      await deleteDoc(doc(db, PHOTOS_COLLECTION, photoId))

      // Delete from Storage
      if (storagePath) {
        const storageRef = ref(storage, storagePath)
        await deleteObject(storageRef)
      }
    } catch (err) {
      console.error('Error deleting photo:', err)
      throw err
    }
  }

  // Delete all photos
  const clearAllPhotos = async () => {
    try {
      const deletePromises = photos.map(photo =>
        deletePhoto(photo.id, photo.storagePath)
      )
      await Promise.all(deletePromises)
    } catch (err) {
      console.error('Error clearing all photos:', err)
      throw err
    }
  }

  return {
    photos,
    loading,
    error,
    uploadPhoto,
    deletePhoto,
    clearAllPhotos
  }
}

export default useFirebasePhotos
