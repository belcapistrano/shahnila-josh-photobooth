/**
 * Combines multiple photo data URLs into a single wedding photo strip with elegant frame
 * @param {string[]} photoDataUrls - Array of photo data URLs
 * @param {number} stripWidth - Width of the photo strip (default: 380)
 * @returns {Promise<string>} Data URL of the combined photo strip
 */
export async function combinePhotosIntoStrip(photoDataUrls, stripWidth = 380) {
  return new Promise((resolve, reject) => {
    const photoCount = photoDataUrls.length
    if (photoCount === 0) {
      reject(new Error('No photos to combine'))
      return
    }

    // Load all images
    const imagePromises = photoDataUrls.map(url => {
      return new Promise((resolveImg, rejectImg) => {
        const img = new Image()
        img.onload = () => resolveImg(img)
        img.onerror = rejectImg
        img.src = url
      })
    })

    Promise.all(imagePromises)
      .then(images => {
        // Calculate dimensions
        const borderWidth = 12
        const innerPadding = 10
        const headerHeight = 85
        const footerHeight = 60
        const photoPadding = 6
        const maxPhotoHeight = 400 // Limit photo height for portrait mode

        const firstImage = images[0]
        const aspectRatio = firstImage.height / firstImage.width
        const photoWidth = stripWidth - (borderWidth * 2) - (innerPadding * 2)
        const calculatedHeight = Math.round(photoWidth * aspectRatio)
        const photoHeight = Math.min(calculatedHeight, maxPhotoHeight)

        // Calculate total height
        const photosHeight = (photoHeight * photoCount) + (photoPadding * (photoCount - 1))
        const totalHeight = headerHeight + photosHeight + footerHeight + (borderWidth * 2) + (innerPadding * 2)

        // Create canvas
        const canvas = document.createElement('canvas')
        canvas.width = stripWidth
        canvas.height = totalHeight
        const ctx = canvas.getContext('2d')

        // Draw decorative border background (beige/brown gradient)
        const gradient = ctx.createLinearGradient(0, 0, 0, totalHeight)
        gradient.addColorStop(0, '#F5F5DC')
        gradient.addColorStop(0.5, '#c9a86c')
        gradient.addColorStop(1, '#F5F5DC')
        ctx.fillStyle = gradient
        ctx.fillRect(0, 0, stripWidth, totalHeight)

        // Draw inner white rectangle
        ctx.fillStyle = 'white'
        ctx.fillRect(borderWidth, borderWidth, stripWidth - (borderWidth * 2), totalHeight - (borderWidth * 2))

        // Draw decorative corners
        ctx.strokeStyle = '#674F2D'
        ctx.lineWidth = 1.5
        const cornerSize = 12
        const corners = [
          { x: borderWidth + 10, y: borderWidth + 10 },
          { x: stripWidth - borderWidth - 10, y: borderWidth + 10 },
          { x: borderWidth + 10, y: totalHeight - borderWidth - 10 },
          { x: stripWidth - borderWidth - 10, y: totalHeight - borderWidth - 10 }
        ]

        corners.forEach((corner, i) => {
          ctx.beginPath()
          if (i === 0) { // Top-left
            ctx.moveTo(corner.x, corner.y + cornerSize)
            ctx.lineTo(corner.x, corner.y)
            ctx.lineTo(corner.x + cornerSize, corner.y)
          } else if (i === 1) { // Top-right
            ctx.moveTo(corner.x - cornerSize, corner.y)
            ctx.lineTo(corner.x, corner.y)
            ctx.lineTo(corner.x, corner.y + cornerSize)
          } else if (i === 2) { // Bottom-left
            ctx.moveTo(corner.x, corner.y - cornerSize)
            ctx.lineTo(corner.x, corner.y)
            ctx.lineTo(corner.x + cornerSize, corner.y)
          } else { // Bottom-right
            ctx.moveTo(corner.x - cornerSize, corner.y)
            ctx.lineTo(corner.x, corner.y)
            ctx.lineTo(corner.x, corner.y - cornerSize)
          }
          ctx.stroke()
        })

        // Draw header section
        const headerY = borderWidth + innerPadding

        // Draw couple names
        ctx.fillStyle = '#674F2D'
        ctx.font = 'bold 24px Georgia, serif'
        ctx.textAlign = 'center'
        ctx.fillText('Shahnila & Josh', stripWidth / 2, headerY + 30)

        // Draw wedding date
        ctx.fillStyle = '#674F2D'
        ctx.font = 'italic 13px Georgia, serif'
        const today = new Date()
        const dateString = today.toLocaleDateString('en-US', {
          month: 'long',
          day: 'numeric',
          year: 'numeric'
        })
        ctx.fillText(dateString, stripWidth / 2, headerY + 50)

        // Draw hearts
        ctx.fillStyle = '#8B6F47'
        ctx.font = '15px Arial'
        ctx.fillText('♥', stripWidth / 2 - 75, headerY + 50)
        ctx.fillText('♥', stripWidth / 2 + 75, headerY + 50)

        // Draw decorative line
        ctx.strokeStyle = '#c9a86c'
        ctx.lineWidth = 1.5
        ctx.beginPath()
        ctx.moveTo(borderWidth + innerPadding + 15, headerY + 68)
        ctx.lineTo(stripWidth - borderWidth - innerPadding - 15, headerY + 68)
        ctx.stroke()

        // Draw photos
        const photosStartY = headerY + headerHeight
        images.forEach((img, index) => {
          const yPosition = photosStartY + (index * (photoHeight + photoPadding))
          const xPosition = borderWidth + innerPadding

          // Draw photo with slight shadow, using object-fit: cover approach
          ctx.shadowColor = 'rgba(0, 0, 0, 0.2)'
          ctx.shadowBlur = 8
          ctx.shadowOffsetX = 2
          ctx.shadowOffsetY = 2

          // Calculate source crop to maintain aspect ratio
          const imgAspect = img.height / img.width
          const targetAspect = photoHeight / photoWidth

          let sx = 0, sy = 0, sWidth = img.width, sHeight = img.height

          if (imgAspect > targetAspect) {
            // Image is taller, crop height
            sHeight = img.width * targetAspect
            sy = (img.height - sHeight) / 2
          } else {
            // Image is wider, crop width
            sWidth = img.height / targetAspect
            sx = (img.width - sWidth) / 2
          }

          ctx.drawImage(img, sx, sy, sWidth, sHeight, xPosition, yPosition, photoWidth, photoHeight)

          // Reset shadow
          ctx.shadowColor = 'transparent'
          ctx.shadowBlur = 0
          ctx.shadowOffsetX = 0
          ctx.shadowOffsetY = 0
        })

        // Draw footer section
        const footerY = photosStartY + photosHeight + 12

        // Draw decorative line
        ctx.strokeStyle = '#c9a86c'
        ctx.lineWidth = 1.5
        ctx.beginPath()
        ctx.moveTo(borderWidth + innerPadding + 15, footerY)
        ctx.lineTo(stripWidth - borderWidth - innerPadding - 15, footerY)
        ctx.stroke()

        // Draw thank you message
        ctx.fillStyle = '#674F2D'
        ctx.font = 'italic 14px Georgia, serif'
        ctx.textAlign = 'center'
        ctx.fillText('Thank you for celebrating with us!', stripWidth / 2, footerY + 28)

        // Draw hearts
        ctx.fillStyle = '#8B6F47'
        ctx.font = '12px Arial'
        ctx.fillText('♥', stripWidth / 2 - 115, footerY + 28)
        ctx.fillText('♥', stripWidth / 2 + 115, footerY + 28)

        // Convert to data URL
        const dataUrl = canvas.toDataURL('image/png')
        resolve(dataUrl)
      })
      .catch(reject)
  })
}
