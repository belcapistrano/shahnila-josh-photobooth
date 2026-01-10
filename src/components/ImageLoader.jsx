import { useState, useEffect, useRef } from 'react'

/**
 * Progressive image loader component with blur placeholder and viewport detection
 * Shows blur placeholder -> thumbnail -> full image (when in viewport) for optimal loading experience
 */
function ImageLoader({ src, thumbnail, blurPlaceholder, alt, className = '' }) {
  const [currentSrc, setCurrentSrc] = useState(blurPlaceholder || thumbnail || src)
  const [isLoading, setIsLoading] = useState(true)
  const [loadingStage, setLoadingStage] = useState('blur') // blur -> thumbnail -> full
  const [shouldLoadFull, setShouldLoadFull] = useState(false)
  const imgRef = useRef(null)
  const observerRef = useRef(null)

  // Check if user prefers reduced data usage
  const shouldLoadHighRes = () => {
    // Check if user has data saver enabled or slow connection
    if (navigator.connection) {
      const conn = navigator.connection

      // Don't load high-res on slow connections
      if (conn.effectiveType === '2g' || conn.effectiveType === 'slow-2g') {
        return false
      }

      // Don't load high-res if user has data saver enabled
      if (conn.saveData) {
        return false
      }
    }

    return true
  }

  // Intersection Observer to detect when image is near viewport
  useEffect(() => {
    // Detect mobile device for optimized loading
    const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent)
    const rootMargin = isMobile ? '400px' : '300px' // Load even earlier for smooth scrolling

    observerRef.current = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            // Check connection before loading full image
            if (shouldLoadHighRes()) {
              // Use requestAnimationFrame for smoother updates during scroll
              requestAnimationFrame(() => {
                setShouldLoadFull(true)
              })
            } else {
              // Skip full image on slow connections
              setIsLoading(false)
            }

            // Stop observing after triggering
            if (observerRef.current && imgRef.current) {
              observerRef.current.unobserve(imgRef.current)
            }
          }
        })
      },
      {
        rootMargin: rootMargin, // Start loading earlier based on device
        threshold: 0.01
      }
    )

    if (imgRef.current) {
      observerRef.current.observe(imgRef.current)
    }

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect()
      }
    }
  }, [])

  useEffect(() => {
    // Start with blur placeholder if available
    if (blurPlaceholder) {
      setCurrentSrc(blurPlaceholder)
      setLoadingStage('blur')
      setIsLoading(true)

      // Load thumbnail
      if (thumbnail) {
        const thumbnailImg = new Image()
        thumbnailImg.onload = () => {
          setCurrentSrc(thumbnail)
          setLoadingStage('thumbnail')
        }
        thumbnailImg.src = thumbnail
      }
    } else if (thumbnail) {
      // No blur placeholder, start with thumbnail
      setCurrentSrc(thumbnail)
      setLoadingStage('thumbnail')
      setIsLoading(true)
    } else {
      // No optimization available
      setLoadingStage('thumbnail')
    }
  }, [thumbnail, blurPlaceholder])

  // Load full resolution only when in viewport
  useEffect(() => {
    if (!shouldLoadFull) return

    const loadFullImage = () => {
      const fullImg = new Image()
      fullImg.onload = () => {
        setCurrentSrc(src)
        setLoadingStage('full')
        setIsLoading(false)
      }
      fullImg.onerror = () => {
        // If full image fails to load, stick with current
        setIsLoading(false)
      }
      fullImg.src = src
    }

    loadFullImage()
  }, [shouldLoadFull, src])

  return (
    <div className={`image-loader-container ${isLoading ? 'loading' : 'loaded'}`}>
      <img
        ref={imgRef}
        src={currentSrc}
        alt={alt}
        className={`${className} image-loader-img ${loadingStage === 'blur' ? 'blur-stage' : ''} ${loadingStage === 'thumbnail' ? 'thumbnail-stage' : ''} ${loadingStage === 'full' ? 'full-stage' : ''}`}
        loading="lazy"
      />
      {isLoading && loadingStage !== 'full' && (
        <div className="image-loader-overlay">
          <div className="spinner"></div>
        </div>
      )}
    </div>
  )
}

export default ImageLoader
