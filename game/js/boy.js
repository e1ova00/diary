// Низкополигональный мальчик в зимней одежде + процедурные анимации (бег, прыжок, танцы)
import * as THREE from 'three';

const geoCache = {};
function box(w, h, d) {
  const k = `b${w}_${h}_${d}`;
  return geoCache[k] || (geoCache[k] = new THREE.BoxGeometry(w, h, d));
}
function mat(color, extra = {}) {
  return new THREE.MeshStandardMaterial({ color, roughness: 0.85, flatShading: true, ...extra });
}
function mesh(geo, material, x = 0, y = 0, z = 0) {
  const m = new THREE.Mesh(geo, material);
  m.position.set(x, y, z);
  m.castShadow = true;
  return m;
}

export const DANCES = ['Присядка', 'Флосс', 'Вертушка', 'Диско', 'Прыжки-хлопки'];

export function makeBoy(opts = {}) {
  const o = {
    jacket: 0xe63946, pants: 0x1d3557, hat: 0x2a9d8f, pom: 0xffffff,
    scarf: 0xf4a261, skin: 0xf6cfa6, boots: 0x4a3020, mitten: 0xffd166, ...opts,
  };
  const root = new THREE.Group();
  const body = new THREE.Group();
  root.add(body);

  const hips = new THREE.Group();
  hips.position.y = 0.85;
  body.add(hips);

  const jacketM = mat(o.jacket);
  const torso = mesh(box(0.64, 0.74, 0.4), jacketM, 0, 0.38, 0);
  hips.add(torso);
  hips.add(mesh(box(0.06, 0.6, 0.02), mat(0xffffff), 0, 0.38, 0.205)); // молния
  hips.add(mesh(box(0.68, 0.1, 0.44), mat(o.pants), 0, 0.02, 0)); // ремень/низ куртки

  const chest = new THREE.Group();
  chest.position.y = 0.72;
  hips.add(chest);

  // шарф
  const scarf = mesh(new THREE.TorusGeometry(0.2, 0.08, 6, 10), mat(o.scarf), 0, 0.04, 0);
  scarf.rotation.x = Math.PI / 2;
  chest.add(scarf);
  const tail = mesh(box(0.12, 0.32, 0.05), mat(o.scarf), 0.12, -0.14, 0.22);
  tail.rotation.z = 0.15;
  chest.add(tail);

  // голова
  const head = new THREE.Group();
  head.position.y = 0.36;
  chest.add(head);
  head.add(mesh(new THREE.IcosahedronGeometry(0.3, 1), mat(o.skin), 0, 0, 0));
  const eyeM = mat(0x1b1b1b, { roughness: 0.3 });
  const eyeG = new THREE.SphereGeometry(0.045, 6, 6);
  head.add(mesh(eyeG, eyeM, -0.1, 0.04, 0.26));
  head.add(mesh(eyeG, eyeM, 0.1, 0.04, 0.26));
  const cheekM = mat(0xff8fa3);
  const cheekG = new THREE.SphereGeometry(0.05, 6, 6);
  head.add(mesh(cheekG, cheekM, -0.17, -0.07, 0.22));
  head.add(mesh(cheekG, cheekM, 0.17, -0.07, 0.22));
  const smile = mesh(new THREE.TorusGeometry(0.07, 0.015, 4, 10, Math.PI), eyeM, 0, -0.06, 0.27);
  smile.rotation.z = Math.PI;
  head.add(smile);
  // шапка
  const hatM = mat(o.hat);
  const hat = mesh(new THREE.SphereGeometry(0.33, 10, 6, 0, Math.PI * 2, 0, Math.PI / 2), hatM, 0, 0.06, 0);
  head.add(hat);
  const band = mesh(new THREE.TorusGeometry(0.31, 0.06, 6, 14), mat(o.pom), 0, 0.07, 0);
  band.rotation.x = Math.PI / 2;
  head.add(band);
  head.add(mesh(new THREE.IcosahedronGeometry(0.11, 0), mat(o.pom), 0, 0.42, 0));

  // руки
  const arms = [];
  for (const s of [-1, 1]) {
    const pivot = new THREE.Group();
    pivot.position.set(s * 0.41, -0.02, 0);
    chest.add(pivot);
    pivot.add(mesh(box(0.18, 0.56, 0.2), jacketM, 0, -0.26, 0));
    pivot.add(mesh(new THREE.IcosahedronGeometry(0.11, 0), mat(o.mitten), 0, -0.6, 0));
    arms.push(pivot);
  }
  // ноги
  const legs = [], knees = [];
  const pantsM = mat(o.pants), bootM = mat(o.boots);
  for (const s of [-1, 1]) {
    const pivot = new THREE.Group();
    pivot.position.set(s * 0.16, 0, 0);
    hips.add(pivot);
    pivot.add(mesh(box(0.24, 0.48, 0.26), pantsM, 0, -0.24, 0));
    const knee = new THREE.Group();
    knee.position.y = -0.47;
    pivot.add(knee);
    knee.add(mesh(box(0.22, 0.3, 0.24), pantsM, 0, -0.14, 0));
    knee.add(mesh(box(0.26, 0.14, 0.38), bootM, 0, -0.32, 0.05));
    legs.push(pivot);
    knees.push(knee);
  }

  // мягкая тень-блоб (для дешёвых NPC)
  const parts = { root, body, hips, chest, head, arms, legs, knees };
  return new BoyAnimator(parts);
}

const lerp = (a, b, k) => a + (b - a) * k;

