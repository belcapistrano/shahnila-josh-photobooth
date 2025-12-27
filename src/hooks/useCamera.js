import { useState, useEffect, useRef } from 'react'

function useCamera(videoRef, facingMode = 'user') {
  const [stream, setStream] = useState(null)
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(true)
  const streamRef = useRef(null)

  useEffect(() => {
    let currentStream = null
    let mounted = true
    let startAttempts = 0
    const MAX_RETRIES = 3

    const stopCurrentStream = () => {
      if (currentStream) {
        currentStream.getTracks().forEach(track => {
          track.stop()
        })
        currentStream = null
      }
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => {
          track.stop()
        })
        streamRef.current = null
      }
    }

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

        // Stop any existing streams first
        stopCurrentStream()

        setLoading(true)
        setError(null)

        console.log(`Starting camera (attempt ${startAttempts + 1}/${MAX_RETRIES})...`)

        const mediaStream = await navigator.mediaDevices.getUserMedia({
          video: {
            width: { ideal: 1280 },
            height: { ideal: 720 },
            facingMode: facingMode
          },
          audio: false
        })

        startAttempts = 0 // Reset on success

        currentStream = mediaStream
        streamRef.current = mediaStream

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

          // Handle stream ending unexpectedly (mobile browser suspension)
          mediaStream.getTracks().forEach(track => {
            track.addEventListener('ended', () => {
              if (mounted) {
                console.log('Camera track ended, attempting restart...')
                setTimeout(() => {
                  if (mounted && !streamRef.current?.active) {
                    startCamera()
                  }
                }, 500)
              }
            })
          })
        }

        if (mounted) {
          setStream(mediaStream)
          setLoading(false)
          console.log('Camera started successfully')
        }
      } catch (err) {
        console.error('Error accessing camera:', err)
        startAttempts++

        // Retry on certain errors if we haven't exceeded max retries
        const shouldRetry = (
          (err.name === 'NotReadableError' || err.name === 'TrackStartError' || err.name === 'AbortError') &&
          startAttempts < MAX_RETRIES &&
          mounted
        )

        if (shouldRetry) {
          console.log(`Retrying camera start in 1 second... (${startAttempts}/${MAX_RETRIES})`)
          setTimeout(() => {
            if (mounted) startCamera()
          }, 1000)
          return
        }

        // Show error message
        let errorMessage = 'Failed to access camera'

        if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
          errorMessage = 'Camera permission denied. Please allow camera access in your browser settings.'
        } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
          errorMessage = 'No camera found. Please connect a camera and try again.'
        } else if (err.name === 'NotReadableError' || err.name === 'TrackStartError') {
          errorMessage = 'Camera is already in use by another application. Please close other apps using the camera and try again.'
        } else if (err.name === 'OverconstrainedError') {
          errorMessage = 'Camera does not support the requested settings.'
        } else if (err.name === 'NotSupportedError') {
          errorMessage = 'Camera access not supported. Make sure you are using HTTPS.'
        } else if (err.name === 'TypeError') {
          errorMessage = 'Camera API not available. Make sure you are using HTTPS.'
        } else if (err.name === 'AbortError') {
          errorMessage = 'Camera request was aborted. Please try again.'
        }

        if (mounted) {
          setError(errorMessage)
          setLoading(false)
        }
      }
    }

    // Handle visibility change to restart camera on mobile
    const handleVisibilityChange = () => {
      if (!document.hidden && mounted) {
        // Page became visible again
        // Check if stream is still active
        const isStreamActive = streamRef.current?.active
        if (!isStreamActive) {
          console.log('Camera stream inactive, restarting...')
          startCamera()
        } else if (videoRef.current && !videoRef.current.srcObject) {
          // Video element lost its stream, reconnect
          console.log('Video element lost stream, reconnecting...')
          if (streamRef.current) {
            videoRef.current.srcObject = streamRef.current
            videoRef.current.play().catch(err => {
              console.error('Error replaying video:', err)
              startCamera()
            })
          }
        }
      }
    }

    startCamera()

    // Listen for visibility changes
    document.addEventListener('visibilitychange', handleVisibilityChange)

    // Cleanup function
    return () => {
      mounted = false
      console.log('Camera component unmounting, cleaning up streams...')
      document.removeEventListener('visibilitychange', handleVisibilityChange)
      stopCurrentStream()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [facingMode])

  return { stream, error, loading }
}

export default useCamera
