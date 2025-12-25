import { useCallback } from 'react'

function useCaptureWithOverlays(videoRef, previewRef) {
  const captureWithOverlays = useCallback(() => {
    if (!videoRef.current || !previewRef.current) {
      console.error('Video or preview reference not available')
      return null
    }

    const video = videoRef.current
    const canvas = document.createElement('canvas')
    canvas.width = video.videoWidth
    canvas.height = video.videoHeight

    const ctx = canvas.getContext('2d')

    // Draw the video frame
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height)

    // Get preview container dimensions for scaling
    const previewRect = previewRef.current.getBoundingClientRect()
    const scaleX = canvas.width / previewRect.width
    const scaleY = canvas.height / previewRect.height

    // Draw frame decorations
    const frameOverlay = previewRef.current.querySelector('.frame-overlay')
    if (frameOverlay) {
      // Draw frame elements (hearts, flowers, etc.)
      const frameElements = frameOverlay.querySelectorAll('.frame-corner, .heart-scatter, .flower-scatter, .sparkle-scatter')
      frameElements.forEach(element => {
        const rect = element.getBoundingClientRect()
        const x = (rect.left - previewRect.left) * scaleX
        const y = (rect.top - previewRect.top) * scaleY
        const text = element.textContent

        ctx.font = `${24 * scaleX}px Arial`
        ctx.fillStyle = '#FF69B4'
        ctx.fillText(text, x, y + 20 * scaleY)
      })

      // Draw elegant borders if present
      const elegantBorder = frameOverlay.querySelector('.frame-border-elegant')
      if (elegantBorder) {
        ctx.strokeStyle = '#FF69B4'
        ctx.lineWidth = 3 * scaleX
        const padding = 15 * scaleX

        // Draw frame border
        ctx.strokeRect(padding, padding, canvas.width - padding * 2, canvas.height - padding * 2)

        // Draw corners
        const cornerSize = 30 * scaleX
        ctx.beginPath()
        // Top-left
        ctx.moveTo(padding, padding + cornerSize)
        ctx.lineTo(padding, padding)
        ctx.lineTo(padding + cornerSize, padding)
        // Top-right
        ctx.moveTo(canvas.width - padding - cornerSize, padding)
        ctx.lineTo(canvas.width - padding, padding)
        ctx.lineTo(canvas.width - padding, padding + cornerSize)
        // Bottom-left
        ctx.moveTo(padding, canvas.height - padding - cornerSize)
        ctx.lineTo(padding, canvas.height - padding)
        ctx.lineTo(padding + cornerSize, canvas.height - padding)
        // Bottom-right
        ctx.moveTo(canvas.width - padding - cornerSize, canvas.height - padding)
        ctx.lineTo(canvas.width - padding, canvas.height - padding)
        ctx.lineTo(canvas.width - padding, canvas.height - padding - cornerSize)
        ctx.stroke()
      }
    }

    // Draw stickers
    const stickers = previewRef.current.querySelectorAll('.draggable-sticker')
    stickers.forEach(stickerElement => {
      const rect = stickerElement.getBoundingClientRect()
      const x = (rect.left - previewRect.left) * scaleX
      const y = (rect.top - previewRect.top) * scaleY

      const emoji = stickerElement.querySelector('.sticker-emoji')
      if (emoji) {
        const fontSize = 48 * scaleX
        ctx.font = `${fontSize}px Arial`
        ctx.fillText(emoji.textContent, x, y + fontSize * 0.8)
      }
    })

    // Convert to data URL
    const dataUrl = canvas.toDataURL('image/png')
    return dataUrl
  }, [videoRef, previewRef])

  return { captureWithOverlays }
}

export default useCaptureWithOverlays
