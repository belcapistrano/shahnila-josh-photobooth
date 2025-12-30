import { useState, useEffect, useRef } from 'react'
import ImageLoader from './ImageLoader'

function PhotoCard({ photo, onLike, onDelete, isLiked = false, onToggleLike }) {
  // Use downloadURL from Firebase or dataUrl as fallback
  const imageUrl = photo.downloadURL || photo.dataUrl
  const isVideo = photo.isVideo || photo.fileType === '.mp4'
  const [isAnimating, setIsAnimating] = useState(false)
  const [timeRemaining, setTimeRemaining] = useState(null)
  const [canDelete, setCanDelete] = useState(false)
  const [isVideoPlaying, setIsVideoPlaying] = useState(false)
  const videoRef = useRef(null)

  // Calculate time remaining for deletion (15 minutes window)
  useEffect(() => {
    const calculateTimeRemaining = () => {
      const photoTime = new Date(photo.createdAt || photo.timestamp).getTime()
      const currentTime = Date.now()
      const elapsed = currentTime - photoTime
      const deleteWindow = 15 * 60 * 1000 // 15 minutes in milliseconds
      const remaining = deleteWindow - elapsed

      if (remaining > 0) {
        setCanDelete(true)
        setTimeRemaining(remaining)
      } else {
        setCanDelete(false)
        setTimeRemaining(null)
      }
    }

    calculateTimeRemaining()
    const interval = setInterval(calculateTimeRemaining, 1000) // Update every second

    return () => clearInterval(interval)
  }, [photo.createdAt, photo.timestamp])

  // Autoplay video when in view and track play/pause state
  useEffect(() => {
    if (!isVideo || !videoRef.current) return

    const video = videoRef.current

    // Track video play/pause state for hiding controls on mobile
    const handlePlay = () => setIsVideoPlaying(true)
    const handlePause = () => setIsVideoPlaying(false)
    const handleEnded = () => setIsVideoPlaying(false)

    video.addEventListener('play', handlePlay)
    video.addEventListener('pause', handlePause)
    video.addEventListener('ended', handleEnded)

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            // Video is in view, play it
            video.play().catch((error) => {
              // Autoplay might be blocked by browser, that's okay
              console.log('Autoplay prevented:', error)
            })
          } else {
            // Video is out of view, pause it
            video.pause()
          }
        })
      },
      {
        threshold: 0.5, // Play when at least 50% of video is visible
      }
    )

    observer.observe(video)

    return () => {
      video.removeEventListener('play', handlePlay)
      video.removeEventListener('pause', handlePause)
      video.removeEventListener('ended', handleEnded)
      observer.disconnect()
    }
  }, [isVideo])

  const handleLike = () => {
    if (onLike && onToggleLike) {
      // Toggle the like state in localStorage
      const newLikedState = onToggleLike(photo.id)

      // Update the like count in Firebase/localStorage
      onLike(photo.id, newLikedState ? 1 : -1)

      // Trigger animation
      setIsAnimating(true)
      setTimeout(() => setIsAnimating(false), 300)
    }
  }

  const handleDownload = async () => {
    try {
      // Convert URL to blob
      const response = await fetch(imageUrl)
      const blob = await response.blob()

      // Create object URL from blob
      const blobUrl = URL.createObjectURL(blob)

      // Determine file extension
      const fileExtension = isVideo ? 'mp4' : 'png'

      // Create download link
      const link = document.createElement('a')
      link.href = blobUrl
      link.download = `photobooth-${photo.id}.${fileExtension}`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)

      // Clean up object URL
      setTimeout(() => URL.revokeObjectURL(blobUrl), 100)
    } catch (error) {
      console.error('Download failed:', error)
      // Fallback: try direct link download
      const fileExtension = isVideo ? 'mp4' : 'png'
      const link = document.createElement('a')
      link.href = imageUrl
      link.download = `photobooth-${photo.id}.${fileExtension}`
      link.target = '_blank'
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
    }
  }

  const handleNativeShare = async () => {
    try {
      // Convert URL to blob
      const response = await fetch(imageUrl, { mode: 'cors' })
      const blob = await response.blob()

      // For mobile devices, use Web Share API
      if (navigator.share) {
        const filesArray = []

        // Determine file type and name
        const fileExtension = isVideo ? 'mp4' : 'png'
        const mimeType = isVideo ? 'video/mp4' : 'image/png'

        // Try to create File object (supported on most modern mobile browsers)
        try {
          const file = new File([blob], `shahnila-josh-wedding-${photo.id}.${fileExtension}`, {
            type: mimeType,
            lastModified: new Date().getTime()
          })

          // Check if sharing files is supported
          if (navigator.canShare && navigator.canShare({ files: [file] })) {
            filesArray.push(file)
          }
        } catch (e) {
          console.log('File creation not supported:', e)
        }

        // Share with or without files
        const shareData = {
          title: `Shahnila & Josh Wedding ${isVideo ? 'Video' : 'Photo'}`,
          text: `${isVideo ? 'Video' : 'Photo'} from our wedding photobooth! 💕`
        }

        if (filesArray.length > 0) {
          shareData.files = filesArray
        }

        await navigator.share(shareData)
      } else {
        // Desktop fallback: download
        await handleDownload()
      }
    } catch (error) {
      // User cancelled or error occurred
      if (error.name === 'AbortError') {
        console.log('Share cancelled by user')
      } else {
        console.log('Share failed, trying download:', error)
        await handleDownload()
      }
    }
  }

  const handleShareFacebook = () => {
    const shareUrl = encodeURIComponent(imageUrl)
    const facebookUrl = `https://www.facebook.com/sharer/sharer.php?u=${shareUrl}`
    window.open(facebookUrl, '_blank', 'width=600,height=400')
  }

  const handleShareInstagram = async () => {
    // Instagram doesn't have a direct web share API
    // Best approach is to use native share on mobile (which includes Instagram)
    // or download the image for manual upload
    if (navigator.share) {
      try {
        const response = await fetch(imageUrl, { mode: 'cors' })
        const blob = await response.blob()
        const fileExtension = isVideo ? 'mp4' : 'jpg'
        const mimeType = isVideo ? 'video/mp4' : 'image/jpeg'

        const file = new File([blob], `shahnila-josh-wedding-${photo.id}.${fileExtension}`, {
          type: mimeType,
          lastModified: new Date().getTime()
        })

        if (navigator.canShare && navigator.canShare({ files: [file] })) {
          await navigator.share({
            title: `Shahnila & Josh Wedding ${isVideo ? 'Video' : 'Photo'}`,
            text: `${isVideo ? 'Video' : 'Photo'} from our wedding photobooth! 💕`,
            files: [file]
          })
        } else {
          alert('Please download the photo and share it on Instagram manually.')
          await handleDownload()
        }
      } catch (error) {
        if (error.name !== 'AbortError') {
          console.log('Share failed, downloading instead:', error)
          alert('Please download the photo and share it on Instagram manually.')
          await handleDownload()
        }
      }
    } else {
      // Desktop: suggest downloading
      alert('Please download the photo and share it on Instagram manually.')
      await handleDownload()
    }
  }

  const handleShareWhatsApp = () => {
    const text = encodeURIComponent(`Check out this ${isVideo ? 'video' : 'photo'} from Shahnila & Josh's wedding! 💕 ${imageUrl}`)
    const whatsappUrl = `https://wa.me/?text=${text}`
    window.open(whatsappUrl, '_blank')
  }

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(imageUrl)
      alert('Link copied to clipboard!')
    } catch (error) {
      console.error('Failed to copy link:', error)
      // Fallback for older browsers
      const textArea = document.createElement('textarea')
      textArea.value = imageUrl
      textArea.style.position = 'fixed'
      textArea.style.left = '-999999px'
      document.body.appendChild(textArea)
      textArea.select()
      try {
        document.execCommand('copy')
        alert('Link copied to clipboard!')
      } catch (err) {
        console.error('Fallback copy failed:', err)
        alert('Failed to copy link')
      }
      document.body.removeChild(textArea)
    }
  }

  const handleDelete = () => {
    if (window.confirm('Are you sure you want to delete this photo?')) {
      if (onDelete) {
        onDelete(photo.id, photo.storagePath)
      }
    }
  }

  const formatTimeRemaining = (milliseconds) => {
    if (!milliseconds) return ''
    const minutes = Math.floor(milliseconds / 60000)
    const seconds = Math.floor((milliseconds % 60000) / 1000)
    return `${minutes}:${seconds.toString().padStart(2, '0')}`
  }

  return (
    <div className="photo-card">
      <div className="photo-card-image-container">
        {isVideo ? (
          <video
            ref={videoRef}
            src={imageUrl}
            controls
            loop
            muted
            playsInline
            className={`photo-card-video ${isVideoPlaying ? 'playing' : ''}`}
          >
            Your browser does not support the video tag.
          </video>
        ) : (
          <ImageLoader
            src={imageUrl}
            thumbnail={photo.thumbnailURL || photo.thumbnail}
            blurPlaceholder={photo.blurPlaceholder}
            alt={`Photo taken at ${photo.timestamp}`}
          />
        )}
      </div>
      <div className="photo-card-info">
        <div className="photo-like-overlay">
          <button
            className={`photo-like-button ${isAnimating ? 'animate' : ''}`}
            onClick={handleLike}
            aria-label="Like photo"
          >
            <svg
              className={`heart-icon ${isLiked ? 'liked' : ''}`}
              viewBox="0 0 24 24"
              fill={isLiked ? "#ed4956" : "none"}
              stroke={isLiked ? "#ed4956" : "#674F2D"}
              strokeWidth="2"
            >
              <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
            </svg>
          </button>
          <span className="likes-count-overlay">
            {photo.likes || 0}
          </span>
        </div>
        {photo.challenge && (
          <div className="photo-challenge-tag">
            <span className="challenge-tag-emoji">{photo.challenge.emoji}</span>
            <span className="challenge-tag-text">{photo.challenge.text}</span>
          </div>
        )}
      </div>
      <div className="photo-card-actions">
        {canDelete && (
          <div className="delete-timer-section">
            <button onClick={handleDelete} className="btn-delete">
              Delete
            </button>
            <span className="delete-timer">
              {formatTimeRemaining(timeRemaining)} left
            </span>
          </div>
        )}
        <div className="photo-action-buttons">
          <button onClick={handleDownload} className="btn-download">
            Download
          </button>
          <div className="social-share-section">
            <div className="social-share-label">Share:</div>
            <div className="social-share-buttons">
              <button onClick={handleShareFacebook} className="btn-social facebook" title="Share on Facebook">
                <svg viewBox="0 0 24 24" fill="currentColor">
                  <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                </svg>
              </button>
              <button onClick={handleShareInstagram} className="btn-social instagram" title="Share on Instagram">
                <svg viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                </svg>
              </button>
              <button onClick={handleShareWhatsApp} className="btn-social whatsapp" title="Share on WhatsApp">
                <svg viewBox="0 0 24 24" fill="currentColor">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
                </svg>
              </button>
              <button onClick={handleCopyLink} className="btn-social copy" title="Copy Link">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"></path>
                  <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"></path>
                </svg>
              </button>
              {navigator.share && (
                <button onClick={handleNativeShare} className="btn-social native" title="More sharing options">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="18" cy="5" r="3"></circle>
                    <circle cx="6" cy="12" r="3"></circle>
                    <circle cx="18" cy="19" r="3"></circle>
                    <line x1="8.59" y1="13.51" x2="15.42" y2="17.49"></line>
                    <line x1="15.41" y1="6.51" x2="8.59" y2="10.49"></line>
                  </svg>
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default PhotoCard
