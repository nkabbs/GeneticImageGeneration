import { renderDNA } from './renderDNA.js'

self.onmessage = ({ data: { dna, width, height } }) => {
  const offscreen = new OffscreenCanvas(width, height)
  renderDNA(offscreen, dna)
  const bitmap = offscreen.transferToImageBitmap()
  self.postMessage({ bitmap }, [bitmap])
}
