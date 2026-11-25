// Зимний мир: река со льдинами-островами тем, лес, дорога с машинками и светофором
import * as THREE from 'three';
import { makeBoy } from './boy.js';

export const THEME_EMOJI = {
  general: '📘', drivers_responsibility: '🪪', traffic_signs: '⛔', road_surface_marking: '〰️',
  signals: '🚦', special_signals: '🚨', emergency: '⚠️', drive: '↪️', drive_order: '🛣️',
  speed: '🏎️', overtaking: '⏩', stop: '🅿️', crossroads: '✖️', crossings: '🚸', bus: '🚌',
  railway: '🚂', highway: '🛤️', residential_area: '🏘️', lights_horn: '💡', tow: '🪝',
  training_bicycle: '🚲', transportation: '📦', maintenance: '🔧', responsibility: '👮',
  safe_drive: '🛡️', first_aid: '🩹',
};

// детерминированный рандом, чтобы мир всегда был одинаковым
let seed = 1337;
const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
const rr = (a, b) => a + (b - a) * rnd();

const M = (color, extra = {}) => new THREE.MeshStandardMaterial({ color, roughness: 0.9, flatShading: true, ...extra });

function mergeGeos(list) {
  const pos = [], nor = [];
  for (const g0 of list) {
    const g = g0.index ? g0.toNonIndexed() : g0;
    g.computeVertexNormals();
    pos.push(...g.attributes.position.array);
    nor.push(...g.attributes.normal.array);
  }
  const out = new THREE.BufferGeometry();
  out.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  out.setAttribute('normal', new THREE.Float32BufferAttribute(nor, 3));
  return out;
}

// ---------- текстуры-надписи ----------
function wrapText(ctx, text, maxW) {
  const words = text.split(' ');
  const lines = [];
  let line = '';
  for (const w of words) {
    const test = line ? line + ' ' + w : w;
    if (ctx.measureText(test).width > maxW && line) { lines.push(line); line = w; } else line = test;
  }
  if (line) lines.push(line);
  return lines;
}

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

export function drawBoard(canvas, { num, emoji, title, done, total, complete }) {
  const ctx = canvas.getContext('2d');
  const W = canvas.width, H = canvas.height;
  const grad = ctx.createLinearGradient(0, 0, 0, H);
  grad.addColorStop(0, complete ? '#f6c453' : '#9c6b3f');
  grad.addColorStop(1, complete ? '#d99a22' : '#6f4423');
  ctx.fillStyle = grad;
  roundRect(ctx, 0, 0, W, H, 40);
  ctx.fill();
  ctx.lineWidth = 14;
  ctx.strokeStyle = complete ? '#fff3c4' : '#4a2c14';
  roundRect(ctx, 10, 10, W - 20, H - 20, 32);
  ctx.stroke();
  // снег сверху
  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  ctx.moveTo(0, 30);
  for (let x = 0; x <= W; x += 40) ctx.quadraticCurveTo(x + 20, 50 + (x % 80 ? 10 : -4), x + 40, 30);
  ctx.lineTo(W, 0); ctx.lineTo(0, 0); ctx.fill();

  ctx.fillStyle = complete ? '#3b2600' : '#fff8ec';
  ctx.textBaseline = 'middle';
  ctx.font = 'bold 76px system-ui, sans-serif';
  ctx.fillText(`${emoji} ${num}`, 44, 104);
  ctx.font = 'bold 40px system-ui, sans-serif';
  ctx.textAlign = 'right';
  ctx.fillText(complete ? '★ ПРОЙДЕНО' : `${done}/${total} мини-тем`, W - 44, 104);
  ctx.textAlign = 'left';
  let size = 56;
  let lines;
  do {
    ctx.font = `bold ${size}px system-ui, sans-serif`;
    lines = wrapText(ctx, title, W - 90);
    size -= 4;
  } while (lines.length > 3 && size > 30);
  const lh = size * 1.18;
  const y0 = 150 + (3 - lines.length) * lh * 0.5 + lh / 2;
  lines.slice(0, 3).forEach((l, i) => ctx.fillText(l, 44, y0 + i * lh));
  // прогресс
  const bx = 44, by = H - 58, bw = W - 88, bh = 22;
  ctx.fillStyle = 'rgba(0,0,0,0.35)';
  roundRect(ctx, bx, by, bw, bh, 11); ctx.fill();
  ctx.fillStyle = complete ? '#ffffff' : '#7ae582';
  if (done > 0) { roundRect(ctx, bx, by, Math.max(bh, bw * done / total), bh, 11); ctx.fill(); }
}

function textBoard(lines, { w = 1024, h = 512, bg = '#1d4e89', fg = '#fff', sub = '#ffd166' } = {}) {
  const c = document.createElement('canvas');
  c.width = w; c.height = h;
  const ctx = c.getContext('2d');
  ctx.fillStyle = bg; roundRect(ctx, 0, 0, w, h, 50); ctx.fill();
  ctx.lineWidth = 16; ctx.strokeStyle = '#ffffff'; roundRect(ctx, 14, 14, w - 28, h - 28, 40); ctx.stroke();
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  lines.forEach((l, i) => {
    ctx.fillStyle = i === 0 ? fg : sub;
    ctx.font = `bold ${l.size || 80}px system-ui, sans-serif`;
    ctx.fillText(l.text, w / 2, l.y, w - 80);
  });
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 4;
  return tex;
}

