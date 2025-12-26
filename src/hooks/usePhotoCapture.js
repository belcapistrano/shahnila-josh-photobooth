import { useCallback } from 'react'

function usePhotoCapture(videoRef, shouldMirror = false) {
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

    // If the video is mirrored (front camera), flip the captured image back to normal
    if (shouldMirror) {
      context.translate(canvas.width, 0)
      context.scale(-1, 1)
    }

    context.drawImage(video, 0, 0, canvas.width, canvas.height)

    // Convert canvas to data URL
    const dataUrl = canvas.toDataURL('image/png')

    return dataUrl
  }, [videoRef, shouldMirror])

  return { capturePhoto }
}

export default usePhotoCapture
