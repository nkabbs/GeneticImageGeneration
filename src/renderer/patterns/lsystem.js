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

export function drawLSystem(ctx, gene, W, H, palette, field, globals) {
  const { placement, color, rules } = gene
  const { axiom, productions, angle, angleVariance, stepDecay, tropism } = rules
  const chaos = globals.chaos

  const iterations = Math.max(1, Math.floor(rules.iterations * globals.iterationBudget))
  const lstring = expand(axiom, productions, iterations)

  const noise2D = createNoise2D()
  const resolveColor = makePatternColorResolver(palette, noise2D)

  const baseStep = rules.stepLength * (W / 800)
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
          // Tropism: gravity-like bending
          const bend = tropism.x * Math.cos(heading) + tropism.y * Math.sin(heading)
          heading += bend * 0.1 * (1 + chaos * 0.5)

          // Per-step angle jitter scaled by chaos
          const jitter = gaussian(0, (angleVariance * Math.PI / 180) * Math.max(0.05, chaos))
          let drawHeading = heading + jitter

          // Field influence bends turtle direction
          if (field && placement.fieldFollow > 0) {
            const cnx = clamp(x / W, 0, 1)
            const cny = clamp(y / H, 0, 1)
            const { angle: fa } = field.getVector(cnx, cny)
            const blend = placement.fieldFollow * field.influence * 0.35
            drawHeading = drawHeading * (1 - blend) + fa * blend
          }

          const nx2 = x + Math.cos(drawHeading) * stepLen
          const ny2 = y + Math.sin(drawHeading) * stepLen

          const { css } = resolveColor(color, x, y, W, H, depth, maxDepth, chaos)
          const lw = Math.max(0.3, stepLen * 0.055 * Math.pow(stepDecay, depth))

          ctx.beginPath()
          ctx.moveTo(x, y)
          ctx.lineTo(nx2, ny2)
          ctx.strokeStyle = css
          ctx.lineWidth = lw
          ctx.stroke()

          x = nx2
          y = ny2
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
