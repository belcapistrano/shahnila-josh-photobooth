import PhotoCard from './PhotoCard'

function PhotoGallery({ photos, onDelete, onClearAll, onLike, isUsingFirebase }) {
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
        <div className="gallery-header-left">
          <h2>Gallery ({photos.length})</h2>
          <div className={`storage-indicator ${isUsingFirebase ? 'cloud' : 'local'}`}>
            <span className="storage-icon">{isUsingFirebase ? '☁️' : '💾'}</span>
            <span className="storage-text">{isUsingFirebase ? 'Cloud Storage' : 'Local Storage'}</span>
          </div>
        </div>
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
            onLike={onLike}
          />
        ))}
      </div>
    </div>
  )
}

export default PhotoGallery
