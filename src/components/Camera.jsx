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

function Camera({ onCapture }) {
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
        {isActive && !burstActive && (
          <button onClick={handleCancelCountdown} className="cancel-button">
            Cancel
          </button>
        )}
        <CaptureButton
          onClick={handleCapture}
          disabled={!stream || isActive || burstActive}
        />
        {!isActive && !burstActive && (
          <button
            onClick={handleFlipCamera}
            className="flip-camera-button"
            disabled={loading}
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
              <path d="M9 13c0-1.65 1.35-3 3-3s3 1.35 3 3-1.35 3-3 3-3-1.35-3-3z"/>
              <path d="M17.65 6.35C16.2 4.9 14.21 4 12 4c-4.42 0-7.99 3.58-7.99 8s3.57 8 7.99 8c3.73 0 6.84-2.55 7.73-6h-2.08c-.82 2.33-3.04 4-5.65 4-3.31 0-6-2.69-6-6s2.69-6 6-6c1.66 0 3.14.69 4.22 1.78L13 11h7V4l-2.35 2.35z"/>
            </svg>
          </button>
        )}
      </div>
    </div>
  )
}

export default Camera
