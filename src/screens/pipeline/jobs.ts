import type { Tone } from '../../components/ui';
import { workspace } from '../../config/workspace';
import { parseJson } from '../../lib/format';
import type { Stage, WorkJob } from '../../lib/types';

const night = workspace.schedule.find(s => s.key === 'research');
export const researchWindow = night ? `${night.from}–${night.to} ${workspace.timezoneLabel}` : 'jendela riset malam';

export const stageLabel: Record<Stage, string> = {
  ELIGIBLE: 'Layak', DRAFT_APPROVED: 'Draf disetujui', SENT: 'Terkirim', DELIVERED: 'Diterima', REPLIED: 'Dibalas',
  DEMO_REQUESTED: 'Minta demo', DEMO_SENT: 'Demo dikirim', OWNER_CONFIRMED: 'Pemilik terlibat', MEETING_CONFIRMED: 'Rapat',
  TRIAL_AGREED: 'Uji coba', PAID: 'Berbayar',
};

export interface Column { key: string; title: string; statuses: string[]; hint: string; attention?: boolean }

export const COLUMNS: Column[] = [
  { key: 'attention', title: 'Perlu perhatian', statuses: ['blocked', 'needs_revision', 'failed', 'abandoned_unknown'], hint: 'Terblokir, perlu revisi, gagal, atau hasil tidak diketahui', attention: true },
  { key: 'queued', title: 'Antre', statuses: ['queued'], hint: 'Menunggu diambil PC Worker' },
  { key: 'running', title: 'Berjalan', statuses: ['claimed', 'running'], hint: 'Sedang dikerjakan PC Worker' },
  { key: 'submitted', title: 'Dikirim worker', statuses: ['submitted'], hint: 'Menunggu dinilai Candra' },
  { key: 'accepted', title: 'Diterima', statuses: ['accepted'], hint: 'Hasil riset diterima Candra' },
];
export const KNOWN_STATUSES = COLUMNS.flatMap(c => c.statuses);

export const statusInfo: Record<string, { label: string; tone: Tone; explain: string }> = {
  queued: { label: 'Antre', tone: 'gray', explain: `Menunggu PC Worker mengambil tugas ini pada riset malam (${researchWindow}).` },
  claimed: { label: 'Diambil worker', tone: 'busy', explain: 'PC Worker sudah mengambil tugas ini dan akan mulai mengerjakannya. Kalau worker berhenti sebelum batas waktunya, tugas kembali ke antrean.' },
  running: { label: 'Berjalan', tone: 'busy', explain: 'PC Worker sedang mengerjakan tugas ini. Kalau worker berhenti sebelum batas waktunya, tugas kembali ke antrean dan dilanjutkan dari langkah terakhir.' },
  submitted: { label: 'Menunggu Candra', tone: 'info', explain: 'Worker sudah mengirim hasil. Candra akan menilai apakah bukti cukup kuat sebelum prospek lanjut ke draf.' },
  accepted: { label: 'Diterima', tone: 'ok', explain: 'Candra menerima hasil riset ini. Prospek bisa lanjut ke penyusunan draf.' },
  needs_revision: { label: 'Perlu revisi', tone: 'warn', explain: 'Candra meminta perbaikan pada sebagian hasil. Worker hanya mengulang bagian yang diminta, bukan seluruh riset.' },
  blocked: { label: 'Terblokir', tone: 'danger', explain: 'Tugas berhenti karena masalah yang tidak bisa diselesaikan otomatis (paling banyak satu kali coba ulang). Perlu data baru atau keputusan manusia.' },
  failed: { label: 'Gagal', tone: 'danger', explain: 'Tugas gagal dan tidak dilanjutkan. Lihat penyebab di bawah.' },
  abandoned_unknown: { label: 'Hasil tidak diketahui', tone: 'unknown', explain: 'Hasil panggilan model tidak diketahui; sengaja tidak diulang otomatis supaya tidak bayar dua kali.' },
  cancelled: { label: 'Dibatalkan', tone: 'gray', explain: 'Tugas dibatalkan dan tidak akan dikerjakan.' },
  hold: { label: 'Ditahan', tone: 'warn', explain: 'Tugas ditahan dan tidak dikerjakan sampai dilepas.' },
};

export function info(status: string) {
  return statusInfo[status] ?? { label: status, tone: 'gray' as Tone, explain: 'Status ini belum punya penjelasan di workspace.' };
}

export type Payload = Record<string, unknown>;

export function payloadOf(job: WorkJob): Payload {
  return parseJson<Payload>(job.payload) ?? {};
}

const pick = (p: Payload, keys: string[]) => {
  for (const k of keys) {
    const v = p[k];
    if (typeof v === 'string' && v.trim()) return v.trim();
    if (typeof v === 'number') return String(v);
  }
  return null;
};

export const prospectOf = (p: Payload) => pick(p, ['prospect', 'name', 'business', 'prospect_name', 'prospect_ref', 'domain']);
export const taskOf = (p: Payload) => pick(p, ['task', 'job_type', 'type', 'stage', 'kind']);
export const batchOf = (p: Payload) => pick(p, ['batch_id', 'batch']);

/** Checkpoints are shown as "langkah …", never as the raw term. */
export function stepLabel(checkpoint: string | null): string | null {
  if (!checkpoint) return null;
  let text = checkpoint.trim();
  if (text.startsWith('{')) {
    const parsed = parseJson<Payload>(text);
    text = (parsed && pick(parsed, ['label', 'step', 'stage', 'name'])) ?? '';
  }
  if (!text) return null;
  return /^langkah\b/i.test(text) ? text : `langkah ${text}`;
}
