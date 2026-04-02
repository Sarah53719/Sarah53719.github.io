/* ─── HELPERS ─── */
const pad = n => String(n).padStart(2,'0');
const escHtml = s => s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
const DAYS   = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];

/* ═══════════════════════════════════
   TO-DO
═══════════════════════════════════ */
let todos = JSON.parse(localStorage.getItem('todos') || '[]');
let todoFilter = 'all';

function saveTodos() { localStorage.setItem('todos', JSON.stringify(todos)); }

function addTodo() {
  const inp = document.getElementById('todo-input');
  const text = inp.value.trim();
  if (!text) return;
  todos.unshift({ id: Date.now(), text, done: false });
  inp.value = '';
  saveTodos(); renderTodos();
}

document.getElementById('todo-input').addEventListener('keydown', e => { if (e.key === 'Enter') addTodo(); });

function toggleTodo(id) {
  todos = todos.map(t => t.id === id ? {...t, done: !t.done} : t);
  saveTodos(); renderTodos();
}

function deleteTodo(id) {
  todos = todos.filter(t => t.id !== id);
  saveTodos(); renderTodos();
}

function clearDone() {
  todos = todos.filter(t => !t.done);
  saveTodos(); renderTodos();
}

function setFilter(btn, filter) {
  todoFilter = filter;
  document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  renderTodos();
}

function renderTodos() {
  const list = document.getElementById('todo-list');
  let filtered = todos;
  if (todoFilter === 'active') filtered = todos.filter(t => !t.done);
  if (todoFilter === 'done')   filtered = todos.filter(t =>  t.done);

  list.innerHTML = filtered.map(t => `
    <li class="todo-item ${t.done ? 'done' : ''}">
      <div class="todo-check" onclick="toggleTodo(${t.id})">${t.done ? '✓' : ''}</div>
      <span class="todo-text">${escHtml(t.text)}</span>
      <button class="todo-del" onclick="deleteTodo(${t.id})">✕</button>
    </li>
  `).join('') || '<li style="font-size:.75rem;color:var(--muted);padding:8px 0">Nothing here yet…</li>';

  const active = todos.filter(t => !t.done).length;
  document.getElementById('todo-count').textContent = `${active} remaining · ${todos.length - active} done`;
}

renderTodos();

/* ═══════════════════════════════════
   CLOCK
═══════════════════════════════════ */
function updateClock() {
  const now = new Date();
  let h = now.getHours();
  const m = now.getMinutes(), s = now.getSeconds();
  const ampm = h >= 12 ? 'PM' : 'AM';
  h = h % 12 || 12;
  document.getElementById('clock-hm').textContent   = `${pad(h)}:${pad(m)}`;
  document.getElementById('clock-s').textContent    = `:${pad(s)}`;
  document.getElementById('clock-ampm').textContent = ampm;
  document.getElementById('clock-date').textContent =
    `${DAYS[now.getDay()]}, ${MONTHS[now.getMonth()]} ${now.getDate()}, ${now.getFullYear()}`;
}
setInterval(updateClock, 1000);
updateClock();

/* ═══════════════════════════════════
   HORO TIMER
═══════════════════════════════════ */
let horoFocusMins = 25, horoBreakMins = 5;
let horoSecondsLeft = horoFocusMins * 60;
let horoTotalSeconds = horoFocusMins * 60;
let horoRunning = false;
let horoInterval = null;
let horoIsBreak = false;
let horoSessionCount = 1;
const ARC_R = 50, ARC_C = 2 * Math.PI * ARC_R; // circumference ≈ 314.16

function horoPreset(btn, focus, brk) {
  document.querySelectorAll('.preset-btn').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  horoFocusMins = focus; horoBreakMins = brk;
  horoReset();
}

function horoToggle() {
  if (!horoRunning) {
    horoRunning = true;
    document.getElementById('horo-btn').textContent = 'Pause';
    horoInterval = setInterval(horoTick, 1000);
  } else {
    horoRunning = false;
    document.getElementById('horo-btn').textContent = 'Resume';
    clearInterval(horoInterval);
  }
}

function horoTick() {
  if (horoSecondsLeft <= 0) {
    horoBeep();
    horoIsBreak = !horoIsBreak;
    if (!horoIsBreak) horoSessionCount++;
    horoTotalSeconds  = (horoIsBreak ? horoBreakMins : horoFocusMins) * 60;
    horoSecondsLeft   = horoTotalSeconds;
  } else {
    horoSecondsLeft--;
  }
  horoRender();
}

