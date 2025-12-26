import Camera from './components/Camera'
import PhotoGallery from './components/PhotoGallery'
import useLocalStorage from './hooks/useLocalStorage'

function App() {
  const [photos, setPhotos] = useLocalStorage('photobooth-photos', [])

  const handlePhotoCapture = (photoData, filter) => {
    const newPhoto = {
      id: Date.now(),
      dataUrl: photoData,
      timestamp: new Date().toISOString(),
      filter: filter || 'none'
    }
    setPhotos(prev => [newPhoto, ...prev])
  }

  const handleDeletePhoto = (id) => {
    setPhotos(prev => prev.filter(photo => photo.id !== id))
  }

  const handleClearAll = () => {
    if (window.confirm('Are you sure you want to delete all photos?')) {
      setPhotos([])
    }
  }

  return (
    <div className="app">
      <header className="app-header">
        <div className="wedding-title">
          <h1>Shahnila & Josh</h1>
          <p className="wedding-subtitle">Our Wedding Celebration</p>
          <p className="wedding-date">♥ [Wedding Date] ♥</p>
          <p style={{fontSize: '12px', color: '#FF69B4', marginTop: '10px'}}>v2.0 - Camera Debug Build</p>
        </div>
      </header>
      <main className="app-main">
        <Camera onCapture={handlePhotoCapture} />
        <PhotoGallery
          photos={photos}
          onDelete={handleDeletePhoto}
          onClearAll={handleClearAll}
        />
      </main>
    </div>
  )
}

export default App
