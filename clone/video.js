// clone/video.js — music-video clips of Richard's avatar via Seedance
// (ByteDance's video model), called through fal.ai's queue API.
//
// Flow: pick one of Richard's stored photos + a scene prompt → Seedance
// image-to-video animates him into a clip → finished MP4s are downloaded
// into local media storage and served only to his account.
import fs from 'fs';
import path from 'path';
import { imageDataUri } from './images.js';
import { dataBase } from './crypto.js';

const VIDEOS_DIR = path.resolve(dataBase(), 'media-data', 'videos');
const JOBS_FILE = path.join(VIDEOS_DIR, 'jobs.json');
const FAL_QUEUE = 'https://queue.fal.run';

function model() {
  return process.env.SEEDANCE_MODEL || 'fal-ai/bytedance/seedance/v1/lite/image-to-video';
}

function falHeaders() {
  const key = process.env.FAL_KEY;
  if (!key) throw new Error('FAL_KEY is not set — create one at fal.ai to use Seedance.');
  return { Authorization: `Key ${key}`, 'Content-Type': 'application/json' };
}

function loadJobs() {
  try { return JSON.parse(fs.readFileSync(JOBS_FILE, 'utf8')); } catch { return []; }
}

function saveJobs(jobs) {
  fs.mkdirSync(VIDEOS_DIR, { recursive: true });
  fs.writeFileSync(JOBS_FILE, JSON.stringify(jobs, null, 2));
}

export function listJobs() {
  return loadJobs().sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
}

/** Submit a clip generation job to Seedance. */
export async function generateClip({ prompt, imageId, duration = '5', resolution = '720p' }) {
  if (!prompt) throw new Error('prompt is required.');
  if (!imageId) throw new Error('imageId is required — pick one of the stored photos.');

  const res = await fetch(`${FAL_QUEUE}/${model()}`, {
    method: 'POST',
    headers: falHeaders(),
    body: JSON.stringify({
      prompt,
      image_url: imageDataUri(imageId),
      duration: String(duration),
      resolution,
    }),
  });
  if (!res.ok) throw new Error(`Seedance submit failed (${res.status}): ${await res.text()}`);
  const { request_id: requestId } = await res.json();

  const jobs = loadJobs();
  jobs.push({
    requestId, prompt, imageId, duration: String(duration), resolution,
    status: 'IN_QUEUE', createdAt: new Date().toISOString(),
  });
  saveJobs(jobs);
  return { requestId, status: 'IN_QUEUE' };
}

/** Poll a job; on completion download the MP4 into local media storage. */
export async function checkClip(requestId) {
  if (!/^[\w-]{8,64}$/.test(requestId)) throw new Error('Invalid request id.');
  const jobs = loadJobs();
  const job = jobs.find((j) => j.requestId === requestId);
  if (!job) throw new Error('Unknown job.');
  if (job.status === 'COMPLETED' || job.status === 'FAILED') return job;

  const statusRes = await fetch(`${FAL_QUEUE}/${model()}/requests/${requestId}/status`, {
    headers: falHeaders(),
  });
  if (!statusRes.ok) throw new Error(`Seedance status failed (${statusRes.status}): ${await statusRes.text()}`);
  const status = await statusRes.json();
  job.status = status.status;

  if (status.status === 'COMPLETED') {
    const resultRes = await fetch(`${FAL_QUEUE}/${model()}/requests/${requestId}`, {
      headers: falHeaders(),
    });
    if (!resultRes.ok) throw new Error(`Seedance result failed (${resultRes.status}): ${await resultRes.text()}`);
    const result = await resultRes.json();
    const videoUrl = result.video?.url || result.output?.video?.url;
    if (videoUrl) {
      const mp4 = await fetch(videoUrl);
      if (!mp4.ok) throw new Error(`Video download failed (${mp4.status}).`);
      const file = `${requestId}.mp4`;
      fs.writeFileSync(path.join(VIDEOS_DIR, file), Buffer.from(await mp4.arrayBuffer()));
      job.file = file;
    } else {
      job.status = 'FAILED';
      job.error = 'Completed but no video URL in result.';
    }
  }
  job.updatedAt = new Date().toISOString();
  saveJobs(jobs);
  return job;
}

export function videoPath(file) {
  if (!/^[\w-]+\.mp4$/.test(file)) throw new Error('Invalid video file name.');
  const p = path.join(VIDEOS_DIR, file);
  if (!fs.existsSync(p)) return null;
  return p;
}

export function deleteClip(requestId) {
  const jobs = loadJobs();
  const job = jobs.find((j) => j.requestId === requestId);
  if (!job) return false;
  if (job.file) fs.rmSync(path.join(VIDEOS_DIR, job.file), { force: true });
  saveJobs(jobs.filter((j) => j.requestId !== requestId));
  return true;
}