function glowTexture() {
  const c = document.createElement('canvas');
  c.width = c.height = 256;
  const ctx = c.getContext('2d');
  const g = ctx.createRadialGradient(128, 128, 10, 128, 128, 128);
  g.addColorStop(0, 'rgba(255,255,255,0.95)');
  g.addColorStop(0.45, 'rgba(255,255,255,0.45)');
  g.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.fillStyle = g; ctx.fillRect(0, 0, 256, 256);
  // спираль
  ctx.strokeStyle = 'rgba(255,255,255,0.6)';
  ctx.lineWidth = 6;
  ctx.beginPath();
  for (let a = 0; a < 12; a += 0.1) {
    const r = a * 9;
    ctx.lineTo(128 + Math.cos(a) * r, 128 + Math.sin(a) * r);
  }
  ctx.stroke();
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

// ---------- дорожные знаки (упрощённые рисунки) ----------
function signTexture(kind) {
  const c = document.createElement('canvas');
  c.width = c.height = 256;
  const x = c.getContext('2d');
  if (kind === 'crossing') {
    x.fillStyle = '#ffffff'; x.fillRect(0, 0, 256, 256);
    x.fillStyle = '#1565c0'; x.fillRect(10, 10, 236, 236);
    x.fillStyle = '#ffffff';
    x.beginPath(); x.moveTo(128, 30); x.lineTo(232, 220); x.lineTo(24, 220); x.closePath(); x.fill();
    x.fillStyle = '#111';
    x.beginPath(); x.arc(130, 95, 14, 0, 7); x.fill();
    x.lineWidth = 14; x.strokeStyle = '#111'; x.lineCap = 'round';
    x.beginPath(); x.moveTo(128, 112); x.lineTo(120, 160); x.lineTo(100, 200); x.moveTo(120, 160); x.lineTo(150, 200);
    x.moveTo(125, 125); x.lineTo(100, 145); x.moveTo(125, 125); x.lineTo(155, 140); x.stroke();
    x.fillStyle = '#111';
    for (let i = 0; i < 5; i++) x.fillRect(60 + i * 30, 205, 18, 10);
  } else if (kind === 'speed40' || kind === 'speed60') {
    x.fillStyle = '#ffffff'; x.beginPath(); x.arc(128, 128, 124, 0, 7); x.fill();
    x.strokeStyle = '#d62828'; x.lineWidth = 30; x.beginPath(); x.arc(128, 128, 106, 0, 7); x.stroke();
    x.fillStyle = '#111'; x.font = 'bold 110px system-ui'; x.textAlign = 'center'; x.textBaseline = 'middle';
    x.fillText(kind === 'speed40' ? '40' : '60', 128, 136);
  } else if (kind === 'children') {
    x.fillStyle = '#ffffff';
    x.beginPath(); x.moveTo(128, 6); x.lineTo(252, 236); x.lineTo(4, 236); x.closePath(); x.fill();
    x.strokeStyle = '#d62828'; x.lineWidth = 22; x.lineJoin = 'round';
    x.beginPath(); x.moveTo(128, 24); x.lineTo(236, 226); x.lineTo(20, 226); x.closePath(); x.stroke();
    x.fillStyle = '#111';
    x.beginPath(); x.arc(108, 110, 13, 0, 7); x.arc(150, 120, 11, 0, 7); x.fill();
    x.fillRect(98, 125, 20, 50); x.fillRect(142, 133, 16, 42);
  } else if (kind === 'main') {
    x.translate(128, 128); x.rotate(Math.PI / 4);
    x.fillStyle = '#ffffff'; x.fillRect(-88, -88, 176, 176);
    x.fillStyle = '#ffcc00'; x.fillRect(-66, -66, 132, 132);
  }
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

function makeSign(kind, h = 2.6) {
  const g = new THREE.Group();
  const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, h, 6), M(0x9aa4ad, { metalness: 0.4 }));
  pole.position.y = h / 2; pole.castShadow = true;
  g.add(pole);
  const face = new THREE.Mesh(new THREE.PlaneGeometry(1.1, 1.1),
    new THREE.MeshStandardMaterial({ map: signTexture(kind), transparent: true, roughness: 0.6 }));
  face.position.set(0, h, 0.07);
  g.add(face);
  const cap = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.08, 0.3), M(0xffffff));
  cap.position.set(0, h + 0.58, 0.05);
  if (kind !== 'main') g.add(cap);
  return g;
}

// ---------- машинка ----------
export function makeCar(color) {
  const g = new THREE.Group();
  const bodyM = M(color, { roughness: 0.45, metalness: 0.25 });
  const add = (geo, m, x, y, z) => { const o = new THREE.Mesh(geo, m); o.position.set(x, y, z); o.castShadow = true; g.add(o); return o; };
  add(new THREE.BoxGeometry(1.9, 0.6, 3.8), bodyM, 0, 0.6, 0);
  add(new THREE.BoxGeometry(1.6, 0.56, 1.9), bodyM, 0, 1.17, -0.25);
  const glass = M(0x203a55, { roughness: 0.15, metalness: 0.6 });
  add(new THREE.BoxGeometry(1.62, 0.4, 0.05), glass, 0, 1.18, 0.72);
  add(new THREE.BoxGeometry(1.62, 0.4, 0.05), glass, 0, 1.18, -1.21);
  add(new THREE.BoxGeometry(1.64, 0.36, 1.5), glass, 0, 1.18, -0.25);
  add(new THREE.BoxGeometry(1.5, 0.12, 1.7), M(0xffffff), 0, 1.5, -0.25); // снег на крыше
  const head = new THREE.MeshStandardMaterial({ color: 0xfff6c8, emissive: 0xfff2a8, emissiveIntensity: 1.2 });
  add(new THREE.BoxGeometry(0.4, 0.18, 0.06), head, -0.6, 0.68, 1.91);
  add(new THREE.BoxGeometry(0.4, 0.18, 0.06), head, 0.6, 0.68, 1.91);
  const tail = new THREE.MeshStandardMaterial({ color: 0xff3030, emissive: 0xff1010, emissiveIntensity: 0.6 });
  g.userData.tail = tail;
  add(new THREE.BoxGeometry(0.4, 0.16, 0.06), tail, -0.65, 0.7, -1.91);
  add(new THREE.BoxGeometry(0.4, 0.16, 0.06), tail, 0.65, 0.7, -1.91);
  const wheelG = new THREE.CylinderGeometry(0.36, 0.36, 0.3, 10);
  wheelG.rotateZ(Math.PI / 2);
  const wheelM = M(0x1d1d1d);
  g.userData.wheels = [];
  for (const [x, z] of [[-0.9, 1.2], [0.9, 1.2], [-0.9, -1.25], [0.9, -1.25]]) {
    g.userData.wheels.push(add(wheelG, wheelM, x, 0.36, z));
  }
  return g;
}

