/* Грязнулька или чистюлька — мем-тест по мотивам тренда из TikTok (осень 2026).
   Очки за ответ: d — грязнулька, c — чистюлька, s — ШБ, h — лицемерие
   («публично осуждаю, в личку пишу»). flag — особые маркеры (например, клёши). */

const G = (girl, boy) => ({ girl, boy }); // разный текст для девочек и мальчиков
const pick = (v, gender) => (v && typeof v === "object" && "girl" in v ? v[gender] : v);

const CATS = {
  body: { name: "статистика", emoji: "🔢" },
  text: { name: "переписка", emoji: "💬" },
  fit: { name: "гардероб", emoji: "👖" },
  party: { name: "тусовки", emoji: "🪩" },
  hyg: { name: "гигиена (буквально)", emoji: "🧼" },
  ex: { name: "бывшие и контакты", emoji: "📇" },
  vibe: { name: "вайб и репутация", emoji: "🔮" },
};

const QUESTIONS = [
  {
    cat: "body", tag: "разминка", emoji: "🔢",
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
    cat: "text", tag: "переписка", emoji: "🚿",
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
    cat: "fit", tag: "образ", emoji: "👗",
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
    cat: "fit", tag: "джинсы решают", emoji: "👖",
    q: "Какие у тебя джинсы?",
    a: [
      { e: "📏", t: "прямые, синие, как у мамы на фото 2003 года", c: 3 },
      { e: "🧺", t: "мом-джинсы, удобно и прилично", c: 2 },
      { e: "🌊", t: "клёши в пол, подметаю ими город", d: 2, flag: "kloshi" },
      { e: "🖤", t: "что-то чёрное. всё чёрное. всегда", d: 2, s: 1 },
    ],
  },
  {
    cat: "party", tag: "локация", emoji: "📍",
    q: "Куда пойдёшь в пятницу вечером?",
    a: [
      { e: "📚", t: "в библиотеку или котокафе", c: 3 },
      { e: "🍿", t: "в кино на мультик", c: 2 },
      { e: "🍸", t: "в бар «на один бокал»", d: 2 },
      { e: "📩", t: "на вписку к незнакомцу, адрес скинут в 3 ночи", d: 3, s: 3 },
    ],
  },
  {
    cat: "party", tag: "вписка", emoji: "🥤",
    q: "Что у тебя в руке на вписке?",
    a: [
      { e: "🫖", t: "я не хожу на вписки, у меня чай с чабрецом", c: 3 },
      { e: "🧃", t: "сок, я за рулём (самоката)", c: 2 },
      { e: "⚡", t: "энергетик, третий за вечер", d: 2 },
      { e: "💨", t: "энергетик в одной руке, чужая электронка в другой", d: 3, s: 1 },
    ],
  },
  {
    cat: "text", tag: "02:47", emoji: "🌙",
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
    cat: "hyg", tag: "неочевидное", emoji: "🛏️",
    q: "Как часто ты меняешь постельное бельё?",
    a: [
      { e: "✨", t: "раз в неделю, у меня график", c: 3 },
      { e: "🗓️", t: "раз в месяц, нормально же", c: 1, d: 1 },
      { e: "🤨", t: "а его надо менять?", d: 3 },
      { e: "🗂️", t: "у меня три комплекта, и все не мои", d: 2, s: 3 },
    ],
  },
  {
    cat: "ex", tag: "контакты", emoji: "📱",
    q: G("Сколько «братиков» у тебя в контактах?", "Сколько «сестрёнок» у тебя в контактах?"),
    a: [
      { e: "0️⃣", t: "ноль, только мама и кот", c: 3 },
      { e: "🤏", t: G("1–2, правда братики", "1–2, правда сёстры"), c: 1 },
      { e: "🖐️", t: "5+, и все «просто друзья»", d: 2, s: 2 },
      { e: "📁", t: "у меня для них отдельная папка", d: 3, s: 3 },
    ],
  },
  {
    cat: "vibe", tag: "двойные стандарты", emoji: "🎭",
    q: G("В каждой компании есть грязнулька. В твоей это:", "Ты публично осуждаешь грязнулек?"),
    a: G(
      [
        { e: "📖", t: "у нас все серьёзки, мы читаем Достоевского", c: 3 },
        { e: "🙄", t: "Настя. конечно же Настя", d: 1, h: 3 },
        { e: "🫢", t: "осуждаю её в чате, а потом прошу скинуть её образ", d: 1, h: 2 },
        { e: "🪞", t: "если не знаешь, кто грязнулька, — это ты", d: 3, s: 1 },
      ],
      [
        { e: "🤷", t: "нет, мне всё равно, кто как живёт", c: 2 },
        { e: "⛪", t: "осуждаю и не общаюсь, у меня принципы", c: 3, h: 1 },
        { e: "🌚", t: "осуждаю в комментах, пишу в личку в 3 ночи", d: 2, h: 3 },
        { e: "🪞", t: "как я могу их осуждать, если я сам грязнулька", d: 3, s: 2 },
      ]
    ),
  },
  {
    cat: "hyg", tag: "гигиена", emoji: "🧼",
    q: "Сколько раз в день ты принимаешь душ?",
    a: [
      { e: "🫧", t: "дважды, плюс скраб и маска", c: 3 },
      { e: "🚿", t: "один раз, как все", c: 2 },
      { e: "🌱", t: "через день, я экоактивист", d: 2 },
      { e: "💨", t: "сухой шампунь — мой лучший друг", d: 3 },
    ],
  },
  {
    cat: "vibe", tag: "цитата из тренда", emoji: "💼",
    q: "«Жениться пока рано, карьера важнее». Это про тебя?",
    a: G(
      [
        { e: "👰", t: "нет, я хочу свадьбу, домик и собаку", c: 3 },
        { e: "📈", t: "да, карьера реально важнее", c: 1 },
        { e: "😏", t: "карьера? ну да, назовём это так", d: 2, s: 1 },
        { e: "🔁", t: "говорю это каждому новому", d: 3, h: 2 },
      ],
      [
        { e: "💍", t: "нет, я уже выбрал имена детям", c: 3 },
        { e: "📈", t: "да, сначала квартира и бизнес", c: 1 },
        { e: "🎰", t: "моя карьера — это свиданки", d: 2, s: 2 },
        { e: "🔁", t: "говорю это каждой, кто спросит «а мы кто?»", d: 3, h: 2 },
      ]
    ),
  },
  {
    cat: "party", tag: "после тусы", emoji: "🌅",
    q: "Где ты просыпаешься после вечеринки?",
    a: [
      { e: "🏠", t: G("дома, я ушла в 22:00", "дома, я ушёл в 22:00"), c: 3 },
      { e: "🌯", t: "дома, но с шаурмой в руке", c: 2, d: 1 },
      { e: "🗺️", t: "в другом районе, не помню как", d: 3, s: 2 },
      { e: "✈️", t: "в другом городе. с кольцом", d: 3, s: 3 },
    ],
  },
  {
    cat: "ex", tag: "бывшие", emoji: "💔",
    q: "Что у тебя с бывшими?",
    a: [
      { e: "🚫", t: "заблокированы везде, даже в госуслугах", c: 3 },
      { e: "🤝", t: "мы друзья (правда)", c: 1, d: 1 },
      { e: "🌀", t: "у нас «всё сложно» уже 3 года", s: 3, d: 1 },
      { e: "🔁", t: G("какие бывшие? я ни с кем официально не расставалась", "какие бывшие? я ни с кем официально не расставался"), d: 2, s: 3 },
    ],
  },
  {
    cat: "vibe", tag: "разница в возрасте", emoji: "🎂",
    q: G("Сколько лет тому, с кем ты переписываешься?", "Сколько лет той, кому ты пишешь?"),
    a: G(
      [
        { e: "🎒", t: "ровесник из параллели", c: 2 },
        { e: "📚", t: "я переписываюсь только с репетитором", c: 3 },
        { e: "🚗", t: "на 7 лет старше, у него своя машина", d: 2, s: 1 },
        { e: "🏚️", t: "у него ипотека, двое детей и «это не то, что ты думаешь»", d: 3, s: 3, h: 1 },
      ],
      [
        { e: "🎒", t: "ровесница из параллели", c: 2 },
        { e: "👵", t: "я пишу только маме и бабушке", c: 3 },
        { e: "🍝", t: "она старше и меня кормит", d: 2, s: 1 },
        { e: "🎲", t: "их несколько, возраст разный, имена путаю", d: 3, s: 3 },
      ]
    ),
  },
  {
    cat: "vibe", tag: "улики", emoji: "🔋",
    q: "Сколько сейчас заряда на твоём телефоне?",
    a: [
      { e: "🔋", t: "100%, заряжаю каждую ночь дома", c: 3 },
      { e: "🪫", t: "47%, всё под контролем", c: 1 },
      { e: "🚨", t: G("3%, я не была дома с пятницы", "3%, я не был дома с пятницы"), d: 3, s: 1 },
      { e: "📵", t: "сел, отвечаю тебе с чужого", d: 3, s: 2 },
    ],
  },
  {
    cat: "vibe", tag: "сторис", emoji: "🤳",
    q: "Твоя последняя сторис:",
    a: [
      { e: "🐈", t: "кот спит на книжке", c: 3 },
      { e: "🥗", t: "полезный завтрак и «доброе утро»", c: 2 },
      { e: "🪞", t: "селфи в зеркале в лифте", d: 2, s: 1 },
      { e: "🎵", t: "грустная песня — пусть кое-кто увидит", s: 3, h: 1 },
    ],
  },
  {
    cat: "text", tag: "финал", emoji: "🫶",
    q: "Твой любимый эмодзи:",
    a: [
      { e: "🙏", t: "🙏 — я хороший человек", c: 3 },
      { e: "🫶", t: "🫶 — люблю всех (платонически)", c: 2 },
      { e: "😈", t: "😈 — сами знаете", d: 2, s: 1 },
      { e: "🫦", t: "🫦 — без комментариев", d: 3, s: 2 },
    ],
  },
];

