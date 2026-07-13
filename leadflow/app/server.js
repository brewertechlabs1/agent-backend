// LeadFlow Pro — automated lead capture, follow-up & booking for small business.
// Pure Node.js (v18+). No dependencies, no build step, no internet services required.
// Run: node app/server.js   (or double-click the included launcher)
import http from 'http';
import crypto from 'crypto';
import { execFile } from 'child_process';
import { store } from './lib/store.js';
import { startScheduler } from './lib/scheduler.js';
import {
  esc, hashPassword, verifyPassword, makeToken, verifyToken, parseCookies,
  parseBody, isEmail, toCsv, parseCsv, fmtDateTime,
} from './lib/util.js';
import { sendMail, sendTemplated, alertOwner, tagsForLead, buildIcs, smtpConfigured } from './lib/mailer.js';
import * as pages from './lib/pages.js';
import { mergeTags } from './lib/util.js';

const PORT = Number(process.env.PORT) || 4321;

// ---------- helpers ----------
function send(res, status, body, headers = {}) {
  res.writeHead(status, { 'Content-Type': 'text/html; charset=utf-8', ...headers });
  res.end(body);
}
const json = (res, status, obj) => send(res, status, JSON.stringify(obj), { 'Content-Type': 'application/json' });
const redirect = (res, to, extraHeaders = {}) => send(res, 302, '', { Location: to, ...extraHeaders });

function isAuthed(req) {
  const cookies = parseCookies(req);
  return verifyToken(store.settings.secret, cookies.lf_session);
}

function baseUrlFrom(req) {
  if (store.settings.baseUrl) return store.settings.baseUrl.replace(/\/$/, '');
  return `http://${req.headers.host || `localhost:${PORT}`}`;
}

// ---------- new lead pipeline: capture → instant reply → owner alert ----------
async function processNewLead(lead) {
  if (lead.email) {
    await sendTemplated(lead, store.settings.templates.autoReply, 'Instant auto-reply');
  }
  if (store.settings.alerts.newLead) {
    const alert = await alertOwner(
      `🔥 New lead: ${lead.name || lead.email || 'unknown'}`,
      `A new lead just came in — reach out while they're hot!\n\nName: ${lead.name}\nEmail: ${lead.email}\nPhone: ${lead.phone}\nMessage: ${lead.message || '(none)'}\nSource: ${lead.source}\n\nOpen: ${(store.settings.baseUrl || `http://localhost:${PORT}`)}/lead/${lead.id}\n\n— LeadFlow Pro`,
    );
    if (alert.ok) store.log(lead.id, 'alert', 'Owner alerted about new lead');
  }
}

// ---------- booking slots ----------
const DAY_KEYS = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];

function slotsForDate(dateStr) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) return [];
  const av = store.settings.availability;
  const [y, m, d] = dateStr.split('-').map(Number);
  const dayStart = new Date(y, m - 1, d);
  if (isNaN(dayStart)) return [];

  const today = new Date(); today.setHours(0, 0, 0, 0);
  const diffDays = Math.round((dayStart - today) / 864e5);
  if (diffDays < 0 || diffDays > (Number(av.maxDaysAhead) || 14)) return [];

  const day = av.days[DAY_KEYS[dayStart.getDay()]];
  if (!day || !day.on) return [];

  const parse = (t) => { const [h, min] = String(t).split(':').map(Number); return { h: h || 0, min: min || 0 }; };
  const s = parse(day.start), e = parse(day.end);
  const slotMs = (Number(av.slotMinutes) || 30) * 60000;
  const earliest = Date.now() + (Number(av.leadTimeHours) || 0) * 3600000;
  const booked = new Set(store.appointments.filter((a) => !a.cancelled).map((a) => new Date(a.start).getTime()));

  const out = [];
  let t = new Date(y, m - 1, d, s.h, s.min).getTime();
  const end = new Date(y, m - 1, d, e.h, e.min).getTime();
  while (t + slotMs <= end) {
    if (t >= earliest && !booked.has(t)) {
      const dt = new Date(t);
      out.push({
        time: `${String(dt.getHours()).padStart(2, '0')}:${String(dt.getMinutes()).padStart(2, '0')}`,
        label: dt.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' }),
      });
    }
    t += slotMs;
  }
  return out;
}