// ---------- мир ----------
export function createWorld(scene, themes) {
  const world = { platforms: [], portals: [], updaters: [], npcs: [] };

  // небо
  const skyGeo = new THREE.SphereGeometry(900, 24, 12);
  const skyMat = new THREE.ShaderMaterial({
    side: THREE.BackSide, depthWrite: false, fog: false,
    uniforms: { top: { value: new THREE.Color(0x5b8fd1) }, mid: { value: new THREE.Color(0xbcd6ee) }, bot: { value: new THREE.Color(0xf6dfe6) } },
    vertexShader: 'varying vec3 vp; void main(){ vp = normalize(position); gl_Position = projectionMatrix*modelViewMatrix*vec4(position,1.0); }',
    fragmentShader: 'uniform vec3 top; uniform vec3 mid; uniform vec3 bot; varying vec3 vp; void main(){ float h = vp.y; vec3 c = h>0.15 ? mix(mid, top, smoothstep(0.15,0.7,h)) : mix(bot, mid, smoothstep(-0.05,0.15,h)); gl_FragColor = vec4(c,1.0); }',
  });
  const sky = new THREE.Mesh(skyGeo, skyMat);
  scene.add(sky);
  world.sky = sky;
  // солнце
  const sun = new THREE.Mesh(new THREE.SphereGeometry(30, 16, 8), new THREE.MeshBasicMaterial({ color: 0xfff0c8, fog: false }));
  sun.position.set(-400, 160, -700);
  sky.add(sun);

  scene.fog = new THREE.Fog(0xd5e3f0, 50, 230);

  // свет
  scene.add(new THREE.HemisphereLight(0xdbeaff, 0xf2f6ff, 1.25));
  const dir = new THREE.DirectionalLight(0xfff0dd, 1.9);
  dir.position.set(-30, 50, -20);
  dir.castShadow = true;
  dir.shadow.mapSize.set(2048, 2048);
  const sc = dir.shadow.camera;
  sc.left = -30; sc.right = 30; sc.top = 30; sc.bottom = -30; sc.near = 1; sc.far = 140;
  dir.shadow.bias = -0.0008;
  dir.shadow.normalBias = 0.02;
  scene.add(dir, dir.target);
  world.sunLight = dir;

  const ZMIN = -560, ZMAX = 120;
  const RIVER = 26;

  // река
  const waterMat = new THREE.MeshStandardMaterial({ color: 0x2e6f95, roughness: 0.15, metalness: 0.35, flatShading: true });
  const waterGeo = new THREE.PlaneGeometry(RIVER * 2 + 4, ZMAX - ZMIN, 26, 160);
  waterGeo.rotateX(-Math.PI / 2);
  const water = new THREE.Mesh(waterGeo, waterMat);
  water.position.set(0, -0.35, (ZMAX + ZMIN) / 2);
  water.receiveShadow = true;
  scene.add(water);
  const wpos = waterGeo.attributes.position;
  const wbase = Float32Array.from(wpos.array);
  world.updaters.push((dt, t) => {
    for (let i = 0; i < wpos.count; i++) {
      const x = wbase[i * 3], z = wbase[i * 3 + 2];
      wpos.array[i * 3 + 1] = Math.sin(x * 0.4 + t * 1.3) * 0.08 + Math.cos(z * 0.3 + t * 0.9) * 0.08;
    }
    wpos.needsUpdate = true;
    waterGeo.computeVertexNormals();
  });
  // плавающие льдинки
  const chunkGeo = new THREE.CylinderGeometry(1, 1, 0.25, 6);
  const chunks = new THREE.InstancedMesh(chunkGeo, M(0xe8f4ff), 160);
  const chunkData = [];
  const dummy = new THREE.Object3D();
  for (let i = 0; i < 160; i++) {
    chunkData.push({ x: rr(-RIVER + 2, RIVER - 2), z: rr(ZMIN, ZMAX), s: rr(0.3, 1.1), r: rr(0, 6), v: rr(0.3, 0.8) });
  }
  scene.add(chunks);
  world.updaters.push((dt) => {
    chunkData.forEach((c, i) => {
      c.z += c.v * dt;
      if (c.z > ZMAX) c.z = ZMIN;
      dummy.position.set(c.x, -0.28, c.z);
      dummy.rotation.set(0, c.r += dt * 0.05, 0);
      dummy.scale.set(c.s, 1, c.s * 0.7);
      dummy.updateMatrix();
      chunks.setMatrixAt(i, dummy.matrix);
    });
    chunks.instanceMatrix.needsUpdate = true;
  });

  // берега
  const snowMat = M(0xf7fbff, { roughness: 1 });
  for (const side of [-1, 1]) {
    const w = 260;
    const g = new THREE.PlaneGeometry(w, ZMAX - ZMIN, 70, 170);
    g.rotateX(-Math.PI / 2);
    const p = g.attributes.position;
    for (let i = 0; i < p.count; i++) {
      const lx = p.getX(i), z = p.getZ(i);
      const dist = lx * side + w / 2; // расстояние от кромки реки
      let y = 0.35 + Math.min(1, dist / 10) * (Math.sin(lx * 0.07 + z * 0.05) * 1.6 + Math.cos(z * 0.031 - lx * 0.02) * 2.2 + 1.5);
      if (dist < 0.5) y = -0.6;
      const wx = side * (RIVER + w / 2) + lx;
      if (side > 0 && wx > 32 && wx < 47) y = 0.35; // ровно под дорогой
      p.setY(i, y);
    }
    g.computeVertexNormals();
    const ground = new THREE.Mesh(g, snowMat);
    ground.position.set(side * (RIVER + w / 2), 0, (ZMAX + ZMIN) / 2);
    ground.receiveShadow = true;
    scene.add(ground);
  }
  const groundY = (x, z) => {
    const side = x < 0 ? -1 : 1;
    const w = 260;
    const lx = x - side * (RIVER + w / 2);
    const dist = lx * side + w / 2;
    if (side > 0 && x > 32 && x < 47) return 0.35;
    return 0.35 + Math.min(1, dist / 10) * (Math.sin(lx * 0.07 + z * 0.05) * 1.6 + Math.cos(z * 0.031 - lx * 0.02) * 2.2 + 1.5);
  };

  // ёлки
  const trunkGeo = new THREE.CylinderGeometry(0.18, 0.25, 1.2, 6);
  trunkGeo.translate(0, 0.6, 0);
  const greens = [], snows = [];
  [[2.0, 2.2, 0.9], [1.6, 1.9, 2.0], [1.15, 1.6, 3.0], [0.7, 1.3, 3.9]].forEach(([r, h, y]) => {
    const c = new THREE.ConeGeometry(r, h, 7); c.translate(0, y + h / 2, 0); greens.push(c);
    const s = new THREE.ConeGeometry(r * 0.72, h * 0.45, 7); s.translate(0, y + h * 0.78, 0); snows.push(s);
  });
  const greenGeo = mergeGeos(greens), capGeo = mergeGeos(snows);
  const treeSpots = [];
  for (let i = 0; i < 2200; i++) {
    const side = rnd() < 0.5 ? -1 : 1;
    const x = side * rr(RIVER + 4, RIVER + 150);
    const z = rr(ZMIN, ZMAX);
    if (side > 0 && x > 30 && x < 50) continue; // дорога
    if (side < 0 && x > -46 && z > -4 && z < 26) continue; // полянка с ребятами
    treeSpots.push([x, z, rr(0.8, 1.8), rr(0, 6)]);
  }
  const tN = treeSpots.length;
  const trunkI = new THREE.InstancedMesh(trunkGeo, M(0x5b3a24), tN);
  const greenI = new THREE.InstancedMesh(greenGeo, M(0x1f5f3f), tN);
  const capI = new THREE.InstancedMesh(capGeo, M(0xffffff), tN);
  treeSpots.forEach(([x, z, s, r], i) => {
    dummy.position.set(x, groundY(x, z) - 0.2, z);
    dummy.rotation.set(0, r, 0);
    dummy.scale.set(s, s * rr(0.9, 1.25), s);
    dummy.updateMatrix();
    trunkI.setMatrixAt(i, dummy.matrix); greenI.setMatrixAt(i, dummy.matrix); capI.setMatrixAt(i, dummy.matrix);
  });
  for (const m of [trunkI, greenI, capI]) { m.castShadow = true; m.receiveShadow = true; scene.add(m); }

  // сугробы на берегах
  const driftI = new THREE.InstancedMesh(new THREE.IcosahedronGeometry(1, 1), snowMat, 300);
  for (let i = 0; i < 300; i++) {
    const side = rnd() < 0.5 ? -1 : 1;
    const x = side * rr(RIVER + 1, RIVER + 60), z = rr(ZMIN, ZMAX);
    if (side > 0 && x > 30 && x < 50) { i--; continue; }
    dummy.position.set(x, groundY(x, z) - 0.2, z);
    dummy.rotation.set(0, rr(0, 6), 0);
    const s = rr(0.6, 2);
    dummy.scale.set(s * 1.5, s * 0.5, s);
    dummy.updateMatrix();
    driftI.setMatrixAt(i, dummy.matrix);
  }
  driftI.receiveShadow = true;
  scene.add(driftI);

  // ---------- острова-темы ----------
  const rockMat = M(0x7f93a8);
  const iceMat = M(0xbfe3f5, { roughness: 0.35 });
  const capMat = M(0xffffff, { roughness: 1 });
  const glowTex = glowTexture();

  function addPlatform(x, z, r, top, kind = 'island', bob = 0) {
    const g = new THREE.Group();
    const h = top + 3;
    const seg = kind === 'island' ? 12 : 7;
    const side = new THREE.Mesh(new THREE.CylinderGeometry(r, r * 0.8, h, seg), kind === 'island' ? rockMat : iceMat);
    side.position.y = top - h / 2 - 0.15;
    side.castShadow = true; side.receiveShadow = true;
    const cap = new THREE.Mesh(new THREE.CylinderGeometry(r + 0.12, r, 0.35, seg), capMat);
    cap.position.y = top - 0.12;
    cap.receiveShadow = true; cap.castShadow = true;
    g.add(side, cap);
    g.position.set(x, 0, z);
    g.rotation.y = rnd() * 3;
    scene.add(g);
    const p = { x, z, r, top, baseTop: top, kind, bob, phase: rnd() * 6, group: g };
    world.platforms.push(p);
    return p;
  }
  world.updaters.push((dt, t) => {
    for (const p of world.platforms) {
      if (!p.bob) continue;
      p.top = p.baseTop + Math.sin(t * 1.4 + p.phase) * p.bob;
      p.group.position.y = p.top - p.baseTop;
    }
  });

  function makeGate(color) {
    const gate = new THREE.Group();
    const postM = M(0x7a4a26);
    for (const s of [-1, 1]) {
      const post = new THREE.Mesh(new THREE.BoxGeometry(0.35, 4.6, 0.35), postM);
      post.position.set(s * 2.45, 2.3, 0); post.castShadow = true;
      gate.add(post);
      const cap = new THREE.Mesh(new THREE.ConeGeometry(0.35, 0.4, 4), capMat);
      cap.position.set(s * 2.45, 4.8, 0); cap.rotation.y = Math.PI / 4;
      gate.add(cap);
    }
    const ringMat = new THREE.MeshStandardMaterial({ color, emissive: color, emissiveIntensity: 0.9, roughness: 0.3 });
    const ring = new THREE.Mesh(new THREE.TorusGeometry(1.55, 0.16, 8, 32), ringMat);
    ring.position.y = 1.85;
    gate.add(ring);
    const discMat = new THREE.MeshBasicMaterial({ map: glowTex, color, transparent: true, depthWrite: false, side: THREE.DoubleSide, opacity: 0.85 });
    const disc = new THREE.Mesh(new THREE.CircleGeometry(1.45, 32), discMat);
    disc.position.y = 1.85;
    gate.add(disc);
    const light = new THREE.PointLight(color, 6, 9, 1.6);
    light.position.set(0, 1.9, 1.2);
    gate.add(light);
    gate.userData = { ring, ringMat, disc, discMat, light };
    return gate;
  }

  function setGateColor(gate, color) {
    const u = gate.userData;
    u.ringMat.color.setHex(color); u.ringMat.emissive.setHex(color);
    u.discMat.color.setHex(color); u.light.color.setHex(color);
  }
  world.setGateColor = setGateColor;

  function addBoard(parent, canvas, w, h, y) {
    const tex = new THREE.CanvasTexture(canvas);
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.anisotropy = 4;
    const board = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshStandardMaterial({ map: tex, roughness: 0.8, transparent: true }));
    board.position.y = y;
    board.position.z = 0.2;
    parent.add(board);
    const back = new THREE.Mesh(new THREE.PlaneGeometry(w, h), M(0x6f4423));
    back.rotation.y = Math.PI; back.position.set(0, y, 0.18);
    parent.add(back);
    return tex;
  }

  // стартовый остров
  const start = addPlatform(0, 22, 7.5, 1.0);
  world.spawn = new THREE.Vector3(0, 1.0, 25);
  {
    const welcome = new THREE.Group();
    welcome.position.set(0, 1.0, 16.2);
    for (const s of [-1, 1]) {
      const post = new THREE.Mesh(new THREE.BoxGeometry(0.4, 5, 0.4), M(0x7a4a26));
      post.position.set(s * 3.6, 2.5, 0); post.castShadow = true; welcome.add(post);
    }
    const tex = textBoard([
      { text: 'ПДД 2026', y: 150, size: 140 },
      { text: 'Снежный забег ❄', y: 290, size: 92 },
      { text: 'Прыгай по льдинам → проходи темы → танцуй!', y: 410, size: 40 },
    ], { bg: '#1d4e89' });
    const b = new THREE.Mesh(new THREE.PlaneGeometry(7.6, 3.8), new THREE.MeshStandardMaterial({ map: tex, transparent: true }));
    b.position.set(0, 4.3, 0.25);
    welcome.add(b);
    // делаем табличку видимой с обеих сторон
    const b2 = b.clone(); b2.rotation.y = Math.PI; b2.position.z = 0.15; welcome.add(b2);
    scene.add(welcome);
  }
  // спецпорталы на старте
  const specials = [
    { id: 'errors', label: 'Работа над ошибками', emoji: '❗', color: 0xff6b6b, x: -4.4, z: 24 },
    { id: 'exam', label: 'Экзамен: 20 вопросов', emoji: '🎓', color: 0xffd166, x: 4.4, z: 24 },
  ];
  for (const s of specials) {
    const gate = makeGate(s.color);
    gate.position.set(s.x, start.top, s.z);
    gate.rotation.y = s.x < 0 ? Math.PI / 2 : -Math.PI / 2;
    gate.scale.setScalar(0.8);
    scene.add(gate);
    const c = document.createElement('canvas'); c.width = 1024; c.height = 300;
    const ctx = c.getContext('2d');
    ctx.fillStyle = '#' + s.color.toString(16).padStart(6, '0');
    roundRect(ctx, 0, 0, 1024, 300, 40); ctx.fill();
    ctx.fillStyle = '#1b1b1b'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.font = 'bold 84px system-ui, sans-serif';
    ctx.fillText(`${s.emoji} ${s.label}`, 512, 150, 960);
    addBoard(gate, c, 5.4, 1.6, 4.4);
    world.portals.push({ special: s.id, x: s.x, z: s.z, platform: start, gate, label: s.label, emoji: s.emoji });
  }

  // острова тем по извилистой реке
  const SPACING = 19;
  let prev = start;
  themes.forEach((th, i) => {
    const z = -i * SPACING;
    const x = Math.sin(i * 0.8) * 11;
    const top = 1.1 + Math.sin(i * 1.7) * 0.7;
    const isl = addPlatform(x, z, 4.8, top);
    isl.theme = i;
    // льдины между островами
    const dx = x - prev.x, dz = z - prev.z;
    const d = Math.hypot(dx, dz);
    const L = d - prev.r - isl.r;
    const rf = 1.45, gapT = 2.4;
    const n = Math.max(1, Math.round((L - gapT) / (2 * rf + gapT)));
    const gap = (L - n * 2 * rf) / (n + 1);
    for (let k = 0; k < n; k++) {
      const along = prev.r + gap * (k + 1) + rf * (2 * k + 1);
      const fx = prev.x + dx / d * along + rr(-0.6, 0.6);
      const fz = prev.z + dz / d * along;
      const ft = prev.top + (top - prev.top) * (along / d) + rr(-0.35, 0.35);
      addPlatform(fx, fz, rf, ft, 'floe', rnd() < 0.5 ? 0.12 : 0);
    }
    const gate = makeGate(0x7fb7ff);
    gate.position.set(x, top, z);
    scene.add(gate);
    const canvas = document.createElement('canvas');
    canvas.width = 1024; canvas.height = 420;
    const tex = addBoard(gate, canvas, 5.6, 2.3, 5.85);
    world.portals.push({ theme: i, x, z, platform: isl, gate, canvas, tex });
    prev = isl;
  });

  // финиш
  {
    const i = themes.length;
    const z = -i * SPACING - 4, x = Math.sin(i * 0.8) * 11;
    const fin = addPlatform(x, z, 7, 1.2);
    const dx = x - prev.x, dz = z - prev.z, d = Math.hypot(dx, dz);
    const L = d - prev.r - fin.r;
    const n = Math.max(1, Math.round((L - 2.4) / 5.3));
    const gap = (L - n * 2.9) / (n + 1);
    for (let k = 0; k < n; k++) {
      const along = prev.r + gap * (k + 1) + 1.45 * (2 * k + 1);
      addPlatform(prev.x + dx / d * along, prev.z + dz / d * along, 1.45, 1.1 + rr(-0.3, 0.3), 'floe');
    }
    const cup = new THREE.Group();
    const gold = new THREE.MeshStandardMaterial({ color: 0xffc83d, metalness: 0.8, roughness: 0.25, emissive: 0x553300 });
    const bowl = new THREE.Mesh(new THREE.CylinderGeometry(1.2, 0.5, 1.6, 16, 1, true), gold);
    bowl.position.y = 3.2;
    const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.3, 1.2, 8), gold); stem.position.y = 1.9;
    const base = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.5, 1.6), gold); base.position.y = 1.2;
    for (const s of [-1, 1]) {
      const h = new THREE.Mesh(new THREE.TorusGeometry(0.45, 0.1, 6, 12), gold);
      h.position.set(s * 1.25, 3.3, 0); h.rotation.y = Math.PI / 2; cup.add(h);
    }
    cup.add(bowl, stem, base);
    cup.traverse(o => { o.castShadow = true; });
    cup.position.set(x, 1.2 - 1.0, z);
    scene.add(cup);
    world.updaters.push((dt, t) => { cup.rotation.y = t * 0.6; });
    const tex = textBoard([{ text: '🏆 ФИНИШ', y: 200, size: 150 }, { text: 'Все темы ПДД!', y: 370, size: 80 }], { bg: '#7b2cbf' });
    const b = new THREE.Mesh(new THREE.PlaneGeometry(6, 3), new THREE.MeshStandardMaterial({ map: tex, transparent: true }));
    b.position.set(x, 6.8, z); scene.add(b);
    world.finish = fin;
  }

  // ---------- дорога с машинками ----------
  const ROAD_X = 39;
  const road = new THREE.Mesh(new THREE.PlaneGeometry(8, ZMAX - ZMIN), M(0x55595e, { roughness: 0.95 }));
  road.rotation.x = -Math.PI / 2;
  road.position.set(ROAD_X, 0.37, (ZMAX + ZMIN) / 2);
  road.receiveShadow = true;
  scene.add(road);
  // обочины со снегом
  for (const s of [-1, 1]) {
    const curb = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.35, ZMAX - ZMIN), snowMat);
    curb.position.set(ROAD_X + s * 4.3, 0.45, (ZMAX + ZMIN) / 2);
    scene.add(curb);
  }
  // разметка
  const dashN = Math.floor((ZMAX - ZMIN) / 6);
  const dashes = new THREE.InstancedMesh(new THREE.BoxGeometry(0.15, 0.02, 3), new THREE.MeshStandardMaterial({ color: 0xffffff }), dashN);
  for (let i = 0; i < dashN; i++) {
    const z = ZMIN + i * 6 + 3;
    dummy.position.set(ROAD_X, 0.39, z); dummy.rotation.set(0, 0, 0); dummy.scale.set(1, 1, (z > -6 && z < 6) ? 0.001 : 1);
    dummy.updateMatrix(); dashes.setMatrixAt(i, dummy.matrix);
  }
  scene.add(dashes);
  // зебра
  for (let k = -3; k <= 3; k++) {
    const st = new THREE.Mesh(new THREE.BoxGeometry(0.55, 0.02, 4), new THREE.MeshStandardMaterial({ color: 0xffffff }));
    st.position.set(ROAD_X + k * 1.05, 0.39, 0);
    scene.add(st);
  }
  for (const s of [-1, 1]) {
    const line = new THREE.Mesh(new THREE.BoxGeometry(3.8, 0.02, 0.3), new THREE.MeshStandardMaterial({ color: 0xffffff }));
    line.position.set(ROAD_X + s * 2, 0.39, s * 3.6);
    scene.add(line);
  }
  // знаки
  const sg1 = makeSign('crossing'); sg1.position.set(ROAD_X - 5, 0.35, 2.6); sg1.rotation.y = Math.PI / 2 - 0.4; scene.add(sg1);
  const sg2 = makeSign('crossing'); sg2.position.set(ROAD_X + 5, 0.35, -2.6); sg2.rotation.y = -Math.PI / 2 - 0.4; scene.add(sg2);
  const sg3 = makeSign('children'); sg3.position.set(ROAD_X - 5, 0.35, 40); sg3.rotation.y = Math.PI / 2; scene.add(sg3);
  const sg4 = makeSign('speed40'); sg4.position.set(ROAD_X - 5, 0.35, 34); sg4.rotation.y = Math.PI / 2; scene.add(sg4);
  const sg5 = makeSign('speed60'); sg5.position.set(ROAD_X + 5, 0.35, -40); sg5.rotation.y = -Math.PI / 2; scene.add(sg5);
  const sg6 = makeSign('main'); sg6.position.set(ROAD_X - 5, 0.35, -120); sg6.rotation.y = Math.PI / 2; scene.add(sg6);
  // знаки вдоль дороги, смотрят в сторону реки, чтобы было видно игроку
  for (let z = -60; z > ZMIN + 40; z -= 70) {
    const kinds = ['speed60', 'children', 'main', 'speed40'];
    const sgn = makeSign(kinds[Math.abs(z / 70 | 0) % 4]);
    sgn.position.set(ROAD_X - 5, 0.35, z); sgn.rotation.y = -Math.PI / 2 + 0.6; scene.add(sgn);
  }

  // светофоры
  const tl = { state: 'green', t: 0 };
  const lampMats = { red: [], yellow: [], green: [] };
  function makeTL() {
    const g = new THREE.Group();
    const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 3.2, 6), M(0x333a40));
    pole.position.y = 1.6; g.add(pole);
    const boxM = new THREE.Mesh(new THREE.BoxGeometry(0.5, 1.3, 0.4), M(0x1d2226));
    boxM.position.y = 3.6; g.add(boxM);
    [['red', 0xff2020, 0.4], ['yellow', 0xffc400, 0], ['green', 0x20ff60, -0.4]].forEach(([k, c, dy]) => {
      const m = new THREE.MeshStandardMaterial({ color: 0x222222, emissive: c, emissiveIntensity: 0 });
      lampMats[k].push(m);
      const l = new THREE.Mesh(new THREE.SphereGeometry(0.15, 10, 8), m);
      l.position.set(0, 3.6 + dy, 0.2); g.add(l);
    });
    g.traverse(o => { o.castShadow = true; });
    return g;
  }
  const tl1 = makeTL(); tl1.position.set(ROAD_X - 4.6, 0.35, 4.2); scene.add(tl1);
  const tl2 = makeTL(); tl2.position.set(ROAD_X + 4.6, 0.35, -4.2); tl2.rotation.y = Math.PI; scene.add(tl2);
  world.updaters.push((dt) => {
    tl.t += dt;
    const dur = { green: 9, yellow: 2, red: 7, redyellow: 1.2 };
    if (tl.t > dur[tl.state]) {
      tl.t = 0;
      tl.state = { green: 'yellow', yellow: 'red', red: 'redyellow', redyellow: 'green' }[tl.state];
    }
    const on = {
      red: tl.state === 'red' || tl.state === 'redyellow',
      yellow: tl.state === 'yellow' || tl.state === 'redyellow',
      green: tl.state === 'green',
    };
    for (const k in lampMats) lampMats[k].forEach(m => { m.emissiveIntensity = on[k] ? 2.2 : 0; });
  });
  world.trafficLight = tl;

  // машинки
  const carColors = [0xe63946, 0x457b9d, 0xffb703, 0x2a9d8f, 0x9b5de5, 0xf15bb5, 0xffffff, 0x3a86ff, 0xfb8500, 0x06d6a0];
  const cars = [];
  for (let i = 0; i < 18; i++) {
    const dirn = i % 2 ? 1 : -1; // -1 едет к -z
    const car = makeCar(carColors[i % carColors.length]);
    const lane = ROAD_X + (dirn < 0 ? -1.9 : 1.9);
    car.position.set(lane, 0.37, ZMAX - (i * (ZMAX - ZMIN) / 18) + rr(-5, 5));
    car.rotation.y = dirn < 0 ? Math.PI : 0;
    scene.add(car);
    cars.push({ car, dir: dirn, v: 10, cruise: rr(9, 13) });
  }
  world.updaters.push((dt) => {
    for (const c of cars) {
      const z = c.car.position.z;
      let target = c.cruise;
      // стоп-линия: для едущих к -z — z=3.6, для едущих к +z — z=-3.6
      const stopZ = c.dir < 0 ? 3.8 : -3.8;
      const ahead = c.dir < 0 ? z - stopZ : stopZ - z;
      if (tl.state !== 'green' && ahead > -0.5 && ahead < 22) {
        // на жёлтый проезжаем, если не успеваем остановиться
        if (!(tl.state === 'yellow' && ahead < 3)) target = Math.min(target, Math.max(0, (ahead - 0.3) * 0.9));
      }
      // дистанция до впереди идущей
      for (const o of cars) {
        if (o === c || o.dir !== c.dir) continue;
        const gap = c.dir < 0 ? z - o.car.position.z : o.car.position.z - z;
        if (gap > 0 && gap < 14) target = Math.min(target, Math.max(0, (gap - 6) * 1.5));
      }
      c.v += (target - c.v) * Math.min(1, dt * (target < c.v ? 4 : 1.2));
      c.car.position.z += c.dir * c.v * dt;
      if (c.dir < 0 && c.car.position.z < ZMIN) c.car.position.z = ZMAX;
      if (c.dir > 0 && c.car.position.z > ZMAX) c.car.position.z = ZMIN;
      for (const w of c.car.userData.wheels) w.rotation.x += c.v * dt / 0.36;
      c.car.userData.tail.emissiveIntensity = target < c.v - 0.5 || c.v < 0.5 ? 2.5 : 0.5;
    }
  });
  world.cars = cars;

  // ---------- ребята на берегу ----------
  const kidColors = [
    { jacket: 0x3a86ff, hat: 0xffbe0b, scarf: 0xff006e },
    { jacket: 0x8338ec, hat: 0xff5400, scarf: 0x3a86ff },
    { jacket: 0x06d6a0, hat: 0xef476f, scarf: 0xffd166 },
    { jacket: 0xfb5607, hat: 0x118ab2, scarf: 0xffffff },
  ];
  // снеговик
  function makeSnowman() {
    const g = new THREE.Group();
    [[0.9, 0.8], [0.65, 2.0], [0.45, 2.9]].forEach(([r, y]) => {
      const b = new THREE.Mesh(new THREE.IcosahedronGeometry(r, 1), snowMat); b.position.y = y; b.castShadow = true; g.add(b);
    });
    const nose = new THREE.Mesh(new THREE.ConeGeometry(0.09, 0.45, 6), M(0xff7b00));
    nose.rotation.x = Math.PI / 2; nose.position.set(0, 2.9, 0.62); g.add(nose);
    const bucket = new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.36, 0.45, 8), M(0xd62828));
    bucket.position.y = 3.4; g.add(bucket);
    for (const s of [-1, 1]) {
      const e = new THREE.Mesh(new THREE.SphereGeometry(0.06, 6, 6), M(0x111111)); e.position.set(s * 0.15, 3.0, 0.4); g.add(e);
      const arm = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 1.1, 4), M(0x5b3a24));
      arm.position.set(s * 0.9, 2.2, 0); arm.rotation.z = s * 1.0; g.add(arm);
    }
    return g;
  }
  const sm = makeSnowman(); sm.position.set(-36, groundY(-36, 10) - 0.1, 10); sm.rotation.y = Math.PI / 2; scene.add(sm);
  const sm2 = makeSnowman(); sm2.position.set(-30, groundY(-30, -200) - 0.1, -200); sm2.rotation.y = 1.2; scene.add(sm2);
  const sm3 = makeSnowman(); sm3.position.set(31, groundY(31, -330) - 0.1, -330); sm3.rotation.y = -1.2; scene.add(sm3);
  [[-33, 7.5], [-38.5, 12], [-34, 13], [-38, 7.5]].forEach(([x, z], i) => {
    const kid = makeBoy(kidColors[i]);
    kid.root.position.set(x, groundY(x, z) - 0.15, z);
    kid.root.lookAt(-36, kid.root.position.y, 10);
    kid.root.rotation.y += i === 0 ? 0 : 0;
    kid.root.scale.setScalar(0.95);
    scene.add(kid.root);
    world.npcs.push(kid);
  });
  // мальчик, который переходит дорогу по зебре на зелёный для пешеходов
  const walker = makeBoy({ jacket: 0xffd166, hat: 0xe63946, scarf: 0x2a9d8f });
  walker.root.position.set(ROAD_X - 4.6, 0.35, -0.8);
  walker.root.rotation.y = Math.PI / 2;
  scene.add(walker.root);
  let walkSide = -1, walking = false;
  world.updaters.push((dt) => {
    // пешеходам зелёный, когда машинам красный
    if (!walking && tl.state === 'red' && tl.t > 0.8 && tl.t < 4) walking = true;
    if (walking) {
      const targetX = ROAD_X + (walkSide < 0 ? 4.6 : -4.6);
      const step = Math.sign(targetX - walker.root.position.x) * 2.4 * dt;
      walker.root.rotation.y = step > 0 ? Math.PI / 2 : -Math.PI / 2;
      walker.root.position.x += step;
      walker.setMode('run');
      walker.update(dt, 2.2);
      if (Math.abs(targetX - walker.root.position.x) < 0.1) { walking = false; walkSide *= -1; }
    } else {
      walker.root.rotation.y = walkSide < 0 ? Math.PI / 2 : -Math.PI / 2;
      walker.setMode('idle');
      walker.update(dt);
    }
  });

  world.groundY = groundY;
  world.update = (dt, t) => world.updaters.forEach(f => f(dt, t));
  return world;
}
