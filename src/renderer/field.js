import { createNoise2D } from 'simplex-noise'
import { clamp } from '../genetics/random.js'

function sinusoidalAngle(components, nx, ny) {
  let angle = 0
  for (const c of components) {
    angle += c.amplitude * Math.sin(c.freqX * nx * Math.PI * 2 + c.freqY * ny * Math.PI * 2 + c.phase)
  }
  return angle * Math.PI
}

function turbulentAngle(components, nx, ny) {
  let angle = 0
  for (const c of components) {
    angle += c.amplitude * Math.abs(Math.sin(c.freqX * nx * Math.PI * 2 + c.freqY * ny * Math.PI * 2 + c.phase))
  }
  return angle * Math.PI * 2
}

function radialAngle(components, nx, ny) {
  const dx = nx - 0.5, dy = ny - 0.5
  const r = Math.sqrt(dx * dx + dy * dy)
  const base = Math.atan2(dy, dx)
  let mod = 0
  for (const c of components) {
    mod += c.amplitude * Math.sin(c.freqX * r * Math.PI * 4 + c.phase)
  }
  return base + mod * Math.PI
}

function curlAngle(noise2D, components, nx, ny) {
  const eps = 0.001
  let vx = 0, vy = 0
  for (const c of components) {
    const scale = Math.max(c.freqX, c.freqY, 0.1)
    const n1 = noise2D(nx * scale + eps, ny * scale)
    const n2 = noise2D(nx * scale - eps, ny * scale)
    const n3 = noise2D(nx * scale,       ny * scale + eps)
    const n4 = noise2D(nx * scale,       ny * scale - eps)
    vx += c.amplitude * (n3 - n4) / (2 * eps)
    vy -= c.amplitude * (n1 - n2) / (2 * eps)
  }
  return Math.atan2(vy, vx)
}

export function buildField(fieldGene) {
  const noise2D = createNoise2D()
  const { type, components, warpIterations, warpStrength, influence } = fieldGene

  function rawAngle(nx, ny) {
    switch (type) {
      case 'curl':      return curlAngle(noise2D, components, nx, ny)
      case 'radial':    return radialAngle(components, nx, ny)
      case 'turbulent': return turbulentAngle(components, nx, ny)
      default:          return sinusoidalAngle(components, nx, ny)
    }
  }

  // Domain warp: feed field output back as input coords
  function warp(nx, ny) {
    let wx = nx, wy = ny
    for (let i = 0; i < warpIterations; i++) {
      const a = rawAngle(wx, wy)
      wx = clamp(nx + Math.cos(a) * warpStrength * (i + 1) * 0.08, -0.1, 1.1)
      wy = clamp(ny + Math.sin(a) * warpStrength * (i + 1) * 0.08, -0.1, 1.1)
    }
    return { nx: wx, ny: wy }
  }

  function getVector(nx, ny) {
    const { nx: wx, ny: wy } = warp(nx, ny)
    const a = rawAngle(wx, wy)
    return { vx: Math.cos(a), vy: Math.sin(a), angle: a }
  }

  return { getVector, warp, influence }
}
