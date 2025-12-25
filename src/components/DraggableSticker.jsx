import { useState, useRef } from 'react'

function DraggableSticker({ sticker, onRemove, containerRef }) {
  const [position, setPosition] = useState({ x: 100, y: 100 })
  const [isDragging, setIsDragging] = useState(false)
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 })
  const stickerRef = useRef(null)

  const handleMouseDown = (e) => {
    setIsDragging(true)
    setDragStart({
      x: e.clientX - position.x,
      y: e.clientY - position.y
    })
  }

  const handleMouseMove = (e) => {
    if (!isDragging || !containerRef.current) return

    const containerRect = containerRef.current.getBoundingClientRect()
    const stickerSize = 60 // Size of sticker

    let newX = e.clientX - dragStart.x
    let newY = e.clientY - dragStart.y

    // Constrain to container bounds
    newX = Math.max(0, Math.min(newX, containerRect.width - stickerSize))
    newY = Math.max(0, Math.min(newY, containerRect.height - stickerSize))

    setPosition({ x: newX, y: newY })
  }

  const handleMouseUp = () => {
    setIsDragging(false)
  }

  const handleTouchStart = (e) => {
    const touch = e.touches[0]
    setIsDragging(true)
    setDragStart({
      x: touch.clientX - position.x,
      y: touch.clientY - position.y
    })
  }

  const handleTouchMove = (e) => {
    if (!isDragging || !containerRef.current) return

    const touch = e.touches[0]
    const containerRect = containerRef.current.getBoundingClientRect()
    const stickerSize = 60

    let newX = touch.clientX - dragStart.x
    let newY = touch.clientY - dragStart.y

    newX = Math.max(0, Math.min(newX, containerRect.width - stickerSize))
    newY = Math.max(0, Math.min(newY, containerRect.height - stickerSize))

    setPosition({ x: newX, y: newY })
  }

  const handleTouchEnd = () => {
    setIsDragging(false)
  }

  return (
    <div
      ref={stickerRef}
      className={`draggable-sticker ${isDragging ? 'dragging' : ''}`}
      style={{
        left: `${position.x}px`,
        top: `${position.y}px`
      }}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      data-position={JSON.stringify(position)}
    >
      <span className="sticker-emoji">{sticker.emoji}</span>
      <button
        className="sticker-remove"
        onClick={(e) => {
          e.stopPropagation()
          onRemove(sticker.instanceId)
        }}
      >
        ×
      </button>
    </div>
  )
}

export default DraggableSticker
