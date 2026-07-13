// pages.js — all HTML rendering (server-side templates, zero dependencies).
import { esc, fmtDateTime } from './util.js';
import { store } from './store.js';
import { smtpConfigured } from './mailer.js';

const CSS = `
:root{--brand:#1f6feb;--brand-dark:#1a5fd0;--bg:#f4f6fa;--card:#fff;--ink:#1c2333;--muted:#6b7385;--line:#e3e8f0;--good:#1a7f37;--warn:#b35900;--bad:#c0392b}
*{box-sizing:border-box}
body{margin:0;font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Helvetica,Arial,sans-serif;background:var(--bg);color:var(--ink);font-size:15px;line-height:1.55}
a{color:var(--brand);text-decoration:none}a:hover{text-decoration:underline}
.nav{background:#111827;color:#fff;padding:0 20px;display:flex;align-items:center;gap:4px;flex-wrap:wrap}
.nav .logo{font-weight:700;font-size:17px;padding:14px 12px 14px 0;color:#fff;letter-spacing:.3px}
.nav .logo span{color:#7ab5ff}
.nav a.item{color:#c7d0e0;padding:14px 12px;display:inline-block;font-size:14px}
.nav a.item:hover,.nav a.item.on{color:#fff;text-decoration:none;box-shadow:inset 0 -3px 0 var(--brand)}
.nav .spacer{flex:1}
.wrap{max-width:1080px;margin:0 auto;padding:24px 20px 60px}
h1{font-size:22px;margin:6px 0 18px}h2{font-size:17px;margin:26px 0 10px}
.card{background:var(--card);border:1px solid var(--line);border-radius:10px;padding:18px 20px;margin-bottom:18px}
.tiles{display:grid;grid-template-columns:repeat(auto-fit,minmax(160px,1fr));gap:14px;margin-bottom:18px}
.tile{background:var(--card);border:1px solid var(--line);border-radius:10px;padding:14px 16px}
.tile .n{font-size:26px;font-weight:700}.tile .l{color:var(--muted);font-size:13px}
table{width:100%;border-collapse:collapse;font-size:14px}
th{text-align:left;color:var(--muted);font-weight:600;font-size:12px;text-transform:uppercase;letter-spacing:.4px;padding:8px 10px;border-bottom:2px solid var(--line)}
td{padding:10px;border-bottom:1px solid var(--line);vertical-align:top}
tr:hover td{background:#f8fafd}
.badge{display:inline-block;padding:2px 10px;border-radius:999px;font-size:12px;font-weight:600}
.b-new{background:#e7f0ff;color:#1a5fd0}.b-contacted{background:#fff4e0;color:#b35900}
.b-booked{background:#e9d8fd;color:#6b21a8}.b-won{background:#dcfce7;color:#166534}.b-lost{background:#fee2e2;color:#991b1b}.b-imported{background:#e5e7eb;color:#374151}
input,select,textarea{width:100%;padding:9px 11px;border:1px solid #cbd3e0;border-radius:8px;font:inherit;background:#fff;color:var(--ink)}
input:focus,select:focus,textarea:focus{outline:2px solid #bcd3ff;border-color:var(--brand)}
label{display:block;font-size:13px;font-weight:600;margin:12px 0 4px;color:#3a4256}
.row{display:flex;gap:14px;flex-wrap:wrap}.row>div{flex:1;min-width:180px}
.btn{display:inline-block;background:var(--brand);color:#fff;border:none;border-radius:8px;padding:10px 18px;font:inherit;font-weight:600;cursor:pointer}
.btn:hover{background:var(--brand-dark);text-decoration:none}
.btn.secondary{background:#fff;color:var(--ink);border:1px solid #cbd3e0}
.btn.small{padding:5px 12px;font-size:13px}
.btn.danger{background:#fff;color:var(--bad);border:1px solid #f0b9b3}
.banner{border-radius:10px;padding:12px 16px;margin-bottom:16px;font-size:14px}
.banner.info{background:#e7f0ff;border:1px solid #bcd3ff;color:#1a3f7a}
.banner.ok{background:#dcfce7;border:1px solid #a7e3bc;color:#14532d}
.banner.err{background:#fee2e2;border:1px solid #f3b3b3;color:#7f1d1d}
.muted{color:var(--muted);font-size:13px}
.timeline{list-style:none;padding:0;margin:0}
.timeline li{padding:8px 0 8px 18px;border-left:2px solid var(--line);position:relative;font-size:14px}
.timeline li:before{content:"";width:8px;height:8px;border-radius:50%;background:var(--brand);position:absolute;left:-5px;top:14px}
code,pre{background:#f0f3f8;border:1px solid var(--line);border-radius:6px;font-size:13px}
code{padding:2px 6px}pre{padding:12px;overflow-x:auto;white-space:pre-wrap;word-break:break-all}
.center{max-width:460px;margin:8vh auto;padding:0 16px}
.pub{max-width:560px;margin:6vh auto;padding:0 16px}
.pub .card{padding:26px 28px}
.pub h1{font-size:24px}
.slotgrid{display:flex;flex-wrap:wrap;gap:8px;margin:10px 0}
.slot{border:1px solid #cbd3e0;background:#fff;border-radius:8px;padding:8px 12px;cursor:pointer;font:inherit;font-size:14px}
.slot.sel{background:var(--brand);color:#fff;border-color:var(--brand)}
.daybtn{border:1px solid #cbd3e0;background:#fff;border-radius:8px;padding:8px 10px;cursor:pointer;font:inherit;font-size:13px;text-align:center;min-width:74px}
.daybtn.sel{background:var(--brand);color:#fff;border-color:var(--brand)}
.checkrow{display:flex;align-items:center;gap:8px;margin:6px 0}
.checkrow input{width:auto}
@media(max-width:640px){.wrap{padding:16px 12px 50px}.nav{padding:0 10px}}
`;

