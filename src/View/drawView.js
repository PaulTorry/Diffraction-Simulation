import { Vec } from '../Vec.js'
import { drawLine, drawTrace, newSin } from './drawFunctions.js'

// Each slit has a unique colour @TODO get opinions on these

const colours = (i, opacity = 1) => {
  const colourArray = [[73, 137, 171], [73, 171, 135], [73, 171, 96], [135, 171, 73], [171, 166, 73], [171, 146, 73]]
  const col = 'rgba(' + colourArray[i][0] + ',' + colourArray[i][1] + ',' + colourArray[i][2] + ',' + opacity + ')'
  return col
}

// Draw foreground, the rays and sin waves and phasors

function drawForground (c, slit, ray, wave, pos, viewScale) {
  const geo = ray.geo
  const edges = ray.grating.edges.map(a => a) // .reverse().map(([a, b]) => [a + 2 * ray.grating.firstSlit, b + 2 * ray.grating.firstSlit])

  const firstSlitPosY = slit.firstSlit + pos.topViewXY.y / 2
  // console.log(edges.flat(), ray.grating.edges.flat())
  const screenDisplacement = geo.d + pos.topViewXY.y / 2
  // c.clearRect(0, 0, c.canvas.width, c.canvas.height)

  // line from center of slits to screen
  drawLine(c, pos.grating.x, pos.topViewXY.y / 2, geo.D, geo.d)

  // waves arriving at grating
  newSin(c, wave, pos.grating.x, slit.firstSlit + pos.topViewXY.y / 2, [-pos.grating.x, pos.grating.x])

  // waves, phasors at slit and at path difference
  let arrowStart = new Vec(0, 0)

  // getSinFill is an array to pass to drawSin which draws the red and blue components on the wave
  // Work in progress const getSinFill = (a, b) => [[a, b - a, 'blue', (a) => Math.max(a, 0)], [a, b - a, 'red', (a) => Math.min(a, 0)]]
  const getSinFill = (aa, bb) => {
    const a = aa; const b = bb - aa
    return [[a, b, 'blue', (a) => Math.max(a, 0)], [a, b, 'red', (a) => Math.min(a, 0)]]
  }

  /*
  *   The main loop which goes through each edge to draw the sin cures, and phasors (also the phasors at bottom right)
  */

  edges.forEach(([top, bot], i) => {
    const slitTop = new Vec(pos.grating.x, top + firstSlitPosY)
    const slitBottom = new Vec(pos.grating.x, bot + firstSlitPosY)

    // sincurves at angles
    newSin(c, wave, ...slitTop, [0, geo.l / 2], 0, 1, geo.theta, colours(i, 0.4))
    newSin(c, wave, ...slitBottom, [0, geo.l / 2], 0, 1, geo.theta, colours(i), getSinFill(-top * geo.sin, -bot * geo.sin))

    // phasor at grating
    drawLine(c, ...slitTop, ...ray.phasorAtGrating.scale(wave.amplitude))

    // on angled sin curve
    // drawLine(c, ...slitTop.add(p1), ...ph1.scale(wave.amplitude))
    // drawLine(c, ...slitBottom.add(p2), ...ph2.scale(wave.amplitude))
    drawLine(c, ...slitTop.add(ray.calcPhasorPos(top)), ...ray.calculatePhasor(top).scale(wave.amplitude))
    drawLine(c, ...slitBottom.add(ray.calcPhasorPos(bot)), ...ray.calculatePhasor(bot).scale(wave.amplitude))

    // Phasors at botom and in sum
    const integral = ray.calcIntegral(top, bot)
    // vector at bottom
    drawLine(c, ...pos.phaseDiagram.addXY(-100, i * 40 - slit.number * 20 + 20), ...integral.scale(wave.amplitude), colours(i))
    // vector added to sum
    drawLine(c, ...arrowStart.add(pos.phaseDiagram), ...integral.scale(wave.amplitude), colours(i))
    arrowStart = arrowStart.add(integral.scale(wave.amplitude))

    // const integralPh = ph.integrateTo(ph2).scale(5 / (slit.width * geo.sin))
    drawLine(c, ...pos.phaseDiagram.addXY(-100, i * 40 - slit.number * 20 + 20), ...integral.scale(wave.amplitude), colours(i))
  })

  // bottom wave with areas
  // const fills = sd.centres.map((yy, i, a) => [yy * geo.sin, 3, colours(i)])

  const fills = slit.edges.map((c, i, a) => {
    const [yyy, yy] = c.map(cc => cc * geo.sin)
    return [Math.min(-yyy, -yy), Math.max(Math.abs(-yyy + yy), 1), colours(i)]
  })

  // newSin(c, wave, 100, pos.topViewXY.y + 300, [0, 600], pos.grating.x, 1, 0, 'black', fills)
  newSin(c, wave, 300, 700, [-150, 700], 0, 4, 0, 'black', fills)
  drawLine(c, 300, 600, 0, 200, 'black')

  const finalPhasor = ray.resultant.scale(wave.amplitude * ray.singleSlitModulation)
  const finalPhasorNorm = ray.normalisedResultant.scale(wave.amplitude * ray.singleSlitModulation)
  drawLine(c, ...pos.phaseDiagram.addXY(100, 0), ...finalPhasor, 'black')

  // Resultant sin wave and phasor at right
  const newWave2 = { amplitude: wave.amplitude * ray.normalisedResultant.mag * ray.singleSlitModulation * viewScale.intensity, length: wave.length, phase: ray.resultant.phase - Math.PI / 2 }
  newSin(c, newWave2, pos.screen.x, screenDisplacement, [0, wave.phase * wave.length], 0, 1, 0, 'black')
  drawLine(c, pos.screen.x, screenDisplacement, ...finalPhasorNorm.scale(viewScale.intensity), 'black')
}

