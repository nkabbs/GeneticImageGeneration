import { createNoise2D } from 'simplex-noise'
import { gaussian, clamp } from '../../genetics/random.js'
import { makePatternColorResolver, resolveAnchor } from '../palette.js'

function buildStarVerts(cx, cy, outerR, innerR, points, pVar, iVar, fieldFn, warp, chaos, W, H) {
  const verts = []
  for (let i = 0; i < points * 2; i++) {
    const a = (i * Math.PI) / points - Math.PI / 2
    const isOuter = i % 2 === 0
    const r = isOuter
      ? outerR * (1 + gaussian(0, pVar * chaos))
      : innerR * (1 + gaussian(0, iVar * chaos))
    let vx = cx + Math.cos(a) * r
    let vy = cy + Math.sin(a) * r
    if (fieldFn && warp > 0) {
      const { vx: fvx, vy: fvy } = fieldFn(clamp(vx / W, 0, 1), clamp(vy / H, 0, 1))
      vx += fvx * r * warp * 0.18
      vy += fvy * r * warp * 0.18
    }
    verts.push([vx, vy])
  }
  return verts
}

function buildPolyVerts(cx, cy, r, sides, pVar, fieldFn, warp, chaos, W, H) {
  const verts = []
  for (let i = 0; i < sides; i++) {
    const a = (i * Math.PI * 2) / sides - Math.PI / 2
    const rv = r * (1 + gaussian(0, pVar * chaos))
    let vx = cx + Math.cos(a) * rv
    let vy = cy + Math.sin(a) * rv
    if (fieldFn && warp > 0) {
      const { vx: fvx, vy: fvy } = fieldFn(clamp(vx / W, 0, 1), clamp(vy / H, 0, 1))
      vx += fvx * rv * warp * 0.25
      vy += fvy * rv * warp * 0.25
    }
    verts.push([vx, vy])
  }
  return verts
}

export function drawGeometric(ctx, gene, W, H, palette, field, globals) {
  const { placement, color, rules } = gene
  const { shape, points, pointVariance, innerRatio, innerVariance, fillStyle, strokeWeight, warpStrength } = rules
  const chaos = globals.chaos
  const noise2D = createNoise2D()
  const resolveColor = makePatternColorResolver(palette, noise2D)
  const fieldFn = field ? (nx, ny) => field.getVector(nx, ny) : null
  const instances = Math.max(1, placement.repeatCount)

  for (let inst = 0; inst < instances; inst++) {
    const jx = (Math.random() - 0.5) * placement.repeatJitter
    const jy = (Math.random() - 0.5) * placement.repeatJitter
    const instScale = placement.scaleMin + Math.random() * (placement.scaleMax - placement.scaleMin)

    let anx = clamp(placement.anchorX + jx, 0.03, 0.97)
    let any = clamp(placement.anchorY + jy, 0.03, 0.97)

    if (field && placement.fieldFollow > 0) {
      const { vx, vy } = field.getVector(anx, any)
      const push = placement.fieldFollow * field.influence * 0.12
      anx = clamp(anx + vx * push, 0.03, 0.97)
      any = clamp(any + vy * push, 0.03, 0.97)
    }

    const cx = anx * W
    const cy = any * H
    const r = Math.min(W, H) * 0.12 * instScale * globals.scale
    const effectiveWarp = warpStrength * (1 + chaos * 0.5)

    let verts = []
    if (shape === 'star') {
      verts = buildStarVerts(cx, cy, r, innerRatio * r, points, pointVariance, innerVariance, fieldFn, effectiveWarp, chaos, W, H)
    } else if (shape === 'circle') {
      verts = buildPolyVerts(cx, cy, r, 48, pointVariance, fieldFn, effectiveWarp, chaos, W, H)
    } else {
      verts = buildPolyVerts(cx, cy, r, points || 6, pointVariance, fieldFn, effectiveWarp, chaos, W, H)
    }

    if (verts.length < 2) continue

    ctx.beginPath()
    ctx.moveTo(verts[0][0], verts[0][1])
    for (let vi = 1; vi < verts.length; vi++) ctx.lineTo(verts[vi][0], verts[vi][1])
    ctx.closePath()

    if (fillStyle === 'radialGradient') {
      const rgbA = resolveAnchor(palette, color.paletteSlotA)
      const rgbB = resolveAnchor(palette, color.paletteSlotB)
      const grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, r)
      grad.addColorStop(0, `rgba(${rgbA[0]},${rgbA[1]},${rgbA[2]},${color.opacity})`)
      grad.addColorStop(1, `rgba(${rgbB[0]},${rgbB[1]},${rgbB[2]},0)`)
      ctx.fillStyle = grad
    } else if (fillStyle === 'linearGradient') {
      const rgbA = resolveAnchor(palette, color.paletteSlotA)
      const rgbB = resolveAnchor(palette, color.paletteSlotB)
      const grad = ctx.createLinearGradient(cx - r, cy, cx + r, cy)
      grad.addColorStop(0, `rgba(${rgbA[0]},${rgbA[1]},${rgbA[2]},${color.opacity})`)
      grad.addColorStop(1, `rgba(${rgbB[0]},${rgbB[1]},${rgbB[2]},${color.opacity})`)
      ctx.fillStyle = grad
    } else {
      const { css } = resolveColor(color, cx, cy, W, H, 0, 1, chaos)
      ctx.fillStyle = css
    }
    ctx.fill()

    if (strokeWeight > 0) {
      const { css } = resolveColor(color, cx, cy, W, H, 1, 1, chaos)
      ctx.strokeStyle = css
      ctx.lineWidth = strokeWeight * instScale
      ctx.stroke()
    }
  }
}
