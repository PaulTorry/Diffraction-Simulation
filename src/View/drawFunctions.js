import { Vec } from '../Vec.js'

/*
*  c, canvas;   w, wave (length, amplitude, phase)
*  origin (the centre of rotation of the cosine curve, also where phase = w.phase)
*  [Where the curve starts to draw (can be -ve), where the curve ends] - In local pixels before scaling
*  pd, path difference;       scale (both x and y are muliplied to the screen)
*/

function cosineCurve (c, w, originX, originY, [start, length] = [0, 200], pd = 0, scale = 1, deflectionAngle = 0, colour = 'black', fill = [[0, 0, 'black']], trigFunc = Math.cos) {
  const dispAtX = (x, rectFunc = (a) => a) => rectFunc(w.amplitude * trigFunc(((x + pd)) / (w.length) - w.phase))
  const pageVec = (x, y) => new Vec(x, y).rotate(deflectionAngle).scale(scale).addXY(originX, originY)
  const plot = (x, dx, rectFunc) => {
    c.beginPath()
    c.moveTo(...pageVec(x, 0))
    for (let dl = x; dl <= x + dx; dl += 1 / scale) {
      c.lineTo(...pageVec(dl, dispAtX(dl, rectFunc)))
    }
    c.lineTo(...pageVec(x + dx, 0))
  }
  c.strokeStyle = colour
  plot(start / scale, length / scale)
  c.stroke()

  if (fill) {
    for (const [x, dx, col, func] of fill) {
      c.fillStyle = col
      plot(x, dx, func)
      c.stroke()
      c.fill()
    }
  }
}

function drawLine (c, x1, y1, dx, dy, color) {
  if (color) { c.strokeStyle = color }
  c.beginPath()
  c.moveTo(x1, y1)
  c.lineTo(x1 + dx, y1 + dy)
  c.stroke()
  c.fill()
  c.beginPath()
}

function drawTrace (cx, array, startX = 0, startY = 0, colour = 'rgba(0, 0, 0, 0.4)', dx = 0, dy = 1, vx = 1, vy = 0) {
  cx.beginPath()
  cx.moveTo(startX, startY)
  cx.strokeStyle = colour
  array.forEach((v, i, a) => {
    if (v * a[i - 1] === 0) {
      cx.moveTo(startX + dx * i + vx * v, startY + dy * i + vy * v)
    } else { cx.lineTo(startX + dx * i + vx * v, startY + dy * i + vy * v) }
  })
  cx.stroke()
}

export { drawLine, drawTrace, cosineCurve as newSin }