function horoSkip() {
  horoIsBreak = !horoIsBreak;
  if (!horoIsBreak) horoSessionCount++;
  horoTotalSeconds = (horoIsBreak ? horoBreakMins : horoFocusMins) * 60;
  horoSecondsLeft  = horoTotalSeconds;
  horoRender();
}

function horoReset() {
  clearInterval(horoInterval);
  horoRunning = false; horoIsBreak = false; horoSessionCount = 1;
  horoTotalSeconds = horoFocusMins * 60;
  horoSecondsLeft  = horoTotalSeconds;
  document.getElementById('horo-btn').textContent = 'Start';
  horoRender();
}

function horoRender() {
  const mm = Math.floor(horoSecondsLeft / 60);
  const ss = horoSecondsLeft % 60;
  document.getElementById('horo-display').textContent = `${pad(mm)}:${pad(ss)}`;

  const arc = document.getElementById('horo-arc');
  const progress = horoSecondsLeft / horoTotalSeconds;
  const offset = ARC_C * (1 - progress);
  arc.style.strokeDashoffset = offset;
  arc.style.strokeDasharray  = ARC_C;

  const isBreak = horoIsBreak;
  arc.classList.toggle('break-mode', isBreak);
  document.getElementById('horo-display').classList.toggle('break-mode', isBreak);
  document.getElementById('horo-mode-label').textContent = isBreak ? 'break' : 'focus';
  document.getElementById('horo-sessions').textContent   =
    `Session ${horoSessionCount} · ${isBreak ? 'Break' : 'Focus'} · ${horoFocusMins}/${horoBreakMins} min`;
}

function horoBeep() {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain); gain.connect(ctx.destination);
    osc.frequency.value = horoIsBreak ? 440 : 660;
    osc.type = 'sine';
    gain.gain.setValueAtTime(0.4, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.8);
    osc.start(); osc.stop(ctx.currentTime + 0.8);
  } catch(e) {}
}

horoRender();

/* ═══════════════════════════════════
   WORK SESSION CHECKLIST
═══════════════════════════════════ */
let sessionBlocks = JSON.parse(localStorage.getItem('session-blocks') || '[]');

function buildChecklist() {
  const startVal = document.getElementById('sess-start').value || '09:00';
  const numBlocks = Math.max(1, Math.min(16, parseInt(document.getElementById('sess-blocks').value) || 6));
  const [startH, startM] = startVal.split(':').map(Number);

  sessionBlocks = [];
  let cursor = startH * 60 + startM; // minutes from midnight

  for (let i = 0; i < numBlocks; i++) {
    const workStart = fmtTime(cursor);
    cursor += 60;
    const workEnd = fmtTime(cursor);
    sessionBlocks.push({ id: i * 2, type: 'work', label: `Work block ${i+1}`, start: workStart, end: workEnd, checked: false });

    if (i < numBlocks - 1) {
      const breakStart = fmtTime(cursor);
      cursor += 10;
      const breakEnd = fmtTime(cursor);
      sessionBlocks.push({ id: i * 2 + 1, type: 'break', label: `Break`, start: breakStart, end: breakEnd, checked: false });
    }
  }
  saveSession(); renderChecklist();
}

function fmtTime(mins) {
  const h = Math.floor(mins / 60) % 24;
  const m = mins % 60;
  const ampm = h >= 12 ? 'PM' : 'AM';
  const h12 = h % 12 || 12;
  return `${pad(h12)}:${pad(m)} ${ampm}`;
}

function toggleSession(id) {
  sessionBlocks = sessionBlocks.map(b => b.id === id ? {...b, checked: !b.checked} : b);
  saveSession(); renderChecklist();
}

function saveSession() { localStorage.setItem('session-blocks', JSON.stringify(sessionBlocks)); }

function renderChecklist() {
  const list = document.getElementById('session-list');
  if (!sessionBlocks.length) {
    list.innerHTML = '<div style="font-size:.72rem;color:var(--muted);padding:8px 0">Set a start time and click Build →</div>';
    return;
  }
  list.innerHTML = sessionBlocks.map(b => `
    <div class="session-block ${b.type === 'work' ? 'work-block' : 'break-block'} ${b.checked ? 'checked' : ''}"
         onclick="toggleSession(${b.id})">
      <div class="sb-check">${b.checked ? '✓' : ''}</div>
      <span class="sb-label">${b.label}</span>
      <span class="sb-time">${b.start} – ${b.end}</span>
    </div>
  `).join('');
}

