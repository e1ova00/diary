// Викторина: мини-темы по 5 вопросов, прогресс, очки, работа над ошибками, экзамен
import { THEMES } from '../questions.js';
import { THEME_EMOJI } from './world.js';
import { sfx } from './audio.js';

export { THEMES };
const SET_SIZE = 5;
const KEY = 'pdd-winter-run-v1';

const esc = (s) => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const qid = (q) => `${q.ticket}-${q.num}`;

// все вопросы по id
export const QUESTIONS = new Map();
THEMES.forEach(t => t.questions.forEach(q => QUESTIONS.set(qid(q), q)));

// разбиваем тему на мини-темы примерно по 5 вопросов
export const SETS = THEMES.map(t => {
  const n = Math.max(1, Math.ceil(t.questions.length / SET_SIZE));
  const base = Math.floor(t.questions.length / n), extra = t.questions.length % n;
  const sets = [];
  let i = 0;
  for (let k = 0; k < n; k++) {
    const size = base + (k < extra ? 1 : 0);
    sets.push(t.questions.slice(i, i + size));
    i += size;
  }
  return sets;
});
export const TOTAL_SETS = SETS.reduce((a, s) => a + s.length, 0);

// ---------- прогресс ----------
export const progress = load();
function load() {
  const d = { score: 0, best: {}, errors: [], streak: 0, bestStreak: 0, answered: 0, correct: 0, examsPassed: 0 };
  try { return { ...d, ...JSON.parse(localStorage.getItem(KEY) || '{}') }; } catch { return d; }
}
export function save() {
  try { localStorage.setItem(KEY, JSON.stringify(progress)); } catch { /* приватный режим */ }
}
export const isPassed = (n, size) => n != null && n >= size - 1;
export function themeStats(ti) {
  const sets = SETS[ti];
  let done = 0, stars = 0;
  sets.forEach((s, k) => {
    const b = progress.best[`${THEMES[ti].id}:${k}`];
    if (isPassed(b, s.length)) done++;
    if (b === s.length) stars++;
  });
  return { done, total: sets.length, perfect: stars, complete: done === sets.length };
}
export function totalPassed() {
  return THEMES.reduce((a, _, i) => a + themeStats(i).done, 0);
}
function starsFor(correct, size) {
  if (correct == null) return '';
  if (correct >= size) return '★★★';
  if (correct >= size - 1) return '★★☆';
  if (correct >= size - 2) return '★☆☆';
  return '☆☆☆';
}

function imgSrc(q) {
  if (!q.img) return null;
  const name = q.img.split('/').pop();
  return (window.PDD_IMAGES && window.PDD_IMAGES[name]) || q.img;
}

// ---------- UI ----------
const overlay = document.getElementById('overlay');
const panel = document.getElementById('panel');
let keyHandler = null;
let hooks = {};
export function setHooks(h) { hooks = h; }
export const isOpen = () => !overlay.hidden;

function show(html) {
  panel.innerHTML = html;
  overlay.hidden = false;
  panel.scrollTop = 0;
}
export function close() {
  overlay.hidden = true;
  panel.innerHTML = '';
  keyHandler = null;
  hooks.onClose?.();
}
document.addEventListener('keydown', (e) => {
  if (overlay.hidden) return;
  if (e.key === 'Escape') { close(); return; }
  keyHandler?.(e);
});
overlay.addEventListener('click', (e) => { if (e.target === overlay && !current) close(); });