// Архетипы. Порядок проверки важен: особые случаи — первыми.
const ARCHETYPES = {
  serious: { emoji: "📖", title: G("Серьёзка", "Серьёзный тип"),
    desc: G("Антипод грязнульки из того же тренда: скромная, домашняя, труднодоступная. Ты пишешь «добрый вечер» с точкой в конце, и это пугает.",
            "Ты пишешь «добрый вечер» с точкой в конце и считаешь вписку разновидностью прописки. Мамы девочек уже готовят тебе оливье."),
    match: "грязнулька. противоположности притягиваются — на этом держится весь тренд" },
  clean: { emoji: "🧼", title: "Стерильная чистюлька",
    desc: G("Ты пахнешь кондиционером для белья и хорошими решениями. Мамы подруг тебя обожают.", "Ты пахнешь хозяйственным мылом и стабильностью. Мамы девочек тебя обожают."),
    match: "такая же чистюлька — будете вместе менять постельное по воскресеньям" },
  secret: { emoji: "🫧", title: "Чистюлька с секретиком",
    desc: G("Снаружи — зефирка в пастельном, внутри — пара историй, которые ты не расскажешь даже лучшей подруге.", "Снаружи — хороший мальчик, внутри — пара историй, которые ты унесёшь с собой."),
    match: "грязнулька в клёшах — она научит, ты прикроешь" },
  kloshi: { emoji: "🌊", title: "Грязнулька в клёшах",
    desc: G("Самая уважаемая ветка тренда: это почти комплимент. Винтаж, харизма, клёши подметают город — и все хотят знать, где ты их купила.",
            "Это почти комплимент: винтажный вайб, клёши, харизма. Ты не грязнулька, ты — эстетика."),
    match: "чистюлька с секретиком — ей нужен кто-то, кто покажет, где выход" },
  denial: { emoji: "⚖️", title: "50 на 50: грязнулька в отрицании",
    desc: G("Днём ты чистюлька, после 23:00 — грязнулька. Ты и сама не знаешь, кто проснётся завтра.", "Днём ты чистюлька, после 23:00 — грязнулька. Ты и сам не знаешь, кто проснётся завтра."),
    match: "такой же человек в отрицании — будете вместе говорить «мы просто общаемся»" },
  dirty: { emoji: "😈", title: "Грязнулька, и ты это знаешь",
    desc: G("Вписки, энергетики, чёрное всё — ты ходячий чек-лист из тиктока. Тебя публично осуждают, а потом пишут в 3 ночи.",
            "Ты называешь всех «зай», потому что не помнишь имён. Это не баг, это фича."),
    match: G("серьёзный тип — он будет осуждать тебя в комментах и лайкать в личке", "серьёзка — она будет ставить точку в конце, а ты — не спать до утра") },
  legend: { emoji: "👑", title: "Легендарная грязнулька",
    desc: G("Сертифицированная, сертификат висит в рамочке. О тебе слагают легенды в чатах, куда тебя не добавили.", "Сертифицированный. Твой номер записан у половины города как «не брать». Легенда."),
    match: "никто. ты — сольный проект" },
  shb: { emoji: "🧨", title: "Грязнулька уровня ШБ",
    desc: "ШБ-индекс пробил потолок. Что это значит — знают только те, у кого он такой же. Соседи в курсе, курьеры тоже.",
    match: "только другой человек с ШБ-индексом 80+, иначе не выдержит" },
};

