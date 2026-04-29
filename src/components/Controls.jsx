export function Controls({ generation, gridSize, onGridSizeChange, onNextGeneration, selectedCount }) {
  return (
    <header className="controls">
      <div className="controls-left">
        <h1 className="app-title">Genetic Image Generation</h1>
        <span className="generation-badge">Gen {generation}</span>
      </div>
      <div className="controls-right">
        <label className="grid-size-label">
          Grid
          <select
            value={gridSize}
            onChange={e => onGridSizeChange(Number(e.target.value))}
            className="grid-size-select"
          >
            {[2, 3, 4, 6, 8, 9, 12].map(n => (
              <option key={n} value={n}>{n}</option>
            ))}
          </select>
        </label>
        <button className="next-gen-btn" onClick={onNextGeneration}>
          {selectedCount === 0 ? 'Randomize' : `Breed (${selectedCount} selected)`}
        </button>
      </div>
    </header>
  )
}
