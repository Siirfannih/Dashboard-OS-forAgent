// Pure helpers for the Alur Kerja screen: value overlay (definition → applied overrides → local draft),
// change lists, validation, and live status derived from real API data. Unknown stays unknown.
import { waLabel } from '../../components/Shell';
import type { Tone } from '../../components/ui';
import { hostLabel, salesWorkflow } from '../../config/workflow';
import { ago, ageHours } from '../../lib/format';
import type {
  BridgeStatus, FlowNode, NodeType, ReviewItem, WhatsAppLink, WorkflowChange, WorkflowProposal, WorkJob,
} from '../../lib/types';

/** Draft values keyed `${node_id}.${field}` where field is 'host' or 'limit.<key>'. */
export type Draft = Record<string, string>;
export type Overrides = Record<string, string>;

export const nodeById = (id: string | undefined) => salesWorkflow.nodes.find(n => n.id === id);

export function baseValue(node: FlowNode, field: string): string | undefined {
  if (field === 'host') return node.host;
  if (field.startsWith('limit.')) return node.limits?.find(l => l.key === field.slice(6))?.value;
  return undefined;
}

export function currentValue(node: FlowNode, field: string, overrides: Overrides): string | undefined {
  return overrides[`${node.id}.${field}`] ?? baseValue(node, field);
}

export function effectiveValue(node: FlowNode, field: string, overrides: Overrides, draft: Draft): string | undefined {
  return draft[`${node.id}.${field}`] ?? currentValue(node, field, overrides);
}

export function splitKey(key: string): { nodeId: string; field: string } {
  const dot = key.indexOf('.');
  return { nodeId: key.slice(0, dot), field: key.slice(dot + 1) };
}

export function computeChanges(draft: Draft, overrides: Overrides): WorkflowChange[] {
  const out: WorkflowChange[] = [];
  for (const [key, to] of Object.entries(draft)) {
    const { nodeId, field } = splitKey(key);
    const node = nodeById(nodeId);
    if (!node) continue;
    const from = currentValue(node, field, overrides) ?? '';
    if (from !== to) out.push({ node_id: nodeId, field, from, to });
  }
  return out;
}

export function fieldLabel(node: FlowNode | undefined, field: string): string {
  if (field === 'host') return 'Pelaksana';
  if (field.startsWith('limit.')) return node?.limits?.find(l => l.key === field.slice(6))?.label ?? field.slice(6);
  return field;
}

export function displayValue(node: FlowNode | undefined, field: string, value: string): string {
  if (field === 'host') return node?.hostOptions?.find(o => o.value === value)?.label ?? hostLabel[value] ?? value;
  return value || '—';
}

export function describeChange(change: WorkflowChange) {
  const node = nodeById(change.node_id);
  return {
    step: node ? `${node.n}. ${node.title}` : change.node_id,
    field: fieldLabel(node, change.field),
    from: displayValue(node, change.field, change.from),
    to: displayValue(node, change.field, change.to),
  };
}

export const TIME_RE = /^([01]\d|2[0-3]):[0-5]\d$/;
export const UNIT_RE = /^(\d+)\s+(.+)$/;

/** Returns an error per draft key, in plain Indonesian. */
export function validateDraft(draft: Draft, overrides: Overrides): Record<string, string> {
  const errors: Record<string, string> = {};
  for (const [key, value] of Object.entries(draft)) {
    const { nodeId, field } = splitKey(key);
    const node = nodeById(nodeId);
    if (!node || !field.startsWith('limit.')) continue;
    const base = baseValue(node, field) ?? '';
    if (TIME_RE.test(base)) {
      if (!TIME_RE.test(value)) errors[key] = 'Pakai format jam JJ:MM, misalnya 07:30.';
    } else if (UNIT_RE.test(base)) {
      const n = Number(UNIT_RE.exec(value)?.[1]);
      if (!Number.isInteger(n) || n < 1 || n > 200) errors[key] = 'Isi angka bulat 1–200.';
    } else if (!value.trim()) {
      errors[key] = 'Tidak boleh kosong.';
    }
  }
  const approval = nodeById('approval');
  if (approval) {
    const start = effectiveValue(approval, 'limit.window_start', overrides, draft) ?? '';
    const end = effectiveValue(approval, 'limit.window_end', overrides, draft) ?? '';
    if (TIME_RE.test(start) && TIME_RE.test(end) && start >= end) {
      errors['approval.limit.window_end'] = 'Jam selesai harus setelah jam mulai.';
    }
  }
  return errors;
}