// ---------- router ----------
const routes = [];
function route(method, pattern, handler, { auth = false } = {}) {
  routes.push({ method, pattern, handler, auth });
}

// ----- root / auth -----
route('GET', /^\/$/, (req, res) => {
  if (!store.settings.setupDone) return redirect(res, '/setup');
  return redirect(res, isAuthed(req) ? '/dashboard' : '/login');
});

route('GET', /^\/setup$/, (req, res) => {
  if (store.settings.setupDone) return redirect(res, '/');
  send(res, 200, pages.setupPage());
});

route('POST', /^\/setup$/, async (req, res) => {
  if (store.settings.setupDone) return redirect(res, '/');
  const b = await parseBody(req);
  if (!b.bizName || !isEmail(b.ownerEmail) || !b.password || b.password.length < 6) {
    return send(res, 400, pages.setupPage('Please fill in all fields (password: 6+ characters).'));
  }
  const st = store.settings;
  st.business.name = b.bizName.trim();
  st.business.ownerEmail = b.ownerEmail.trim();
  st.business.phone = (b.phone || '').trim();
  st.passwordHash = hashPassword(b.password);
  st.smtp.fromName = st.business.name;
  st.baseUrl = `http://localhost:${PORT}`;
  st.setupDone = true;
  store.saveSettings();
  redirect(res, '/dashboard', { 'Set-Cookie': sessionCookie() });
});

function sessionCookie() {
  return `lf_session=${makeToken(store.settings.secret)}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${7 * 86400}`;
}

route('GET', /^\/login$/, (req, res) => {
  if (!store.settings.setupDone) return redirect(res, '/setup');
  if (!store.settings.passwordHash) return send(res, 200, pages.resetPasswordPage());
  send(res, 200, pages.loginPage());
});

// Password recovery: if the owner deletes the "passwordHash" line from
// data/settings.json (requires access to this computer), they can set a new one.
route('POST', /^\/reset-password$/, async (req, res) => {
  if (!store.settings.setupDone || store.settings.passwordHash) return redirect(res, '/login');
  const b = await parseBody(req);
  if (!b.password || b.password.length < 6) return send(res, 400, pages.resetPasswordPage('Password must be at least 6 characters.'));
  store.settings.passwordHash = hashPassword(b.password);
  store.saveSettings();
  redirect(res, '/dashboard', { 'Set-Cookie': sessionCookie() });
});

let lastFailedLogin = 0;
route('POST', /^\/login$/, async (req, res) => {
  const b = await parseBody(req);
  if (Date.now() - lastFailedLogin < 2000) {
    return send(res, 429, pages.loginPage('Please wait a moment and try again.'));
  }
  if (verifyPassword(b.password || '', store.settings.passwordHash)) {
    return redirect(res, '/dashboard', { 'Set-Cookie': sessionCookie() });
  }
  lastFailedLogin = Date.now();
  send(res, 401, pages.loginPage('Wrong password.'));
});

route('GET', /^\/logout$/, (req, res) =>
  redirect(res, '/login', { 'Set-Cookie': 'lf_session=; Path=/; Max-Age=0' }));

// ----- admin pages -----
route('GET', /^\/dashboard$/, (req, res, m, url) =>
  send(res, 200, pages.dashboardPage({ msg: url.searchParams.get('msg') })), { auth: true });

route('GET', /^\/leads$/, (req, res, m, url) =>
  send(res, 200, pages.leadsPage({
    msg: url.searchParams.get('msg'), err: url.searchParams.get('err'),
    filter: url.searchParams.get('filter') || '', q: url.searchParams.get('q') || '',
  })), { auth: true });

route('POST', /^\/leads\/add$/, async (req, res) => {
  const b = await parseBody(req);
  if (!b.name && !b.email) return redirect(res, '/leads?err=' + encodeURIComponent('Name or email required.'));
  if (b.email && !isEmail(b.email)) return redirect(res, '/leads?err=' + encodeURIComponent('That email address looks invalid.'));
  const lead = store.addLead({ name: b.name, email: b.email, phone: b.phone, source: 'manual' });
  store.log(lead.id, 'created', 'Lead added manually');
  processNewLead(lead).catch(() => {});
  redirect(res, '/leads?msg=' + encodeURIComponent('Lead added — instant reply and follow-up sequence started.'));
}, { auth: true });

