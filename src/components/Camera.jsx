import { useRef, useState } from 'react'
import useCamera from '../hooks/useCamera'
import useCaptureWithOverlays from '../hooks/useCaptureWithOverlays'
import useCountdown from '../hooks/useCountdown'
import useShutterSound from '../hooks/useShutterSound'
import CaptureButton from './CaptureButton'
import CountdownTimer from './CountdownTimer'
import FlashEffect from './FlashEffect'
import FramesAndStickers from './FramesAndStickers'
import FrameOverlay from './FrameOverlay'
import DraggableSticker from './DraggableSticker'
import BurstIndicator from './BurstIndicator'
import PhotoPreview from './PhotoPreview'
import { combinePhotosIntoStrip } from '../utils/photoStrip'

const BURST_COUNT = 3
const BURST_DELAY = 3000 // milliseconds between burst photos
const BURST_COUNTDOWN = 3 // countdown seconds between photos
const PREVIEW_DURATION = 1000 // milliseconds to show preview

function Camera({ onCapture }) {
  const videoRef = useRef(null)
  const previewRef = useRef(null)
  const { stream, error, loading } = useCamera(videoRef)
  const { captureWithOverlays } = useCaptureWithOverlays(videoRef, previewRef)
  const { count, isActive, startCountdown, cancelCountdown } = useCountdown(3)
  const { playShutter } = useShutterSound()
  const [flashTrigger, setFlashTrigger] = useState(0)
  const [selectedFrame, setSelectedFrame] = useState('none')
  const [stickers, setStickers] = useState([])
  const [burstActive, setBurstActive] = useState(false)
  const [burstProgress, setBurstProgress] = useState(0)
  const [burstCountdown, setBurstCountdown] = useState(0)
  const [previewPhoto, setPreviewPhoto] = useState(null)
  const [showPreview, setShowPreview] = useState(false)

  const handleAddSticker = (sticker) => {
    const newSticker = {
      ...sticker,
      instanceId: Date.now() + Math.random()
    }
    setStickers(prev => [...prev, newSticker])
  }

  const handleRemoveSticker = (instanceId) => {
    setStickers(prev => prev.filter(s => s.instanceId !== instanceId))
  }

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

      // Capture photo with overlays
      const photoData = captureWithOverlays()
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

  if (loading) {
    return <div className="camera-loading">Loading camera...</div>
  }

  if (error) {
    return <div className="camera-error">Error: {error}</div>
  }

  return (
    <div className="camera-container">
      <FramesAndStickers
        selectedFrame={selectedFrame}
        onFrameChange={setSelectedFrame}
        onAddSticker={handleAddSticker}
      />
      <div className="camera-preview" ref={previewRef}>
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className="camera-video"
        />
        <FrameOverlay frameType={selectedFrame} />
        {stickers.map(sticker => (
          <DraggableSticker
            key={sticker.instanceId}
            sticker={sticker}
            onRemove={handleRemoveSticker}
            containerRef={previewRef}
          />
        ))}
        <CountdownTimer count={count || burstCountdown} isActive={isActive || burstCountdown > 0} />
        <FlashEffect trigger={flashTrigger} />
        <BurstIndicator
          currentPhoto={burstProgress}
          totalPhotos={BURST_COUNT}
          isActive={burstActive && burstCountdown === 0 && !showPreview}
        />
        <PhotoPreview photoData={previewPhoto} isVisible={showPreview} />
      </div>
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
      </div>
    </div>
  )
}

export default Camera
