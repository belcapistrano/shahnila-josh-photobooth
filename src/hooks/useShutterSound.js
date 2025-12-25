import { useRef, useEffect } from 'react'

function useShutterSound() {
  const audioContextRef = useRef(null)

  useEffect(() => {
    // Create AudioContext on mount
    if (!audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext || window.webkitAudioContext)()
    }

    return () => {
      // Clean up on unmount
      if (audioContextRef.current) {
        audioContextRef.current.close()
      }
    }
  }, [])

  const playShutter = () => {
    const context = audioContextRef.current
    if (!context) return

    // Create a simple shutter sound using oscillators
    const oscillator = context.createOscillator()
    const gainNode = context.createGain()

    oscillator.connect(gainNode)
    gainNode.connect(context.destination)

    oscillator.frequency.value = 800
    oscillator.type = 'sine'

    gainNode.gain.setValueAtTime(0.3, context.currentTime)
    gainNode.gain.exponentialRampToValueAtTime(0.01, context.currentTime + 0.1)

    oscillator.start(context.currentTime)
    oscillator.stop(context.currentTime + 0.1)
  }

  return { playShutter }
}

export default useShutterSound
