/* Грязнулька или чистюлька — мем-тест.
   Каждый ответ даёт очки: d — грязнулька, c — чистюлька, s — ШБ. */

const G = (girl, boy) => ({ girl, boy }); // текст отличается для девочек и мальчиков
const pick = (v, gender) => (v && typeof v === "object" && "girl" in v ? v[gender] : v);

const QUESTIONS = [
  {
    tag: "разминка", emoji: "🔢",
    q: "Сколько у тебя было половых партнёров?",
    a: [
      { e: "🏦", t: "0. храню себя для ипотеки", c: 3 },
      { e: "💍", t: "1–2, всё по любви", c: 2 },
      { e: "🖐️", t: "хватит пальцев одной руки", d: 1, c: 1 },
      { e: "🧮", t: G("я сбилась со счёта", "я сбился со счёта"), d: 3, s: 2 },
      { e: "📇", t: "считаю только тех, кто запомнил моё имя", d: 3, s: 3 },
    ],
  },
  {
    tag: "переписка", emoji: "🚿",
    q: G("Он пишет тебе. Что ответишь?", "Она пишет тебе. Что ответишь?"),
    chat: G(["привет", "я в душ 🚿"], ["привееет", "я в душ 🚿🫧"]),
    a: G(
      [
        { e: "👍", t: "ок", c: 3 },
        { e: "🧴", t: "не забудь бальзам для волос", c: 2 },
        { e: "🫧", t: "а я только вышла 🫣", d: 2, s: 1 },
        { e: "📸", t: "фото или не было 😏", d: 3 },
        { e: "🚕", t: "уже вызвала такси", d: 3, s: 3 },
      ],
      [
        { e: "🎮", t: "ок, я пока в доту", c: 3 },
        { e: "🧼", t: "с мылом аккуратнее", c: 2 },
        { e: "🥺", t: "а можно с тобой?", d: 3 },
        { e: "📸", t: "фото или не было 😏", d: 3, s: 1 },
        { e: "🚪", t: "уже у двери", d: 2, s: 3 },
      ]
    ),
  },
  {
    tag: "образ", emoji: "👗",
    q: "Что ты наденешь на вечер?",
    a: G(
      [
        { e: "🧸", t: "оверсайз худи и пижамные штаны", c: 3 },
        { e: "🤍", t: "белая рубашка и юбка-плиссе", c: 2 },
        { e: "👢", t: "мини и сапоги до колена", d: 2, s: 1 },
        { e: "🕸️", t: "то, что почти ничего не прикрывает, но очень дорого", d: 3, s: 2 },
      ],
      [
        { e: "🧶", t: "свитер, который связала бабушка", c: 3 },
        { e: "👔", t: "отглаженная рубашка, я ж приличный", c: 2 },
        { e: "⛓️", t: "майка-алкоголичка и цепь", d: 2, s: 2 },
        { e: "🫦", t: "рубашка расстёгнута до пупка", d: 3, s: 1 },
      ]
    ),
  },
  {
    tag: "локация", emoji: "📍",
    q: "Куда пойдёшь в пятницу вечером?",
    a: [
      { e: "📚", t: "в библиотеку или котокафе", c: 3 },
      { e: "🍿", t: "в кино на мультик", c: 2 },
      { e: "🍸", t: "в бар «на один бокал»", d: 2 },
      { e: "📩", t: "на тусу к незнакомцу, адрес скинут в 3 ночи", d: 3, s: 3 },
    ],
  },
  {
    tag: "02:47", emoji: "🌙",
    q: "Тебе пишут «ты спишь?» в 02:47. Твоя реакция:",
    chat: G(["ты спишь?"], ["ты спишь?"]),
    a: [
      { e: "😴", t: "сплю. и ты спи", c: 3 },
      { e: "📅", t: "отвечаю через 3 дня", c: 2, s: 1 },
      { e: "👀", t: "уже нет 👀", d: 2 },
      { e: "🏃", t: "«скинь геолокацию»", d: 3, s: 2 },
    ],
  },
  {
    tag: "неочевидное", emoji: "🛏️",
    q: "Как часто ты меняешь постельное бельё?",
    a: [
      { e: "✨", t: "раз в неделю, у меня график", c: 3 },
      { e: "🗓️", t: "раз в месяц, нормально же", c: 1, d: 1 },
      { e: "🤨", t: "а его надо менять?", d: 3 },
      { e: "🗂️", t: "у меня три комплекта, и все не мои", d: 2, s: 3 },
    ],
  },
  {
    tag: "контакты", emoji: "📱",
    q: G("Сколько «братиков» у тебя в контактах?", "Сколько «сестрёнок» у тебя в контактах?"),
    a: [
      { e: "0️⃣", t: "ноль, только мама и кот", c: 3 },
      { e: "🤏", t: "1–2, правда братики", c: 1 },
      { e: "🖐️", t: "5+, и все «просто друзья»", d: 2, s: 2 },
      { e: "📁", t: "у меня для них отдельная папка", d: 3, s: 3 },
    ],
  },
  {
    tag: "гигиена", emoji: "🧼",
    q: "Сколько раз в день ты принимаешь душ?",
    a: [
      { e: "🫧", t: "дважды, плюс скраб и маска", c: 3 },
      { e: "🚿", t: "один раз, как все", c: 2 },
      { e: "🌱", t: "через день, я экоактивист", d: 2 },
      { e: "💨", t: "сухой шампунь — мой лучший друг", d: 3 },
    ],
  },
  {
    tag: "после тусы", emoji: "🌅",
    q: "Где ты просыпаешься после вечеринки?",
    a: [
      { e: "🏠", t: G("дома, я ушла в 22:00", "дома, я ушёл в 22:00"), c: 3 },
      { e: "🌯", t: "дома, но с шаурмой в руке", c: 2, d: 1 },
      { e: "🗺️", t: "в другом районе, не помню как", d: 3, s: 2 },
      { e: "✈️", t: "в другом городе. с кольцом", d: 3, s: 3 },
    ],
  },
  {
    tag: "бывшие", emoji: "💔",
    q: "Что у тебя с бывшими?",
    a: [
      { e: "🚫", t: "заблокированы везде, даже в госуслугах", c: 3 },
      { e: "🤝", t: "мы друзья (правда)", c: 1, d: 1 },
      { e: "🌀", t: "у нас «всё сложно» уже 3 года", s: 3, d: 1 },
      { e: "🔁", t: G("какие бывшие? я ни с кем официально не расставалась", "какие бывшие? я ни с кем официально не расставался"), d: 2, s: 3 },
    ],
  },
  {
    tag: "сторис", emoji: "🤳",
    q: "Твоя последняя сторис:",
    a: [
      { e: "🐈", t: "кот спит на книжке", c: 3 },
      { e: "🥗", t: "полезный завтрак и «доброе утро»", c: 2 },
      { e: "🪞", t: "селфи в зеркале в лифте", d: 2, s: 1 },
      { e: "🎵", t: "грустная песня — пусть кое-кто увидит", s: 3 },
    ],
  },
  {
    tag: "финал", emoji: "🫶",
    q: "Твой любимый эмодзи:",
    a: [
      { e: "🙏", t: "🙏 — я хороший человек", c: 3 },
      { e: "🫶", t: "🫶 — люблю всех (платонически)", c: 2 },
      { e: "😈", t: "😈 — сами знаете", d: 2, s: 1 },
      { e: "🫦", t: "🫦 — без комментариев", d: 3, s: 2 },
    ],
  },
];

