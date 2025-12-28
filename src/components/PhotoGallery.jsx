import { useRef, useState } from 'react'
import PhotoCard from './PhotoCard'
import useLikedPhotos from '../hooks/useLikedPhotos'

function PhotoGallery({ photos, onDelete, onClearAll, onLike, onUpload, isUsingFirebase }) {
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

  if (photos.length === 0) {
    return (
      <div className="gallery-empty">
        <p>No photos yet. Capture your first photo or upload one!</p>
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
