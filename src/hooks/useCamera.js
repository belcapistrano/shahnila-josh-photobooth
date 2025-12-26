import { useState, useEffect } from 'react'

function useCamera(videoRef) {
  const [stream, setStream] = useState(null)
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let currentStream = null

    const startCamera = async () => {
      try {
        setLoading(true)
        setError(null)

        const mediaStream = await navigator.mediaDevices.getUserMedia({
          video: {
            width: { ideal: 1280 },
            height: { ideal: 720 },
            facingMode: 'user'
          },
          audio: false
        })

        currentStream = mediaStream

        if (videoRef.current) {
          const video = videoRef.current
          console.log('Setting video srcObject, video element:', video)
          console.log('MediaStream tracks:', mediaStream.getTracks())

          video.srcObject = mediaStream

          // Wait for video metadata to load before playing
          const playVideo = () => {
            console.log('Video metadata loaded, attempting to play')
            video.play()
              .then(() => {
                console.log('Video playing successfully')
              })
              .catch(err => {
                console.error('Error playing video:', err)
              })
          }

          // If metadata already loaded, play immediately
          if (video.readyState >= 2) {
            playVideo()
          } else {
            // Otherwise wait for metadata
            video.addEventListener('loadedmetadata', playVideo, { once: true })
          }
        }

        setStream(mediaStream)
        setLoading(false)
      } catch (err) {
        console.error('Error accessing camera:', err)
        let errorMessage = 'Failed to access camera'

        if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
          errorMessage = 'Camera permission denied. Please allow camera access in your browser settings.'
        } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
          errorMessage = 'No camera found. Please connect a camera and try again.'
        } else if (err.name === 'NotReadableError' || err.name === 'TrackStartError') {
          errorMessage = 'Camera is already in use by another application.'
        } else if (err.name === 'OverconstrainedError') {
          errorMessage = 'Camera does not support the requested settings.'
        } else if (err.name === 'NotSupportedError') {
          errorMessage = 'Camera access not supported. Make sure you are using HTTPS.'
        } else if (err.name === 'TypeError') {
          errorMessage = 'Camera API not available. Make sure you are using HTTPS.'
        }

        setError(errorMessage)
        setLoading(false)
      }
    }

    startCamera()

    // Cleanup function
    return () => {
      if (currentStream) {
        currentStream.getTracks().forEach(track => track.stop())
      }
    }
  }, [videoRef])

  return { stream, error, loading }
}

export default useCamera
