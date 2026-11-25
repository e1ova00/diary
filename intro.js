/* Интро-мультик: 3D девочка и мальчик танцуют перед тестом.
   Музыка: если есть music/dynasty.mp3 — играет он, ускоренный и писклявый («белка»).
   Если файла нет — играет собственный синтезированный писклявый бит. */

(() => {
  const TRACK_URL = "music/dynasty.mp3";
  const TRACK_BPM = 76;       // «Династия» ≈ 152 BPM, танцуем в половинном темпе
  const TRACK_START = 1.545;  // в music/dynasty.mp3 вырезан кусок с 60 с; дроп на 1.545 с
  const SQUEAK_RATE = 1.4;    // насколько ускорить и поднять голос (1 — без эффекта)
  const DANCE_SECONDS = 26;   // длина танца
  const SYNTH_BPM = 124;

  const intro = document.getElementById("intro");
  if (!intro) return;
  const reveal = () => {
    intro.classList.add("gone");
    document.body.classList.remove("intro-on");
    setTimeout(() => intro.remove(), 900);
    running = false;
  };
  if (!window.THREE) { intro.remove(); return; }
  document.body.classList.add("intro-on");

  // ---------- сцена ----------
  const T = THREE;
  const stage = document.getElementById("intro-stage");
  const renderer = new T.WebGLRenderer({ antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(devicePixelRatio || 1, 2));
  stage.append(renderer.domElement);
  const scene = new T.Scene();
  scene.fog = new T.Fog(0xfff3fa, 12, 26);
  const camera = new T.PerspectiveCamera(38, 1, 0.1, 100);

  function resize() {
    const w = innerWidth, h = innerHeight;
    renderer.setSize(w, h);
    camera.aspect = w / h;
    camera.fov = w < h ? 46 : 38; // на телефоне отъезжаем, чтобы оба влезли
    camera.updateProjectionMatrix();
  }
  addEventListener("resize", resize); resize();

  scene.add(new T.HemisphereLight(0xffffff, 0xffd6ec, 0.42));
  const sun = new T.DirectionalLight(0xffffff, 0.5); sun.position.set(3, 6, 5); scene.add(sun);
  const pinkL = new T.PointLight(0xff3d9a, 0.45, 10); scene.add(pinkL);
  const blueL = new T.PointLight(0x2f6bff, 0.45, 10); scene.add(blueL);

  const toon = (c, extra = {}) => new T.MeshToonMaterial({ color: c, ...extra });
  const add = (parent, geo, mat, x = 0, y = 0, z = 0) => { const m = new T.Mesh(geo, mat); m.position.set(x, y, z); parent.add(m); return m; };
  const pivot = (parent, x = 0, y = 0, z = 0) => { const g = new T.Group(); g.position.set(x, y, z); parent.add(g); return g; };

  // ---------- пол-диско ----------
  const N = 10, tile = 1.1;
  const floor = new T.InstancedMesh(new T.BoxGeometry(tile * 0.96, 0.08, tile * 0.96), new T.MeshBasicMaterial(), N * N);
  const dummy = new T.Object3D();
  const palette = [new T.Color(0xff3d9a), new T.Color(0x2f6bff), new T.Color(0xffffff), new T.Color(0xffd1e8), new T.Color(0xd5e2ff), new T.Color(0xb14dff)];
  for (let i = 0; i < N * N; i++) {
    dummy.position.set((i % N - N / 2 + 0.5) * tile, -0.04, (Math.floor(i / N) - N / 2 + 0.5) * tile - 1.5);
    dummy.updateMatrix(); floor.setMatrixAt(i, dummy.matrix); floor.setColorAt(i, palette[2]);
  }
  scene.add(floor);
  function flashFloor(beat) {
    for (let i = 0; i < N * N; i++) {
      const x = i % N, z = Math.floor(i / N);
      const k = (x + z + beat) % 4 === 0 ? (beat % 2 ? 0 : 1) : (Math.random() < 0.18 ? 5 : (x + z) % 2 ? 3 : 4);
      floor.setColorAt(i, palette[k]);
    }
    floor.instanceColor.needsUpdate = true;
  }

  // ---------- фон ----------
  const back = new T.Group(); back.position.set(0, 3, -7); scene.add(back);
  const ring1 = add(back, new T.TorusGeometry(2.6, 0.12, 16, 80), new T.MeshBasicMaterial({ color: 0xff3d9a }));
  const ring2 = add(back, new T.TorusGeometry(3.2, 0.08, 16, 80), new T.MeshBasicMaterial({ color: 0x2f6bff }));
  const ball = add(scene, new T.IcosahedronGeometry(0.55, 1), new T.MeshPhongMaterial({ color: 0xdfe6f5, specular: 0xffffff, shininess: 120, flatShading: true }), 0, 4.6, -2);
  add(scene, new T.CylinderGeometry(0.01, 0.01, 2, 4), new T.MeshBasicMaterial({ color: 0xcccccc }), 0, 6.1, -2);

  // небоскрёбы-силуэты
  for (let i = 0; i < 16; i++) {
    const h = 2 + Math.random() * 5;
    const b = add(scene, new T.BoxGeometry(1 + Math.random(), h, 1), toon(i % 2 ? 0xffd9ec : 0xdfe8ff), (i - 7.5) * 1.5, h / 2 - 0.1, -11 - Math.random() * 2);
    b.userData.base = h;
  }

  // лучи прожекторов
  const beams = [0xff3d9a, 0x2f6bff, 0xff8fc7, 0x7fb0ff].map((c, i) => {
    const g = new T.Group(); g.position.set((i - 1.5) * 2.4, 6.5, -3); scene.add(g);
    const cone = add(g, new T.ConeGeometry(0.9, 7, 24, 1, true), new T.MeshBasicMaterial({ color: c, transparent: true, opacity: 0.16, side: T.DoubleSide, depthWrite: false }), 0, -3.5, 0);
    return { g, cone, phase: i * 1.3 };
  });

  // пузыри и сердечки
  const bubbles = [];
  const bubMat = new T.MeshBasicMaterial({ color: 0xbfd6ff, transparent: true, opacity: 0.35 });
  for (let i = 0; i < 36; i++) {
    const b = add(scene, new T.SphereGeometry(0.08 + Math.random() * 0.18, 16, 12), bubMat, (Math.random() - 0.5) * 12, Math.random() * 7, -1 - Math.random() * 6);
    b.userData.v = 0.4 + Math.random() * 0.8; bubbles.push(b);
  }
  const hs = new T.Shape();
  hs.moveTo(0, 0.25); hs.bezierCurveTo(0, 0.5, -0.5, 0.5, -0.5, 0.15); hs.bezierCurveTo(-0.5, -0.15, 0, -0.3, 0, -0.5);
  hs.bezierCurveTo(0, -0.3, 0.5, -0.15, 0.5, 0.15); hs.bezierCurveTo(0.5, 0.5, 0, 0.5, 0, 0.25);
  const heartGeo = new T.ExtrudeGeometry(hs, { depth: 0.12, bevelEnabled: true, bevelSize: 0.04, bevelThickness: 0.04, bevelSegments: 2 });
  const hearts = [];
  for (let i = 0; i < 10; i++) {
    const h = add(scene, heartGeo, toon(i % 2 ? 0xff3d9a : 0xff8fc7), (Math.random() - 0.5) * 11, Math.random() * 6, -3 - Math.random() * 4);
    h.scale.setScalar(0.4 + Math.random() * 0.5); h.userData.v = 0.3 + Math.random() * 0.5; hearts.push(h);
  }

  // ---------- персонажи ----------
  const SKIN = 0xf2b89a;
  function makeChar(girl) {
    const c = { girl };
    const root = c.root = new T.Group(); scene.add(root);
    const hips = c.hips = pivot(root, 0, 1.0, 0);
    const bottomCol = girl ? 0x5f86e6 : 0x2a2f45;
    add(hips, new T.CylinderGeometry(0.27, 0.25, 0.22, 20), toon(bottomCol), 0, 0, 0);

    const torso = c.torso = pivot(hips, 0, 0.08, 0);
    if (girl) {
      add(torso, new T.CylinderGeometry(0.24, 0.25, 0.18, 20), toon(SKIN), 0, 0.08, 0);       // животик (кроп-топ)
      add(torso, new T.CylinderGeometry(0.3, 0.25, 0.36, 20), toon(0xff3d9a), 0, 0.34, 0);   // кроп-топ
    } else {
      add(torso, new T.CylinderGeometry(0.34, 0.3, 0.56, 20), toon(0x2f6bff), 0, 0.26, 0);   // худи
      add(torso, new T.BoxGeometry(0.3, 0.14, 0.05), toon(0x2556d6), 0, 0.12, 0.3);          // карман
      add(torso, new T.TorusGeometry(0.2, 0.025, 8, 24), new T.MeshPhongMaterial({ color: 0xffc928, specular: 0xffffff, shininess: 90 }), 0, 0.46, 0.12).rotation.x = 1.25; // цепь
    }

    const head = c.head = pivot(torso, 0, 0.78, 0);
    add(head, new T.SphereGeometry(0.36, 28, 20), toon(SKIN));
    const eyeMat = toon(0x1b1430);
    c.eyes = [add(head, new T.SphereGeometry(0.045, 12, 8), eyeMat, -0.12, 0.03, 0.32), add(head, new T.SphereGeometry(0.045, 12, 8), eyeMat, 0.12, 0.03, 0.32)];
    const blush = toon(0xff9ec8);
    add(head, new T.SphereGeometry(0.05, 10, 8), blush, -0.21, -0.07, 0.27).scale.set(1.3, 0.6, 0.5);
    add(head, new T.SphereGeometry(0.05, 10, 8), blush, 0.21, -0.07, 0.27).scale.set(1.3, 0.6, 0.5);
    add(head, new T.TorusGeometry(0.06, 0.015, 6, 12, Math.PI), toon(0xc2185b), 0, -0.12, 0.33).rotation.z = Math.PI; // улыбка

    if (girl) {
      const hair = toon(0x6b3a2a);
      add(head, new T.SphereGeometry(0.38, 28, 20, 0, Math.PI * 2, 0, Math.PI * 0.55), hair, 0, 0.02, -0.02);
      c.buns = [add(head, new T.SphereGeometry(0.15, 16, 12), hair, -0.26, 0.3, -0.02), add(head, new T.SphereGeometry(0.15, 16, 12), hair, 0.26, 0.3, -0.02)];
      add(head, new T.TorusGeometry(0.07, 0.03, 8, 16), toon(0xff3d9a), -0.3, 0.38, 0.02);
      // очки-сердечки
      const glass = toon(0xff3d9a);
      [-0.13, 0.13].forEach((x) => { const g = add(head, heartGeo, glass, x, 0.05, 0.33); g.scale.setScalar(0.2); });
    } else {
      const cap = toon(0x1b1430);
      add(head, new T.SphereGeometry(0.38, 28, 16, 0, Math.PI * 2, 0, Math.PI * 0.5), cap, 0, 0.04, 0);
      const brim = add(head, new T.CylinderGeometry(0.26, 0.26, 0.03, 24, 1, false, 0, Math.PI), cap, 0, 0.1, 0.2);
      brim.rotation.y = -Math.PI / 2; brim.scale.z = 1.4;
      // очки
      const sh = toon(0x111111);
      add(head, new T.BoxGeometry(0.16, 0.08, 0.03), sh, -0.12, 0.04, 0.34); add(head, new T.BoxGeometry(0.16, 0.08, 0.03), sh, 0.12, 0.04, 0.34);
      add(head, new T.BoxGeometry(0.1, 0.02, 0.02), sh, 0, 0.06, 0.35);
    }

    const sleeve = toon(girl ? SKIN : 0x2f6bff);
    c.arms = [-1, 1].map((side) => {
      const sh = pivot(torso, side * 0.37, 0.48, 0);
      add(sh, new T.SphereGeometry(0.1, 12, 10), toon(girl ? 0xff3d9a : 0x2f6bff));
      add(sh, new T.CylinderGeometry(0.075, 0.07, 0.32, 12), sleeve, 0, -0.16, 0);
      const el = pivot(sh, 0, -0.32, 0);
      add(el, new T.CylinderGeometry(0.07, 0.06, 0.28, 12), toon(girl ? SKIN : 0x2f6bff), 0, -0.14, 0);
      add(el, new T.SphereGeometry(0.075, 12, 10), toon(SKIN), 0, -0.3, 0);
      if (girl) add(el, new T.TorusGeometry(0.07, 0.015, 6, 16), new T.MeshPhongMaterial({ color: 0xffc928, specular: 0xffffff, shininess: 90 }), 0, -0.22, 0).rotation.x = Math.PI / 2;
      return { sh, el, side };
    });

    const pant = toon(bottomCol);
    c.legs = [-1, 1].map((side) => {
      const hp = pivot(hips, side * 0.13, -0.05, 0);
      add(hp, new T.CylinderGeometry(0.11, 0.1, 0.45, 12), pant, 0, -0.22, 0);
      const kn = pivot(hp, 0, -0.45, 0);
      // клёши у девочки, широкие штаны у мальчика
      add(kn, girl ? new T.CylinderGeometry(0.1, 0.21, 0.44, 16) : new T.CylinderGeometry(0.12, 0.14, 0.44, 12), pant, 0, -0.22, 0);
      const shoe = add(kn, new T.BoxGeometry(0.18, girl ? 0.12 : 0.1, 0.3), toon(girl ? 0xffffff : 0xf4f4f4), 0, -0.47, 0.06);
      if (girl) add(kn, new T.BoxGeometry(0.19, 0.04, 0.31), toon(0xff3d9a), 0, -0.52, 0.06);
      else add(shoe, new T.BoxGeometry(0.19, 0.03, 0.31), toon(0x2f6bff), 0, -0.05, 0);
      return { hp, kn, side };
    });
    return c;
  }
  const girl = makeChar(true);
  const boy = makeChar(false);
  girl.root.position.x = -1; boy.root.position.x = 1;

  // ---------- танец ----------
  const lerp = (a, b, k) => a + (b - a) * k;
  function pose(c, b, move, dir, energy) {
    const bounce = Math.abs(Math.sin(Math.PI * b));
    const s = Math.sin(Math.PI * b), s2 = Math.sin(Math.PI * b / 2);
    const P = { hy: 1.0 - 0.07 * bounce * energy, hx: 0, ry: 0, tz: 0, tx: 0, hz: 0, hry: 0,
      arms: [{ x: 0, z: -0.15, e: -0.2 }, { x: 0, z: 0.15, e: -0.2 }], legs: [{ x: 0, z: 0, k: 0.15 * bounce }, { x: 0, z: 0, k: 0.15 * bounce }] };
    const beatN = Math.floor(b);

    if (move === "idle") {
      P.hy = 1.0 - 0.015 * Math.sin(b * 1.2);
      P.arms[1].z = 0.15; P.arms[dir > 0 ? 1 : 0].z = dir * (2.4 + 0.25 * Math.sin(b * 6)); // машет рукой
      P.hz = 0.08 * Math.sin(b * 1.5);
    } else if (move === "pump") {
      const up = beatN % 2 ? 0 : 1;
      P.arms[up] = { x: -2.6 - 0.4 * bounce, z: up ? 0.2 : -0.2, e: -0.4 };
      P.arms[1 - up] = { x: -0.4, z: up ? -0.5 : 0.5, e: -1.6 };
      P.legs.forEach((l) => (l.k = 0.4 * bounce));
      P.hz = 0.1 * s;
    } else if (move === "sway") {
      P.hx = 0.22 * s2; P.tz = -0.18 * s2; P.hz = 0.15 * s2;
      P.arms[0] = { x: -0.2, z: -2.7 + 0.35 * s, e: -0.3 };
      P.arms[1] = { x: -0.2, z: 2.7 + 0.35 * s, e: -0.3 };
      P.legs[0].z = -0.12 * Math.max(0, s2); P.legs[1].z = 0.12 * Math.max(0, -s2);
    } else if (move === "spin") {
      const phase = (b % 4) / 4;
      P.ry = dir * Math.PI * 2 * Math.min(1, phase * 2.2);
      P.arms[0] = { x: 0, z: -1.4, e: -0.2 }; P.arms[1] = { x: 0, z: 1.4, e: -0.2 };
      P.hy = 1.0 - 0.1 * bounce + (phase > 0.2 && phase < 0.4 ? 0.12 : 0);
    } else if (move === "swing") {
      const sw = Math.sin(Math.PI * b);
      P.arms[0] = { x: -0.6 * sw, z: -0.4 + 0.35 * sw, e: -0.3 };
      P.arms[1] = { x: -0.6 * sw, z: 0.4 + 0.35 * sw, e: -0.3 };
      P.hx = -0.12 * sw; P.tz = 0.12 * sw; P.hry = 0.25 * sw;
      P.legs[0].k = 0.3 * bounce; P.legs[1].k = 0.3 * bounce;
    } else if (move === "clap") {
      const side = beatN % 2 ? 1 : -1, k = bounce;
      P.hx = 0.25 * side * (1 - Math.abs(Math.cos(Math.PI * b)) * 0.2);
      P.legs[side > 0 ? 1 : 0].z = side * 0.25 * k; P.legs[side > 0 ? 0 : 1].k = 0.35 * k;
      P.arms[0] = { x: -1.3, z: lerp(-0.2, 0.45, 1 - k), e: -0.9 };
      P.arms[1] = { x: -1.3, z: lerp(0.2, -0.45, 1 - k), e: -0.9 };
      P.ry = dir * -0.5; // поворот друг к другу
    } else if (move === "final") {
      P.arms[0] = { x: -0.3, z: -2.5, e: -0.2 }; P.arms[1] = { x: -0.3, z: 2.5, e: -0.2 };
      P.hy = 1.0 + 0.02 * Math.sin(b * 2); P.hz = dir * 0.12;
      P.legs[dir > 0 ? 1 : 0].z = dir * 0.25;
    }
    return P;
  }
  function apply(c, P, k) { // плавное смешивание к целевой позе
    const L = (o, key, v) => (o[key] = lerp(o[key], v, k));
    L(c.hips.position, "y", P.hy); L(c.hips.position, "x", P.hx); L(c.hips.rotation, "z", P.hz); L(c.hips.rotation, "y", P.hry);
    // после полного оборота не раскручиваемся обратно
    if (Math.abs(c.root.rotation.y - P.ry) > Math.PI) c.root.rotation.y -= Math.sign(c.root.rotation.y - P.ry) * Math.PI * 2;
    L(c.root.rotation, "y", P.ry); L(c.torso.rotation, "z", P.tz); L(c.torso.rotation, "x", P.tx);
    L(c.head.rotation, "z", -P.tz * 0.8 + 0.05 * Math.sin(perf / 300));
    c.arms.forEach((a, i) => { L(a.sh.rotation, "x", P.arms[i].x); L(a.sh.rotation, "z", P.arms[i].z); L(a.el.rotation, "x", P.arms[i].e); });
    c.legs.forEach((l, i) => { L(l.hp.rotation, "z", P.legs[i].z); L(l.hp.rotation, "x", -P.legs[i].k); L(l.kn.rotation, "x", P.legs[i].k * 2); });
    // вычитаем сгиб колен, чтобы ноги не проваливались в пол
    const bend = (P.legs[0].k + P.legs[1].k) / 2;
    c.hips.position.y -= bend * 0.06 * k;
  }

  const MOVES = ["pump", "sway", "swing", "spin", "clap", "pump", "sway", "clap", "swing", "spin"];
  const CAPTIONS = ["грязнулька 💅", "чистюлька 🧼", "ШБ?! 🧨", "серьёзка 📖", "клёши в пол 🌊", "я в душ 🚿", "ты спишь? 🌙", "жениться пока рано 💼", "братик 🫢", "фото или не было 😏"];

  // ---------- музыка ----------
  let audio = null, synth = null, actx = null, analyser = null, freq = null;
  let mode = "idle"; // idle | dance | final
  let danceStart = 0, lastBeat = -1;

  function beatNow() {
    if (audio) {
      // по времени трека, а если оно стоит (нет звукового устройства, буферизация) — по часам
      const media = audio.currentTime - TRACK_START;
      const wall = ((performance.now() - danceStart) / 1000) * SQUEAK_RATE;
      return (media > 0.05 && Math.abs(media - wall) < 3 ? media : wall) * TRACK_BPM / 60;
    }
    if (synth) return synth.beat();
    return 0;
  }
  function energy() {
    if (!analyser) return 1;
    analyser.getByteFrequencyData(freq);
    let s = 0; for (let i = 0; i < 8; i++) s += freq[i];
    return 0.6 + (s / (8 * 255)) * 0.9;
  }

  function startSynth() {
    const ctx = actx || (actx = new (window.AudioContext || window.webkitAudioContext)());
    const out = ctx.createGain(); out.gain.value = 0.55; out.connect(ctx.destination);
    const spb = 60 / SYNTH_BPM, step = spb / 4;
    const noise = ctx.createBuffer(1, ctx.sampleRate * 0.5, ctx.sampleRate);
    const nd = noise.getChannelData(0); for (let i = 0; i < nd.length; i++) nd[i] = Math.random() * 2 - 1;
    const env = (g, t, a, d, v) => { g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(v, t + a); g.gain.exponentialRampToValueAtTime(0.0001, t + a + d); };
    const kick = (t) => { const o = ctx.createOscillator(), g = ctx.createGain(); o.frequency.setValueAtTime(160, t); o.frequency.exponentialRampToValueAtTime(42, t + 0.14); env(g, t, 0.003, 0.22, 1); o.connect(g).connect(out); o.start(t); o.stop(t + 0.3); };
    const nz = (t, type, f, d, v) => { const s = ctx.createBufferSource(), fl = ctx.createBiquadFilter(), g = ctx.createGain(); s.buffer = noise; fl.type = type; fl.frequency.value = f; env(g, t, 0.002, d, v); s.connect(fl).connect(g).connect(out); s.start(t); s.stop(t + d + 0.05); };
    const tone = (t, f, d, type, v, cut) => { const o = ctx.createOscillator(), g = ctx.createGain(), fl = ctx.createBiquadFilter(); o.type = type; o.frequency.value = f; fl.type = "lowpass"; fl.frequency.value = cut; env(g, t, 0.005, d, v); o.connect(fl).connect(g).connect(out); o.start(t); o.stop(t + d + 0.05); return o; };
    const squeak = (t, f, d) => { // писклявая «беличья» мелодия с вибрато
      const o = tone(t, f, d, "square", 0.09, 6000);
      const lfo = ctx.createOscillator(), lg = ctx.createGain(); lfo.frequency.value = 9; lg.gain.value = f * 0.025; lfo.connect(lg).connect(o.frequency); lfo.start(t); lfo.stop(t + d + 0.05);
      o.frequency.setValueAtTime(f * 1.06, t); o.frequency.exponentialRampToValueAtTime(f, t + 0.04);
    };
    const hz = (semi) => 440 * Math.pow(2, semi / 12);
    const roots = [-36, -40, -33, -38]; // A1 F1 C2 G1 (полутоны от A4)
    const MEL = [
      [12, null, 15, null, 19, 17, 15, null, 12, null, 10, 12, null, null, 7, null],
      [8, null, 12, null, 15, 12, 8, null, 7, 8, null, 12, null, 15, null, null],
      [7, null, 10, null, 15, 14, 10, null, 19, null, 17, 15, null, 10, null, null],
      [10, null, 14, null, 17, 14, 10, 12, 14, null, 19, null, 17, null, 14, null],
    ];
    let i = 0; const t0 = ctx.currentTime + 0.12; let next = t0; let stopped = false;
    const timer = setInterval(() => {
      while (!stopped && next < ctx.currentTime + 0.12) {
        const s16 = i % 16, bar = Math.floor(i / 16) % 4;
        if (s16 % 4 === 0) kick(next);
        if (s16 % 8 === 4) nz(next, "bandpass", 1600, 0.16, 0.5);
        if (s16 % 2 === 1) nz(next, "highpass", 8000, 0.04, 0.18);
        if (s16 % 4 === 2) tone(next, hz(roots[bar]), step * 1.6, "sawtooth", 0.28, 500);
        const m = MEL[bar][s16];
        if (m != null && i >= 32) squeak(next, hz(m), step * 1.5); // мелодия вступает через 2 такта
        i++; next += step;
      }
    }, 25);
    return {
      beat: () => Math.max(0, (ctx.currentTime - t0) / spb),
      stop: () => { stopped = true; clearInterval(timer); out.gain.setTargetAtTime(0, ctx.currentTime, 0.3); },
    };
  }

  function startTrack() {
    return new Promise((res) => {
      let done = false;
      const resolve = (v) => { if (done) { if (v) v.pause(); return; } done = true; res(v); };
      const a = new Audio();
      a.preload = "auto";
      a.preservesPitch = false; a.mozPreservesPitch = false; a.webkitPreservesPitch = false; // эффект «белки»
      a.oncanplay = () => {
        a.oncanplay = null;
        if (done) return;
        a.currentTime = TRACK_START; a.playbackRate = SQUEAK_RATE;
        a.play().then(() => {
          if (a.currentTime < TRACK_START - 0.3) a.currentTime = TRACK_START; // повторная перемотка к дропу
          resolve(a);
        }).catch(() => resolve(null));
      };
      a.onerror = () => resolve(null);
      a.src = TRACK_URL;
      setTimeout(() => resolve(null), 6000);
    });
  }

  async function play() {
    intro.classList.add("playing");
    actx = new (window.AudioContext || window.webkitAudioContext)();
    audio = await startTrack();
    if (audio && location.protocol.startsWith("http")) {
      try { // анализатор громкости, чтобы прыжки совпадали с басом
        const src = actx.createMediaElementSource(audio);
        analyser = actx.createAnalyser(); analyser.fftSize = 256; freq = new Uint8Array(analyser.frequencyBinCount);
        src.connect(analyser); analyser.connect(actx.destination);
      } catch (_) { analyser = null; }
    }
    if (!audio) synth = startSynth();
    mode = "dance"; danceStart = performance.now();
  }

  function finishDance() {
    if (mode === "final") return;
    mode = "final";
    if (synth) synth.stop();
    if (audio) { const a = audio; const fade = setInterval(() => { a.volume = Math.max(0, a.volume - 0.08); if (a.volume <= 0) { a.pause(); clearInterval(fade); } }, 80); }
    document.getElementById("intro-end").hidden = false;
    popCaption("танец окончен. теперь — тест 🧪", true);
  }
  function stopAll() { if (synth) synth.stop(); if (audio) audio.pause(); }

  // подписи-мемы поверх сцены
  const capBox = document.getElementById("intro-captions");
  function popCaption(text, center) {
    const n = document.createElement("span");
    n.className = "cap" + (center ? " center" : "");
    n.textContent = text;
    if (!center) {
      n.style.left = 8 + Math.random() * 60 + "%";
      n.style.top = 12 + Math.random() * 45 + "%";
      n.style.setProperty("--r", (Math.random() * 16 - 8).toFixed(1) + "deg");
      n.classList.add(Math.random() < 0.5 ? "pink" : "blue");
    }
    capBox.append(n);
    setTimeout(() => n.remove(), center ? 6000 : 2200);
  }

  // ---------- цикл ----------
  let running = true, perf = 0, prev = performance.now();
  function frame(now) {
    if (!running) return;
    const dt = Math.min(0.05, (now - prev) / 1000); prev = now; perf = now;
    const b = mode === "idle" ? now / 1000 : beatNow();
    const e = mode === "dance" ? energy() : 1;
    const beatN = Math.floor(b);

    if (mode === "dance") {
      if (beatN !== lastBeat) {
        lastBeat = beatN;
        flashFloor(beatN);
        if (beatN % 4 === 0 && beatN > 0) popCaption(CAPTIONS[(beatN / 4) % CAPTIONS.length]);
      }
      if ((now - danceStart) / 1000 > DANCE_SECONDS || (audio && audio.ended)) finishDance();
    }

    const move = mode === "idle" ? "idle" : mode === "final" ? "final" : MOVES[Math.floor(b / 8) % MOVES.length];
    const k = mode === "dance" ? 0.35 : 0.12;
    apply(girl, pose(girl, b, move, 1, e), k);
    apply(boy, pose(boy, b, move, -1, e), k);
    girl.root.position.x = lerp(girl.root.position.x, move === "clap" ? -0.75 : -1, 0.08);
    boy.root.position.x = lerp(boy.root.position.x, move === "clap" ? 0.75 : 1, 0.08);

    // моргание
    const blink = (now % 3200) < 120 ? 0.1 : 1;
    [girl, boy].forEach((c) => c.eyes.forEach((ey) => (ey.scale.y = blink)));
    if (girl.buns) girl.buns.forEach((bn, i) => (bn.position.y = 0.3 + 0.02 * Math.sin(b * Math.PI * 2 + i)));

    // фон
    const pulse = mode === "dance" ? Math.pow(1 - (b % 1), 3) : 0;
    ring1.scale.setScalar(1 + 0.12 * pulse); ring2.scale.setScalar(1 + 0.08 * Math.pow(1 - ((b + 0.5) % 1), 3));
    ring1.rotation.z += dt * 0.3; ring2.rotation.y += dt * 0.5;
    ball.rotation.y += dt * 1.2;
    beams.forEach((bm) => { bm.g.rotation.z = 0.5 * Math.sin(now / 900 + bm.phase); bm.g.rotation.x = 0.25 * Math.cos(now / 1100 + bm.phase); bm.cone.material.opacity = mode === "dance" ? 0.12 + 0.12 * pulse : 0.08; });
    bubbles.forEach((bb) => { bb.position.y += bb.userData.v * dt; bb.position.x += Math.sin(now / 700 + bb.position.y) * 0.003; if (bb.position.y > 7) bb.position.y = -0.2; });
    hearts.forEach((h) => { h.position.y += h.userData.v * dt; h.rotation.y += dt; if (h.position.y > 7) h.position.y = -0.5; });
    scene.children.forEach((o) => { if (o.userData.base) o.scale.y = 1 + (mode === "dance" ? 0.06 * pulse : 0); });
    pinkL.position.set(3 * Math.sin(now / 800), 2.5, 2 + Math.cos(now / 800)); blueL.position.set(-3 * Math.sin(now / 900), 2.5, 2 - Math.cos(now / 900));

    // камера
    const orbit = mode === "idle" ? 0.25 * Math.sin(now / 3000) : 0.5 * Math.sin(b / 8);
    const portrait = innerWidth < innerHeight;
    const dist = (portrait ? 9 : 6.4) - 0.3 * pulse - (mode === "final" ? 0.8 : 0);
    camera.position.set(Math.sin(orbit) * dist, 1.8 + 0.2 * Math.sin(b / 4), Math.cos(orbit) * dist);
    camera.lookAt(0, portrait ? 1.35 : 1.15, 0);

    renderer.render(scene, camera);
    requestAnimationFrame(frame);
  }
  flashFloor(0);
  requestAnimationFrame(frame);

  document.getElementById("intro-play").addEventListener("click", play);
  document.getElementById("intro-skip").addEventListener("click", () => { stopAll(); reveal(); });
  document.getElementById("intro-go").addEventListener("click", () => { stopAll(); reveal(); });
})();
