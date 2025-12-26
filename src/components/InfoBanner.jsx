function InfoBanner() {
  return (
    <div className="info-banner">
      <div className="info-banner-content">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10"></circle>
          <line x1="12" y1="16" x2="12" y2="12"></line>
          <line x1="12" y1="8" x2="12.01" y2="8"></line>
        </svg>
        <p>
          All photos are shared publicly! When you capture a photo, everyone at the wedding can view it in the gallery. Let's create beautiful memories together!
        </p>
      </div>
    </div>
  )
}

export default InfoBanner
