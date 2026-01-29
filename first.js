const ARENA = {
  inset: 0
};

const BOID_SETTINGS = {
  count: 340,
  predators: 1,
  maxSpeed: 2.6,
  minSpeed: 1.2,
  predatorMinSpeed: 1.8,
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
    predatorAvoid: 2.2,
    obstacleAvoid: 1.25,
    centerPull: 0.18,
  },
  regularSameColorBias: 1.6,
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
  predatorPersonalSpace: {
    range: 40,
    weight: 1.4
  },
  predatorCohesion: {
    weight: 0.3
  }
};
const OBSTACLE_SETTINGS = {
  count: 8,
  maxCount: 10,
  sizeRange: [0.06, 0.095],
  radiusJitter: [0.7, 1.05],
  spinRange: [-0.006, 0.006]
};
const MOUSE_JIGGLER = {
  enabled: false,
  idleMs: 3000,
  lastMoveAt: 0,
  active: false,
  boid: null,
  lastMousePos: null,
  lastSendAt: 0,
  sendIntervalMs: 70,
  programmaticMoveAt: 0,
  disabledUntil: 0
};
const BACKGROUND_THEMES = {
  canopy: {
    label: 'Canopy',
    base: [12, 28, 22],
    gradientFrom: [10, 30, 22],
    gradientTo: [34, 76, 50],
    gradientAlpha: 135
  },
  charcoal: {
    label: 'Charcoal',
    base: [12, 12, 12],
    gradientFrom: [8, 8, 8],
    gradientTo: [38, 38, 38],
    gradientAlpha: 120
  },
  forest: {
    label: 'Midnight Blue',
    base: [8, 16, 30],
    gradientFrom: [6, 14, 26],
    gradientTo: [22, 48, 78],
    gradientAlpha: 130
  },
  ember: {
    label: 'Ember',
    base: [36, 18, 8],
    gradientFrom: [30, 14, 6],
    gradientTo: [88, 42, 16],
    gradientAlpha: 125
  },
  mist: {
    label: 'Mist',
    base: [240, 240, 242],
    gradientFrom: [230, 232, 235],
    gradientTo: [252, 252, 255],
    gradientAlpha: 180
  }
};
let backgroundThemeKey = 'canopy';

const boids = [];
const obstacles = [];
let canvasElement = null;
const GRID_SETTINGS = {
  targetCells: 20
};
const SPATIAL_GRID = {
  cellSize: 120,
  cols: 0,
  rows: 0,
  cells: []
};
const BOID_TYPES = {
  regular: 'regular',
  predator: 'predator'
};

const BOID_COLORS = {
  predator: [236, 72, 62, 230]
};

const REGULAR_COLORS = [
  [243, 211, 108, 220],
  [148, 210, 189, 220],
  [114, 170, 216, 220],
  [208, 178, 226, 220],
  [243, 174, 132, 220]
];

function setupSettingsUI() {
  const menuToggle = document.getElementById('menu-toggle');
  const settingsPanel = document.getElementById('settings-panel');
  const regularInput = document.getElementById('regular-count');
  const predatorInput = document.getElementById('predator-count');
  const obstacleInput = document.getElementById('obstacle-count');
  const mouseToggle = document.getElementById('mouse-boid-toggle');
  const backgroundSelect = document.getElementById('background-theme');
  const closeButton = document.getElementById('settings-close');
  const saveButton = document.getElementById('settings-save');

  if (!menuToggle || !settingsPanel || !regularInput || !predatorInput || !obstacleInput || !mouseToggle || !backgroundSelect || !closeButton || !saveButton) {
    return;
  }

  const syncInputs = () => {
    regularInput.value = BOID_SETTINGS.count;
    predatorInput.value = BOID_SETTINGS.predators;
    obstacleInput.value = OBSTACLE_SETTINGS.count;
    mouseToggle.checked = MOUSE_JIGGLER.enabled;
    backgroundSelect.value = backgroundThemeKey;
  };

  const openPanel = () => {
    syncInputs();
    if (!settingsPanel.open) {
      settingsPanel.show();
    }
    menuToggle.setAttribute('aria-expanded', 'true');
  };

  const closePanel = () => {
    if (settingsPanel.open) {
      settingsPanel.close();
    }
    menuToggle.setAttribute('aria-expanded', 'false');
    menuToggle.focus();
  };

  const applySettings = () => {
    const regularValue = Number.parseInt(regularInput.value, 10);
    const predatorValue = Number.parseInt(predatorInput.value, 10);
    const obstacleValue = Number.parseInt(obstacleInput.value, 10);
    BOID_SETTINGS.count = Number.isFinite(regularValue) ? Math.max(0, regularValue) : BOID_SETTINGS.count;
    BOID_SETTINGS.predators = Number.isFinite(predatorValue) ? Math.max(0, predatorValue) : BOID_SETTINGS.predators;
    OBSTACLE_SETTINGS.count = Number.isFinite(obstacleValue)
      ? Math.min(OBSTACLE_SETTINGS.maxCount, Math.max(0, obstacleValue))
      : OBSTACLE_SETTINGS.count;
    MOUSE_JIGGLER.enabled = mouseToggle.checked;
    MOUSE_JIGGLER.lastMoveAt = millis();
    backgroundThemeKey = backgroundSelect.value in BACKGROUND_THEMES ? backgroundSelect.value : backgroundThemeKey;
    initBoids();
    initObstacles();
    closePanel();
  };

  menuToggle.addEventListener('click', () => {
    if (settingsPanel.open) {
      closePanel();
    } else {
      openPanel();
    }
  });

  closeButton.addEventListener('click', closePanel);
  saveButton.addEventListener('click', applySettings);
  mouseToggle.addEventListener('change', () => {
    MOUSE_JIGGLER.enabled = mouseToggle.checked;
    MOUSE_JIGGLER.lastMoveAt = millis();
    if (!MOUSE_JIGGLER.enabled && MOUSE_JIGGLER.active) {
      stopMouseJiggle();
    }
  });
  backgroundSelect.addEventListener('change', () => {
    backgroundThemeKey = backgroundSelect.value in BACKGROUND_THEMES ? backgroundSelect.value : backgroundThemeKey;
  });

  settingsPanel.addEventListener('close', () => {
    menuToggle.setAttribute('aria-expanded', 'false');
  });
}
function setup() {
  const canvas = createCanvas(windowWidth, windowHeight);
  canvasElement = canvas.elt;
  canvas.parent(document.querySelector('.frame'));
  pixelDensity(1);
  noStroke();
  initObstacles();
  initBoids();
}

