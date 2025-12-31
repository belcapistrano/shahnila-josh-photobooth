import { useState, useEffect, useRef } from 'react'

function Slideshow({ photos, onClose }) {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isPlaying, setIsPlaying] = useState(true)
  const [speed, setSpeed] = useState('medium') // slow: 5s, medium: 3s, fast: 2s
  const [transition, setTransition] = useState('fade') // fade, slide
  const [isFullscreen, setIsFullscreen] = useState(false)
  const slideshowRef = useRef(null)
  const videoRef = useRef(null)

  const currentPhoto = photos[currentIndex]
  const isVideo = currentPhoto?.isVideo || currentPhoto?.fileType === '.mp4'

  // Speed configurations (in milliseconds)
  const speeds = {
    slow: 5000,
    medium: 3000,
    fast: 2000
  }

  // Auto-advance slideshow
  useEffect(() => {
    if (!isPlaying || photos.length === 0) return

    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % photos.length)
    }, speeds[speed])

    return () => clearInterval(interval)
  }, [isPlaying, speed, photos.length])

  // Keyboard controls
  useEffect(() => {
    const handleKeyDown = (e) => {
      switch (e.key) {
        case 'Escape':
          if (isFullscreen) {
            exitFullscreen()
          } else {
            onClose()
          }
          break
        case ' ':
          e.preventDefault()
          setIsPlaying(prev => !prev)
          break
        case 'ArrowLeft':
          goToPrevious()
          break
        case 'ArrowRight':
          goToNext()
          break
        case 'f':
        case 'F':
          toggleFullscreen()
          break
        default:
          break
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isFullscreen, onClose])

  // Fullscreen change listener
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement)
    }

    document.addEventListener('fullscreenchange', handleFullscreenChange)
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange)
  }, [])

  // Auto-play videos when they appear
  useEffect(() => {
    if (isVideo && videoRef.current) {
      videoRef.current.play().catch((error) => {
        console.log('Video autoplay prevented:', error)
      })
    }
  }, [isVideo, currentIndex])

  const goToPrevious = () => {
    setCurrentIndex((prev) => (prev - 1 + photos.length) % photos.length)
    setIsPlaying(false)
  }

  const goToNext = () => {
    setCurrentIndex((prev) => (prev + 1) % photos.length)
    setIsPlaying(false)
  }

  const toggleFullscreen = async () => {
    if (!document.fullscreenElement) {
      try {
        await slideshowRef.current?.requestFullscreen()
      } catch (err) {
        console.error('Error entering fullscreen:', err)
      }
    } else {
      await document.exitFullscreen()
    }
  }

  const exitFullscreen = async () => {
    if (document.fullscreenElement) {
      await document.exitFullscreen()
    }
  }

  if (!currentPhoto) {
    return null
  }

  const imageUrl = currentPhoto.downloadURL || currentPhoto.dataUrl

  return (
    <div className="slideshow-overlay" ref={slideshowRef}>
      <div className={`slideshow-container ${transition}`}>
        {/* Close button */}
        <button className="slideshow-close" onClick={onClose} aria-label="Close slideshow">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
          </svg>
        </button>

        {/* Media display */}
        <div className="slideshow-media" key={currentIndex}>
          {isVideo ? (
            <video
              ref={videoRef}
              controls
              loop
              playsInline
              preload="metadata"
              className="slideshow-video"
            >
              <source src={imageUrl} type="video/mp4" />
              Your browser does not support the video tag.
            </video>
          ) : (
            <img
              src={imageUrl}
              alt={`Slideshow ${currentIndex + 1}`}
              className="slideshow-image"
            />
          )}
        </div>

        {/* Navigation arrows */}
        <button
          className="slideshow-nav slideshow-nav-prev"
          onClick={goToPrevious}
          aria-label="Previous photo"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="15 18 9 12 15 6"></polyline>
          </svg>
        </button>

        <button
          className="slideshow-nav slideshow-nav-next"
          onClick={goToNext}
          aria-label="Next photo"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="9 18 15 12 9 6"></polyline>
          </svg>
        </button>

        {/* Controls panel */}
        <div className="slideshow-controls">
          {/* Play/Pause */}
          <button
            className="slideshow-control-btn"
            onClick={() => setIsPlaying(!isPlaying)}
            title={isPlaying ? 'Pause' : 'Play'}
          >
            {isPlaying ? (
              <svg viewBox="0 0 24 24" fill="currentColor">
                <rect x="6" y="4" width="4" height="16"></rect>
                <rect x="14" y="4" width="4" height="16"></rect>
              </svg>
            ) : (
              <svg viewBox="0 0 24 24" fill="currentColor">
                <polygon points="5 3 19 12 5 21 5 3"></polygon>
              </svg>
            )}
          </button>

          {/* Speed controls */}
          <div className="slideshow-speed-controls">
            <span className="slideshow-label">Speed:</span>
            <button
              className={`slideshow-speed-btn ${speed === 'slow' ? 'active' : ''}`}
              onClick={() => setSpeed('slow')}
            >
              Slow
            </button>
            <button
              className={`slideshow-speed-btn ${speed === 'medium' ? 'active' : ''}`}
              onClick={() => setSpeed('medium')}
            >
              Medium
            </button>
            <button
              className={`slideshow-speed-btn ${speed === 'fast' ? 'active' : ''}`}
              onClick={() => setSpeed('fast')}
            >
              Fast
            </button>
          </div>

          {/* Counter */}
          <div className="slideshow-counter">
            {currentIndex + 1} / {photos.length}
          </div>

          {/* Fullscreen toggle */}
          <button
            className="slideshow-control-btn"
            onClick={toggleFullscreen}
            title={isFullscreen ? 'Exit fullscreen' : 'Enter fullscreen'}
          >
            {isFullscreen ? (
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M8 3v3a2 2 0 0 1-2 2H3m18 0h-3a2 2 0 0 1-2-2V3m0 18v-3a2 2 0 0 1 2-2h3M3 16h3a2 2 0 0 1 2 2v3"></path>
              </svg>
            ) : (
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3"></path>
              </svg>
            )}
          </button>
        </div>

        {/* Progress bar */}
        {isPlaying && (
          <div className="slideshow-progress-bar">
            <div
              className="slideshow-progress-fill"
              style={{
                animation: `slideshow-progress ${speeds[speed]}ms linear`
              }}
            />
          </div>
        )}
      </div>
    </div>
  )
}

export default Slideshow
