import { useState } from 'react'
import Camera from './components/Camera'
import PhotoGallery from './components/PhotoGallery'
import Challenges from './components/Challenges'
import InfoBanner from './components/InfoBanner'
import TabNavigation from './components/TabNavigation'
import RecentPhoto from './components/RecentPhoto'
import useLocalStorage from './hooks/useLocalStorage'

function App() {
  const [photos, setPhotos] = useLocalStorage('photobooth-photos', [])
  const [activeTab, setActiveTab] = useState('camera')
  const [recentPhoto, setRecentPhoto] = useState(null)

  const handlePhotoCapture = (photoData, filter) => {
    const newPhoto = {
      id: Date.now(),
      dataUrl: photoData,
      timestamp: new Date().toISOString(),
      filter: filter || 'none'
    }
    setPhotos(prev => [newPhoto, ...prev])
    setRecentPhoto(newPhoto)
  }

  const handleDeletePhoto = (id) => {
    setPhotos(prev => prev.filter(photo => photo.id !== id))
    // Clear recent photo if it's the one being deleted
    if (recentPhoto && recentPhoto.id === id) {
      setRecentPhoto(null)
    }
  }

  const handleClearAll = () => {
    if (window.confirm('Are you sure you want to delete all photos?')) {
      setPhotos([])
      setRecentPhoto(null)
    }
  }

  return (
    <div className="app">
      <header className="app-header">
        <div className="wedding-title">
          <h1>Shahnila & Josh</h1>
          <p className="wedding-subtitle">Our Wedding Celebration</p>
          <p className="wedding-date">♥ [Wedding Date] ♥</p>
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
        {activeTab === 'challenges' && <Challenges />}
      </main>
      <RecentPhoto photo={recentPhoto} onDelete={handleDeletePhoto} />
      <TabNavigation activeTab={activeTab} onTabChange={setActiveTab} />
    </div>
  )
}

export default App
