import { useCallback } from 'react'

function usePhotoCapture(videoRef) {
  const capturePhoto = useCallback(() => {
    if (!videoRef.current) {
      console.error('Video reference not available')
      return null
    }

    const video = videoRef.current
    const canvas = document.createElement('canvas')
    canvas.width = video.videoWidth
    canvas.height = video.videoHeight

    const context = canvas.getContext('2d')
    context.drawImage(video, 0, 0, canvas.width, canvas.height)

    // Convert canvas to data URL
    const dataUrl = canvas.toDataURL('image/png')

    return dataUrl
  }, [videoRef])

  return { capturePhoto }
}

export default usePhotoCapture
