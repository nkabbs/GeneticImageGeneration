import { renderSimplexNoise }    from './backgrounds/simplexNoise.js'
import { renderPerlinNoise }     from './backgrounds/perlinNoise.js'
import { renderProceduralNoise } from './backgrounds/proceduralNoise.js'
import { drawLSystem }           from './patterns/lsystem.js'
import { drawIFS }               from './patterns/ifs.js'
import { drawGeometric }         from './patterns/geometric.js'
import { buildField }            from './field.js'
import { applyPostProcess }      from './postprocess.js'

const BG_RENDERERS = {
  simplexNoise:    renderSimplexNoise,
  perlinNoise:     renderPerlinNoise,
  proceduralNoise: renderProceduralNoise,
}

const PATTERN_DRAWERS = {
  lsystem:   drawLSystem,
  ifs:       drawIFS,
  geometric: drawGeometric,
}

function applySymmetry(canvas, ctx, W, H, globals) {
  if (globals.symmetry <= 0.5) return

  for (const axis of globals.symmetryAxes) {
    if (axis === 'vertical') {
      const imageData = ctx.getImageData(0, 0, W, H)
      const d = imageData.data
      for (let y = 0; y < H; y++) {
        for (let x = 0; x < Math.floor(W / 2); x++) {
          const li = (y * W + x) * 4
          const ri = (y * W + (W - 1 - x)) * 4
          d[ri] = d[li]; d[ri+1] = d[li+1]; d[ri+2] = d[li+2]; d[ri+3] = d[li+3]
        }
      }
      ctx.putImageData(imageData, 0, 0)

    } else if (axis === 'horizontal') {
      const imageData = ctx.getImageData(0, 0, W, H)
      const d = imageData.data
      for (let y = 0; y < Math.floor(H / 2); y++) {
        for (let x = 0; x < W; x++) {
          const ti = (y * W + x) * 4
          const bi = ((H - 1 - y) * W + x) * 4
          d[bi] = d[ti]; d[bi+1] = d[ti+1]; d[bi+2] = d[ti+2]; d[bi+3] = d[ti+3]
        }
      }
      ctx.putImageData(imageData, 0, 0)

    } else if (axis === 'rotational') {
      const N = Math.max(2, globals.symmetryN || 6)
      const cx = W / 2, cy = H / 2
      const snap = document.createElement('canvas')
      snap.width = W; snap.height = H
      snap.getContext('2d').drawImage(canvas, 0, 0)

      for (let i = 1; i < N; i++) {
        const angle = (i * Math.PI * 2) / N
        ctx.save()
        ctx.translate(cx, cy)
        ctx.rotate(angle)
        ctx.translate(-cx, -cy)
        ctx.globalCompositeOperation = 'screen'
        ctx.globalAlpha = 0.55
        ctx.drawImage(snap, 0, 0)
        ctx.restore()
      }
    }
  }
}

export function renderDNA(canvas, dna) {
  const W = canvas.width
  const H = canvas.height
  const ctx = canvas.getContext('2d')
  const { palette, pipeline, patterns, backgrounds, field: fieldGene, globals } = dna

  const field = buildField(fieldGene)

  // Index all layers by id
  const layerMap = {}
  for (const bg of backgrounds) layerMap[bg.id] = { kind: 'bg', gene: bg }
  for (const p  of patterns)   layerMap[p.id]  = { kind: 'pattern', gene: p }

  ctx.globalCompositeOperation = 'source-over'
  ctx.globalAlpha = 1
  ctx.fillStyle = '#f5f3ee'
  ctx.fillRect(0, 0, W, H)

  for (const entry of pipeline) {
    const layer = layerMap[entry.ref]
    if (!layer) continue
    if (layer.kind === 'pattern' && !layer.gene.enabled) continue

    const off = document.createElement('canvas')
    off.width = W; off.height = H
    const offCtx = off.getContext('2d')

    if (layer.kind === 'bg') {
      const renderer = BG_RENDERERS[layer.gene.type]
      if (renderer) renderer(offCtx, layer.gene, W, H)
    } else {
      const drawer = PATTERN_DRAWERS[layer.gene.type]
      if (drawer) drawer(offCtx, layer.gene, W, H, palette, field, globals)
    }

    applyPostProcess(off, entry.post, field)

    const blendMode = layer.kind === 'bg' ? (layer.gene.blendMode || 'source-over') : (layer.gene.color.blendMode || 'source-over')
    const opacity   = layer.kind === 'bg' ? layer.gene.opacity : layer.gene.color.opacity

    ctx.save()
    ctx.globalCompositeOperation = blendMode
    ctx.globalAlpha = opacity * globals.blendSaturation
    ctx.drawImage(off, 0, 0)
    ctx.restore()
  }

  applySymmetry(canvas, ctx, W, H, globals)

  ctx.globalCompositeOperation = 'source-over'
  ctx.globalAlpha = 1
}
