import { ref, uploadString, getDownloadURL } from 'firebase/storage'
import { doc, updateDoc, collection, getDocs } from 'firebase/firestore'
import { storage, db } from '../config/firebase'
import { processImage } from './imageOptimization'

/**
 * Convert image URL to data URL
 */
async function urlToDataUrl(url) {
  try {
    const response = await fetch(url, { mode: 'cors' })
    const blob = await response.blob()

    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onloadend = () => resolve(reader.result)
      reader.onerror = reject
      reader.readAsDataURL(blob)
    })
  } catch (error) {
    console.error('Error converting URL to data URL:', error)
    throw error
  }
}

/**
 * Process a single photo to generate thumbnails and compressed versions
 */
async function processSinglePhoto(photo, collectionName, onProgress) {
  // Wrap entire function in timeout
  const TIMEOUT_MS = 60000 // 60 seconds per photo

  const processPromise = new Promise(async (resolve, reject) => {
    try {
      // Skip if already has thumbnail/blur placeholder or if it's a video
      if (photo.thumbnailURL || photo.blurPlaceholder || photo.isVideo) {
        const reason = photo.isVideo
          ? 'Video file'
          : (photo.thumbnailURL && photo.blurPlaceholder)
            ? 'Already optimized'
            : 'Partially optimized'

        onProgress?.({
          id: photo.id,
          status: 'skipped',
          reason
        })
        resolve({ success: true, skipped: true })
        return
      }

      onProgress?.({ id: photo.id, status: 'downloading', fileName: photo.storagePath })

      // Download original image with timeout
      const dataUrl = await urlToDataUrl(photo.downloadURL)

      onProgress?.({ id: photo.id, status: 'processing', fileName: photo.storagePath })

      // Process image to generate optimized versions
      const processed = await processImage(dataUrl)

      onProgress?.({ id: photo.id, status: 'uploading', fileName: photo.storagePath })

      // Upload compressed version (replace original)
      const storagePath = photo.storagePath
      const storageRef = ref(storage, storagePath)
      await uploadString(storageRef, processed.compressed, 'data_url')
      const compressedURL = await getDownloadURL(storageRef)

      // Upload thumbnail
      const thumbnailPath = storagePath.replace(/\/([^/]+)$/, '/thumbnails/$1')
      const thumbnailRef = ref(storage, thumbnailPath)
      await uploadString(thumbnailRef, processed.thumbnail, 'data_url')
      const thumbnailURL = await getDownloadURL(thumbnailRef)

      onProgress?.({ id: photo.id, status: 'updating', fileName: photo.storagePath })

      // Update Firestore document
      const photoRef = doc(db, collectionName, photo.id)
      await updateDoc(photoRef, {
        downloadURL: compressedURL,
        thumbnailURL,
        blurPlaceholder: processed.blurPlaceholder
      })

      onProgress?.({ id: photo.id, status: 'completed', fileName: photo.storagePath })

      resolve({ success: true, skipped: false })
    } catch (error) {
      console.error(`Error processing photo ${photo.id}:`, error)
      onProgress?.({ id: photo.id, status: 'error', error: error.message, fileName: photo.storagePath })
      reject(error)
    }
  })

  const timeoutPromise = new Promise((_, reject) => {
    setTimeout(() => {
      reject(new Error(`Timeout: Photo processing took longer than ${TIMEOUT_MS / 1000}s`))
    }, TIMEOUT_MS)
  })

  try {
    return await Promise.race([processPromise, timeoutPromise])
  } catch (error) {
    console.error(`Error processing photo ${photo.id}:`, error)
    onProgress?.({ id: photo.id, status: 'error', error: error.message, fileName: photo.storagePath })
    return { success: false, error: error.message }
  }
}

/**
 * Process all photos in a collection
 */
export async function processPhotosInCollection(collectionName, onProgress) {
  try {
    // Get all photos from collection
    const photosRef = collection(db, collectionName)
    const snapshot = await getDocs(photosRef)
    const photos = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))

    console.log(`Found ${photos.length} photos in ${collectionName}`)

    const results = {
      total: photos.length,
      processed: 0,
      skipped: 0,
      errors: 0,
      details: []
    }

    // Process each photo sequentially to avoid overwhelming Firebase
    for (let i = 0; i < photos.length; i++) {
      const photo = photos[i]

      onProgress?.({
        collection: collectionName,
        current: i + 1,
        total: photos.length,
        photo: photo.id,
        status: 'processing'
      })

      const result = await processSinglePhoto(photo, collectionName, (detail) => {
        onProgress?.({
          collection: collectionName,
          current: i + 1,
          total: photos.length,
          photo: photo.id,
          ...detail
        })
      })

      if (result.skipped) {
        results.skipped++
      } else if (result.success) {
        results.processed++
      } else {
        results.errors++
      }

      results.details.push({
        id: photo.id,
        ...result
      })

      // Small delay to avoid rate limiting (reduced from 500ms)
      await new Promise(resolve => setTimeout(resolve, 200))
    }

    return results
  } catch (error) {
    console.error('Error processing collection:', error)
    throw error
  }
}

/**
 * Process all existing photos across all collections
 */
export async function processAllExistingPhotos(onProgress) {
  const collections = ['photobooth-saturday', 'photobooth-sunday']
  const allResults = {}

  for (const collectionName of collections) {
    try {
      onProgress?.({
        stage: 'collection',
        collection: collectionName,
        status: 'starting'
      })

      const results = await processPhotosInCollection(collectionName, onProgress)
      allResults[collectionName] = results

      onProgress?.({
        stage: 'collection',
        collection: collectionName,
        status: 'completed',
        results
      })
    } catch (error) {
      console.error(`Error processing ${collectionName}:`, error)
      allResults[collectionName] = {
        error: error.message
      }
    }
  }

  return allResults
}
