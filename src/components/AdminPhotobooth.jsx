import { useState, useRef } from 'react'
import PhotoCard from './PhotoCard'

function AdminPhotobooth({ saturdayPhotos, sundayPhotos, onUpload, onDelete, onLike, isUsingFirebase }) {
  const [activeDay, setActiveDay] = useState('saturday')
  const [activeFolder, setActiveFolder] = useState('original')
  const [uploading, setUploading] = useState(false)
  const fileInputRef = useRef(null)
  const [likedPhotos, setLikedPhotos] = useState(new Set())

  const handleUploadClick = () => {
    fileInputRef.current?.click()
  }

  const handleFileSelect = async (event) => {
    const files = event.target.files
    if (!files || files.length === 0) return

    setUploading(true)
    try {
      const uploadPromises = Array.from(files).map(file => {
        return new Promise((resolve, reject) => {
          if (!file.type.startsWith('image/')) {
            resolve()
            return
          }

          const reader = new FileReader()
          reader.onload = async (e) => {
            try {
              const dataUrl = e.target.result
              if (onUpload) {
                await onUpload(dataUrl, activeDay, activeFolder)
              }
              resolve()
            } catch (error) {
              reject(error)
            }
          }
          reader.onerror = reject
          reader.readAsDataURL(file)
        })
      })

      await Promise.all(uploadPromises)
    } catch (error) {
      console.error('Error uploading files:', error)
    } finally {
      setUploading(false)
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
  }

  const allDayPhotos = activeDay === 'saturday' ? saturdayPhotos : sundayPhotos
  const currentPhotos = allDayPhotos.filter(photo => photo.folder === activeFolder)

  const handleToggleLike = (photoId) => {
    const newLikedPhotos = new Set(likedPhotos)
    const isLiked = newLikedPhotos.has(photoId)

    if (isLiked) {
      newLikedPhotos.delete(photoId)
    } else {
      newLikedPhotos.add(photoId)
    }

    setLikedPhotos(newLikedPhotos)
    return !isLiked
  }

  const handleDelete = (photoId) => {
    if (onDelete) {
      onDelete(photoId, activeDay)
    }
  }

  const handleLike = (photoId, incrementValue) => {
    if (onLike) {
      onLike(photoId, activeDay, incrementValue)
    }
  }

  return (
    <div className="admin-photobooth">
      <div className="admin-header">
        <h2>Photobooth Pictures</h2>
        <p className="admin-subtitle">Upload photos from the physical photobooth sessions</p>
      </div>

      <div className="day-tabs">
        <button
          className={`day-tab ${activeDay === 'saturday' ? 'active' : ''}`}
          onClick={() => setActiveDay('saturday')}
        >
          <span className="day-icon">📅</span>
          <div className="day-info">
            <span className="day-name">Saturday</span>
            <span className="day-date">December 27, 2025</span>
          </div>
          <span className="photo-count">{saturdayPhotos.length}</span>
        </button>
        <button
          className={`day-tab ${activeDay === 'sunday' ? 'active' : ''}`}
          onClick={() => setActiveDay('sunday')}
        >
          <span className="day-icon">📅</span>
          <div className="day-info">
            <span className="day-name">Sunday</span>
            <span className="day-date">December 28, 2025</span>
          </div>
          <span className="photo-count">{sundayPhotos.length}</span>
        </button>
      </div>

      <div className="folder-selector">
        <button
          className={`folder-option ${activeFolder === 'original' ? 'active' : ''}`}
          onClick={() => setActiveFolder('original')}
        >
          <span className="folder-icon">📁</span>
          <span className="folder-name">Original</span>
        </button>
        <button
          className={`folder-option ${activeFolder === 'animated' ? 'active' : ''}`}
          onClick={() => setActiveFolder('animated')}
        >
          <span className="folder-icon">🎬</span>
          <span className="folder-name">Animated</span>
        </button>
        <button
          className={`folder-option ${activeFolder === 'prints' ? 'active' : ''}`}
          onClick={() => setActiveFolder('prints')}
        >
          <span className="folder-icon">🖨️</span>
          <span className="folder-name">Prints</span>
        </button>
      </div>

      <div className="admin-upload-section">
        <button
          className="btn-admin-upload"
          onClick={handleUploadClick}
          disabled={uploading}
        >
          {uploading ? 'Uploading...' : `📤 Upload to ${activeFolder.charAt(0).toUpperCase() + activeFolder.slice(1)}`}
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          multiple
          style={{ display: 'none' }}
          onChange={handleFileSelect}
        />
      </div>

      {currentPhotos.length === 0 ? (
        <div className="admin-empty">
          <p>No photos uploaded for {activeDay === 'saturday' ? 'Saturday' : 'Sunday'} yet.</p>
          <p className="admin-empty-hint">Click the upload button to add photos from the photobooth session.</p>
        </div>
      ) : (
        <div className="admin-gallery-grid">
          {currentPhotos.map(photo => (
            <PhotoCard
              key={photo.id}
              photo={photo}
              onLike={handleLike}
              onDelete={handleDelete}
              isLiked={likedPhotos.has(photo.id)}
              onToggleLike={handleToggleLike}
            />
          ))}
        </div>
      )}
    </div>
  )
}

export default AdminPhotobooth
