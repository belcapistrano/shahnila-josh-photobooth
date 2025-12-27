import { forwardRef } from 'react'

const RecentPhoto = forwardRef(function RecentPhoto({ photo, onSave, onDelete, isUploading }, ref) {
  if (!photo) return null

  // Use dataUrl if available (for recent photos), otherwise use downloadURL
  const imageUrl = photo.dataUrl || photo.downloadURL

  const handleShare = async () => {
    // Save to gallery first if not already saved
    if (photo.isPending && onSave) {
      await onSave()
    }

    try {
      const response = await fetch(imageUrl, { mode: 'cors' })
      const blob = await response.blob()

      // For mobile devices, use Web Share API
      if (navigator.share) {
        const filesArray = []

        // Try to create File object
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
        const blobUrl = URL.createObjectURL(blob)
        const link = document.createElement('a')
        link.href = blobUrl
        link.download = `shahnila-josh-wedding-${photo.id}.png`
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
        setTimeout(() => URL.revokeObjectURL(blobUrl), 100)
      }
    } catch (error) {
      if (error.name === 'AbortError') {
        console.log('Share cancelled by user')
      } else {
        console.log('Share failed:', error)
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
    <div className="recent-photo-container" ref={ref}>
      <div className="recent-photo-header">
        <h3>Your Photo Strip!</h3>
        <p>{photo.isPending ? 'Save to gallery or discard' : 'Share it or find it in the gallery'}</p>
      </div>
      <div className="recent-photo-content">
        <img src={imageUrl} alt="Recently captured photo strip" />
        <div className="recent-photo-actions">
          {photo.isPending ? (
            <>
              <button
                onClick={handleSaveToGallery}
                className="btn-save-recent"
                disabled={isUploading}
              >
                {isUploading ? (
                  <>
                    <span className="loading-spinner"></span>
                    Saving...
                  </>
                ) : (
                  'Save to Gallery'
                )}
              </button>
              <button
                onClick={handleShare}
                className="btn-share-recent"
                disabled={isUploading}
              >
                Share
              </button>
              <button
                onClick={handleDelete}
                className="btn-delete-recent"
                disabled={isUploading}
              >
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
})

export default RecentPhoto
