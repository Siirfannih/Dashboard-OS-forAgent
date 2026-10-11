import { agent, workspace } from '../../config/workspace';
import { toDate } from '../../lib/format';
import type { ChatConversation, ChatMessage, ChatRun, ChatSnapshot, WorkspaceAgent } from '../../lib/types';

/** Candra talks through her own Telegram DM session; the web joins that same session. */
export const CANDRA_ID = 'candra';
export const CANDRA_NOTE = 'Satu sesi dengan Telegram: yang kamu tulis di sini juga Candra ingat saat kamu lanjut dari Telegram, dan sebaliknya.';
export const AGENT_PREFIX = 'agent:';

export const SUGGESTIONS = [
  'Cek kesehatan sistem hari ini',
  'Kenapa sesi WhatsApp terputus?',
  'Ringkas pekerjaan riset semalam',
  'Apa yang perlu aku putuskan hari ini?',
];

export type AgentAvailability = 'ready' | 'history_only' | 'planned' | 'shared' | 'unknown';

/** The backend agent list plus Candra from the roster (not chattable yet). */
export function directAgents(agents: WorkspaceAgent[]): { id: string; availability: AgentAvailability; description?: string }[] {
  const list: { id: string; availability: AgentAvailability; description?: string }[] = agents.map(a => ({
    id: a.id,
    availability: a.id === CANDRA_ID ? 'shared' : a.status,
    description: a.description,
  }));
  if (!list.some(a => a.id === CANDRA_ID) && workspace.roster.some(r => r.id === CANDRA_ID)) {
    list.unshift({ id: CANDRA_ID, availability: 'shared', description: 'Kepala Sales & relasi pelanggan: meneliti prospek, menyusun draf, dan menangani percakapan WhatsApp.' });
  }
  return list;
}

export function availabilityOf(agents: WorkspaceAgent[] | undefined, id: string | null | undefined): AgentAvailability {
  if (!id) return 'unknown';
  if (id === CANDRA_ID) return 'shared';
  const found = agents?.find(a => a.id === id);
  return found ? found.status : 'unknown';
}

export const availabilityText: Record<AgentAvailability, string> = {
  ready: 'Siap',
  history_only: 'Telegram',
  planned: 'Belum aktif',
  shared: 'Telegram + web',
  unknown: 'Tidak tersedia',
};

/** Why the composer is closed for this agent; null when it may receive messages. */
export function blockedReason(availability: AgentAvailability, id: string | null | undefined): string | null {
  const name = agent(id).displayName;
  switch (availability) {
    case 'ready': return null;
    case 'history_only': return `${name} bekerja lewat Telegram — riwayat saja. Kirim tugas ke ${name} dari Telegram.`;
    case 'planned': return `${name} belum diaktifkan. Thread ini bisa dibaca, tetapi belum bisa menerima pesan.`;
    case 'shared': return null;
    default: return 'Agent ini tidak tersedia untuk chat dari workspace.';
  }
}

export const isActiveRun = (r: ChatRun) => r.status === 'queued' || r.status === 'running';

export function threadStatus(chat: ChatSnapshot | undefined): { tone: 'busy' | 'info' | 'warn' | 'danger' | 'gray'; label: string } {
  const runs = chat?.runs ?? [];
  if (runs.some(r => r.status === 'running')) return { tone: 'busy', label: 'Sedang bekerja' };
  if (runs.some(r => r.status === 'queued')) return { tone: 'info', label: 'Mengantre' };
  const last = runs[runs.length - 1];
  if (last?.status === 'waiting_for_help') return { tone: 'warn', label: 'Menunggu kamu' };
  if (last?.status === 'failed') return { tone: 'danger', label: 'Gagal terakhir' };
  return { tone: 'gray', label: 'Diam' };
}

export const sortByUpdated = (a: ChatConversation, b: ChatConversation) =>
  (toDate(b.updated_at)?.valueOf() ?? 0) - (toDate(a.updated_at)?.valueOf() ?? 0);

const dayKey = (d: Date) => new Intl.DateTimeFormat('en-CA', { timeZone: workspace.timezone }).format(d);

/**
 * Runs per day for the last 14 days. Uses run timestamps when the API sends them
 * (backend runs carry created_at), otherwise counts agent replies.
 */
export function activity14(chat: ChatSnapshot): { days: { key: string; date: Date; count: number }[]; basis: 'runs' | 'replies' } {
  const runs = chat.runs as (ChatRun & { created_at?: string })[];
  const runStamps = runs.map(r => toDate(r.created_at)).filter((d): d is Date => !!d);
  const basis = runStamps.length ? 'runs' : 'replies';
  const stamps = basis === 'runs'
    ? runStamps
    : chat.messages.filter((m: ChatMessage) => m.role === 'assistant').map(m => toDate(m.created_at)).filter((d): d is Date => !!d);
  const counts = new Map<string, number>();
  for (const d of stamps) counts.set(dayKey(d), (counts.get(dayKey(d)) ?? 0) + 1);
  const days = Array.from({ length: 14 }, (_, i) => {
    const date = new Date(Date.now() - (13 - i) * 86_400_000);
    const key = dayKey(date);
    return { key, date, count: counts.get(key) ?? 0 };
  });
  return { days, basis };
}

/** Members of a thread: rooms list member_ids, private threads have one agent. */
export function membersOf(chat: ChatConversation): string[] {
  if (chat.kind === 'room' && chat.member_ids?.length) return chat.member_ids;
  return [chat.agent_id];
}
