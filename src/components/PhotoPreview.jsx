function PhotoPreview({ photoData, isVisible }) {
  if (!isVisible || !photoData) {
    return null
  }

  return (
    <div className="photo-preview-overlay">
      <div className="photo-preview-container">
        <img src={photoData} alt="Captured preview" className="photo-preview-image" />
      </div>
    </div>
  )
}

export default PhotoPreview