function archetypeFor(dirty, shb, flags) {
  if (shb >= 75 && dirty >= 60) return "shb";
  if (dirty < 12) return "serious";
  if (dirty < 30) return "clean";
  if (dirty < 46) return "secret";
  if (dirty < 64) return flags.has("kloshi") ? "kloshi" : "denial";
  if (dirty < 84) return flags.has("kloshi") ? "kloshi" : "dirty";
  return "legend";
}

const SHB_LINES = [
  [0, "ШБ не обнаружено. пока что 👀"],
  [30, "лёгкий налёт ШБ, протрите влажной салфеткой"],
  [55, "ШБ-вайб уверенный, соседи в курсе"],
  [80, "ШБ уровня «босс». уважение и страх"],
];
const HYP_LINES = [
  [0, "ты не лицемеришь. подозрительно честно"],
  [34, "иногда осуждаешь то, что сам(а) делаешь в пятницу"],
  [67, "осуждаешь грязнулек в комментах, пишешь им в личку. классика тренда"],
];
const CAT_VERDICTS = [
  [0, "святость"], [25, "почти чисто"], [45, "есть пятнышко"], [65, "грязновато"], [85, "катастрофа"],
];

const TIPS = {
  clean: [
    "менять постельное раз в неделю (да, это норма)",
    "на «я в душ» отвечать «ок» и идти спать",
    "переименовать «братиков» в их настоящие имена",
    "кино на мультик вместо вписки у незнакомца",
    "блок бывших во всех соцсетях, включая госуслуги",
    "заряжать телефон дома. каждую ночь. дома",
    "поменять энергетик на чай с чабрецом",
  ],
  dirty: [
    "отвечать на «ты спишь?» быстрее, чем за 3 дня",
    "купить клёши и подметать ими город",
    "выложить селфи в лифте с подписью «ну и что»",
    "научиться говорить «фото или не было» с серьёзным лицом",
    "на вопрос «а мы кто?» отвечать «жениться пока рано, карьера важнее»",
    "одеваться только в чёрное — это уже половина успеха",
  ],
};

