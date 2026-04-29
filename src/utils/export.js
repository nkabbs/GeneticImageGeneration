export function exportPNG(canvas, filename = 'genetic-art.png') {
  const link = document.createElement('a')
  link.download = filename
  link.href = canvas.toDataURL('image/png')
  link.click()
}

export function exportDNA(dna, filename = 'dna.json') {
  const json = JSON.stringify(dna, null, 2)
  const blob = new Blob([json], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.download = filename
  link.href = url
  link.click()
  URL.revokeObjectURL(url)
}

export function canvasToThumbnail(canvas, size = 120) {
  const thumb = document.createElement('canvas')
  thumb.width = size
  thumb.height = size
  thumb.getContext('2d').drawImage(canvas, 0, 0, size, size)
  return thumb.toDataURL('image/png')
}