const RESULTS = [
  { max: 15, emoji: "🧼", title: "Стерильная чистюлька",
    desc: G("Ты пахнешь кондиционером для белья и хорошими решениями. Мамы подруг тебя обожают.", "Ты пахнешь хозяйственным мылом и стабильностью. Мамы девочек тебя обожают.") },
  { max: 35, emoji: "🫧", title: "Чистюлька с секретиком",
    desc: G("Снаружи — зефирка в пастельном, внутри — пара историй, которые ты не расскажешь даже лучшей подруге.", "Снаружи — хороший мальчик, внутри — пара историй, которые ты унесёшь с собой.") },
  { max: 60, emoji: "⚖️", title: "50 на 50: грязнулька в отрицании",
    desc: G("Днём ты чистюлька, после 23:00 — грязнулька. Ты и сама не знаешь, кто проснётся завтра.", "Днём ты чистюлька, после 23:00 — грязнулька. Ты и сам не знаешь, кто проснётся завтра.") },
  { max: 82, emoji: "😈", title: "Грязнулька, и ты это знаешь",
    desc: G("Ты не ищешь любовь — любовь ищет тебя, а потом не может найти, потому что ты уже в другом районе.", "Ты называешь всех «зай», потому что не помнишь имён. Это не баг, это фича.") },
  { max: 101, emoji: "👑", title: "Легендарная грязнулька",
    desc: G("Сертифицированная, сертификат висит в рамочке. О тебе слагают легенды в чатах, куда тебя не добавили.", "Сертифицированный. Твой номер записан у половины города как «не брать». Легенда.") },
];

