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
      <div className="admin-header-clean">
        <h2>Photobooth Pictures</h2>
        <div className="photographer-credit-inline">
          <span className="photographer-text">
            Photography by <strong>Ray Tomaro</strong> (
            <a
              href="http://www.raytomaro.com"
              target="_blank"
              rel="noopener noreferrer"
              className="photographer-link"
            >
              Website
            </a>
            {' | '}
            <a
              href="http://www.facebook.com/rtmediaphotovideo.com"
              target="_blank"
              rel="noopener noreferrer"
              className="photographer-link"
            >
              Facebook
            </a>
            )
          </span>
        </div>
      </div>

      {/* Combined horizontal filter bar */}
      <div className="filter-bar">
        <div className="filter-group">
          <label className="filter-label">Day:</label>
          <div className="filter-buttons">
            <button
              className={`filter-btn ${activeDay === 'saturday' ? 'active' : ''}`}
              onClick={() => setActiveDay('saturday')}
            >
              Saturday, Dec 27
            </button>
            <button
              className={`filter-btn ${activeDay === 'sunday' ? 'active' : ''}`}
              onClick={() => setActiveDay('sunday')}
            >
              Sunday, Dec 28
            </button>
          </div>
        </div>

        <div className="filter-divider"></div>

        <div className="filter-group">
          <label className="filter-label">Type:</label>
          <div className="filter-buttons">
            <button
              className={`filter-btn ${activeFolder === 'original' ? 'active' : ''}`}
              onClick={() => setActiveFolder('original')}
            >
              Original
            </button>
            <button
              className={`filter-btn ${activeFolder === 'animated' ? 'active' : ''}`}
              onClick={() => setActiveFolder('animated')}
            >
              Animated
            </button>
            <button
              className={`filter-btn ${activeFolder === 'prints' ? 'active' : ''}`}
              onClick={() => setActiveFolder('prints')}
            >
              Prints
            </button>
          </div>
        </div>

        <div className="photo-count-display">
          {currentPhotos.length} {currentPhotos.length === 1 ? 'photo' : 'photos'}
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
