import { useState } from 'react'

function NikahGallery() {
  const [isLoading, setIsLoading] = useState(true)
  const galleryUrl = 'https://carolhabs.pixieset.com/shahnilaandjoshuanikah/'

  const handleIframeLoad = () => {
    setIsLoading(false)
  }

  return (
    <div className="nikah-gallery">
      <div className="nikah-header">
        <h2>Nikah Ceremony</h2>
        <p className="nikah-subtitle">View the beautiful moments from Shahnila & Josh's Nikah</p>
        <a
          href={galleryUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="nikah-open-link"
        >
          🔗 Open in New Window
        </a>
      </div>

      {isLoading && (
        <div className="nikah-loading">
          <div className="loading-spinner"></div>
          <p>Loading Nikah gallery...</p>
        </div>
      )}

      <div className="nikah-embed-container">
        <iframe
          src={galleryUrl}
          title="Nikah Ceremony Gallery"
          className="nikah-iframe"
          onLoad={handleIframeLoad}
          frameBorder="0"
          allowFullScreen
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        />
      </div>
    </div>
  )
}

export default NikahGallery
