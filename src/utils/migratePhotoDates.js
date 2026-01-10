import { collection, getDocs, updateDoc, doc } from 'firebase/firestore'
import { db } from '../config/firebase'

/**
 * Migration script to add creationDate and photoDate fields to existing photos
 * - creationDate: For existing photos, we'll use the createdAt timestamp (upload time)
 * - photoDate: For photobooth photos, assign fixed dates (Saturday: 12/27/2025, Sunday: 12/28/2025)
 * This is a one-time migration that should be run manually
 */
export async function migratePhotoDates() {
  if (!db) {
    console.error('Firebase not configured')
    return { success: false, error: 'Firebase not configured' }
  }

  const results = {
    gallery: { updated: 0, skipped: 0, errors: 0 },
    saturday: { updated: 0, skipped: 0, errors: 0 },
    sunday: { updated: 0, skipped: 0, errors: 0 }
  }

  try {
    // Migrate gallery photos
    console.log('Migrating gallery photos...')
    const galleryRef = collection(db, 'wedding-photos')
    const gallerySnapshot = await getDocs(galleryRef)

    for (const photoDoc of gallerySnapshot.docs) {
      const data = photoDoc.data()

      // Skip if already has creationDate
      if (data.creationDate) {
        results.gallery.skipped++
        continue
      }

      try {
        // Use createdAt if available, otherwise use current timestamp
        const creationDate = data.createdAt || new Date().toISOString()

        await updateDoc(doc(db, 'wedding-photos', photoDoc.id), {
          creationDate: creationDate
        })

        results.gallery.updated++
        console.log(`Updated gallery photo ${photoDoc.id}`)
      } catch (error) {
        console.error(`Error updating gallery photo ${photoDoc.id}:`, error)
        results.gallery.errors++
      }
    }

    // Migrate Saturday photobooth photos
    console.log('Migrating Saturday photobooth photos...')
    const saturdayRef = collection(db, 'photobooth-saturday')
    const saturdaySnapshot = await getDocs(saturdayRef)

    for (const photoDoc of saturdaySnapshot.docs) {
      const data = photoDoc.data()

      // Check if both fields are present
      const needsCreationDate = !data.creationDate
      const needsPhotoDate = !data.photoDate

      if (!needsCreationDate && !needsPhotoDate) {
        results.saturday.skipped++
        continue
      }

      try {
        const updates = {}

        if (needsCreationDate) {
          updates.creationDate = data.createdAt || new Date().toISOString()
        }

        if (needsPhotoDate) {
          // Assign Saturday date: 12/27/2025
          updates.photoDate = new Date('2025-12-27T12:00:00').toISOString()
        }

        await updateDoc(doc(db, 'photobooth-saturday', photoDoc.id), updates)

        results.saturday.updated++
        console.log(`Updated Saturday photo ${photoDoc.id}`, updates)
      } catch (error) {
        console.error(`Error updating Saturday photo ${photoDoc.id}:`, error)
        results.saturday.errors++
      }
    }

    // Migrate Sunday photobooth photos
    console.log('Migrating Sunday photobooth photos...')
    const sundayRef = collection(db, 'photobooth-sunday')
    const sundaySnapshot = await getDocs(sundayRef)

    for (const photoDoc of sundaySnapshot.docs) {
      const data = photoDoc.data()

      // Check if both fields are present
      const needsCreationDate = !data.creationDate
      const needsPhotoDate = !data.photoDate

      if (!needsCreationDate && !needsPhotoDate) {
        results.sunday.skipped++
        continue
      }

      try {
        const updates = {}

        if (needsCreationDate) {
          updates.creationDate = data.createdAt || new Date().toISOString()
        }

        if (needsPhotoDate) {
          // Assign Sunday date: 12/28/2025
          updates.photoDate = new Date('2025-12-28T12:00:00').toISOString()
        }

        await updateDoc(doc(db, 'photobooth-sunday', photoDoc.id), updates)

        results.sunday.updated++
        console.log(`Updated Sunday photo ${photoDoc.id}`, updates)
      } catch (error) {
        console.error(`Error updating Sunday photo ${photoDoc.id}:`, error)
        results.sunday.errors++
      }
    }

    console.log('Migration complete!', results)
    return { success: true, results }

  } catch (error) {
    console.error('Migration failed:', error)
    return { success: false, error: error.message, results }
  }
}
