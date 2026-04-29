import { createNoise2D } from 'simplex-noise'
import { gaussian, clamp } from '../../genetics/random.js'
import { makePatternColorResolver } from '../palette.js'

function expand(axiom, productions, iterations) {
  let s = axiom
  for (let i = 0; i < iterations; i++) {
    let next = ''
    for (const ch of s) {
      next += productions[ch] !== undefined ? productions[ch] : ch
    }
    s = next
    if (s.length > 120000) break
  }
  return s
}

// Billiard-ball reflection: splits a step into sub-segments that bounce off canvas walls.
function reflectStep(x0, y0, heading, len, W, H) {
  const segments = []
  let cx = clamp(x0, 0, W)
  let cy = clamp(y0, 0, H)
  let ch = heading
  let remaining = len
  let bounced = false

  for (let i = 0; i < 20 && remaining > 0.01; i++) {
    const dx = Math.cos(ch)
    const dy = Math.sin(ch)
    const ex = cx + dx * remaining
    const ey = cy + dy * remaining

    if (ex >= 0 && ex <= W && ey >= 0 && ey <= H) {
      segments.push({ x1: cx, y1: cy, x2: ex, y2: ey })
      return { x: ex, y: ey, heading: ch, bounced, segments }
    }

    // Find t to the nearest wall crossing
    let t = Infinity, rx = false, ry = false
    if (dx >  1e-9) { const v = (W - cx) / dx; if (v >= 0 && v < t) { t = v; rx = true;  ry = false } }
    if (dx < -1e-9) { const v = (0 - cx) / dx; if (v >= 0 && v < t) { t = v; rx = true;  ry = false } }
    if (dy >  1e-9) { const v = (H - cy) / dy; if (v >= 0 && v < t) { t = v; rx = false; ry = true  } }
    if (dy < -1e-9) { const v = (0 - cy) / dy; if (v >= 0 && v < t) { t = v; rx = false; ry = true  } }

    if (!isFinite(t)) break

    const bx = clamp(cx + dx * t, 0, W)
    const by = clamp(cy + dy * t, 0, H)
    segments.push({ x1: cx, y1: cy, x2: bx, y2: by })
    cx = bx; cy = by
    remaining -= t

    if (rx) ch = Math.PI - ch
    else    ch = -ch
    bounced = true
  }

  return { x: cx, y: cy, heading: ch, bounced, segments }
}

export function drawLSystem(ctx, gene, W, H, palette, field, globals) {
  const { placement, color, rules } = gene
  const { axiom, productions, angle, angleVariance, stepDecay, tropism } = rules
  const chaos = globals.chaos

  const iterations = Math.max(1, Math.floor(rules.iterations * globals.iterationBudget))
  const lstring = expand(axiom, productions, iterations)

  const noise2D = createNoise2D()
  const resolveColor = makePatternColorResolver(palette, noise2D)

  const baseStep = rules.stepLength * (W / 800) * globals.scale
  const instances = Math.max(1, placement.repeatCount)
  const angleRad = angle * Math.PI / 180
  const maxDepth = iterations * 3

  for (let inst = 0; inst < instances; inst++) {
    const jx = (Math.random() - 0.5) * placement.repeatJitter
    const jy = (Math.random() - 0.5) * placement.repeatJitter
    const instScale = placement.scaleMin + Math.random() * (placement.scaleMax - placement.scaleMin)

    let nx = clamp(placement.anchorX + jx, 0.01, 0.99)
    let ny = clamp(placement.anchorY + jy, 0.01, 0.99)

    if (field && placement.fieldFollow > 0) {
      const { vx, vy } = field.getVector(nx, ny)
      const push = placement.fieldFollow * field.influence * 0.12
      nx = clamp(nx + vx * push, 0.01, 0.99)
      ny = clamp(ny + vy * push, 0.01, 0.99)
    }

    let x = nx * W
    let y = ny * H
    let heading = -Math.PI / 2
    let stepLen = baseStep * instScale
    let depth = 0
    const stack = []

    for (const ch of lstring) {
      switch (ch) {
        case 'F':
        case 'G': {
          const bend = tropism.x * Math.cos(heading) + tropism.y * Math.sin(heading)
          heading += bend * 0.1 * (1 + chaos * 0.5)

          const jitter = gaussian(0, (angleVariance * Math.PI / 180) * Math.max(0.05, chaos))
          let drawHeading = heading + jitter

          if (field && placement.fieldFollow > 0) {
            const cnx = clamp(x / W, 0, 1)
            const cny = clamp(y / H, 0, 1)
            const { angle: fa } = field.getVector(cnx, cny)
            const blend = placement.fieldFollow * field.influence * 0.35
            drawHeading = drawHeading * (1 - blend) + fa * blend
          }

          const { css } = resolveColor(color, x, y, W, H, depth, maxDepth, chaos)
          const lw = Math.max(0.3, stepLen * 0.055 * Math.pow(stepDecay, depth))

          const result = reflectStep(x, y, drawHeading, stepLen, W, H)

          ctx.strokeStyle = css
          ctx.lineWidth = lw
          for (const seg of result.segments) {
            ctx.beginPath()
            ctx.moveTo(seg.x1, seg.y1)
            ctx.lineTo(seg.x2, seg.y2)
            ctx.stroke()
          }

          x = result.x
          y = result.y
          if (result.bounced) heading = result.heading
          break
        }
        case '+':
          heading += angleRad + gaussian(0, (angleVariance * Math.PI / 180) * Math.max(0.05, chaos))
          break
        case '-':
          heading -= angleRad + gaussian(0, (angleVariance * Math.PI / 180) * Math.max(0.05, chaos))
          break
        case '[':
          stack.push({ x, y, heading, stepLen, depth })
          depth++
          stepLen *= stepDecay
          break
        case ']':
          if (stack.length > 0) {
            const s = stack.pop()
            x = s.x; y = s.y; heading = s.heading
            stepLen = s.stepLen; depth = s.depth
          }
          break
      }
    }
  }
}