export function layout(title, body, { nav = true, active = '' } = {}) {
  const biz = store.settings.business.name;
  const items = [
    ['dashboard', 'Dashboard'], ['leads', 'Leads'], ['appointments', 'Appointments'],
    ['campaigns', 'Campaigns'], ['settings', 'Settings'], ['help', 'Help & Share'],
  ];
  const navHtml = nav ? `<div class="nav">
    <span class="logo">Lead<span>Flow</span> Pro</span>
    ${items.map(([k, l]) => `<a class="item ${active === k ? 'on' : ''}" href="/${k}">${l}</a>`).join('')}
    <span class="spacer"></span>
    <a class="item" href="/logout">Log out</a>
  </div>` : '';
  return `<!doctype html><html lang="en"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>${esc(title)}${biz ? ' — ' + esc(biz) : ''}</title>
<style>${CSS}</style></head><body>${navHtml}${body}</body></html>`;
}

export function flash(msg, kind = 'ok') {
  return msg ? `<div class="banner ${kind}">${esc(msg)}</div>` : '';
}

export function statusBadge(s) {
  return `<span class="badge b-${esc(s)}">${esc(s)}</span>`;
}

// ---------- Setup wizard ----------
export function setupPage(error) {
  return layout('Welcome to LeadFlow Pro', `<div class="center">
  <div class="card">
    <h1 style="margin-top:4px">👋 Welcome to LeadFlow Pro</h1>
    <p>Let's get your automated lead system running. This takes about a minute — you can change everything later in Settings.</p>
    ${flash(error, 'err')}
    <form method="post" action="/setup">
      <label>Business name</label>
      <input name="bizName" required placeholder="e.g. Brewer Plumbing Co." maxlength="120">
      <label>Your email (where lead alerts are sent)</label>
      <input name="ownerEmail" type="email" required placeholder="you@yourbusiness.com">
      <label>Business phone (optional)</label>
      <input name="phone" placeholder="(555) 123-4567">
      <label>Create a password for this dashboard</label>
      <input name="password" type="password" required minlength="6" placeholder="At least 6 characters">
      <div style="margin-top:18px"><button class="btn" style="width:100%">Start capturing leads →</button></div>
    </form>
  </div>
  <p class="muted" style="text-align:center">Your data never leaves this computer. It's stored in the app's <code>data</code> folder.</p>
</div>`, { nav: false });
}

export function loginPage(error) {
  return layout('Log in', `<div class="center">
  <div class="card">
    <h1 style="margin-top:4px">Lead<span style="color:var(--brand)">Flow</span> Pro</h1>
    ${flash(error, 'err')}
    <form method="post" action="/login">
      <label>Dashboard password</label>
      <input name="password" type="password" required autofocus>
      <div style="margin-top:16px"><button class="btn" style="width:100%">Log in</button></div>
    </form>
  </div>
</div>`, { nav: false });
}

export function resetPasswordPage(error) {
  return layout('Set a new password', `<div class="center">
  <div class="card">
    <h1 style="margin-top:4px">Set a new dashboard password</h1>
    <p class="muted">No password is currently set for this dashboard.</p>
    ${flash(error, 'err')}
    <form method="post" action="/reset-password">
      <label>New password</label>
      <input name="password" type="password" required minlength="6" autofocus>
      <div style="margin-top:16px"><button class="btn" style="width:100%">Save and log in</button></div>
    </form>
  </div>
</div>`, { nav: false });
}

