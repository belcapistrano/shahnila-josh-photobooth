import { useRef, useState, useEffect } from 'react'
import PhotoCard from './PhotoCard'
import Lightbox from './Lightbox'
import Slideshow from './Slideshow'
import useLikedPhotos from '../hooks/useLikedPhotos'

function PhotoGallery({ photos, loading, onDelete, onClearAll, onLike, onUpload, isUsingFirebase }) {
  const { isPhotoLiked, toggleLike } = useLikedPhotos()
  const fileInputRef = useRef(null)
  const [uploading, setUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState({ current: 0, total: 0 })
  const [simulatedPercent, setSimulatedPercent] = useState(0)
  const [mediaFilter, setMediaFilter] = useState('all') // 'all', 'photos', 'videos'
  const [lightboxPhoto, setLightboxPhoto] = useState(null)
  const [showSlideshow, setShowSlideshow] = useState(false)
  const progressIntervalRef = useRef(null)

  // Cleanup interval on unmount
  useEffect(() => {
    return () => {
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current)
      }
    }
  }, [])

  const handleUploadClick = () => {
    fileInputRef.current?.click()
  }

  // Filter photos based on media type
  const filteredPhotos = photos.filter(photo => {
    if (mediaFilter === 'all') return true
    if (mediaFilter === 'photos') return !photo.isVideo
    if (mediaFilter === 'videos') return photo.isVideo
    return true
  })

  const handleFileSelect = async (event) => {
    const files = event.target.files
    if (!files || files.length === 0) return

    const fileArray = Array.from(files).filter(
      file => file.type.startsWith('image/') || file.type.startsWith('video/')
    )

    if (fileArray.length === 0) return

    setUploading(true)

    // Use a small delay to ensure the modal renders before we start uploading
    await new Promise(resolve => setTimeout(resolve, 100))

    setUploadProgress({ current: 0, total: fileArray.length })

    try {
      for (let i = 0; i < fileArray.length; i++) {
        const file = fileArray[i]

        try {
          console.log(`Uploading file ${i + 1} of ${fileArray.length}: ${file.name}`)

          // Update progress before starting upload
          setUploadProgress({ current: i, total: fileArray.length })

          // Start simulated progress for this file
          setSimulatedPercent(0)
          let currentPercent = 0

          // Clear any existing interval
          if (progressIntervalRef.current) {
            clearInterval(progressIntervalRef.current)
          }

          // Update progress every 2 seconds
          progressIntervalRef.current = setInterval(() => {
            currentPercent += 10
            if (currentPercent <= 90) { // Cap at 90% until upload completes
              setSimulatedPercent(currentPercent)
            }
          }, 2000)

          // For videos, pass the File object directly (more efficient for large files)
          // For images, convert to data URL for processing
          if (file.type.startsWith('video/')) {
            console.log('Processing video file...')
            if (onUpload) {
              await onUpload(file, true) // Pass file directly with isFileObject flag
            }
          } else {
            console.log('Processing image file...')
            const dataUrl = await new Promise((resolve, reject) => {
              const reader = new FileReader()
              reader.onload = (e) => resolve(e.target.result)
              reader.onerror = reject
              reader.readAsDataURL(file)
            })

            if (onUpload) {
              await onUpload(dataUrl, false)
            }
          }

          // Clear interval and set to 100%
          if (progressIntervalRef.current) {
            clearInterval(progressIntervalRef.current)
          }
          setSimulatedPercent(100)

          console.log(`Completed uploading file ${i + 1} of ${fileArray.length}`)
          // Update progress after completing upload
          setUploadProgress({ current: i + 1, total: fileArray.length })

          // Small delay to allow UI to update
          await new Promise(resolve => setTimeout(resolve, 300))
        } catch (error) {
          console.error('Error uploading file:', error)
          // Clear interval on error
          if (progressIntervalRef.current) {
            clearInterval(progressIntervalRef.current)
          }
          // Continue with next file even if one fails
        }
      }
    } catch (error) {
      console.error('Error uploading files:', error)
    } finally {
      // Clear any remaining interval
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current)
      }
      setUploading(false)
      setUploadProgress({ current: 0, total: 0 })
      setSimulatedPercent(0)
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
  }

  const handlePhotoClick = (photo) => {
    setLightboxPhoto(photo)
  }

  const handleCloseLightbox = () => {
    setLightboxPhoto(null)
  }

  const handleNavigateLightbox = (newPhoto) => {
    setLightboxPhoto(newPhoto)
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
              <span className="step-text">Click "Upload" below</span>
            </div>
            <div className="instruction-step">
              <span className="step-number">2</span>
              <span className="step-text">Select one or more photos or videos from your device</span>
            </div>
            <div className="instruction-step">
              <span className="step-number">3</span>
              <span className="step-text">Your media will be optimized and added to the gallery! Download anytime to get the original high-quality version.</span>
            </div>
          </div>
        </div>
        <button className="btn-upload-empty" onClick={handleUploadClick} disabled={uploading}>
          {uploading ? 'Uploading...' : '📤 Upload'}
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*,video/mp4,video/quicktime"
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
            <strong>Share your photos & videos!</strong>
          </p>
        </div>
        <button className="btn-upload-banner" onClick={handleUploadClick} disabled={uploading}>
          {uploading ? 'Uploading...' : '📤 Upload'}
        </button>
      </div>
      <div className="gallery-header">
        <div className="gallery-header-left">
          <h2>Gallery ({filteredPhotos.length})</h2>
          {filteredPhotos.length > 0 && (
            <button className="btn-slideshow" onClick={() => setShowSlideshow(true)}>
              ▶️ Slideshow
            </button>
          )}
        </div>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*,video/mp4,video/quicktime"
          multiple
          style={{ display: 'none' }}
          onChange={handleFileSelect}
        />
      </div>

      {/* Media Filter */}
      <div className="media-filter">
        <button
          className={`filter-btn ${mediaFilter === 'all' ? 'active' : ''}`}
          onClick={() => setMediaFilter('all')}
        >
          All ({photos.length})
        </button>
        <button
          className={`filter-btn ${mediaFilter === 'photos' ? 'active' : ''}`}
          onClick={() => setMediaFilter('photos')}
        >
          📸 Photos ({photos.filter(p => !p.isVideo).length})
        </button>
        <button
          className={`filter-btn ${mediaFilter === 'videos' ? 'active' : ''}`}
          onClick={() => setMediaFilter('videos')}
        >
          🎥 Videos ({photos.filter(p => p.isVideo).length})
        </button>
      </div>
      <div className="gallery-grid">
        {filteredPhotos.length > 0 ? (
          filteredPhotos.map(photo => (
            <PhotoCard
              key={photo.id}
              photo={photo}
              onLike={onLike}
              onDelete={onDelete}
              isLiked={isPhotoLiked(photo.id)}
              onToggleLike={toggleLike}
              onClick={handlePhotoClick}
            />
          ))
        ) : (
          <div className="no-media-message">
            <p>No {mediaFilter === 'photos' ? 'photos' : 'videos'} found.</p>
            <p className="no-media-subtitle">Try uploading some or switch to a different filter.</p>
          </div>
        )}
      </div>

      {/* Upload Progress Indicator */}
      {uploading && uploadProgress.total > 0 && (
        <div className="upload-progress-overlay">
          <div className="upload-progress-modal">
            <div className="upload-progress-icon">📤</div>
            <h3>Uploading Media</h3>
            <p className="upload-progress-text">
              File {uploadProgress.current + 1} of {uploadProgress.total}
            </p>
            <div className="upload-progress-bar-container">
              <div
                className="upload-progress-bar"
                style={{ width: `${simulatedPercent}%` }}
              />
            </div>
            <p className="upload-progress-percent">
              {simulatedPercent}%
            </p>
          </div>
        </div>
      )}

      {/* Lightbox */}
      {lightboxPhoto && (
        <Lightbox
          photo={lightboxPhoto}
          photos={filteredPhotos}
          onClose={handleCloseLightbox}
          onNavigate={handleNavigateLightbox}
        />
      )}

      {/* Slideshow */}
      {showSlideshow && (
        <Slideshow
          photos={filteredPhotos}
          onClose={() => setShowSlideshow(false)}
        />
      )}
    </div>
  )
}

export default PhotoGallery
