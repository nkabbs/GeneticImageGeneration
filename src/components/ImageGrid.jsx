import { useEffect, useRef, useCallback } from 'react'
import { ImageCell } from './ImageCell.jsx'
import { renderDNA } from '../renderer/renderDNA.js'

export function ImageGrid({ dnas, selected, onToggleSelect, onSave, onDownloadDNA }) {
  const canvasRefs = useRef({})
  const queueRef = useRef([])
  const renderingRef = useRef(false)

  const setCanvasRef = useCallback((index, canvas) => {
    canvasRefs.current[index] = canvas
  }, [])

  useEffect(() => {
    if (!dnas.length) return

    // Build queue once all canvases are registered
    queueRef.current = dnas.map((dna, i) => ({ dna, index: i }))
    renderingRef.current = true

    function processNext() {
      if (queueRef.current.length === 0) {
        renderingRef.current = false
        return
      }
      const { dna, index } = queueRef.current.shift()
      const canvas = canvasRefs.current[index]
      if (canvas) renderDNA(canvas, dna)
      requestAnimationFrame(processNext)
    }

    // Slight delay to ensure React has flushed the DOM with new canvases
    const raf = requestAnimationFrame(processNext)
    return () => {
      queueRef.current = []
      cancelAnimationFrame(raf)
    }
  }, [dnas])

  return (
    <div className="image-grid" style={{ '--cols': Math.ceil(Math.sqrt(dnas.length)) }}>
      {dnas.map((dna, i) => (
        <ImageCell
          key={i}
          index={i}
          selected={selected.has(i)}
          onToggleSelect={onToggleSelect}
          onSave={(canvas) => onSave(i, canvas)}
          onDownloadDNA={() => onDownloadDNA(i)}
          setCanvasRef={(canvas) => setCanvasRef(i, canvas)}
        />
      ))}
    </div>
  )
}