const LOADING = ["считаем твои грехи…", "сверяемся с мамой подруги…", "нюхаем постельное…", "проверяем папку «братики»…", "меряем ширину клёшей…", "почти готово 💅"];

// ---------- state ----------
const $ = (s) => document.querySelector(s);
const state = { gender: null, i: 0, picks: [], busy: false };

const sumOf = (arr, key) => arr.reduce((n, x) => n + (x[key] || 0), 0);
const maxOf = (arr, key) => Math.max(...arr.map((x) => x[key] || 0));
const lineFor = (lines, v) => [...lines].reverse().find(([min]) => v >= min)[1];
const el = (tag, cls, text) => { const n = document.createElement(tag); if (cls) n.className = cls; if (text != null) n.textContent = text; return n; };

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
    chat.append(el("div", "bubble meta", g === "girl" ? "он · сейчас" : "она · сейчас"));
    msgs.forEach((m, k) => {
      const b = el("div", "bubble them", m);
      b.style.animationDelay = `${0.15 + k * 0.35}s`;
      chat.append(b);
    });
  }

  const box = $("#answers");
  box.innerHTML = "";
  pick(q.a, g).forEach((a, k) => {
    const btn = el("button", "ans");
    btn.style.animationDelay = `${0.1 + k * 0.07 + (msgs ? msgs.length * 0.3 : 0)}s`;
    btn.append(el("span", "e", a.e), el("span", "t", pick(a.t, g)));
    btn.addEventListener("click", () => answer(a, btn));
    box.append(btn);
  });
}

