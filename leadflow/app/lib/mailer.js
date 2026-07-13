// mailer.js — builds MIME messages and sends them via SMTP.
// If SMTP is not configured yet, messages are saved to data/outbox/ as .eml
// files ("demo mode") so the whole system works out of the box.
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { smtpSend } from './smtp.js';
import { store, OUTBOX_DIR } from './store.js';
import { mergeTags, esc } from './util.js';

const b64wrap = (buf) => buf.toString('base64').replace(/(.{76})/g, '$1\r\n');
const encWord = (s) => /^[\x20-\x7e]*$/.test(s) ? s : `=?UTF-8?B?${Buffer.from(s, 'utf8').toString('base64')}?=`;

export function smtpConfigured() {
  const s = store.settings.smtp;
  return !!(s.host && s.fromEmail);
}

function buildMessage({ fromName, fromEmail, to, subject, text, ics }) {
  const boundary = 'lf_' + crypto.randomBytes(12).toString('hex');
  const html = textToHtml(text);
  const headers = [
    `From: ${encWord(fromName || fromEmail)} <${fromEmail}>`,
    `To: <${to}>`,
    `Subject: ${encWord(subject)}`,
    `Date: ${new Date().toUTCString()}`,
    `Message-ID: <${crypto.randomUUID()}@leadflow.local>`,
    'MIME-Version: 1.0',
  ];

  const htmlPart = [
    'Content-Type: text/html; charset=utf-8',
    'Content-Transfer-Encoding: base64',
    '',
    b64wrap(Buffer.from(html, 'utf8')),
  ].join('\r\n');

  if (!ics) {
    return headers.join('\r\n') + '\r\n' + htmlPart;
  }

  const icsPart = [
    'Content-Type: text/calendar; charset=utf-8; method=REQUEST',
    'Content-Transfer-Encoding: base64',
    'Content-Disposition: attachment; filename="appointment.ics"',
    '',
    b64wrap(Buffer.from(ics, 'utf8')),
  ].join('\r\n');

  return headers.concat([
    `Content-Type: multipart/mixed; boundary="${boundary}"`,
    '',
    `--${boundary}`,
    htmlPart,
    `--${boundary}`,
    icsPart,
    `--${boundary}--`,
    '',
  ]).join('\r\n');
}

function textToHtml(text) {
  const withLinks = esc(text).replace(/(https?:\/\/[^\s<]+)/g, '<a href="$1">$1</a>');
  return `<!doctype html><html><body style="font-family:Arial,Helvetica,sans-serif;font-size:15px;line-height:1.6;color:#222;max-width:640px;margin:0 auto;padding:16px">${withLinks.replace(/\n/g, '<br>')}</body></html>`;
}

/**
 * Sends an email (or saves to outbox in demo mode).
 * Returns {ok, demo, error}.
 */
export async function sendMail({ to, subject, text, ics }) {
  const s = store.settings.smtp;
  const fromEmail = s.fromEmail || 'noreply@leadflow.local';
  const fromName = s.fromName || store.settings.business.name || 'LeadFlow';
  const message = buildMessage({ fromName, fromEmail, to, subject, text, ics });

  if (!smtpConfigured()) {
    const file = path.join(OUTBOX_DIR, `${Date.now()}-${crypto.randomBytes(4).toString('hex')}.eml`);
    fs.writeFileSync(file, message);
    return { ok: true, demo: true };
  }

  try {
    await smtpSend(s, fromEmail, to, message);
    return { ok: true, demo: false };
  } catch (err) {
    return { ok: false, error: err.message };
  }
}

export function tagsForLead(lead) {
  const st = store.settings;
  const base = st.baseUrl || 'http://localhost:4321';
  const first = (lead?.name || '').trim().split(/\s+/)[0] || 'there';
  return {
    name: lead?.name || 'there',
    first_name: first,
    email: lead?.email || '',
    business: st.business.name || 'our team',
    owner_phone: st.business.phone || '',
    website: st.business.website || '',
    booking_link: `${base}/book${lead ? `?lead=${lead.id}` : ''}`,
  };
}

/** Sends a templated email to a lead and logs the outcome. */
export async function sendTemplated(lead, tpl, logType) {
  if (!lead.email) {
    store.log(lead.id, 'skip', `${logType}: lead has no email address`);
    return { ok: false, error: 'no email' };
  }
  const tags = tagsForLead(lead);
  const subject = mergeTags(tpl.subject, tags);
  const text = mergeTags(tpl.body, tags);
  const res = await sendMail({ to: lead.email, subject, text });
  if (res.ok) {
    store.log(lead.id, 'email', `${logType} sent: "${subject}"${res.demo ? ' (demo mode — saved to outbox)' : ''}`);
  } else {
    store.log(lead.id, 'error', `${logType} failed: ${res.error}`);
  }
  return res;
}

/** Sends an alert email to the business owner. */
export async function alertOwner(subject, text) {
  const to = store.settings.business.ownerEmail;
  if (!to) return { ok: false, error: 'no owner email set' };
  return sendMail({ to, subject, text });
}

// ---------- Calendar (.ics) ----------
export function buildIcs({ start, end, summary, description, organizerEmail, attendeeEmail, uidStr }) {
  const dt = (iso) => new Date(iso).toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
  return [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//LeadFlow Pro//EN',
    'METHOD:REQUEST',
    'BEGIN:VEVENT',
    `UID:${uidStr}@leadflow.local`,
    `DTSTAMP:${dt(new Date().toISOString())}`,
    `DTSTART:${dt(start)}`,
    `DTEND:${dt(end)}`,
    `SUMMARY:${summary.replace(/[\n,;]/g, ' ')}`,
    `DESCRIPTION:${String(description || '').replace(/\n/g, '\\n').replace(/[,;]/g, ' ')}`,
    organizerEmail ? `ORGANIZER;CN=Organizer:mailto:${organizerEmail}` : '',
    attendeeEmail ? `ATTENDEE;CN=Guest;RSVP=TRUE:mailto:${attendeeEmail}` : '',
    'STATUS:CONFIRMED',
    'END:VEVENT',
    'END:VCALENDAR',
  ].filter(Boolean).join('\r\n');
}
