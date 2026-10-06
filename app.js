(() => {
const C = window.BW_CONFIG, MODS = window.BW_MODULES;
const DEMO = !C.SUPABASE_ANON_KEY || C.SUPABASE_ANON_KEY.includes('PASTE');
const sb = DEMO ? null : window.supabase.createClient(C.SUPABASE_URL, C.SUPABASE_ANON_KEY);
const SECTIONS = MODS.flatMap((m, mi) => m.sections.map((s, si) => ({ ...s, mod: m, mi, code: `${mi + 1}.${si + 1}` })));
const byId = Object.fromEntries(SECTIONS.map(s => [s.id, s]));
const $app = document.getElementById('app');
let user = null, profile = null, P = {};
const vidMissing = {}, quizState = {};

const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const pad = n => String(n).padStart(2, '0');
const fmtDate = d => d ? new Date(d).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' }) : '—';
function toast(msg) { const t = document.getElementById('toast'); t.textContent = msg; t.classList.add('on'); clearTimeout(toast.t); toast.t = setTimeout(() => t.classList.remove('on'), 3200); }

/* ---------- data ---------- */
const api = {
  async session() {
    if (DEMO) { const u = localStorage.getItem('bw-demo-user'); return u ? { id: 'demo-' + u, username: u } : null; }
    const { data } = await sb.auth.getSession(); const s = data.session;
    return s ? { id: s.user.id, username: s.user.email.split('@')[0] } : null;
  },
  async signIn(username, pw) {
    username = username.trim().toLowerCase();
    if (DEMO) { localStorage.setItem('bw-demo-user', username); return; }
    const email = username.includes('@') ? username : `${username}@${C.USERNAME_DOMAIN}`;
    const { error } = await sb.auth.signInWithPassword({ email, password: pw });
    if (error) throw new Error(/invalid/i.test(error.message) ? 'Username or password is incorrect.' : error.message);
  },
  async signOut() { if (DEMO) localStorage.removeItem('bw-demo-user'); else await sb.auth.signOut(); },
  async profile() {
    if (DEMO) return { username: user.username, is_admin: user.username === 'admin' };
    const { data } = await sb.from('profiles').select('*').eq('id', user.id).maybeSingle();
    return data || { username: user.username, is_admin: false };
  },
  async progress() {
    if (DEMO) return JSON.parse(localStorage.getItem('bw-demo-prog-' + user.username) || '{}');
    const { data, error } = await sb.from('progress').select('*').eq('user_id', user.id);
    if (error) { toast('Could not load your progress.'); return {}; }
    return Object.fromEntries(data.map(r => [r.section_id, r]));
  },
  async save(id, patch) {
    const row = { ...(P[id] || {}), ...patch, section_id: id, updated_at: new Date().toISOString() };
    P[id] = row;
    if (DEMO) { localStorage.setItem('bw-demo-prog-' + user.username, JSON.stringify(P)); return; }
    row.user_id = user.id;
    const { error } = await sb.from('progress').upsert(row);
    if (error) toast('Could not save — check your connection and try again.');
  },
  async setPassword(pw) {
    if (DEMO) throw new Error('Password changes are not available in demo mode.');
    const { error } = await sb.auth.updateUser({ password: pw }); if (error) throw error;
  },
  async team() {
    if (DEMO) return { profiles: [{ id: user.id, username: user.username }], progress: Object.values(P).map(r => ({ ...r, user_id: user.id })) };
    const [a, b] = await Promise.all([sb.from('profiles').select('*').order('username'), sb.from('progress').select('*')]);
    return { profiles: (a.data || []).filter(p => !p.is_admin), progress: b.data || [] };
  }
};

/* ---------- progress logic ---------- */
function steps(s, prog = P) {
  const p = prog[s.id] || {};
  const list = [{ k: 'video', label: 'Watch', done: !!p.video_done }];
  if (s.task) list.push({ k: 'task', label: 'Task', done: !!p.task_done });
  if (s.quiz && s.quiz.length) list.push({ k: 'quiz', label: 'Assessment', done: !!p.quiz_passed });
  return list;
}
const pct = (s, prog = P) => { const st = steps(s, prog); return st.filter(x => x.done).length / st.length; };
const isDone = (s, prog = P) => pct(s, prog) === 1;
const modPct = (m, prog = P) => m.sections.reduce((a, s) => a + pct(s, prog), 0) / m.sections.length;
const overall = (prog = P) => SECTIONS.reduce((a, s) => a + pct(s, prog), 0) / SECTIONS.length;
const unlocked = s => !C.SEQUENTIAL || profile?.is_admin || SECTIONS.indexOf(s) === 0 || isDone(SECTIONS[SECTIONS.indexOf(s) - 1]);
const nextUp = () => SECTIONS.find(s => !isDone(s)) || null;
const videoUrl = s => s.video || (C.VIDEO_SOURCE === 'github' ? `videos/${s.id}.mp4` : `${C.SUPABASE_URL}/storage/v1/object/public/${C.VIDEO_BUCKET}/${s.id}.mp4`);
const stateOf = s => !unlocked(s) ? 'locked' : isDone(s) ? 'done' : pct(s) > 0 ? 'progress' : 'todo';
const ICON = { locked: 'ph-lock-simple', done: 'ph-check-circle', progress: 'ph-circle-half', todo: 'ph-circle' };

function seededOrder(seed, n) {
  let h = 2166136261; for (const c of seed) h = Math.imul(h ^ c.charCodeAt(0), 16777619);
  const rnd = () => { h = Math.imul(h ^ (h >>> 15), 2246822507); h = Math.imul(h ^ (h >>> 13), 3266489909); return ((h ^= h >>> 16) >>> 0) / 4294967296; };
  const a = [...Array(n).keys()]; for (let i = n - 1; i > 0; i--) { const j = Math.floor(rnd() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a;
}

/* ---------- shell ---------- */
function shell(inner, active) {
  return `<header class="top">
    <a href="#/" class="brand"><img src="logo.svg" alt="Innovative"><span><small>Chronic Care Management</small><b>BrightWell Training</b></span></a>
    <nav class="tabs">
      <a href="#/" class="${active === 'home' ? 'on' : ''}"><i class="ph-duotone ph-graduation-cap"></i>My training</a>
      ${profile?.is_admin ? `<a href="#/team" class="${active === 'team' ? 'on' : ''}"><i class="ph-duotone ph-users-three"></i>Team progress</a>` : ''}
    </nav>
    <div class="me"><i class="ph-duotone ph-user-circle"></i><span>${esc(profile?.full_name || user.username)}</span>
      <button class="link" data-act="pw">Change password</button>
      <button class="btn ghost sm" data-act="out">Sign out</button></div>
  </header>
  ${DEMO ? `<div class="demo"><i class="ph-duotone ph-flask"></i>Demo mode — progress is saved in this browser only. Paste your Supabase key into config.js to go live. Sign in as “admin” to see the trainer view.</div>` : ''}
  <main>${inner}</main>`;
}
const meter = (v, cls = '') => `<div class="meter ${cls}"><i style="width:${Math.round(v * 100)}%"></i></div>`;
const chips = s => `<span class="chips">${steps(s).map(x => `<span class="chip ${x.done ? 'ok' : ''}">${x.done ? '<i class="ph-bold ph-check"></i>' : ''}${x.label}</span>`).join('')}</span>`;

/* ---------- login ---------- */
function renderLogin() {
  $app.innerHTML = `<div class="login">
    <div class="login-in">
      <img src="logo.svg" class="login-logo" alt="Innovative">
      <p class="kicker">Chronic Care Management · Medical Scribe program</p>
      <h1>BrightWell Training</h1>
      <form id="loginF" class="form">
        <label>Username<input name="u" autocomplete="username" required autofocus></label>
        <label>Password<input name="p" type="password" autocomplete="current-password" required></label>
        <p class="err" id="err"></p>
        <button class="btn primary lg" type="submit">Sign in<i class="ph-bold ph-arrow-right"></i></button>
      </form>
      <p class="muted">Forgot your password? Ask your trainer to reset it.</p>
      ${DEMO ? `<p class="demo-note"><i class="ph-duotone ph-flask"></i>Demo mode: any username and password will work.</p>` : ''}
    </div>
    <ol class="login-mods">${MODS.map((m, i) => `<li><span class="num">${pad(i + 1)}</span><span><b>${esc(m.title)}</b><small>${m.sections.length} sections</small></span></li>`).join('')}</ol>
  </div>`;
  document.getElementById('loginF').onsubmit = async e => {
    e.preventDefault(); const f = e.target, btn = f.querySelector('button'); btn.disabled = true;
    try { await api.signIn(f.u.value, f.p.value); user = await api.session(); await loadUser(); location.hash = '#/'; route(); }
    catch (err) { document.getElementById('err').textContent = err.message; btn.disabled = false; }
  };
}

/* ---------- home ---------- */
function renderHome() {
  const n = nextUp(), done = SECTIONS.filter(s => isDone(s)).length;
  $app.innerHTML = shell(`<div class="page">
    <section class="hero">
      <p class="kicker">Welcome, ${esc(profile?.full_name || user.username)}</p>
      <h1>Your training path</h1>
      <div class="hero-meter">${meter(overall(), 'big')}<span><b>${done}</b> of ${SECTIONS.length} sections complete · ${Math.round(overall() * 100)}%</span></div>
      ${n ? `<a class="btn primary lg" href="#/s/${n.id}">${pct(n) > 0 ? 'Continue' : 'Start'}: ${n.code} ${esc(n.title)}<i class="ph-bold ph-arrow-right"></i></a>`
          : `<p class="all-done"><i class="ph-duotone ph-seal-check"></i>You have completed the full program.</p>`}
      <p class="muted how">Each section has a short video, then a task and/or an assessment. Pass mark ${C.PASS_MARK}%.</p>
    </section>
    <section class="mods">${MODS.map((m, mi) => `<div class="mod">
      <div class="mod-head"><span class="mod-num">${pad(mi + 1)}</span><div class="mod-t"><p class="kicker">Module ${mi + 1}</p><h2>${esc(m.title)}</h2></div>
        <div class="mod-m">${meter(modPct(m))}<small>${m.sections.filter(s => isDone(s)).length} of ${m.sections.length}</small></div></div>
      <ol class="sec-list">${m.sections.map(o => { const s = byId[o.id], st = stateOf(s); const body = `<i class="ph-duotone ${ICON[st]} st"></i><span class="code">${s.code}</span><span class="t">${esc(s.title)}</span>${chips(s)}`;
        return `<li>${st === 'locked' ? `<span class="sec locked" title="Complete the previous section first">${body}</span>` : `<a class="sec ${st}" href="#/s/${s.id}">${body}</a>`}</li>`; }).join('')}</ol>
    </div>`).join('')}</section>
  </div>`, 'home');
}

/* ---------- section ---------- */
function renderSection(s) {
  const i = SECTIONS.indexOf(s), prev = SECTIONS[i - 1], next = SECTIONS[i + 1];
  const outline = `<aside class="outline">${MODS.map((m, mi) => `<div class="o-mod"><p class="kicker">${pad(mi + 1)} · ${esc(m.title)}</p>
    ${m.sections.map(o => { const x = byId[o.id], st = stateOf(x); const inner = `<i class="ph-duotone ${ICON[st]}"></i><span>${x.code} ${esc(x.title)}</span>`;
      return st === 'locked' ? `<span class="o-sec locked">${inner}</span>` : `<a class="o-sec ${x === s ? 'cur' : ''} ${st}" href="#/s/${x.id}">${inner}</a>`; }).join('')}</div>`).join('')}</aside>`;
  if (!unlocked(s)) {
    $app.innerHTML = shell(`<div class="layout">${outline}<article class="lesson"><p class="kicker">Module ${s.mi + 1} · ${esc(s.mod.title)}</p><h1>${esc(s.title)}</h1>
      <p class="locked-big"><i class="ph-duotone ph-lock-simple"></i>This section opens once you complete <a href="#/s/${prev.id}">${prev.code} ${esc(prev.title)}</a>.</p></article></div>`, 'home');
    return;
  }
  let n = 1; const nTask = s.task ? ++n : 0, nQuiz = s.quiz?.length ? ++n : 0;
  const res = s.resource ? (s.resource.url === 'PROBLEM_NOTE_LIBRARY' ? (C.PROBLEM_NOTE_LIBRARY_URL ? { ...s.resource, url: C.PROBLEM_NOTE_LIBRARY_URL } : null) : s.resource) : null;
  $app.innerHTML = shell(`<div class="layout">${outline}<article class="lesson">
    <a href="#/" class="back"><i class="ph-bold ph-arrow-left"></i>All modules</a>
    <p class="kicker">Module ${s.mi + 1} · ${esc(s.mod.title)} · Section ${s.code}</p>
    <h1>${esc(s.title)}</h1>
    <p class="lead">${esc(s.summary)}</p>
    ${res ? `<a class="res" href="${esc(res.url)}" target="_blank" rel="noopener"><i class="ph-duotone ph-book-open-text"></i>${esc(res.label)}</a>` : ''}
    <div id="tracker"></div>
    <section class="step"><h2><span class="n" id="n-video">1</span>Watch the video<small>${s.minutes ? s.minutes + ' min' : ''}</small></h2>
      <div class="video-wrap"><video id="vid" controls preload="metadata" playsinline controlslist="nodownload" src="${esc(videoUrl(s))}"></video>
        <div id="vidmsg" class="vidmsg" hidden><i class="ph-duotone ph-film-slate"></i><b>Video coming soon</b><span>The task and assessment are open in the meantime.</span>${DEMO ? '<button class="btn ghost sm" data-act="demo-watch">Mark as watched (demo)</button>' : ''}</div></div>
      <div class="vbar">${meter(0)}<span id="vtxt"></span></div>
      <p class="muted small">You can rewind at any time. Skipping ahead opens once you have watched the video through.</p>
    </section>
    ${nTask ? `<section class="step" id="taskBox" data-n="${nTask}"></section>` : ''}
    ${nQuiz ? `<section class="step" id="quizBox" data-n="${nQuiz}"></section>` : ''}
    <nav class="pager">${prev ? `<a href="#/s/${prev.id}" class="btn ghost"><i class="ph-bold ph-arrow-left"></i>${prev.code} ${esc(prev.title)}</a>` : '<span></span>'}
      <span id="nextSlot"></span></nav>
  </article></div>`, 'home');
  refresh(s); mountVideo(s);
}

function refresh(s) {
  const st = steps(s), done = isDone(s), i = SECTIONS.indexOf(s), next = SECTIONS[i + 1];
  document.getElementById('tracker').innerHTML = `<div class="tracker">${st.map((x, k) => `<span class="tk ${x.done ? 'ok' : ''}"><span class="tk-n">${x.done ? '<i class="ph-bold ph-check"></i>' : k + 1}</span>${x.label}</span>`).join('<span class="tk-line"></span>')}</div>
    ${done ? `<p class="complete"><i class="ph-duotone ph-seal-check"></i>Section complete.${next ? ` <a href="#/s/${next.id}">Go to ${next.code} ${esc(next.title)}</a>` : ' You have finished the program.'}</p>` : ''}`;
  const nv = document.getElementById('n-video'); nv.className = 'n ' + (P[s.id]?.video_done ? 'ok' : ''); nv.innerHTML = P[s.id]?.video_done ? '<i class="ph-bold ph-check"></i>' : '1';
  const tb = document.getElementById('taskBox'); if (tb) tb.innerHTML = taskHTML(s, tb.dataset.n);
  const qb = document.getElementById('quizBox'); if (qb) qb.innerHTML = quizHTML(s, qb.dataset.n);
  const ns = document.getElementById('nextSlot');
  if (ns) ns.innerHTML = next ? (unlocked(next) ? `<a href="#/s/${next.id}" class="btn ${done ? 'primary' : 'ghost'}">${next.code} ${esc(next.title)}<i class="ph-bold ph-arrow-right"></i></a>` : `<span class="muted"><i class="ph-duotone ph-lock-simple"></i> Next section opens when this one is complete</span>`) : '';
}
const stepOpen = s => P[s.id]?.video_done || vidMissing[s.id] || profile?.is_admin;
const stepHead = (n, done, label) => `<h2><span class="n ${done ? 'ok' : ''}">${done ? '<i class="ph-bold ph-check"></i>' : n}</span>${label}</h2>`;

function taskHTML(s, n) {
  const p = P[s.id] || {};
  if (!stepOpen(s)) return stepHead(n, false, 'Task') + `<p class="locked"><i class="ph-duotone ph-lock-simple"></i>Finish the video to open the task.</p>`;
  return stepHead(n, p.task_done, 'Task') + `<p class="prompt">${esc(s.task)}</p>
    <textarea id="taskTxt" rows="7" placeholder="Write your response here…">${esc(p.task_response || '')}</textarea>
    <div class="row"><button class="btn primary" data-act="task">${p.task_done ? 'Update response' : 'Submit task'}</button>
    <span class="muted small">${p.task_done ? 'Submitted · your trainer can see this response.' : 'At least 40 characters.'}</span></div>`;
}

function quizHTML(s, n) {
  const p = P[s.id] || {}, qs = quizState[s.id];
  if (!stepOpen(s)) return stepHead(n, false, 'Assessment') + `<p class="locked"><i class="ph-duotone ph-lock-simple"></i>Finish the video to open the assessment.</p>`;
  const head = stepHead(n, p.quiz_passed, 'Assessment') + `<p class="muted small">${s.quiz.length} questions · pass mark ${C.PASS_MARK}%</p>`;
  if (p.quiz_passed && !qs) return head + `<p class="pass"><i class="ph-duotone ph-seal-check"></i>Passed · best score ${p.quiz_score}% · ${p.quiz_attempts} attempt${p.quiz_attempts === 1 ? '' : 's'}</p><button class="btn ghost" data-act="retake">Retake for practice</button>`;
  const locked = qs && qs.submitted && qs.passed;
  const body = s.quiz.map((q, qi) => { const order = seededOrder(s.id + qi, q.options.length), fb = qs?.submitted ? qs.fb[qi] : null;
    return `<fieldset class="q ${fb === true ? 'right' : fb === false ? 'wrong' : ''}"><legend><span>${qi + 1}.</span>${esc(q.q)}</legend>
      ${order.map(oi => `<label class="opt"><input type="radio" name="q${qi}" value="${oi}" ${qs?.sel?.[qi] === oi ? 'checked' : ''} ${locked ? 'disabled' : ''}><span>${esc(q.options[oi])}</span></label>`).join('')}
      ${fb === true ? '<p class="fb ok"><i class="ph-bold ph-check"></i>Correct</p>' : fb === false ? '<p class="fb no"><i class="ph-bold ph-x"></i>Not quite — review this point in the video and try again.</p>' : ''}</fieldset>`; }).join('');
  const result = qs?.submitted ? `<p class="${qs.passed ? 'pass' : 'fail'}"><i class="ph-duotone ${qs.passed ? 'ph-seal-check' : 'ph-arrow-counter-clockwise'}"></i>You scored ${qs.score}%. ${qs.passed ? 'Assessment passed.' : `You need ${C.PASS_MARK}% to pass.`}</p>` : '';
  return head + `<form id="quizF" class="quiz">${body}</form>${result}
    <div class="row">${locked ? '' : `<button class="btn primary" data-act="quiz">${qs?.submitted ? 'Submit again' : 'Submit answers'}</button>`}</div>`;
}

function mountVideo(s) {
  const v = document.getElementById('vid'), bar = document.querySelector('.vbar .meter i'), txt = document.getElementById('vtxt');
  let max = 0, saved = P[s.id]?.video_pct || 0;
  const show = () => { const pc = v.duration ? Math.min(100, Math.round(max / v.duration * 100)) : saved; bar.style.width = (P[s.id]?.video_done ? 100 : pc) + '%'; txt.textContent = P[s.id]?.video_done ? 'Watched' : pc ? pc + '% watched' : 'Not started'; };
  show();
  v.addEventListener('loadedmetadata', () => { max = saved / 100 * v.duration; if (!P[s.id]?.video_done && max > 5) v.currentTime = Math.max(0, max - 3); show(); });
  v.addEventListener('timeupdate', () => {
    if (v.seeking || !v.duration) return;
    if (v.currentTime <= max + 2) max = Math.max(max, v.currentTime);
    const pc = Math.floor(max / v.duration * 100), reached = pc >= C.VIDEO_DONE_AT * 100;
    if (!P[s.id]?.video_done && (pc >= saved + 5 || reached)) {
      saved = pc; api.save(s.id, { video_pct: pc, video_done: reached });
      if (reached) { toast('Video complete.'); refresh(s); }
    }
    show();
  });
  v.addEventListener('seeking', () => { if (!P[s.id]?.video_done && v.currentTime > max + 1) v.currentTime = max; });
  v.addEventListener('error', () => { vidMissing[s.id] = true; v.hidden = true; document.getElementById('vidmsg').hidden = false; refresh(s); });
}

/* ---------- team (trainer) ---------- */
let teamCache = null;
async function renderTeam() {
  $app.innerHTML = shell(`<div class="page"><p class="muted">Loading team progress…</p></div>`, 'team');
  const { profiles, progress } = teamCache = await api.team();
  const by = {}; progress.forEach(r => ((by[r.user_id] ||= {})[r.section_id] = r));
  const rows = profiles.map(p => { const prog = by[p.id] || {}; const scores = Object.values(prog).map(r => r.quiz_score).filter(x => x != null);
    const last = Object.values(prog).map(r => r.updated_at).sort().pop();
    return { p, prog, o: overall(prog), avg: scores.length ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : null, last, next: SECTIONS.find(s => !isDone(s, prog)) }; });
  $app.innerHTML = shell(`<div class="page wide">
    <section class="hero"><p class="kicker">Trainer view</p><h1>Team progress</h1>
      <p class="muted">${rows.length} trainee${rows.length === 1 ? '' : 's'} · ${SECTIONS.length} sections across ${MODS.length} modules</p>
      <button class="btn ghost" data-act="csv"><i class="ph-duotone ph-download-simple"></i>Download detail (CSV)</button></section>
    <div class="table-wrap"><table class="tbl"><thead><tr><th>Trainee</th>${MODS.map((m, i) => `<th title="${esc(m.title)}">M${i + 1}</th>`).join('')}<th>Overall</th><th>Avg score</th><th>Current section</th><th>Last active</th></tr></thead>
    <tbody>${rows.map(r => `<tr><td><b>${esc(r.p.full_name || r.p.username)}</b><small>${esc(r.p.username)}</small></td>
      ${MODS.map(m => { const v = modPct(m, r.prog); return `<td class="pc ${v === 1 ? 'full' : ''}">${Math.round(v * 100)}%</td>`; }).join('')}
      <td class="ov">${meter(r.o)}<span>${Math.round(r.o * 100)}%</span></td><td>${r.avg == null ? '—' : r.avg + '%'}</td>
      <td>${r.next ? `${r.next.code} ${esc(r.next.title)}` : 'Finished'}</td><td>${fmtDate(r.last)}</td></tr>`).join('') || `<tr><td colspan="${MODS.length + 5}" class="muted">No trainee accounts yet. Add users in Supabase → Authentication → Users.</td></tr>`}</tbody></table></div>
  </div>`, 'team');
}
function downloadCSV() {
  const { profiles, progress } = teamCache, by = {}; progress.forEach(r => ((by[r.user_id] ||= {})[r.section_id] = r));
  const q = v => `"${String(v ?? '').replace(/"/g, '""')}"`;
  const lines = [['username', 'module', 'section', 'title', 'video_watched_pct', 'video_done', 'task_done', 'task_response', 'quiz_best_score', 'quiz_passed', 'quiz_attempts', 'updated_at'].join(',')];
  profiles.forEach(p => SECTIONS.forEach(s => { const r = (by[p.id] || {})[s.id] || {};
    lines.push([p.username, s.mod.title, s.code, s.title, r.video_pct ?? 0, !!r.video_done, s.task ? !!r.task_done : 'n/a', r.task_response, r.quiz_score, s.quiz ? !!r.quiz_passed : 'n/a', r.quiz_attempts ?? 0, r.updated_at].map(q).join(',')); }));
  const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([lines.join('\n')], { type: 'text/csv' }));
  a.download = `brightwell-progress-${new Date().toISOString().slice(0, 10)}.csv`; a.click();
}

/* ---------- password dialog ---------- */
function pwDialog() {
  const d = document.createElement('div'); d.className = 'backdrop';
  d.innerHTML = `<form class="dialog form"><h2>Change password</h2>
    <label>New password<input type="password" name="p1" minlength="8" required autocomplete="new-password"></label>
    <label>Repeat new password<input type="password" name="p2" minlength="8" required autocomplete="new-password"></label>
    <p class="err"></p><div class="row"><button class="btn primary" type="submit">Save password</button><button class="btn ghost" type="button" data-close>Cancel</button></div></form>`;
  document.body.appendChild(d);
  d.querySelector('[data-close]').onclick = () => d.remove();
  d.querySelector('form').onsubmit = async e => { e.preventDefault(); const f = e.target, err = f.querySelector('.err');
    if (f.p1.value !== f.p2.value) return err.textContent = 'The passwords do not match.';
    try { await api.setPassword(f.p1.value); d.remove(); toast('Password updated.'); } catch (x) { err.textContent = x.message; } };
}

/* ---------- actions ---------- */
$app.addEventListener('click', async e => {
  const b = e.target.closest('[data-act]'); if (!b) return;
  const s = byId[(location.hash.match(/#\/s\/(.+)$/) || [])[1]];
  switch (b.dataset.act) {
    case 'out': await api.signOut(); user = profile = null; P = {}; location.hash = ''; route(); break;
    case 'pw': pwDialog(); break;
    case 'csv': downloadCSV(); break;
    case 'demo-watch': await api.save(s.id, { video_pct: 100, video_done: true }); refresh(s); break;
    case 'task': {
      const v = document.getElementById('taskTxt').value.trim();
      if (v.length < 40) return toast('Please write at least 40 characters.');
      b.disabled = true; await api.save(s.id, { task_done: true, task_response: v }); toast('Task submitted.'); refresh(s); break;
    }
    case 'quiz': {
      const sel = s.quiz.map((q, i) => { const el = document.querySelector(`input[name="q${i}"]:checked`); return el ? +el.value : null; });
      if (sel.includes(null)) return toast('Answer every question first.');
      const fb = sel.map(x => x === 0), score = Math.round(fb.filter(Boolean).length / fb.length * 100), passed = score >= C.PASS_MARK, p = P[s.id] || {};
      quizState[s.id] = { sel, fb, score, passed, submitted: true };
      b.disabled = true;
      await api.save(s.id, { quiz_score: Math.max(score, p.quiz_score || 0), quiz_passed: !!p.quiz_passed || passed, quiz_attempts: (p.quiz_attempts || 0) + 1 });
      refresh(s); break;
    }
    case 'retake': quizState[s.id] = { sel: [], submitted: false }; refresh(s); break;
  }
});

/* ---------- router ---------- */
function route() {
  if (!user) return renderLogin();
  const [, a, b] = (location.hash.slice(1) || '/').split('/');
  if (a === 's' && byId[b]) return renderSection(byId[b]);
  if (a === 'team' && profile?.is_admin) return renderTeam();
  renderHome();
}
async function loadUser() { profile = await api.profile(); P = await api.progress(); }
window.addEventListener('hashchange', () => { route(); window.scrollTo(0, 0); });
(async () => {
  user = await api.session();
  if (user) await loadUser();
  route();
  if (sb) sb.auth.onAuthStateChange(ev => { if (ev === 'SIGNED_OUT' && user) { user = null; route(); } });
})();
})();