// Load saved session on start
if (sessionBlocks.length) renderChecklist();
else renderChecklist();

/* ═══════════════════════════════════
   PLANNER
═══════════════════════════════════ */
let plannerDate  = new Date();
let selectedDate = new Date();
let events = JSON.parse(localStorage.getItem('planner-events') || '{}');

function saveEvents() { localStorage.setItem('planner-events', JSON.stringify(events)); }
function dateKey(d) { return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}`; }

function changeMonth(dir) {
  plannerDate = new Date(plannerDate.getFullYear(), plannerDate.getMonth() + dir, 1);
  renderCalendar();
}

function renderCalendar() {
  const year = plannerDate.getFullYear(), month = plannerDate.getMonth();
  document.getElementById('month-label').textContent = `${MONTHS[month]} ${year}`;

  const grid = document.getElementById('cal-grid');
  grid.innerHTML = '';

  ['Su','Mo','Tu','We','Th','Fr','Sa'].forEach(d => {
    const el = document.createElement('div');
    el.className = 'cal-day-name';
    el.textContent = d;
    grid.appendChild(el);
  });

  const firstDay    = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const daysInPrev  = new Date(year, month, 0).getDate();
  const today       = new Date();

  for (let i = firstDay - 1; i >= 0; i--)
    addCalDay(grid, daysInPrev - i, new Date(year, month - 1, daysInPrev - i), true, today);

  for (let d = 1; d <= daysInMonth; d++)
    addCalDay(grid, d, new Date(year, month, d), false, today);

  const remaining = (7 - ((firstDay + daysInMonth) % 7)) % 7;
  for (let d = 1; d <= remaining; d++)
    addCalDay(grid, d, new Date(year, month + 1, d), true, today);
}

function addCalDay(grid, label, date, otherMonth, today) {
  const el = document.createElement('div');
  el.className = 'cal-day';
  if (otherMonth) el.classList.add('other-month');
  if (date.toDateString() === today.toDateString())        el.classList.add('today');
  if (date.toDateString() === selectedDate.toDateString()) el.classList.add('selected');
  el.textContent = label;

  const key = dateKey(date);
  if (events[key] && events[key].length > 0) {
    const dot = document.createElement('span');
    dot.className = 'event-dot';
    el.appendChild(dot);
  }

  el.addEventListener('click', () => {
    selectedDate = date;
    renderCalendar(); renderEvents();
  });

  grid.appendChild(el);
}

function addEvent() {
  const name = document.getElementById('event-input').value.trim();
  const time = document.getElementById('event-time').value;
  if (!name) return;
  const key = dateKey(selectedDate);
  if (!events[key]) events[key] = [];
  events[key].push({ id: Date.now(), name, time });
  events[key].sort((a, b) => a.time.localeCompare(b.time));
  document.getElementById('event-input').value = '';
  document.getElementById('event-time').value  = '';
  saveEvents(); renderCalendar(); renderEvents();
}

document.getElementById('event-input').addEventListener('keydown', e => { if (e.key === 'Enter') addEvent(); });

function deleteEvent(key, id) {
  events[key] = (events[key] || []).filter(e => e.id !== id);
  if (!events[key].length) delete events[key];
  saveEvents(); renderCalendar(); renderEvents();
}

function renderEvents() {
  const key = dateKey(selectedDate);
  document.getElementById('selected-date-label').textContent =
    `${MONTHS[selectedDate.getMonth()].slice(0,3)} ${selectedDate.getDate()}, ${selectedDate.getFullYear()}`;

  const dayEvents = events[key] || [];
  const nowStr    = new Date().toTimeString().slice(0,5);
  const isToday   = dateKey(selectedDate) === dateKey(new Date());
  const list      = document.getElementById('event-list');

  if (!dayEvents.length) {
    list.innerHTML = '<div class="no-events">No events — add one above</div>';
    return;
  }

  list.innerHTML = dayEvents.map(ev => {
    const past = ev.time && isToday && ev.time < nowStr;
    return `
      <div class="event-item ${past ? 'past' : ''}">
        <span class="event-time">${ev.time || '——'}</span>
        <span class="event-name">${escHtml(ev.name)}</span>
        <button class="event-del" onclick="deleteEvent('${key}',${ev.id})">✕</button>
      </div>`;
  }).join('');
}

renderCalendar();
renderEvents();