route('GET', /^\/lead\/([\w-]+)$/, (req, res, m, url) => {
  const lead = store.getLead(m[1]);
  if (!lead) return send(res, 404, pages.layout('Not found', '<div class="wrap"><p>Lead not found. <a href="/leads">Back</a></p></div>'));
  send(res, 200, pages.leadDetailPage(lead, { msg: url.searchParams.get('msg'), err: url.searchParams.get('err') }));
}, { auth: true });

route('POST', /^\/lead\/([\w-]+)\/status$/, async (req, res, m) => {
  const lead = store.getLead(m[1]); if (!lead) return redirect(res, '/leads');
  const b = await parseBody(req);
  if (['new', 'contacted', 'booked', 'won', 'lost'].includes(b.status)) {
    lead.status = b.status;
    store.saveLeads();
    store.log(lead.id, 'status', `Status changed to ${b.status}`);
  }
  redirect(res, `/lead/${lead.id}?msg=Status+updated.`);
}, { auth: true });

route('POST', /^\/lead\/([\w-]+)\/note$/, async (req, res, m) => {
  const lead = store.getLead(m[1]); if (!lead) return redirect(res, '/leads');
  const b = await parseBody(req);
  if (b.text) {
    lead.notes.push({ at: new Date().toISOString(), text: String(b.text).slice(0, 2000) });
    store.saveLeads();
  }
  redirect(res, `/lead/${lead.id}`);
}, { auth: true });

route('POST', /^\/lead\/([\w-]+)\/pause$/, async (req, res, m) => {
  const lead = store.getLead(m[1]); if (!lead) return redirect(res, '/leads');
  lead.sequence = lead.sequence || { type: 'standard', startedAt: new Date().toISOString(), sentSteps: [], paused: false };
  lead.sequence.paused = !lead.sequence.paused;
  store.saveLeads();
  store.log(lead.id, 'automation', lead.sequence.paused ? 'Follow-ups paused' : 'Follow-ups resumed');
  redirect(res, `/lead/${lead.id}`);
}, { auth: true });

route('POST', /^\/lead\/([\w-]+)\/restart$/, async (req, res, m) => {
  const lead = store.getLead(m[1]); if (!lead) return redirect(res, '/leads');
  lead.sequence = { type: 'standard', startedAt: new Date().toISOString(), sentSteps: [], paused: false };
  if (['won', 'lost', 'booked'].includes(lead.status)) lead.status = 'contacted';
  store.saveLeads();
  store.log(lead.id, 'automation', 'Follow-up sequence restarted from the beginning');
  redirect(res, `/lead/${lead.id}?msg=Sequence+restarted.`);
}, { auth: true });

route('POST', /^\/lead\/([\w-]+)\/delete$/, (req, res, m) => {
  const i = store.leads.findIndex((l) => l.id === m[1]);
  if (i > -1) { store.leads.splice(i, 1); store.saveLeads(); }
  redirect(res, '/leads?msg=Lead+deleted.');
}, { auth: true });

route('POST', /^\/lead\/([\w-]+)\/send$/, async (req, res, m) => {
  const lead = store.getLead(m[1]); if (!lead) return redirect(res, '/leads');
  const b = await parseBody(req);
  if (!lead.email) return redirect(res, `/lead/${lead.id}?err=Lead+has+no+email.`);
  const r = await sendTemplated(lead, { subject: b.subject || '(no subject)', body: b.body || '' }, 'Manual email');
  redirect(res, `/lead/${lead.id}?${r.ok ? 'msg=' + encodeURIComponent(r.demo ? 'Saved to outbox (demo mode — connect email in Settings to really send).' : 'Email sent.') : 'err=' + encodeURIComponent('Send failed: ' + r.error)}`);
}, { auth: true });

// ----- appointments admin -----
route('GET', /^\/appointments$/, (req, res, m, url) =>
  send(res, 200, pages.appointmentsPage({ msg: url.searchParams.get('msg') })), { auth: true });

