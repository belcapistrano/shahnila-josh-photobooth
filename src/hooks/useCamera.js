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
          videoRef.current.srcObject = mediaStream
        }

        setStream(mediaStream)
        setLoading(false)
      } catch (err) {
        console.error('Error accessing camera:', err)
        setError(err.message || 'Failed to access camera')
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
