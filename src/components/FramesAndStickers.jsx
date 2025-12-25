const FRAMES = [
  { id: 'none', name: 'None', style: 'none' },
  { id: 'hearts', name: '♥ Hearts', style: 'hearts' },
  { id: 'flowers', name: '✿ Flowers', style: 'flowers' },
  { id: 'elegant', name: '✦ Elegant', style: 'elegant' },
  { id: 'sparkles', name: '✨ Sparkles', style: 'sparkles' }
]

const STICKERS = [
  { id: 'heart', emoji: '❤️', label: 'Heart' },
  { id: 'rings', emoji: '💍', label: 'Rings' },
  { id: 'champagne', emoji: '🥂', label: 'Champagne' },
  { id: 'rose', emoji: '🌹', label: 'Rose' },
  { id: 'sparkle', emoji: '✨', label: 'Sparkle' },
  { id: 'star', emoji: '⭐', label: 'Star' },
  { id: 'kiss', emoji: '💋', label: 'Kiss' },
  { id: 'couple', emoji: '💑', label: 'Couple' },
  { id: 'cake', emoji: '🎂', label: 'Cake' },
  { id: 'balloon', emoji: '🎈', label: 'Balloon' }
]

function FramesAndStickers({ selectedFrame, onFrameChange, onAddSticker }) {
  return (
    <div className="frames-stickers-controls">
      <div className="control-section">
        <label className="control-label">Frame:</label>
        <div className="frame-buttons">
          {FRAMES.map(frame => (
            <button
              key={frame.id}
              className={`frame-btn ${selectedFrame === frame.id ? 'active' : ''}`}
              onClick={() => onFrameChange(frame.id)}
            >
              {frame.name}
            </button>
          ))}
        </div>
      </div>

      <div className="control-section">
        <label className="control-label">Add Stickers:</label>
        <div className="sticker-buttons">
          {STICKERS.map(sticker => (
            <button
              key={sticker.id}
              className="sticker-btn"
              onClick={() => onAddSticker(sticker)}
              title={sticker.label}
            >
              {sticker.emoji}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}

export { FRAMES, STICKERS }
export default FramesAndStickers
