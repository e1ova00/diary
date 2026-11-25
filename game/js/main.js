import * as THREE from 'three';
import { makeBoy, DANCES } from './boy.js';
import { createWorld, drawBoard, THEME_EMOJI } from './world.js';
import * as Quiz from './quiz.js';
import { initAudio, sfx, toggleMute, isMuted, playDanceMusic, stopDanceMusic } from './audio.js';

const { THEMES } = Quiz;

// ---------- рендер ----------
const canvas = document.getElementById('game');
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.0;
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(60, 1, 0.1, 2000);
function resize() {
  const w = window.innerWidth, h = window.innerHeight;
  renderer.setSize(w, h, false);
  camera.aspect = w / h;
  camera.fov = w < h ? 72 : 60;
  camera.updateProjectionMatrix();
}
window.addEventListener('resize', resize);
resize();

const world = createWorld(scene, THEMES);

// ---------- игрок и друзья ----------
const player = makeBoy({ jacket: 0xe63946, hat: 0x2a9d8f, scarf: 0xffd166 });
scene.add(player.root);
const friendLooks = [
  { jacket: 0x3a86ff, hat: 0xffbe0b, scarf: 0xff006e, pants: 0x283618 },
  { jacket: 0x06d6a0, hat: 0xef476f, scarf: 0x118ab2 },
  { jacket: 0x8338ec, hat: 0xff5400, scarf: 0xffffff, pants: 0x3d405b },
];
const friends = friendLooks.map(l => {
  const f = makeBoy(l);
  f.root.scale.setScalar(0.86);
  scene.add(f.root);
  return { boy: f, pos: new THREE.Vector3(), heading: 0 };
});

// тень-кружок под игроком, чтобы было легче целиться в прыжке
const blob = new THREE.Mesh(new THREE.CircleGeometry(0.45, 20), new THREE.MeshBasicMaterial({ color: 0x0b2540, transparent: true, opacity: 0.35, depthWrite: false }));
blob.rotation.x = -Math.PI / 2;
scene.add(blob);

const P = {
  pos: world.spawn.clone(), vel: new THREE.Vector3(), heading: Math.PI, onGround: true,
  ground: null, lastSafe: null, coyote: 0, jumpBuf: 0, airTime: 0,
};
P.lastSafe = world.platforms[0];
const history = [];
function resetHistory() {
  history.length = 0;
  for (let i = 40; i > 0; i--) history.push(new THREE.Vector3(P.pos.x, P.pos.y, P.pos.z + i * 0.15));
  friends.forEach((f, i) => {
    f.pos.copy(history[Math.max(0, history.length - 1 - (i + 1) * 9)]);
    f.pos.x += [1.6, -1.6, 2.8][i];
  });
}
resetHistory();

// ---------- управление ----------
const keys = {};
let camYaw = 0, camPitch = 0.5, camDist = 10;
window.addEventListener('keydown', (e) => {
  if (Quiz.isOpen() || introOpen) return;
  keys[e.code] = true;
  if (e.code === 'Space') { P.jumpBuf = 0.15; e.preventDefault(); }
  if (e.code === 'KeyE' || e.code === 'Enter') interact();
  if (e.code === 'KeyM') openMap();
  if (dance && dance.t > 0.6 && !['KeyW', 'KeyA', 'KeyS', 'KeyD'].includes(e.code)) endDance();
});
window.addEventListener('keyup', (e) => { keys[e.code] = false; });
window.addEventListener('blur', () => { for (const k in keys) keys[k] = false; });

