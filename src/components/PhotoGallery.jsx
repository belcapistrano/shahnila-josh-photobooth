import { useRef, useState } from 'react'
import PhotoCard from './PhotoCard'
import useLikedPhotos from '../hooks/useLikedPhotos'

function PhotoGallery({ photos, loading, onDelete, onClearAll, onLike, onUpload, isUsingFirebase }) {
  const { isPhotoLiked, toggleLike } = useLikedPhotos()
  const fileInputRef = useRef(null)
  const [uploading, setUploading] = useState(false)

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
                await onUpload(dataUrl)
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
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
  }

  // Show loading skeletons
  if (loading) {
    return (
      <div className="photo-gallery">
        <div className="gallery-header">
          <div className="gallery-header-left">
            <h2>Gallery</h2>
            <div className={`storage-indicator ${isUsingFirebase ? 'cloud' : 'local'}`}>
              <span className="storage-icon">{isUsingFirebase ? '☁️' : '💾'}</span>
              <span className="storage-text">Loading...</span>
            </div>
          </div>
        </div>
        <div className="gallery-grid">
          {[...Array(6)].map((_, index) => (
            <div key={index} className="photo-card-skeleton">
              <div className="skeleton-image"></div>
              <div className="skeleton-footer">
                <div className="skeleton-text skeleton-text-short"></div>
                <div className="skeleton-text skeleton-text-long"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  if (photos.length === 0) {
    return (
      <div className="gallery-empty">
        <div className="upload-instructions">
          <h3>📸 Share Your Memories!</h3>
          <p>Help us capture every special moment of this celebration!</p>
          <div className="instructions-steps">
            <div className="instruction-step">
              <span className="step-number">1</span>
              <span className="step-text">Click "Upload Photo" below</span>
            </div>
            <div className="instruction-step">
              <span className="step-number">2</span>
              <span className="step-text">Select one or more photos from your device</span>
            </div>
            <div className="instruction-step">
              <span className="step-number">3</span>
              <span className="step-text">Your photos will be beautifully framed and added to the gallery!</span>
            </div>
          </div>
        </div>
        <button className="btn-upload-empty" onClick={handleUploadClick} disabled={uploading}>
          {uploading ? 'Uploading...' : '📤 Upload Photo'}
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
    )
  }

  return (
    <div className="photo-gallery">
      <div className="upload-info-banner">
        <div className="upload-info-content">
          <span className="upload-info-icon">📸</span>
          <p>
            <strong>Share your photos!</strong> Click the Upload button to add your favorite moments from the celebration.
            All photos will be beautifully framed with our wedding details.
          </p>
        </div>
      </div>
      <div className="gallery-header">
        <div className="gallery-header-left">
          <h2>Gallery ({photos.length})</h2>
          <div className={`storage-indicator ${isUsingFirebase ? 'cloud' : 'local'}`}>
            <span className="storage-icon">{isUsingFirebase ? '☁️' : '💾'}</span>
            <span className="storage-text">{isUsingFirebase ? 'Cloud Storage' : 'Local Storage'}</span>
          </div>
        </div>
        <button className="btn-upload" onClick={handleUploadClick} disabled={uploading}>
          {uploading ? 'Uploading...' : '📤 Upload'}
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
      <div className="gallery-grid">
        {photos.map(photo => (
          <PhotoCard
            key={photo.id}
            photo={photo}
            onLike={onLike}
            onDelete={onDelete}
            isLiked={isPhotoLiked(photo.id)}
            onToggleLike={toggleLike}
          />
        ))}
      </div>
    </div>
  )
}

export default PhotoGallery
