const ARENA = {
  inset: 0
};

const BOID_SETTINGS = {
  count: 260,
  infants: 2,
  predators: 3,
  maxSpeed: 2.6,
  minSpeed: 1.2,
  maxForce: 0.045,
  viewDistance: 60,
  perception: 70,
  separation: 32,
  weights: {
    alignment: 1.0,
    cohesion: 0.6,
    regularSameColor: 0.9,
    regularOtherColor: 0.25,
    separation: 1.3,
    bounds: 0,
    infantAttraction: 1.1,
    predatorAvoid: 2.2,
    obstacleAvoid: 1.25,
    centerPull: 0.18,
    infantAvoidCrowd: 0.9
  },
  confusion: {
    neighborThreshold: 10,
    buildRate: 0.012,
    decayRate: 0.02,
    max: 1.0,
    jitter: 0.35
  },
  obstacleSense: {
    lookAhead: 90,
    radiusBoost: 60,
    sideAngle: 0.6
  },
  infantCrowd: {
    threshold: 8
  }
};

const boids = [];
const obstacles = [];
const BOID_TYPES = {
  regular: 'regular',
  infant: 'infant',
  predator: 'predator'
};

const BOID_COLORS = {
  infant: [246, 196, 212, 220],
  predator: [236, 72, 62, 230]
};

const REGULAR_COLORS = [
  [243, 211, 108, 220],
  [148, 210, 189, 220],
  [114, 170, 216, 220],
  [208, 178, 226, 220],
  [243, 174, 132, 220]
];
function setup() {
  const canvas = createCanvas(windowWidth, windowHeight);
  canvas.parent(document.querySelector('.frame'));
  pixelDensity(1);
  noStroke();
  initObstacles();
  initBoids();
}

function draw() {
  drawArena();
  updateBoids();
}

function drawArena() {
  background(12, 28, 22);

  drawGradient();
  updateObstacles();
  drawObstacles();
  drawCompass();
}

function drawGradient() {
  push();
  noFill();
  for (let y = 0; y <= height; y += 4) {
    const t = y / height;
    const c = lerpColor(color(10, 30, 22, 255), color(34, 76, 50, 255), t);
    stroke(red(c), green(c), blue(c), 135);
    line(0, y, width, y);
  }
  pop();
}

function initObstacles() {
  obstacles.length = 0;
  const count = 8;
  const base = min(width, height);
  for (let i = 0; i < count; i += 1) {
    const size = random(base * 0.05, base * 0.09);
    const points = [];
    const vertices = floor(random(5, 8));
    for (let v = 0; v < vertices; v += 1) {
      const angle = (TWO_PI / vertices) * v + random(-0.3, 0.3);
      const radius = size * random(0.6, 1.1);
      points.push({ angle, radius });
    }
    obstacles.push({
      position: createVector(random(width), random(height)),
      velocity: p5.Vector.random2D().mult(random(0.2, 0.6)),
      angle: random(TWO_PI),
      spin: random(-0.006, 0.006),
      points,
      radius: size
    });
  }
}

function updateObstacles() {
  for (const obstacle of obstacles) {
    obstacle.position.add(obstacle.velocity);
    obstacle.angle += obstacle.spin;

    if (obstacle.position.x < -80) obstacle.position.x = width + 80;
    if (obstacle.position.x > width + 80) obstacle.position.x = -80;
    if (obstacle.position.y < -80) obstacle.position.y = height + 80;
    if (obstacle.position.y > height + 80) obstacle.position.y = -80;
  }
}

function drawObstacles() {
  push();
  fill(224, 244, 220, 22);
  stroke(243, 211, 108, 120);
  strokeWeight(1.5);
  for (const obstacle of obstacles) {
    push();
    translate(obstacle.position.x, obstacle.position.y);
    rotate(obstacle.angle);
    beginShape();
    for (const point of obstacle.points) {
      const px = cos(point.angle) * point.radius;
      const py = sin(point.angle) * point.radius;
      vertex(px, py);
    }
    endShape(CLOSE);
    pop();
  }
  pop();
}