// поворот камеры мышью/пальцем
let drag = null;
canvas.addEventListener('pointerdown', (e) => {
  if (e.pointerType === 'touch' && e.clientX < window.innerWidth * 0.4) return; // левая часть — джойстик
  drag = { id: e.pointerId, x: e.clientX, y: e.clientY };
  canvas.setPointerCapture(e.pointerId);
});
canvas.addEventListener('pointermove', (e) => {
  if (!drag || drag.id !== e.pointerId) return;
  camYaw -= (e.clientX - drag.x) * 0.006;
  camPitch = THREE.MathUtils.clamp(camPitch + (e.clientY - drag.y) * 0.004, 0.08, 1.2);
  drag.x = e.clientX; drag.y = e.clientY;
});
canvas.addEventListener('pointerup', () => { drag = null; });
canvas.addEventListener('pointercancel', () => { drag = null; });
canvas.addEventListener('wheel', (e) => { camDist = THREE.MathUtils.clamp(camDist + e.deltaY * 0.01, 5, 18); }, { passive: true });

// мобильный джойстик
const joy = { x: 0, y: 0, id: null, el: document.getElementById('joy'), knob: document.getElementById('knob') };
const isTouch = matchMedia('(pointer: coarse)').matches || 'ontouchstart' in window;
document.body.classList.toggle('touch', isTouch);
joy.el.addEventListener('pointerdown', (e) => { joy.id = e.pointerId; joy.el.setPointerCapture(e.pointerId); moveJoy(e); });
joy.el.addEventListener('pointermove', (e) => { if (e.pointerId === joy.id) moveJoy(e); });
const endJoy = () => { joy.id = null; joy.x = joy.y = 0; joy.knob.style.transform = ''; };
joy.el.addEventListener('pointerup', endJoy);
joy.el.addEventListener('pointercancel', endJoy);
function moveJoy(e) {
  const r = joy.el.getBoundingClientRect();
  let dx = (e.clientX - r.left - r.width / 2) / (r.width / 2);
  let dy = (e.clientY - r.top - r.height / 2) / (r.height / 2);
  const l = Math.hypot(dx, dy);
  if (l > 1) { dx /= l; dy /= l; }
  joy.x = dx; joy.y = dy;
  joy.knob.style.transform = `translate(${dx * 38}px, ${dy * 38}px)`;
}
document.getElementById('btnJump').addEventListener('pointerdown', (e) => { e.preventDefault(); P.jumpBuf = 0.15; if (dance && dance.t > 0.6) endDance(); });

// ---------- HUD ----------
const $ = (id) => document.getElementById(id);
const hud = { score: $('hudScore'), sets: $('hudSets'), streak: $('hudStreak'), errors: $('errCount'), prompt: $('prompt'), toast: $('toast') };
function updateHud() {
  const p = Quiz.progress;
  hud.score.textContent = p.score;
  hud.sets.textContent = `${Quiz.totalPassed()}/${Quiz.TOTAL_SETS}`;
  hud.streak.textContent = p.streak;
  hud.errors.textContent = p.errors.length;
  hud.errors.hidden = !p.errors.length;
}
let toastTimer;
function toast(text, ms = 2200) {
  hud.toast.textContent = text;
  hud.toast.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => hud.toast.classList.remove('show'), ms);
}
function refreshBoards() {
  world.portals.forEach(p => {
    if (p.theme == null) return;
    const st = Quiz.themeStats(p.theme);
    drawBoard(p.canvas, { num: p.theme + 1, emoji: THEME_EMOJI[THEMES[p.theme].id] || '📘', title: THEMES[p.theme].title, done: st.done, total: st.total, complete: st.complete });
    p.tex.needsUpdate = true;
    world.setGateColor(p.gate, st.complete ? 0xffc83d : st.done ? 0x4cc9f0 : 0x9db4ff);
  });
}
$('btnMap').onclick = () => { initAudio(); openMap(); };
$('btnErrors').onclick = () => { initAudio(); Quiz.openErrors(); };
$('btnExam').onclick = () => { initAudio(); Quiz.openExam(); };
const btnSound = $('btnSound');
btnSound.textContent = isMuted() ? '🔇' : '🔊';
btnSound.onclick = () => { initAudio(); btnSound.textContent = toggleMute() ? '🔇' : '🔊'; };
$('btnAction').onclick = () => interact();
hud.prompt.onclick = () => interact();
function openMap() { Quiz.openMap(); }

