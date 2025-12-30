import { useState } from 'react'
import PhotoCard from './PhotoCard'
import { processAllExistingPhotos } from '../utils/processExistingPhotos'

function AdminPhotobooth({ saturdayPhotos, sundayPhotos, onUpload, onDelete, onLike, isUsingFirebase }) {
  const [activeDay, setActiveDay] = useState('all')
  const [activeFolder, setActiveFolder] = useState('all')
  const [likedPhotos, setLikedPhotos] = useState(new Set())
  const [isProcessing, setIsProcessing] = useState(false)
  const [processingProgress, setProcessingProgress] = useState(null)
  const [processingResults, setProcessingResults] = useState(null)
  const [filtersExpanded, setFiltersExpanded] = useState(false)

  // Combine all photos
  const allPhotos = [...saturdayPhotos, ...sundayPhotos]

  // Filter by day
  let dayFilteredPhotos = allPhotos
  if (activeDay === 'saturday') {
    dayFilteredPhotos = saturdayPhotos
  } else if (activeDay === 'sunday') {
    dayFilteredPhotos = sundayPhotos
  }

  // Filter by folder
  let currentPhotos = activeFolder === 'all'
    ? dayFilteredPhotos
    : dayFilteredPhotos.filter(photo => photo.folder === activeFolder)

  // When showing all photos, randomize order and prioritize images over videos
  if (activeDay === 'all' && activeFolder === 'all') {
    // Separate photos and videos
    const images = currentPhotos.filter(photo => !photo.isVideo)
    const videos = currentPhotos.filter(photo => photo.isVideo)

    // Randomize each group
    const shuffleArray = (array) => {
      const shuffled = [...array]
      for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
      }
      return shuffled
    }

    // Combine: images first, then videos
    currentPhotos = [...shuffleArray(images), ...shuffleArray(videos)]
  }

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
          <div className="photographer-main">
            Photography by <strong>Ray Tomaro</strong>
          </div>
          <div className="photographer-links">
            <a
              href="http://www.raytomaro.com"
              target="_blank"
              rel="noopener noreferrer"
              className="photographer-link"
            >
              Website
            </a>
            <span className="link-separator">·</span>
            <a
              href="http://www.facebook.com/rtmediaphotovideo.com"
              target="_blank"
              rel="noopener noreferrer"
              className="photographer-link"
            >
              Facebook
            </a>
          </div>
        </div>
      </div>

      {/* Photographer credit - Mobile only */}
      <div className="photographer-credit-mobile">
        <div className="photographer-main">
          Photography by <strong>Ray Tomaro</strong>
        </div>
        <div className="photographer-links">
          <a
            href="http://www.raytomaro.com"
            target="_blank"
            rel="noopener noreferrer"
            className="photographer-link"
          >
            Website
          </a>
          <span className="link-separator">·</span>
          <a
            href="http://www.facebook.com/rtmediaphotovideo.com"
            target="_blank"
            rel="noopener noreferrer"
            className="photographer-link"
          >
            Facebook
          </a>
        </div>
      </div>

      {/* Filter section */}
      <div className="filter-section">
        <div className={`filter-header ${filtersExpanded ? 'expanded' : ''}`} onClick={() => setFiltersExpanded(!filtersExpanded)}>
          <div className="filter-header-left">
            <h3>Filters</h3>
            <button className="filter-toggle-btn">
              {filtersExpanded ? '▲' : '▼'}
            </button>
          </div>
          <div className="photo-count">
            {currentPhotos.length} {currentPhotos.length === 1 ? 'photo' : 'photos'}
          </div>
        </div>

        <div className={`filter-chips-container ${filtersExpanded ? 'expanded' : 'collapsed'}`}>
          <div className="filter-chip-group">
            <span className="filter-chip-label">Day:</span>
            <button
              className={`filter-chip ${activeDay === 'all' ? 'active' : ''}`}
              onClick={() => setActiveDay('all')}
            >
              All
            </button>
            <button
              className={`filter-chip ${activeDay === 'saturday' ? 'active' : ''}`}
              onClick={() => setActiveDay('saturday')}
            >
              Saturday
            </button>
            <button
              className={`filter-chip ${activeDay === 'sunday' ? 'active' : ''}`}
              onClick={() => setActiveDay('sunday')}
            >
              Sunday
            </button>
          </div>

          <div className="filter-chip-group">
            <span className="filter-chip-label">Type:</span>
            <button
              className={`filter-chip ${activeFolder === 'all' ? 'active' : ''}`}
              onClick={() => setActiveFolder('all')}
            >
              All
            </button>
            <button
              className={`filter-chip ${activeFolder === 'original' ? 'active' : ''}`}
              onClick={() => setActiveFolder('original')}
            >
              Original
            </button>
            <button
              className={`filter-chip ${activeFolder === 'animated' ? 'active' : ''}`}
              onClick={() => setActiveFolder('animated')}
            >
              Animated
            </button>
            <button
              className={`filter-chip ${activeFolder === 'prints' ? 'active' : ''}`}
              onClick={() => setActiveFolder('prints')}
            >
              Prints
            </button>
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
