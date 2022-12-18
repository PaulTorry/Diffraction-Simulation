import { Vec } from '../Vec.js'
import { drawLine, drawTrace, sketchFunction } from './drawFunctions.js'

// Each slit has a unique colour @TODO get opinions on these

const colours = (i, opacity = 1) => {
  const colourArray = [[73, 137, 171], [73, 171, 135], [73, 171, 96], [135, 171, 73], [171, 166, 73], [171, 146, 73]]
  const col = 'rgba(' + colourArray[i][0] + ',' + colourArray[i][1] + ',' + colourArray[i][2] + ',' + opacity + ')'
  return col
}

function transformFunc (func, A = 1, B = 1, C = 0, D = 0) {
  return (x) => A * func(B * x + C) + D
}
// Draw foreground, the rays and sin waves and phasors

function drawForground (c, slit, ray, wave, pos, viewScale, { amp, scale, switchZoom }) {
  const geo = ray.geo
  const edges = ray.grating.edges.map(a => a) // .reverse().map(([a, b]) => [a + 2 * ray.grating.firstSlit, b + 2 * ray.grating.firstSlit])

  const firstSlitPosY = slit.firstSlit + pos.topViewXY.y / 2
  // console.log(edges.flat(), ray.grating.edges.flat())
  const screenDisplacement = geo.d + pos.topViewXY.y / 2
  // c.clearRect(0, 0, c.canvas.width, c.canvas.height)

  // line from center of slits to screen
  drawLine(c, pos.grating.x, pos.topViewXY.y / 2, geo.D, geo.d)

  // waves arriving at grating
    // cosineCurve(c, wave, pos.grating.x, slit.firstSlit + pos.topViewXY.y / 2, [-pos.grating.x, pos.grating.x])
   let wavepos = new Vec(pos.grating.x, slit.firstSlit + pos.topViewXY.y / 2)
   let waveFunc = transformFunc(Math.cos, wave.amplitude, 1 / wave.length, -wave.phase)
   sketchFunction(c, wavepos, [-pos.grating.x, 0], waveFunc)

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
    // cosineCurve(c, wave, ...slitTop, [0, geo.l / 2], 0, 1, geo.theta, colours(i, 0.4))
    waveFunc = transformFunc(Math.cos, wave.amplitude, 1 / wave.length, -wave.phase)
    sketchFunction(c, slitTop, [0, geo.l / 2], waveFunc, colours(i, 0.4), false, geo.theta)
    // cosineCurve(c, wave, ...slitBottom, [0, geo.l / 2], 0, 1, geo.theta, colours(i), getSinFill(-top * geo.sin, -bot * geo.sin))

    
    sketchFunction(c, slitBottom, [0, geo.l / 2], waveFunc, colours(i), false, geo.theta)
    sketchFunction(c, slitBottom, [-top * geo.sin, -bot * geo.sin], (x) => Math.max(waveFunc(x), 0), 'blue', true, geo.theta)
    sketchFunction(c, slitBottom, [-top * geo.sin, -bot * geo.sin], (x) => Math.min(waveFunc(x), 0), 'red', true, geo.theta)

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

 

  if (switchZoom) {
    // let { length, phase, amplitude } = wave
    // length = length / (geo.sin * -4)
    // const wave2 = { length, phase, amplitude }
    
    // const fills = slit.edges.map((c, i, a) => {
    //   const [yyy, yy] = c.map(cc => cc * -1 / 4)
    //   return [Math.min(-yyy, -yy), Math.max(Math.abs(-yyy + yy), 1), colours(i)]
    // })
    // cosineCurve(c, wave2, 300, pos.phaseDiagram.y, [-150, 650], 0, 4, 0, 'black', fills)

    const waveFunc3 = transformFunc(waveFunc, 4, -geo.sin)

     sketchFunction(c, new Vec(300, pos.phaseDiagram.y), [-150, 500], waveFunc3, 'black')
     slit.edges.forEach((v, i, a) => {
      const [st, ed] = v.map(cc => cc * 1 )
      // const widthWithMin = [st, Math.max(ed, st + 4)]
      const widthWithMin = [Math.min(st, ed), Math.max(st, ed) + 4]
      sketchFunction(c, new Vec(300, pos.phaseDiagram.y), widthWithMin, waveFunc3, colours(i), true)
      sketchFunction(c, new Vec(300, pos.phaseDiagram.y), widthWithMin, waveFunc3, 'black', false)
      })
    // sketchFunction(c, slitBottom, [-150, 500], (x) => Math.min(waveFunc(x), 0), 'red', true, geo.theta)

  } else {
    // const fills = slit.edges.map((c, i, a) => {
    //   const [yyy, yy] = c.map(cc => cc * geo.sin)
    //   return [Math.min(-yyy, -yy), Math.max(Math.abs(-yyy + yy), 1), colours(i)]
    // })
    // cosineCurve(c, wave, 300, pos.phaseDiagram.y, [-150, 650], 0, 4, 0, 'black', fills)
    const waveFunc2 = transformFunc(waveFunc, 4, 1 / 4)
    sketchFunction(c, new Vec(300, pos.phaseDiagram.y), [-150, 500], waveFunc2, 'black')
    slit.edges.forEach((v, i, a) => {
    const [st, ed] = v.map(cc => cc * geo.sin * -1 * 4)
    // const widthWithMin = [st, Math.max(ed, st + 4)]
    const widthWithMin = [Math.min(st, ed), Math.max(st, ed) + 4]
    sketchFunction(c, new Vec(300, pos.phaseDiagram.y), widthWithMin, waveFunc2, colours(i), true)
    sketchFunction(c, new Vec(300, pos.phaseDiagram.y), widthWithMin, waveFunc2, 'black', false)
    })

    drawLine(c, 300, 600, 0, 200, 'black')
  }

  let resultAmpitude = ray.modulatedResultant.mag * wave.amplitude
  let wavePhasor = ray.modulatedResultant.scale(wave.amplitude * viewScale.intensity)

  if (amp) {
    resultAmpitude = resultAmpitude * ray.modulatedResultant.mag
    wavePhasor = wavePhasor.scale(ray.modulatedResultant.mag)
  }

  if (!scale) {
    const scaleFactor = scale ? 1 : slit.number * (slit.realWidth || 20) / 50
    resultAmpitude = resultAmpitude * scaleFactor
    wavePhasor = wavePhasor.scale(scaleFactor)
  }

  drawLine(c, ...pos.phaseDiagram.addXY(100, 0), ...ray.modulatedResultant.scale(wave.amplitude * slit.number), 'black')

  // Resultant sin wave and phasor at right
  // const newWave2 = { amplitude: resultAmpitude * viewScale.intensity, length: wave.length, phase: ray.modulatedResultant.phase - Math.PI / 2 }
  // cosineCurve(c, newWave2, pos.screen.x, screenDisplacement + 10, [0, wave.phase * wave.length], 0, 1, 0, 'black')
  
  const waveFunc4 = transformFunc(Math.cos, resultAmpitude * viewScale.intensity, 1 / wave.length, -ray.modulatedResultant.phase + Math.PI / 2 )
  sketchFunction(c, new Vec(pos.screen.x, screenDisplacement), [0, wave.phase * wave.length], waveFunc4)
  
  drawLine(c, pos.screen.x, screenDisplacement, ...wavePhasor, 'black')
}

