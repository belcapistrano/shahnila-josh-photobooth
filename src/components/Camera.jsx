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
              <path d="M20 5h-3.2L15 3H9L7.2 5H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2zm-10 13c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5z"/>
              <path d="M10 9c-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4-1.79-4-4-4zm6-3l1.25 1.25L19 5.5V10h-1.5V7.25L16.25 6H18z"/>
            </svg>
          </button>
        )}
      </div>
    </div>
  )
}

export default Camera