function drawCompass() {
  push();
  const cx = width - 80;
  const cy = 54;
  stroke(243, 211, 108, 180);
  strokeWeight(2);
  fill(243, 211, 108, 60);
  ellipse(cx, cy, 44, 44);
  line(cx, cy - 14, cx, cy + 14);
  line(cx - 14, cy, cx + 14, cy);
  noStroke();
  fill(243, 211, 108, 200);
  triangle(cx, cy - 18, cx - 4, cy - 8, cx + 4, cy - 8);
  pop();
}

function initBoids() {
  boids.length = 0;
  spawnBoids(BOID_SETTINGS.count, BOID_TYPES.regular);
  spawnBoids(BOID_SETTINGS.infants, BOID_TYPES.infant);
  spawnBoids(BOID_SETTINGS.predators, BOID_TYPES.predator);
}

function spawnBoids(count, type) {
  for (let i = 0; i < count; i += 1) {
    const x = random(40, width - 40);
    const y = random(40, height - 40);
    boids.push(new Boid(x, y, type));
  }
}

function updateBoids() {
  resolveCollisions();
  for (const boid of boids) {
    boid.flock(boids);
    boid.update();
    enforceObstacleBarrier(boid);
    wrapAround(boid);
    boid.render();
  }
}

function resolveCollisions() {
  const minDist = 16;
  for (let i = 0; i < boids.length; i += 1) {
    for (let j = i + 1; j < boids.length; j += 1) {
      const a = boids[i];
      const b = boids[j];
      const d = dist(a.position.x, a.position.y, b.position.x, b.position.y);
      if (d > 0 && d < minDist) {
        const overlap = (minDist - d) * 0.5;
        const normal = p5.Vector.sub(a.position, b.position).setMag(1);
        a.position.add(p5.Vector.mult(normal, overlap));
        b.position.add(p5.Vector.mult(normal, -overlap));

        const relative = p5.Vector.sub(a.velocity, b.velocity);
        const speed = relative.dot(normal);
        if (speed < 0) {
          const impulse = p5.Vector.mult(normal, speed);
          a.velocity.sub(impulse);
          b.velocity.add(impulse);
        }
      }
    }
  }
}

function wrapAround(boid) {
  const r = 8;
  if (boid.position.x < -r) boid.position.x = width + r;
  if (boid.position.x > width + r) boid.position.x = -r;
  if (boid.position.y < -r) boid.position.y = height + r;
  if (boid.position.y > height + r) boid.position.y = -r;
}

function enforceObstacleBarrier(boid) {
  const r = 8;
  for (const obstacle of obstacles) {
    const d = dist(boid.position.x, boid.position.y, obstacle.position.x, obstacle.position.y);
    const safe = obstacle.radius + r + 2;
    if (d > 0 && d < safe) {
      const normal = p5.Vector.sub(boid.position, obstacle.position).setMag(1);
      boid.position = p5.Vector.add(obstacle.position, p5.Vector.mult(normal, safe));
      const speed = boid.velocity.dot(normal);
      if (speed < 0) {
        const impulse = p5.Vector.mult(normal, speed * 2);
        boid.velocity.sub(impulse);
      }
    }
  }
}

class Boid {
  constructor(x, y, type) {
    this.position = createVector(x, y);
    this.velocity = p5.Vector.random2D().mult(random(1.2, BOID_SETTINGS.maxSpeed));
    this.acceleration = createVector(0, 0);
    this.type = type;
    this.confusion = 0;
    this.colorIndex = type === BOID_TYPES.regular ? floor(random(REGULAR_COLORS.length)) : null;
  }

