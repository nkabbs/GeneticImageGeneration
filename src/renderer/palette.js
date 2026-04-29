import { clamp, gaussian } from '../genetics/random.js'

function hslToRgb(h, s, l) {
  h = ((h % 360) + 360) % 360
  const a = s * Math.min(l, 1 - l)
  const f = n => {
    const k = (n + h / 30) % 12
    return l - a * Math.max(-1, Math.min(k - 3, 9 - k, 1))
  }
  return [Math.round(f(0) * 255), Math.round(f(8) * 255), Math.round(f(4) * 255)]
}

function lerpRgb(a, b, t) {
  return [
    Math.round(a[0] + (b[0] - a[0]) * t),
    Math.round(a[1] + (b[1] - a[1]) * t),
    Math.round(a[2] + (b[2] - a[2]) * t),
  ]
}

export function resolveAnchor(palette, slotIndex) {
  const anchor = palette.anchors[Math.min(slotIndex, palette.anchors.length - 1)]
  return hslToRgb(anchor.h + palette.globalHueShift, anchor.s, anchor.l)
}

// Returns a resolver function bound to this palette + noise fn.
// resolveColor(colorGene, x, y, W, H, depth, maxDepth, chaos)
//   → { rgb: [r,g,b], css: 'rgba(...)' }
export function makePatternColorResolver(palette, noise2D) {
  return function resolveColor(colorGene, x, y, W, H, depth, maxDepth, chaos) {
    const { paletteSlotA, paletteSlotB, interpolation, opacity, opacityVariance = 0 } = colorGene
    const colorA = resolveAnchor(palette, paletteSlotA)
    const colorB = resolveAnchor(palette, paletteSlotB)

    let t = 0
    switch (interpolation) {
      case 'position': t = clamp((x / W + y / H) / 2, 0, 1); break
      case 'depth':    t = maxDepth > 0 ? clamp(depth / maxDepth, 0, 1) : 0; break
      case 'noise':    t = noise2D ? clamp((noise2D(x * 0.005, y * 0.005) + 1) * 0.5, 0, 1) : 0.5; break
      case 'fixed':
      default:         t = 0; break
    }

    const rgb = lerpRgb(colorA, colorB, t)
    const alpha = clamp(opacity + gaussian(0, opacityVariance * chaos * 0.5), 0.02, 1)
    return { rgb, css: `rgba(${rgb[0]},${rgb[1]},${rgb[2]},${alpha.toFixed(3)})` }
  }
}
