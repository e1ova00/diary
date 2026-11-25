// Простые звуки на WebAudio: без внешних файлов
let ctx = null, master = null, muted = false;
try { muted = localStorage.getItem('pdd-muted') === '1'; } catch { /* нет доступа */ }

export function initAudio() {
  if (ctx) { if (ctx.state === 'suspended') ctx.resume(); return; }
  const AC = window.AudioContext || window.webkitAudioContext;
  if (!AC) return;
  ctx = new AC();
  master = ctx.createGain();
  master.gain.value = muted ? 0 : 0.5;
  master.connect(ctx.destination);
}

export function isMuted() { return muted; }
export function toggleMute() {
  muted = !muted;
  try { localStorage.setItem('pdd-muted', muted ? '1' : '0'); } catch { /* нет доступа */ }
  if (master) master.gain.value = muted ? 0 : 0.5;
  return muted;
}

function tone(freq, start, dur, { type = 'square', vol = 0.15, slide = 0 } = {}) {
  if (!ctx) return;
  const o = ctx.createOscillator();
  const g = ctx.createGain();
  o.type = type;
  o.frequency.setValueAtTime(freq, start);
  if (slide) o.frequency.exponentialRampToValueAtTime(freq * slide, start + dur);
  g.gain.setValueAtTime(0.0001, start);
  g.gain.exponentialRampToValueAtTime(vol, start + 0.01);
  g.gain.exponentialRampToValueAtTime(0.0001, start + dur);
  o.connect(g).connect(master);
  o.start(start);
  o.stop(start + dur + 0.05);
}

export function sfx(name) {
  if (!ctx) return;
  const t = ctx.currentTime;
  switch (name) {
    case 'jump': tone(330, t, 0.15, { type: 'triangle', vol: 0.12, slide: 2 }); break;
    case 'land': tone(120, t, 0.08, { type: 'triangle', vol: 0.08 }); break;
    case 'splash': tone(500, t, 0.4, { type: 'sawtooth', vol: 0.06, slide: 0.2 }); break;
    case 'correct': tone(784, t, 0.12, { type: 'triangle', vol: 0.18 }); tone(1175, t + 0.1, 0.22, { type: 'triangle', vol: 0.18 }); break;
    case 'wrong': tone(196, t, 0.18, { type: 'sawtooth', vol: 0.1 }); tone(147, t + 0.16, 0.28, { type: 'sawtooth', vol: 0.1 }); break;
    case 'click': tone(1200, t, 0.04, { type: 'square', vol: 0.05 }); break;
    case 'portal': tone(523, t, 0.1, { type: 'triangle' }); tone(659, t + 0.08, 0.1, { type: 'triangle' }); tone(784, t + 0.16, 0.18, { type: 'triangle' }); break;
    case 'fanfare': [523, 659, 784, 1047].forEach((f, i) => tone(f, t + i * 0.12, 0.3, { type: 'square', vol: 0.1 })); break;
  }
}

// весёлая танцевальная мелодия (своя), 120 bpm
const N = { A3: 220, C4: 262, D4: 294, E4: 330, F4: 349, G4: 392, A4: 440, B4: 494, C5: 523, D5: 587, E5: 659, G5: 784, A2: 110, F2: 87, G2: 98, C3: 131, E3: 165 };
const melody = ['E5', 'E5', 'D5', 'C5', 'D5', 'E5', 'G5', 'E5', 'A4', 'C5', 'E5', 'D5', 'C5', 'B4', 'A4', null,
  'E5', 'G5', 'E5', 'D5', 'C5', 'D5', 'E5', 'C5', 'D5', 'B4', 'G4', 'B4', 'C5', null, 'A4', null];
const bass = ['A2', 'A2', 'F2', 'F2', 'C3', 'C3', 'G2', 'G2'];
let musicTimer = null;

export function playDanceMusic(seconds) {
  if (!ctx || muted) return;
  stopDanceMusic();
  const step = 0.25;
  const steps = Math.ceil(seconds / step);
  const t0 = ctx.currentTime + 0.05;
  for (let i = 0; i < steps; i++) {
    const t = t0 + i * step;
    const m = melody[i % melody.length];
    if (m) tone(N[m], t, step * 0.9, { type: 'square', vol: 0.07 });
    if (i % 2 === 0) tone(N[bass[(i / 4 | 0) % bass.length]], t, step * 1.6, { type: 'triangle', vol: 0.16 });
    if (i % 2 === 1) tone(3000, t, 0.03, { type: 'square', vol: 0.02 }); // хай-хэт
    if (i % 4 === 0) tone(90, t, 0.12, { type: 'sine', vol: 0.3, slide: 0.5 }); // бочка
  }
  musicTimer = setTimeout(() => { musicTimer = null; }, seconds * 1000);
}

export function stopDanceMusic() {
  if (musicTimer) clearTimeout(musicTimer);
  musicTimer = null;
  if (master && ctx) {
    // мгновенно глушим запланированные ноты, пересоздав мастер
    master.disconnect();
    master = ctx.createGain();
    master.gain.value = muted ? 0 : 0.5;
    master.connect(ctx.destination);
  }
}
