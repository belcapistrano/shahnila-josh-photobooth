import { useState, useRef, useEffect } from 'react'
import { challenges } from '../data/challenges'

function PhotoChallengeSpinner({ onTakePhoto }) {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isShuffling, setIsShuffling] = useState(false)
  const [activeCategory, setActiveCategory] = useState(null)
  const [hasShuffled, setHasShuffled] = useState(false)
  const [soundEnabled, setSoundEnabled] = useState(true)
  const audioContext = useRef(null)
  const trackRef = useRef(null)

  useEffect(() => {
    // Initialize Web Audio API
    if (typeof window !== 'undefined' && !audioContext.current) {
      audioContext.current = new (window.AudioContext || window.webkitAudioContext)()
    }
  }, [])

  const playTickSound = () => {
    if (!soundEnabled || !audioContext.current) return

    const ctx = audioContext.current
    const oscillator = ctx.createOscillator()
    const gainNode = ctx.createGain()

    oscillator.connect(gainNode)
    gainNode.connect(ctx.destination)

    oscillator.type = 'sine'
    oscillator.frequency.value = 600 + Math.random() * 200
    gainNode.gain.value = 0.06

    oscillator.start()
    oscillator.stop(ctx.currentTime + 0.05)
  }

  const playLandingSound = () => {
    if (!soundEnabled || !audioContext.current) return

    const ctx = audioContext.current
    const notes = [523, 659, 784] // C5, E5, G5

    notes.forEach((freq, index) => {
      const oscillator = ctx.createOscillator()
      const gainNode = ctx.createGain()

      oscillator.connect(gainNode)
      gainNode.connect(ctx.destination)

      oscillator.type = 'sine'
      oscillator.frequency.value = freq
      gainNode.gain.value = 0.08

      const startTime = ctx.currentTime + (index * 0.08)
      oscillator.start(startTime)
      oscillator.stop(startTime + 0.4)
    })
  }

  const shuffle = () => {
    if (isShuffling) return

    setIsShuffling(true)
    setActiveCategory(null)
    setHasShuffled(true)

    const baseSpeed = 8
    const cycles = 1 + Math.random() * 0.3
    const totalCards = challenges.length
    const targetIndex = Math.floor(Math.random() * totalCards)
    const totalSteps = Math.floor(cycles * totalCards) + targetIndex

    let currentStep = 0
    let stepIndex = currentIndex

    const animate = () => {
      if (currentStep >= totalSteps) {
        setCurrentIndex(targetIndex)
        setActiveCategory(challenges[targetIndex].category)
        setIsShuffling(false)
        playLandingSound()
        return
      }

      const progress = currentStep / totalSteps
      const easeOut = 1 - Math.pow(1 - progress, 4)
      const delay = baseSpeed + (easeOut * 40)

      stepIndex = (stepIndex + 1) % totalCards
      setCurrentIndex(stepIndex)
      playTickSound()
      currentStep++

      setTimeout(animate, delay)
    }

    animate()
  }

  const getVisibleCards = () => {
    const visible = []
    for (let i = -2; i <= 2; i++) {
      const index = (currentIndex + i + challenges.length) % challenges.length
      visible.push({ ...challenges[index], index, offset: i })
    }
    return visible
  }

  return (
    <div className="photo-challenge-spinner">
      {/* Decorative corner accents */}
      <div className="corner-accent corner-tl"></div>
      <div className="corner-accent corner-tr"></div>
      <div className="corner-accent corner-bl"></div>
      <div className="corner-accent corner-br"></div>

      {/* Background gradient blobs */}
      <div className="gradient-blob blob-1"></div>
      <div className="gradient-blob blob-2"></div>

      {/* Floating particles */}
      <div className="floating-particles">
        {[...Array(12)].map((_, i) => (
          <div key={i} className="particle" style={{
            left: `${Math.random() * 100}%`,
            animationDelay: `${Math.random() * 5}s`,
            animationDuration: `${8 + Math.random() * 4}s`
          }}></div>
        ))}
      </div>

      {/* Sound toggle */}
      <button
        className="sound-toggle"
        onClick={() => setSoundEnabled(!soundEnabled)}
        aria-label="Toggle sound"
      >
        {soundEnabled ? '🔊' : '🔇'}
      </button>

      {/* Header */}
      <div className="challenge-header">
        <h2>Photo Challenge</h2>
        <div className="header-line"></div>
      </div>

      {/* Card carousel */}
      {(hasShuffled || isShuffling) && (
        <div className="carousel-container">
          <div className="carousel-fade-left"></div>
          <div className="carousel-fade-right"></div>
          <div className="card-track" ref={trackRef}>
            {getVisibleCards().map((challenge, idx) => (
              <div
                key={`${challenge.index}-${idx}`}
                className={`challenge-card ${challenge.offset === 0 ? 'active' : ''}`}
                style={{
                  transform: `translateX(${challenge.offset * 110}%)`,
                  opacity: Math.abs(challenge.offset) > 1 ? 0.3 : 1,
                  zIndex: 10 - Math.abs(challenge.offset)
                }}
              >
                <div className="card-accent-bar"></div>
                <div className="card-category">
                  <span className="category-line"></span>
                  {challenge.category}
                  <span className="category-line"></span>
                </div>
                <div className="card-emoji">{challenge.emoji}</div>
                <p className="card-text">{challenge.text}</p>
                <div className="card-number">
                  {String(challenge.index + 1).padStart(2, '0')}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Shuffle button */}
      {!activeCategory && (
        <div className="shuffle-section">
          {!isShuffling && (
            <div className="shuffle-hint">
              <span className="hint-arrow">👇</span>
              <span className="hint-text">Click to get your challenge!</span>
            </div>
          )}
          <button
            className="shuffle-button"
            onClick={shuffle}
            disabled={isShuffling}
          >
            {isShuffling ? 'Shuffling...' : 'Shuffle'}
          </button>
        </div>
      )}

      {/* Challenge Instructions */}
      {!isShuffling && activeCategory && (
        <div className="challenge-instructions">
          <div className="instructions-header">
            <div className="instructions-icon">📸</div>
            <h3>Your Challenge Awaits!</h3>
          </div>

          <div className="instructions-steps">
            <div className="instruction-step">
              <div className="step-number">1</div>
              <div className="step-content">
                <h4 className="step-title">Read Your Challenge</h4>
                <ul className="step-bullets">
                  <li className="step-text">
                    {challenges[currentIndex].context || 'Capture this moment and make it unforgettable!'}
                  </li>
                  <li className="step-text">
                    <strong>Category:</strong> {challenges[currentIndex].category}
                  </li>
                  <li className="step-text">
                    <strong>Tip:</strong> Be creative and have fun with your interpretation!
                  </li>
                </ul>
              </div>
            </div>

            <div className="instruction-step">
              <div className="step-number">2</div>
              <div className="step-content">
                <h4 className="step-title">Get Ready</h4>
                <ul className="step-bullets">
                  <li className="step-text">
                    Find a <strong>good spot</strong> with proper lighting
                  </li>
                  <li className="step-text">
                    Gather any <strong>props</strong> or people you need
                  </li>
                  <li className="step-text">
                    <strong>Practice</strong> your pose or expression
                  </li>
                </ul>
              </div>
            </div>

            <div className="instruction-step">
              <div className="step-number">3</div>
              <div className="step-content">
                <h4 className="step-title">Take Your Photo</h4>
                <ul className="step-bullets">
                  <li className="step-text">
                    Click <strong>"Take Photo"</strong> below to open the camera
                  </li>
                  <li className="step-text">
                    Add <strong>frames & stickers</strong> if you want
                  </li>
                  <li className="step-text">
                    <strong>Capture</strong> your moment and share it!
                  </li>
                </ul>
              </div>
            </div>
          </div>

          <div className="challenge-actions">
            <button className="action-button primary" onClick={onTakePhoto}>
              <span className="action-icon">📷</span>
              Take Photo
            </button>
            <button className="action-button secondary" onClick={shuffle}>
              <span className="action-icon">🔄</span>
              Reshuffle
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

export default PhotoChallengeSpinner