let pendingDance = null;
Quiz.setHooks({
  onProgress: () => { updateHud(); refreshBoards(); },
  onAnswer: () => updateHud(),
  onTeleport: (ti) => teleportTo(ti),
  onPendingDance: (r) => { pendingDance = r; },
  onClose: () => {
    for (const k in keys) keys[k] = false;
    if (pendingDance) { const r = pendingDance; pendingDance = null; startDance(r); }
  },
});

function teleportTo(ti) {
  const p = world.portals.find(x => x.theme === ti);
  if (!p) return;
  P.pos.set(p.x, p.platform.top, p.z + 3.2);
  P.vel.set(0, 0, 0);
  P.ground = p.platform; P.lastSafe = p.platform; P.onGround = true;
  P.heading = Math.PI;
  camYaw = 0;
  resetHistory();
  sfx('portal');
}

// ---------- взаимодействие с порталами ----------
let nearPortal = null;
function findPortal() {
  let best = null, bd = 2.9;
  for (const p of world.portals) {
    if (P.ground !== p.platform) continue;
    const d = Math.hypot(P.pos.x - p.x, P.pos.z - p.z);
    if (d < bd) { bd = d; best = p; }
  }
  return best;
}
function interact() {
  initAudio();
  if (Quiz.isOpen() || dance) return;
  if (!nearPortal) return;
  sfx('portal');
  if (nearPortal.special === 'errors') Quiz.openErrors();
  else if (nearPortal.special === 'exam') Quiz.openExam();
  else Quiz.openTheme(nearPortal.theme);
}

// ---------- танцы ----------
let dance = null;
function startDance(r) {
  const big = r.perfect || r.themeComplete || r.kind === 'exam';
  const dur = big ? 9 : 4.5;
  const order = [...DANCES.keys()].sort(() => Math.random() - 0.5);
  // герой поворачивается лицом к камере, чтобы танец было хорошо видно
  P.heading = camYawCur;
  P.vel.set(0, 0, 0);
  dance = { t: 0, dur, big, order, yaw0: camYawCur };
  player.setMode('dance', order[0]);
  if (big) friends.forEach((f, i) => f.boy.setMode('dance', order[(i + 1) % order.length]));
  if (big) world.npcs.forEach((n, i) => n.setMode('dance', (i + 2) % DANCES.length));
  playDanceMusic(dur);
  confetti.burst(P.pos, big ? 500 : 220);
  $('danceBanner').innerHTML = `<b>${r.themeComplete ? '🏆 Тема пройдена!' : r.kind === 'exam' ? '🎓 Экзамен сдан!' : big ? '🌟 Без ошибок!' : '🎉 Мини-тема пройдена!'}</b><span>+${r.points} ❄ · танец «${DANCES[order[0]]}»</span><small>нажми любую клавишу или ⤒, чтобы продолжить</small>`;
  $('danceBanner').classList.add('show');
}
function endDance() {
  if (!dance) return;
  dance = null;
  stopDanceMusic();
  player.setMode('idle');
  friends.forEach(f => f.boy.setMode('idle'));
  world.npcs.forEach(n => n.setMode('idle'));
  $('danceBanner').classList.remove('show');
}

