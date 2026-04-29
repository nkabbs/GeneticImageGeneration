import { randFloat, randInt, pick } from './random.js'

function uuid() {
  return crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).slice(2, 10)
}

// ---- Palette ----

const PALETTE_MODES = ['analogous', 'complementary', 'triadic', 'chaos']

function randomPalette() {
  const mode = pick(PALETTE_MODES)
  const base = randFloat(0, 360)
  let hues
  if (mode === 'analogous') {
    hues = [base, base + randFloat(20, 55), base + randFloat(55, 100)]
  } else if (mode === 'complementary') {
    hues = [base, base + 180, base + randFloat(-25, 25)]
  } else if (mode === 'triadic') {
    hues = [base, base + 120, base + 240]
  } else {
    hues = [randFloat(0, 360), randFloat(0, 360), randFloat(0, 360)]
  }
  return {
    anchors: hues.map((h, id) => ({
      id,
      h: ((h % 360) + 360) % 360,
      s: randFloat(0.4, 0.9),
      l: randFloat(0.3, 0.7),
    })),
    mode,
    globalHueShift: randFloat(-20, 20),
    contrastBias:   randFloat(0.3, 0.8),
  }
}

// ---- Globals ----

const SYMMETRY_AXIS_OPTIONS = [
  ['vertical'],
  ['horizontal'],
  ['vertical', 'horizontal'],
  ['rotational'],
]

function randomGlobals() {
  const hasSymmetry = Math.random() > 0.5
  return {
    chaos:           randFloat(0.1, 0.65),
    density:         randFloat(0.3, 0.9),
    symmetry:        hasSymmetry ? randFloat(0.55, 1.0) : randFloat(0, 0.45),
    symmetryAxes:    pick(SYMMETRY_AXIS_OPTIONS),
    symmetryN:       randInt(3, 8),
    scale:           randFloat(0.7, 1.3),
    iterationBudget: randFloat(0.5, 1.0),
    blendSaturation: randFloat(0.6, 1.0),
  }
}

// ---- Field ----

const FIELD_TYPES = ['sinusoidal', 'curl', 'radial', 'turbulent']

function randomFieldComponent() {
  return {
    freqX:     randFloat(0.5, 4.0),
    freqY:     randFloat(0.5, 4.0),
    amplitude: randFloat(0.3, 1.0),
    phase:     randFloat(0, Math.PI * 2),
  }
}

function randomField() {
  return {
    type:           pick(FIELD_TYPES),
    components:     Array.from({ length: randInt(1, 3) }, randomFieldComponent),
    warpIterations: randInt(0, 3),
    warpStrength:   randFloat(0.1, 0.8),
    influence:      randFloat(0.2, 0.9),
  }
}

// ---- Shared pattern sub-genes ----

const BLEND_MODES = ['source-over', 'multiply', 'screen', 'overlay']
const INTERPOLATIONS = ['position', 'depth', 'noise', 'fixed']

function randomPlacement() {
  const scaleMin = randFloat(0.2, 0.5)
  return {
    anchorX:      randFloat(0.15, 0.85),
    anchorY:      randFloat(0.15, 0.85),
    fieldFollow:  randFloat(0.1, 0.8),
    repeatCount:  randInt(1, 14),
    repeatJitter: randFloat(0.05, 0.4),
    scaleMin,
    scaleMax:     scaleMin + randFloat(0.1, 0.6),
  }
}

function randomColorGene(anchorCount = 3) {
  return {
    paletteSlotA:    randInt(0, anchorCount - 1),
    paletteSlotB:    randInt(0, anchorCount - 1),
    interpolation:   pick(INTERPOLATIONS),
    opacity:         randFloat(0.4, 0.95),
    opacityVariance: randFloat(0, 0.25),
    blendMode:       pick(BLEND_MODES),
  }
}

// ---- L-system presets ----

const LSYSTEM_PRESETS = [
  { axiom: 'F',     productions: { F: 'F+F-F-F+F' },               angle: 90 },
  { axiom: 'X',     productions: { X: 'F+[[X]-X]-F[-FX]+X', F: 'FF' }, angle: 25 },
  { axiom: 'F',     productions: { F: 'F[+F]F[-F]F' },             angle: 25.7 },
  { axiom: 'F',     productions: { F: 'FF+[+F-F-F]-[-F+F+F]' },   angle: 22.5 },
  { axiom: 'X',     productions: { X: 'F[+X][-X]FX', F: 'FF' },   angle: 35 },
  { axiom: 'F+F+F', productions: { F: 'F-F+F' },                   angle: 120 },
  { axiom: 'F',     productions: { F: 'F+F--F+F' },                angle: 60 },
]

function randomLSystemRules() {
  const preset = pick(LSYSTEM_PRESETS)
  return {
    axiom:         preset.axiom,
    productions:   { ...preset.productions },
    angle:         preset.angle + randFloat(-8, 8),
    angleVariance: randFloat(1, 8),
    iterations:    randInt(3, 6),
    stepLength:    randFloat(18, 42),
    stepDecay:     randFloat(0.55, 0.82),
    branchChance:  randFloat(0.1, 0.6),
    tropism:       { x: randFloat(-0.04, 0.04), y: randFloat(-0.15, 0.04) },
  }
}

// ---- IFS presets ----

