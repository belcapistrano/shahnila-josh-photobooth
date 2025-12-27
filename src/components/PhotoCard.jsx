import { useState, useEffect } from 'react'

function PhotoCard({ photo, onLike, onDelete, isLiked = false, onToggleLike }) {
  // Use downloadURL from Firebase or dataUrl as fallback
  const imageUrl = photo.downloadURL || photo.dataUrl
  const [isAnimating, setIsAnimating] = useState(false)
  const [timeRemaining, setTimeRemaining] = useState(null)
  const [canDelete, setCanDelete] = useState(false)

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

      // Create download link
      const link = document.createElement('a')
      link.href = blobUrl
      link.download = `photobooth-${photo.id}.png`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)

      // Clean up object URL
      setTimeout(() => URL.revokeObjectURL(blobUrl), 100)
    } catch (error) {
      console.error('Download failed:', error)
      // Fallback: try direct link download
      const link = document.createElement('a')
      link.href = imageUrl
      link.download = `photobooth-${photo.id}.png`
      link.target = '_blank'
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
    }
  }

  const handleShare = async () => {
    try {
      // Convert URL to blob
      const response = await fetch(imageUrl, { mode: 'cors' })
      const blob = await response.blob()

      // For mobile devices, use Web Share API
      if (navigator.share) {
        const filesArray = []

        // Try to create File object (supported on most modern mobile browsers)
        try {
          const file = new File([blob], `shahnila-josh-wedding-${photo.id}.png`, {
            type: 'image/png',
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
          title: 'Shahnila & Josh Wedding Photo',
          text: 'Photo from our wedding photobooth! 💕'
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
        <img
          src={imageUrl}
          alt={`Photo taken at ${photo.timestamp}`}
          loading="lazy"
        />
        <button
          className={`photo-like-button ${isAnimating ? 'animate' : ''}`}
          onClick={handleLike}
          aria-label="Like photo"
        >
          <svg
            className={`heart-icon ${isLiked ? 'liked' : ''}`}
            viewBox="0 0 24 24"
            fill={isLiked ? "#ed4956" : "none"}
            stroke={isLiked ? "#ed4956" : "white"}
            strokeWidth="2"
          >
            <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
          </svg>
        </button>
      </div>
      <div className="photo-card-info">
        <div className="photo-likes">
          <span className="likes-count">
            {photo.likes || 0} {(photo.likes || 0) === 1 ? 'like' : 'likes'}
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
        <button onClick={handleDownload} className="btn-download">
          Download
        </button>
      </div>
    </div>
  )
}

export default PhotoCard