// ---------- снег и конфетти ----------
function dotTexture() {
  const c = document.createElement('canvas'); c.width = c.height = 64;
  const x = c.getContext('2d');
  const g = x.createRadialGradient(32, 32, 0, 32, 32, 32);
  g.addColorStop(0, 'rgba(255,255,255,1)'); g.addColorStop(0.5, 'rgba(255,255,255,0.8)'); g.addColorStop(1, 'rgba(255,255,255,0)');
  x.fillStyle = g; x.fillRect(0, 0, 64, 64);
  return new THREE.CanvasTexture(c);
}
const dotTex = dotTexture();
const confetti = makeConfetti();
const SNOW = 3500, SB = { x: 70, y: 36, z: 70 };
const snowGeo = new THREE.BufferGeometry();
const snowPos = new Float32Array(SNOW * 3), snowVel = new Float32Array(SNOW);
for (let i = 0; i < SNOW; i++) {
  snowPos[i * 3] = (Math.random() - 0.5) * SB.x;
  snowPos[i * 3 + 1] = Math.random() * SB.y;
  snowPos[i * 3 + 2] = (Math.random() - 0.5) * SB.z;
  snowVel[i] = 1 + Math.random() * 1.6;
}
snowGeo.setAttribute('position', new THREE.BufferAttribute(snowPos, 3));
const snow = new THREE.Points(snowGeo, new THREE.PointsMaterial({ size: 0.22, map: dotTex, transparent: true, depthWrite: false, opacity: 0.9 }));
snow.frustumCulled = false;
scene.add(snow);
function updateSnow(dt, t) {
  for (let i = 0; i < SNOW; i++) {
    snowPos[i * 3 + 1] -= snowVel[i] * dt;
    snowPos[i * 3] += Math.sin(t * 0.7 + i) * 0.3 * dt;
    if (snowPos[i * 3 + 1] < -2) snowPos[i * 3 + 1] += SB.y;
  }
  snow.position.set(Math.floor(P.pos.x / SB.x) * SB.x, 0, Math.floor(P.pos.z / SB.z) * SB.z);
  // прокручиваем снег вместе с игроком
  for (let i = 0; i < SNOW; i++) {
    const wx = snow.position.x + snowPos[i * 3], wz = snow.position.z + snowPos[i * 3 + 2];
    if (wx - P.pos.x > SB.x / 2) snowPos[i * 3] -= SB.x; else if (P.pos.x - wx > SB.x / 2) snowPos[i * 3] += SB.x;
    if (wz - P.pos.z > SB.z / 2) snowPos[i * 3 + 2] -= SB.z; else if (P.pos.z - wz > SB.z / 2) snowPos[i * 3 + 2] += SB.z;
  }
  snowGeo.attributes.position.needsUpdate = true;
}

function makeConfetti() {
  const N = 600;
  const geo = new THREE.BufferGeometry();
  const pos = new Float32Array(N * 3), col = new Float32Array(N * 3);
  const vel = new Float32Array(N * 3), life = new Float32Array(N);
  geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  geo.setAttribute('color', new THREE.BufferAttribute(col, 3));
  const pts = new THREE.Points(geo, new THREE.PointsMaterial({ size: 0.28, vertexColors: true, map: dotTex, transparent: true, depthWrite: false }));
  pts.frustumCulled = false;
  scene.add(pts);
  const palette = [0xff006e, 0xffbe0b, 0x3a86ff, 0x06d6a0, 0xffffff, 0xfb5607, 0x8338ec].map(c => new THREE.Color(c));
  let next = 0;
  for (let i = 0; i < N; i++) pos[i * 3 + 1] = -999;
  return {
    burst(at, n, { up = 9, spread = 5, color = null } = {}) {
      for (let k = 0; k < n; k++) {
        const i = next++ % N;
        pos[i * 3] = at.x; pos[i * 3 + 1] = at.y + 1.5; pos[i * 3 + 2] = at.z;
        const a = Math.random() * Math.PI * 2, s = Math.random() * spread;
        vel[i * 3] = Math.cos(a) * s; vel[i * 3 + 1] = up * (0.5 + Math.random()); vel[i * 3 + 2] = Math.sin(a) * s;
        const c = color || palette[(Math.random() * palette.length) | 0];
        col[i * 3] = c.r; col[i * 3 + 1] = c.g; col[i * 3 + 2] = c.b;
        life[i] = 2 + Math.random() * 1.5;
      }
    },
    update(dt) {
      for (let i = 0; i < N; i++) {
        if (life[i] <= 0) continue;
        life[i] -= dt;
        vel[i * 3 + 1] -= 9 * dt;
        vel[i * 3] *= 0.98; vel[i * 3 + 2] *= 0.98;
        if (vel[i * 3 + 1] < -2.5) vel[i * 3 + 1] = -2.5; // кружатся, как снежинки
        pos[i * 3] += vel[i * 3] * dt; pos[i * 3 + 1] += vel[i * 3 + 1] * dt; pos[i * 3 + 2] += vel[i * 3 + 2] * dt;
        if (life[i] <= 0) pos[i * 3 + 1] = -999;
      }
      geo.attributes.position.needsUpdate = true;
      geo.attributes.color.needsUpdate = true;
    },
  };
}

