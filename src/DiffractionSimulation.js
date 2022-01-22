/* global requestAnimationFrame */

import { Vec } from './Vec.js'
import { Grating, Ray, IntensityPattern } from './Model/OpticsClasses.js'
import { drawForground, drawBackground } from './View/drawView.js'

const canvas = document.querySelector('#screen')
const cx = canvas.getContext('2d')

const sliders = {
  wave: { s: document.getElementById('wavelengthSlide'), t: document.getElementById('wavelengthText') },
  slits: { s: document.getElementById('slitsSlide'), t: document.getElementById('slitsText') },
  slitSeparation: { s: document.getElementById('slitSeparationSlide'), t: document.getElementById('slitSeparationText') },
  slitWidth: { s: document.getElementById('slitWidthSlide'), t: document.getElementById('slitWidthText') }
}
const checkboxes = {
  animate: document.getElementById('anim'),
  record: document.getElementById('rec'),
  show: document.getElementById('show'),
  confine: document.getElementById('conf'),
  mirror: document.getElementById('mirror'),
  amp: document.getElementById('amp'),
  scale: document.getElementById('scale'),
  switchZoom: document.getElementById('switchZoom'),
  smallscreen: document.getElementById('smallscreen')
}
const buttons = {
  record: document.getElementById('hist')
}

const viewScale = { intensity: 7 }
const settings = {
  animate: { run: true, notPaused: true },
  record: false,
  confineSlitSize: true,
  show: false,
  mirror: true,
  amp: false,
  scale: true,
  switchZoom: false
}
const pos = { topViewXY: new Vec(1200, 600), grating: { x: 300, dx: 5 }, screen: { x: 900, dx: 4 }, phaseDiagram: new Vec(1050, 700) }

let slit = new Grating(2, 0, 100)
const wave = { length: 4, phase: 0, amplitude: 20 }
let displacement = 1
let ray = new Ray(slit, displacement, pos.screen.x - pos.grating.x, wave)

const intensity = new IntensityPattern(pos.topViewXY.y)

addEventListeners()
requestAnimationFrame(animateIt)
update()