  flock(others) {
    const neighbors = this.getNeighbors(others);
    this.updateConfusion(neighbors.length);
    const alignment = this.align(neighbors).mult(BOID_SETTINGS.weights.alignment);
    const cohesion = this.type === BOID_TYPES.regular
      ? this.cohereRegular(neighbors)
      : this.cohere(neighbors).mult(this.getCohesionWeight());
    const separation = this.separate(neighbors).mult(BOID_SETTINGS.weights.separation);
    const bounds = this.keepInBounds().mult(BOID_SETTINGS.weights.bounds);
    const avoidObstacles = this.avoidObstacles().mult(BOID_SETTINGS.weights.obstacleAvoid);
    const centerPull = this.pullToCenter().mult(BOID_SETTINGS.weights.centerPull);

    this.applyForce(alignment);
    this.applyForce(cohesion);
    this.applyForce(separation);
    this.applyForce(bounds);
    this.applyForce(avoidObstacles);
    this.applyForce(centerPull);

    if (this.type !== BOID_TYPES.predator) {
      const avoid = this.avoidPredators(others).mult(BOID_SETTINGS.weights.predatorAvoid);
      this.applyForce(avoid);
    }

    if (this.type === BOID_TYPES.regular) {
      const infantPull = this.attractInfants(others).mult(BOID_SETTINGS.weights.infantAttraction);
      this.applyForce(infantPull);
    }

    if (this.type === BOID_TYPES.infant) {
      const crowdAvoid = this.avoidCrowds(others).mult(BOID_SETTINGS.weights.infantAvoidCrowd);
      this.applyForce(crowdAvoid);
    }
  }

  applyForce(force) {
    this.acceleration.add(force);
  }

  update() {
    this.velocity.add(this.acceleration);
    this.velocity.limit(BOID_SETTINGS.maxSpeed);
    if (this.velocity.mag() < BOID_SETTINGS.minSpeed) {
      if (this.velocity.magSq() === 0) {
        this.velocity = p5.Vector.random2D().mult(BOID_SETTINGS.minSpeed);
      } else {
        this.velocity.setMag(BOID_SETTINGS.minSpeed);
      }
    }
    this.position.add(this.velocity);
    this.acceleration.mult(0);
  }

  render() {
    const heading = this.velocity.heading();
    push();
    translate(this.position.x, this.position.y);
    rotate(heading);
    if (this.type === BOID_TYPES.regular) {
      const colorSet = REGULAR_COLORS[this.colorIndex] || REGULAR_COLORS[0];
      fill(colorSet[0], colorSet[1], colorSet[2], colorSet[3]);
    } else {
      const colorSet = BOID_COLORS[this.type];
      fill(colorSet[0], colorSet[1], colorSet[2], colorSet[3]);
    }
    triangle(10, 0, -10, 6, -8, -6);
    pop();
  }

  getNeighbors(others) {
    const neighbors = [];
    for (const other of others) {
      if (other === this) continue;
      const d = dist(this.position.x, this.position.y, other.position.x, other.position.y);
      if (d < BOID_SETTINGS.perception) {
        if (this.type === BOID_TYPES.predator) {
          if (other.type !== BOID_TYPES.predator) continue;
          neighbors.push(other);
        } else if (other.type !== BOID_TYPES.predator) {
          neighbors.push(other);
        }
      }
    }
    return neighbors;
  }

  updateConfusion(neighborCount) {
    const { neighborThreshold, buildRate, decayRate, max: maxValue } = BOID_SETTINGS.confusion;
    if (neighborCount >= neighborThreshold) {
      this.confusion = Math.min(maxValue, this.confusion + buildRate);
    } else {
      this.confusion = Math.max(0, this.confusion - decayRate);
    }
  }

  getCohesionWeight() {
    if (this.confusion <= 0) return BOID_SETTINGS.weights.cohesion;
    const jitter = random(-BOID_SETTINGS.confusion.jitter, BOID_SETTINGS.confusion.jitter);
    const damp = 1 - this.confusion;
    return BOID_SETTINGS.weights.cohesion * (damp + jitter);
  }

  align(others) {
    const steering = createVector(0, 0);
    let count = 0;
    for (const other of others) {
      steering.add(other.velocity);
      count += 1;
    }
    if (count === 0) return steering;
    steering.div(count);
    steering.setMag(BOID_SETTINGS.maxSpeed);
    steering.sub(this.velocity);
    steering.limit(BOID_SETTINGS.maxForce);
    return steering;
  }

