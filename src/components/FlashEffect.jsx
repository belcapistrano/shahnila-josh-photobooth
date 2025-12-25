import { useEffect, useState } from 'react'

function FlashEffect({ trigger, onComplete }) {
  const [isFlashing, setIsFlashing] = useState(false)

  useEffect(() => {
    if (trigger) {
      setIsFlashing(true)
      const timer = setTimeout(() => {
        setIsFlashing(false)
        if (onComplete) {
          onComplete()
        }
      }, 300)

      return () => clearTimeout(timer)
    }
  }, [trigger, onComplete])

  if (!isFlashing) {
    return null
  }

  return <div className="flash-overlay" />
}

export default FlashEffect
