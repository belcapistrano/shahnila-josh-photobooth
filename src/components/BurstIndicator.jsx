function BurstIndicator({ currentPhoto, totalPhotos, isActive }) {
  if (!isActive) {
    return null
  }

  return (
    <div className="burst-indicator">
      <div className="burst-text">
        Photo {currentPhoto} of {totalPhotos}
      </div>
      <div className="burst-dots">
        {Array.from({ length: totalPhotos }).map((_, index) => (
          <div
            key={index}
            className={`burst-dot ${index < currentPhoto ? 'captured' : ''}`}
          />
        ))}
      </div>
    </div>
  )
}

export default BurstIndicator
