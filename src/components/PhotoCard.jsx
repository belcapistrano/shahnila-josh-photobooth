import { useState } from 'react'

function PhotoCard({ photo, onDelete, onLike }) {
  // Use downloadURL from Firebase or dataUrl as fallback
  const imageUrl = photo.downloadURL || photo.dataUrl
  const [isLiked, setIsLiked] = useState(false)
  const [isAnimating, setIsAnimating] = useState(false)

  const handleLike = () => {
    if (onLike) {
      onLike(photo.id)
      setIsLiked(!isLiked)

      // Trigger animation
      setIsAnimating(true)
      setTimeout(() => setIsAnimating(false), 300)
    }
  }

  const handleDownload = () => {
    const link = document.createElement('a')
    link.href = imageUrl
    link.download = `photobooth-${photo.id}.png`
    link.target = '_blank'
    link.rel = 'noopener noreferrer'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const handleShare = async () => {
    try {
      // Convert URL to blob
      const response = await fetch(imageUrl)
      const blob = await response.blob()
      const file = new File([blob], `photobooth-${photo.id}.png`, { type: 'image/png' })

      // Check if Web Share API is supported
      if (navigator.share && navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({
          files: [file],
          title: 'Shahnila & Josh Wedding Photo',
          text: 'Photo from the wedding photobooth!'
        })
      } else {
        // Fallback to download if share not supported
        handleDownload()
      }
    } catch (error) {
      // User cancelled or error occurred, fallback to download
      if (error.name !== 'AbortError') {
        console.log('Share failed, downloading instead')
        handleDownload()
      }
    }
  }

  const handleDelete = () => {
    if (onDelete) {
      onDelete(photo.id, photo.storagePath)
    }
  }

  return (
    <div className="photo-card">
      <div className="photo-card-image-container">
        <img src={imageUrl} alt={`Photo taken at ${photo.timestamp}`} />
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
          <span className="likes-count">{photo.likes || 0} likes</span>
        </div>
      </div>
      <div className="photo-card-actions">
        <button onClick={handleShare} className="btn-download">
          Save
        </button>
        <button onClick={handleDelete} className="btn-delete">
          Delete
        </button>
      </div>
    </div>
  )
}

export default PhotoCard
