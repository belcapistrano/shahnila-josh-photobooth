import { useState } from 'react'
import PhotoCard from './PhotoCard'
import { processAllExistingPhotos } from '../utils/processExistingPhotos'

function AdminPhotobooth({ saturdayPhotos, sundayPhotos, onUpload, onDelete, onLike, isUsingFirebase }) {
  const [activeDay, setActiveDay] = useState('saturday')
  const [activeFolder, setActiveFolder] = useState('original')
  const [likedPhotos, setLikedPhotos] = useState(new Set())
  const [isProcessing, setIsProcessing] = useState(false)
  const [processingProgress, setProcessingProgress] = useState(null)
  const [processingResults, setProcessingResults] = useState(null)

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

  const handleProcessExistingPhotos = async () => {
    if (!isUsingFirebase) {
      alert('This feature requires Firebase to be configured.')
      return
    }

    if (!window.confirm('This will process all existing photos to generate thumbnails and compressed versions. This may take several minutes. Continue?')) {
      return
    }

    setIsProcessing(true)
    setProcessingProgress({ stage: 'starting' })
    setProcessingResults(null)

    try {
      const results = await processAllExistingPhotos((progress) => {
        setProcessingProgress(progress)
      })

      setProcessingResults(results)
      alert('Photo processing completed! Check the console for details.')
      console.log('Processing results:', results)
    } catch (error) {
      console.error('Error processing photos:', error)
      alert(`Error processing photos: ${error.message}`)
    } finally {
      setIsProcessing(false)
      setProcessingProgress(null)
    }
  }

  return (
    <div className="admin-photobooth">
      <div className="admin-header">
        <h2>Photobooth Pictures</h2>
        <div className="photographer-credit-header">
          <div className="photographer-info-inline">
            <span className="camera-icon-small">📸</span>
            <p className="photographer-byline">
              Photography by <strong>Ray Tomaro</strong> - Professional Photographer
            </p>
          </div>
          <div className="photographer-links-compact">
            <a
              href="http://www.raytomaro.com"
              target="_blank"
              rel="noopener noreferrer"
              className="photographer-link-small website"
              title="Visit Ray Tomaro's Website"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10"></circle>
                <line x1="2" y1="12" x2="22" y2="12"></line>
                <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"></path>
              </svg>
              Website
            </a>
            <a
              href="http://www.facebook.com/rtmediaphotovideo.com"
              target="_blank"
              rel="noopener noreferrer"
              className="photographer-link-small facebook"
              title="Visit Ray Tomaro's Facebook Page"
            >
              <svg viewBox="0 0 24 24" fill="currentColor">
                <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
              </svg>
              Facebook
            </a>
          </div>
        </div>
      </div>

      {/* Photo Processing Utility - Hidden */}
      {false && isUsingFirebase && (
        <div className="photo-processing-section">
          <button
            onClick={handleProcessExistingPhotos}
            disabled={isProcessing}
            className="btn-process-photos"
          >
            {isProcessing ? '⚙️ Processing...' : '⚡ Optimize Existing Photos'}
          </button>
          {processingProgress && (
            <div className="processing-progress">
              {processingProgress.collection && (
                <>
                  <div className="progress-text">
                    📦 <strong>{processingProgress.collection}</strong>: Photo {processingProgress.current || 0}/{processingProgress.total || 0}
                  </div>
                  {processingProgress.fileName && (
                    <div className="progress-detail">
                      {processingProgress.status === 'downloading' && '⬇️ Downloading'}
                      {processingProgress.status === 'processing' && '⚙️ Processing'}
                      {processingProgress.status === 'uploading' && '⬆️ Uploading'}
                      {processingProgress.status === 'updating' && '💾 Updating'}
                      {processingProgress.status === 'completed' && '✅ Completed'}
                      {processingProgress.status === 'error' && '❌ Error'}
                      {processingProgress.status === 'skipped' && `⏭️ Skipped (${processingProgress.reason})`}
                      {' - '}
                      <span className="file-name">{processingProgress.fileName.split('/').pop()}</span>
                    </div>
                  )}
                  <div className="progress-bar-container">
                    <div
                      className="progress-bar-fill"
                      style={{ width: `${((processingProgress.current || 0) / (processingProgress.total || 1)) * 100}%` }}
                    ></div>
                  </div>
                </>
              )}
            </div>
          )}
          {processingResults && (
            <div className="processing-results">
              <h4>Processing Complete!</h4>
              {Object.entries(processingResults).map(([collection, results]) => (
                <div key={collection} className="result-item">
                  <strong>{collection}:</strong>
                  {results.error ? (
                    <span className="error"> Error: {results.error}</span>
                  ) : (
                    <span> ✅ {results.processed} processed, ⏭️ {results.skipped} skipped, ❌ {results.errors} errors</span>
                  )}
                </div>
              ))}
              <button
                onClick={() => setProcessingResults(null)}
                className="btn-dismiss-results"
              >
                Dismiss
              </button>
            </div>
          )}
        </div>
      )}

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

      {currentPhotos.length === 0 ? (
        <div className="admin-empty">
          <p>No photos available for {activeDay === 'saturday' ? 'Saturday' : 'Sunday'} in the {activeFolder} folder yet.</p>
          <p className="admin-empty-hint">Photos from the photobooth session will appear here.</p>
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