// ---------- Dashboard ----------
export function dashboardPage({ msg }) {
  const leads = store.leads;
  const weekAgo = Date.now() - 7 * 864e5;
  const newThisWeek = leads.filter((l) => new Date(l.createdAt).getTime() > weekAgo).length;
  const inFollowup = leads.filter((l) => l.sequence && !l.sequence.paused && !['booked', 'won', 'lost'].includes(l.status) && l.email).length;
  const upcoming = store.appointments.filter((a) => !a.cancelled && new Date(a.start) > new Date())
    .sort((a, b) => a.start.localeCompare(b.start));
  const won = leads.filter((l) => l.status === 'won').length;
  const hot = leads.filter((l) => l.status === 'new').slice(0, 8);

  const smtpBanner = smtpConfigured() ? '' :
    `<div class="banner info"><b>Demo mode:</b> email sending isn't set up yet, so outgoing emails are saved to the outbox folder instead of being sent. Connect your email in <a href="/settings#email">Settings → Email Sending</a> (takes ~2 minutes).</div>`;

  return layout('Dashboard', `<div class="wrap">
  <h1>Dashboard</h1>
  ${flash(msg)}${smtpBanner}
  <div class="tiles">
    <div class="tile"><div class="n">${newThisWeek}</div><div class="l">New leads this week</div></div>
    <div class="tile"><div class="n">${inFollowup}</div><div class="l">In automated follow-up</div></div>
    <div class="tile"><div class="n">${upcoming.length}</div><div class="l">Upcoming appointments</div></div>
    <div class="tile"><div class="n">${won}</div><div class="l">Leads won</div></div>
  </div>

  <div class="card">
    <h2 style="margin-top:0">🔥 Newest leads — follow up fast</h2>
    ${hot.length ? `<table><tr><th>Name</th><th>Contact</th><th>Message</th><th>Came in</th><th></th></tr>
      ${hot.map((l) => `<tr>
        <td><a href="/lead/${l.id}"><b>${esc(l.name || '(no name)')}</b></a></td>
        <td>${esc(l.email)}<br><span class="muted">${esc(l.phone)}</span></td>
        <td>${esc((l.message || '').slice(0, 80))}${(l.message || '').length > 80 ? '…' : ''}</td>
        <td class="muted">${fmtDateTime(l.createdAt)}</td>
        <td><a class="btn small secondary" href="/lead/${l.id}">Open</a></td>
      </tr>`).join('')}</table>` : `<p class="muted">No new leads yet. Share your capture form link (see <a href="/help">Help &amp; Share</a>) to start collecting leads.</p>`}
  </div>

  <div class="card">
    <h2 style="margin-top:0">📅 Upcoming appointments</h2>
    ${upcoming.length ? `<table><tr><th>When</th><th>Who</th><th>Contact</th></tr>
      ${upcoming.slice(0, 8).map((a) => `<tr>
        <td><b>${fmtDateTime(a.start)}</b></td>
        <td>${a.leadId ? `<a href="/lead/${a.leadId}">${esc(a.name)}</a>` : esc(a.name)}</td>
        <td>${esc(a.email)}</td>
      </tr>`).join('')}</table>` : `<p class="muted">Nothing booked yet. Your booking page is included in every automated email — leads can self-schedule 24/7.</p>`}
  </div>
</div>`, { active: 'dashboard' });
}

// ---------- Leads ----------
const STATUSES = ['new', 'contacted', 'booked', 'won', 'lost'];

export function leadsPage({ msg, err, filter = '', q = '' }) {
  let leads = store.leads;
  if (filter) leads = leads.filter((l) => l.status === filter);
  if (q) {
    const needle = q.toLowerCase();
    leads = leads.filter((l) => [l.name, l.email, l.phone, l.message].join(' ').toLowerCase().includes(needle));
  }
  return layout('Leads', `<div class="wrap">
  <h1>Leads</h1>
  ${flash(msg)}${flash(err, 'err')}
  <div class="card">
    <form method="get" action="/leads" class="row" style="align-items:flex-end">
      <div><label>Search</label><input name="q" value="${esc(q)}" placeholder="Name, email, phone…"></div>
      <div><label>Status</label><select name="filter">
        <option value="">All statuses</option>
        ${STATUSES.map((s) => `<option value="${s}" ${filter === s ? 'selected' : ''}>${s}</option>`).join('')}
      </select></div>
      <div style="flex:0"><button class="btn secondary">Filter</button></div>
      <div style="flex:0"><a class="btn secondary" href="/export.csv">Export CSV</a></div>
    </form>
  </div>

  <div class="card">
    <h2 style="margin-top:0">Add a lead manually</h2>
    <form method="post" action="/leads/add" class="row" style="align-items:flex-end">
      <div><label>Name</label><input name="name" required></div>
      <div><label>Email</label><input name="email" type="email" placeholder="Needed for automated emails"></div>
      <div><label>Phone</label><input name="phone"></div>
      <div style="flex:0"><button class="btn">Add lead</button></div>
    </form>
    <p class="muted" style="margin-bottom:0">New leads automatically get the instant reply + follow-up sequence (when they have an email).</p>
  </div>

  <div class="card">
    ${leads.length ? `<table><tr><th>Name</th><th>Contact</th><th>Status</th><th>Source</th><th>Created</th><th></th></tr>
    ${leads.map((l) => `<tr>
      <td><a href="/lead/${l.id}"><b>${esc(l.name || '(no name)')}</b></a></td>
      <td>${esc(l.email)}<br><span class="muted">${esc(l.phone)}</span></td>
      <td>${statusBadge(l.status)}</td>
      <td class="muted">${esc(l.source)}</td>
      <td class="muted">${fmtDateTime(l.createdAt)}</td>
      <td><a class="btn small secondary" href="/lead/${l.id}">Open</a></td>
    </tr>`).join('')}</table>` : '<p class="muted">No leads match.</p>'}
  </div>
</div>`, { active: 'leads' });
}

