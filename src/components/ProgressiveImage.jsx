import { useState, useEffect, useRef } from 'react'

/**
 * Progressive Image Component with Connection-Aware Loading
 * Loads thumbnail first for fast page load, then upgrades to high-res when in viewport
 * Optimized for mobile devices and slow connections
 */
function ProgressiveImage({
  thumbnailUrl,
  fullUrl,
  alt = '',
  className = '',
  onClick,
  loading = 'lazy'
}) {
  const [currentSrc, setCurrentSrc] = useState(thumbnailUrl || fullUrl)
  const [isLoaded, setIsLoaded] = useState(false)
  const [hasUpgraded, setHasUpgraded] = useState(false)
  const [thumbnailLoaded, setThumbnailLoaded] = useState(false)
  const imgRef = useRef(null)
  const observerRef = useRef(null)

  // Load thumbnail immediately when component mounts
  useEffect(() => {
    if (thumbnailUrl && thumbnailUrl !== fullUrl) {
      const img = new Image()
      img.onload = () => {
        setThumbnailLoaded(true)
        setCurrentSrc(thumbnailUrl)
      }
      img.onerror = (error) => {
        // If thumbnail fails, use full URL
        console.warn('Thumbnail failed to load, using full URL:', thumbnailUrl, error)
        setCurrentSrc(fullUrl)
        setThumbnailLoaded(true)
      }
      img.src = thumbnailUrl
    } else {
      // No thumbnail, mark as loaded
      setThumbnailLoaded(true)
      if (!fullUrl) {
        console.warn('ProgressiveImage: No thumbnail or full URL provided')
      }
    }
  }, [thumbnailUrl, fullUrl])

  // Check if user prefers reduced data usage
  const shouldLoadHighRes = () => {
    // Check if user has data saver enabled
    if (navigator.connection) {
      const conn = navigator.connection

      // Don't load high-res on slow connections (2g, slow-2g)
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

  useEffect(() => {
    // Wait for thumbnail to load before upgrading
    if (!thumbnailLoaded) return

    // Don't upgrade if there's no fullUrl or they're the same
    if (!fullUrl || fullUrl === thumbnailUrl || hasUpgraded) return

    // Don't upgrade on slow connections or data saver mode
    if (!shouldLoadHighRes()) {
      setIsLoaded(true)
      return
    }

    // Detect mobile device
    const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent)

    // More aggressive lazy loading on mobile (load earlier to feel faster)
    const rootMargin = isMobile ? '300px' : '200px'

    // Create Intersection Observer to detect when image is in viewport
    observerRef.current = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && !hasUpgraded) {
            // Image is in viewport, start loading high-res version
            const img = new Image()
            img.src = fullUrl

            img.onload = () => {
              // Use requestAnimationFrame for smoother updates during scroll
              requestAnimationFrame(() => {
                setCurrentSrc(fullUrl)
                setHasUpgraded(true)
                setIsLoaded(true)
              })
            }

            img.onerror = (error) => {
              // If high-res fails to load, keep the thumbnail
              console.warn('Failed to load high-res image:', fullUrl, error)
              setIsLoaded(true)
            }

            // Stop observing after we start loading
            if (observerRef.current && imgRef.current) {
              observerRef.current.unobserve(imgRef.current)
            }
          }
        })
      },
      {
        rootMargin: rootMargin, // Load earlier on mobile for smoother experience
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
  }, [fullUrl, thumbnailUrl, hasUpgraded, thumbnailLoaded])

  return (
    <img
      ref={imgRef}
      src={currentSrc}
      alt={alt}
      className={`${className} ${isLoaded ? 'progressive-loaded' : 'progressive-loading'}`}
      onClick={onClick}
      loading={loading}
      style={{
        opacity: isLoaded ? 1 : 0.9,
        transition: 'opacity 0.3s ease-in-out'
      }}
    />
  )
}

export default ProgressiveImage
