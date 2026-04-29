import { gaussian, clamp, randFloat, randInt, pick, weightedAvg } from './random.js'
import { randomPatternGene, randomBackgroundGene } from './dna.js'

// ---- Cascade add/drop (same as before) ----

function cascade(chance) {
  let n = 0
  while (Math.random() < chance) { n++; chance *= 0.2 }
  return n
}

// ---- Palette ----

function mutateAnchor(a) {
  return {
    ...a,
    h: ((a.h + gaussian(0, 15)) % 360 + 360) % 360,
    s: clamp(a.s + gaussian(0, 0.08), 0.1, 1.0),
    l: clamp(a.l + gaussian(0, 0.08), 0.1, 0.9),
  }
}

function mutatePalette(p) {
  return {
    ...p,
    anchors:        p.anchors.map(mutateAnchor),
    globalHueShift: clamp(p.globalHueShift + gaussian(0, 5), -30, 30),
    contrastBias:   clamp(p.contrastBias   + gaussian(0, 0.05), 0, 1),
  }
}

function crossoverPalette(parents) {
  const base = pick(parents).palette
  const anchors = base.anchors.map((anchor, i) => {
    const all = parents.map(p => p.palette.anchors[Math.min(i, p.palette.anchors.length - 1)])
    return {
      ...anchor,
      h: weightedAvg(all.map(a => a.h)),
      s: weightedAvg(all.map(a => a.s)),
      l: weightedAvg(all.map(a => a.l)),
    }
  })
  return { ...base, anchors }
}

// ---- Globals ----

function mutateGlobals(g) {
  return {
    ...g,
    chaos:           clamp(g.chaos           + gaussian(0, 0.05),  0, 1),
    density:         clamp(g.density         + gaussian(0, 0.06),  0.1, 1.0),
    symmetry:        clamp(g.symmetry        + gaussian(0, 0.05),  0, 1),
    symmetryN:       clamp(Math.round(g.symmetryN + gaussian(0, 0.5)), 2, 12),
    scale:           clamp(g.scale           + gaussian(0, 0.07),  0.3, 2.0),
    iterationBudget: clamp(g.iterationBudget + gaussian(0, 0.05),  0.2, 1.0),
    blendSaturation: clamp(g.blendSaturation + gaussian(0, 0.05),  0.3, 1.0),
  }
}

function crossoverGlobals(parents) {
  const gs = parents.map(p => p.globals)
  return {
    chaos:           weightedAvg(gs.map(g => g.chaos)),
    density:         weightedAvg(gs.map(g => g.density)),
    symmetry:        weightedAvg(gs.map(g => g.symmetry)),
    symmetryAxes:    pick(gs).symmetryAxes,
    symmetryN:       Math.round(weightedAvg(gs.map(g => g.symmetryN))),
    scale:           weightedAvg(gs.map(g => g.scale)),
    iterationBudget: weightedAvg(gs.map(g => g.iterationBudget)),
    blendSaturation: weightedAvg(gs.map(g => g.blendSaturation)),
  }
}

// ---- Field ----

function mutateFieldComponent(c, chaos) {
  return {
    freqX:     clamp(c.freqX     + gaussian(0, 0.3 * chaos),  0.1, 6.0),
    freqY:     clamp(c.freqY     + gaussian(0, 0.3 * chaos),  0.1, 6.0),
    amplitude: clamp(c.amplitude + gaussian(0, 0.08),          0.05, 1.5),
    phase:     c.phase           + gaussian(0, 0.2),
  }
}

const FIELD_TYPES = ['sinusoidal', 'curl', 'radial', 'turbulent']

function mutateField(f, chaos) {
  return {
    type:           Math.random() < 0.05 ? pick(FIELD_TYPES) : f.type,
    components:     f.components.map(c => mutateFieldComponent(c, chaos)),
    warpIterations: clamp(Math.round(f.warpIterations + gaussian(0, 0.4)), 0, 4),
    warpStrength:   clamp(f.warpStrength + gaussian(0, 0.05 * chaos),      0.0, 1.0),
    influence:      clamp(f.influence    + gaussian(0, 0.05),               0.0, 1.0),
  }
}

// ---- Placement ----

