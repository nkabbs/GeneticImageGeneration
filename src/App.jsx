import { useState, useCallback } from 'react'
import { Controls } from './components/Controls.jsx'
import { ImageGrid } from './components/ImageGrid.jsx'
import { SavedGallery } from './components/SavedGallery.jsx'
import { randomDNA } from './genetics/dna.js'
import { crossover, mutate } from './genetics/breeding.js'
import { exportPNG, exportDNA, canvasToThumbnail } from './utils/export.js'

const DEFAULT_GRID = 6

function makeDNAs(count) {
  return Array.from({ length: count }, () => randomDNA())
}

export default function App() {
  const [generation, setGeneration] = useState(0)
  const [gridSize, setGridSize] = useState(DEFAULT_GRID)
  const [dnas, setDnas] = useState(() => makeDNAs(DEFAULT_GRID))
  const [selected, setSelected] = useState(new Set())
  const [savedImages, setSavedImages] = useState([])

  const handleToggleSelect = useCallback((index) => {
    setSelected(prev => {
      const next = new Set(prev)
      if (next.has(index)) next.delete(index)
      else next.add(index)
      return next
    })
  }, [])

  const handleNextGeneration = useCallback(() => {
    if (selected.size === 0) {
      setDnas(makeDNAs(gridSize))
      setGeneration(0)
      setSelected(new Set())
      return
    }

    const parents = [...selected].map(i => dnas[i])
    const nextDnas = Array.from({ length: gridSize }, () => mutate(crossover(parents)))
    setDnas(nextDnas)
    setGeneration(g => g + 1)
    setSelected(new Set())
  }, [selected, dnas, gridSize])

  const handleGridSizeChange = useCallback((n) => {
    setGridSize(n)
    setDnas(makeDNAs(n))
    setGeneration(0)
    setSelected(new Set())
  }, [])

  const handleSave = useCallback((index, canvas) => {
    exportPNG(canvas, `gen${generation}-${index}.png`)
    const thumbnail = canvasToThumbnail(canvas, 120)
    const fullDataURL = canvas.toDataURL('image/png')
    setSavedImages(prev => [...prev, { thumbnail, fullDataURL, dna: dnas[index] }])
  }, [generation, dnas])

  const handleDownloadDNA = useCallback((index) => {
    exportDNA(dnas[index], `gen${generation}-${index}-dna.json`)
  }, [generation, dnas])

  return (
    <div className="app">
      <Controls
        generation={generation}
        gridSize={gridSize}
        onGridSizeChange={handleGridSizeChange}
        onNextGeneration={handleNextGeneration}
        selectedCount={selected.size}
      />
      <main className="main">
        <ImageGrid
          dnas={dnas}
          selected={selected}
          onToggleSelect={handleToggleSelect}
          onSave={handleSave}
          onDownloadDNA={handleDownloadDNA}
        />
      </main>
      <SavedGallery savedImages={savedImages} />
    </div>
  )
}