/* ---------- Node type presentation ---------- */

export const typeMeta: Record<NodeType, { label: string; className: string }> = {
  trigger: { label: 'Pemicu · jadwal', className: 'text-muted' },
  auto: { label: 'Otomatis', className: 'text-muted' },
  human: { label: 'Manusia', className: 'text-ink' },
  gate: { label: 'Gerbang · Manusia', className: 'text-warn' },
  guard: { label: 'Pengaman · terkunci', className: 'text-danger' },
  decision: { label: 'Keputusan sistem', className: 'text-muted' },
  end: { label: 'Akhir', className: 'text-muted' },
};

/* ---------- Live status ---------- */

export interface LiveData {
  jobs: WorkJob[] | null;
  review: ReviewItem[] | null;
  bridge: BridgeStatus | null;
  wa: WhatsAppLink | null;
  holds: number | null;
}

export interface StatusPill { tone: Tone; text: string; dot?: boolean; title?: string }

const count = (jobs: WorkJob[], statuses: string[]) => jobs.filter(j => statuses.includes(j.status)).length;
const researchJobs = (live: LiveData | undefined) => live?.jobs ? live.jobs.filter(j => j.worker_role === 'research') : null;

export function isRunning(node: FlowNode, live: LiveData | undefined): boolean {
  const jobs = node.id === 'research' ? researchJobs(live) : null;
  return !!jobs && count(jobs, ['running', 'claimed']) > 0;
}

export function hasFailure(node: FlowNode, live: LiveData | undefined): boolean {
  const jobs = node.id === 'research' ? researchJobs(live) : null;
  return !!jobs && count(jobs, ['blocked', 'failed']) > 0;
}