// ---------- панель темы ----------
export function openTheme(ti) {
  const t = THEMES[ti];
  const st = themeStats(ti);
  const sets = SETS[ti];
  const firstOpen = sets.findIndex((s, k) => !isPassed(progress.best[`${t.id}:${k}`], s.length));
  let qn = 1;
  const chips = sets.map((s, k) => {
    const b = progress.best[`${t.id}:${k}`];
    const passed = isPassed(b, s.length);
    const from = qn; qn += s.length;
    return `<button class="chip ${passed ? 'done' : ''} ${k === firstOpen ? 'next' : ''}" data-set="${k}">
      <b>Мини-тема ${k + 1}</b>
      <span class="stars">${starsFor(b, s.length) || '·'}</span>
      <small>вопросы ${from}–${qn - 1}</small>
    </button>`;
  }).join('');
  show(`
    <button class="x" data-close aria-label="Закрыть">✕</button>
    <div class="theme-head">
      <div class="big-emoji">${THEME_EMOJI[t.id] || '📘'}</div>
      <div>
        <div class="muted">Тема ${ti + 1} из ${THEMES.length} · ${t.questions.length} вопросов</div>
        <h2>${esc(t.title)}</h2>
      </div>
    </div>
    <div class="bar"><i style="width:${st.done / st.total * 100}%"></i></div>
    <p class="muted">Пройдено ${st.done} из ${st.total} мини-тем${st.perfect ? ` · без ошибок: ${st.perfect}` : ''}. Мини-тема засчитывается, если ошибок не больше одной — тогда мальчик танцует! 💃</p>
    <div class="chips">${chips}</div>
    <div class="row">
      ${firstOpen >= 0 ? `<button class="btn primary" data-set="${firstOpen}">▶ Играть мини-тему ${firstOpen + 1}</button>` : '<span class="muted">Тема пройдена целиком! 🏆 Можно переигрывать на звёзды.</span>'}
    </div>`);
  panel.querySelectorAll('[data-set]').forEach(b => b.onclick = () => {
    sfx('click');
    const k = +b.dataset.set;
    runQuiz(SETS[ti][k], { kind: 'set', ti, k, title: `${t.title} · мини-тема ${k + 1}` });
  });
  panel.querySelector('[data-close]').onclick = close;
  keyHandler = (e) => { if (e.key === 'Enter' && firstOpen >= 0) panel.querySelector('.btn.primary')?.click(); };
}

export function openErrors() {
  const list = progress.errors.map(id => QUESTIONS.get(id)).filter(Boolean);
  if (!list.length) {
    show(`<button class="x" data-close>✕</button><h2>❗ Работа над ошибками</h2>
      <p>Ошибок пока нет — отлично! Здесь будут собираться вопросы, на которые ты ответил неправильно. Ответишь верно — вопрос уйдёт из списка.</p>
      <div class="row"><button class="btn" data-close>Понятно</button></div>`);
    panel.querySelectorAll('[data-close]').forEach(b => b.onclick = close);
    return;
  }
  const pick = shuffle(list).slice(0, 10);
  runQuiz(pick, { kind: 'errors', title: `Работа над ошибками · осталось ${list.length}` });
}

export function openExam() {
  show(`<button class="x" data-close>✕</button><h2>🎓 Экзамен</h2>
    <p>20 случайных вопросов из всех тем, как в ГИБДД. Можно ошибиться не больше двух раз.</p>
    <p class="muted">Сдано экзаменов: ${progress.examsPassed}</p>
    <div class="row"><button class="btn primary" data-go>▶ Начать экзамен</button><button class="btn" data-close>Позже</button></div>`);
  panel.querySelectorAll('[data-close]').forEach(b => b.onclick = close);
  panel.querySelector('[data-go]').onclick = () => {
    const all = [...QUESTIONS.values()];
    runQuiz(shuffle(all).slice(0, 20), { kind: 'exam', title: 'Экзамен' });
  };
  keyHandler = (e) => { if (e.key === 'Enter') panel.querySelector('[data-go]').click(); };
}

export function openMap() {
  const rows = THEMES.map((t, i) => {
    const st = themeStats(i);
    return `<div class="map-row ${st.complete ? 'done' : ''}">
      <span class="map-emoji">${THEME_EMOJI[t.id] || '📘'}</span>
      <div class="map-mid"><div class="map-title">${i + 1}. ${esc(t.title)}</div>
        <div class="bar small"><i style="width:${st.done / st.total * 100}%"></i></div></div>
      <span class="map-num">${st.done}/${st.total}</span>
      <button class="btn tiny" data-tp="${i}" title="Перенестись к острову">🏃</button>
      <button class="btn tiny primary" data-th="${i}" title="Открыть тему">▶</button>
    </div>`;
  }).join('');
  const passed = totalPassed();
  show(`<button class="x" data-close>✕</button>
    <h2>🗺️ Карта тем</h2>
    <p class="muted">Пройдено мини-тем: ${passed} из ${TOTAL_SETS} · очки: ${progress.score} ❄ · верных ответов: ${progress.correct} из ${progress.answered}</p>
    <div class="bar"><i style="width:${passed / TOTAL_SETS * 100}%"></i></div>
    <div class="map-list">${rows}</div>
    <div class="row"><button class="btn danger tiny" data-reset>Сбросить прогресс</button></div>`);
  panel.querySelector('[data-close]').onclick = close;
  panel.querySelectorAll('[data-tp]').forEach(b => b.onclick = () => { close(); hooks.onTeleport?.(+b.dataset.tp); });
  panel.querySelectorAll('[data-th]').forEach(b => b.onclick = () => { hooks.onTeleport?.(+b.dataset.th); openTheme(+b.dataset.th); });
  const reset = panel.querySelector('[data-reset]');
  reset.onclick = () => {
    if (!reset.dataset.sure) {
      reset.dataset.sure = '1';
      reset.textContent = 'Точно сбросить очки и прогресс? Нажми ещё раз';
      return;
    }
    Object.assign(progress, { score: 0, best: {}, errors: [], streak: 0, bestStreak: 0, answered: 0, correct: 0, examsPassed: 0 });
    save(); hooks.onProgress?.(); openMap();
  };
}