route('POST', /^\/appointment\/([\w-]+)\/cancel$/, async (req, res, m) => {
  const appt = store.appointments.find((a) => a.id === m[1]);
  if (appt && !appt.cancelled) {
    appt.cancelled = true;
    store.saveAppointments();
    if (appt.leadId) {
      const lead = store.getLead(appt.leadId);
      if (lead) {
        store.log(lead.id, 'booking', `Appointment on ${fmtDateTime(appt.start)} cancelled`);
        if (lead.status === 'booked') { lead.status = 'contacted'; store.saveLeads(); }
      }
    }
    if (appt.email) {
      await sendMail({
        to: appt.email,
        subject: `Your appointment with ${store.settings.business.name} was cancelled`,
        text: `Hi ${appt.name || 'there'},\n\nYour appointment on ${fmtDateTime(appt.start)} has been cancelled. If you'd like to pick a new time, you can rebook here:\n${baseUrlFrom(req)}/book\n\n${store.settings.business.name}`,
      });
    }
  }
  redirect(res, '/appointments?msg=Appointment+cancelled.');
}, { auth: true });

// ----- campaigns -----
route('GET', /^\/campaigns$/, (req, res, m, url) =>
  send(res, 200, pages.campaignsPage({ msg: url.searchParams.get('msg'), err: url.searchParams.get('err') })), { auth: true });

route('POST', /^\/campaigns\/import$/, async (req, res) => {
  const b = await parseBody(req);
  const rows = parseCsv(b.csv || '');
  if (!rows.length) return redirect(res, '/campaigns?err=' + encodeURIComponent('No rows found — make sure the first line is a header row (name,email,phone).'));
  let added = 0, skipped = 0;
  const existing = new Set(store.leads.map((l) => l.email).filter(Boolean));
  for (const r of rows) {
    const email = (r.email || r['e-mail'] || r['email address'] || '').toLowerCase();
    const name = r.name || [r['first name'] || r.first || '', r['last name'] || r.last || ''].join(' ').trim();
    if (!email || !isEmail(email) || existing.has(email)) { skipped++; continue; }
    existing.add(email);
    const lead = store.addLead({ name, email, phone: r.phone || r['phone number'] || '', source: 'import' });
    lead.status = 'imported';
    lead.sequence = null; // imported leads wait for a campaign — no auto-reply
    added++;
  }
  store.saveLeads();
  store.log(null, 'import', `CSV import: ${added} added, ${skipped} skipped (missing/duplicate email)`);
  redirect(res, '/campaigns?msg=' + encodeURIComponent(`Imported ${added} lead(s). Skipped ${skipped} (no valid email or already in your list).`));
}, { auth: true });

route('POST', /^\/campaigns\/start$/, async (req, res) => {
  const b = await parseBody(req);
  const statuses = new Set();
  if (b.st_imported) statuses.add('imported');
  if (b.st_lost) statuses.add('lost');
  if (b.st_contacted) statuses.add('contacted');
  if (b.st_new) statuses.add('new');
  const cutoff = Date.now() - (Number(b.olderThanDays) || 0) * 864e5;
  let count = 0;
  for (const lead of store.leads) {
    if (!lead.email || !statuses.has(lead.status)) continue;
    if (new Date(lead.lastActivityAt || lead.createdAt).getTime() > cutoff) continue;
    lead.sequence = { type: 'reactivation', startedAt: new Date().toISOString(), sentSteps: [], paused: false };
    if (lead.status === 'imported' || lead.status === 'lost') lead.status = 'contacted';
    store.log(lead.id, 'automation', 'Re-engagement campaign started');
    count++;
  }
  store.saveLeads();
  redirect(res, '/campaigns?msg=' + encodeURIComponent(count
    ? `Campaign launched for ${count} lead(s). The first email goes out within a minute; the rest follow your re-engagement schedule.`
    : 'No leads matched those filters — adjust and try again.'));
}, { auth: true });

// ----- settings -----
route('GET', /^\/settings$/, (req, res, m, url) =>
  send(res, 200, pages.settingsPage({ msg: url.searchParams.get('msg'), err: url.searchParams.get('err') })), { auth: true });

route('POST', /^\/settings\/business$/, async (req, res) => {
  const b = await parseBody(req);
  const st = store.settings;
  st.business.name = (b.name || st.business.name).trim();
  st.business.ownerEmail = isEmail(b.ownerEmail) ? b.ownerEmail.trim() : st.business.ownerEmail;
  st.business.phone = (b.phone || '').trim();
  st.business.website = (b.website || '').trim();
  st.baseUrl = (b.baseUrl || '').trim().replace(/\/$/, '') || st.baseUrl;
  st.alerts.newLead = !!b.alertNewLead;
  st.alerts.booking = !!b.alertBooking;
  store.saveSettings();
  redirect(res, '/settings?msg=Business+info+saved.');
}, { auth: true });

