function PhotoCard({ photo, onDelete }) {
  const handleDownload = () => {
    const link = document.createElement('a')
    link.href = photo.dataUrl
    link.download = `photobooth-${photo.id}.png`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const handleShare = async () => {
    try {
      // Convert data URL to blob
      const response = await fetch(photo.dataUrl)
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
      onDelete(photo.id)
    }
  }

  return (
    <div className="photo-card">
      <img src={photo.dataUrl} alt={`Photo taken at ${photo.timestamp}`} />
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