// ---------- физика ----------
const SPEED = 7, JUMP = 9.6, GRAV = 26, PR = 0.32;
const tmp = new THREE.Vector3();
function physics(dt) {
  const locked = Quiz.isOpen() || introOpen || !!dance;
  let ix = 0, iz = 0;
  if (!locked) {
    if (keys.KeyW || keys.ArrowUp) iz -= 1;
    if (keys.KeyS || keys.ArrowDown) iz += 1;
    if (keys.KeyA || keys.ArrowLeft) ix -= 1;
    if (keys.KeyD || keys.ArrowRight) ix += 1;
    ix += joy.x; iz += joy.y;
  }
  const il = Math.hypot(ix, iz);
  if (il > 1) { ix /= il; iz /= il; }
  // относительно камеры
  const fx = -Math.sin(camYaw), fz = -Math.cos(camYaw);
  const rx = Math.cos(camYaw), rz = -Math.sin(camYaw);
  const wx = (rx * ix - fx * iz) * SPEED, wz = (rz * ix - fz * iz) * SPEED;
  const accel = P.onGround ? 14 : 5;
  const k = 1 - Math.exp(-accel * dt);
  P.vel.x += (wx - P.vel.x) * k;
  P.vel.z += (wz - P.vel.z) * k;

  P.jumpBuf -= dt;
  P.coyote = P.onGround ? 0.12 : P.coyote - dt;
  if (!locked && P.jumpBuf > 0 && P.coyote > 0) {
    P.vel.y = JUMP; P.onGround = false; P.ground = null; P.coyote = 0; P.jumpBuf = 0;
    sfx('jump');
  }
  if (!P.onGround) P.vel.y -= GRAV * dt;

  const prevY = P.pos.y;
  P.pos.addScaledVector(P.vel, dt);

  // столкновения с островами и льдинами
  let landed = null;
  for (const p of world.platforms) {
    const dx = P.pos.x - p.x, dz = P.pos.z - p.z;
    const d = Math.hypot(dx, dz);
    if (d > p.r + 1) continue;
    if (d < p.r + 0.1 && prevY >= p.top - 0.25 && P.pos.y <= p.top + 0.02 && P.vel.y <= 0) {
      landed = p;
    } else if (P.pos.y < p.top - 0.3 && P.pos.y > p.top - 6 && d < p.r + PR) {
      // упёрлись в бок льдины
      const push = (p.r + PR - d) / (d || 1);
      P.pos.x += dx * push; P.pos.z += dz * push;
    }
  }
  if (P.onGround && P.ground) {
    const d = Math.hypot(P.pos.x - P.ground.x, P.pos.z - P.ground.z);
    if (d < P.ground.r + 0.1) landed = P.ground;
    else { P.onGround = false; P.ground = null; P.vel.y = Math.min(P.vel.y, 0); }
  }
  if (landed) {
    if (!P.onGround && P.airTime > 0.25) sfx('land');
    P.pos.y = landed.top; P.vel.y = 0; P.onGround = true; P.ground = landed; P.airTime = 0;
    if (landed.kind === 'island') P.lastSafe = landed;
  } else {
    P.onGround = false;
    P.airTime += dt;
  }
  // упал в воду
  if (P.pos.y < -0.6) {
    sfx('splash');
    confetti.burst(tmp.set(P.pos.x, -1.5, P.pos.z), 80, { up: 6, spread: 2.5, color: new THREE.Color(0xbfe9ff) });
    const s = P.lastSafe;
    P.pos.set(s.x, s.top, s.z + (s.theme != null ? 3.2 : 0));
    if (s === world.platforms[0]) P.pos.copy(world.spawn);
    P.vel.set(0, 0, 0); P.onGround = true; P.ground = s;
    resetHistory();
    toast(['Буль! Холодно 🥶 Попробуй ещё раз', 'Плюх! Лёд скользкий ❄', 'Ой! Прыгай чуть раньше 😉'][(Math.random() * 3) | 0]);
  }

  // анимация игрока
  const hs = Math.hypot(P.vel.x, P.vel.z);
  if (hs > 0.4) {
    const target = Math.atan2(P.vel.x, P.vel.z);
    let dh = target - P.heading;
    dh = Math.atan2(Math.sin(dh), Math.cos(dh));
    P.heading += dh * Math.min(1, dt * 12);
  }
  if (!dance) {
    if (!P.onGround) player.setMode(P.vel.y > 0 ? 'jump' : 'fall');
    else player.setMode(hs > 0.6 ? 'run' : 'idle');
  }
  player.root.position.copy(P.pos);
  player.root.rotation.y = P.heading;
  player.update(dt, hs);

  // тень
  let shadowY = -0.3;
  for (const p of world.platforms) {
    if (Math.hypot(P.pos.x - p.x, P.pos.z - p.z) < p.r && p.top <= P.pos.y + 0.05 && p.top > shadowY) shadowY = p.top;
  }
  blob.position.set(P.pos.x, shadowY + 0.04, P.pos.z);
  const h = Math.max(0, P.pos.y - shadowY);
  blob.scale.setScalar(Math.max(0.4, 1 - h * 0.15));
  blob.material.opacity = shadowY > -0.3 ? 0.35 : 0.15;
}

