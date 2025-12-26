import { useState, useEffect } from 'react'

const LIKED_PHOTOS_KEY = 'photobooth-liked-photos'

function useLikedPhotos() {
  const [likedPhotos, setLikedPhotos] = useState(() => {
    try {
      const stored = localStorage.getItem(LIKED_PHOTOS_KEY)
      return stored ? JSON.parse(stored) : []
    } catch (error) {
      console.error('Error loading liked photos:', error)
      return []
    }
  })

  useEffect(() => {
    try {
      localStorage.setItem(LIKED_PHOTOS_KEY, JSON.stringify(likedPhotos))
    } catch (error) {
      console.error('Error saving liked photos:', error)
    }
  }, [likedPhotos])

  const isPhotoLiked = (photoId) => {
    return likedPhotos.includes(photoId)
  }

  const toggleLike = (photoId) => {
    const isLiked = likedPhotos.includes(photoId)
    if (isLiked) {
      setLikedPhotos(prev => prev.filter(id => id !== photoId))
    } else {
      setLikedPhotos(prev => [...prev, photoId])
    }
    return !isLiked // Return new liked state
  }

  return {
    isPhotoLiked,
    toggleLike
  }
}

export default useLikedPhotos
