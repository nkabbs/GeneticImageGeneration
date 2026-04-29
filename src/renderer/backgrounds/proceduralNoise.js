import { createNoise2D } from 'simplex-noise'
import { smoothstep } from '../../genetics/random.js'
import { buildColorStops, interpolateColor } from '../gradients.js'

export function renderProceduralNoise(offCtx, gene, W, H) {
  const noise2D = createNoise2D()
  const imageData = offCtx.createImageData(W, H)
  const data = imageData.data
  const stops = buildColorStops(gene)
  const { noiseScale, proportion } = gene
  const freq = noiseScale * 600

  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      const n = noise2D(x / W * freq, y / H * freq)
      const t = (n + 1) * 0.5
      const alpha = smoothstep(1 - proportion - 0.12, 1 - proportion + 0.12, t)
      const color = interpolateColor(stops, t)
      const idx = (y * W + x) * 4
      data[idx]     = color[0]
      data[idx + 1] = color[1]
      data[idx + 2] = color[2]
      data[idx + 3] = Math.round(alpha * 255)
    }
  }

  offCtx.putImageData(imageData, 0, 0)
}
