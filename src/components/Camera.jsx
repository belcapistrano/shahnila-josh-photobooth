import { useRef, useState } from 'react'
import useCamera from '../hooks/useCamera'
import usePhotoCapture from '../hooks/usePhotoCapture'
import useCountdown from '../hooks/useCountdown'
import useShutterSound from '../hooks/useShutterSound'
import CaptureButton from './CaptureButton'
import CountdownTimer from './CountdownTimer'
import FlashEffect from './FlashEffect'
import BurstIndicator from './BurstIndicator'
import PhotoPreview from './PhotoPreview'
import { combinePhotosIntoStrip } from '../utils/photoStrip'

const BURST_COUNT = 3
const BURST_DELAY = 3000 // milliseconds between burst photos
const BURST_COUNTDOWN = 3 // countdown seconds between photos
const PREVIEW_DURATION = 1000 // milliseconds to show preview

function Camera({ onCapture, challenge }) {
  const videoRef = useRef(null)
  const [facingMode, setFacingMode] = useState('user') // 'user' for front, 'environment' for back
  const { stream, error, loading } = useCamera(videoRef, facingMode)
  const { capturePhoto } = usePhotoCapture(videoRef, facingMode === 'user')
  const { count, isActive, startCountdown, cancelCountdown } = useCountdown(3)
  const { playShutter } = useShutterSound()
  const [flashTrigger, setFlashTrigger] = useState(0)
  const [burstActive, setBurstActive] = useState(false)
  const [burstProgress, setBurstProgress] = useState(0)
  const [burstCountdown, setBurstCountdown] = useState(0)
  const [previewPhoto, setPreviewPhoto] = useState(null)
  const [showPreview, setShowPreview] = useState(false)

  const waitWithCountdown = async (seconds) => {
    for (let i = seconds; i > 0; i--) {
      setBurstCountdown(i)
      await new Promise(resolve => setTimeout(resolve, 1000))
    }
    setBurstCountdown(0)
  }

  const captureBurstPhotos = async () => {
    const photos = []
    setBurstActive(true)
    setBurstProgress(0)

    for (let i = 0; i < BURST_COUNT; i++) {
      // Update progress
      setBurstProgress(i + 1)

      // Trigger flash and sound
      setFlashTrigger(prev => prev + 1)
      playShutter()

      // Capture photo
      const photoData = capturePhoto()
      if (photoData) {
        photos.push(photoData)

        // Show preview of captured photo
        setPreviewPhoto(photoData)
        setShowPreview(true)
        await new Promise(resolve => setTimeout(resolve, PREVIEW_DURATION))
        setShowPreview(false)
      }

      // Wait with countdown before next photo (except for the last one)
      if (i < BURST_COUNT - 1) {
        await waitWithCountdown(BURST_COUNTDOWN)
      }
    }

    setBurstActive(false)
    setBurstProgress(0)
    setPreviewPhoto(null)

    // Combine photos into strip
    try {
      const stripData = await combinePhotosIntoStrip(photos)
      if (stripData && onCapture) {
        onCapture(stripData, 'none')
      }
    } catch (error) {
      console.error('Error creating photo strip:', error)
    }
  }

  const handleCapture = () => {
    startCountdown(() => {
      captureBurstPhotos()
    })
  }

  const handleCancelCountdown = () => {
    cancelCountdown()
  }

  const handleFlipCamera = () => {
    setFacingMode(prev => prev === 'user' ? 'environment' : 'user')
  }

  return (
    <div className="camera-container">
      {challenge && (
        <div className="challenge-banner">
          <span className="challenge-emoji">{challenge.emoji}</span>
          <span className="challenge-text">{challenge.text}</span>
        </div>
      )}
      {error ? (
        <div className="camera-error">Error: {error}</div>
      ) : (
        <>
          <div className="camera-preview">
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="camera-video"
              style={{
                opacity: loading ? 0.3 : 1,
                transform: facingMode === 'user' ? 'scaleX(-1)' : 'none'
              }}
            />
            {loading && (
              <div style={{
                position: 'absolute',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
                color: 'white',
                fontSize: '18px',
                fontWeight: 'bold',
                textShadow: '0 0 10px rgba(0,0,0,0.8)'
              }}>
                Loading camera...
              </div>
            )}
            <CountdownTimer count={count || burstCountdown} isActive={isActive || burstCountdown > 0} />
            <FlashEffect trigger={flashTrigger} />
            <BurstIndicator
              currentPhoto={burstProgress}
              totalPhotos={BURST_COUNT}
              isActive={burstActive && burstCountdown === 0 && !showPreview}
            />
            <PhotoPreview photoData={previewPhoto} isVisible={showPreview} />
          </div>
        </>
      )}
      <div className="camera-actions">
        {!isActive && !burstActive && (
          <button
            onClick={handleFlipCamera}
            className="flip-camera-button"
            disabled={loading}
          >
            <svg width="32" height="32" viewBox="0 0 32 32" fill="currentColor">
              {/* Top curved arrow - clockwise from left to right */}
              <path d="M 8 12 Q 8 6 16 6 Q 24 6 24 12"
                    stroke="currentColor"
                    strokeWidth="2.5"
                    fill="none"
                    strokeLinecap="round"/>
              <path d="M 24 12 L 26 9 L 23 10 Z" fill="currentColor"/>

              {/* Bottom curved arrow - clockwise from right to left */}
              <path d="M 24 20 Q 24 26 16 26 Q 8 26 8 20"
                    stroke="currentColor"
                    strokeWidth="2.5"
                    fill="none"
                    strokeLinecap="round"/>
              <path d="M 8 20 L 6 23 L 9 22 Z" fill="currentColor"/>

              {/* Camera icon in center */}
              <rect x="12" y="14" width="8" height="5" rx="0.5" fill="currentColor"/>
              <path d="M 14 14 L 15 12.5 L 17 12.5 L 18 14" fill="currentColor"/>
              <circle cx="16" cy="16.5" r="1.5" fill="white"/>
            </svg>
          </button>
        )}
        <CaptureButton
          onClick={handleCapture}
          disabled={!stream || isActive || burstActive}
        />
      </div>
    </div>
  )
}

export default Camera
