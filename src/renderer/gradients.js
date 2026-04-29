import { clamp, randFloat } from '../genetics/random.js'

function sampleColor(baseColor, colorRange) {
  return baseColor.map((c, i) =>
    clamp(Math.round(c + randFloat(-colorRange[i], colorRange[i])), 0, 255)
  )
}

function toRgba(color, alpha = 1) {
  return `rgba(${color[0]},${color[1]},${color[2]},${alpha})`
}

function buildStops(gene) {
  const { baseColors, colorRanges, opacity } = gene
  return baseColors.map((bc, i) => ({
    color: sampleColor(bc, colorRanges[i] || colorRanges[0]),
    stop: baseColors.length === 1 ? 0 : i / (baseColors.length - 1),
    opacity,
  }))
}

export function buildRadialGradient(ctx, cx, cy, r0, r1, gene) {
  const stops = buildStops(gene)
  const grad = ctx.createRadialGradient(cx, cy, r0, cx, cy, r1)
  for (const s of stops) {
    grad.addColorStop(s.stop, toRgba(s.color, s.opacity))
  }
  if (stops.length === 1) {
    grad.addColorStop(1, toRgba(stops[0].color, 0))
  }
  return grad
}

export function buildLinearGradient(ctx, x0, y0, x1, y1, gene) {
  const stops = buildStops(gene)
  const grad = ctx.createLinearGradient(x0, y0, x1, y1)
  for (const s of stops) {
    grad.addColorStop(s.stop, toRgba(s.color, s.opacity))
  }
  if (stops.length === 1) {
    grad.addColorStop(1, toRgba(stops[0].color, 0))
  }
  return grad
}

export function interpolateColor(stops, t) {
  // stops: [{color, stop}], t ∈ [0,1]
  if (stops.length === 1) return stops[0].color
  for (let i = 1; i < stops.length; i++) {
    if (t <= stops[i].stop) {
      const lo = stops[i - 1]
      const hi = stops[i]
      const f = (t - lo.stop) / (hi.stop - lo.stop)
      return lo.color.map((c, ci) => Math.round(c + (hi.color[ci] - c) * f))
    }
  }
  return stops[stops.length - 1].color
}

export function buildColorStops(gene) {
  return buildStops(gene)
}
