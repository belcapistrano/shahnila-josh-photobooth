function PhotoCard({ photo, onDelete }) {
  // Use downloadURL from Firebase or dataUrl as fallback
  const imageUrl = photo.downloadURL || photo.dataUrl

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
      <img src={imageUrl} alt={`Photo taken at ${photo.timestamp}`} crossOrigin="anonymous" />
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
