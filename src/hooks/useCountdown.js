import { useState, useEffect, useRef } from 'react'

function useCountdown(initialSeconds = 3) {
  const [count, setCount] = useState(0)
  const [isActive, setIsActive] = useState(false)
  const callbackRef = useRef(null)
  const intervalRef = useRef(null)

  useEffect(() => {
    if (isActive && count > 0) {
      intervalRef.current = setInterval(() => {
        setCount(prev => {
          if (prev <= 1) {
            setIsActive(false)
            // Call the callback when countdown reaches 0
            if (callbackRef.current) {
              setTimeout(() => callbackRef.current(), 100)
            }
            return 0
          }
          return prev - 1
        })
      }, 1000)
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
    }
  }, [isActive, count])

  const startCountdown = (callback) => {
    callbackRef.current = callback
    setCount(initialSeconds)
    setIsActive(true)
  }

  const cancelCountdown = () => {
    setIsActive(false)
    setCount(0)
    if (intervalRef.current) {
      clearInterval(intervalRef.current)
    }
  }

  return { count, isActive, startCountdown, cancelCountdown }
}

export default useCountdown