function shuffle(a) {
  a = a.slice();
  for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; }
  return a;
}

// ---------- прохождение вопросов ----------
let current = null;

function runQuiz(questions, meta) {
  current = { questions, meta, i: 0, correct: 0, points: 0, answered: false, results: [] };
  renderQuestion();
}

function renderQuestion() {
  const c = current;
  const q = c.questions[c.i];
  const src = imgSrc(q);
  const dots = c.questions.map((_, k) => {
    const r = c.results[k];
    return `<i class="${r === true ? 'ok' : r === false ? 'bad' : k === c.i ? 'cur' : ''}"></i>`;
  }).join('');
  show(`
    <button class="x" data-close aria-label="Закрыть">✕</button>
    <div class="q-top">
      <div class="muted q-meta">${esc(c.meta.title)}</div>
      <div class="dots">${dots}</div>
    </div>
    <div class="q-sub muted">Вопрос ${c.i + 1} из ${c.questions.length} · Билет ${q.ticket}, вопрос ${q.num} <span class="pts">+${c.points} ❄</span></div>
    ${src ? `<img class="q-img" src="${src}" alt="Картинка к вопросу">` : '<div class="q-noimg">Вопрос без картинки</div>'}
    <h3 class="q-text">${esc(q.q)}</h3>
    <div class="answers">
      ${q.a.map((a, k) => `<button class="ans" data-a="${k}"><span class="n">${k + 1}</span><span>${esc(a)}</span></button>`).join('')}
    </div>
    <div class="explain" hidden></div>
    <div class="row next-row" hidden><button class="btn primary" data-next>Дальше ➜</button></div>`);
  panel.querySelector('[data-close]').onclick = () => { current = null; close(); };
  panel.querySelectorAll('[data-a]').forEach(b => b.onclick = () => answer(+b.dataset.a));
  panel.querySelector('[data-next]').onclick = next;
  c.answered = false;
  keyHandler = (e) => {
    const n = parseInt(e.key, 10);
    if (!c.answered && n >= 1 && n <= q.a.length) answer(n - 1);
    else if (c.answered && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); next(); }
  };
}

