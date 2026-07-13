// store.js — simple JSON-file datastore. All business data lives in the local
// `data/` folder next to the app, so backing up = copying one folder.
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { uid } from './util.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
export const APP_ROOT = path.resolve(__dirname, '..', '..');
export const DATA_DIR = process.env.LEADFLOW_DATA || path.join(APP_ROOT, 'data');
export const OUTBOX_DIR = path.join(DATA_DIR, 'outbox');

function ensureDirs() {
  fs.mkdirSync(DATA_DIR, { recursive: true });
  fs.mkdirSync(OUTBOX_DIR, { recursive: true });
}

function loadJson(name, fallback) {
  const file = path.join(DATA_DIR, name);
  try {
    return JSON.parse(fs.readFileSync(file, 'utf8'));
  } catch {
    return fallback;
  }
}

function saveJson(name, obj) {
  ensureDirs();
  const file = path.join(DATA_DIR, name);
  const tmp = file + '.tmp';
  fs.writeFileSync(tmp, JSON.stringify(obj, null, 2));
  fs.renameSync(tmp, file); // atomic on the same volume
}

export function defaultSettings() {
  return {
    setupDone: false,
    secret: uid() + uid(),
    business: { name: '', ownerEmail: '', phone: '', website: '' },
    passwordHash: '',
    baseUrl: '', // filled in at setup; used in emails for booking links
    smtp: { host: '', port: 587, secure: false, user: '', pass: '', fromName: '', fromEmail: '' },
    alerts: { newLead: true, booking: true },
    templates: {
      autoReply: {
        subject: 'Thanks for reaching out, {{first_name}}!',
        body: `Hi {{first_name}},\n\nThanks for contacting {{business}} — we received your message and a real person will follow up with you shortly.\n\nWant to skip the wait? You can book a time that works for you right now:\n{{booking_link}}\n\nTalk soon,\nThe {{business}} team`,
      },
    },
    followups: [
      {
        afterHours: 24,
        subject: 'Quick follow-up from {{business}}',
        body: `Hi {{first_name}},\n\nJust checking in — did you still want help from {{business}}? We'd love to get you taken care of.\n\nYou can grab a time here whenever it's convenient:\n{{booking_link}}\n\nBest,\n{{business}}`,
      },
      {
        afterHours: 72,
        subject: 'Still interested, {{first_name}}?',
        body: `Hi {{first_name}},\n\nWe haven't heard back, so I wanted to reach out one more time. If you're still looking for help, we're ready when you are.\n\nBook a time in under a minute:\n{{booking_link}}\n\nIf now isn't the right time, no problem — just reply and let us know.\n\n{{business}}`,
      },
      {
        afterHours: 168,
        subject: 'Last check-in from {{business}}',
        body: `Hi {{first_name}},\n\nThis is our last check-in — we don't want to clutter your inbox. If you'd still like help, you can reach us any time or book here:\n{{booking_link}}\n\nWe'd be glad to earn your business.\n\n{{business}}`,
      },
    ],
    reactivation: [
      {
        afterHours: 0,
        subject: 'We miss you at {{business}}!',
        body: `Hi {{first_name}},\n\nIt's been a while since we last talked, and we wanted to reach out personally. We've helped a lot of customers like you since then, and we'd love the chance to help you too.\n\nIf you're ready, you can book a time here:\n{{booking_link}}\n\nHope to see you soon,\n{{business}}`,
      },
      {
        afterHours: 96,
        subject: 'A quick hello from {{business}}',
        body: `Hi {{first_name}},\n\nJust one more note — if there's anything we can do for you, we're here and happy to help. Booking a time takes less than a minute:\n{{booking_link}}\n\nThanks for considering us again,\n{{business}}`,
      },
    ],
    availability: {
      slotMinutes: 30,
      leadTimeHours: 4,
      maxDaysAhead: 14,
      days: {
        mon: { on: true, start: '09:00', end: '17:00' },
        tue: { on: true, start: '09:00', end: '17:00' },
        wed: { on: true, start: '09:00', end: '17:00' },
        thu: { on: true, start: '09:00', end: '17:00' },
        fri: { on: true, start: '09:00', end: '17:00' },
        sat: { on: false, start: '10:00', end: '14:00' },
        sun: { on: false, start: '10:00', end: '14:00' },
      },
    },
  };
}

class Store {
  constructor() {
    ensureDirs();
    this.settings = { ...defaultSettings(), ...loadJson('settings.json', {}) };
    this.leads = loadJson('leads.json', []);
    this.appointments = loadJson('appointments.json', []);
    this.activity = loadJson('activity.json', []);
  }

  saveSettings() { saveJson('settings.json', this.settings); }
  saveLeads() { saveJson('leads.json', this.leads); }
  saveAppointments() { saveJson('appointments.json', this.appointments); }
  saveActivity() { saveJson('activity.json', this.activity); }

  getLead(id) { return this.leads.find((l) => l.id === id); }

  addLead({ name, email, phone, message, source }) {
    const now = new Date().toISOString();
    const lead = {
      id: uid(),
      name: String(name || '').trim().slice(0, 200),
      email: String(email || '').trim().toLowerCase().slice(0, 200),
      phone: String(phone || '').trim().slice(0, 50),
      message: String(message || '').trim().slice(0, 5000),
      source: source || 'form',
      status: 'new', // new | contacted | booked | won | lost
      createdAt: now,
      lastActivityAt: now,
      notes: [],
      sequence: { type: 'standard', startedAt: now, sentSteps: [], paused: false },
    };
    this.leads.unshift(lead);
    this.saveLeads();
    return lead;
  }

  log(leadId, type, text) {
    this.activity.unshift({ at: new Date().toISOString(), leadId, type, text });
    if (this.activity.length > 5000) this.activity.length = 5000;
    this.saveActivity();
    const lead = leadId && this.getLead(leadId);
    if (lead) { lead.lastActivityAt = new Date().toISOString(); this.saveLeads(); }
  }

  leadActivity(leadId) { return this.activity.filter((a) => a.leadId === leadId); }
}

export const store = new Store();
