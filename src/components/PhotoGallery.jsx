import PhotoCard from './PhotoCard'

function PhotoGallery({ photos, onDelete, onClearAll }) {
  if (photos.length === 0) {
    return (
      <div className="gallery-empty">
        <p>No photos yet. Capture your first photo!</p>
      </div>
    )
  }

  return (
    <div className="photo-gallery">
      <div className="gallery-header">
        <h2>Gallery ({photos.length})</h2>
        <button onClick={onClearAll} className="btn-clear-all">
          Clear All
        </button>
      </div>
      <div className="gallery-grid">
        {photos.map(photo => (
          <PhotoCard
            key={photo.id}
            photo={photo}
            onDelete={onDelete}
          />
        ))}
      </div>
    </div>
  )
}

export default PhotoGallery