const SHB_LINES = [
  [0, "ШБ не обнаружено. пока что 👀"],
  [30, "лёгкий налёт ШБ, протрите влажной салфеткой"],
  [55, "ШБ-вайб уверенный, соседи в курсе"],
  [80, "ШБ уровня «босс». уважение и страх"],
];

const TIPS = {
  clean: [
    "менять постельное раз в неделю (да, это норма)",
    "на «я в душ» отвечать «ок» и идти спать",
    "переименовать «братиков» в их настоящие имена",
    "кино на мультик вместо тусы у незнакомца",
    "блок бывших во всех соцсетях, включая госуслуги",
  ],
  dirty: [
    "отвечать на «ты спишь?» быстрее, чем за 3 дня",
    "сменить худи на что-то, что «почти ничего не прикрывает»",
    "выложить селфи в лифте с подписью «ну и что»",
    "научиться говорить «фото или не было» с серьёзным лицом",
    "сухой шампунь — это стиль жизни, а не лень",
  ],
};

const LOADING = ["считаем твои грехи…", "сверяемся с мамой подруги…", "нюхаем постельное…", "проверяем папку «братики»…", "почти готово 💅"];

// ---------- state ----------
const $ = (s) => document.querySelector(s);
const state = { gender: null, i: 0, d: 0, c: 0, s: 0, maxD: 0, maxC: 0, maxS: 0, busy: false };

function computeMax(gender) {
  let d = 0, c = 0, s = 0;
  for (const q of QUESTIONS) {
    const a = pick(q.a, gender);
    d += Math.max(...a.map((x) => x.d || 0));
    c += Math.max(...a.map((x) => x.c || 0));
    s += Math.max(...a.map((x) => x.s || 0));
  }
  return { d, c, s };
}

function show(id) {
  const cur = document.querySelector(".screen.active");
  if (cur) {
    cur.classList.add("leaving");
    cur.classList.remove("active");
    setTimeout(() => cur.classList.remove("leaving"), 700);
  }
  setTimeout(() => $(id).classList.add("active"), cur ? 180 : 0);
  window.scrollTo({ top: 0, behavior: "smooth" });
}

function renderQuestion() {
  const q = QUESTIONS[state.i];
  const g = state.gender;
  $("#qnum").textContent = `${state.i + 1} / ${QUESTIONS.length}`;
  $("#qtag").textContent = q.tag;
  $("#progress").style.width = `${(state.i / QUESTIONS.length) * 100}%`;
  const em = $("#qemoji");
  em.textContent = q.emoji;
  em.style.animation = "none"; void em.offsetWidth; em.style.animation = "";
  $("#question").textContent = pick(q.q, g);

  const chat = $("#chat");
  const msgs = pick(q.chat, g);
  chat.innerHTML = "";
  chat.hidden = !msgs;
  if (msgs) {
    const meta = document.createElement("div");
    meta.className = "bubble meta";
    meta.textContent = g === "girl" ? "он · сейчас" : "она · сейчас";
    chat.append(meta);
    msgs.forEach((m, k) => {
      const b = document.createElement("div");
      b.className = "bubble them";
      b.textContent = m;
      b.style.animationDelay = `${0.15 + k * 0.35}s`;
      chat.append(b);
    });
  }

  const box = $("#answers");
  box.innerHTML = "";
  pick(q.a, g).forEach((a, k) => {
    const btn = document.createElement("button");
    btn.className = "ans";
    btn.style.animationDelay = `${0.1 + k * 0.07 + (msgs ? msgs.length * 0.3 : 0)}s`;
    btn.innerHTML = `<span class="e"></span><span class="t"></span>`;
    btn.querySelector(".e").textContent = a.e;
    btn.querySelector(".t").textContent = pick(a.t, g);
    btn.addEventListener("click", (ev) => answer(a, btn, ev));
    box.append(btn);
  });
}

function answer(a, btn, ev) {
  if (state.busy) return;
  state.busy = true;
  state.d += a.d || 0; state.c += a.c || 0; state.s += a.s || 0;
  btn.classList.add("picked");
  document.querySelectorAll(".ans").forEach((b) => b !== btn && b.classList.add("dim"));
  const r = btn.getBoundingClientRect();
  burst(r.left + r.width / 2, r.top + r.height / 2, [a.e, "✨", "🫧"], 26);

  setTimeout(() => {
    const card = $("#card");
    card.classList.add("out");
    setTimeout(() => {
      state.i++;
      if (state.i >= QUESTIONS.length) { state.busy = false; return finish(); }
      card.classList.remove("out");
      card.classList.add("in-start");
      renderQuestion();
      void card.offsetWidth;
      card.classList.remove("in-start");
      state.busy = false;
    }, 420);
  }, 520);
}