  cohere(others) {
    return this.cohereFrom(others);
  }

  cohereFrom(others) {
    const steering = createVector(0, 0);
    let count = 0;
    for (const other of others) {
      steering.add(other.position);
      count += 1;
    }
    if (count === 0) return steering;
    steering.div(count);
    steering.sub(this.position);
    steering.setMag(BOID_SETTINGS.maxSpeed);
    steering.sub(this.velocity);
    steering.limit(BOID_SETTINGS.maxForce);
    return steering;
  }

  cohereRegular(others) {
    const sameColor = [];
    const otherColor = [];
    for (const other of others) {
      if (other.type !== BOID_TYPES.regular) continue;
      if (other.colorIndex === this.colorIndex) {
        sameColor.push(other);
      } else {
        otherColor.push(other);
      }
    }
    const sameSteer = this.cohereFrom(sameColor).mult(BOID_SETTINGS.weights.regularSameColor);
    const otherSteer = this.cohereFrom(otherColor).mult(BOID_SETTINGS.weights.regularOtherColor);
    const combined = p5.Vector.add(sameSteer, otherSteer);
    combined.mult(this.getCohesionWeight());
    return combined;
  }

  separate(others) {
    const steering = createVector(0, 0);
    let count = 0;
    for (const other of others) {
      const d = dist(this.position.x, this.position.y, other.position.x, other.position.y);
      if (d > 0 && d < BOID_SETTINGS.separation) {
        const diff = p5.Vector.sub(this.position, other.position);
        diff.div(d * d);
        steering.add(diff);
        count += 1;
      }
    }
    if (count === 0) return steering;
    steering.div(count);
    steering.setMag(BOID_SETTINGS.maxSpeed);
    steering.sub(this.velocity);
    steering.limit(BOID_SETTINGS.maxForce);
    return steering;
  }

  attractInfants(others) {
    const steering = createVector(0, 0);
    let count = 0;
    for (const other of others) {
      if (other.type !== BOID_TYPES.infant) continue;
      const d = dist(this.position.x, this.position.y, other.position.x, other.position.y);
      if (d < BOID_SETTINGS.perception) {
        steering.add(other.position);
        count += 1;
      }
    }
    if (count === 0) return steering;
    steering.div(count);
    steering.sub(this.position);
    steering.setMag(BOID_SETTINGS.maxSpeed);
    steering.sub(this.velocity);
    steering.limit(BOID_SETTINGS.maxForce);
    return steering;
  }

  avoidPredators(others) {
    const steering = createVector(0, 0);
    let count = 0;
    for (const other of others) {
      if (other.type !== BOID_TYPES.predator) continue;
      const d = dist(this.position.x, this.position.y, other.position.x, other.position.y);
      if (d > 0 && d < BOID_SETTINGS.perception) {
        const diff = p5.Vector.sub(this.position, other.position);
        diff.div(d * d);
        steering.add(diff);
        count += 1;
      }
    }
    if (count === 0) return steering;
    steering.div(count);
    steering.setMag(BOID_SETTINGS.maxSpeed);
    steering.sub(this.velocity);
    steering.limit(BOID_SETTINGS.maxForce * 1.2);
    return steering;
  }

  avoidCrowds(others) {
    const steering = createVector(0, 0);
    let count = 0;
    let regularCount = 0;
    for (const other of others) {
      if (other.type !== BOID_TYPES.regular) continue;
      const d = dist(this.position.x, this.position.y, other.position.x, other.position.y);
      if (d < BOID_SETTINGS.perception) {
        steering.add(other.position);
        count += 1;
        regularCount += 1;
      }
    }
    if (regularCount < BOID_SETTINGS.infantCrowd.threshold || count === 0) return steering;
    steering.div(count);
    steering.set(this.position.x - steering.x, this.position.y - steering.y);
    steering.setMag(BOID_SETTINGS.maxSpeed);
    steering.sub(this.velocity);
    steering.limit(BOID_SETTINGS.maxForce);
    return steering;
  }

