import { useState, useEffect } from 'react'

function useCamera(videoRef, facingMode = 'user') {
  const [stream, setStream] = useState(null)
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let currentStream = null
    let mounted = true

    const startCamera = async () => {
      try {
        // Wait for video element to be available
        if (!videoRef.current) {
          // Retry after a short delay
          setTimeout(() => {
            if (mounted) startCamera()
          }, 100)
          return
        }

        setLoading(true)
        setError(null)

        const mediaStream = await navigator.mediaDevices.getUserMedia({
          video: {
            width: { ideal: 1280 },
            height: { ideal: 720 },
            facingMode: facingMode
          },
          audio: false
        })

        currentStream = mediaStream

        if (videoRef.current && mounted) {
          const video = videoRef.current
          video.srcObject = mediaStream

          // Wait for video metadata to load before playing
          const playVideo = () => {
            video.play().catch(err => {
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

        if (mounted) {
          setStream(mediaStream)
          setLoading(false)
        }
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
      mounted = false
      if (currentStream) {
        currentStream.getTracks().forEach(track => track.stop())
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [facingMode])

  return { stream, error, loading }
}

export default useCamera