function finish() {
  $("#progress").style.width = "100%";
  show("#screen-loading");
  let k = 0;
  const t = setInterval(() => { $("#loading-text").textContent = LOADING[++k % LOADING.length]; }, 520);
  setTimeout(() => { clearInterval(t); renderResult(); }, 2600);
}

function renderResult() {
  const g = state.gender;
  const dn = state.d / state.maxD, cn = state.c / state.maxC;
  const dirty = Math.round((dn / (dn + cn || 1)) * 100);
  const clean = 100 - dirty;
  const shb = Math.min(100, Math.round((state.s / state.maxS) * 100));
  const res = RESULTS.find((r) => dirty < r.max);

  $("#r-emoji").textContent = res.emoji;
  $("#r-title").textContent = pick(res.title, g);
  $("#r-desc").textContent = pick(res.desc, g);

  const shbLine = [...SHB_LINES].reverse().find(([min]) => shb >= min)[1];
  const facts = [
    `в тебе ${dirty}% грязнульки и ${clean}% чистюльки`,
    shbLine,
    dirty > 50 ? "до чистюльки: 1 стирка и 3 блокировки" : "до грязнульки: 1 сторис в лифте",
  ];
  const fbox = $("#r-facts");
  fbox.innerHTML = "";
  facts.forEach((f, k) => {
    const el = document.createElement("span");
    el.className = "fact"; el.textContent = f; el.style.animationDelay = `${0.8 + k * 0.15}s`;
    fbox.append(el);
  });

  const fill = (id, arr) => { const ul = $(id); ul.innerHTML = ""; shuffle(arr).slice(0, 3).forEach((t) => { const li = document.createElement("li"); li.textContent = t; ul.append(li); }); };
  fill("#tips-clean", TIPS.clean);
  fill("#tips-dirty", TIPS.dirty);

  ["dirty", "clean", "shb"].forEach((k) => { $("#b-" + k).style.width = "0"; $("#m-" + k).textContent = "0"; });
  show("#screen-result");
  setTimeout(() => {
    $("#b-dirty").style.width = dirty + "%";
    $("#b-clean").style.width = clean + "%";
    $("#b-shb").style.width = shb + "%";
    countUp("#m-dirty", dirty); countUp("#m-clean", clean); countUp("#m-shb", shb);
    confetti(dirty > 50 ? ["😈", "💋", "🍒", "💅", "🫦"] : ["🫧", "🧼", "🤍", "✨", "🧸"]);
  }, 450);

  state.result = { dirty, clean, shb, title: pick(res.title, g) };
}

function countUp(sel, to) {
  const el = $(sel), t0 = performance.now(), dur = 1600;
  const step = (t) => {
    const p = Math.min(1, (t - t0) / dur);
    el.textContent = Math.round(to * (1 - Math.pow(1 - p, 3)));
    if (p < 1) requestAnimationFrame(step);
  };
  requestAnimationFrame(step);
}
const shuffle = (a) => a.map((v) => [Math.random(), v]).sort((x, y) => x[0] - y[0]).map((x) => x[1]);

function start(gender) {
  Object.assign(state, { gender, i: 0, d: 0, c: 0, s: 0, busy: false });
  const m = computeMax(gender);
  state.maxD = m.d; state.maxC = m.c; state.maxS = m.s;
  document.body.dataset.theme = gender;
  renderQuestion();
  show("#screen-quiz");
}

document.querySelectorAll(".gbtn").forEach((b) => b.addEventListener("click", (ev) => {
  burst(ev.clientX, ev.clientY, b.dataset.gender === "girl" ? ["🎀", "💗", "🌸", "✨"] : ["🧢", "💙", "⚡", "✨"], 40);
  setTimeout(() => start(b.dataset.gender), 250);
}));
$("#restart").addEventListener("click", () => { document.body.dataset.theme = "neutral"; show("#screen-start"); });
$("#share").addEventListener("click", async () => {
  const r = state.result;
  const text = `я ${r.title.toLowerCase()} 🫧 грязнулька ${r.dirty}% / чистюлька ${r.clean}% / ШБ ${r.shb}%. а ты? ${location.href}`;
  try {
    if (navigator.share) await navigator.share({ title: "Грязнулька или чистюлька?", text });
    else { await navigator.clipboard.writeText(text); $("#copied").hidden = false; setTimeout(() => ($("#copied").hidden = true), 2500); }
  } catch (_) { /* пользователь закрыл окно */ }
});