const IFS_PRESETS = [
  // Barnsley fern
  { transforms: [
    { a: 0.85, b:  0.04, c: -0.04, d:  0.85, e: 0.0, f: 1.60, p: 0.85 },
    { a: 0.20, b: -0.26, c:  0.23, d:  0.22, e: 0.0, f: 1.60, p: 0.07 },
    { a:-0.15, b:  0.28, c:  0.26, d:  0.24, e: 0.0, f: 0.44, p: 0.07 },
    { a: 0.00, b:  0.00, c:  0.00, d:  0.16, e: 0.0, f: 0.00, p: 0.01 },
  ]},
  // Lévy C curve
  { transforms: [
    { a: 0.5, b: -0.5, c:  0.5, d: 0.5, e: 0.0, f: 0.0, p: 0.5 },
    { a: 0.5, b:  0.5, c: -0.5, d: 0.5, e: 0.5, f: 0.5, p: 0.5 },
  ]},
  // Sierpinski triangle
  { transforms: [
    { a: 0.5, b: 0.0, c: 0.0, d: 0.5, e: 0.00,  f: 0.000, p: 0.34 },
    { a: 0.5, b: 0.0, c: 0.0, d: 0.5, e: 0.50,  f: 0.000, p: 0.33 },
    { a: 0.5, b: 0.0, c: 0.0, d: 0.5, e: 0.25,  f: 0.433, p: 0.33 },
  ]},
  // Dragon curve
  { transforms: [
    { a:  0.5, b: -0.5, c:  0.5, d:  0.5, e: 0.0, f: 0.0, p: 0.5 },
    { a: -0.5, b: -0.5, c:  0.5, d: -0.5, e: 1.0, f: 0.0, p: 0.5 },
  ]},
]

function randomIFSRules() {
  const preset = pick(IFS_PRESETS)
  return {
    transforms: preset.transforms.map(t => ({
      ...t,
      a: t.a + randFloat(-0.04, 0.04),
      b: t.b + randFloat(-0.04, 0.04),
      c: t.c + randFloat(-0.04, 0.04),
      d: t.d + randFloat(-0.04, 0.04),
    })),
    iterations: randInt(30000, 70000),
    pointSize:  randFloat(0.8, 2.0),
  }
}

// ---- Geometric presets ----

const SHAPES     = ['star', 'polygon', 'circle']
const FILL_STYLES = ['radialGradient', 'linearGradient', 'flat']

function randomGeometricRules() {
  return {
    shape:         pick(SHAPES),
    points:        randInt(3, 9),
    pointVariance: randFloat(0.05, 0.3),
    innerRatio:    randFloat(0.3, 0.65),
    innerVariance: randFloat(0.05, 0.2),
    fillStyle:     pick(FILL_STYLES),
    strokeWeight:  randFloat(0, 2.5),
    warpStrength:  randFloat(0, 0.5),
  }
}

// ---- Pattern gene ----

const PATTERN_TYPES = ['lsystem', 'ifs', 'geometric']

export function randomPatternGene(id) {
  const type = 'lsystem' // pick(PATTERN_TYPES)
  const rules = type === 'lsystem' ? randomLSystemRules()
              : type === 'ifs'     ? randomIFSRules()
              :                      randomGeometricRules()
  //const rules = randomSystematicRules()
  return {
    id:        id || `p${uuid()}`,
    type,
    enabled:   true,
    placement: randomPlacement(),
    color:     randomColorGene(),
    rules,
  }
}

// ---- Background gene (keeps existing RGB system for noise renderers) ----

const BG_TYPES     = ['simplexNoise', 'perlinNoise', 'proceduralNoise']
const BG_BLENDS    = ['multiply', 'screen', 'overlay']

function randomColor()      { return [randInt(20, 235), randInt(20, 235), randInt(20, 235)] }
function randomColorRange() { return [randInt(5, 50), randInt(5, 50), randInt(5, 50)] }

export function randomBackgroundGene(id) {
  const n = randInt(1, 3)
  const baseColors = Array.from({ length: n }, randomColor)
  return {
    id:         id || `bg${uuid()}`,
    type:       pick(BG_TYPES),
    baseColors,
    colorRanges: Array.from({ length: n }, randomColorRange),
    noiseScale: randFloat(0.002, 0.018),
    proportion: randFloat(0.3, 1.0),
    blendMode:  pick(BG_BLENDS),
    opacity:    randFloat(0.25, 0.75),
    blur:       randFloat(1, 6),
  }
}

// ---- Pipeline ----

const BG_POSTS      = [null, null, null, 'blur:2', 'blur:3']
const PATTERN_POSTS = [null, null, null, 'blur:0.5', 'blur:1', 'glow:3', 'sharpen', 'displace:0.5']

// ---- Root DNA ----

export function randomDNA() {
  const patternCount = randInt(10, 20)
  const bgCount      = randInt(1, 3)
  const patterns     = Array.from({ length: patternCount }, (_, i) => randomPatternGene(`p${i}`))
  //const backgrounds  = Array.from({ length: bgCount },      (_, i) => randomBackgroundGene(`bg${i}`))
  const backgrounds  = []
  const pipeline = [
    //...backgrounds.map(bg => ({ ref: bg.id, post: pick(BG_POSTS) })),
    ...patterns.map(p      => ({ ref: p.id,  post: pick(PATTERN_POSTS) })),
  ]

  return {
    version: 2,
    meta:    { generation: 0, parents: [], uuid: uuid() },
    palette:     randomPalette(),
    globals:     randomGlobals(),
    field:       randomField(),
    pipeline,
    patterns,
    backgrounds,
  }
}
