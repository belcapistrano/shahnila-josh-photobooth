import { useState, useEffect } from 'react'

/**
 * Progressive image loader component with blur placeholder
 * Shows blur placeholder -> thumbnail -> full image for optimal loading experience
 */
function ImageLoader({ src, thumbnail, blurPlaceholder, alt, className = '' }) {
  const [currentSrc, setCurrentSrc] = useState(blurPlaceholder || thumbnail || src)
  const [isLoading, setIsLoading] = useState(true)
  const [loadingStage, setLoadingStage] = useState('blur') // blur -> thumbnail -> full

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

          // Load full resolution
          loadFullImage()
        }
        thumbnailImg.src = thumbnail
      } else {
        // No thumbnail, go straight to full image
        loadFullImage()
      }
    } else if (thumbnail) {
      // No blur placeholder, start with thumbnail
      setCurrentSrc(thumbnail)
      setLoadingStage('thumbnail')
      setIsLoading(true)

      // Load full resolution
      loadFullImage()
    } else {
      // No optimization, load full image directly
      loadFullImage()
    }
  }, [src, thumbnail, blurPlaceholder])

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

  return (
    <div className={`image-loader-container ${isLoading ? 'loading' : 'loaded'}`}>
      <img
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
