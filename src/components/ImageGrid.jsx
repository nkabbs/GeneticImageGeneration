import { useEffect, useRef, useCallback } from 'react'
import { ImageCell } from './ImageCell.jsx'

export function ImageGrid({ dnas, selected, onToggleSelect, onSave, onDownloadDNA }) {
  const canvasRefs = useRef({})
  const workersRef = useRef({})
  const genRef = useRef(0)

  const setCanvasRef = useCallback((index, canvas) => {
    canvasRefs.current[index] = canvas
  }, [])

  // Terminate all workers on unmount (also clears ref so StrictMode's double-invoke creates fresh workers)
  useEffect(() => {
    return () => {
      Object.values(workersRef.current).forEach(w => w.terminate())
      workersRef.current = {}
    }
  }, [])

  useEffect(() => {
    if (!dnas.length) return

    const gen = ++genRef.current

    // Terminate workers for slots that no longer exist
    for (const idx of Object.keys(workersRef.current)) {
      if (parseInt(idx) >= dnas.length) {
        workersRef.current[idx].terminate()
        delete workersRef.current[idx]
      }
    }

    for (let i = 0; i < dnas.length; i++) {
      const dna = dnas[i]
      const canvas = canvasRefs.current[i]
      if (!canvas) continue

      if (!workersRef.current[i]) {
        workersRef.current[i] = new Worker(
          new URL('../renderer/renderWorker.js', import.meta.url),
          { type: 'module' }
        )
      }

      const worker = workersRef.current[i]
      const capturedCanvas = canvas

      worker.onerror = (e) => console.error(`Render worker ${i} error:`, e)

      worker.onmessage = ({ data: { bitmap } }) => {
        if (gen !== genRef.current) { bitmap.close(); return }
        const ctx = capturedCanvas.getContext('2d')
        ctx.drawImage(bitmap, 0, 0)
        bitmap.close()
      }

      worker.postMessage({ dna, width: canvas.width, height: canvas.height })
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
