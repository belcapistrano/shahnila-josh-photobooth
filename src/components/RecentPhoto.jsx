function RecentPhoto({ photo, onSave, onDelete }) {
  if (!photo) return null

  // Use dataUrl if available (for recent photos), otherwise use downloadURL
  const imageUrl = photo.dataUrl || photo.downloadURL

  const handleShare = async () => {
    // Save to gallery first if not already saved
    if (photo.isPending && onSave) {
      await onSave()
    }

    try {
      const response = await fetch(imageUrl)
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
        link.href = imageUrl
        link.download = `photobooth-${photo.id}.png`
        link.target = '_blank'
        link.rel = 'noopener noreferrer'
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
      }
    } catch (error) {
      if (error.name !== 'AbortError') {
        console.log('Share failed, downloading instead')
        const link = document.createElement('a')
        link.href = imageUrl
        link.download = `photobooth-${photo.id}.png`
        link.target = '_blank'
        link.rel = 'noopener noreferrer'
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
      }
    }
  }

  const handleDelete = () => {
    if (onDelete) {
      onDelete()
    }
  }

  const handleSaveToGallery = async () => {
    if (photo.isPending && onSave) {
      await onSave()
    }
  }

  return (
    <div className="recent-photo-container">
      <div className="recent-photo-header">
        <h3>Your Photo Strip!</h3>
        <p>{photo.isPending ? 'Save to gallery or discard' : 'Share it or find it in the gallery'}</p>
      </div>
      <div className="recent-photo-content">
        <img src={imageUrl} alt="Recently captured photo strip" />
        <div className="recent-photo-actions">
          {photo.isPending ? (
            <>
              <button onClick={handleSaveToGallery} className="btn-save-recent">
                Save to Gallery
              </button>
              <button onClick={handleShare} className="btn-share-recent">
                Share
              </button>
              <button onClick={handleDelete} className="btn-delete-recent">
                Discard
              </button>
            </>
          ) : (
            <>
              <button onClick={handleShare} className="btn-share-recent">
                Share Photo
              </button>
              <button onClick={handleDelete} className="btn-delete-recent">
                Delete
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

export default RecentPhoto
