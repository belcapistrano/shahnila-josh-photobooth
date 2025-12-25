function CaptureButton({ onClick, disabled }) {
  return (
    <button
      className="capture-button"
      onClick={onClick}
      disabled={disabled}
      aria-label="Capture photo"
    >
      <div className="capture-button-inner" />
    </button>
  )
}

export default CaptureButton
