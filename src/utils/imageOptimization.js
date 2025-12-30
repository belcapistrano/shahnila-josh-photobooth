/**
 * Image optimization utilities for compressing and generating thumbnails
 */

/**
 * Compress an image to reduce file size while maintaining quality
 * @param {string} dataUrl - Base64 data URL of the image
 * @param {number} maxWidth - Maximum width for the compressed image
 * @param {number} quality - JPEG quality (0-1)
 * @returns {Promise<string>} Compressed image as data URL
 */
export async function compressImage(dataUrl, maxWidth = 1920, quality = 0.85) {
  return new Promise((resolve, reject) => {
    const img = new Image()

    img.onload = () => {
      const canvas = document.createElement('canvas')
      const ctx = canvas.getContext('2d')

      // Calculate new dimensions maintaining aspect ratio
      let width = img.width
      let height = img.height

      if (width > maxWidth) {
        height = (height * maxWidth) / width
        width = maxWidth
      }

      canvas.width = width
      canvas.height = height

      // Draw image on canvas
      ctx.drawImage(img, 0, 0, width, height)

      // Convert to compressed JPEG
      const compressedDataUrl = canvas.toDataURL('image/jpeg', quality)
      resolve(compressedDataUrl)
    }

    img.onerror = reject
    img.src = dataUrl
  })
}

/**
 * Generate a thumbnail from an image
 * @param {string} dataUrl - Base64 data URL of the image
 * @param {number} maxSize - Maximum width/height for the thumbnail
 * @param {number} quality - JPEG quality (0-1)
 * @returns {Promise<string>} Thumbnail as data URL
 */
export async function generateThumbnail(dataUrl, maxSize = 400, quality = 0.7) {
  return new Promise((resolve, reject) => {
    const img = new Image()

    img.onload = () => {
      const canvas = document.createElement('canvas')
      const ctx = canvas.getContext('2d')

      // Calculate thumbnail dimensions maintaining aspect ratio
      let width = img.width
      let height = img.height

      if (width > height) {
        if (width > maxSize) {
          height = (height * maxSize) / width
          width = maxSize
        }
      } else {
        if (height > maxSize) {
          width = (width * maxSize) / height
          height = maxSize
        }
      }

      canvas.width = width
      canvas.height = height

      // Draw image on canvas
      ctx.drawImage(img, 0, 0, width, height)

      // Convert to compressed JPEG
      const thumbnailDataUrl = canvas.toDataURL('image/jpeg', quality)
      resolve(thumbnailDataUrl)
    }

    img.onerror = reject
    img.src = dataUrl
  })
}

/**
 * Generate a tiny blur placeholder for progressive loading
 * @param {string} dataUrl - Base64 data URL of the image
 * @returns {Promise<string>} Blur placeholder as data URL
 */
export async function generateBlurPlaceholder(dataUrl) {
  return new Promise((resolve, reject) => {
    const img = new Image()

    img.onload = () => {
      const canvas = document.createElement('canvas')
      const ctx = canvas.getContext('2d')

      // Very small size for blur placeholder
      const size = 20
      canvas.width = size
      canvas.height = size

      // Draw image on canvas
      ctx.drawImage(img, 0, 0, size, size)

      // Convert to highly compressed JPEG
      const blurDataUrl = canvas.toDataURL('image/jpeg', 0.3)
      resolve(blurDataUrl)
    }

    img.onerror = reject
    img.src = dataUrl
  })
}

/**
 * Process an image: compress, generate thumbnail, and blur placeholder
 * @param {string} dataUrl - Base64 data URL of the original image
 * @returns {Promise<object>} Object with original, compressed, thumbnail, and blur versions
 */
export async function processImage(dataUrl) {
  try {
    const [compressed, thumbnail, blurPlaceholder] = await Promise.all([
      compressImage(dataUrl, 1920, 0.85),
      generateThumbnail(dataUrl, 400, 0.7),
      generateBlurPlaceholder(dataUrl)
    ])

    return {
      original: dataUrl,
      compressed,
      thumbnail,
      blurPlaceholder
    }
  } catch (error) {
    console.error('Error processing image:', error)
    // Return original if processing fails
    return {
      original: dataUrl,
      compressed: dataUrl,
      thumbnail: dataUrl,
      blurPlaceholder: dataUrl
    }
  }
}