export function leadDetailPage(lead, { msg, err }) {
  const acts = store.leadActivity(lead.id);
  const appts = store.appointments.filter((a) => a.leadId === lead.id && !a.cancelled);
  const seq = lead.sequence;
  const seqState = !lead.email ? 'No email on file — automated emails can\'t be sent.'
    : !seq ? 'No sequence.'
    : ['booked', 'won', 'lost'].includes(lead.status) ? `Stopped automatically (lead is ${lead.status}).`
    : seq.paused ? 'Paused.'
    : `Active (${seq.type === 'reactivation' ? 're-engagement' : 'standard'}) — ${seq.sentSteps.length} follow-up(s) sent so far.`;

  return layout(lead.name || 'Lead', `<div class="wrap">
  <p><a href="/leads">← All leads</a></p>
  <h1>${esc(lead.name || '(no name)')} ${statusBadge(lead.status)}</h1>
  ${flash(msg)}${flash(err, 'err')}
  <div class="row">
    <div style="flex:2;min-width:300px">
      <div class="card">
        <h2 style="margin-top:0">Details</h2>
        <p><b>Email:</b> ${lead.email ? `<a href="mailto:${esc(lead.email)}">${esc(lead.email)}</a>` : '<span class="muted">none</span>'}<br>
        <b>Phone:</b> ${lead.phone ? `<a href="tel:${esc(lead.phone)}">${esc(lead.phone)}</a>` : '<span class="muted">none</span>'}<br>
        <b>Source:</b> ${esc(lead.source)} · <b>Created:</b> ${fmtDateTime(lead.createdAt)}</p>
        ${lead.message ? `<p><b>Original message:</b><br>${esc(lead.message)}</p>` : ''}
        ${appts.length ? `<p><b>Appointments:</b> ${appts.map((a) => fmtDateTime(a.start)).join(', ')}</p>` : ''}
        <form method="post" action="/lead/${lead.id}/status" class="row" style="align-items:flex-end">
          <div><label>Change status</label><select name="status">
            ${STATUSES.map((s) => `<option value="${s}" ${lead.status === s ? 'selected' : ''}>${s}</option>`).join('')}
          </select></div>
          <div style="flex:0"><button class="btn small">Update</button></div>
        </form>
      </div>

      <div class="card">
        <h2 style="margin-top:0">Send a one-off email</h2>
        <form method="post" action="/lead/${lead.id}/send">
          <label>Subject</label><input name="subject" required value="">
          <label>Message</label><textarea name="body" rows="6" required placeholder="Hi {{first_name}}, …  (merge tags work here too)"></textarea>
          <div style="margin-top:12px"><button class="btn" ${lead.email ? '' : 'disabled title="Lead has no email"'}>Send email</button></div>
        </form>
      </div>

      <div class="card">
        <h2 style="margin-top:0">Notes</h2>
        ${(lead.notes || []).map((n) => `<p style="margin:6px 0"><span class="muted">${fmtDateTime(n.at)}:</span> ${esc(n.text)}</p>`).join('') || '<p class="muted">No notes yet.</p>'}
        <form method="post" action="/lead/${lead.id}/note" class="row" style="align-items:flex-end">
          <div><input name="text" required placeholder="Add a note…"></div>
          <div style="flex:0"><button class="btn small secondary">Save note</button></div>
        </form>
      </div>
    </div>

    <div style="flex:1;min-width:240px">
      <div class="card">
        <h2 style="margin-top:0">Automation</h2>
        <p class="muted">${esc(seqState)}</p>
        <form method="post" action="/lead/${lead.id}/pause" style="display:inline"><button class="btn small secondary">${seq?.paused ? 'Resume follow-ups' : 'Pause follow-ups'}</button></form>
        <form method="post" action="/lead/${lead.id}/restart" style="display:inline;margin-left:6px"><button class="btn small secondary">Restart sequence</button></form>
        <hr style="border:none;border-top:1px solid var(--line);margin:14px 0">
        <form method="post" action="/lead/${lead.id}/delete" onsubmit="return confirm('Delete this lead permanently?')"><button class="btn small danger">Delete lead</button></form>
      </div>
      <div class="card">
        <h2 style="margin-top:0">Activity</h2>
        <ul class="timeline">
          ${acts.slice(0, 30).map((a) => `<li><span class="muted">${fmtDateTime(a.at)}</span><br>${esc(a.text)}</li>`).join('') || '<li class="muted">No activity yet.</li>'}
        </ul>
      </div>
    </div>
  </div>
</div>`, { active: 'leads' });
}