// ---------- FX: воздушные волны + частицы ----------
const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;

document.addEventListener("pointerdown", (ev) => {
  if (reduce) return;
  // кольца воздуха по экрану
  for (let k = 0; k < 3; k++) {
    const ring = document.createElement("span");
    const size = 180 + k * 120;
    ring.className = "air";
    Object.assign(ring.style, { left: ev.clientX + "px", top: ev.clientY + "px", width: size + "px", height: size + "px", animationDelay: k * 0.09 + "s" });
    document.body.append(ring);
    setTimeout(() => ring.remove(), 1400);
  }
  // волна внутри кнопки
  const btn = ev.target.closest(".ans, .gbtn, .btn");
  if (btn) {
    const r = btn.getBoundingClientRect();
    const w = document.createElement("span");
    const size = Math.max(r.width, r.height) * 2.4;
    w.className = "wave";
    Object.assign(w.style, { left: ev.clientX - r.left + "px", top: ev.clientY - r.top + "px", width: size + "px", height: size + "px" });
    btn.append(w);
    setTimeout(() => w.remove(), 900);
  }
  pushBlobs(ev.clientX, ev.clientY);
});

// фон «отталкивается» от клика — как будто дунули
function pushBlobs(x, y) {
  document.querySelectorAll(".blob").forEach((b, k) => {
    const r = b.getBoundingClientRect();
    const dx = r.left + r.width / 2 - x, dy = r.top + r.height / 2 - y;
    const len = Math.hypot(dx, dy) || 1;
    b.animate([
      { translate: "0 0" },
      { translate: `${(dx / len) * 60}px ${(dy / len) * 60}px` },
      { translate: "0 0" },
    ], { duration: 1200 + k * 200, easing: "cubic-bezier(.2,.9,.2,1)" });
  });
}

const cv = $("#fx"), ctx = cv.getContext("2d");
let parts = [], raf = null;
function resize() { const dpr = devicePixelRatio || 1; cv.width = innerWidth * dpr; cv.height = innerHeight * dpr; ctx.setTransform(dpr, 0, 0, dpr, 0, 0); }
addEventListener("resize", resize); resize();

function burst(x, y, emojis, n) {
  if (reduce) return;
  for (let k = 0; k < n; k++) {
    const ang = Math.random() * Math.PI * 2, sp = 4 + Math.random() * 9;
    parts.push({ x, y, vx: Math.cos(ang) * sp, vy: Math.sin(ang) * sp - 4, g: 0.28, life: 1, decay: 0.012 + Math.random() * 0.015,
      size: 16 + Math.random() * 18, rot: Math.random() * 6, vr: (Math.random() - 0.5) * 0.3, e: emojis[k % emojis.length] });
  }
  loop();
}
function confetti(emojis) {
  if (reduce) return;
  for (let k = 0; k < 70; k++) {
    parts.push({ x: Math.random() * innerWidth, y: -40 - Math.random() * innerHeight * 0.6, vx: (Math.random() - 0.5) * 2, vy: 2 + Math.random() * 3,
      g: 0.05, life: 1, decay: 0.004, size: 20 + Math.random() * 20, rot: Math.random() * 6, vr: (Math.random() - 0.5) * 0.1, e: emojis[k % emojis.length], sway: Math.random() * 6 });
  }
  loop();
}
function loop() {
  if (raf) return;
  const tick = () => {
    ctx.clearRect(0, 0, innerWidth, innerHeight);
    parts = parts.filter((p) => p.life > 0 && p.y < innerHeight + 60);
    for (const p of parts) {
      p.vy += p.g; p.vx *= 0.985; p.x += p.vx + (p.sway ? Math.sin(p.y / 40 + p.sway) * 0.8 : 0); p.y += p.vy;
      p.rot += p.vr; p.life -= p.decay;
      ctx.save(); ctx.globalAlpha = Math.max(0, Math.min(1, p.life * 1.5));
      ctx.translate(p.x, p.y); ctx.rotate(p.rot);
      ctx.font = `${p.size}px serif`; ctx.textAlign = "center"; ctx.textBaseline = "middle";
      ctx.fillText(p.e, 0, 0); ctx.restore();
    }
    if (parts.length) raf = requestAnimationFrame(tick); else { raf = null; ctx.clearRect(0, 0, innerWidth, innerHeight); }
  };
  raf = requestAnimationFrame(tick);
}
