import { smoothstep } from '../../genetics/random.js'
import { buildColorStops, interpolateColor } from '../gradients.js'

// Bilinear value noise — distinct blobby look
function buildGrid(size) {
  const grid = new Float32Array(size * size)
  for (let i = 0; i < grid.length; i++) grid[i] = Math.random()
  return grid
}

function valueNoise(grid, size, x, y) {
  const ix = Math.floor(x) % size
  const iy = Math.floor(y) % size
  const fx = x - Math.floor(x)
  const fy = y - Math.floor(y)
  const ix1 = (ix + 1) % size
  const iy1 = (iy + 1) % size
  // smoothstep-interpolated bilinear
  const ux = fx * fx * (3 - 2 * fx)
  const uy = fy * fy * (3 - 2 * fy)
  const v00 = grid[iy  * size + ix ]
  const v10 = grid[iy  * size + ix1]
  const v01 = grid[iy1 * size + ix ]
  const v11 = grid[iy1 * size + ix1]
  return (
    v00 * (1 - ux) * (1 - uy) +
    v10 * ux       * (1 - uy) +
    v01 * (1 - ux) * uy       +
    v11 * ux       * uy
  )
}

export function renderProceduralNoise(offCtx, gene, W, H) {
  const GRID = 16
  const g1 = buildGrid(GRID)
  const g2 = buildGrid(GRID * 2)
  const g3 = buildGrid(GRID * 4)
  const imageData = offCtx.createImageData(W, H)
  const data = imageData.data
  const stops = buildColorStops(gene)
  const { noiseScale, proportion } = gene
  const freq = noiseScale * 600

  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      const sx = x / W * freq
      const sy = y / H * freq
      const n1 = valueNoise(g1, GRID,     sx,         sy)
      const n2 = valueNoise(g2, GRID * 2, sx * 2,     sy * 2) * 0.5
      const n3 = valueNoise(g3, GRID * 4, sx * 4,     sy * 4) * 0.25
      const t = (n1 + n2 + n3) / 1.75
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
