import { useState, useRef, useEffect } from 'react'
import Camera from './components/Camera'
import PhotoGallery from './components/PhotoGallery'
import Challenges from './components/Challenges'
import AdminPhotobooth from './components/AdminPhotobooth'
import InfoBanner from './components/InfoBanner'
import TabNavigation from './components/TabNavigation'
import RecentPhoto from './components/RecentPhoto'
import useFirebasePhotos from './hooks/useFirebasePhotos'
import usePhotoboothPhotos from './hooks/usePhotoboothPhotos'
import { combinePhotosIntoStrip } from './utils/photoStrip'

function App() {
  const { photos, loading, uploadPhoto, deletePhoto, clearAllPhotos, likePhoto, isUsingFirebase } = useFirebasePhotos()
  const {
    saturdayPhotos,
    sundayPhotos,
    loading: photoboothLoading,
    uploadPhoto: uploadPhotoboothPhoto,
    deletePhoto: deletePhotoboothPhoto,
    likePhoto: likePhotoboothPhoto,
    isUsingFirebase: isPhotoboothUsingFirebase
  } = usePhotoboothPhotos()
  const [activeTab, setActiveTab] = useState('photobooth')
  const [recentPhoto, setRecentPhoto] = useState(null)
  const [uploading, setUploading] = useState(false)
  const [activeChallenge, setActiveChallenge] = useState(null)
  const [showBanner, setShowBanner] = useState(() => {
    const dismissed = localStorage.getItem('infoBannerDismissed')
    return dismissed !== 'true'
  })
  const recentPhotoRef = useRef(null)

  const handlePhotoCapture = async (photoData, filter) => {
    // Don't upload immediately - just store for preview
    setRecentPhoto({
      id: Date.now(), // temporary ID
      dataUrl: photoData,
      filter: filter || 'none',
      challenge: activeChallenge,
      isPending: true // Flag to indicate it hasn't been saved yet
    })

    // Clear the challenge after capturing the photo
    setActiveChallenge(null)
  }

  // Auto-scroll to recent photo when it's set
  useEffect(() => {
    if (recentPhoto && recentPhotoRef.current) {
      setTimeout(() => {
        recentPhotoRef.current?.scrollIntoView({
          behavior: 'smooth',
          block: 'center'
        })
      }, 100)
    }
  }, [recentPhoto])

  const handleSaveRecentPhoto = async () => {
    if (!recentPhoto || !recentPhoto.isPending) return

    try {
      setUploading(true)

      // Upload to Firebase (or fallback to local storage) with challenge info
      const uploadedPhoto = await uploadPhoto(
        recentPhoto.dataUrl,
        recentPhoto.filter,
        recentPhoto.challenge
      )

      // Update recent photo with uploaded info
      setRecentPhoto({
        ...uploadedPhoto,
        dataUrl: recentPhoto.dataUrl
      })

      // Switch to gallery tab after successful save
      setActiveTab('gallery')
    } catch (error) {
      console.error('Error saving photo:', error)
    } finally {
      setUploading(false)
    }
  }

  const handleDeleteRecentPhoto = () => {
    // Just discard the preview without saving
    setRecentPhoto(null)
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

  const handleTakePhoto = (challenge = null) => {
    setActiveChallenge(challenge)
    setActiveTab('camera')
  }

  const handleLike = async (photoId, incrementValue) => {
    try {
      await likePhoto(photoId, incrementValue)
    } catch (error) {
      console.error('Error liking photo:', error)
    }
  }

  const handleUploadPhoto = async (photoDataUrl) => {
    try {
      // Apply photostrip styling to uploaded photo
      const stripData = await combinePhotosIntoStrip([photoDataUrl])

      // Upload to Firebase/local storage
      await uploadPhoto(stripData, 'none', null)

      console.log('Photo uploaded successfully')
    } catch (error) {
      console.error('Error uploading photo:', error)
    }
  }

  const handleAdminUploadPhoto = async (photoDataUrl, day, folder) => {
    try {
      // Upload original photo directly without processing to preserve quality
      await uploadPhotoboothPhoto(photoDataUrl, day, folder)

      console.log(`Photo uploaded successfully for ${day}/${folder}`)
    } catch (error) {
      console.error('Error uploading admin photo:', error)
    }
  }

  const handleDeletePhotoboothPhoto = async (photoId, day) => {
    try {
      await deletePhotoboothPhoto(photoId, day)
    } catch (error) {
      console.error('Error deleting photobooth photo:', error)
    }
  }

  const handleLikePhotoboothPhoto = async (photoId, day, incrementValue) => {
    try {
      await likePhotoboothPhoto(photoId, day, incrementValue)
    } catch (error) {
      console.error('Error liking photobooth photo:', error)
    }
  }

  const handleDismissBanner = () => {
    localStorage.setItem('infoBannerDismissed', 'true')
    setShowBanner(false)
  }

  // Switch to gallery when user returns to app while on camera tab
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden && activeTab === 'camera') {
        console.log('User returned to app on camera tab, switching to gallery...')
        setActiveTab('gallery')
      }
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange)
  }, [activeTab])

  // Scroll to top when switching to gallery or photobooth
  useEffect(() => {
    if (activeTab === 'gallery' || activeTab === 'photobooth') {
      window.scrollTo({ top: 0, behavior: 'smooth' })
    }
  }, [activeTab])

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
      {showBanner && activeTab === 'camera' && <InfoBanner onClose={handleDismissBanner} />}
      <main className="app-main">
        {activeTab === 'camera' && <Camera onCapture={handlePhotoCapture} challenge={activeChallenge} />}
        {activeTab === 'gallery' && (
          <PhotoGallery
            photos={photos}
            loading={loading}
            onDelete={handleDeletePhoto}
            onClearAll={handleClearAll}
            onLike={handleLike}
            onUpload={handleUploadPhoto}
            isUsingFirebase={isUsingFirebase}
          />
        )}
        {activeTab === 'photobooth' && (
          <AdminPhotobooth
            saturdayPhotos={saturdayPhotos}
            sundayPhotos={sundayPhotos}
            loading={photoboothLoading}
            onUpload={handleAdminUploadPhoto}
            onDelete={handleDeletePhotoboothPhoto}
            onLike={handleLikePhotoboothPhoto}
            isUsingFirebase={isPhotoboothUsingFirebase}
          />
        )}
        {activeTab === 'challenges' && <Challenges onTakePhoto={handleTakePhoto} />}
      </main>
      <RecentPhoto
        ref={recentPhotoRef}
        photo={recentPhoto}
        onDelete={handleDeleteRecentPhoto}
        onSave={handleSaveRecentPhoto}
        isUploading={uploading}
      />
      <TabNavigation activeTab={activeTab} onTabChange={setActiveTab} />
    </div>
  )
}

export default App
