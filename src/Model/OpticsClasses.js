
import { Vec } from '../Vec.js'

class Grating {
  constructor (number = 2, width = 1, separation = 2) {
    this.number = number; this.width = width; this.separation = separation
    this.firstSlit = -((number - 1) / 2) * (separation) - width / 2
    this.centres = Array(Number.parseInt(number)).fill().map((_, i) => i * (separation) + width / 2)
    this.edges = this.centres.map((v) => [v - width / 2, v + width / 2])
    this.largestEdge = number * (separation) + width
  }

  update (n = this.number, w = this.width, s = this.separation) {
    return new Grating(n, w, s)
  }
}

class Ray {
  constructor (grating = new Grating(), d = 1, D = 100, wave = { length: 2, phase: 0, amplitude: 20 }) {
    this.grating = grating; this.wave = wave
    this.geo = Ray.getGeometry(d, D)
    this.phasorAtGrating = this.calculatePhasor(0)
    this.resultant = grating.centres.reduce((p, c) => p.add(this.calculatePhasor(c)), new Vec(0, 0))
    this.normalisedResultant = this.resultant.scale(1 / this.grating.number)
  }

  get singleSlitModulation () {
    const slitPhaseDifference = this.grating.width * this.geo.sin / this.wave.length
    return 2 * Math.abs(Math.sin(0.5 * slitPhaseDifference) / slitPhaseDifference)
  }

  calcIntegral (posA, posB) { return this.calculatePhasor(posA).integrateTo(this.calculatePhasor(posB)).scale(5 / (this.grating.width * this.geo.sin)) }

  calcPhasorPos (posOnGrating) { return Vec.unitX.rotate(this.geo.theta).scale(-posOnGrating * this.geo.sin) }

  calculatePhasor (posOnGrating) { return Vec.fromCircularCoords(1, -this.wave.phase + posOnGrating * this.geo.sin / this.wave.length) }

  print (i = 0) { console.log(this.geo.sin, this.grating.edges[i], this.edgePhasors[i], this.resultant) }

  getRay (d = 1) { return new Ray(this.grating, d, this.geo.D, this.wave) }

  updatePhase (phase) { return new Ray(this.grating, this.geo.d, this.geo.D, { length: this.wave.length, phase: phase, ampltude: this.wave.amplitude }) }

  static getGeometry (d, D) {
    const theta = Math.atan(-d / D)
    const l = Math.sqrt(D * D + d * d)
    const sin = d / l
    const cos = D / l
    const tan = d / D
    return { d, D, theta, l, sin, cos, tan }
  }
}

class IntensityPattern {
  constructor (vSize) {
    this.vSize = vSize
    this.values = Array(5).fill(0).map(c => Array(vSize).fill(0))
  }

  addOneIntensity (ray, i, mirror) {
    const thisRay = ray.getRay(i - this.vSize / 2)
    const m = thisRay.normalisedResultant.mag; const s = thisRay.singleSlitModulation
    this.values[0][i] = m
    this.values[1][i] = s
    this.values[2][i] = m * s
    if (mirror) {
      const j = this.vSize - i
      this.values[0][j] = m
      this.values[1][j] = s
      this.values[2][j] = m * s
    }
  }

  addIntensity (ray, d = ray.geo.d, mirror) {
    const screenD = d + this.vSize / 2
    for (let i = screenD - 3; i <= screenD + 3; i++) {
      if (i > 0 && i < this.vSize) {
        this.addOneIntensity(ray, i, mirror)
      }
    }
  }

  addAllIntensities (ray) {
    for (let i = 0; i <= this.vSize; i++) {
      this.addOneIntensity(ray, i)
    }
  }

  staleintensities () {
    console.log('stale')
    this.values[3] = this.values[2].map((c, i) => {
      if (c > 0) return c
      else return this.values[3][i]
    })
    this.values[2] = this.values[2].map(c => 0)
  }

  clear (stale, history) {
    this.values[0] = this.values[0].map(c => 0)
    this.values[1] = this.values[1].map(c => 0)
    this.values[2] = this.values[2].map(c => 0)
    if (stale) { this.values[3] = this.values[3].map(c => 0) }
    if (history) { this.values[4] = this.values[4].map(c => 0) }
  }

  recordIntensites () { this.values[4] = this.values[2].map(a => a) }
}

export { Grating, Ray, IntensityPattern }
