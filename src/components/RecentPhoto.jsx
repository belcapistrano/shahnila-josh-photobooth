function RecentPhoto({ photo, onShare, onDelete }) {
  if (!photo) return null

  const handleShare = async () => {
    try {
      const response = await fetch(photo.dataUrl)
      const blob = await response.blob()
      const file = new File([blob], `photobooth-${photo.id}.png`, { type: 'image/png' })

      if (navigator.share && navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({
          files: [file],
          title: 'Shahnila & Josh Wedding Photo',
          text: 'Photo from the wedding photobooth!'
        })
      } else {
        // Fallback to download
        const link = document.createElement('a')
        link.href = photo.dataUrl
        link.download = `photobooth-${photo.id}.png`
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
      }
    } catch (error) {
      if (error.name !== 'AbortError') {
        console.log('Share failed, downloading instead')
        const link = document.createElement('a')
        link.href = photo.dataUrl
        link.download = `photobooth-${photo.id}.png`
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
      }
    }
  }

  const handleDelete = () => {
    if (onDelete) {
      onDelete(photo.id)
    }
  }

  return (
    <div className="recent-photo-container">
      <div className="recent-photo-header">
        <h3>Your Photo Strip!</h3>
        <p>Share it or find it in the gallery</p>
      </div>
      <div className="recent-photo-content">
        <img src={photo.dataUrl} alt="Recently captured photo strip" />
        <div className="recent-photo-actions">
          <button onClick={handleShare} className="btn-share-recent">
            Share Photo
          </button>
          <button onClick={handleDelete} className="btn-delete-recent">
            Delete
          </button>
        </div>
      </div>
    </div>
  )
}

export default RecentPhoto
