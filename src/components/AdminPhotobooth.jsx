import { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import PhotoCard from './PhotoCard'
import { processAllExistingPhotos } from '../utils/processExistingPhotos'

function AdminPhotobooth({ saturdayPhotos, sundayPhotos, loading, onUpload, onDelete, onLike, isUsingFirebase }) {
  const [activeDay, setActiveDay] = useState('all')
  const [activeFolder, setActiveFolder] = useState('all')
  const [likedPhotos, setLikedPhotos] = useState(new Set())
  const [isProcessing, setIsProcessing] = useState(false)
  const [processingProgress, setProcessingProgress] = useState(null)
  const [processingResults, setProcessingResults] = useState(null)
  const [filtersExpanded, setFiltersExpanded] = useState(true)
  const [displayedCount, setDisplayedCount] = useState(30)
  const [isLoadingMore, setIsLoadingMore] = useState(false)
  const observerTarget = useRef(null)

  // Initialize randomSeed from localStorage or create new one
  const [randomSeed, setRandomSeed] = useState(() => {
    const stored = localStorage.getItem('photoboothRandomSeed')
    return stored ? parseInt(stored, 10) : Date.now()
  })

  // Store shuffled order to prevent re-shuffling when only likes change
  const shuffledOrderRef = useRef(null)

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
  // Only re-shuffle when randomSeed changes (which happens on filter change)
  if (activeDay === 'all' && activeFolder === 'all') {
    // Generate or retrieve shuffled order
    if (!shuffledOrderRef.current || shuffledOrderRef.current.seed !== randomSeed) {
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

      // Store the ID order
      const shuffledImages = shuffleArray(images)
      const shuffledVideos = shuffleArray(videos)
      const photoIdOrder = [...shuffledImages, ...shuffledVideos].map(p => p.id)

      shuffledOrderRef.current = { seed: randomSeed, photoIdOrder }
    }

    // Apply the stored order to current photos
    const orderMap = new Map(shuffledOrderRef.current.photoIdOrder.map((id, index) => [id, index]))
    currentPhotos = currentPhotos.slice().sort((a, b) => {
      const orderA = orderMap.get(a.id) ?? 999999
      const orderB = orderMap.get(b.id) ?? 999999
      return orderA - orderB
    })
  }

  // Get total count before pagination
  const totalPhotos = currentPhotos.length

  // Apply pagination - only show displayedCount photos
  const displayedPhotos = currentPhotos.slice(0, displayedCount)
  const hasMore = displayedCount < totalPhotos

  // Save randomSeed to localStorage whenever it changes
  useEffect(() => {
    if (randomSeed > 0) {
      localStorage.setItem('photoboothRandomSeed', randomSeed.toString())
    }
  }, [randomSeed])

  // Reset displayed count when filters change
  useEffect(() => {
    setDisplayedCount(30)
  }, [activeDay, activeFolder])

  // Load more photos when observer target is visible
  const loadMore = useCallback(() => {
    if (!hasMore || isLoadingMore) return

    setIsLoadingMore(true)
    // Simulate a small delay for smooth UX
    setTimeout(() => {
      setDisplayedCount(prev => Math.min(prev + 30, totalPhotos))
      setIsLoadingMore(false)
    }, 300)
  }, [hasMore, isLoadingMore, totalPhotos])

  // Intersection Observer for infinite scroll
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !loading) {
          loadMore()
        }
      },
      { threshold: 0.1 }
    )

    const currentTarget = observerTarget.current
    if (currentTarget) {
      observer.observe(currentTarget)
    }

    return () => {
      if (currentTarget) {
        observer.unobserve(currentTarget)
      }
    }
  }, [hasMore, loading, loadMore])

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

  const handleDelete = (photoId, day) => {
    if (onDelete) {
      onDelete(photoId, day)
    }
  }

  const handleLike = (photoId, incrementValue, day) => {
    if (onLike) {
      onLike(photoId, day, incrementValue)
    }
  }

  const handleShuffle = () => {
    const newSeed = Date.now()
    setRandomSeed(newSeed)
    shuffledOrderRef.current = null // Clear cached order
    setDisplayedCount(30) // Reset to top
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
            {loading ? 'Loading...' : `${totalPhotos} ${totalPhotos === 1 ? 'photo' : 'photos'}`}
            {!loading && activeDay === 'all' && activeFolder === 'all' && totalPhotos > 0 && (
              <button
                type="button"
                className="btn-shuffle"
                onClick={(e) => {
                  e.stopPropagation() // Prevent filter header click
                  handleShuffle()
                }}
                title="Shuffle photos"
              >
                🔀
              </button>
            )}
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

      {loading ? (
        <div className="admin-empty">
          <p>Pictures are still loading, please wait...</p>
          <div className="loading-spinner-large"></div>
        </div>
      ) : totalPhotos === 0 ? (
        <div className="admin-empty">
          <p>No photos available for {activeDay === 'saturday' ? 'Saturday' : 'Sunday'} in the {activeFolder} folder yet.</p>
          <p className="admin-empty-hint">Photos from the photobooth session will appear here.</p>
        </div>
      ) : (
        <>
          <div className="admin-gallery-grid">
            {displayedPhotos.map(photo => (
              <PhotoCard
                key={photo.id}
                photo={photo}
                onLike={(photoId, incrementValue) => handleLike(photoId, incrementValue, photo.day)}
                onDelete={(photoId) => handleDelete(photoId, photo.day)}
                isLiked={likedPhotos.has(photo.id)}
                onToggleLike={handleToggleLike}
              />
            ))}
          </div>

          {/* Infinite scroll observer target */}
          {hasMore && (
            <div ref={observerTarget} className="infinite-scroll-trigger">
              {isLoadingMore && (
                <div className="loading-more">
                  <div className="loading-spinner-small"></div>
                  <p>Loading more photos...</p>
                </div>
              )}
            </div>
          )}

          {/* Show count indicator when not all photos are displayed */}
          {!hasMore && displayedCount >= 30 && (
            <div className="all-photos-loaded">
              <p>All {totalPhotos} photos loaded</p>
            </div>
          )}
        </>
      )}

    </div>
  )
}

export default AdminPhotobooth