// ---------- Appointments ----------
export function appointmentsPage({ msg }) {
  const appts = [...store.appointments].sort((a, b) => b.start.localeCompare(a.start));
  return layout('Appointments', `<div class="wrap">
  <h1>Appointments</h1>
  ${flash(msg)}
  <div class="card">
    ${appts.length ? `<table><tr><th>When</th><th>Who</th><th>Contact</th><th>Status</th><th></th></tr>
    ${appts.map((a) => `<tr>
      <td><b>${fmtDateTime(a.start)}</b></td>
      <td>${a.leadId ? `<a href="/lead/${a.leadId}">${esc(a.name)}</a>` : esc(a.name)}</td>
      <td>${esc(a.email)}<br><span class="muted">${esc(a.phone || '')}</span></td>
      <td>${a.cancelled ? '<span class="badge b-lost">cancelled</span>' : new Date(a.start) < new Date() ? '<span class="badge b-imported">past</span>' : '<span class="badge b-booked">upcoming</span>'}</td>
      <td>${!a.cancelled && new Date(a.start) > new Date() ? `<form method="post" action="/appointment/${a.id}/cancel" onsubmit="return confirm('Cancel this appointment?')"><button class="btn small danger">Cancel</button></form>` : ''}</td>
    </tr>`).join('')}</table>` : '<p class="muted">No appointments yet. Leads book themselves through your booking page — the link is in every automated email, or share it directly (see <a href="/help">Help &amp; Share</a>).</p>'}
  </div>
  <p class="muted">Your booking availability is set in <a href="/settings#availability">Settings → Availability</a>. Confirmed appointments send a calendar invite to the customer and an alert to you, plus an automatic 24-hour reminder.</p>
</div>`, { active: 'appointments' });
}

// ---------- Campaigns ----------
export function campaignsPage({ msg, err }) {
  const stale = (days) => store.leads.filter((l) => !['booked'].includes(l.status)
    && new Date(l.lastActivityAt || l.createdAt).getTime() < Date.now() - days * 864e5 && l.email).length;
  return layout('Campaigns', `<div class="wrap">
  <h1>Campaigns — turn old leads into new sales</h1>
  ${flash(msg)}${flash(err, 'err')}

  <div class="card">
    <h2 style="margin-top:0">1. Import your old leads / customer list (CSV)</h2>
    <p class="muted">Paste CSV text below. First row must be headers. Recognized columns: <code>name</code>, <code>email</code>, <code>phone</code> (exported from almost any spreadsheet or CRM). Imported leads do <b>not</b> get the new-lead auto-reply — they wait quietly until you launch a re-engagement campaign.</p>
    <form method="post" action="/campaigns/import">
      <textarea name="csv" rows="6" placeholder="name,email,phone&#10;Jane Doe,jane@example.com,555-1234&#10;John Smith,john@example.com,555-9876"></textarea>
      <div style="margin-top:12px"><button class="btn">Import leads</button></div>
    </form>
  </div>

  <div class="card">
    <h2 style="margin-top:0">2. Launch a re-engagement campaign</h2>
    <p class="muted">Sends your re-engagement email sequence (editable in <a href="/settings#templates">Settings → Templates</a>) to every lead that matches. Leads who are currently booked are skipped, and anyone who books or is marked won/lost stops receiving emails automatically.</p>
    <form method="post" action="/campaigns/start" onsubmit="return confirm('Start the re-engagement sequence for all matching leads?')">
      <label>Send to leads with no activity in the last…</label>
      <select name="olderThanDays">
        <option value="0">Any time (all matching leads)</option>
        <option value="30" selected>30+ days (currently ${stale(30)} leads)</option>
        <option value="90">90+ days (currently ${stale(90)} leads)</option>
        <option value="180">180+ days (currently ${stale(180)} leads)</option>
      </select>
      <label>Include statuses</label>
      <div class="checkrow"><input type="checkbox" name="st_imported" checked id="sti"><label for="sti" style="margin:0">imported (your uploaded list)</label></div>
      <div class="checkrow"><input type="checkbox" name="st_lost" checked id="stl"><label for="stl" style="margin:0">lost</label></div>
      <div class="checkrow"><input type="checkbox" name="st_contacted" id="stc"><label for="stc" style="margin:0">contacted</label></div>
      <div class="checkrow"><input type="checkbox" name="st_new" id="stn"><label for="stn" style="margin:0">new</label></div>
      <div style="margin-top:14px"><button class="btn">🚀 Launch campaign</button></div>
    </form>
  </div>
</div>`, { active: 'campaigns' });
}

// ---------- Settings ----------
function tplFields(prefix, steps, maxSteps) {
  let html = '';
  for (let i = 0; i < maxSteps; i++) {
    const s = steps[i] || { afterHours: '', subject: '', body: '' };
    html += `<div class="card" style="background:#fafbfe">
      <b>Email ${i + 1}</b> <span class="muted">(leave subject blank to remove this step)</span>
      <div class="row">
        <div style="flex:0;min-width:150px"><label>Send after (hours)</label><input name="${prefix}_h${i}" value="${esc(s.afterHours)}" placeholder="e.g. 24"></div>
        <div><label>Subject</label><input name="${prefix}_s${i}" value="${esc(s.subject)}"></div>
      </div>
      <label>Message</label><textarea name="${prefix}_b${i}" rows="5">${esc(s.body)}</textarea>
    </div>`;
  }
  return html;
}

