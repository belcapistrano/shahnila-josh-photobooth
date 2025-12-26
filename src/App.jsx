import { useState } from 'react'
import Camera from './components/Camera'
import PhotoGallery from './components/PhotoGallery'
import Challenges from './components/Challenges'
import InfoBanner from './components/InfoBanner'
import TabNavigation from './components/TabNavigation'
import RecentPhoto from './components/RecentPhoto'
import useFirebasePhotos from './hooks/useFirebasePhotos'

function App() {
  const { photos, loading, uploadPhoto, deletePhoto, clearAllPhotos } = useFirebasePhotos()
  const [activeTab, setActiveTab] = useState('camera')
  const [recentPhoto, setRecentPhoto] = useState(null)
  const [uploading, setUploading] = useState(false)

  const handlePhotoCapture = async (photoData, filter) => {
    try {
      setUploading(true)

      // Upload to Firebase (or fallback to local storage)
      const uploadedPhoto = await uploadPhoto(photoData, filter)

      // Set as recent photo for preview (with dataUrl for local display)
      setRecentPhoto({
        ...uploadedPhoto,
        dataUrl: photoData
      })
    } catch (error) {
      console.error('Error capturing photo:', error)
      // Error is already handled in useFirebasePhotos hook with fallback
    } finally {
      setUploading(false)
    }
  }

  const handleDeletePhoto = async (id, storagePath) => {
    try {
      await deletePhoto(id, storagePath)

      // Clear recent photo if it's the one being deleted
      if (recentPhoto && recentPhoto.id === id) {
        setRecentPhoto(null)
      }
    } catch (error) {
      console.error('Error deleting photo:', error)
      // Error is already handled in useFirebasePhotos hook with fallback
    }
  }

  const handleClearAll = async () => {
    if (window.confirm('Are you sure you want to delete all photos?')) {
      try {
        await clearAllPhotos()
        setRecentPhoto(null)
      } catch (error) {
        console.error('Error clearing photos:', error)
        // Error is already handled in useFirebasePhotos hook with fallback
      }
    }
  }

  const handleTakePhoto = () => {
    setActiveTab('camera')
  }

  return (
    <div className="app">
      <header className="app-header">
        <div className="wedding-title">
          <h1>Shahnila & Josh</h1>
          <p className="wedding-subtitle">Our Wedding Celebration</p>
          <div className="wedding-schedule">
            <p className="wedding-date-header">♥ December 26-28, 2025 ♥</p>
          </div>
        </div>
      </header>
      <InfoBanner />
      <main className="app-main">
        {activeTab === 'camera' && <Camera onCapture={handlePhotoCapture} />}
        {activeTab === 'gallery' && (
          <PhotoGallery
            photos={photos}
            onDelete={handleDeletePhoto}
            onClearAll={handleClearAll}
          />
        )}
        {activeTab === 'challenges' && <Challenges onTakePhoto={handleTakePhoto} />}
      </main>
      <RecentPhoto photo={recentPhoto} onDelete={handleDeletePhoto} />
      <TabNavigation activeTab={activeTab} onTabChange={setActiveTab} />
    </div>
  )
}

export default App
