import { useState, useEffect, useRef } from 'react'

/**
 * Progressive Image Component
 * Loads thumbnail first for fast page load, then upgrades to high-res when in viewport
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
  const imgRef = useRef(null)
  const observerRef = useRef(null)

  useEffect(() => {
    // Don't upgrade if there's no fullUrl or they're the same
    if (!fullUrl || fullUrl === thumbnailUrl || hasUpgraded) return

    // Create Intersection Observer to detect when image is in viewport
    observerRef.current = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && !hasUpgraded) {
            // Image is in viewport, start loading high-res version
            const img = new Image()
            img.src = fullUrl

            img.onload = () => {
              setCurrentSrc(fullUrl)
              setHasUpgraded(true)
              setIsLoaded(true)
            }

            img.onerror = () => {
              // If high-res fails to load, keep the thumbnail
              console.warn('Failed to load high-res image:', fullUrl)
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
        rootMargin: '50px', // Start loading slightly before image enters viewport
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
  }, [fullUrl, thumbnailUrl, hasUpgraded])

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
