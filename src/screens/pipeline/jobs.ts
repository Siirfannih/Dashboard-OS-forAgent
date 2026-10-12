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

const pickOne = (p: Payload, keys: string[]) => {
  for (const k of keys) {
    const v = p[k];
    if (typeof v === 'string' && v.trim()) return v.trim();
    if (typeof v === 'number') return String(v);
  }
  return null;
};

/** The ledger nests the job's own fields under `input`; top-level keys win, then `input`. */
const pick = (p: Payload, keys: string[]) => {
  const input = p.input && typeof p.input === 'object' && !Array.isArray(p.input) ? p.input as Payload : null;
  return pickOne(p, keys) ?? (input ? pickOne(input, keys) : null);
};

const taskKind: Record<string, string> = {
  maps_search: 'Cari tempat di Google Maps',
  prospect_research: 'Riset prospek',
  maps_lookup: 'Cocokkan data Google Maps',
  discovery: 'Cari kandidat prospek',
};

export function prospectOf(p: Payload): string | null {
  const name = pick(p, ['prospect', 'business_name', 'name', 'business', 'prospect_name', 'prospect_ref']);
  if (name) return name;
  const query = pick(p, ['query']);
  return query ? `Pencarian: ${query}` : null;
}
export function taskOf(p: Payload): string | null {
  const kind = pick(p, ['task', 'task_kind', 'job_type', 'type', 'kind']);
  return kind ? taskKind[kind] ?? kind : null;
}
export const batchOf = (p: Payload) => pick(p, ['batch_id', 'batch']);
/** Worker's own one-line summary of the result, when it wrote one. */
export const summaryOf = (job: { result?: unknown }) => {
  const r = parseJson<Payload>(job.result);
  return r ? pickOne(r, ['summary']) : null;
};

/** Checkpoints are shown as "langkah …", never as the raw term. The API sends an object; older rows a string. */
export function stepLabel(checkpoint: unknown): string | null {
  if (!checkpoint) return null;
  let text = '';
  if (typeof checkpoint === 'string') {
    text = checkpoint.trim();
    if (text.startsWith('{')) {
      const parsed = parseJson<Payload>(text);
      text = (parsed && pickOne(parsed, ['label', 'step', 'stage', 'name'])) ?? '';
    }
  } else if (typeof checkpoint === 'object' && !Array.isArray(checkpoint)) {
    text = pickOne(checkpoint as Payload, ['label', 'step', 'stage', 'name']) ?? '';
  }
  if (!text) return null;
  return /^langkah\b/i.test(text) ? text : `langkah ${text.replace(/_/g, ' ')}`;
}