async function saveSmtp(b) {
  const st = store.settings;
  st.smtp.host = (b.host || '').trim();
  st.smtp.port = Number(b.port) || 587;
  st.smtp.secure = !!b.secure;
  st.smtp.user = (b.user || '').trim();
  st.smtp.pass = b.pass || '';
  st.smtp.fromName = (b.fromName || '').trim();
  st.smtp.fromEmail = (b.fromEmail || '').trim();
  store.saveSettings();
}

route('POST', /^\/settings\/smtp$/, async (req, res) => {
  await saveSmtp(await parseBody(req));
  redirect(res, '/settings?msg=Email+settings+saved.#email');
}, { auth: true });

route('POST', /^\/settings\/test-email$/, async (req, res) => {
  await saveSmtp(await parseBody(req));
  if (!smtpConfigured()) {
    return redirect(res, '/settings?err=' + encodeURIComponent('Enter at least the SMTP server and "From" email, then try again.') + '#email');
  }
  const r = await sendMail({
    to: store.settings.business.ownerEmail,
    subject: '✅ LeadFlow Pro test email',
    text: `Success! Your email sending is connected.\n\nEvery new lead will now get an instant reply, automated follow-ups, and booking confirmations — and you'll get alerts at this address.\n\n— LeadFlow Pro`,
  });
  redirect(res, '/settings?' + (r.ok
    ? 'msg=' + encodeURIComponent(`Test email sent to ${store.settings.business.ownerEmail} — check your inbox (and spam folder).`)
    : 'err=' + encodeURIComponent('Test failed: ' + r.error + ' — double-check server, port, username and password.')) + '#email');
}, { auth: true });

function readSteps(b, prefix, max) {
  const steps = [];
  for (let i = 0; i < max; i++) {
    const subject = (b[`${prefix}_s${i}`] || '').trim();
    if (!subject) continue;
    steps.push({
      afterHours: Math.max(0, Number(b[`${prefix}_h${i}`]) || 0),
      subject,
      body: b[`${prefix}_b${i}`] || '',
    });
  }
  return steps.sort((a, b2) => a.afterHours - b2.afterHours);
}

route('POST', /^\/settings\/templates$/, async (req, res) => {
  const b = await parseBody(req);
  const st = store.settings;
  st.templates.autoReply.subject = b.ar_subject || st.templates.autoReply.subject;
  st.templates.autoReply.body = b.ar_body || st.templates.autoReply.body;
  st.followups = readSteps(b, 'fu', 10);
  st.reactivation = readSteps(b, 're', 10);
  store.saveSettings();
  redirect(res, '/settings?msg=Templates+saved.#templates');
}, { auth: true });

route('POST', /^\/settings\/availability$/, async (req, res) => {
  const b = await parseBody(req);
  const av = store.settings.availability;
  av.slotMinutes = Math.min(240, Math.max(10, Number(b.slotMinutes) || 30));
  av.leadTimeHours = Math.max(0, Number(b.leadTimeHours) || 0);
  av.maxDaysAhead = Math.min(60, Math.max(1, Number(b.maxDaysAhead) || 14));
  const timeOk = (t) => /^\d{1,2}:\d{2}$/.test(t);
  for (const k of ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun']) {
    av.days[k].on = !!b[`${k}_on`];
    if (timeOk(b[`${k}_start`])) av.days[k].start = b[`${k}_start`];
    if (timeOk(b[`${k}_end`])) av.days[k].end = b[`${k}_end`];
  }
  store.saveSettings();
  redirect(res, '/settings?msg=Availability+saved.#availability');
}, { auth: true });

route('POST', /^\/settings\/password$/, async (req, res) => {
  const b = await parseBody(req);
  if (!b.password || b.password.length < 6) return redirect(res, '/settings?err=Password+must+be+6%2B+characters.');
  store.settings.passwordHash = hashPassword(b.password);
  store.saveSettings();
  redirect(res, '/settings?msg=Password+changed.');
}, { auth: true });

// ----- help / export -----
route('GET', /^\/help$/, (req, res) => send(res, 200, pages.helpPage(baseUrlFrom(req))), { auth: true });