/** Status pills per node, from real data only. `live` undefined = still loading. */
export function nodeStatus(node: FlowNode, live: LiveData | undefined): StatusPill[] {
  if (!live) return [];
  const unknown = (text: string): StatusPill[] => [{ tone: 'unknown', text, title: 'Data belum bisa dibaca dari server' }];
  switch (node.id) {
    case 'plan':
      if (!live.bridge) return unknown('Candra: tidak diketahui');
      return [live.bridge.candra_online ? { tone: 'ok', text: 'Candra aktif', dot: true } : { tone: 'danger', text: 'Candra tidak aktif', dot: true }];
    case 'research': {
      const jobs = researchJobs(live);
      if (!jobs) return unknown('Status riset tidak diketahui');
      if (!jobs.length) return [{ tone: 'gray', text: 'Belum ada tugas' }];
      const out: StatusPill[] = [];
      const running = count(jobs, ['running', 'claimed']);
      const queued = count(jobs, ['queued']);
      const accepted = count(jobs, ['accepted', 'submitted']);
      const blocked = count(jobs, ['blocked', 'failed']);
      const unknownResult = count(jobs, ['abandoned_unknown']);
      if (running) out.push({ tone: 'busy', text: `${running} berjalan`, dot: true });
      if (queued) out.push({ tone: 'info', text: `${queued} antre` });
      if (accepted) out.push({ tone: 'ok', text: `${accepted}/${jobs.length} diterima` });
      if (blocked) out.push({ tone: 'danger', text: `${blocked} terblokir` });
      if (unknownResult) out.push({ tone: 'unknown', text: `${unknownResult} hasil tidak diketahui`, title: 'Hasil panggilan tidak diketahui; tidak diulang otomatis' });
      return out.length ? out : [{ tone: 'gray', text: `${jobs.length} tugas` }];
    }
    case 'validator': {
      const jobs = researchJobs(live);
      if (!jobs) return unknown('Tidak diketahui');
      const revise = count(jobs, ['needs_revision']);
      const blocked = count(jobs, ['blocked']);
      const out: StatusPill[] = [];
      if (revise) out.push({ tone: 'warn', text: `${revise} perlu revisi` });
      if (blocked) out.push({ tone: 'danger', text: `${blocked} terblokir` });
      return out.length ? out : [{ tone: 'gray', text: 'Tidak ada yang tertahan' }];
    }
    case 'revise': {
      const jobs = researchJobs(live);
      if (!jobs) return unknown('Tidak diketahui');
      const revise = count(jobs, ['needs_revision']);
      return [revise ? { tone: 'warn', text: `${revise} menunggu revisi` } : { tone: 'gray', text: 'Tidak ada revisi' }];
    }
    case 'draft': {
      if (!live.review) return unknown('Draf tidak diketahui');
      const ready = live.review.filter(r => r.status === 'draft').length;
      const revising = live.review.filter(r => r.status === 'needs_revision').length;
      const out: StatusPill[] = [];
      if (ready) out.push({ tone: 'info', text: `${ready} draf siap` });
      if (revising) out.push({ tone: 'warn', text: `${revising} sedang direvisi` });
      return out.length ? out : [{ tone: 'gray', text: 'Belum ada draf' }];
    }
    case 'approval': {
      if (!live.review) return unknown('Antrean tidak diketahui');
      const waiting = live.review.filter(r => r.status === 'draft').length;
      return [waiting ? { tone: 'warn', text: `${waiting} menunggu kamu`, dot: true } : { tone: 'ok', text: 'Tidak ada antrean' }];
    }
    case 'send': {
      const out: StatusPill[] = [];
      if (!live.wa) out.push({ tone: 'unknown', text: 'Kanal: tidak diketahui' });
      else if (live.wa.state !== 'connected') out.push({ tone: 'danger', text: `Kanal: ${waLabel[live.wa.state] ?? live.wa.state}`, dot: true });
      if (!live.bridge) out.push({ tone: 'unknown', text: 'Jeda: tidak diketahui' });
      else if (live.bridge.paused) out.push({ tone: 'warn', text: 'Dijeda', dot: true, title: 'Tidak ada pesan keluar sampai dilanjutkan' });
      if (!out.length) out.push({ tone: 'ok', text: 'Siap kirim di jam kirim', dot: true });
      return out;
    }
    case 'escalation':
      if (live.holds === null) return unknown('Tidak diketahui');
      return [live.holds ? { tone: 'warn', text: `${live.holds} ditahan` } : { tone: 'gray', text: 'Tidak ada yang ditahan' }];
    default:
      return [];
  }
}

/** PC worker signal for the research host line. Unknown ≠ healthy. */
export function pcSignal(live: LiveData | undefined): StatusPill | null {
  if (!live) return null;
  if (!live.jobs) return { tone: 'unknown', text: 'Tidak diketahui' };
  const last = live.jobs.reduce<number | null>((max, j) => (j.worker_id && (max === null || j.updated_at > max) ? j.updated_at : max), null);
  if (last === null) return { tone: 'unknown', text: 'Belum ada sinyal' };
  if ((ageHours(last) ?? 99) < 1) return { tone: 'ok', text: `Aktif ${ago(last)}`, dot: true };
  return { tone: 'unknown', text: `Sinyal terakhir ${ago(last)}` };
}

/* ---------- Proposals ---------- */

export const proposalStatus: Record<WorkflowProposal['status'], { label: string; tone: Tone }> = {
  pending: { label: 'Menunggu persetujuan', tone: 'warn' },
  approved: { label: 'Disetujui', tone: 'info' },
  dispatched: { label: 'Menunggu penerapan Angga', tone: 'busy' },
  applied: { label: 'Diterapkan', tone: 'ok' },
  rejected: { label: 'Ditolak', tone: 'gray' },
};

export function isConflict(exc: unknown): boolean {
  const status = (exc as { status?: number } | null)?.status;
  const message = exc instanceof Error ? exc.message : '';
  return status === 409 || /berubah|versi|version|conflict/i.test(message);
}
