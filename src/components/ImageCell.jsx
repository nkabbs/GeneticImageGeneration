import { useRef } from 'react'

export function ImageCell({ index, selected, onToggleSelect, onSave, onDownloadDNA, setCanvasRef }) {
  const canvasRef = useRef(null)

  const handleRef = (el) => {
    canvasRef.current = el
    setCanvasRef(el)
  }

  const handleSave = () => {
    if (canvasRef.current) onSave(canvasRef.current)
  }

  return (
    <div className={`image-cell ${selected ? 'image-cell--selected' : ''}`}>
      <div className="canvas-wrapper" onClick={() => onToggleSelect(index)}>
        <canvas ref={handleRef} width={800} height={800} className="gen-canvas" />
        {selected && <div className="selected-overlay">✓</div>}
      </div>
      <div className="cell-footer">
        <label className="select-label" onClick={e => e.stopPropagation()}>
          <input
            type="checkbox"
            checked={selected}
            onChange={() => onToggleSelect(index)}
          />
          Select
        </label>
        <button className="save-btn" onClick={handleSave}>
          Save
        </button>
        <button className="save-btn" onClick={onDownloadDNA}>
          DNA
        </button>
      </div>
    </div>
  )
}
