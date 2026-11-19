(() => {
const C = window.BW_CONFIG, MODS = window.BW_MODULES, REFS = window.BW_REFERENCES || [];
const DEMO = !C.SUPABASE_ANON_KEY || C.SUPABASE_ANON_KEY.includes('PASTE');
const sb = DEMO ? null : window.supabase.createClient(C.SUPABASE_URL, C.SUPABASE_ANON_KEY);
const SECTIONS = [];
const normTask = t => !t ? null : typeof t === 'string' ? { text: t, kind: 'text' } : { kind: 'text', ...t };
MODS.forEach((m, mi) => {
  m.items = m.sections.map((s, si) => {
    const code = `${mi + 1}.${si + 1}`;
    const prep = (x, extra) => { const o = { ...x, ...extra, task: normTask(x.task) }; o.pendingQuiz = x.quiz && !Array.isArray(x.quiz) ? x.quiz.pending : 0; if (o.pendingQuiz) o.quiz = null; SECTIONS.push(o); return o; };
    if (!s.lessons) return prep(s, { mod: m, mi, code });
    const g = { ...s, mod: m, mi, code, kids: [] };
    s.lessons.forEach((l, li) => g.kids.push(prep(l, { mod: m, mi, code: `${code}.${li + 1}`, group: g })));
    return g;
  });
  m.leaves = SECTIONS.filter(x => x.mod === m);
});
const byId = Object.fromEntries(SECTIONS.map(s => [s.id, s]));
const $app = document.getElementById('app');
let user = null, profile = null, P = {};
let NOTIF = { fb: [], ans: [], meet: [], unanswered: 0 };
const vidMissing = {}, quizState = {};

const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const pad = n => String(n).padStart(2, '0');
const fmtDate = d => d ? new Date(d).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' }) : '—';
const fmtDT = d => d ? new Date(d).toLocaleString(undefined, { weekday: 'short', day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit' }) : '—';
const cfgUrl = u => u && u.startsWith('CFG:') ? C[u.slice(4)] || '' : u;
const myName = () => profile?.full_name || user.username;
function toast(msg) { const t = document.getElementById('toast'); t.textContent = msg; t.classList.add('on'); clearTimeout(toast.t); toast.t = setTimeout(() => t.classList.remove('on'), 3200); }

/* ---------- data ---------- */
const db = {
  get() { return JSON.parse(localStorage.getItem('bw-demo-db') || '{"users":[],"feedback":[],"questions":[],"meetings":[]}'); },
  set(d) { localStorage.setItem('bw-demo-db', JSON.stringify(d)); },
  mut(fn) { const d = db.get(); const r = fn(d); db.set(d); return r; }
};
const uid = () => Math.random().toString(36).slice(2) + Date.now().toString(36);
const now = () => new Date().toISOString();
const chk = ({ data, error }, msg) => { if (error) { if (msg) toast(msg); console.warn('[BW]', error.message || error); return null; } return data; };

const api = {
  async session() {
    if (DEMO) { const u = localStorage.getItem('bw-demo-user'); return u ? { id: 'demo-' + u, username: u } : null; }
    const { data } = await sb.auth.getSession(); const s = data.session;
    return s ? { id: s.user.id, username: s.user.email.split('@')[0] } : null;
  },
  async signIn(username, pw) {
    username = username.trim().toLowerCase();
    if (DEMO) { localStorage.setItem('bw-demo-user', username); db.mut(d => { if (!d.users.includes(username)) d.users.push(username); }); return; }
    const email = username.includes('@') ? username : `${username}@${C.USERNAME_DOMAIN}`;
    const { error } = await sb.auth.signInWithPassword({ email, password: pw });
    if (error) throw new Error(/invalid/i.test(error.message) ? 'Username or password is incorrect.' : error.message);
  },
  async signOut() { if (DEMO) localStorage.removeItem('bw-demo-user'); else await sb.auth.signOut(); },
  async profile() {
    if (DEMO) return { id: user.id, username: user.username, is_admin: user.username === 'admin' };
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
    const row = { ...(P[id] || {}), ...patch, section_id: id, updated_at: now() };
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
    if (DEMO) { const us = db.get().users.filter(u => u !== 'admin');
      return { profiles: us.map(u => ({ id: 'demo-' + u, username: u })), progress: us.flatMap(u => Object.values(JSON.parse(localStorage.getItem('bw-demo-prog-' + u) || '{}')).map(r => ({ ...r, user_id: 'demo-' + u }))) }; }
    const [a, b] = await Promise.all([sb.from('profiles').select('*').order('username'), sb.from('progress').select('*')]);
    return { profiles: (a.data || []).filter(p => !p.is_admin), progress: b.data || [] };
  },
  // trainer feedback
  async feedback(forUser) {
    if (DEMO) return db.get().feedback.filter(f => f.user_id === forUser).sort((a, b) => b.created_at.localeCompare(a.created_at));
    return chk(await sb.from('feedback').select('*').eq('user_id', forUser).order('created_at', { ascending: false })) || [];
  },
  async sendFeedback(toUser, sectionId, body) {
    const row = { user_id: toUser, section_id: sectionId, body, author_id: user.id, author_name: myName() };
    if (DEMO) return db.mut(d => d.feedback.push({ ...row, id: uid(), created_at: now(), read_at: null }));
    return chk(await sb.from('feedback').insert(row), 'Could not send feedback.');
  },
  async markFeedbackRead(ids) {
    if (!ids.length) return;
    if (DEMO) return db.mut(d => d.feedback.forEach(f => { if (ids.includes(f.id)) f.read_at = now(); }));
    chk(await sb.rpc('mark_feedback_read', { ids }));
  },
  // Q&A
  async questions() {
    if (DEMO) return db.get().questions.filter(q => profile.is_admin || q.user_id === user.id || q.answer).sort((a, b) => b.created_at.localeCompare(a.created_at));
    return chk(await sb.from('questions').select('*').order('created_at', { ascending: false })) || [];
  },
  async ask(body) {
    const row = { user_id: user.id, author_name: myName(), body };
    if (DEMO) return db.mut(d => d.questions.push({ ...row, id: uid(), created_at: now(), answer: null, answer_seen: false }));
    return chk(await sb.from('questions').insert(row), 'Could not post your question.');
  },
  async answer(id, answer) {
    const patch = { answer, answered_at: now(), answered_by: myName(), answer_seen: false };
    if (DEMO) return db.mut(d => Object.assign(d.questions.find(q => q.id === id), patch));
    return chk(await sb.from('questions').update(patch).eq('id', id), 'Could not save the answer.');
  },
  async markAnswersSeen() {
    if (DEMO) return db.mut(d => d.questions.forEach(q => { if (q.user_id === user.id && q.answer) q.answer_seen = true; }));
    chk(await sb.rpc('mark_answers_seen'));
  },
  // live sessions
  async meetings() {
    if (DEMO) return db.get().meetings.sort((a, b) => a.starts_at.localeCompare(b.starts_at));
    return chk(await sb.from('meetings').select('*').order('starts_at')) || [];
  },
  async addMeeting(m) {
    if (DEMO) return db.mut(d => d.meetings.push({ ...m, id: uid(), created_at: now() }));
    return chk(await sb.from('meetings').insert({ ...m, created_by: user.id }), 'Could not schedule the session.');
  },
  async delMeeting(id) {
    if (DEMO) return db.mut(d => { d.meetings = d.meetings.filter(m => m.id !== id); });
    chk(await sb.from('meetings').delete().eq('id', id));
  },
  // file uploads
  async upload(sectionId, file) {
    const path = `${user.id}/${sectionId}/${Date.now()}-${file.name.replace(/[^\w.\-]+/g, '_')}`;
    if (DEMO) return path;
    const { error } = await sb.storage.from(C.SUBMISSIONS_BUCKET).upload(path, file, { upsert: true });
    if (error) throw error;
    return path;
  },
  async fileUrl(path) {
    if (DEMO) return null;
    const { data, error } = await sb.storage.from(C.SUBMISSIONS_BUCKET).createSignedUrl(path, 3600);
    return error ? null : data.signedUrl;
  }
};

/* ---------- notifications ---------- */
const seenMeetKey = () => 'bw-seen-meet-' + user.username;
async function loadNotifs() {
  const [fb, qs, ms] = await Promise.all([profile.is_admin ? [] : api.feedback(user.id), api.questions(), api.meetings()]);
  const seen = new Date(localStorage.getItem(seenMeetKey()) || 0).getTime(), before = notifCount(), first = !loadNotifs.done;
  NOTIF = {
    allFb: fb,
    fb: fb.filter(f => !f.read_at),
    ans: qs.filter(q => q.user_id === user.id && q.answer && !q.answer_seen),
    meet: profile.is_admin ? [] : ms.filter(m => new Date(m.created_at).getTime() > seen && new Date(m.starts_at) > Date.now() - 3600e3),
    unanswered: qs.filter(q => !q.answer).length,
    meetings: ms
  };
  loadNotifs.done = true;
  const n = notifCount(), b = document.getElementById('bellN');
  if (!first && n > before) { toast('You have a new notification.'); const h = location.hash.slice(1) || '/'; if (h === '/' ) renderHome(); else if (h === '/live') renderLive(); }
  const np = document.getElementById('np'); if (np && !np.hidden) np.innerHTML = notifPanel();
  if (b) { b.textContent = n; b.hidden = !n; }
  const qb = document.getElementById('qaN');
  if (qb) { qb.textContent = NOTIF.unanswered; qb.hidden = !(profile.is_admin && NOTIF.unanswered); }
}
const notifCount = () => NOTIF.fb.length + NOTIF.ans.length + NOTIF.meet.length;
function notifPanel() {
  const items = [
    ...NOTIF.fb.map(f => { const s = byId[f.section_id]; return { t: f.created_at, icon: 'ph-chat-centered-text', href: `#/s/${f.section_id}`, head: `Feedback on ${s ? s.code + ' ' + esc(s.title) : 'a section'}`, body: esc(f.body) }; }),
    ...NOTIF.ans.map(q => ({ t: q.answered_at, icon: 'ph-chats-circle', href: '#/qa', head: 'Your question was answered', body: esc(q.body) })),
    ...NOTIF.meet.map(m => ({ t: m.created_at, icon: 'ph-video-camera', href: '#/live', head: `Live session: ${esc(m.title)}`, body: fmtDT(m.starts_at) }))
  ].sort((a, b) => (b.t || '').localeCompare(a.t || ''));
  return `<p class="np-head">Notifications</p>${items.length ? items.map(i => `<a class="np-item" href="${i.href}"><i class="ph-duotone ${i.icon}"></i><span><b>${i.head}</b><span class="np-body">${i.body}</span><small>${fmtDate(i.t)}</small></span></a>`).join('') : '<p class="muted small np-empty">You’re all caught up.</p>'}`;
}
async function clearNotifs() {
  await Promise.all([api.markFeedbackRead(NOTIF.fb.map(f => f.id)), NOTIF.ans.length ? api.markAnswersSeen() : null]);
  localStorage.setItem(seenMeetKey(), now());
  NOTIF.fb = []; NOTIF.ans = []; NOTIF.meet = [];
  const b = document.getElementById('bellN'); if (b) b.hidden = true;
}

/* ---------- progress logic ---------- */
function steps(s, prog = P) {
  const p = prog[s.id] || {};
  const list = hasVid(s) ? [{ k: 'video', label: 'Watch', done: !!p.video_done }] : [];
  if (s.quiz && s.quiz.length) list.push({ k: 'quiz', label: 'Assessment', done: !!p.quiz_passed });
  if (s.task) list.push({ k: 'task', label: 'Assignment', done: !!p.task_done });
  return list;
}
const pct = (s, prog = P) => { const st = steps(s, prog); return st.length ? st.filter(x => x.done).length / st.length : 1; };
const isDone = (s, prog = P) => pct(s, prog) === 1;
const modPct = (m, prog = P) => m.leaves.reduce((a, s) => a + pct(s, prog), 0) / m.leaves.length;
const overall = (prog = P) => SECTIONS.reduce((a, s) => a + pct(s, prog), 0) / SECTIONS.length;
const unlocked = s => !C.SEQUENTIAL || profile?.is_admin || SECTIONS.indexOf(s) === 0 || isDone(SECTIONS[SECTIONS.indexOf(s) - 1]);
const nextUp = () => SECTIONS.find(s => !isDone(s)) || null;
const videoUrl = s => s.video || (C.VIDEO_SOURCE === 'github' ? `videos/${s.id}.mp4` : `${C.SUPABASE_URL}/storage/v1/object/public/${C.VIDEO_BUCKET}/${s.id}.mp4`);
const stateOf = (s, prog = P) => prog === P && !unlocked(s) ? 'locked' : isDone(s, prog) ? 'done' : pct(s, prog) > 0 ? 'progress' : 'todo';
const hasVid = s => s.video !== false;
const itemDone = x => x.kids ? x.kids.every(k => isDone(k)) : isDone(x);
const groupState = g => g.kids.every(k => isDone(k)) ? 'done' : g.kids.some(k => pct(k) > 0) ? 'progress' : !unlocked(g.kids[0]) ? 'locked' : 'todo';
function secRow(s) {
  const st = stateOf(s), body = `<i class="ph-duotone ${ICON[st]} st"></i><span class="code">${s.code}</span><span class="t">${esc(s.title)}</span>${chips(s)}`;
  return `<li>${st === 'locked' ? `<span class="sec locked" title="Complete the previous section first">${body}</span>` : `<a class="sec ${st}" href="#/s/${s.id}">${body}</a>`}</li>`;
}
function rowHTML(it) {
  if (!it.kids) return secRow(it);
  const st = groupState(it), d = it.kids.filter(k => isDone(k)).length;
  return `<li class="grp"><div class="sec grp-head ${st}"><i class="ph-duotone ${ICON[st]} st"></i><span class="code">${it.code}</span><span class="t">${esc(it.title)}</span><span class="chips"><span class="chip ${d === it.kids.length ? 'ok' : ''}">${d} of ${it.kids.length} lessons</span></span></div>
    <ol class="sec-list sub">${it.kids.map(secRow).join('')}</ol></li>`;
}
function outlineItem(it, cur) {
  const one = x => { const st = stateOf(x), inner = `<i class="ph-duotone ${ICON[st]}"></i><span>${x.code} ${esc(x.title)}</span>`;
    return st === 'locked' ? `<span class="o-sec locked">${inner}</span>` : `<a class="o-sec ${x === cur ? 'cur' : ''} ${st}" href="#/s/${x.id}">${inner}</a>`; };
  if (!it.kids) return one(it);
  const st = groupState(it);
  return `<div class="o-grp"><span class="o-sec o-ghead ${st}"><i class="ph-duotone ${ICON[st]}"></i><span>${it.code} ${esc(it.title)}</span></span><div class="o-kids">${it.kids.map(one).join('')}</div></div>`;
}
function addCaptions(s, v) {
  const url = s.captions === false ? null : s.captions || (s.video ? null : videoUrl(s).replace(/\.mp4$/, '.en.srt'));
  if (!url) return;
  fetch(url).then(r => r.ok ? r.text() : null).then(t => {
    if (!t || !t.includes('-->')) return;
    t = t.replace(/^\uFEFF/, '');
    const vtt = /^WEBVTT/.test(t) ? t : 'WEBVTT\n\n' + t.replace(/\r/g, '').replace(/(\d\d:\d\d:\d\d),(\d{3})/g, '$1.$2');
    const tr = document.createElement('track');
    Object.assign(tr, { kind: 'captions', label: 'English', srclang: 'en', default: true, src: URL.createObjectURL(new Blob([vtt], { type: 'text/vtt' })) });
    v.appendChild(tr);
  }).catch(() => {});
}
const ICON = { locked: 'ph-lock-simple', done: 'ph-check-circle', progress: 'ph-circle-half', todo: 'ph-circle' };

function seededOrder(seed, n) {
  let h = 2166136261; for (const c of seed) h = Math.imul(h ^ c.charCodeAt(0), 16777619);
  const rnd = () => { h = Math.imul(h ^ (h >>> 15), 2246822507); h = Math.imul(h ^ (h >>> 13), 3266489909); return ((h ^= h >>> 16) >>> 0) / 4294967296; };
  const a = [...Array(n).keys()]; for (let i = n - 1; i > 0; i--) { const j = Math.floor(rnd() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a;
}

/* ---------- shell ---------- */
function shell(inner, active) {
  const tab = (k, href, icon, label, extra = '') => `<a href="${href}" title="${label}" class="${active === k ? 'on' : ''}"><i class="ph-duotone ${icon}"></i>${label}${extra}</a>`;
  return `<header class="top">
    <a href="#/" class="brand"><img src="logo-light.svg" alt="Innovative"><span><small>Chronic Care Management</small><b>BrightWell Training</b></span></a>
    <nav class="tabs">
      ${tab('home', '#/', 'ph-graduation-cap', 'My training')}
      ${tab('ref', '#/ref', 'ph-books', 'Reference')}
      ${tab('qa', '#/qa', 'ph-chats-circle', 'Q&amp;A', `<span class="badge" id="qaN" ${profile?.is_admin && NOTIF.unanswered ? '' : 'hidden'}>${NOTIF.unanswered}</span>`)}
      ${tab('live', '#/live', 'ph-video-camera', 'Live sessions')}
      ${profile?.is_admin ? tab('team', '#/team', 'ph-users-three', 'Team progress') : ''}
    </nav>
    <div class="me">
      ${profile?.is_admin ? '' : `<div class="bell-wrap"><button class="bell" data-act="bell" aria-label="Notifications"><i class="ph-duotone ph-bell"></i><span class="badge" id="bellN" ${notifCount() ? '' : 'hidden'}>${notifCount()}</span></button><div class="np" id="np" hidden></div></div>`}
      <i class="ph-duotone ph-user-circle"></i><span>${esc(myName())}</span>
      <button class="link" data-act="pw">Change password</button>
      <button class="btn ghost sm" data-act="out">Sign out</button></div>
  </header>
  ${DEMO ? `<div class="demo"><i class="ph-duotone ph-flask"></i>Demo mode — data is saved in this browser only. Sign in as “admin” to see the trainer view.</div>` : ''}
  <main>${inner}</main>`;
}
const meter = (v, cls = '') => `<div class="meter ${cls}"><i style="width:${Math.round(v * 100)}%"></i></div>`;
const chips = (s, prog = P) => `<span class="chips">${steps(s, prog).map(x => `<span class="chip ${x.done ? 'ok' : ''}">${x.done ? '<i class="ph-bold ph-check"></i>' : ''}${x.label}</span>`).join('')}${s.pendingQuiz ? '<span class="chip soon">Assessment soon</span>' : ''}</span>`;

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
    <ol class="login-mods">${MODS.map((m, i) => `<li><span class="num">${pad(i + 1)}</span><span><b>${esc(m.title)}</b><small>${m.items.length} section${m.items.length === 1 ? '' : 's'}</small></span></li>`).join('')}</ol>
  </div>`;
  document.getElementById('loginF').onsubmit = async e => {
    e.preventDefault(); const f = e.target, btn = f.querySelector('button'); btn.disabled = true;
    try { await api.signIn(f.u.value, f.p.value); user = await api.session(); await loadUser(); location.hash = '#/'; route(); }
    catch (err) { document.getElementById('err').textContent = err.message; btn.disabled = false; }
  };
}

/* ---------- home ---------- */
function meetCard(m, admin) {
  const past = new Date(m.starts_at) < Date.now() - 2 * 3600e3;
  return `<div class="meet ${past ? 'past' : ''}"><div class="meet-when"><b>${new Date(m.starts_at).toLocaleDateString(undefined, { day: 'numeric' })}</b><small>${new Date(m.starts_at).toLocaleDateString(undefined, { month: 'short' })}</small></div>
    <div class="meet-t"><b>${esc(m.title)}</b><span class="muted small">${fmtDT(m.starts_at)}</span></div>
    <div class="row">${past ? '<span class="muted small">Ended</span>' : `<a class="btn primary sm" href="${esc(m.url)}" target="_blank" rel="noopener"><i class="ph-duotone ph-video-camera"></i>Join</a>`}
    ${admin ? `<button class="btn ghost sm" data-act="delmeet" data-id="${esc(m.id)}">Remove</button>` : ''}</div></div>`;
}
function renderHome() {
  const n = nextUp(), done = SECTIONS.filter(s => isDone(s)).length;
  const up = (NOTIF.meetings || []).filter(m => new Date(m.starts_at) > Date.now() - 3600e3).slice(0, 2);
  $app.innerHTML = shell(`<div class="page">
    <section class="hero">
      <p class="kicker">Welcome, ${esc(myName())}</p>
      <h1>Your training path</h1>
      <div class="hero-meter">${meter(overall(), 'big')}<span><b>${done}</b> of ${SECTIONS.length} sections complete · ${Math.round(overall() * 100)}%</span></div>
      ${n ? `<a class="btn primary lg" href="#/s/${n.id}">${pct(n) > 0 ? 'Continue' : 'Start'}: ${n.code} ${esc(n.title)}<i class="ph-bold ph-arrow-right"></i></a>`
          : `<p class="all-done"><i class="ph-duotone ph-seal-check"></i>You have completed the full program.</p>`}
      <p class="muted how">Each section has a short video, then an assessment and/or an assignment. Pass mark ${C.PASS_MARK}%.</p>
    </section>
    ${up.length ? `<section class="home-meet"><p class="kicker">Upcoming live sessions</p>${up.map(m => meetCard(m)).join('')}</section>` : ''}
    <section class="mods">${MODS.map((m, mi) => `<div class="mod">
      <div class="mod-head"><span class="mod-num">${pad(mi + 1)}</span><div class="mod-t"><p class="kicker">Module ${mi + 1}</p><h2>${esc(m.title)}</h2></div>
        <div class="mod-m">${meter(modPct(m))}<small>${m.items.filter(x => itemDone(x)).length} of ${m.items.length}</small></div></div>
      <ol class="sec-list">${m.items.map(rowHTML).join('')}</ol>
    </div>`).join('')}</section>
  </div>`, 'home');
}

/* ---------- reference ---------- */
function renderRef() {
  $app.innerHTML = shell(`<div class="page">
    <section class="hero"><p class="kicker">Keep these open on shift</p><h1>Reference</h1></section>
    ${REFS.map(g => `<section class="ref-g"><h2>${esc(g.title)}</h2><div class="ref-grid">${g.links.map(l => `<a class="ref" href="${esc(l.url)}" target="_blank" rel="noopener" ${l.color ? `style="--c:${esc(l.color)}"` : ''}>
      <i class="ph-duotone ${esc(l.icon || 'ph-link')}"></i><b>${esc(l.label)}</b><i class="ph-bold ph-arrow-up-right go"></i></a>`).join('')}</div></section>`).join('')}
  </div>`, 'ref');
}

/* ---------- Q&A ---------- */
async function renderQA() {
  $app.innerHTML = shell(`<div class="page"><p class="muted">Loading questions…</p></div>`, 'qa');
  const qs = await api.questions(), admin = profile.is_admin;
  const list = admin ? [...qs.filter(q => !q.answer), ...qs.filter(q => q.answer)] : qs;
  $app.innerHTML = shell(`<div class="page">
    <section class="hero"><p class="kicker">Ask the trainer</p><h1>Q&amp;A</h1>
      <p class="muted">${admin ? 'Answers are shared with every trainee.' : 'Your question goes to the trainer. Once it is answered, the question and answer are shared with all trainees.'}</p></section>
    ${admin ? '' : `<form class="ask form" data-form="ask"><label>Your question<textarea name="q" rows="3" required placeholder="Type your question…"></textarea></label><button class="btn primary" type="submit">Post question</button></form>`}
    <div class="qa-list">${list.map(q => `<article class="qa ${q.answer ? '' : 'open'}">
      <div class="qa-q"><p class="qa-meta"><b>${esc(q.author_name || 'Trainee')}</b> · ${fmtDate(q.created_at)}${q.answer ? '' : ` · <span class="pending">${admin ? 'Needs an answer' : 'Awaiting answer · only you and the trainer can see this'}</span>`}</p><p class="pre">${esc(q.body)}</p></div>
      ${q.answer && !admin ? `<div class="qa-a"><p class="qa-meta"><i class="ph-duotone ph-chalkboard-teacher"></i><b>${esc(q.answered_by || 'Trainer')}</b> · ${fmtDate(q.answered_at)}</p><p class="pre">${esc(q.answer)}</p></div>` : ''}
      ${admin ? `<form class="form qa-a" data-form="answer" data-id="${esc(q.id)}"><textarea name="a" rows="3" required placeholder="Write the answer…">${esc(q.answer || '')}</textarea><div class="row"><button class="btn primary sm" type="submit">${q.answer ? 'Update answer' : 'Answer and share'}</button>${q.answer ? `<span class="muted small">Answered ${fmtDate(q.answered_at)}</span>` : ''}</div></form>` : ''}
    </article>`).join('') || '<p class="muted">No questions yet.</p>'}</div>
  </div>`, 'qa');
  if (!admin && NOTIF.ans.length) { await api.markAnswersSeen(); NOTIF.ans = []; loadNotifs(); }
}

/* ---------- live sessions ---------- */
async function renderLive() {
  const ms = await api.meetings(), admin = profile.is_admin;
  const up = ms.filter(m => new Date(m.starts_at) > Date.now() - 2 * 3600e3), past = ms.filter(m => !up.includes(m)).reverse().slice(0, 5);
  $app.innerHTML = shell(`<div class="page">
    <section class="hero"><p class="kicker">Google Meet</p><h1>Live sessions</h1></section>
    ${admin ? `<form class="form meet-form" data-form="meet">
      <h2>Schedule a session</h2>
      <p class="muted small">1. <a href="https://calendar.google.com/calendar/r/eventedit" target="_blank" rel="noopener">Create the event in Google Calendar</a> and click “Add Google Meet video conferencing”. 2. Copy the Meet link and paste it below. Trainees see it here and get a notification.</p>
      <div class="meet-fields"><label>Title<input name="title" required placeholder="Weekly Q&amp;A call"></label>
      <label>Date and time<input name="at" type="datetime-local" required></label>
      <label>Google Meet link<input name="url" type="url" required placeholder="https://meet.google.com/…"></label></div>
      <button class="btn primary" type="submit">Publish to trainees</button></form>` : ''}
    <section class="meet-list"><h2>Upcoming</h2>${up.map(m => meetCard(m, admin)).join('') || '<p class="muted">No sessions scheduled.</p>'}</section>
    ${past.length ? `<section class="meet-list"><h2>Past</h2>${past.map(m => meetCard(m, admin)).join('')}</section>` : ''}
  </div>`, 'live');
  if (!admin && NOTIF.meet.length) { localStorage.setItem(seenMeetKey(), now()); NOTIF.meet = []; loadNotifs(); }
}

/* ---------- section ---------- */
function renderSection(s) {
  const i = SECTIONS.indexOf(s), prev = SECTIONS[i - 1];
  const outline = `<aside class="outline">${MODS.map((m, mi) => `<div class="o-mod"><p class="kicker">${pad(mi + 1)} · ${esc(m.title)}</p>
    ${m.items.map(it => outlineItem(it, s)).join('')}</div>`).join('')}</aside>`;
  if (!unlocked(s)) {
    $app.innerHTML = shell(`<div class="layout">${outline}<article class="lesson"><p class="kicker">Module ${s.mi + 1} · ${esc(s.mod.title)}</p><h1>${esc(s.title)}</h1>
      <p class="locked-big"><i class="ph-duotone ph-lock-simple"></i>This section opens once you complete <a href="#/s/${prev.id}">${prev.code} ${esc(prev.title)}</a>.</p></article></div>`, 'home');
    return;
  }
  let n = hasVid(s) ? 1 : 0; const nQuiz = s.quiz?.length || s.pendingQuiz ? ++n : 0, nTask = s.task ? ++n : 0;
  const links = (s.links || []).map(l => ({ ...l, url: cfgUrl(l.url) })).filter(l => l.url);
  const linkHTML = links.length ? `<div class="res-row">${links.map(l => `<a class="res" href="${esc(l.url)}" target="_blank" rel="noopener"><i class="ph-duotone ph-arrow-square-out"></i>${esc(l.label)}</a>`).join('')}</div>` : '';
  $app.innerHTML = shell(`<div class="layout">${outline}<article class="lesson">
    <a href="#/" class="back"><i class="ph-bold ph-arrow-left"></i>All modules</a>
    <p class="kicker">Module ${s.mi + 1} · ${esc(s.mod.title)} · ${s.group ? `${s.group.code} ${esc(s.group.title)} · ` : ''}Section ${s.code}</p>
    <h1>${esc(s.title)}</h1>
    <p class="lead">${esc(s.summary)}</p>
    ${hasVid(s) ? '' : linkHTML}
    <div id="tracker"></div>
    <div id="fbSlot"></div>
    ${hasVid(s) ? `<section class="step"><h2><span class="n" id="n-video">1</span>Watch the video<small>${s.minutes ? s.minutes + ' min' : ''}</small></h2>
      <div class="video-wrap"><video id="vid" controls preload="metadata" playsinline controlslist="nodownload" src="${esc(videoUrl(s))}"></video>
        <div id="vidmsg" class="vidmsg" hidden><i class="ph-duotone ph-film-slate"></i><b>Video coming soon</b><span>The rest of this section is open in the meantime.</span>${DEMO ? '<button class="btn ghost sm" data-act="demo-watch">Mark as watched (demo)</button>' : ''}</div></div>
      <div class="vbar">${meter(0)}<span id="vtxt"></span></div>
      ${linkHTML}
      <p class="muted small">You can rewind at any time. Skipping ahead opens once you have watched the video through.</p>
    </section>` : ''}
    ${nQuiz ? `<section class="step" id="quizBox" data-n="${nQuiz}"></section>` : ''}
    ${nTask ? `<section class="step" id="taskBox" data-n="${nTask}"></section>` : ''}
    <nav class="pager">${prev ? `<a href="#/s/${prev.id}" class="btn ghost"><i class="ph-bold ph-arrow-left"></i>${prev.code} ${esc(prev.title)}</a>` : '<span></span>'}
      <span id="nextSlot"></span></nav>
  </article></div>`, 'home');
  refresh(s); if (hasVid(s)) mountVideo(s);
  if (!profile.is_admin) showSectionFeedback(s);
}
async function showSectionFeedback(s) {
  const fbs = (NOTIF.allFb || []).filter(f => f.section_id === s.id), el = document.getElementById('fbSlot');
  if (!fbs.length || !el) return;
  el.innerHTML = `<div class="fb-box"><p class="kicker"><i class="ph-duotone ph-chat-centered-text"></i> Trainer feedback</p>${fbs.map(f => `<div class="fb-item ${f.read_at ? '' : 'new'}"><p class="pre">${esc(f.body)}</p><small class="muted">${esc(f.author_name || 'Trainer')} · ${fmtDate(f.created_at)}</small></div>`).join('')}</div>`;
  const unread = fbs.filter(f => !f.read_at).map(f => f.id);
  if (unread.length) { await api.markFeedbackRead(unread); unread.forEach(id => { const f = NOTIF.allFb.find(x => x.id === id); if (f) f.read_at = now(); }); NOTIF.fb = NOTIF.fb.filter(f => !unread.includes(f.id)); loadNotifs(); }
}

function refresh(s) {
  const st = steps(s), done = isDone(s), i = SECTIONS.indexOf(s), next = SECTIONS[i + 1];
  document.getElementById('tracker').innerHTML = st.length ? `<div class="tracker">${st.map((x, k) => `<span class="tk ${x.done ? 'ok' : ''}"><span class="tk-n">${x.done ? '<i class="ph-bold ph-check"></i>' : k + 1}</span>${x.label}</span>`).join('<span class="tk-line"></span>')}</div>
    ${done ? `<p class="complete"><i class="ph-duotone ph-seal-check"></i>Section complete.${next ? ` <a href="#/s/${next.id}">Go to ${next.code} ${esc(next.title)}</a>` : ' You have finished the program.'}</p>` : ''}` : '';
  const nv = document.getElementById('n-video'); if (nv) { nv.className = 'n ' + (P[s.id]?.video_done ? 'ok' : ''); nv.innerHTML = P[s.id]?.video_done ? '<i class="ph-bold ph-check"></i>' : '1'; }
  const tb = document.getElementById('taskBox'); if (tb) tb.innerHTML = taskHTML(s, tb.dataset.n);
  const qb = document.getElementById('quizBox'); if (qb) qb.innerHTML = quizHTML(s, qb.dataset.n);
  const ns = document.getElementById('nextSlot');
  if (ns) ns.innerHTML = next ? (unlocked(next) ? `<a href="#/s/${next.id}" class="btn ${done ? 'primary' : 'ghost'}">${next.code} ${esc(next.title)}<i class="ph-bold ph-arrow-right"></i></a>` : `<span class="muted"><i class="ph-duotone ph-lock-simple"></i> Next section opens when this one is complete</span>`) : '';
}
const stepOpen = s => !hasVid(s) || P[s.id]?.video_done || vidMissing[s.id] || profile?.is_admin;
const stepHead = (n, done, label) => `<h2><span class="n ${done ? 'ok' : ''}">${done ? '<i class="ph-bold ph-check"></i>' : n}</span>${label}</h2>`;
const fileName = p => (p || '').split('/').pop().replace(/^\d+-/, '');

function taskHTML(s, n) {
  const p = P[s.id] || {}, t = s.task;
  if (!stepOpen(s)) return stepHead(n, false, 'Assignment') + `<p class="locked"><i class="ph-duotone ph-lock-simple"></i>Finish the video to open the assignment.</p>`;
  const head = stepHead(n, p.task_done, 'Assignment') + `<p class="prompt">${esc(t.text)}</p>`;
  const tick = (needFile) => `<label class="tick ${p.task_done ? 'on' : ''} ${needFile && !p.task_file ? 'off' : ''}"><input type="checkbox" data-act="tick" ${p.task_done ? 'checked' : ''} ${needFile && !p.task_file ? 'disabled' : ''}><span class="box"><i class="ph-bold ph-check"></i></span><span>${p.task_done ? 'Completed' : 'Tick completed'}</span></label>`;
  if (t.kind === 'tick') return head + `<div class="row">${tick()}<span class="muted small">${p.task_done ? `Ticked ${fmtDate(p.updated_at)} · your trainer can see this.` : ''}</span></div>`;
  if (t.kind === 'upload') return head + `<div class="upl"><input type="file" id="taskFile"><button class="btn ghost" data-act="upload"><i class="ph-duotone ph-upload-simple"></i>${p.task_file ? 'Replace file' : 'Upload file'}</button>
      ${p.task_file ? `<span class="file-ok"><i class="ph-duotone ph-file-check"></i>${esc(fileName(p.task_file))}</span>` : ''}</div>
    <div class="row">${tick(true)}<span class="muted small">${p.task_file ? '' : 'Upload the file first.'}</span></div>`;
  const min = t.minChars ?? 40;
  return head + `<textarea id="taskTxt" rows="${min < 40 ? 2 : 7}" placeholder="Write your response here…">${esc(p.task_response || '')}</textarea>
    <div class="row"><button class="btn primary" data-act="task">${p.task_done ? 'Update response' : 'Submit'}</button>
    <span class="muted small">${p.task_done ? 'Submitted · your trainer can see this response.' : `At least ${min} characters.`}</span></div>`;
}

function quizHTML(s, n) {
  if (s.pendingQuiz) return stepHead(n, false, 'Assessment') + `<p class="locked"><i class="ph-duotone ph-hourglass-medium"></i>${s.pendingQuiz} questions · coming soon. This doesn’t hold up your progress.</p>`;
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
  addCaptions(s, v);
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
const groupBy = progress => { const by = {}; progress.forEach(r => ((by[r.user_id] ||= {})[r.section_id] = r)); return by; };
async function renderTeam() {
  $app.innerHTML = shell(`<div class="page"><p class="muted">Loading team progress…</p></div>`, 'team');
  const { profiles, progress } = teamCache = await api.team();
  const by = groupBy(progress);
  const rows = profiles.map(p => { const prog = by[p.id] || {}; const scores = Object.values(prog).map(r => r.quiz_score).filter(x => x != null);
    const last = Object.values(prog).map(r => r.updated_at).sort().pop();
    return { p, prog, o: overall(prog), avg: scores.length ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : null, last, next: SECTIONS.find(s => !isDone(s, prog)) }; });
  $app.innerHTML = shell(`<div class="page wide">
    <section class="hero"><p class="kicker">Trainer view</p><h1>Team progress</h1>
      <p class="muted">${rows.length} trainee${rows.length === 1 ? '' : 's'} · ${SECTIONS.length} sections across ${MODS.length} modules · click a trainee to see their submissions and send feedback</p>
      <button class="btn ghost" data-act="csv"><i class="ph-duotone ph-download-simple"></i>Download detail (CSV)</button></section>
    <div class="table-wrap"><table class="tbl"><thead><tr><th>Trainee</th>${MODS.map((m, i) => `<th title="${esc(m.title)}">M${i + 1}</th>`).join('')}<th>Overall</th><th>Avg score</th><th>Current section</th><th>Last active</th></tr></thead>
    <tbody>${rows.map(r => `<tr class="click" data-href="#/team/${esc(r.p.id)}"><td><a href="#/team/${esc(r.p.id)}"><b>${esc(r.p.full_name || r.p.username)}</b></a><small>${esc(r.p.username)}</small></td>
      ${MODS.map(m => { const v = modPct(m, r.prog); return `<td class="pc ${v === 1 ? 'full' : ''}">${Math.round(v * 100)}%</td>`; }).join('')}
      <td class="ov">${meter(r.o)}<span>${Math.round(r.o * 100)}%</span></td><td>${r.avg == null ? '—' : r.avg + '%'}</td>
      <td>${r.next ? `${r.next.code} ${esc(r.next.title)}` : 'Finished'}</td><td>${fmtDate(r.last)}</td></tr>`).join('') || `<tr><td colspan="${MODS.length + 5}" class="muted">No trainee accounts yet. Add users in Supabase → Authentication → Users.</td></tr>`}</tbody></table></div>
  </div>`, 'team');
}

async function renderTrainee(id) {
  $app.innerHTML = shell(`<div class="page"><p class="muted">Loading…</p></div>`, 'team');
  if (!teamCache) teamCache = await api.team();
  const p = teamCache.profiles.find(x => x.id === id);
  if (!p) { $app.innerHTML = shell(`<div class="page"><a href="#/team" class="back"><i class="ph-bold ph-arrow-left"></i>Team progress</a><p class="muted">Trainee not found.</p></div>`, 'team'); return; }
  const prog = groupBy(teamCache.progress)[id] || {}, fbs = await api.feedback(id);
  const sub = s => {
    const r = prog[s.id] || {}, st = stateOf(s, prog), f = fbs.filter(x => x.section_id === s.id);
    const parts = [];
    if (hasVid(s)) parts.push(`<p class="sub-line"><i class="ph-duotone ph-play-circle"></i>Video: ${r.video_done ? 'watched' : (r.video_pct || 0) + '%'}</p>`);
    if (s.quiz) { const a = r.quiz_answers;
      parts.push(`<div class="sub-block"><p class="sub-line"><i class="ph-duotone ph-list-checks"></i>Assessment: ${r.quiz_attempts ? `best ${r.quiz_score}% · ${r.quiz_passed ? 'passed' : 'not passed'} · ${r.quiz_attempts} attempt${r.quiz_attempts === 1 ? '' : 's'}` : 'not attempted'}</p>
        ${a ? `<details><summary>Last attempt · ${a.score}% · ${fmtDate(a.at)}</summary><ol class="ans">${s.quiz.map((q, i) => `<li class="${a.sel[i] === 0 ? 'right' : 'wrong'}"><b>${esc(q.q)}</b><span><i class="ph-bold ${a.sel[i] === 0 ? 'ph-check' : 'ph-x'}"></i>${esc(q.options[a.sel[i]] ?? '—')}</span>${a.sel[i] === 0 ? '' : `<small>Correct: ${esc(q.options[0])}</small>`}</li>`).join('')}</ol></details>` : ''}</div>`); }
    if (s.task) { const t = s.task;
      parts.push(`<div class="sub-block"><p class="sub-line"><i class="ph-duotone ph-clipboard-text"></i>Assignment: ${r.task_done ? (t.kind === 'text' ? 'submitted' : 'ticked completed') : 'not done'}${r.task_done ? ' · ' + fmtDate(r.updated_at) : ''}</p>
        ${t.kind === 'text' && r.task_response ? `<p class="resp pre">${esc(r.task_response)}</p>` : ''}
        ${t.kind === 'upload' && r.task_file ? `<button class="btn ghost sm" data-act="file" data-path="${esc(r.task_file)}"><i class="ph-duotone ph-file-arrow-down"></i>${esc(fileName(r.task_file))}</button>` : ''}</div>`); }
    return `<details class="trow ${st}" ${f.length || r.task_response || r.task_file ? '' : ''}><summary><i class="ph-duotone ${ICON[st]} st"></i><span class="code">${s.code}</span><span class="t">${esc(s.title)}</span>${chips(s, prog)}${f.length ? `<span class="chip fbc"><i class="ph-duotone ph-chat-centered-text"></i>${f.length}</span>` : ''}</summary>
      <div class="trow-body">${parts.join('')}
        ${f.length ? `<div class="fb-thread">${f.map(x => `<div class="fb-item"><p class="pre">${esc(x.body)}</p><small class="muted">${esc(x.author_name || 'Trainer')} · ${fmtDate(x.created_at)} · ${x.read_at ? 'read' : 'unread'}</small></div>`).join('')}</div>` : ''}
        <form class="form fb-form" data-form="fb" data-sec="${esc(s.id)}" data-user="${esc(id)}"><textarea name="b" rows="2" required placeholder="Feedback for ${esc(p.full_name || p.username)} on ${s.code}…"></textarea><button class="btn primary sm" type="submit">Send feedback</button></form>
      </div></details>`;
  };
  $app.innerHTML = shell(`<div class="page wide">
    <a href="#/team" class="back"><i class="ph-bold ph-arrow-left"></i>Team progress</a>
    <section class="hero"><p class="kicker">Trainee</p><h1>${esc(p.full_name || p.username)}</h1>
      <div class="hero-meter">${meter(overall(prog), 'big')}<span>${SECTIONS.filter(s => isDone(s, prog)).length} of ${SECTIONS.length} sections complete · ${Math.round(overall(prog) * 100)}%</span></div></section>
    ${MODS.map((m, mi) => `<section class="tmod"><h2><span class="mod-num sm">${pad(mi + 1)}</span>${esc(m.title)}</h2>${m.leaves.map(sub).join('')}</section>`).join('')}
  </div>`, 'team');
}

function downloadCSV() {
  const { profiles, progress } = teamCache, by = groupBy(progress);
  const q = v => `"${String(v ?? '').replace(/"/g, '""')}"`;
  const lines = [['username', 'module', 'section', 'title', 'video_watched_pct', 'video_done', 'task_done', 'task_response', 'task_file', 'quiz_best_score', 'quiz_passed', 'quiz_attempts', 'updated_at'].join(',')];
  profiles.forEach(p => SECTIONS.forEach(s => { const r = (by[p.id] || {})[s.id] || {};
    lines.push([p.username, s.mod.title, s.code, s.title, r.video_pct ?? 0, !!r.video_done, s.task ? !!r.task_done : 'n/a', r.task_response, fileName(r.task_file), r.quiz_score, s.quiz ? !!r.quiz_passed : 'n/a', r.quiz_attempts ?? 0, r.updated_at].map(q).join(',')); }));
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
document.addEventListener('click', e => { const np = document.getElementById('np'); if (np && !np.hidden && !e.target.closest('.bell-wrap')) np.hidden = true; });
$app.addEventListener('click', async e => {
  const row = e.target.closest('tr.click'); if (row && !e.target.closest('a')) { location.hash = row.dataset.href; return; }
  const b = e.target.closest('[data-act]'); if (!b) return;
  const s = byId[(location.hash.match(/#\/s\/(.+)$/) || [])[1]];
  switch (b.dataset.act) {
    case 'out': await api.signOut(); user = profile = null; P = {}; teamCache = null; location.hash = ''; route(); break;
    case 'pw': pwDialog(); break;
    case 'bell': { const np = document.getElementById('np'); np.hidden = !np.hidden; if (!np.hidden) { np.innerHTML = notifPanel(); clearNotifs(); } break; }
    case 'csv': downloadCSV(); break;
    case 'demo-watch': await api.save(s.id, { video_pct: 100, video_done: true }); refresh(s); break;
    case 'task': {
      const v = document.getElementById('taskTxt').value.trim(), min = s.task.minChars ?? 40;
      if (v.length < min) return toast(`Please write at least ${min} characters.`);
      b.disabled = true; await api.save(s.id, { task_done: true, task_response: v }); toast('Assignment submitted.'); refresh(s); break;
    }
    case 'tick': { await api.save(s.id, { task_done: b.checked }); refresh(s); break; }
    case 'upload': {
      const f = document.getElementById('taskFile').files[0]; if (!f) return toast('Choose a file first.');
      if (f.size > 50 * 1024 * 1024) return toast('The file is over 50 MB.');
      b.disabled = true;
      try { const path = await api.upload(s.id, f); await api.save(s.id, { task_file: path }); toast('File uploaded. Now tick completed.'); }
      catch (x) { toast('Upload failed: ' + x.message); }
      refresh(s); break;
    }
    case 'file': { const u = await api.fileUrl(b.dataset.path); u ? window.open(u, '_blank', 'noopener') : toast(DEMO ? 'Files are not stored in demo mode.' : 'Could not open the file.'); break; }
    case 'delmeet': if (confirm('Remove this session?')) { await api.delMeeting(b.dataset.id); renderLive(); } break;
    case 'quiz': {
      const sel = s.quiz.map((q, i) => { const el = document.querySelector(`input[name="q${i}"]:checked`); return el ? +el.value : null; });
      if (sel.includes(null)) return toast('Answer every question first.');
      const fb = sel.map(x => x === 0), score = Math.round(fb.filter(Boolean).length / fb.length * 100), passed = score >= C.PASS_MARK, p = P[s.id] || {};
      quizState[s.id] = { sel, fb, score, passed, submitted: true };
      b.disabled = true;
      await api.save(s.id, { quiz_score: Math.max(score, p.quiz_score || 0), quiz_passed: !!p.quiz_passed || passed, quiz_attempts: (p.quiz_attempts || 0) + 1, quiz_answers: { sel, score, at: now() } });
      refresh(s); break;
    }
    case 'retake': quizState[s.id] = { sel: [], submitted: false }; refresh(s); break;
  }
});
$app.addEventListener('submit', async e => {
  const f = e.target.closest('[data-form]'); if (!f) return; e.preventDefault();
  const btn = f.querySelector('[type=submit]'); btn.disabled = true;
  switch (f.dataset.form) {
    case 'ask': await api.ask(f.q.value.trim()); toast('Question posted.'); renderQA(); break;
    case 'answer': await api.answer(f.dataset.id, f.a.value.trim()); toast('Answer shared with all trainees.'); renderQA(); loadNotifs(); break;
    case 'meet': await api.addMeeting({ title: f.title.value.trim(), url: f.url.value.trim(), starts_at: new Date(f.at.value).toISOString() }); toast('Session published.'); renderLive(); break;
    case 'fb': {
      await api.sendFeedback(f.dataset.user, f.dataset.sec, f.b.value.trim()); toast('Feedback sent.');
      const open = f.closest('details'), code = open?.querySelector('.code')?.textContent;
      await renderTrainee(f.dataset.user);
      [...document.querySelectorAll('.trow')].find(d => d.querySelector('.code')?.textContent === code)?.setAttribute('open', '');
      break;
    }
  }
});

/* ---------- router ---------- */
function route() {
  if (!user) return renderLogin();
  const [, a, b] = (location.hash.slice(1) || '/').split('/');
  if (a === 's' && byId[b]) renderSection(byId[b]);
  else if (a === 'ref') renderRef();
  else if (a === 'qa') renderQA();
  else if (a === 'live') renderLive();
  else if (a === 'team' && profile?.is_admin) { if (b) renderTrainee(b); else { teamCache = null; renderTeam(); } }
  else renderHome();
  loadNotifs();
}
async function loadUser() { profile = await api.profile(); P = await api.progress(); await loadNotifs(); }
window.addEventListener('hashchange', () => { route(); window.scrollTo(0, 0); });
new ResizeObserver(() => { const t = document.querySelector('.top'); if (t) document.documentElement.style.setProperty('--top-h', t.offsetHeight + 'px'); }).observe(document.getElementById('app'));
(async () => {
  user = await api.session();
  if (user) await loadUser();
  route();
  if (sb) sb.auth.onAuthStateChange(ev => { if (ev === 'SIGNED_OUT' && user) { user = null; route(); } });
  setInterval(() => { if (user) loadNotifs(); }, 20000);
  document.addEventListener('visibilitychange', () => { if (user && !document.hidden) loadNotifs(); });
  if (sb && user) sb.channel('bw-live')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'feedback' }, () => loadNotifs())
    .on('postgres_changes', { event: '*', schema: 'public', table: 'meetings' }, () => loadNotifs())
    .on('postgres_changes', { event: '*', schema: 'public', table: 'questions' }, () => loadNotifs())
    .subscribe();
})();
})();