function mutatePlacement(pl, chaos) {
  return {
    anchorX:      clamp(pl.anchorX      + gaussian(0, 0.04 * chaos), 0.05, 0.95),
    anchorY:      clamp(pl.anchorY      + gaussian(0, 0.04 * chaos), 0.05, 0.95),
    fieldFollow:  clamp(pl.fieldFollow  + gaussian(0, 0.04),          0, 1),
    repeatCount:  clamp(Math.round(pl.repeatCount + gaussian(0, 1.5 * chaos)), 1, 20),
    repeatJitter: clamp(pl.repeatJitter + gaussian(0, 0.03 * chaos),  0, 0.5),
    scaleMin:     clamp(pl.scaleMin     + gaussian(0, 0.03 * chaos),  0.1, pl.scaleMax - 0.05),
    scaleMax:     clamp(pl.scaleMax     + gaussian(0, 0.03 * chaos),  pl.scaleMin + 0.05, 1.5),
  }
}

// ---- Color gene ----

const INTERPOLATIONS = ['position', 'depth', 'noise', 'fixed']
const BLEND_MODES    = ['source-over', 'multiply', 'screen', 'overlay']

function mutateColorGene(c, anchorCount, chaos) {
  return {
    ...c,
    paletteSlotA:    Math.random() < 0.08 ? randInt(0, anchorCount - 1) : c.paletteSlotA,
    paletteSlotB:    Math.random() < 0.08 ? randInt(0, anchorCount - 1) : c.paletteSlotB,
    interpolation:   Math.random() < 0.05 ? pick(INTERPOLATIONS) : c.interpolation,
    opacity:         clamp(c.opacity         + gaussian(0, 0.04 * chaos), 0.05, 1.0),
    opacityVariance: clamp(c.opacityVariance + gaussian(0, 0.02 * chaos), 0, 0.5),
    blendMode:       Math.random() < 0.05 ? pick(BLEND_MODES) : c.blendMode,
  }
}

// ---- L-System rules ----

const L_CHARS = 'FF+[]-XY'

function mutateProductions(prods) {
  const result = { ...prods }
  const keys = Object.keys(result)
  if (!keys.length) return result
  const key = pick(keys)
  const s = result[key]
  const r = Math.random()
  if (r < 0.35 && s.length > 0) {
    // Replace a character
    const idx = Math.floor(Math.random() * s.length)
    const chars = Array.from(s)
    chars[idx] = L_CHARS[Math.floor(Math.random() * L_CHARS.length)]
    result[key] = chars.join('')
  } else if (r < 0.60 && s.length >= 2) {
    // Swap two characters
    const i = Math.floor(Math.random() * s.length)
    const j = Math.floor(Math.random() * s.length)
    const chars = Array.from(s)
    ;[chars[i], chars[j]] = [chars[j], chars[i]]
    result[key] = chars.join('')
  } else if (r < 0.80) {
    // Insert a character
    const idx = Math.floor(Math.random() * (s.length + 1))
    result[key] = s.slice(0, idx) + L_CHARS[Math.floor(Math.random() * L_CHARS.length)] + s.slice(idx)
  } else if (s.length > 1) {
    // Delete a character
    const idx = Math.floor(Math.random() * s.length)
    result[key] = s.slice(0, idx) + s.slice(idx + 1)
  }
  // Rarely add a new production key
  if (Math.random() < 0.05) {
    const candidates = ['X', 'Y', 'A', 'B'].filter(k => !result[k])
    if (candidates.length) result[pick(candidates)] = pick(['F+F', 'F-F', 'F[+F]F', 'FF'])
  }
  return result
}

function mutateLSystemRules(r, chaos) {
  return {
    ...r,
    productions:   mutateProductions(r.productions),
    angle:         clamp(r.angle         + gaussian(0, 5 * chaos),   5, 180),
    angleVariance: clamp(r.angleVariance + gaussian(0, 1 * chaos),   0, 20),
    iterations:    clamp(Math.round(r.iterations + gaussian(0, 0.3)), 2, 7),
    stepLength:    clamp(r.stepLength    + gaussian(0, 1.5 * chaos),  2, 40),
    stepDecay:     clamp(r.stepDecay     + gaussian(0, 0.025 * chaos),0.4, 0.95),
    branchChance:  clamp(r.branchChance  + gaussian(0, 0.05 * chaos), 0, 1),
    tropism: {
      x: clamp(r.tropism.x + gaussian(0, 0.02 * chaos), -0.3, 0.3),
      y: clamp(r.tropism.y + gaussian(0, 0.02 * chaos), -0.3, 0.1),
    },
  }
}

