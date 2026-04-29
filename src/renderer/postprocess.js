import { clamp } from '../genetics/random.js'

export function applyPostProcess(offCanvas, postStr, field) {
  if (!postStr) return
  const W = offCanvas.width
  const H = offCanvas.height
  const [type, rawVal] = postStr.split(':')
  const N = rawVal !== undefined ? parseFloat(rawVal) : 1
  const ctx = offCanvas.getContext('2d')

  if (type === 'blur') {
    const tmp = document.createElement('canvas')
    tmp.width = W; tmp.height = H
    const tCtx = tmp.getContext('2d')
    tCtx.filter = `blur(${N}px)`
    tCtx.drawImage(offCanvas, 0, 0)
    ctx.clearRect(0, 0, W, H)
    ctx.drawImage(tmp, 0, 0)

  } else if (type === 'glow') {
    const tmp = document.createElement('canvas')
    tmp.width = W; tmp.height = H
    const tCtx = tmp.getContext('2d')
    tCtx.filter = `blur(${N}px)`
    tCtx.drawImage(offCanvas, 0, 0)
    ctx.save()
    ctx.globalCompositeOperation = 'screen'
    ctx.globalAlpha = 0.65
    ctx.drawImage(tmp, 0, 0)
    ctx.restore()

  } else if (type === 'sharpen') {
    // Unsharp mask: composite a blurred copy back with overlay
    const tmp = document.createElement('canvas')
    tmp.width = W; tmp.height = H
    const tCtx = tmp.getContext('2d')
    tCtx.filter = 'blur(1.5px)'
    tCtx.drawImage(offCanvas, 0, 0)
    ctx.save()
    ctx.globalCompositeOperation = 'overlay'
    ctx.globalAlpha = 0.45
    ctx.drawImage(tmp, 0, 0)
    ctx.restore()

  } else if (type === 'displace' && field) {
    const imageData = ctx.getImageData(0, 0, W, H)
    const src = new Uint8ClampedArray(imageData.data)
    const out = ctx.createImageData(W, H)
    const strength = N * 24

    for (let py = 0; py < H; py++) {
      for (let px = 0; px < W; px++) {
        const { vx, vy } = field.getVector(px / W, py / H)
        const sx = clamp(Math.round(px - vx * strength), 0, W - 1)
        const sy = clamp(Math.round(py - vy * strength), 0, H - 1)
        const si = (sy * W + sx) * 4
        const di = (py * W + px) * 4
        out.data[di]     = src[si]
        out.data[di + 1] = src[si + 1]
        out.data[di + 2] = src[si + 2]
        out.data[di + 3] = src[si + 3]
      }
    }
    ctx.putImageData(out, 0, 0)
  }
}
