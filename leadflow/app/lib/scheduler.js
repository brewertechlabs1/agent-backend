// scheduler.js — the automation engine. Runs every 60 seconds:
//   1. sends due follow-up emails for active lead sequences
//   2. sends 24-hour appointment reminders
// Sequences stop automatically when a lead is booked / won / lost or paused.
import { store } from './store.js';
import { sendTemplated, sendMail, tagsForLead } from './mailer.js';
import { mergeTags, fmtDateTime } from './util.js';

const STOP_STATUSES = new Set(['booked', 'won', 'lost']);

export function sequenceSteps(type) {
  return type === 'reactivation' ? store.settings.reactivation : store.settings.followups;
}

async function processFollowups() {
  const now = Date.now();
  for (const lead of store.leads) {
    const seq = lead.sequence;
    if (!seq || seq.paused || STOP_STATUSES.has(lead.status) || !lead.email) continue;
    const steps = sequenceSteps(seq.type);
    for (let i = 0; i < steps.length; i++) {
      if (seq.sentSteps.includes(i)) continue;
      const due = new Date(seq.startedAt).getTime() + Number(steps[i].afterHours || 0) * 3600 * 1000;
      if (now < due) continue;
      seq.sentSteps.push(i);
      store.saveLeads();
      await sendTemplated(lead, steps[i], seq.type === 'reactivation' ? `Re-engagement email ${i + 1}` : `Follow-up ${i + 1}`);
      break; // at most one email per lead per tick — keeps sending human-paced
    }
  }
}

async function processReminders() {
  const now = Date.now();
  for (const appt of store.appointments) {
    if (appt.reminded || appt.cancelled) continue;
    const start = new Date(appt.start).getTime();
    if (start < now) { appt.reminded = true; store.saveAppointments(); continue; }
    if (start - now > 24 * 3600 * 1000) continue;
    appt.reminded = true;
    store.saveAppointments();
    const lead = store.getLead(appt.leadId);
    const tags = lead ? tagsForLead(lead) : { first_name: appt.name || 'there', business: store.settings.business.name || 'us' };
    const when = fmtDateTime(appt.start);
    await sendMail({
      to: appt.email,
      subject: mergeTags('Reminder: your appointment with {{business}}', tags),
      text: mergeTags(`Hi {{first_name}},\n\nThis is a friendly reminder about your upcoming appointment with {{business}}:\n\n${when}\n\nWe look forward to seeing you! If you need to reschedule, just reply to this email.\n\n{{business}}`, tags),
    });
    if (lead) store.log(lead.id, 'email', `Appointment reminder sent for ${when}`);
  }
}

let running = false;
export async function tick() {
  if (running) return;
  running = true;
  try {
    await processFollowups();
    await processReminders();
  } catch (err) {
    console.error('[scheduler]', err.message);
  } finally {
    running = false;
  }
}

export function startScheduler() {
  setInterval(tick, 60 * 1000);
  setTimeout(tick, 5 * 1000); // first pass shortly after boot
}