function answer(k) {
  const c = current;
  if (c.answered) return;
  c.answered = true;
  const q = c.questions[c.i];
  const ok = k === q.c;
  const id = qid(q);
  progress.answered++;
  const btns = panel.querySelectorAll('.ans');
  btns.forEach((b, j) => {
    b.disabled = true;
    if (j === q.c) b.classList.add('right');
    if (j === k && !ok) b.classList.add('wrong');
  });
  if (ok) {
    progress.correct++;
    progress.streak++;
    progress.bestStreak = Math.max(progress.bestStreak, progress.streak);
    const pts = 10 + Math.min(progress.streak, 10);
    c.points += pts;
    c.correct++;
    progress.errors = progress.errors.filter(e => e !== id);
    sfx('correct');
  } else {
    progress.streak = 0;
    if (!progress.errors.includes(id)) progress.errors.push(id);
    sfx('wrong');
  }
  c.results[c.i] = ok;
  progress.score += ok ? 10 + Math.min(progress.streak, 10) : 0;
  save();
  hooks.onAnswer?.(ok);
  const ex = panel.querySelector('.explain');
  ex.hidden = false;
  ex.className = `explain ${ok ? 'good' : 'bad'}`;
  ex.innerHTML = `<b>${ok ? '✅ Верно!' : `❌ Неверно. Правильный ответ: ${q.c + 1}`}</b><p>${esc(q.e)}</p>`;
  panel.querySelector('.next-row').hidden = false;
  panel.querySelector('[data-next]').focus({ preventScroll: true });
  const dots = panel.querySelectorAll('.dots i');
  dots[c.i].className = ok ? 'ok' : 'bad';
  panel.querySelector('.pts').textContent = `+${c.points} ❄`;
  ex.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

function next() {
  const c = current;
  sfx('click');
  if (c.i + 1 < c.questions.length) { c.i++; renderQuestion(); return; }
  finish();
}

function finish() {
  const c = current;
  current = null;
  const n = c.questions.length;
  const errors = n - c.correct;
  let passed, perfect, bonus = 0, themeComplete = false, headline;
  if (c.meta.kind === 'set') {
    const key = `${THEMES[c.meta.ti].id}:${c.meta.k}`;
    const wasComplete = themeStats(c.meta.ti).complete;
    progress.best[key] = Math.max(progress.best[key] ?? -1, c.correct);
    passed = errors <= 1;
    perfect = errors === 0;
    if (passed) bonus += 20;
    if (perfect) bonus += 30;
    themeComplete = !wasComplete && themeStats(c.meta.ti).complete;
    if (themeComplete) bonus += 100;
    headline = themeComplete ? '🏆 Тема пройдена целиком!' : perfect ? '🌟 Без единой ошибки!' : passed ? '🎉 Мини-тема пройдена!' : '😅 Почти! Попробуй ещё раз';
  } else if (c.meta.kind === 'exam') {
    passed = errors <= 2;
    perfect = errors === 0;
    if (passed) { bonus += 200; progress.examsPassed++; }
    headline = passed ? '🎓 Экзамен сдан!' : '📚 Экзамен не сдан — ещё чуть-чуть потренируйся';
  } else {
    passed = c.correct > 0;
    perfect = errors === 0;
    bonus = c.correct * 5;
    headline = perfect ? '💪 Все ошибки исправлены!' : `Исправлено ${c.correct} из ${n}`;
  }
  progress.score += bonus;
  save();
  hooks.onProgress?.();
  const total = c.points + bonus;
  const dance = passed && c.meta.kind !== 'errors' || perfect;
  if (passed || perfect) sfx('fanfare');
  show(`
    <div class="result">
      <h2>${headline}</h2>
      <div class="score-big">${c.correct} / ${n}</div>
      <div class="dots big">${c.results.map(r => `<i class="${r ? 'ok' : 'bad'}"></i>`).join('')}</div>
      <p>Очки: <b>+${total} ❄</b>${bonus ? ` (бонус ${bonus})` : ''}</p>
      ${dance ? `<p class="muted">Сейчас будет ${perfect || themeComplete ? 'большой танец с друзьями' : 'мини-танец'}! 🕺</p>` : ''}
      <div class="row">
        ${dance ? '<button class="btn primary" data-dance>🕺 Танцуем!</button>' : ''}
        ${!passed && c.meta.kind !== 'errors' ? '<button class="btn primary" data-retry>🔁 Ещё раз</button>' : ''}
        ${c.meta.kind === 'set' ? '<button class="btn" data-theme>К теме</button>' : ''}
        <button class="btn" data-close>В игру</button>
      </div>
    </div>`);
  const result = { passed, perfect, themeComplete, points: total, kind: c.meta.kind, ti: c.meta.ti };
  const go = (fn) => () => { keyHandler = null; fn(); };
  panel.querySelector('[data-close]').onclick = go(() => close());
  // танец запускается при закрытии окна (кнопкой, крестиком или Esc)
  panel.querySelector('[data-dance]')?.addEventListener('click', go(() => close()));
  panel.querySelector('[data-retry]')?.addEventListener('click', go(() => runQuiz(c.meta.kind === 'exam' ? shuffle([...QUESTIONS.values()]).slice(0, 20) : c.questions, c.meta)));
  panel.querySelector('[data-theme]')?.addEventListener('click', go(() => { hooks.onPendingDance?.(null); openTheme(c.meta.ti); }));
  keyHandler = (e) => { if (e.key === 'Enter') (panel.querySelector('[data-dance]') || panel.querySelector('[data-retry]') || panel.querySelector('[data-close]')).click(); };
  hooks.onPendingDance?.(dance ? result : null);
}