// The grating is drawn by rectangles, this function takes the edges of the slit, the top and bottom and makes pairs oy y-coords
function drawGrating (c, { edges: e, firstSlit: f, width: w }, vSize, x, dx) {
  // Add the top and bottom of the grating
  [0].concat(e.flat().map((v) => v + f + vSize / 2)).concat([vSize])
    // flatten to a set of pairs for drawing
    .reduce((ac, cv, i, ar) => i % 2 ? ac.concat([[ar[i - 1], ar[i]]]) : ac, [])
    // draw each pair as a rectangle
    .forEach(([y1, y2], i, a) => { c.fillRect(x - dx, y1, dx * 2, y2 - y1) })
}

/*
*  Draws the areas for each section, the screen and the grating
*/

function drawBackground (c, intensity, pos, amplitude, slit, show, viewScale) {

  // c.clearRect(0, 0, c.canvas.width, c.canvas.height)   - for canvas based optimisation
  c.fillStyle = 'lightgrey'
  c.strokeStyle = 'black'
  // Draws the areas on screen
  c.strokeRect(0, 0, c.canvas.width, c.canvas.height)
  c.strokeRect(0, 0, ...pos.topViewXY)
  c.strokeRect(pos.screen.x, 0, pos.screen.dx, pos.topViewXY.y)

  // Draws the grating
  drawGrating(c, slit, pos.topViewXY.y, pos.grating.x, pos.grating.dx)

  // Draw the intensity traces
  const traceAmplitude = amplitude * viewScale.intensity
  if (show) {
    drawTrace(c, intensity[0], pos.screen.x, 0, 'rgba(255, 0, 0, 0.3)', 0, 1, -traceAmplitude, 0)
    drawTrace(c, intensity[1], pos.screen.x, 0, 'rgba(0, 255, 0, 0.5)', 0, 1, -traceAmplitude, 0)
  }
  drawTrace(c, intensity[2], pos.screen.x, 0, 'black', 0, 1, -traceAmplitude, 0)
  drawTrace(c, intensity[3], pos.screen.x, 0, 'rgba(0, 0, 0, 0.2)', 0, 1, -traceAmplitude, 0)
  drawTrace(c, intensity[4], pos.screen.x - 100, 0, undefined, 0, 1, -traceAmplitude, 0)
}

export { drawForground, drawBackground }