  avoidObstacles() {
    const steering = createVector(0, 0);
    let count = 0;
    const lookAhead = BOID_SETTINGS.obstacleSense.lookAhead;
    const forward = this.getForwardVector(lookAhead);
    const left = forward.copy().rotate(-BOID_SETTINGS.obstacleSense.sideAngle).mult(0.75);
    const right = forward.copy().rotate(BOID_SETTINGS.obstacleSense.sideAngle).mult(0.75);
    const probes = [
      p5.Vector.add(this.position, forward),
      p5.Vector.add(this.position, left),
      p5.Vector.add(this.position, right)
    ];
    for (const obstacle of obstacles) {
      const safe = obstacle.radius + BOID_SETTINGS.obstacleSense.radiusBoost;
      for (const probe of probes) {
        const d = dist(probe.x, probe.y, obstacle.position.x, obstacle.position.y);
        if (d > 0 && d < safe) {
          const diff = p5.Vector.sub(probe, obstacle.position);
          diff.div(d * d);
          steering.add(diff);
          count += 1;
        }
      }
    }
    if (count === 0) return steering;
    steering.div(count);
    steering.setMag(BOID_SETTINGS.maxSpeed);
    steering.sub(this.velocity);
    steering.limit(BOID_SETTINGS.maxForce);
    return steering;
  }

  getForwardVector(length) {
    if (this.velocity.magSq() === 0) {
      return p5.Vector.random2D().mult(length);
    }
    return this.velocity.copy().setMag(length);
  }

  pullToCenter() {
    const center = createVector(width * 0.5, height * 0.5);
    const toCenter = p5.Vector.sub(center, this.position);
    const distance = toCenter.mag();
    if (distance < 1) return createVector(0, 0);
    toCenter.setMag(BOID_SETTINGS.maxSpeed);
    const steer = p5.Vector.sub(toCenter, this.velocity);
    steer.limit(BOID_SETTINGS.maxForce * 0.6);
    return steer;
  }

  keepInBounds() {
    const margin = BOID_SETTINGS.viewDistance;
    const desired = createVector(0, 0);
    const forward = this.getForwardVector(margin);
    const future = p5.Vector.add(this.position, forward);

    if (future.x < margin) desired.x = BOID_SETTINGS.maxSpeed;
    if (future.x > width - margin) desired.x = -BOID_SETTINGS.maxSpeed;
    if (future.y < margin) desired.y = BOID_SETTINGS.maxSpeed;
    if (future.y > height - margin) desired.y = -BOID_SETTINGS.maxSpeed;

    if (desired.magSq() === 0) {
      if (this.position.x < margin) desired.x = BOID_SETTINGS.maxSpeed;
      if (this.position.x > width - margin) desired.x = -BOID_SETTINGS.maxSpeed;
      if (this.position.y < margin) desired.y = BOID_SETTINGS.maxSpeed;
      if (this.position.y > height - margin) desired.y = -BOID_SETTINGS.maxSpeed;
    }

    if (this.position.x < margin && this.position.y < margin) {
      desired.set(BOID_SETTINGS.maxSpeed, BOID_SETTINGS.maxSpeed);
    } else if (this.position.x > width - margin && this.position.y < margin) {
      desired.set(-BOID_SETTINGS.maxSpeed, BOID_SETTINGS.maxSpeed);
    } else if (this.position.x < margin && this.position.y > height - margin) {
      desired.set(BOID_SETTINGS.maxSpeed, -BOID_SETTINGS.maxSpeed);
    } else if (this.position.x > width - margin && this.position.y > height - margin) {
      desired.set(-BOID_SETTINGS.maxSpeed, -BOID_SETTINGS.maxSpeed);
    }

    if (desired.magSq() === 0) return desired;
    desired.setMag(BOID_SETTINGS.maxSpeed);
    desired.sub(this.velocity);
    desired.limit(BOID_SETTINGS.maxForce);
    return desired;
  }

}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
  initObstacles();
}