function addEventListeners () {
  let mouseCoords

  document.addEventListener('keypress', (e) => {
    if (e.key === 's') wave.amplitude--
    if (e.key === 'w') wave.amplitude++
    console.log(wave.amplitude)
    update(true)
  })

  function dragEvent (a, b) {
    // console.log(a,b);
    const d = b.subtract(a)
    if (d.x * d.x > 16 * d.y * d.y || a.x < pos.grating.x || a.x > pos.screen.x || a.y > pos.topViewXY.y) {
      wave.phase += (d.x) * 0.5 / wave.length
    } else if (16 * d.x * d.x < d.y * d.y) {
      displacement += d.y
      if (displacement > -1 && settings.mirror) displacement = -1
      if (settings.record) { intensity.addIntensity(ray, undefined, settings.mirror) }
      if (settings.animate.run && !settings.record) { wave.phase = 0 }
    }
    update()
  }
  buttons.record.addEventListener('click', (e) => {
    intensity.recordIntensites()
    update()
  })
  sliders.wave.s.addEventListener('input', (e, v = sliders.wave.s.valueAsNumber) => {
    if (v !== wave.length) {
      sliders.wave.t.textContent = v
      wave.length = v
      intensity.staleintensities()
      update(true)
    }
  })
  sliders.slits.s.addEventListener('input', (e, v = sliders.slits.s.valueAsNumber) => {
    if (v !== slit.number) {
      sliders.slits.t.textContent = v
      slit = slit.update(v)
      intensity.staleintensities()
      update(true)
    }
  })
  sliders.slitSeparation.s.addEventListener('input', (e, v = sliders.slitSeparation.s.valueAsNumber) => {
    if (v !== slit.separation) {
      const nv = settings.confineSlitSize ? Math.max(v, slit.width) : v
      sliders.slitSeparation.t.textContent = nv
      sliders.slitSeparation.s.value = nv
      slit = slit.update(undefined, undefined, nv)
      intensity.staleintensities()
      update(true)
    }
  })
  sliders.slitWidth.s.addEventListener('input', (e, v = sliders.slitWidth.s.valueAsNumber) => {
    if (v !== slit.width) {
      const nv = settings.confineSlitSize ? Math.min(v, slit.separation) : v
      sliders.slitWidth.t.textContent = nv
      sliders.slitWidth.s.value = nv
      slit = slit.update(undefined, nv)
      intensity.staleintensities()
      update(true)
    }
  })

  checkboxes.animate.addEventListener('change', (e) => {
    settings.animate.run = checkboxes.animate.checked
  })
  checkboxes.record.addEventListener('change', (e) => {
    settings.record = checkboxes.record.checked
    if (!settings.record) intensity.clear(true)
    update()
  })
  checkboxes.confine.addEventListener('change', (e) => {
    settings.confineSlitSize = checkboxes.confine.checked
  })
  checkboxes.show.addEventListener('change', (e) => {
    settings.show = checkboxes.show.checked
    update()
  })
  checkboxes.mirror.addEventListener('change', (e) => {
    settings.mirror = checkboxes.mirror.checked
    update()
  })
  checkboxes.amp.addEventListener('change', (e) => {
    settings.amp = checkboxes.amp.checked
    update()
  })
  checkboxes.scale.addEventListener('change', (e) => {
    settings.scale = checkboxes.scale.checked
    update()
  })
  checkboxes.switchZoom.addEventListener('change', (e) => {
    settings.switchZoom = checkboxes.switchZoom.checked
    update()
  })
  checkboxes.smallscreen.addEventListener('change', (e) => {
    console.log(checkboxes.smallscreen.checked);
    compactify( checkboxes.smallscreen.checked)
    update()
  })
  window.addEventListener('touchstart', ({ touches: [e] }) => { mouseCoords = new Vec(e.pageX, e.pageY); settings.animate.notPaused = false })
  window.addEventListener('touchend', ({ touches: [e] }) => { mouseCoords = undefined; settings.animate.notPaused = true })
  window.addEventListener('touchmove', (E) => {
    let { touches: [e] } = E
    // console.log('touchmove', e.pageX)
    if (mouseCoords) {
      const b = new Vec(e.pageX, e.pageY)
      dragEvent(mouseCoords, b)
      mouseCoords = b
      if (checkboxes.smallscreen.checked) E.preventDefault()
    }
  },{passive: false})

  window.addEventListener('mousedown', e => { mouseCoords = new Vec(e.offsetX, e.offsetY); settings.animate.notPaused = false })
  window.addEventListener('mouseup', e => { mouseCoords = undefined; settings.animate.notPaused = true })
  window.addEventListener('dblclick', e => {
    settings.animate.run = !settings.animate.run
    checkboxes.animate.checked = settings.animate.run
  })
  canvas.addEventListener('click', e => {
    if (e.detail === 3) {
      settings.record = !settings.record
      checkboxes.record.checked = settings.record
      settings.animate.run = false
      checkboxes.animate.checked = false
    }
  })
  canvas.addEventListener('mousemove', (e) => {
    if (mouseCoords) {
      const b = new Vec(e.offsetX, e.offsetY)
      dragEvent(mouseCoords, b)
      mouseCoords = b
    }
  })
}

function update (fromSlider) {
  ray = new Ray(slit, displacement, pos.screen.x - pos.grating.x, wave)
  if (fromSlider && settings.record) { intensity.clear(true); intensity.addAllIntensities(ray, settings.mirror) }
  cx.clearRect(0, 0, cx.canvas.width, cx.canvas.height)
  drawBackground(cx, intensity.values, pos, wave.amplitude, slit, settings, viewScale)
  drawForground(cx, slit, ray, wave, pos, viewScale, settings)
}

function animateIt (time, lastTime) {
  if (lastTime != null & settings.animate.run & settings.animate.notPaused) {
    wave.phase += (time - lastTime) * 0.002
    const newRay = ray.updatePhase(wave.phase)
    if (ray.normalisedResultant.phase > newRay.normalisedResultant.phase) {
      intensity.addIntensity(ray, undefined, settings.mirror)
    }
    update()
  }
  requestAnimationFrame(newTime => animateIt(newTime, time))
}

function compactify (small) {
  if (small) {
    // console.log(canvas.style.position);
    canvas.height = 600
    pos.phaseDiagram.y = 500
    canvas.style.position = 'absolute'
    // document.body.requestFullscreen()

  } else {
    pos.phaseDiagram.y = 700
    canvas.style.position = 'relative'
    canvas.height = 800
  }
}