route('GET', /^\/export\.csv$/, (req, res) => {
  const rows = store.leads.map((l) => ({
    name: l.name, email: l.email, phone: l.phone, status: l.status,
    source: l.source, created: l.createdAt, message: l.message,
  }));
  send(res, 200, toCsv(rows, ['name', 'email', 'phone', 'status', 'source', 'created', 'message']), {
    'Content-Type': 'text/csv; charset=utf-8',
    'Content-Disposition': 'attachment; filename="leads.csv"',
  });
}, { auth: true });

// ----- public: lead capture -----
route('GET', /^\/capture$/, (req, res, m, url) =>
  send(res, 200, pages.capturePage({ embed: url.searchParams.get('embed') === '1' })));

route('POST', /^\/capture$/, async (req, res) => {
  const b = await parseBody(req);
  if (b.company) return redirect(res, '/thanks'); // honeypot field: bots fill it, humans never see it
  if (!b.name || !isEmail(b.email)) {
    return send(res, 400, pages.capturePage({ error: 'Please enter your name and a valid email.', values: b }));
  }
  const lead = store.addLead({ name: b.name, email: b.email, phone: b.phone, message: b.message, source: 'web form' });
  store.log(lead.id, 'created', 'Lead captured from web form');
  processNewLead(lead).catch(() => {});
  redirect(res, '/thanks');
});

route('GET', /^\/thanks$/, (req, res) => send(res, 200, pages.thankYouPage()));

// JSON API for developers / website integrations
route('POST', /^\/api\/lead$/, async (req, res) => {
  const b = await parseBody(req);
  if (!b.email || !isEmail(b.email)) return json(res, 400, { ok: false, error: 'valid email required' });
  const lead = store.addLead({ name: b.name, email: b.email, phone: b.phone, message: b.message, source: b.source || 'api' });
  store.log(lead.id, 'created', 'Lead captured via API');
  processNewLead(lead).catch(() => {});
  json(res, 200, { ok: true, id: lead.id });
});

// ----- public: booking -----
route('GET', /^\/book$/, (req, res, m, url) => {
  const leadId = url.searchParams.get('lead') || '';
  const lead = leadId ? store.getLead(leadId) : null;
  send(res, 200, pages.bookPage({
    leadId: lead ? lead.id : '',
    values: lead ? { name: lead.name, email: lead.email, phone: lead.phone } : {},
  }));
});

route('GET', /^\/api\/slots$/, (req, res, m, url) =>
  json(res, 200, { slots: slotsForDate(url.searchParams.get('date') || '') }));

route('POST', /^\/book$/, async (req, res) => {
  const b = await parseBody(req);
  const err = (msg) => send(res, 400, pages.bookPage({ leadId: b.leadId || '', values: b, error: msg }));
  if (!b.name || !isEmail(b.email)) return err('Please enter your name and a valid email.');
  if (!b.date || !b.time) return err('Please pick a day and time.');

  const valid = slotsForDate(b.date).some((s) => s.time === b.time);
  if (!valid) return err('Sorry, that time was just taken — please pick another.');

  const [y, mo, d] = b.date.split('-').map(Number);
  const [h, mi] = b.time.split(':').map(Number);
  const start = new Date(y, mo - 1, d, h, mi);
  const end = new Date(start.getTime() + (Number(store.settings.availability.slotMinutes) || 30) * 60000);

  // link to an existing lead (by id or email) or create one
  let lead = (b.leadId && store.getLead(b.leadId))
    || store.leads.find((l) => l.email && l.email === b.email.toLowerCase().trim());
  if (!lead) {
    lead = store.addLead({ name: b.name, email: b.email, phone: b.phone, source: 'booking page' });
    store.log(lead.id, 'created', 'Lead created from booking page');
  }
  lead.status = 'booked';
  if (b.phone && !lead.phone) lead.phone = String(b.phone).trim();
  store.saveLeads();

  const appt = {
    id: crypto.randomUUID(),
    leadId: lead.id,
    name: b.name, email: b.email.toLowerCase().trim(), phone: b.phone || '',
    start: start.toISOString(), end: end.toISOString(),
    createdAt: new Date().toISOString(), reminded: false, cancelled: false,
  };
  store.appointments.push(appt);
  store.saveAppointments();
  store.log(lead.id, 'booking', `Appointment booked for ${fmtDateTime(appt.start)}`);

  const biz = store.settings.business.name || 'us';
  const ics = buildIcs({
    start: appt.start, end: appt.end,
    summary: `Appointment: ${b.name} × ${biz}`,
    description: `Booked via ${biz} online scheduling.`,
    organizerEmail: store.settings.business.ownerEmail,
    attendeeEmail: appt.email,
    uidStr: appt.id,
  });
  const tags = tagsForLead(lead);
  sendMail({
    to: appt.email,
    subject: mergeTags(`✅ Confirmed: your appointment with {{business}}`, tags),
    text: mergeTags(`Hi {{first_name}},\n\nYou're confirmed!\n\n📅 ${fmtDateTime(appt.start)}\n\nA calendar invite is attached. We'll also send you a reminder 24 hours before.${store.settings.business.phone ? `\n\nNeed to reschedule? Call us at ${store.settings.business.phone} or reply to this email.` : '\n\nNeed to reschedule? Just reply to this email.'}\n\nSee you soon,\n{{business}}`, tags),
    ics,
  }).then((r) => { if (r.ok) store.log(lead.id, 'email', `Booking confirmation sent${r.demo ? ' (demo mode)' : ''}`); }).catch(() => {});

  if (store.settings.alerts.booking) {
    alertOwner(
      `📅 New appointment: ${b.name} — ${fmtDateTime(appt.start)}`,
      `${b.name} just booked an appointment.\n\nWhen: ${fmtDateTime(appt.start)}\nEmail: ${appt.email}\nPhone: ${appt.phone || '(none)'}\n\nLead page: ${baseUrlFrom(req)}/lead/${lead.id}\n\n— LeadFlow Pro`,
    ).catch(() => {});
  }

  send(res, 200, pages.bookedPage(appt));
});

