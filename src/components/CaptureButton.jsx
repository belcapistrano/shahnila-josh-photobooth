function CaptureButton({ onClick, disabled }) {
  return (
    <button
      className="capture-button"
      onClick={onClick}
      disabled={disabled}
      aria-label="Capture photo"
    >
      <div className="capture-button-content">
        <div className="capture-button-inner" />
        <span className="capture-button-label">Start</span>
      </div>
    </button>
  )
}

export default CaptureButton
