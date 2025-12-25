function FrameOverlay({ frameType }) {
  if (frameType === 'none') {
    return null
  }

  return (
    <div className={`frame-overlay frame-${frameType}`}>
      {frameType === 'hearts' && (
        <>
          <div className="frame-corner frame-top-left">♥</div>
          <div className="frame-corner frame-top-right">♥</div>
          <div className="frame-corner frame-bottom-left">♥</div>
          <div className="frame-corner frame-bottom-right">♥</div>
          <div className="frame-hearts-scatter">
            {Array.from({ length: 12 }).map((_, i) => (
              <span key={i} className={`heart-scatter heart-${i}`}>♥</span>
            ))}
          </div>
        </>
      )}

      {frameType === 'flowers' && (
        <>
          <div className="frame-corner frame-top-left">✿</div>
          <div className="frame-corner frame-top-right">✿</div>
          <div className="frame-corner frame-bottom-left">✿</div>
          <div className="frame-corner frame-bottom-right">✿</div>
          <div className="frame-flowers-scatter">
            {Array.from({ length: 8 }).map((_, i) => (
              <span key={i} className={`flower-scatter flower-${i}`}>✿</span>
            ))}
          </div>
        </>
      )}

      {frameType === 'elegant' && (
        <>
          <div className="frame-border-elegant">
            <div className="elegant-corner elegant-top-left"></div>
            <div className="elegant-corner elegant-top-right"></div>
            <div className="elegant-corner elegant-bottom-left"></div>
            <div className="elegant-corner elegant-bottom-right"></div>
          </div>
        </>
      )}

      {frameType === 'sparkles' && (
        <>
          <div className="frame-sparkles-scatter">
            {Array.from({ length: 15 }).map((_, i) => (
              <span key={i} className={`sparkle-scatter sparkle-${i}`}>✨</span>
            ))}
          </div>
        </>
      )}
    </div>
  )
}

export default FrameOverlay