function answer(a, btn) {
  if (state.busy) return;
  state.busy = true;
  state.picks.push({ q: QUESTIONS[state.i], a });
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
  const t = setInterval(() => { $("#loading-text").textContent = LOADING[++k % LOADING.length]; }, 480);
  setTimeout(() => { clearInterval(t); renderResult(); }, 2900);
}

// ---------- аналитика ----------
function analyze() {
  const g = state.gender;
  const answers = state.picks.map((p) => p.a);
  const all = QUESTIONS.map((q) => pick(q.a, g));
  const max = (key) => all.reduce((n, a) => n + maxOf(a, key), 0);

  const dn = sumOf(answers, "d") / max("d");
  const cn = sumOf(answers, "c") / max("c");
  const dirty = Math.round((dn / (dn + cn || 1)) * 100);
  const shb = Math.min(100, Math.round((sumOf(answers, "s") / max("s")) * 100));
  const hyp = Math.min(100, Math.round((sumOf(answers, "h") / max("h")) * 100));
  const flags = new Set(answers.map((a) => a.flag).filter(Boolean));

  // разбор по категориям
  const cats = Object.keys(CATS).map((key) => {
    const ps = state.picks.filter((p) => p.q.cat === key).map((p) => p.a);
    const d = sumOf(ps, "d") + sumOf(ps, "s") * 0.5, c = sumOf(ps, "c");
    const pct = d + c ? Math.round((d / (d + c)) * 100) : 50;
    return { key, ...CATS[key], pct };
  }).sort((x, y) => y.pct - x.pct);

  // «процентиль» — по нормальному распределению вокруг 45%, выборка выдуманная
  const z = (dirty - 45) / 22;
  const percentile = Math.max(1, Math.min(99, Math.round(100 / (1 + Math.exp(-1.7 * z)))));

  const score = (p) => (p.a.d || 0) + (p.a.s || 0) + (p.a.h || 0) * 0.5;
  const sorted = [...state.picks].sort((x, y) => score(y) - score(x));
  const evidence = sorted.filter((p) => score(p) > 0).slice(0, 3);
  const green = [...state.picks].sort((x, y) => (y.a.c || 0) - (x.a.c || 0))[0];

  return { dirty, clean: 100 - dirty, shb, hyp, flags, cats, percentile, evidence, green, arch: archetypeFor(dirty, shb, flags) };
}

