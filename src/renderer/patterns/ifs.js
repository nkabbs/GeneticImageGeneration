import { createNoise2D } from 'simplex-noise'
import { gaussian, clamp } from '../../genetics/random.js'
import { makePatternColorResolver } from '../palette.js'

export function drawIFS(ctx, gene, W, H, palette, field, globals) {
  const { placement, color, rules } = gene
  const { transforms, pointSize } = rules
  const chaos = globals.chaos
  const noise2D = createNoise2D()
  const resolveColor = makePatternColorResolver(palette, noise2D)

  // Normalize probabilities into a cumulative distribution
  const totalP = transforms.reduce((s, t) => s + t.p, 0)
  const cdf = []
  let cum = 0
  for (const t of transforms) {
    cum += t.p / totalP
    cdf.push(cum)
  }

  function pickTransform() {
    const r = Math.random()
    const i = cdf.findIndex(c => r <= c)
    return transforms[Math.max(0, i)]
  }

  const iterations = Math.floor(rules.iterations * globals.iterationBudget)

  // Pre-pass to find IFS attractor bounds
  let fx = 0, fy = 0
  let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity
  const sampleCount = Math.min(8000, iterations)
  for (let i = 0; i < sampleCount; i++) {
    const tr = pickTransform()
    const nx = tr.a * fx + tr.b * fy + tr.e
    const ny = tr.c * fx + tr.d * fy + tr.f
    fx = nx; fy = ny
    if (i >= 20) {
      if (fx < minX) minX = fx; if (fx > maxX) maxX = fx
      if (fy < minY) minY = fy; if (fy > maxY) maxY = fy
    }
  }

  const ifsW = (maxX - minX) || 1
  const ifsH = (maxY - minY) || 1
  const instances = Math.max(1, placement.repeatCount)
  const pts = Math.max(0.4, pointSize * (W / 800))

  for (let inst = 0; inst < instances; inst++) {
    const jx = (Math.random() - 0.5) * placement.repeatJitter
    const jy = (Math.random() - 0.5) * placement.repeatJitter
    const instScale = placement.scaleMin + Math.random() * (placement.scaleMax - placement.scaleMin)

    let anx = clamp(placement.anchorX + jx, 0.02, 0.98)
    let any = clamp(placement.anchorY + jy, 0.02, 0.98)

    if (field && placement.fieldFollow > 0) {
      const { vx, vy } = field.getVector(anx, any)
      const push = placement.fieldFollow * field.influence * 0.12
      anx = clamp(anx + vx * push, 0.02, 0.98)
      any = clamp(any + vy * push, 0.02, 0.98)
    }

    const displaySize = Math.min(W, H) * 0.35 * instScale * globals.scale
    const scaleX = displaySize / ifsW
    const scaleY = displaySize / ifsH
    const offX = anx * W - (minX + ifsW / 2) * scaleX
    const offY = any * H - (minY + ifsH / 2) * scaleY

    let x = 0, y = 0
    const chaosNoise = 0.018 * chaos

    for (let i = 0; i < iterations; i++) {
      const tr = pickTransform()
      const nx = (tr.a + gaussian(0, chaosNoise)) * x + (tr.b + gaussian(0, chaosNoise)) * y + tr.e
      const ny = (tr.c + gaussian(0, chaosNoise)) * x + (tr.d + gaussian(0, chaosNoise)) * y + tr.f
      x = nx; y = ny

      if (i < 20) continue

      const cx = x * scaleX + offX
      const cy = y * scaleY + offY
      if (cx < -4 || cx > W + 4 || cy < -4 || cy > H + 4) continue

      const t = i / iterations
      const { css } = resolveColor(color, cx, cy, W, H, t, 1, chaos)
      ctx.fillStyle = css
      ctx.fillRect(cx - pts * 0.5, cy - pts * 0.5, pts, pts)
    }
  }
}