// ---- IFS rules ----

function mutateTransform(t, chaos) {
  const s = 0.018 * (1 + chaos)
  return {
    a: t.a + gaussian(0, s),
    b: t.b + gaussian(0, s),
    c: t.c + gaussian(0, s),
    d: t.d + gaussian(0, s),
    e: t.e + gaussian(0, s * 0.5),
    f: t.f + gaussian(0, s * 0.5),
    p: clamp(t.p + gaussian(0, 0.02), 0.01, 1.0),
  }
}

function mutateIFSRules(r, chaos) {
  let transforms = r.transforms.map(t => mutateTransform(t, chaos))
  const add  = cascade(0.15)
  const drop = Math.min(cascade(0.15), transforms.length - 1)
  for (let i = 0; i < add; i++)  transforms.push(mutateTransform(pick(transforms), chaos * 1.5))
  for (let i = 0; i < drop; i++) transforms.splice(Math.floor(Math.random() * transforms.length), 1)
  return {
    ...r,
    transforms,
    iterations: clamp(Math.round(r.iterations + gaussian(0, 3000 * chaos)), 10000, 120000),
    pointSize:  clamp(r.pointSize + gaussian(0, 0.1 * chaos), 0.5, 3.5),
  }
}

// ---- Geometric rules ----

const SHAPES      = ['star', 'polygon', 'circle']
const FILL_STYLES = ['radialGradient', 'linearGradient', 'flat']

function mutateGeometricRules(r, chaos) {
  return {
    ...r,
    shape:         Math.random() < 0.04 ? pick(SHAPES)      : r.shape,
    fillStyle:     Math.random() < 0.05 ? pick(FILL_STYLES) : r.fillStyle,
    points:        clamp(Math.round(r.points + gaussian(0, 0.5 * chaos)), 3, 12),
    pointVariance: clamp(r.pointVariance + gaussian(0, 0.03 * chaos), 0, 0.5),
    innerRatio:    clamp(r.innerRatio    + gaussian(0, 0.03 * chaos), 0.1, 0.9),
    innerVariance: clamp(r.innerVariance + gaussian(0, 0.02 * chaos), 0, 0.4),
    strokeWeight:  clamp(r.strokeWeight  + gaussian(0, 0.15 * chaos), 0, 6),
    warpStrength:  clamp(r.warpStrength  + gaussian(0, 0.05 * chaos), 0, 1),
  }
}

// ---- Pattern & background mutation ----

function mutateRules(gene, chaos) {
  if (gene.type === 'lsystem')  return mutateLSystemRules(gene.rules, chaos)
  if (gene.type === 'ifs')      return mutateIFSRules(gene.rules, chaos)
  return mutateGeometricRules(gene.rules, chaos)
}

function mutatePattern(gene, anchorCount, chaos) {
  return {
    ...gene,
    placement: mutatePlacement(gene.placement, chaos),
    color:     mutateColorGene(gene.color, anchorCount, chaos),
    rules:     mutateRules(gene, chaos),
  }
}

const BG_TYPES  = ['simplexNoise', 'perlinNoise', 'proceduralNoise']
const BG_BLENDS = ['multiply', 'screen', 'overlay']

function mutateBackground(bg, chaos) {
  return {
    ...bg,
    type:       Math.random() < 0.04 ? pick(BG_TYPES)  : bg.type,
    blendMode:  Math.random() < 0.05 ? pick(BG_BLENDS) : bg.blendMode,
    baseColors: bg.baseColors.map((c, i) =>
      c.map((v, j) => clamp(Math.round(v + gaussian(0, bg.colorRanges[i][j] * 0.4 * chaos)), 0, 255))
    ),
    noiseScale: clamp(bg.noiseScale + gaussian(0, 0.001 * chaos), 0.001, 0.025),
    proportion: clamp(bg.proportion + gaussian(0, 0.05 * chaos),  0.15, 1.0),
    opacity:    clamp(bg.opacity    + gaussian(0, 0.04 * chaos),  0.1, 0.9),
    blur:       clamp(bg.blur       + gaussian(0, 0.3 * chaos),   0.5, 8),
  }
}

