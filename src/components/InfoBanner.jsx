function InfoBanner({ onClose }) {
  return (
    <div className="info-banner">
      <div className="info-banner-content">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10"></circle>
          <line x1="12" y1="16" x2="12" y2="12"></line>
          <line x1="12" y1="8" x2="12.01" y2="8"></line>
        </svg>
        <p>
          All photos are shared publicly! By default, the photobooth captures 1 photo. You can switch to 3-photo mode using the toggle button (1x/3x). In 3-photo mode, the photobooth captures photos in a row with a countdown between each shot. When you're ready, strike a pose and let's create beautiful memories together!
        </p>
        <button className="info-banner-close" onClick={onClose} aria-label="Close banner">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
          </svg>
        </button>
      </div>
    </div>
  )
}

export default InfoBanner