function renderResult() {
  const g = state.gender;
  const R = analyze();
  const A = ARCHETYPES[R.arch];

  $("#r-emoji").textContent = A.emoji;
  $("#r-title").textContent = pick(A.title, g);
  $("#r-desc").textContent = pick(A.desc, g);
  $("#r-percentile").textContent = R.dirty >= 50
    ? `ты грязнее, чем ${R.percentile}% прошедших тест`
    : `ты чище, чем ${100 - R.percentile}% прошедших тест`;

  const fbox = $("#r-facts");
  fbox.innerHTML = "";
  [
    `в тебе ${R.dirty}% грязнульки и ${R.clean}% чистюльки`,
    lineFor(SHB_LINES, R.shb),
    R.dirty > 50 ? "до чистюльки: 1 стирка и 3 блокировки" : "до грязнульки: клёши и 1 сторис в лифте",
  ].forEach((f, k) => { const n = el("span", "fact", f); n.style.animationDelay = `${0.8 + k * 0.15}s`; fbox.append(n); });

  // категории
  const cbox = $("#r-cats");
  cbox.innerHTML = "";
  R.cats.forEach((c, k) => {
    const row = el("div", "cat");
    const head = el("div", "cat-head");
    head.append(el("span", null, `${c.emoji} ${c.name}`), el("span", "cat-verdict", `${lineFor(CAT_VERDICTS, c.pct)} · ${c.pct}%`));
    const bar = el("div", "bar small"); const fill = el("div", "bar-fill mix"); bar.append(fill);
    row.append(head, bar); cbox.append(row);
    setTimeout(() => (fill.style.width = c.pct + "%"), 600 + k * 120);
  });
  const top = R.cats[0], low = R.cats[R.cats.length - 1];
  $("#r-cats-note").textContent = top.pct - low.pct >= 30
    ? `Главная улика — ${top.name}. А вот в категории «${low.name}» ты ${g === "girl" ? "чиста" : "чист"}, как совесть серьёзки.`
    : "Ты стабильно одинаков(а) во всём — ни одного неожиданного пятна. Цельная натура.";

  // улики
  const ebox = $("#r-evidence");
  ebox.innerHTML = "";
  if (!R.evidence.length) ebox.append(el("li", null, "ни одной улики. мы проверили даже постельное"));
  R.evidence.forEach((p) => {
    const li = el("li");
    li.append(el("b", null, `«${pick(p.a.t, g)}»`), document.createTextNode(` — ${p.q.tag}`));
    ebox.append(li);
  });
  $("#r-green").textContent = R.green && R.green.a.c ? `«${pick(R.green.a.t, g)}» — тут ты чистюлька без вопросов` : "грин-флагов не найдено. ищем дальше 🔍";

  $("#r-hyp-line").textContent = lineFor(HYP_LINES, R.hyp);
  $("#r-match").textContent = pick(A.match, g);

  const fill = (id, arr) => { const ul = $(id); ul.innerHTML = ""; shuffle(arr).slice(0, 3).forEach((t) => ul.append(el("li", null, t))); };
  fill("#tips-clean", TIPS.clean);
  fill("#tips-dirty", TIPS.dirty);

  ["dirty", "clean", "shb", "hyp"].forEach((k) => { $("#b-" + k).style.width = "0"; $("#m-" + k).textContent = "0"; });
  show("#screen-result");
  setTimeout(() => {
    const vals = { dirty: R.dirty, clean: R.clean, shb: R.shb, hyp: R.hyp };
    for (const [k, v] of Object.entries(vals)) { $("#b-" + k).style.width = v + "%"; countUp("#m-" + k, v); }
    confetti(R.dirty > 50 ? ["😈", "💋", "🍒", "💅", "🫦"] : ["🫧", "🧼", "🤍", "✨", "🧸"]);
  }, 450);

  state.result = { ...R, title: pick(A.title, g) };
}

function countUp(sel, to) {
  const node = $(sel), t0 = performance.now(), dur = 1600;
  const step = (t) => {
    const p = Math.min(1, (t - t0) / dur);
    node.textContent = Math.round(to * (1 - Math.pow(1 - p, 3)));
    if (p < 1) requestAnimationFrame(step);
  };
  requestAnimationFrame(step);
}
const shuffle = (a) => a.map((v) => [Math.random(), v]).sort((x, y) => x[0] - y[0]).map((x) => x[1]);

function start(gender) {
  Object.assign(state, { gender, i: 0, picks: [], busy: false });
  document.body.dataset.theme = gender;
  renderQuestion();
  show("#screen-quiz");
}

$("#qcount").textContent = QUESTIONS.length;
document.querySelectorAll(".gbtn").forEach((b) => b.addEventListener("click", (ev) => {
  burst(ev.clientX, ev.clientY, b.dataset.gender === "girl" ? ["🎀", "💗", "🌸", "✨"] : ["🧢", "💙", "⚡", "✨"], 40);
  setTimeout(() => start(b.dataset.gender), 250);
}));
$("#restart").addEventListener("click", () => { document.body.dataset.theme = "neutral"; show("#screen-start"); });
$("#share").addEventListener("click", async () => {
  const r = state.result;
  const text = `мой диагноз: ${r.title.toLowerCase()} 🫧 грязнулька ${r.dirty}% / чистюлька ${r.clean}% / ШБ ${r.shb}% / лицемерие ${r.hyp}%. а ты? ${location.href}`;
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