export function settingsPage({ msg, err }) {
  const st = store.settings;
  const days = [['mon', 'Monday'], ['tue', 'Tuesday'], ['wed', 'Wednesday'], ['thu', 'Thursday'], ['fri', 'Friday'], ['sat', 'Saturday'], ['sun', 'Sunday']];
  return layout('Settings', `<div class="wrap">
  <h1>Settings</h1>
  ${flash(msg)}${flash(err, 'err')}

  <div class="card" id="business">
    <h2 style="margin-top:0">Business</h2>
    <form method="post" action="/settings/business">
      <div class="row">
        <div><label>Business name</label><input name="name" value="${esc(st.business.name)}" required></div>
        <div><label>Owner alert email</label><input name="ownerEmail" type="email" value="${esc(st.business.ownerEmail)}" required></div>
      </div>
      <div class="row">
        <div><label>Phone</label><input name="phone" value="${esc(st.business.phone)}"></div>
        <div><label>Website</label><input name="website" value="${esc(st.business.website)}"></div>
      </div>
      <label>App address (used for links in emails)</label>
      <input name="baseUrl" value="${esc(st.baseUrl)}" placeholder="http://localhost:4321">
      <p class="muted">If leads will open links from other devices, use this computer's network address (see Help &amp; Share).</p>
      <div class="checkrow"><input type="checkbox" name="alertNewLead" id="anl" ${st.alerts.newLead ? 'checked' : ''}><label for="anl" style="margin:0">Email me when a new lead comes in</label></div>
      <div class="checkrow"><input type="checkbox" name="alertBooking" id="ab" ${st.alerts.booking ? 'checked' : ''}><label for="ab" style="margin:0">Email me when an appointment is booked</label></div>
      <div style="margin-top:12px"><button class="btn">Save business info</button></div>
    </form>
  </div>

  <div class="card" id="email">
    <h2 style="margin-top:0">Email sending (SMTP)</h2>
    <p class="muted">Until this is set up, all outgoing email is saved to the <code>data/outbox</code> folder (demo mode). Any email account works — for Gmail use an <b>App Password</b> (Google Account → Security → 2-Step Verification → App passwords). Full walkthrough on the <a href="/help">Help</a> page.</p>
    <form method="post" action="/settings/smtp">
      <div class="row">
        <div><label>SMTP server</label><input name="host" value="${esc(st.smtp.host)}" placeholder="smtp.gmail.com"></div>
        <div style="flex:0;min-width:110px"><label>Port</label><input name="port" value="${esc(st.smtp.port)}" placeholder="587"></div>
      </div>
      <div class="row">
        <div><label>Username</label><input name="user" value="${esc(st.smtp.user)}" placeholder="you@gmail.com"></div>
        <div><label>Password / App password</label><input name="pass" type="password" value="${esc(st.smtp.pass)}"></div>
      </div>
      <div class="row">
        <div><label>"From" name</label><input name="fromName" value="${esc(st.smtp.fromName)}" placeholder="${esc(st.business.name)}"></div>
        <div><label>"From" email</label><input name="fromEmail" value="${esc(st.smtp.fromEmail)}" placeholder="you@gmail.com"></div>
      </div>
      <div class="checkrow"><input type="checkbox" name="secure" id="sec" ${st.smtp.secure ? 'checked' : ''}><label for="sec" style="margin:0">Use implicit SSL (port 465). Leave unchecked for port 587 (STARTTLS).</label></div>
      <div style="margin-top:12px">
        <button class="btn">Save email settings</button>
        <button class="btn secondary" formaction="/settings/test-email">Save &amp; send me a test email</button>
      </div>
    </form>
  </div>

  <div class="card" id="templates">
    <h2 style="margin-top:0">Email templates &amp; automated sequences</h2>
    <p class="muted">Merge tags you can use anywhere: <code>{{first_name}}</code> <code>{{name}}</code> <code>{{business}}</code> <code>{{booking_link}}</code> <code>{{owner_phone}}</code> <code>{{website}}</code></p>
    <form method="post" action="/settings/templates">
      <h2>Instant auto-reply (sent the moment a lead comes in)</h2>
      <label>Subject</label><input name="ar_subject" value="${esc(st.templates.autoReply.subject)}">
      <label>Message</label><textarea name="ar_body" rows="6">${esc(st.templates.autoReply.body)}</textarea>

      <h2>Follow-up sequence (new leads)</h2>
      ${tplFields('fu', st.followups, Math.max(4, st.followups.length))}

      <h2>Re-engagement sequence (campaigns for old leads)</h2>
      ${tplFields('re', st.reactivation, Math.max(3, st.reactivation.length))}

      <div style="margin-top:12px"><button class="btn">Save templates</button></div>
    </form>
  </div>

  <div class="card" id="availability">
    <h2 style="margin-top:0">Booking availability</h2>
    <form method="post" action="/settings/availability">
      <div class="row">
        <div><label>Appointment length (minutes)</label><input name="slotMinutes" value="${esc(st.availability.slotMinutes)}"></div>
        <div><label>Minimum notice (hours)</label><input name="leadTimeHours" value="${esc(st.availability.leadTimeHours)}"></div>
        <div><label>How far ahead can people book (days)</label><input name="maxDaysAhead" value="${esc(st.availability.maxDaysAhead)}"></div>
      </div>
      ${days.map(([k, label]) => {
        const d = st.availability.days[k];
        return `<div class="row" style="align-items:center;margin-top:8px">
          <div style="flex:0;min-width:120px" class="checkrow"><input type="checkbox" name="${k}_on" id="${k}on" ${d.on ? 'checked' : ''}><label for="${k}on" style="margin:0">${label}</label></div>
          <div style="flex:0;min-width:130px"><input name="${k}_start" value="${esc(d.start)}" placeholder="09:00"></div>
          <div style="flex:0">to</div>
          <div style="flex:0;min-width:130px"><input name="${k}_end" value="${esc(d.end)}" placeholder="17:00"></div>
        </div>`;
      }).join('')}
      <div style="margin-top:14px"><button class="btn">Save availability</button></div>
    </form>
  </div>

  <div class="card">
    <h2 style="margin-top:0">Dashboard password</h2>
    <form method="post" action="/settings/password" class="row" style="align-items:flex-end">
      <div><label>New password</label><input name="password" type="password" minlength="6" required></div>
      <div style="flex:0"><button class="btn secondary">Change password</button></div>
    </form>
  </div>
</div>`, { active: 'settings' });
}