// ---- Pipeline mutation ----

const BG_POSTS      = [null, null, null, 'blur:2', 'blur:3']
const PATTERN_POSTS = [null, null, null, 'blur:0.5', 'blur:1', 'glow:3', 'sharpen', 'displace:0.5']

function mutatePipeline(pipeline) {
  let result = [...pipeline]
  // Swap adjacent entries with p=0.15
  for (let i = 0; i < result.length - 1; i++) {
    if (Math.random() < 0.15) {
      ;[result[i], result[i + 1]] = [result[i + 1], result[i]]
    }
  }
  // Mutate post-process tags
  return result.map(entry => {
    if (Math.random() < 0.08) {
      const isBg = entry.ref.startsWith('bg')
      return { ...entry, post: pick(isBg ? BG_POSTS : PATTERN_POSTS) }
    }
    return entry
  })
}

// ---- Public: mutate ----

export function mutate(dna) {
  const chaos       = dna.globals.chaos
  const anchorCount = dna.palette.anchors.length

  let patterns    = dna.patterns.map(p    => mutatePattern(p, anchorCount, chaos))
  let backgrounds = dna.backgrounds.map(bg => mutateBackground(bg, chaos))

  // Add / drop patterns
  const addP  = cascade(0.2 * chaos)
  const dropP = Math.min(cascade(0.2 * chaos), patterns.length - 1)
  for (let i = 0; i < addP; i++)  patterns.push(randomPatternGene(`p${Date.now()}_${i}`))
  for (let i = 0; i < dropP; i++) patterns.splice(Math.floor(Math.random() * patterns.length), 1)

  // Sync pipeline: remove stale refs, add new pattern IDs
  const allIds = new Set([...patterns.map(p => p.id), ...backgrounds.map(bg => bg.id)])
  let pipeline = dna.pipeline.filter(e => allIds.has(e.ref))
  for (const p of patterns) {
    if (!pipeline.some(e => e.ref === p.id)) {
      pipeline.push({ ref: p.id, post: pick(PATTERN_POSTS) })
    }
  }
  pipeline = mutatePipeline(pipeline)

  return {
    ...dna,
    meta:        { ...dna.meta, generation: dna.meta.generation + 1 },
    palette:     mutatePalette(dna.palette),
    globals:     mutateGlobals(dna.globals),
    field:       mutateField(dna.field, chaos),
    patterns,
    backgrounds,
    pipeline,
  }
}

// ---- Public: crossover ----

export function crossover(parents) {
  if (parents.length === 1) return JSON.parse(JSON.stringify(parents[0]))

  // Gene-by-gene pattern selection so children mix both parents' types
  const targetPat = randInt(
    Math.min(...parents.map(p => p.patterns.length)),
    Math.max(...parents.map(p => p.patterns.length))
  )
  const patterns = []
  for (let i = 0; i < targetPat; i++) {
    const donor = pick(parents)
    patterns.push(JSON.parse(JSON.stringify(donor.patterns[i % donor.patterns.length])))
  }

  const targetBg = randInt(
    Math.min(...parents.map(p => p.backgrounds.length)),
    Math.max(...parents.map(p => p.backgrounds.length))
  )
  const backgrounds = []
  for (let i = 0; i < targetBg; i++) {
    const donor = pick(parents)
    backgrounds.push(JSON.parse(JSON.stringify(donor.backgrounds[i % donor.backgrounds.length])))
  }

  // Reassign IDs to avoid collisions
  patterns.forEach((p, i)    => { p.id = `p${i}` })
  backgrounds.forEach((bg, i) => { bg.id = `bg${i}` })

  const pipeline = [
    ...backgrounds.map(bg => ({ ref: bg.id, post: pick(BG_POSTS) })),
    ...patterns.map(p      => ({ ref: p.id,  post: pick(PATTERN_POSTS) })),
  ]

  return {
    version: 2,
    meta: {
      generation: Math.max(...parents.map(p => p.meta.generation)) + 1,
      parents:    parents.map(p => p.meta.uuid),
      uuid:       crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).slice(2, 10),
    },
    palette:     crossoverPalette(parents),
    globals:     crossoverGlobals(parents),
    field:       pick(parents).field,
    pipeline,
    patterns,
    backgrounds,
  }
}