const FRIEND_SIDE = [1.3, -1.3, 2.3];
const friendTarget = new THREE.Vector3();
function updateFriends(dt) {
  const last = history[history.length - 1];
  if (P.pos.distanceTo(last) > 0.15) {
    history.push(P.pos.clone());
    if (history.length > 200) history.shift();
  }
  friends.forEach((f, i) => {
    const idx = Math.max(0, history.length - 1 - (i + 1) * 9);
    // бегут чуть в стороне от тропинки героя, чтобы не загораживать его камере
    const a = history[idx], bpt = history[Math.min(history.length - 1, idx + 3)];
    let px = -(bpt.z - a.z), pz = bpt.x - a.x;
    const pl = Math.hypot(px, pz) || 1;
    let side = FRIEND_SIDE[i], under = null;
    for (const pf of world.platforms) {
      const d = Math.hypot(a.x - pf.x, a.z - pf.z);
      if (d < pf.r + 0.3) { side *= Math.max(0, Math.min(1, (pf.r - 0.6 - d * 0.3) / 1.2)); under = pf; break; }
    }
    const target = friendTarget.set(a.x + px / pl * side, a.y, a.z + pz / pl * side);
    const before = f.pos.clone();
    f.pos.lerp(target, 1 - Math.exp(-dt * 10));
    const mv = before.distanceTo(f.pos) / Math.max(dt, 1e-4);
    const dx = f.pos.x - before.x, dz = f.pos.z - before.z;
    if (Math.hypot(dx, dz) > 0.003) {
      const tgt = Math.atan2(dx, dz);
      let dh = Math.atan2(Math.sin(tgt - f.heading), Math.cos(tgt - f.heading));
      f.heading += dh * Math.min(1, dt * 10);
    }
    const b = f.boy;
    if (dance && dance.big) {
      // смотрят в сторону камеры, пока танцуют
      f.heading += Math.atan2(Math.sin(P.heading - f.heading), Math.cos(P.heading - f.heading)) * Math.min(1, dt * 4);
    } else if (dance) {
      b.setMode('idle');
    } else {
      const airborne = !under || a.y > under.top + 0.2;
      b.setMode(airborne ? 'jump' : mv > 1 ? 'run' : 'idle');
    }
    b.root.position.copy(f.pos);
    b.root.rotation.y = f.heading;
    b.update(dt, mv);
  });
}