class BoyAnimator {
  constructor(p) {
    this.p = p;
    this.root = p.root;
    this.t = 0;
    this.phase = 0;
    this.mode = 'idle';
    this.dance = 0;
    this.danceT = 0;
    this.spin = 0;
    this.cur = this.zero();
  }
  zero() {
    return { aLx: 0, aLz: 0, aRx: 0, aRz: 0, lLx: 0, lLz: 0, lRx: 0, lRz: 0, kL: 0, kR: 0, y: 0, lean: 0, roll: 0, headY: 0, headZ: 0 };
  }
  setMode(mode, dance) {
    if (mode === 'dance' && (this.mode !== 'dance' || dance !== this.dance)) {
      this.danceT = 0;
      this.dance = dance ?? Math.floor(Math.random() * DANCES.length);
    }
    if (mode !== 'dance') this.spin = 0;
    this.mode = mode;
  }
  update(dt, speed = 0) {
    this.t += dt;
    this.dt = dt;
    const g = this.zero();
    const t = this.t;
    switch (this.mode) {
      case 'run': {
        this.phase += dt * (4 + speed * 1.3);
        const s = Math.sin(this.phase), c = Math.cos(this.phase);
        const amp = Math.min(1, 0.35 + speed / 7);
        g.lLx = -s * 0.9 * amp; g.lRx = s * 0.9 * amp;
        g.kL = Math.max(0, c) * 1.1 * amp; g.kR = Math.max(0, -c) * 1.1 * amp;
        g.aLx = s * 0.9 * amp; g.aRx = -s * 0.9 * amp;
        g.aLz = -0.15; g.aRz = 0.15;
        g.y = Math.abs(c) * 0.09 * amp;
        g.lean = 0.18 * amp;
        break;
      }
      case 'jump':
        g.lLx = -0.6; g.lRx = 0.2; g.kL = 1.2; g.kR = 0.5;
        g.aLz = -2.3; g.aRz = 2.3; g.lean = 0.1;
        break;
      case 'fall':
        g.lLx = -0.3; g.lRx = -0.1; g.kL = 0.4; g.kR = 0.6;
        g.aLz = -1.6; g.aRz = 1.6; g.aLx = -0.3; g.aRx = -0.3;
        break;
      case 'dance':
        this.danceT += dt;
        this.dancePose(g, this.danceT);
        break;
      default: // idle
        g.y = Math.sin(t * 2) * 0.015;
        g.aLz = -0.12 - Math.sin(t * 2) * 0.03; g.aRz = 0.12 + Math.sin(t * 2) * 0.03;
        g.headY = Math.sin(t * 0.7) * 0.3;
    }
    const k = 1 - Math.exp(-dt * (this.mode === 'dance' ? 18 : 14));
    const c = this.cur;
    for (const key in g) c[key] = lerp(c[key], g[key], k);
    const P = this.p;
    P.arms[0].rotation.set(c.aLx, 0, c.aLz);
    P.arms[1].rotation.set(c.aRx, 0, c.aRz);
    P.legs[0].rotation.set(c.lLx, 0, c.lLz);
    P.legs[1].rotation.set(c.lRx, 0, c.lRz);
    P.knees[0].rotation.x = c.kL;
    P.knees[1].rotation.x = c.kR;
    P.body.position.y = c.y;
    P.hips.rotation.x = c.lean;
    P.hips.rotation.z = c.roll;
    P.head.rotation.y = c.headY;
    P.head.rotation.z = c.headZ;
    P.body.rotation.y = this.spin;
  }
  dancePose(g, t) {
    const beat = t * Math.PI * 4; // 120 bpm
    const s = Math.sin(beat), c = Math.cos(beat);
    const half = Math.sin(beat / 2);
    switch (this.dance) {
      case 0: { // Присядка
        g.y = -0.32 + Math.abs(s) * 0.06;
        const left = half > 0;
        g.lLx = left ? -1.4 : -1.1; g.kL = left ? 0.1 : 2.2;
        g.lRx = left ? -1.1 : -1.4; g.kR = left ? 2.2 : 0.1;
        g.aLx = -1.5; g.aRx = -1.5; g.aLz = 0.5; g.aRz = -0.5;
        g.lean = -0.1; g.headZ = s * 0.1;
        break;
      }
      case 1: { // Флосс
        g.roll = s * 0.25;
        g.aLx = s * 0.9; g.aRx = s * 0.9; g.aLz = -0.3; g.aRz = 0.3;
        g.lLz = -s * 0.15; g.lRz = -s * 0.15;
        g.y = Math.abs(c) * 0.05; g.headZ = -s * 0.15;
        break;
      }
      case 2: { // Вертушка
        this.spin += this.dt * 9;
        g.y = Math.abs(s) * 0.25;
        g.aLz = -2.7 - s * 0.3; g.aRz = 2.7 + s * 0.3;
        g.kL = Math.abs(s) * 0.6; g.kR = Math.abs(s) * 0.6;
        break;
      }
      case 3: { // Диско
        const up = half > 0;
        g.aRz = up ? 2.5 : 0.6; g.aRx = up ? -0.4 : -0.9;
        g.aLz = -0.3; g.aLx = -0.6;
        g.roll = up ? 0.15 : -0.15;
        g.lLx = up ? -0.4 : 0; g.kL = up ? 0.5 : 0;
        g.y = Math.abs(s) * 0.05; g.headY = up ? 0.4 : -0.4;
        break;
      }
      default: { // Прыжки-хлопки
        const open = Math.abs(s);
        g.y = open * 0.3;
        g.aLz = -0.3 - open * 2.6; g.aRz = 0.3 + open * 2.6;
        g.lLz = -open * 0.35; g.lRz = open * 0.35;
        g.kL = (1 - open) * 0.4; g.kR = (1 - open) * 0.4;
      }
    }
  }
}
