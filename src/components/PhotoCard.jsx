function PhotoCard({ photo, onDelete }) {
  const handleDownload = () => {
    const link = document.createElement('a')
    link.href = photo.dataUrl
    link.download = `photobooth-${photo.id}.png`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
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
        <button onClick={handleDownload} className="btn-download">
          Download
        </button>
        <button onClick={handleDelete} className="btn-delete">
          Delete
        </button>
      </div>
    </div>
  )
}

export default PhotoCard
