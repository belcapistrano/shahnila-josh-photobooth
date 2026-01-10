import { useState, useEffect, useCallback, useRef, useMemo } from 'react'
import Lightbox from './Lightbox'
import Slideshow from './Slideshow'
import ProgressiveImage from './ProgressiveImage'

function PhotoTileView({ galleryPhotos, saturdayPhotos, sundayPhotos, loading, onUpdateGalleryPhotoDate, onUpdatePhotoboothPhotoDate, onDeleteGalleryPhoto, onDeletePhotoboothPhoto, onUpload }) {
  // Detect mobile device and optimize initial load
  const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent)
  const initialLoadCount = isMobile ? 20 : 36 // Increased initial load for better preloading
  const loadMoreCount = isMobile ? 15 : 24 // Increased load more for smoother scrolling

  const [activeDate, setActiveDate] = useState('all')
  const [sortOrder, setSortOrder] = useState('newest') // 'newest' or 'oldest'
  const [isShuffled, setIsShuffled] = useState(false)
  const [shuffleSeed, setShuffleSeed] = useState(0) // Changes each shuffle to trigger re-randomization
  const [viewMode, setViewMode] = useState('tiles') // 'tiles' or 'list'
  const [lightboxPhoto, setLightboxPhoto] = useState(null)
  const [showSlideshow, setShowSlideshow] = useState(false)
  const [displayedCount, setDisplayedCount] = useState(initialLoadCount)
  const [isLoadingMore, setIsLoadingMore] = useState(false)
  const [activeDatePicker, setActiveDatePicker] = useState(null) // Track which tile's date picker is open
  const [uploading, setUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState({ current: 0, total: 0 })
  const [simulatedPercent, setSimulatedPercent] = useState(0)
  const observerTarget = useRef(null)
  const fileInputRef = useRef(null)
  const progressIntervalRef = useRef(null)

  // Memoize photo tagging and combining to avoid recalculation on every render
  const allPhotos = useMemo(() => {
    const taggedGalleryPhotos = galleryPhotos.map(photo => ({
      ...photo,
      source: 'gallery'
    }))

    const taggedSaturdayPhotos = saturdayPhotos.map(photo => ({
      ...photo,
      source: 'photobooth'
    }))

    const taggedSundayPhotos = sundayPhotos.map(photo => ({
      ...photo,
      source: 'photobooth'
    }))

    return [...taggedGalleryPhotos, ...taggedSaturdayPhotos, ...taggedSundayPhotos]
  }, [galleryPhotos, saturdayPhotos, sundayPhotos])

  // Get date string from photoDate, creationDate or timestamp (YYYY-MM-DD format for comparison)
  const getDateString = (photo) => {
    // For photobooth photos: use photoDate (assigned based on folder: 12/27 or 12/28)
    // For gallery photos: use creationDate (actual file date) or timestamp (upload date)
    const dateValue = photo.photoDate || photo.creationDate || photo.timestamp
    if (!dateValue) return null

    const date = dateValue.seconds
      ? new Date(dateValue.seconds * 1000)
      : new Date(dateValue)

    return date.toISOString().split('T')[0] // YYYY-MM-DD
  }

  // Memoize unique dates calculation
  const uniqueDates = useMemo(() => {
    return [...new Set(
      allPhotos
        .map(photo => getDateString(photo))
        .filter(date => date !== null)
    )].sort().reverse() // Sort newest to oldest
  }, [allPhotos])

  // Memoize photo processing (filter, sort, alternate, shuffle) to optimize rendering
  const { currentPhotos, totalPhotos } = useMemo(() => {
    // Filter by date
    let photos = allPhotos
    if (activeDate !== 'all') {
      photos = allPhotos.filter(photo => getDateString(photo) === activeDate)
    }

    // Sort photos by date (using photoDate for photobooth, creationDate for gallery, fallback to timestamp)
    photos = photos.slice().sort((a, b) => {
      const dateA = a.photoDate || a.creationDate || a.timestamp
      const dateB = b.photoDate || b.creationDate || b.timestamp

      const timeA = dateA?.seconds ? dateA.seconds * 1000 : new Date(dateA || 0).getTime()
      const timeB = dateB?.seconds ? dateB.seconds * 1000 : new Date(dateB || 0).getTime()

      if (sortOrder === 'newest') {
        return timeB - timeA // Newest first
      } else {
        return timeA - timeB // Oldest first
      }
    })

    // Alternate between regular photos and animated videos for better visual variety
    const animatedVideos = photos.filter(photo => {
      const isVideo = photo.isVideo || photo.fileType === '.mp4'
      return isVideo && photo.folder === 'animated'
    })
    const regularContent = photos.filter(photo => {
      const isVideo = photo.isVideo || photo.fileType === '.mp4'
      return !(isVideo && photo.folder === 'animated')
    })

    // Interleave animated videos with regular content
    const alternatedPhotos = []
    const maxLength = Math.max(regularContent.length, animatedVideos.length)
    for (let i = 0; i < maxLength; i++) {
      if (i < regularContent.length) {
        alternatedPhotos.push(regularContent[i])
      }
      if (i < animatedVideos.length) {
        alternatedPhotos.push(animatedVideos[i])
      }
    }

    photos = alternatedPhotos

    // Apply shuffle if enabled
    if (isShuffled) {
      // Fisher-Yates shuffle algorithm for true randomization
      photos = [...photos]
      for (let i = photos.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [photos[i], photos[j]] = [photos[j], photos[i]]
      }
    }

    return {
      currentPhotos: photos,
      totalPhotos: photos.length
    }
  }, [allPhotos, activeDate, sortOrder, isShuffled, shuffleSeed])

  // Apply pagination
  const displayedPhotos = currentPhotos.slice(0, displayedCount)
  const hasMore = displayedCount < totalPhotos

  // Reset displayed count when filter, sort, or shuffle changes
  useEffect(() => {
    setDisplayedCount(initialLoadCount)
  }, [activeDate, sortOrder, isShuffled, shuffleSeed, initialLoadCount])

  // Load more photos when observer target is visible
  const loadMore = useCallback(() => {
    if (!hasMore || isLoadingMore) return

    setIsLoadingMore(true)
    // Use requestAnimationFrame for smoother updates during scroll
    requestAnimationFrame(() => {
      setTimeout(() => {
        setDisplayedCount(prev => Math.min(prev + loadMoreCount, totalPhotos))
        setIsLoadingMore(false)
      }, 100) // Reduced timeout for faster response
    })
  }, [hasMore, isLoadingMore, totalPhotos, loadMoreCount])

  // Intersection Observer for infinite scroll
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !isLoadingMore) {
          loadMore()
        }
      },
      {
        threshold: 0.01, // Lower threshold for earlier triggering
        rootMargin: '800px' // Significantly increased preload distance for smoother scrolling
      }
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
  }, [hasMore, isLoadingMore, loadMore])

  const handlePhotoClick = (photo) => {
    setLightboxPhoto(photo)
  }

  const handleCloseLightbox = () => {
    setLightboxPhoto(null)
  }

  const handleNavigateLightbox = (newPhoto) => {
    setLightboxPhoto(newPhoto)
  }

  // Date options for the picker
  const dateOptions = [
    { label: 'Dec 26, 2025', value: '2025-12-26T12:00:00.000Z' },
    { label: 'Dec 27, 2025', value: '2025-12-27T12:00:00.000Z' },
    { label: 'Dec 28, 2025', value: '2025-12-28T12:00:00.000Z' },
    { label: 'Dec 29, 2025', value: '2025-12-29T12:00:00.000Z' }
  ]

  // Handle date change based on photo source
  const handleDateChange = async (photo, dateString) => {
    try {
      if (photo.source === 'gallery') {
        if (onUpdateGalleryPhotoDate) {
          await onUpdateGalleryPhotoDate(photo.id, dateString)
        }
      } else {
        // photobooth photo
        if (onUpdatePhotoboothPhotoDate) {
          await onUpdatePhotoboothPhotoDate(photo.id, photo.day, dateString)
        }
      }
      setActiveDatePicker(null)
    } catch (error) {
      console.error('Error updating date:', error)
    }
  }

  // Handle delete based on photo source
  const handleDelete = async (photo, event) => {
    event.stopPropagation()

    if (!window.confirm('Are you sure you want to delete this photo?')) {
      return
    }

    try {
      if (photo.source === 'gallery') {
        if (onDeleteGalleryPhoto) {
          await onDeleteGalleryPhoto(photo.id, photo.storagePath)
        }
      } else {
        // photobooth photo
        if (onDeletePhotoboothPhoto) {
          await onDeletePhotoboothPhoto(photo.id, photo.day)
        }
      }
    } catch (error) {
      console.error('Error deleting photo:', error)
    }
  }

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

  // Format date from photo (using photoDate for photobooth, creationDate for gallery, fallback to timestamp)
  const formatDate = (photo) => {
    const dateValue = photo.photoDate || photo.creationDate || photo.timestamp
    if (!dateValue) return ''

    // Handle Firebase timestamp object
    const date = dateValue.seconds
      ? new Date(dateValue.seconds * 1000)
      : new Date(dateValue)

    // Format as "MMM D" (e.g., "Dec 27")
    const options = { month: 'short', day: 'numeric' }
    return date.toLocaleDateString('en-US', options)
  }

  // Assign tile sizes in a pattern for visual variety
  const getTileSize = (index) => {
    const pattern = [
      'large', 'medium', 'medium', 'small', 'small',
      'medium', 'large', 'small', 'medium', 'small',
      'small', 'medium', 'small', 'large', 'medium'
    ]
    return pattern[index % pattern.length]
  }

  if (loading) {
    return (
      <div className="photo-tile-view">
        <div className="tile-header">
          <h2>Photos</h2>
        </div>
        <div className="tile-grid">
          {[...Array(12)].map((_, index) => (
            <div key={index} className={`tile-skeleton tile-${getTileSize(index)}`}>
              <div className="skeleton-image"></div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  if (totalPhotos === 0) {
    return (
      <div className="photo-tile-view">
        <div className="tile-header">
          <h2>Photos</h2>
        </div>
        <div className="tile-empty">
          <p>No photos available yet.</p>
          <p className="tile-empty-hint">Photos from the photobooth will appear here.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="photo-tile-view">
      <div className="tile-header">
        <div className="tile-header-left">
          <h2>Photos</h2>
          <div className="tile-count">
            {totalPhotos} {totalPhotos === 1 ? 'photo' : 'photos'}
          </div>
        </div>
        <div className="tile-header-right">
          {onUpload && (
            <button
              className="btn-upload-tile"
              onClick={handleUploadClick}
              disabled={uploading}
              title="Upload photos or videos"
            >
              {uploading ? 'Uploading...' : '📤 Upload'}
            </button>
          )}
          {totalPhotos > 0 && (
            <>
              <div className="tile-view-controls">
                <button
                  className={`tile-view-btn ${viewMode === 'tiles' ? 'active' : ''}`}
                  onClick={() => setViewMode('tiles')}
                  title="Tiles view"
                >
                  ⊞
                </button>
                <button
                  className={`tile-view-btn ${viewMode === 'list' ? 'active' : ''}`}
                  onClick={() => setViewMode('list')}
                  title="List view"
                >
                  ☰
                </button>
              </div>
              <div className="tile-sort-controls">
                <button
                  className={`tile-sort-btn ${sortOrder === 'newest' && !isShuffled ? 'active' : ''}`}
                  onClick={() => {
                    setSortOrder('newest')
                    setIsShuffled(false)
                  }}
                  title="Sort by newest first"
                >
                  ⬇️ Newest
                </button>
                <button
                  className={`tile-sort-btn ${sortOrder === 'oldest' && !isShuffled ? 'active' : ''}`}
                  onClick={() => {
                    setSortOrder('oldest')
                    setIsShuffled(false)
                  }}
                  title="Sort by oldest first"
                >
                  ⬆️ Oldest
                </button>
                <button
                  className={`tile-sort-btn ${isShuffled ? 'active' : ''}`}
                  onClick={() => {
                    setIsShuffled(true)
                    setShuffleSeed(Math.random()) // Trigger new shuffle each time
                  }}
                  title="Shuffle photos randomly (click again to reshuffle)"
                >
                  🔀 Shuffle
                </button>
              </div>
              <button
                className="btn-slideshow"
                onClick={() => setShowSlideshow(true)}
                title="Start slideshow"
              >
                ▶️ Slideshow
              </button>
            </>
          )}
        </div>
      </div>

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*,video/mp4,video/quicktime"
        multiple
        style={{ display: 'none' }}
        onChange={handleFileSelect}
      />

      {/* Date Filter */}
      <div className="tile-filter">
        <button
          className={`tile-filter-btn ${activeDate === 'all' ? 'active' : ''}`}
          onClick={() => setActiveDate('all')}
        >
          All Photos
        </button>
        {uniqueDates.map(dateString => {
          // Format the date for display (dateString is in YYYY-MM-DD format)
          const date = new Date(dateString + 'T12:00:00')
          const displayDate = date.toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric'
          })
          return (
            <button
              key={dateString}
              className={`tile-filter-btn ${activeDate === dateString ? 'active' : ''}`}
              onClick={() => setActiveDate(dateString)}
            >
              📸 {displayDate}
            </button>
          )
        })}
      </div>

      {/* Photo Grid - Tiles or List */}
      <div className={viewMode === 'tiles' ? 'tile-grid' : 'photo-list'}>
        {displayedPhotos.map((photo, index) => {
          const tileSize = viewMode === 'tiles' ? getTileSize(index) : 'single'
          const isVideo = photo.isVideo || photo.fileType === '.mp4'
          const isGif = photo.fileType === '.gif'

          // Videos in the "animated" folder should autoplay like GIFs (boomerangs, animated clips)
          const isAnimatedVideo = isVideo && photo.folder === 'animated'

          // For GIFs and animated videos, always use the original downloadURL to preserve animation
          // Compressed versions lose animation, so skip compressedURL for these
          const thumbnailUrl = photo.thumbnailURL || photo.thumbnail
          const fullUrl = (isGif || isAnimatedVideo)
            ? (photo.downloadURL || photo.dataUrl)  // GIFs/animated videos: use original only
            : (photo.compressedURL || photo.downloadURL || photo.dataUrl)  // Others: prefer compressed

          return (
            <div
              key={photo.id}
              className={`${viewMode === 'tiles' ? `tile tile-${tileSize}` : 'photo-list-item'} ${isVideo ? 'tile-video' : ''} ${activeDatePicker === photo.id ? 'tile-picker-active' : ''}`}
            >
              {isAnimatedVideo ? (
                // Animated videos (from "animated" folder) - autoplay like GIFs
                <video
                  src={fullUrl}
                  className="tile-image tile-animated-video"
                  autoPlay
                  loop
                  muted
                  playsInline
                  preload="auto"
                  onClick={() => handlePhotoClick(photo)}
                >
                  Your browser does not support the video tag.
                </video>
              ) : isVideo ? (
                // Regular videos - show thumbnail with play button
                <div className="tile-video-container" onClick={() => handlePhotoClick(photo)}>
                  {thumbnailUrl ? (
                    <>
                      <img
                        src={thumbnailUrl}
                        alt={`Video ${index + 1} thumbnail`}
                        className="tile-image tile-video-thumbnail"
                        loading="lazy"
                      />
                      <video
                        src={fullUrl}
                        className="tile-image tile-video-element"
                        muted
                        playsInline
                        preload="metadata"
                        poster={thumbnailUrl}
                        style={{ display: 'none' }}
                      >
                        Your browser does not support the video tag.
                      </video>
                    </>
                  ) : (
                    // No thumbnail available - show video with first frame
                    <video
                      src={fullUrl}
                      className="tile-image tile-video-thumbnail"
                      muted
                      playsInline
                      preload="metadata"
                    >
                      Your browser does not support the video tag.
                    </video>
                  )}
                </div>
              ) : isGif ? (
                <img
                  src={fullUrl}
                  alt={`Animated ${index + 1}`}
                  className="tile-image"
                  loading="lazy"
                  onClick={() => handlePhotoClick(photo)}
                />
              ) : (
                <ProgressiveImage
                  thumbnailUrl={thumbnailUrl}
                  fullUrl={fullUrl}
                  alt={`Photo ${index + 1}`}
                  className="tile-image"
                  loading="lazy"
                  onClick={() => handlePhotoClick(photo)}
                />
              )}
              <div className="tile-overlay">
                <div className="tile-info">
                  {isVideo && !isAnimatedVideo && (
                    <span className="tile-video-badge">▶️</span>
                  )}
                  {(photo.creationDate || photo.timestamp) && (
                    <span className="tile-date">
                      {photo.source === 'gallery' ? '🖼️' : '📸'} {formatDate(photo)}
                    </span>
                  )}
                </div>
                {/* Hidden: change date and delete photo icons */}
                {/* <div className="tile-actions">
                  {(onUpdateGalleryPhotoDate || onUpdatePhotoboothPhotoDate) && (
                    <button
                      className="tile-date-btn"
                      onClick={(e) => {
                        e.stopPropagation()
                        setActiveDatePicker(activeDatePicker === photo.id ? null : photo.id)
                      }}
                      title="Change photo date"
                    >
                      📅
                    </button>
                  )}
                  {(onDeleteGalleryPhoto || onDeletePhotoboothPhoto) && (
                    <button
                      className="tile-delete-btn"
                      onClick={(e) => handleDelete(photo, e)}
                      title="Delete photo"
                    >
                      🗑️
                    </button>
                  )}
                </div> */}
              </div>
              {activeDatePicker === photo.id && (
                <div className="tile-date-picker" onClick={(e) => e.stopPropagation()}>
                  {dateOptions.map((option) => (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => handleDateChange(photo, option.value)}
                      className="tile-date-option"
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )
        })}
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
      {!hasMore && displayedCount >= 20 && (
        <div className="all-photos-loaded">
          <p>All {totalPhotos} photos loaded</p>
        </div>
      )}

      {/* Lightbox */}
      {lightboxPhoto && (
        <Lightbox
          photo={lightboxPhoto}
          photos={currentPhotos}
          onClose={handleCloseLightbox}
          onNavigate={handleNavigateLightbox}
        />
      )}

      {/* Slideshow */}
      {showSlideshow && (
        <Slideshow
          photos={currentPhotos}
          onClose={() => setShowSlideshow(false)}
        />
      )}

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
    </div>
  )
}

export default PhotoTileView