function draw() {
  drawArena();
  updateBoids();
  updateMouseJiggler();
}

function drawArena() {
  const theme = BACKGROUND_THEMES[backgroundThemeKey] || BACKGROUND_THEMES.canopy;
  background(theme.base[0], theme.base[1], theme.base[2]);

  drawGradient(theme);
  updateObstacles();
  drawObstacles();
  drawCompass();
}

function drawGradient(theme) {
  push();
  noFill();
  for (let y = 0; y <= height; y += 4) {
    const t = y / height;
    const c = lerpColor(
      color(theme.gradientFrom[0], theme.gradientFrom[1], theme.gradientFrom[2], 255),
      color(theme.gradientTo[0], theme.gradientTo[1], theme.gradientTo[2], 255),
      t
    );
    stroke(red(c), green(c), blue(c), theme.gradientAlpha);
    line(0, y, width, y);
  }
  pop();
}

function initObstacles() {
  obstacles.length = 0;
  const count = Math.min(OBSTACLE_SETTINGS.maxCount, Math.max(0, OBSTACLE_SETTINGS.count));
  const base = min(width, height);
  for (let i = 0; i < count; i += 1) {
    const size = random(base * OBSTACLE_SETTINGS.sizeRange[0], base * OBSTACLE_SETTINGS.sizeRange[1]);
    const points = [];
    const vertices = floor(random(5, 8));
    for (let v = 0; v < vertices; v += 1) {
      const angle = (TWO_PI / vertices) * v + random(-0.3, 0.3);
      const radius = size * random(OBSTACLE_SETTINGS.radiusJitter[0], OBSTACLE_SETTINGS.radiusJitter[1]);
      points.push({ angle, radius });
    }
    obstacles.push({
      position: createVector(random(width), random(height)),
      velocity: p5.Vector.random2D().mult(random(0.2, 0.6)),
      angle: random(TWO_PI),
      spin: random(OBSTACLE_SETTINGS.spinRange[0], OBSTACLE_SETTINGS.spinRange[1]),
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
  buildSpatialGrid();
  for (const boid of boids) {
    boid.flock();
    boid.update();
    enforceObstacleBarrier(boid);
    wrapAround(boid);
    boid.render();
  }
}

function buildSpatialGrid() {
  const targetCells = GRID_SETTINGS.targetCells;
  const area = width * height;
  SPATIAL_GRID.cellSize = Math.sqrt(area / targetCells);
  SPATIAL_GRID.cols = Math.max(1, Math.ceil(width / SPATIAL_GRID.cellSize));
  SPATIAL_GRID.rows = Math.max(1, Math.ceil(height / SPATIAL_GRID.cellSize));
  const cellCount = SPATIAL_GRID.cols * SPATIAL_GRID.rows;
  if (SPATIAL_GRID.cells.length !== cellCount) {
    SPATIAL_GRID.cells = Array.from({ length: cellCount }, () => []);
  } else {
    for (const cell of SPATIAL_GRID.cells) {
      cell.length = 0;
    }
  }
  for (const boid of boids) {
    const cx = Math.min(SPATIAL_GRID.cols - 1, Math.max(0, Math.floor(boid.position.x / SPATIAL_GRID.cellSize)));
    const cy = Math.min(SPATIAL_GRID.rows - 1, Math.max(0, Math.floor(boid.position.y / SPATIAL_GRID.cellSize)));
    SPATIAL_GRID.cells[cy * SPATIAL_GRID.cols + cx].push(boid);
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

  flock() {
    const { neighbors, predatorsNearby, collisionPush } = this.getNeighbors();
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
    if (this.type === BOID_TYPES.predator) {
      this.applyForce(cohesion.mult(BOID_SETTINGS.predatorCohesion.weight));
    } else {
      this.applyForce(cohesion);
    }
    this.applyForce(separation);
    this.applyForce(collisionPush);
    this.applyForce(bounds);
    this.applyForce(avoidObstacles);
    this.applyForce(centerPull);

    if (this.type !== BOID_TYPES.predator) {
      const avoid = this.avoidPredators(predatorsNearby).mult(BOID_SETTINGS.weights.predatorAvoid);
      this.applyForce(avoid);
    }

    if (this.type === BOID_TYPES.predator) {
      const space = this.predatorPersonalSpace(neighbors).mult(BOID_SETTINGS.predatorPersonalSpace.weight);
      this.applyForce(space);
    }
  }

  applyForce(force) {
    this.acceleration.add(force);
  }

  update() {
    this.velocity.add(this.acceleration);
    this.velocity.limit(BOID_SETTINGS.maxSpeed);
    const minSpeed = this.type === BOID_TYPES.predator
      ? BOID_SETTINGS.predatorMinSpeed
      : BOID_SETTINGS.minSpeed;
    if (this.velocity.mag() < minSpeed) {
      if (this.velocity.magSq() === 0) {
        this.velocity = p5.Vector.random2D().mult(minSpeed);
      } else {
        this.velocity.setMag(minSpeed);
      }
    }
    this.position.add(this.velocity);
    this.acceleration.mult(0);
  }

  render() {
    if (this.isMouse) {
      return;
    }
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

  getNeighbors() {
    const neighbors = [];
    const predatorsNearby = [];
    const collisionPush = createVector(0, 0);
    const perceptionSq = BOID_SETTINGS.perception * BOID_SETTINGS.perception;
    const minDist = 16;
    const minDistSq = minDist * minDist;
    const cx = Math.min(SPATIAL_GRID.cols - 1, Math.max(0, Math.floor(this.position.x / SPATIAL_GRID.cellSize)));
    const cy = Math.min(SPATIAL_GRID.rows - 1, Math.max(0, Math.floor(this.position.y / SPATIAL_GRID.cellSize)));

    for (let y = cy - 1; y <= cy + 1; y += 1) {
      if (y < 0 || y >= SPATIAL_GRID.rows) continue;
      for (let x = cx - 1; x <= cx + 1; x += 1) {
        if (x < 0 || x >= SPATIAL_GRID.cols) continue;
        const cell = SPATIAL_GRID.cells[y * SPATIAL_GRID.cols + x];
        for (const other of cell) {
          if (other === this) continue;
          const dx = this.position.x - other.position.x;
          const dy = this.position.y - other.position.y;
          const d2 = dx * dx + dy * dy;

          if (d2 > 0 && d2 < minDistSq) {
            const d = Math.sqrt(d2);
            const t = 1 - d / minDist;
            const strength = t * t * BOID_SETTINGS.maxForce * 2.0;
            const scale = strength / d;
            collisionPush.x += dx * scale;
            collisionPush.y += dy * scale;
          }

          if (d2 < perceptionSq) {
            if (other.type === BOID_TYPES.predator) {
              predatorsNearby.push(other);
            }
            if (this.type === BOID_TYPES.predator) {
              if (other.type !== BOID_TYPES.predator) continue;
              neighbors.push(other);
            } else if (other.type !== BOID_TYPES.predator) {
              neighbors.push(other);
            }
          }
        }
      }
    }
    return { neighbors, predatorsNearby, collisionPush };
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

  cohereFromWeighted(others, weight) {
    const steering = createVector(0, 0);
    let totalWeight = 0;
    for (const other of others) {
      steering.add(p5.Vector.mult(other.position, weight));
      totalWeight += weight;
    }
    if (totalWeight === 0) return steering;
    steering.div(totalWeight);
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
    const sameSteer = this.cohereFromWeighted(sameColor, BOID_SETTINGS.regularSameColorBias)
      .mult(BOID_SETTINGS.weights.regularSameColor);
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

  avoidPredators(predators) {
    const steering = createVector(0, 0);
    let count = 0;
    for (const other of predators) {
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

  predatorPersonalSpace(predators) {
    const steering = createVector(0, 0);
    let count = 0;
    for (const other of predators) {
      const d = dist(this.position.x, this.position.y, other.position.x, other.position.y);
      if (d > 0 && d < BOID_SETTINGS.predatorPersonalSpace.range) {
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
    steering.limit(BOID_SETTINGS.maxForce * 0.7);
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

setupSettingsUI();

function updateMouseJiggler() {
  if (!MOUSE_JIGGLER.enabled) {
    if (MOUSE_JIGGLER.active) {
      stopMouseJiggle();
    }
    return;
  }
  if (!MOUSE_JIGGLER.lastMoveAt) {
    MOUSE_JIGGLER.lastMoveAt = millis();
  }
  if (millis() < MOUSE_JIGGLER.disabledUntil) {
    if (MOUSE_JIGGLER.active) {
      stopMouseJiggle();
    }
    return;
  }
  const idleFor = millis() - MOUSE_JIGGLER.lastMoveAt;
  if (idleFor >= MOUSE_JIGGLER.idleMs) {
    if (!MOUSE_JIGGLER.active) {
      startMouseJiggle();
    }
  } else if (MOUSE_JIGGLER.active) {
    stopMouseJiggle();
  }
  if (MOUSE_JIGGLER.active && MOUSE_JIGGLER.boid) {
    sendMouseBoidPosition();
  }
}

function startMouseJiggle() {
  MOUSE_JIGGLER.active = true;
  attachMouseBoid();
  if (window.mouseJiggler && typeof window.mouseJiggler.start === 'function') {
    window.mouseJiggler.start();
  }
}

function stopMouseJiggle() {
  MOUSE_JIGGLER.active = false;
  detachMouseBoid();
  if (window.mouseJiggler && typeof window.mouseJiggler.stop === 'function') {
    window.mouseJiggler.stop();
  }
}

function attachMouseBoid() {
  if (MOUSE_JIGGLER.boid) {
    return;
  }
  const pos = MOUSE_JIGGLER.lastMousePos || createVector(width * 0.5, height * 0.5);
  const boid = new Boid(pos.x, pos.y, BOID_TYPES.regular);
  boid.isMouse = true;
  boid.velocity = p5.Vector.random2D().mult(BOID_SETTINGS.maxSpeed);
  MOUSE_JIGGLER.boid = boid;
  boids.push(boid);
}

function detachMouseBoid() {
  if (!MOUSE_JIGGLER.boid) {
    return;
  }
  const idx = boids.indexOf(MOUSE_JIGGLER.boid);
  if (idx >= 0) {
    boids.splice(idx, 1);
  }
  MOUSE_JIGGLER.boid = null;
}

function sendMouseBoidPosition() {
  const now = millis();
  if (now - MOUSE_JIGGLER.lastSendAt < MOUSE_JIGGLER.sendIntervalMs) {
    return;
  }
  MOUSE_JIGGLER.lastSendAt = now;
  if (!canvasElement) {
    return;
  }
  const rect = canvasElement.getBoundingClientRect();
  const screenX = window.screenX ?? window.screenLeft ?? 0;
  const screenY = window.screenY ?? window.screenTop ?? 0;
  const scale = window.devicePixelRatio || 1;
  const x = Math.round((screenX + rect.left + MOUSE_JIGGLER.boid.position.x) * scale);
  const y = Math.round((screenY + rect.top + MOUSE_JIGGLER.boid.position.y) * scale);
  MOUSE_JIGGLER.programmaticMoveAt = now;
  if (window.mouseJiggler && typeof window.mouseJiggler.move === 'function') {
    window.mouseJiggler.move(x, y);
  }
}

function getCanvasPositionFromEvent(event) {
  if (!canvasElement) {
    return createVector(mouseX, mouseY);
  }
  const rect = canvasElement.getBoundingClientRect();
  const x = constrain(event.clientX - rect.left, 0, width);
  const y = constrain(event.clientY - rect.top, 0, height);
  return createVector(x, y);
}

function relinquishMouseControl(event) {
  const now = millis();
  MOUSE_JIGGLER.lastMoveAt = now;
  MOUSE_JIGGLER.lastMousePos = event ? getCanvasPositionFromEvent(event) : MOUSE_JIGGLER.lastMousePos;
  if (MOUSE_JIGGLER.active) {
    stopMouseJiggle();
  }
  MOUSE_JIGGLER.disabledUntil = now + 1200;
}

window.addEventListener('mousemove', (event) => {
  const now = millis();
  if (MOUSE_JIGGLER.active && now - MOUSE_JIGGLER.programmaticMoveAt < 150) {
    return;
  }
  relinquishMouseControl(event);
});

window.addEventListener('mousedown', (event) => {
  relinquishMouseControl(event);
});

window.addEventListener('keydown', () => {
  relinquishMouseControl();
});
