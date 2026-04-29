import { smoothstep } from '../../genetics/random.js'
import { buildColorStops, interpolateColor } from '../gradients.js'

// Classic value noise with smoothstep interpolation — 3 octaves
function buildPermTable() {
  const p = Array.from({ length: 256 }, (_, i) => i)
  for (let i = 255; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [p[i], p[j]] = [p[j], p[i]]
  }
  return [...p, ...p]
}

function fade(t) { return t * t * t * (t * (t * 6 - 15) + 10) }

function grad(hash, x, y) {
  const h = hash & 3
  const u = h < 2 ? x : y
  const v = h < 2 ? y : x
  return ((h & 1) ? -u : u) + ((h & 2) ? -v : v)
}

function perlin(p, x, y) {
  const X = Math.floor(x) & 255
  const Y = Math.floor(y) & 255
  const xf = x - Math.floor(x)
  const yf = y - Math.floor(y)
  const u = fade(xf)
  const v = fade(yf)
  const aa = p[p[X] + Y]
  const ab = p[p[X] + Y + 1]
  const ba = p[p[X + 1] + Y]
  const bb = p[p[X + 1] + Y + 1]
  const x1 = grad(aa, xf, yf)
  const x2 = grad(ba, xf - 1, yf)
  const y1 = grad(ab, xf, yf - 1)
  const y2 = grad(bb, xf - 1, yf - 1)
  return (
    (1 - v) * ((1 - u) * x1 + u * x2) +
    v       * ((1 - u) * y1 + u * y2)
  )
}

export function renderPerlinNoise(offCtx, gene, W, H) {
  const p = buildPermTable()
  const imageData = offCtx.createImageData(W, H)
  const data = imageData.data
  const stops = buildColorStops(gene)
  const { noiseScale, proportion } = gene

  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      const sx = x * noiseScale * 250
      const sy = y * noiseScale * 250
      const n1 = perlin(p, sx, sy)
      const n2 = perlin(p, sx * 2 + 31.7, sy * 2 + 17.3) * 0.5
      const n3 = perlin(p, sx * 4 + 89.1, sy * 4 + 53.8) * 0.25
      const n = (n1 + n2 + n3) / 1.75
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