// The grating is drawn by rectangles, this function takes the edges of the slit, the top and bottom and makes pairs oy y-coords
function drawVerticalGrating (c, { edges: e, firstSlit: f, width: w }, length, xpos, thickness) {
  // Add the top and bottom of the grating  flatten to a set of pairs for drawing
  [0].concat(e.flat().map((v) => v + f + length / 2)).concat([length])
    .reduce((ac, cv, i, ar) => i % 2 ? ac.concat([[ar[i - 1], ar[i]]]) : ac, [])
    // draw each pair as a rectangle
    .forEach(([y1, y2], i, a) => { c.fillRect(xpos - thickness, y1, thickness * 2, y2 - y1) })
}

function drawHorizontalGrating (c, { edges: e, firstSlit: f, width: w }, longStart, length, transStart, thickness, horizontal, centered) {
  // Add the top and bottom of the grating  flatten to a set of pairs for drawing
  const flattenedEdges = [longStart].concat(e.flat().map((v) => v + longStart + 100)).concat([length + longStart])
    .reduce((ac, cv, i, ar) => i % 2 ? ac.concat([[ar[i - 1], ar[i]]]) : ac, [])
    // draw each pair as a rectangle
  flattenedEdges.forEach(([x1, x2], i, a) => { c.fillRect(x1, transStart - thickness, x2 - x1, thickness * 2) })
}

/*
*  Draws the areas for each section, the screen and the grating
*/

function drawBackground (c, intensity, pos, amplitude, slit, { scale, show, amp, switchZoom }, viewScale) {
  // c.clearRect(0, 0, c.canvas.width, c.canvas.height)   - for canvas based optimisation
  c.fillStyle = 'lightgrey'
  c.strokeStyle = 'black'
  // Draws the areas on screen
  c.strokeRect(0, 0, c.canvas.width, c.canvas.height)
  c.strokeRect(0, 0, ...pos.topViewXY)
  c.strokeRect(pos.screen.x, 0, pos.screen.dx, pos.topViewXY.y)

  // Draws the grating
  drawVerticalGrating(c, slit, pos.topViewXY.y, pos.grating.x, pos.grating.dx)
  if (switchZoom) {
    drawHorizontalGrating(c, slit, 200, pos.phaseDiagram.y - 100, pos.topViewXY.y + 10, pos.grating.dx, true)
  }
  // Draw the intensity traces

  const traceAmplitude = amplitude * viewScale.intensity
  // console.log(slit.width, typeof slit.width)
  const scaleFactor = scale ? 1 : slit.number * (slit.realWidth || 20) / 50

  if (show) {
    drawTrace(c, intensity[0], pos.screen.x, 0, 'rgba(255, 0, 0, 0.3)', 0, 1, -traceAmplitude, 0, amp, scaleFactor)
    drawTrace(c, intensity[1], pos.screen.x, 0, 'rgba(0, 255, 0, 0.5)', 0, 1, -traceAmplitude, 0, amp, scaleFactor)
  }
  drawTrace(c, intensity[2], pos.screen.x, 0, 'black', 0, 1, -traceAmplitude, 0, amp, scaleFactor)
  drawTrace(c, intensity[3], pos.screen.x, 0, 'rgba(0, 0, 0, 0.2)', 0, 1, -traceAmplitude, 0, amp, scaleFactor)
  drawTrace(c, intensity[4], pos.screen.x - 100, 0, undefined, 0, 1, -traceAmplitude, 0, amp, scaleFactor)
}

export { drawForground, drawBackground }
