export function gaussian(mean = 0, sigma = 1) {
  let u, v
  do { u = Math.random() } while (u === 0)
  do { v = Math.random() } while (v === 0)
  return mean + sigma * Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v)
}

export function clamp(v, lo, hi) {
  return Math.max(lo, Math.min(hi, v))
}

export function lerp(a, b, t) {
  return a + (b - a) * t
}

export function randInt(lo, hi) {
  return Math.floor(Math.random() * (hi - lo + 1)) + lo
}

export function randFloat(lo, hi) {
  return lo + Math.random() * (hi - lo)
}

export function pick(arr) {
  return arr[Math.floor(Math.random() * arr.length)]
}

export function weightedAvg(values) {
  if (values.length === 0) return 0
  return values.reduce((s, v) => s + v, 0) / values.length
}

export function smoothstep(lo, hi, t) {
  const x = clamp((t - lo) / (hi - lo), 0, 1)
  return x * x * (3 - 2 * x)
}
