import PhotoCard from './PhotoCard'
import useLikedPhotos from '../hooks/useLikedPhotos'

function PhotoGallery({ photos, onDelete, onClearAll, onLike, isUsingFirebase }) {
  const { isPhotoLiked, toggleLike } = useLikedPhotos()
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
      </div>
      <div className="gallery-grid">
        {photos.map(photo => (
          <PhotoCard
            key={photo.id}
            photo={photo}
            onLike={onLike}
            isLiked={isPhotoLiked(photo.id)}
            onToggleLike={toggleLike}
          />
        ))}
      </div>
    </div>
  )
}

export default PhotoGallery
