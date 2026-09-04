"use strict";

// EASY-TO-EDIT SAMPLE WORKOUTS
// Change the names or exercise arrays below, then reload the app.
// Once customized in the app, your saved local version takes priority.
const SAMPLE_WORKOUTS = [
  { id: "push", name: "Push", exercises: ["Chest Press", "Tricep Press", "Overhead Press", "Front Squat"] },
  { id: "pull", name: "Pull", exercises: ["Deadlift", "Bent-Over Row", "Bicep Curl", "Calf Raise"] },
  { id: "total", name: "Total Body", exercises: ["Chest Press", "Deadlift", "Overhead Press", "Bent-Over Row", "Front Squat"] }
];

const KEYS = { workouts: "x3-workouts-v1", history: "x3-history-v1" };
const BANDS = ["White", "Light Gray", "Dark Gray", "Black"];
const app = document.querySelector("#app");
let workouts = load(KEYS.workouts, SAMPLE_WORKOUTS);
let history = load(KEYS.history, []);
let session = null;
let timer = { remaining: 240, running: false, endAt: null, interval: null };

function load(key, fallback) {
  try { return JSON.parse(localStorage.getItem(key)) ?? structuredClone(fallback); }
  catch { return structuredClone(fallback); }
}
function save(key, value) { localStorage.setItem(key, JSON.stringify(value)); }
function esc(value) { return String(value).replace(/[&<>'"]/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;","'":"&#39;",'"':"&quot;"}[c])); }
function uid() { return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`; }
function fmtDate(iso) { return new Intl.DateTimeFormat(undefined, { dateStyle: "medium", timeStyle: "short" }).format(new Date(iso)); }
function fmtDuration(ms) { const m = Math.max(1, Math.round(ms / 60000)); return `${m} min`; }
function header(title, back = "home") { return `<div class="topbar"><button class="btn btn-icon" data-go="${back}" aria-label="Go back">‹</button><h2>${esc(title)}</h2></div>`; }
function toast(message) { const el = document.createElement("div"); el.className = "toast"; el.textContent = message; document.body.append(el); setTimeout(() => el.remove(), 1800); }

function renderHome() {
  stopTimerLoop();
  app.innerHTML = `<section class="screen home">
    <div class="eyebrow">Fast. Focused. Local.</div>
    <h1>X3 Workout<br>Tracker</h1>
    <p class="muted">Everything stays on this device.</p>
    <div class="stack home-actions">
      <button class="btn btn-primary" data-go="setup">Start Workout</button>
      <button class="btn" data-go="history">Workout History</button>
      <button class="btn" data-go="progress">Progress</button>
    </div>
    <div class="data-tools">
      <button class="text-button" data-action="export-data">Export Data</button>
      <span aria-hidden="true">·</span>
      <button class="text-button" data-action="choose-import">Import Data</button>
      <input id="importFile" class="visually-hidden" type="file" accept=".json,application/json" aria-label="Select X3 workout backup">
    </div>
  </section>`;
}

function exportData() {
  const data = {};
  for (let i = 0; i < localStorage.length; i += 1) {
    const key = localStorage.key(i);
    if (key && key.startsWith("x3-")) data[key] = localStorage.getItem(key);
  }
  const backup = { app: "X3 Workout Tracker", version: 1, exportedAt: new Date().toISOString(), data };
  const blob = new Blob([JSON.stringify(backup, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url; link.download = "x3-workout-backup.json";
  document.body.append(link); link.click(); link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
  toast("Backup downloaded");
}

async function importData(file) {
  if (!file) return;
  try {
    const backup = JSON.parse(await file.text());
    if (backup?.app !== "X3 Workout Tracker" || backup?.version !== 1 || !backup.data || typeof backup.data !== "object") {
      throw new Error("invalid");
    }
    const entries = Object.entries(backup.data).filter(([key, value]) => key.startsWith("x3-") && typeof value === "string");
    if (!entries.length) throw new Error("empty");
    entries.forEach(([, value]) => JSON.parse(value));
    if (!confirm("Import this backup and overwrite the X3 data currently on this device?")) return;
    entries.forEach(([key, value]) => localStorage.setItem(key, value));
    workouts = load(KEYS.workouts, SAMPLE_WORKOUTS);
    history = load(KEYS.history, []);
    renderHome();
    toast("Data imported successfully");
  } catch {
    alert("This file is not a valid X3 Workout Tracker backup. No data was changed.");
  } finally {
    const input = document.querySelector("#importFile");
    if (input) input.value = "";
  }
}

function renderSetup() {
  app.innerHTML = `<section class="screen">${header("Choose workout")}
    <div class="stack">${workouts.map(w => `<button class="btn card workout-option" data-workout="${w.id}"><span><strong>${esc(w.name)}</strong><small>${w.exercises.length} exercises</small></span><span>›</span></button>`).join("")}</div>
    <div class="spacer"></div>
    <button class="btn" data-go="edit">Edit workout list</button>
  </section>`;
}

function selectWorkout(id) {
  const workout = workouts.find(w => w.id === id);
  session = { id: uid(), workoutId: id, workoutName: workout.name, startedAt: new Date().toISOString(), exerciseIndex: 0, sets: [], selectedBands: [] };
  renderExercise();
}

function renderExercise() {
  const workout = workouts.find(w => w.id === session.workoutId);
  const exercise = workout.exercises[session.exerciseIndex];
  const previous = getPreviousResult(session.workoutName, exercise);
  app.innerHTML = `<section class="screen">
    <div class="topbar"><button class="btn btn-icon" data-action="cancel" aria-label="Cancel workout">×</button><div class="muted center">${session.exerciseIndex + 1} / ${workout.exercises.length}</div><div style="width:48px"></div></div>
    <h2 class="exercise-title">${esc(exercise)}</h2>
    <div class="selected-bands" id="selectedBands">Choose 1–3 bands</div>
    <div class="band-grid">${BANDS.map(b => `<button class="btn band" data-band="${b}" aria-pressed="false">${b}</button>`).join("")}</div>
    <div class="reps-control">
      <button class="btn" data-reps="-1" aria-label="Decrease reps">−</button>
      <input id="reps" class="reps-input" type="number" inputmode="numeric" min="0" max="999" value="10" aria-label="Repetitions">
      <button class="btn" data-reps="1" aria-label="Increase reps">+</button>
    </div>
    <div class="previous-result">
      <span>Previous result</span>
      <strong>${previous ? `${previous.reps} reps · ${esc(previous.bands.join(" + "))}` : "No previous result"}</strong>
    </div>
    <button class="btn btn-primary save-set" data-action="save-set">Save Set</button>
  </section>`;
  updateBandUI();
}

function getPreviousResult(workoutName, exercise) {
  const priorWorkout = history.find(item => item.workoutName === workoutName);
  if (!priorWorkout) return null;
  return [...priorWorkout.sets].reverse().find(set => set.exercise === exercise) || null;
}

function toggleBand(band) {
  const at = session.selectedBands.indexOf(band);
  if (at >= 0) session.selectedBands.splice(at, 1);
  else if (session.selectedBands.length < 3) session.selectedBands.push(band);
  else return toast("Maximum 3 bands");
  updateBandUI();
}
function updateBandUI() {
  document.querySelectorAll(".band").forEach(el => {
    const active = session.selectedBands.includes(el.dataset.band);
    el.classList.toggle("active", active); el.setAttribute("aria-pressed", active);
  });
  const label = document.querySelector("#selectedBands");
  if (label) label.textContent = session.selectedBands.length ? session.selectedBands.join(" + ") : "Choose 1–3 bands";
}
function changeReps(delta) {
  const input = document.querySelector("#reps");
  input.value = Math.min(999, Math.max(0, (parseInt(input.value, 10) || 0) + delta));
}

function saveSet() {
  if (!session.selectedBands.length) return toast("Choose at least 1 band");
  const reps = Math.min(999, Math.max(0, parseInt(document.querySelector("#reps").value, 10) || 0));
  const workout = workouts.find(w => w.id === session.workoutId);
  session.sets.push({ exercise: workout.exercises[session.exerciseIndex], bands: [...session.selectedBands], reps, savedAt: new Date().toISOString() });
  startRest();
}

function startRest() {
  timer.remaining = 240; timer.running = true; timer.endAt = Date.now() + 240000;
  renderTimer(); startTimerLoop();
}
function renderTimer() {
  const mins = Math.floor(timer.remaining / 60);
  const secs = timer.remaining % 60;
  const done = timer.remaining <= 0;
  app.innerHTML = `<section class="screen timer-screen">
    <div class="eyebrow">${done ? "Rest complete" : "Rest"}</div>
    <div class="timer ${done ? "done" : ""}" id="timerDisplay">${mins}:${String(secs).padStart(2, "0")}</div>
    ${done ? `<button class="btn btn-primary save-set" data-action="next">Next Exercise</button>` : `<div class="timer-actions">
      <button class="btn" data-action="pause">${timer.running ? "Pause" : "Resume"}</button>
      <button class="btn" data-action="reset-timer">Reset</button>
      <button class="btn" data-action="skip">Skip</button>
    </div>`}
  </section>`;
}
function startTimerLoop() {
  stopTimerLoop();
  timer.interval = setInterval(() => {
    if (!timer.running) return;
    timer.remaining = Math.max(0, Math.ceil((timer.endAt - Date.now()) / 1000));
    const display = document.querySelector("#timerDisplay");
    if (display) display.textContent = `${Math.floor(timer.remaining / 60)}:${String(timer.remaining % 60).padStart(2, "0")}`;
    if (timer.remaining === 0) { timer.running = false; stopTimerLoop(); alertUser(); renderTimer(); }
  }, 250);
}
function stopTimerLoop() { if (timer.interval) clearInterval(timer.interval); timer.interval = null; }
function pauseTimer() {
  if (timer.running) { timer.remaining = Math.max(0, Math.ceil((timer.endAt - Date.now()) / 1000)); timer.running = false; stopTimerLoop(); }
  else { timer.running = true; timer.endAt = Date.now() + timer.remaining * 1000; startTimerLoop(); }
  renderTimer();
}
function resetTimer() { timer.remaining = 240; timer.running = true; timer.endAt = Date.now() + 240000; renderTimer(); startTimerLoop(); }
function skipTimer() { timer.remaining = 0; timer.running = false; stopTimerLoop(); renderTimer(); }
function alertUser() {
  if (navigator.vibrate) navigator.vibrate([250, 100, 250]);
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const oscillator = ctx.createOscillator(); const gain = ctx.createGain();
    oscillator.connect(gain); gain.connect(ctx.destination); oscillator.frequency.value = 880; gain.gain.value = .12;
    oscillator.start(); oscillator.stop(ctx.currentTime + .45);
  } catch { /* Browser blocked audio; vibration may still work. */ }
}

function nextExercise() {
  const workout = workouts.find(w => w.id === session.workoutId);
  session.exerciseIndex += 1; session.selectedBands = [];
  if (session.exerciseIndex >= workout.exercises.length) finishWorkout(); else renderExercise();
}
function finishWorkout() {
  const completed = { id: session.id, workoutName: session.workoutName, startedAt: session.startedAt, endedAt: new Date().toISOString(), sets: session.sets };
  history.unshift(completed); save(KEYS.history, history); session = null;
  app.innerHTML = `<section class="screen timer-screen"><div class="eyebrow">Workout saved</div><h1>Done.</h1><p class="muted">Strong work.</p><button class="btn btn-primary" data-go="home">Home</button></section>`;
}
function cancelWorkout() { if (confirm("End this workout without saving?")) { session = null; renderHome(); } }

function renderHistory() {
  app.innerHTML = `<section class="screen">${header("Workout history")}
    ${history.length ? history.map(h => `<article class="card history-card">
      <div class="history-head"><div><h3>${esc(h.workoutName)}</h3><div class="muted">${fmtDate(h.startedAt)}</div></div><button class="btn btn-small btn-danger" data-delete-history="${h.id}">Delete</button></div>
      ${h.sets.map(s => `<div class="set-line"><span><strong>${esc(s.exercise)}</strong><br><small class="muted">${esc(s.bands.join(" + "))}</small></span><span><strong>${s.reps}</strong> reps</span></div>`).join("")}
      <div class="muted" style="margin-top:12px">Total duration: ${fmtDuration(new Date(h.endedAt) - new Date(h.startedAt))}</div>
    </article>`).join("") : `<div class="empty">No workouts saved yet.</div>`}
  </section>`;
}
function deleteHistory(id) { if (confirm("Delete this workout?")) { history = history.filter(h => h.id !== id); save(KEYS.history, history); renderHistory(); } }

function allSets() { return history.flatMap(h => h.sets.map(s => ({ ...s, workoutDate: h.startedAt }))); }
function renderProgress(selected) {
  const names = [...new Set([...workouts.flatMap(w => w.exercises), ...allSets().map(s => s.exercise)])].sort();
  const exercise = selected || names[0] || "";
  const sets = allSets().filter(s => s.exercise === exercise).sort((a,b) => new Date(a.savedAt || a.workoutDate) - new Date(b.savedAt || b.workoutDate));
  const reps = sets.map(s => s.reps);
  const combos = sets.reduce((acc, s) => { const key = s.bands.join(" + "); acc[key] = (acc[key] || 0) + 1; return acc; }, {});
  const common = Object.entries(combos).sort((a,b) => b[1] - a[1])[0]?.[0] || "—";
  app.innerHTML = `<section class="screen">${header("Progress")}
    <label for="exerciseSelect">Exercise</label>
    <select id="exerciseSelect" class="field">${names.map(n => `<option ${n === exercise ? "selected" : ""}>${esc(n)}</option>`).join("")}</select>
    <div class="stats">
      <div class="stat"><strong>${reps.length ? Math.max(...reps) : "—"}</strong><span>Highest reps</span></div>
      <div class="stat"><strong>${reps.length ? reps.at(-1) : "—"}</strong><span>Most recent</span></div>
      <div class="stat"><strong>${reps.length ? (reps.reduce((a,b) => a+b, 0) / reps.length).toFixed(1) : "—"}</strong><span>Average reps</span></div>
      <div class="stat stat-wide"><strong style="font-size:1.1rem">${esc(common)}</strong><span>Most used bands</span></div>
    </div>
    <div class="chart-wrap"><canvas id="progressChart" aria-label="Reps over time line graph"></canvas></div>
    ${sets.length ? "" : `<p class="empty">Complete this exercise to see progress.</p>`}
  </section>`;
  requestAnimationFrame(() => drawChart(sets));
}
function drawChart(sets) {
  const canvas = document.querySelector("#progressChart"); if (!canvas) return;
  const rect = canvas.getBoundingClientRect(); const dpr = window.devicePixelRatio || 1;
  canvas.width = rect.width * dpr; canvas.height = rect.height * dpr;
  const ctx = canvas.getContext("2d"); ctx.scale(dpr, dpr);
  const w = rect.width, h = rect.height, pad = { l: 38, r: 15, t: 20, b: 32 };
  ctx.strokeStyle = "#2c3437"; ctx.fillStyle = "#9aa4a7"; ctx.font = "12px system-ui"; ctx.lineWidth = 1;
  const max = Math.max(10, ...sets.map(s => s.reps));
  for (let i = 0; i <= 4; i++) { const y = pad.t + (h-pad.t-pad.b) * i/4; ctx.beginPath(); ctx.moveTo(pad.l,y); ctx.lineTo(w-pad.r,y); ctx.stroke(); const label = Math.round(max*(1-i/4)); ctx.fillText(label, 4, y+4); }
  if (!sets.length) return;
  const x = i => sets.length === 1 ? (pad.l+w-pad.r)/2 : pad.l + (w-pad.l-pad.r)*i/(sets.length-1);
  const y = v => pad.t + (h-pad.t-pad.b)*(1-v/max);
  ctx.strokeStyle = "#d8ff3e"; ctx.lineWidth = 4; ctx.lineJoin = "round"; ctx.beginPath();
  sets.forEach((s,i) => i ? ctx.lineTo(x(i),y(s.reps)) : ctx.moveTo(x(i),y(s.reps))); ctx.stroke();
  sets.forEach((s,i) => { ctx.fillStyle="#d8ff3e"; ctx.beginPath(); ctx.arc(x(i),y(s.reps),5,0,Math.PI*2); ctx.fill(); });
  ctx.fillStyle="#9aa4a7"; ctx.textAlign="center";
  const indexes = sets.length === 1 ? [0] : [0, sets.length-1];
  indexes.forEach(i => ctx.fillText(new Date(sets[i].savedAt || sets[i].workoutDate).toLocaleDateString(undefined,{month:"short",day:"numeric"}), x(i), h-8));
}

function renderEditor() {
  app.innerHTML = `<section class="screen">${header("Edit workouts", "setup")}
    <p class="muted">One exercise per line.</p>
    <div id="editorList">${workouts.map(w => `<article class="card editor-item"><strong>${esc(w.name)}</strong><div class="muted">${esc(w.exercises.join(", "))}</div><div class="editor-actions"><button class="btn" data-edit-workout="${w.id}">Edit</button><button class="btn btn-danger" data-delete-workout="${w.id}">Delete</button></div></article>`).join("")}</div>
    <button class="btn btn-primary" data-action="add-workout">Add workout</button>
  </section>`;
}
function editWorkout(id) {
  const w = workouts.find(item => item.id === id) || { id: uid(), name: "", exercises: [] };
  app.innerHTML = `<section class="screen">${header(id ? "Edit workout" : "New workout", "edit")}
    <form id="workoutForm" data-id="${w.id}">
      <label for="workoutName">Workout name</label><input class="field" id="workoutName" required maxlength="60" value="${esc(w.name)}">
      <label for="exerciseNames">Exercises</label><textarea class="field" id="exerciseNames" required placeholder="One exercise per line">${esc(w.exercises.join("\n"))}</textarea>
      <button class="btn btn-primary" style="width:100%;margin-top:18px">Save workout</button>
    </form>
  </section>`;
}
function saveWorkout(form) {
  const name = document.querySelector("#workoutName").value.trim();
  const exercises = document.querySelector("#exerciseNames").value.split("\n").map(x => x.trim()).filter(Boolean);
  if (!name || !exercises.length) return;
  const id = form.dataset.id; const index = workouts.findIndex(w => w.id === id);
  const item = { id, name, exercises };
  if (index >= 0) workouts[index] = item; else workouts.push(item);
  save(KEYS.workouts, workouts); renderEditor();
}
function deleteWorkout(id) { if (confirm("Delete this workout from the list?")) { workouts = workouts.filter(w => w.id !== id); save(KEYS.workouts, workouts); renderEditor(); } }

app.addEventListener("click", e => {
  const target = e.target.closest("button"); if (!target) return;
  const go = target.dataset.go;
  if (go === "home") renderHome(); if (go === "setup") renderSetup(); if (go === "history") renderHistory(); if (go === "progress") renderProgress(); if (go === "edit") renderEditor();
  if (target.dataset.workout) selectWorkout(target.dataset.workout);
  if (target.dataset.band) toggleBand(target.dataset.band);
  if (target.dataset.reps) changeReps(Number(target.dataset.reps));
  if (target.dataset.deleteHistory) deleteHistory(target.dataset.deleteHistory);
  if (target.dataset.editWorkout) editWorkout(target.dataset.editWorkout);
  if (target.dataset.deleteWorkout) deleteWorkout(target.dataset.deleteWorkout);
  const action = target.dataset.action;
  if (action === "save-set") saveSet(); if (action === "pause") pauseTimer(); if (action === "reset-timer") resetTimer(); if (action === "skip") skipTimer();
  if (action === "next") nextExercise(); if (action === "cancel") cancelWorkout(); if (action === "add-workout") editWorkout(null);
  if (action === "export-data") exportData();
  if (action === "choose-import") document.querySelector("#importFile")?.click();
});
app.addEventListener("change", e => {
  if (e.target.id === "exerciseSelect") renderProgress(e.target.value);
  if (e.target.id === "importFile") importData(e.target.files?.[0]);
});
app.addEventListener("submit", e => { if (e.target.id === "workoutForm") { e.preventDefault(); saveWorkout(e.target); } });
window.addEventListener("resize", () => { const select = document.querySelector("#exerciseSelect"); if (select) renderProgress(select.value); });

renderHome();

if ("serviceWorker" in navigator && location.protocol !== "file:") {
  window.addEventListener("load", () => navigator.serviceWorker.register("./service-worker.js").catch(() => {}));
}