// ---------- камера ----------
const camTarget = new THREE.Vector3();
let camYawCur = camYaw;
function updateCamera(dt) {
  let yaw = camYaw, pitch = camPitch, dist = camDist;
  if (dance) {
    yaw = dance.yaw0 + Math.sin(dance.t * 0.6) * 0.5; // спереди, слегка качаясь
    pitch = 0.22;
    dist = dance.big ? 9 : 6.5;
  }
  let dy = Math.atan2(Math.sin(yaw - camYawCur), Math.cos(yaw - camYawCur));
  camYawCur += dy * Math.min(1, dt * (dance ? 2.5 : 10));
  camTarget.lerp(tmp.set(P.pos.x, P.pos.y + 1.6, P.pos.z), 1 - Math.exp(-dt * 8));
  const cp = Math.cos(pitch);
  camera.position.set(
    camTarget.x + Math.sin(camYawCur) * cp * dist,
    camTarget.y + Math.sin(pitch) * dist,
    camTarget.z + Math.cos(camYawCur) * cp * dist,
  );
  if (camera.position.y < -0.1) camera.position.y = -0.1;
  camera.lookAt(camTarget);
  world.sunLight.position.set(P.pos.x - 30, 50, P.pos.z - 20);
  world.sunLight.target.position.set(P.pos.x, 0, P.pos.z);
  world.sky.position.copy(camera.position);
}

// ---------- интро ----------
let introOpen = true;
const intro = $('intro');
$('btnPlay').onclick = () => {
  initAudio();
  intro.hidden = true;
  introOpen = false;
  sfx('portal');
  toast('Прыгай по льдинам к первому острову! ❄', 3000);
};

// ---------- цикл ----------
updateHud();
refreshBoards();
const clock = new THREE.Clock();
let elapsed = 0;
function frame() {
  const dt = Math.min(clock.getDelta(), 0.05);
  elapsed += dt;
  physics(dt);
  updateFriends(dt);
  world.update(dt, elapsed);
  world.npcs.forEach(n => n.update(dt));
  for (const p of world.portals) {
    p.gate.userData.disc.rotation.z -= dt * 1.5;
    p.gate.userData.ring.scale.setScalar(1 + Math.sin(elapsed * 3 + p.x) * 0.03);
  }
  if (dance) {
    dance.t += dt;
    const step = dance.dur / (dance.big ? 3 : 1);
    const idx = Math.floor(dance.t / step) % dance.order.length;
    if (player.dance !== dance.order[idx]) {
      player.setMode('dance', dance.order[idx]);
      if (dance.big) friends.forEach((f, i) => f.boy.setMode('dance', dance.order[(idx + i + 1) % dance.order.length]));
      $('danceBanner').querySelector('span').textContent = $('danceBanner').querySelector('span').textContent.replace(/«.*»/, `«${DANCES[dance.order[idx]]}»`);
      confetti.burst(P.pos, 120);
    }
    if (Math.random() < dt * 3) confetti.burst(P.pos, 20, { up: 7, spread: 3 });
    if (dance.t > dance.dur) endDance();
  }
  confetti.update(dt);
  updateSnow(dt, elapsed);
  updateCamera(dt);

  nearPortal = !Quiz.isOpen() && !dance && !introOpen ? findPortal() : null;
  if (nearPortal) {
    const label = nearPortal.special ? `${nearPortal.emoji} ${nearPortal.label}` : `${THEME_EMOJI[THEMES[nearPortal.theme].id] || ''} ${THEMES[nearPortal.theme].title}`;
    hud.prompt.innerHTML = `<span>${label}</span><b>${isTouch ? 'Нажми ✋' : 'Нажми E'} — начать</b>`;
    hud.prompt.classList.add('show');
    $('btnAction').classList.add('show');
  } else {
    hud.prompt.classList.remove('show');
    $('btnAction').classList.remove('show');
  }
  renderer.render(scene, camera);
  requestAnimationFrame(frame);
}
frame();
document.getElementById('loading')?.remove();
