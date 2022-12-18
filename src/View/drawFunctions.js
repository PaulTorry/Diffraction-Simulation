import { Vec } from '../Vec.js'

function sketchFunction (c, origin, [start, end] = [0, 200], func = Math.cos, colour = 'black', fill = false, angle = 0) {
  const pageVec = (x, y) => new Vec(x, y).rotate(angle).add(origin)
  c.strokeStyle = colour
  c.beginPath()
  c.moveTo(...pageVec(start, 0))
  for (let dl = start; dl <= end; dl += 1) {
    c.lineTo(...pageVec(dl, func(dl)))
  }
  c.lineTo(...pageVec(end, 0))
  c.stroke()
  if (fill) { c.fillStyle = colour; c.fill() }
  c.beginPath()
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

function drawArrow (c, start, vec, color = 'black', headSize = 5) {
  const end = start.add(vec)
  drawLine(c, ...start, ...vec, color)
  drawLine(c, ...end, ...vec.rotate(Math.PI * 5 / 4).normalise.scale(headSize), color)
  drawLine(c, ...end, ...vec.rotate(Math.PI * 3 / 4).normalise.scale(headSize), color)
}

function drawTrace (cx, array, startX = 0, startY = 0, colour = 'rgba(0, 0, 0, 0.4)', dx = 0, dy = 1, vx = 1, vy = 0, amp, scaleFactor) {
  cx.beginPath()
  cx.moveTo(startX, startY)
  cx.strokeStyle = colour
  array.forEach((v, i, a) => {
    let vv = amp ? v * v : v
    vv = vv * scaleFactor
    if (v * a[i - 1] === 0) {
      cx.moveTo(startX + dx * i + vx * vv, startY + dy * i + vy * vv)
    } else {
      cx.lineTo(startX + dx * i + vx * vv, startY + dy * i + vy * vv)
    }
  })
  cx.stroke()
}

export { drawLine, drawTrace, sketchFunction, drawArrow }