// ---------- Help ----------
export function helpPage(baseUrl) {
  const b = baseUrl || store.settings.baseUrl || 'http://localhost:4321';
  return layout('Help & Share', `<div class="wrap">
  <h1>Help &amp; Share</h1>

  <div class="card">
    <h2 style="margin-top:0">📣 Your links — share these everywhere</h2>
    <p><b>Lead capture form:</b> <a href="${esc(b)}/capture" target="_blank">${esc(b)}/capture</a><br>
    <span class="muted">Put it in your Google Business profile, Facebook page, email signature, or open it on a tablet at your counter.</span></p>
    <p><b>Booking page:</b> <a href="${esc(b)}/book" target="_blank">${esc(b)}/book</a><br>
    <span class="muted">Leads pick a time; you both get a confirmation and a calendar invite, plus an automatic 24-hour reminder.</span></p>
  </div>

  <div class="card">
    <h2 style="margin-top:0">🌐 Put the form on your website</h2>
    <p>Paste this into any web page:</p>
    <pre>&lt;iframe src="${esc(b)}/capture?embed=1" style="width:100%;max-width:480px;height:560px;border:none"&gt;&lt;/iframe&gt;</pre>
    <p class="muted"><b>Note:</b> for links to work outside this computer, the app address in Settings must be reachable by your visitors. On your office network use this computer's local address (e.g. <code>http://192.168.1.20:4321</code>). To accept leads from the public internet, use a free tunnel such as Cloudflare Tunnel or ngrok and paste the address it gives you into Settings → App address.</p>
  </div>

  <div class="card">
    <h2 style="margin-top:0">✉️ Connecting your email (Gmail example)</h2>
    <ol>
      <li>Go to your Google Account → <b>Security</b> → turn on <b>2-Step Verification</b> (if not already on).</li>
      <li>Search "App passwords" in your Google Account, create one named <i>LeadFlow</i>, copy the 16-character code.</li>
      <li>In <a href="/settings#email">Settings → Email Sending</a> enter: server <code>smtp.gmail.com</code>, port <code>587</code>, username = your Gmail address, password = the app password, "From" email = your Gmail address.</li>
      <li>Click <b>Save &amp; send me a test email</b>.</li>
    </ol>
    <p class="muted">Outlook/Microsoft 365: <code>smtp.office365.com</code>, port 587. Yahoo: <code>smtp.mail.yahoo.com</code>, port 587 (app password required). Zoho: <code>smtp.zoho.com</code>, port 587.</p>
  </div>

  <div class="card">
    <h2 style="margin-top:0">🔄 How the automation works</h2>
    <ul>
      <li><b>Instant response:</b> every new lead gets your auto-reply within seconds, with your booking link.</li>
      <li><b>Follow-up:</b> if they don't book, they get your follow-up emails on the schedule you set (default: 1 day, 3 days, 7 days).</li>
      <li><b>Smart stop:</b> emails stop the moment a lead books an appointment or you mark them won/lost.</li>
      <li><b>Owner alerts:</b> you get an email the moment a lead arrives or books — so you can call them while they're hot.</li>
      <li><b>Old leads:</b> import a CSV on the Campaigns page and launch a re-engagement sequence any time.</li>
    </ul>
    <p class="muted"><b>Keep it running:</b> automation runs while this app is open. Leave it running on your office computer (see the included guide for auto-start on boot).</p>
  </div>

  <div class="card">
    <h2 style="margin-top:0">💾 Backups</h2>
    <p>Everything lives in the <code>data</code> folder inside the LeadFlow folder. To back up, copy that folder anywhere (USB stick, Dropbox, Google Drive). To restore or move computers, copy it back.</p>
  </div>
</div>`, { active: 'help' });
}

