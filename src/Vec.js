class Vec {
  constructor (x = 0, y = 0) { this.x = x; this.y = y }

  * [Symbol.iterator] () {
    yield this.x
    yield this.y
  }

  add (b) { return new Vec(this.x + b.x, this.y + b.y) }
  addXY (x, y) { return new Vec(this.x + x, this.y + y) }
  subtract (b) { return new Vec(this.x - b.x, this.y - b.y) }
  scaleByVec (a) { return new Vec(this.x * a.x, this.y * a.y) }
  scaleXY (x, y) { return new Vec(this.x * x, this.y * y) }
  scale (m) { return new Vec(this.x * m, this.y * m) }
  rotate (theta, around) { return Vec.rotate(this, theta, around) }
  rotate90 (scale, around) { return Vec.rotate90(this, scale, around) }
  integrateTo (b) { return Vec.integrateBetween(this, b) }
  integrateFrom (a) { return Vec.integrateBetween(a, this) }

  dot (b) { return this.x * b.x + this.y * b.y }
  invert () { return this.scale(-1) }
  distance (a) { return this.subtract(a).mag }

  bounds (b1, b2 = b1.invert()) {
    const x2 = Math.min(b2.x, b1.x); const x1 = Math.max(b2.x, b1.x)
    const y2 = Math.min(b2.y, b1.y); const y1 = Math.max(b2.y, b1.y)
    const x = Math.max(x2, Math.min(x1, this.x))
    const y = Math.max(y2, Math.min(y1, this.y))
    return new Vec(x, y)
  }

  get inverse () { return this.scale(-1) }
  get mag () { return Math.sqrt((this.x * this.x) + (this.y * this.y)) }
  get phase () { return Math.atan2(this.y, this.x) }
  get normalise () { return this.scale(1 / this.mag) }

  static fromID (id) {
    return new Vec(...(id.split(',')).map(parseFloat))
  }

  static rotate (a, th = 0, around = new Vec(0, 0)) {
    const x = a.x - around.x; const y = a.y - around.y
    return new Vec(x * Math.cos(th) + y * Math.sin(th), x * -Math.sin(th) + y * Math.cos(th))
  }

  static rotate90 (a, scale = 1, around = new Vec(0, 0)) {
    const x = a.x - around.x; const y = a.y - around.y
    return new Vec(x * 0 + y * scale, x * -scale + y * 0)
  }

  static integrateBetween (a, b) { return b.subtract(a).rotate90(-1) }

  static fromIdArray (idArray) {
    return idArray.map(Vec.fromID)
  }

  static fromCircularCoords (r, theta) {
    return new Vec(r * Math.sin(theta), r * Math.cos(theta))
  }
}
// Standard javascipt lint doesnt yet support staic variables
Vec.zero = new Vec(0, 0)
Vec.unitY = new Vec(0, 1)
Vec.unitX = new Vec(1, 0)

export { Vec }
