import { useState, useEffect, useRef } from 'react'

function Lightbox({ photo, photos, onClose, onNavigate }) {
  const [touchStart, setTouchStart] = useState(null)
  const [touchEnd, setTouchEnd] = useState(null)
  const videoRef = useRef(null)

  // Find current index
  const currentIndex = photos.findIndex(p => p.id === photo.id)
  const hasPrev = currentIndex > 0
  const hasNext = currentIndex < photos.length - 1

  const isVideo = photo.isVideo || photo.fileType === '.mp4'
  const imageUrl = photo.downloadURL || photo.dataUrl

  // Minimum swipe distance (in px)
  const minSwipeDistance = 50

  useEffect(() => {
    // Prevent body scroll when lightbox is open
    document.body.style.overflow = 'hidden'

    // Keyboard navigation
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        onClose()
      } else if (e.key === 'ArrowLeft' && hasPrev) {
        onNavigate(photos[currentIndex - 1])
      } else if (e.key === 'ArrowRight' && hasNext) {
        onNavigate(photos[currentIndex + 1])
      }
    }

    window.addEventListener('keydown', handleKeyDown)

    return () => {
      document.body.style.overflow = 'auto'
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [currentIndex, hasPrev, hasNext, onClose, onNavigate, photos])

  // Autoplay video when lightbox opens
  useEffect(() => {
    if (isVideo && videoRef.current) {
      videoRef.current.play().catch((error) => {
        console.log('Autoplay prevented:', error)
      })
    }
  }, [isVideo, photo.id])

  const handleTouchStart = (e) => {
    setTouchEnd(null)
    setTouchStart(e.targetTouches[0].clientX)
  }

  const handleTouchMove = (e) => {
    setTouchEnd(e.targetTouches[0].clientX)
  }

  const handleTouchEnd = () => {
    if (!touchStart || !touchEnd) return

    const distance = touchStart - touchEnd
    const isLeftSwipe = distance > minSwipeDistance
    const isRightSwipe = distance < -minSwipeDistance

    if (isLeftSwipe && hasNext) {
      onNavigate(photos[currentIndex + 1])
    } else if (isRightSwipe && hasPrev) {
      onNavigate(photos[currentIndex - 1])
    }
  }

  const handlePrev = () => {
    if (hasPrev) {
      onNavigate(photos[currentIndex - 1])
    }
  }

  const handleNext = () => {
    if (hasNext) {
      onNavigate(photos[currentIndex + 1])
    }
  }

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose()
    }
  }

  return (
    <div
      className="lightbox-overlay"
      onClick={handleBackdropClick}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      <div className="lightbox-container">
        {/* Close button */}
        <button className="lightbox-close" onClick={onClose} aria-label="Close">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
          </svg>
        </button>

        {/* Navigation arrows */}
        {hasPrev && (
          <button className="lightbox-nav lightbox-nav-prev" onClick={handlePrev} aria-label="Previous">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="15 18 9 12 15 6"></polyline>
            </svg>
          </button>
        )}

        {hasNext && (
          <button className="lightbox-nav lightbox-nav-next" onClick={handleNext} aria-label="Next">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="9 18 15 12 9 6"></polyline>
            </svg>
          </button>
        )}

        {/* Media content */}
        <div className="lightbox-media">
          {isVideo ? (
            <video
              ref={videoRef}
              controls
              loop
              playsInline
              preload="metadata"
              webkit-playsinline="true"
              className="lightbox-video"
            >
              <source src={imageUrl} type="video/mp4" />
              Your browser does not support the video tag.
            </video>
          ) : (
            <img
              src={imageUrl}
              alt={`Photo taken at ${photo.timestamp}`}
              className="lightbox-image"
            />
          )}
        </div>

        {/* Photo info */}
        <div className="lightbox-info">
          <div className="lightbox-metadata">
            <div className="lightbox-counter">
              {currentIndex + 1} / {photos.length}
            </div>
            {photo.challenge && (
              <div className="lightbox-challenge">
                <span className="lightbox-challenge-emoji">{photo.challenge.emoji}</span>
                <span className="lightbox-challenge-text">{photo.challenge.text}</span>
              </div>
            )}
            <div className="lightbox-likes">
              <svg
                className="lightbox-heart-icon"
                viewBox="0 0 24 24"
                fill="#ed4956"
                stroke="#ed4956"
                strokeWidth="2"
              >
                <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
              </svg>
              <span>{photo.likes || 0} {photo.likes === 1 ? 'like' : 'likes'}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Lightbox
