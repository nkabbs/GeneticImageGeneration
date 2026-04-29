import { useState } from 'react'
import { exportDNA, exportPNG } from '../utils/export.js'

function Modal({ item, onClose }) {
  const handleDownloadImg = () => {
    const link = document.createElement('a')
    link.download = `genetic-art-saved.png`
    link.href = item.fullDataURL
    link.click()
  }

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()}>
        <img src={item.fullDataURL} alt="Saved artwork" className="modal-image" />
        <div className="modal-actions">
          <button onClick={handleDownloadImg}>Download PNG</button>
          <button onClick={() => exportDNA(item.dna)}>Export DNA</button>
          <button onClick={onClose}>Close</button>
        </div>
      </div>
    </div>
  )
}

export function SavedGallery({ savedImages }) {
  const [modalItem, setModalItem] = useState(null)

  if (savedImages.length === 0) return null

  return (
    <>
      <section className="saved-gallery">
        <span className="gallery-label">Saved ({savedImages.length})</span>
        <div className="gallery-strip">
          {savedImages.map((item, i) => (
            <img
              key={i}
              src={item.thumbnail}
              alt={`Saved ${i + 1}`}
              className="gallery-thumb"
              onClick={() => setModalItem(item)}
              title={`Gen ${item.dna.generation}`}
            />
          ))}
        </div>
      </section>
      {modalItem && <Modal item={modalItem} onClose={() => setModalItem(null)} />}
    </>
  )
}