// ---------- Public pages ----------
export function capturePage({ embed = false, error = '', values = {} }) {
  const biz = store.settings.business.name || 'Us';
  const inner = `<div class="card">
    <h1 style="margin-top:0">Contact ${esc(biz)}</h1>
    <p class="muted">Tell us what you need and we'll get right back to you.</p>
    ${flash(error, 'err')}
    <form method="post" action="/capture${embed ? '?embed=1' : ''}">
      <label>Your name</label><input name="name" required value="${esc(values.name || '')}">
      <label>Email</label><input name="email" type="email" required value="${esc(values.email || '')}">
      <label>Phone</label><input name="phone" value="${esc(values.phone || '')}">
      <label>How can we help?</label><textarea name="message" rows="4">${esc(values.message || '')}</textarea>
      <input name="company" value="" style="display:none" tabindex="-1" autocomplete="off">
      <div style="margin-top:16px"><button class="btn" style="width:100%">Send →</button></div>
    </form>
  </div>`;
  return layout(`Contact ${biz}`, `<div class="pub">${inner}</div>`, { nav: false });
}

export function thankYouPage() {
  const biz = store.settings.business.name || 'us';
  const b = store.settings.baseUrl || '';
  return layout('Thanks!', `<div class="pub"><div class="card" style="text-align:center">
    <h1>✅ Got it — thank you!</h1>
    <p>Someone from ${esc(biz)} will be in touch shortly. Check your email for a confirmation.</p>
    <p style="margin-top:20px"><a class="btn" href="${esc(b)}/book">Or book a time right now →</a></p>
  </div></div>`, { nav: false });
}

export function bookPage({ leadId = '', values = {}, error = '' }) {
  const biz = store.settings.business.name || 'Us';
  const av = store.settings.availability;
  return layout(`Book with ${biz}`, `<div class="pub">
  <div class="card">
    <h1 style="margin-top:0">Book a time with ${esc(biz)}</h1>
    ${flash(error, 'err')}
    <p class="muted">Pick a day, then a time (${esc(av.slotMinutes)} minutes).</p>
    <div id="days" class="slotgrid"></div>
    <div id="slots" class="slotgrid"><span class="muted">Choose a day above.</span></div>
    <form method="post" action="/book" id="bform">
      <input type="hidden" name="date" id="fdate"><input type="hidden" name="time" id="ftime">
      <input type="hidden" name="leadId" value="${esc(leadId)}">
      <label>Your name</label><input name="name" required value="${esc(values.name || '')}">
      <label>Email</label><input name="email" type="email" required value="${esc(values.email || '')}">
      <label>Phone</label><input name="phone" value="${esc(values.phone || '')}">
      <div style="margin-top:16px"><button class="btn" style="width:100%" id="bookbtn" disabled>Pick a time above to book</button></div>
    </form>
  </div>
  <script>
  (function(){
    var daysEl=document.getElementById('days'),slotsEl=document.getElementById('slots');
    var fdate=document.getElementById('fdate'),ftime=document.getElementById('ftime'),btn=document.getElementById('bookbtn');
    var max=${Number(av.maxDaysAhead) || 14};
    function pad(n){return (n<10?'0':'')+n}
    function dstr(d){return d.getFullYear()+'-'+pad(d.getMonth()+1)+'-'+pad(d.getDate())}
    var today=new Date();
    for(var i=0;i<max;i++){
      var d=new Date(today.getFullYear(),today.getMonth(),today.getDate()+i);
      var b=document.createElement('button');b.type='button';b.className='daybtn';
      b.textContent=d.toLocaleDateString(undefined,{weekday:'short',month:'short',day:'numeric'});
      b.dataset.date=dstr(d);
      b.onclick=function(){var sel=daysEl.querySelector('.sel');if(sel)sel.classList.remove('sel');this.classList.add('sel');loadSlots(this.dataset.date)};
      daysEl.appendChild(b);
    }
    function loadSlots(date){
      fdate.value=date;ftime.value='';btn.disabled=true;btn.textContent='Pick a time above to book';
      slotsEl.innerHTML='<span class="muted">Loading…</span>';
      fetch('/api/slots?date='+date).then(function(r){return r.json()}).then(function(data){
        slotsEl.innerHTML='';
        if(!data.slots||!data.slots.length){slotsEl.innerHTML='<span class="muted">No openings this day — try another.</span>';return}
        data.slots.forEach(function(t){
          var s=document.createElement('button');s.type='button';s.className='slot';s.textContent=t.label;s.dataset.t=t.time;
          s.onclick=function(){var sel=slotsEl.querySelector('.sel');if(sel)sel.classList.remove('sel');this.classList.add('sel');
            ftime.value=this.dataset.t;btn.disabled=false;btn.textContent='Book '+this.textContent+' →'};
          slotsEl.appendChild(s);
        });
      });
    }
  })();
  </script>
</div>`, { nav: false });
}

export function bookedPage(appt) {
  const biz = store.settings.business.name || 'us';
  return layout('Booked!', `<div class="pub"><div class="card" style="text-align:center">
    <h1>🎉 You're booked!</h1>
    <p><b>${fmtDateTime(appt.start)}</b> with ${esc(biz)}.</p>
    <p>A confirmation email with a calendar invite is on its way${store.settings.business.phone ? ` — questions? Call ${esc(store.settings.business.phone)}` : ''}.</p>
  </div></div>`, { nav: false });
}