// ----- embeddable widget loader -----
route('GET', /^\/embed\.js$/, (req, res) => {
  const b = baseUrlFrom(req);
  send(res, 200,
    `(function(){var d=document,s=d.currentScript,f=d.createElement('iframe');f.src='${b}/capture?embed=1';f.style.cssText='width:100%;max-width:480px;height:560px;border:none';s.parentNode.insertBefore(f,s);})();`,
    { 'Content-Type': 'application/javascript' });
});

route('GET', /^\/favicon\.ico$/, (req, res) => send(res, 204, ''));

// ---------- server ----------
const server = http.createServer(async (req, res) => {
  try {
    const url = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
    for (const r of routes) {
      if (r.method !== req.method) continue;
      const m = url.pathname.match(r.pattern);
      if (!m) continue;
      if (r.auth) {
        if (!store.settings.setupDone) return redirect(res, '/setup');
        if (!isAuthed(req)) return redirect(res, '/login');
      }
      return await r.handler(req, res, m, url);
    }
    send(res, 404, pages.layout('Not found', '<div class="wrap"><h1>Page not found</h1><p><a href="/">Go home</a></p></div>', { nav: false }));
  } catch (err) {
    console.error('[server]', err);
    try { send(res, 500, pages.layout('Error', '<div class="wrap"><h1>Something went wrong</h1><p>Please try again. Details were written to the app window.</p></div>', { nav: false })); } catch { /* ignore */ }
  }
});

function openBrowser(url) {
  if (process.env.LEADFLOW_NO_OPEN) return;
  const cmd = process.platform === 'win32' ? ['cmd', ['/c', 'start', '', url]]
    : process.platform === 'darwin' ? ['open', [url]]
    : ['xdg-open', [url]];
  execFile(cmd[0], cmd[1], () => {});
}

server.listen(PORT, () => {
  const url = `http://localhost:${PORT}`;
  console.log('');
  console.log('  ┌─────────────────────────────────────────────┐');
  console.log('  │            LeadFlow Pro is running          │');
  console.log('  ├─────────────────────────────────────────────┤');
  console.log(`  │  Dashboard:   ${url.padEnd(30)}│`);
  console.log(`  │  Lead form:   ${(url + '/capture').padEnd(30)}│`);
  console.log(`  │  Booking:     ${(url + '/book').padEnd(30)}│`);
  console.log('  └─────────────────────────────────────────────┘');
  console.log('');
  console.log('  Keep this window open — it powers your automation.');
  console.log('  (Press Ctrl+C to stop)');
  console.log('');
  openBrowser(url);
  startScheduler();
});
