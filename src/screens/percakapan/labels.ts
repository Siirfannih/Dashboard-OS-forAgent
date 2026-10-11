import type { Control, InboxView, SalesConversation, Stage } from '../../lib/types';

export interface ViewEntry { view: InboxView; label: string }
export const VIEW_GROUPS: { label: string; items: ViewEntry[] }[] = [
  { label: 'Butuh kamu', items: [{ view: 'hold', label: 'Ditahan' }, { view: 'needs_reply', label: 'Perlu balasan' }] },
  { label: 'Penanganan', items: [{ view: 'candra', label: 'Ditangani AI' }, { view: 'human', label: 'Kamu pegang' }] },
  { label: 'Kontak', items: [
    { view: 'prospects', label: 'Semua prospek' },
    { view: 'groups', label: 'Grup' },
    { view: 'others', label: 'Lainnya' },
    { view: 'resolved', label: 'Selesai' },
    { view: 'dnc', label: 'Jangan hubungi' },
  ] },
];
export const ALL_VIEWS = VIEW_GROUPS.flatMap(g => g.items);

export const stageLabel: Record<Stage, string> = {
  ELIGIBLE: 'Lolos kelayakan', DRAFT_APPROVED: 'Draf disetujui', SENT: 'Terkirim', DELIVERED: 'Diterima', REPLIED: 'Dibalas',
  DEMO_REQUESTED: 'Minta demo', DEMO_SENT: 'Demo dikirim', OWNER_CONFIRMED: 'Pemilik terlibat', MEETING_CONFIRMED: 'Rapat',
  TRIAL_AGREED: 'Uji coba', PAID: 'Membayar',
};
export const KEY_STAGES: Stage[] = ['SENT', 'REPLIED', 'DEMO_REQUESTED', 'OWNER_CONFIRMED', 'MEETING_CONFIRMED'];

export const controlLabel: Record<Control, string> = {
  AUTO: 'Otomatis', HOLD: 'Ditahan', HUMAN_CONTROLLED: 'Kamu', DO_NOT_CONTACT: 'Jangan hubungi',
};

export function handlerLine(c: SalesConversation): string {
  switch (c.control) {
    case 'AUTO': return 'Candra menangani';
    case 'HUMAN_CONTROLLED': return 'Kamu memegang';
    case 'HOLD': return `Ditahan: ${c.hold_reason || 'tanpa alasan tercatat'}`;
    default: return 'Tidak dihubungi lagi lewat nomor pengirim mana pun';
  }
}

const eventLabels: Record<string, string> = {
  HOLD: 'Ditahan', AUTO: 'Dikembalikan ke Candra', HUMAN_CONTROLLED: 'Kamu mengambil alih', DO_NOT_CONTACT: 'Ditandai jangan hubungi',
  OUTBOX_APPROVED: 'Draf disetujui', OUTBOX_DRAFT: 'Draf dibuat', OUTBOX_EDITED: 'Draf diubah', OUTBOX_CANCELLED: 'Draf dibatalkan',
  OUTBOX_BLOCKED: 'Pengiriman ditahan aturan kirim', OUTBOX_RETRY: 'Pengiriman diulang', SEND_FAILED: 'Pesan gagal dikirim',
  SEND_INTERRUPTED: 'Pengiriman terputus — status tidak diketahui', STUDY_SAVED: 'Riset tersimpan', ELIGIBLE: 'Lolos kelayakan',
  DRAFT_DECLINED: 'Draf diminta revisi', ASSIGNED: 'Ditugaskan', TAG_ADDED: 'Label ditambah', TAG_REMOVED: 'Label dihapus',
  OWNER_TYPED: 'Kamu membalas dari HP', INBOUND_CONTACT: 'Kontak baru menghubungi', PROMOTED: 'Dijadikan prospek',
  STUDY_INVALIDATED_CONTACT: 'Riset dibatalkan: kontak berubah', NO_REPLY_REVIEW_QUEUED: 'Belum dibalas — masuk tinjauan',
};
/** Events already visible as their own bubble/card. */
export const HIDDEN_EVENTS = new Set(['MESSAGE_IN', 'MESSAGE_OUT', 'NOTE_ADDED']);

export function eventLabel(type: string): string {
  if (eventLabels[type]) return eventLabels[type];
  if (type.startsWith('STAGE_') || type in stageLabel) return `Tahap: ${stageLabel[type.replace(/^STAGE_/, '') as Stage] ?? humanize(type)}`;
  return humanize(type);
}

export function humanize(type: string): string {
  const text = type.replace(/[_-]+/g, ' ').toLowerCase().trim();
  return text ? text[0].toUpperCase() + text.slice(1) : 'Peristiwa';
}

/** Control events carry "reason (cancelled_ai_outbox=N)". */
export function eventDetail(evidence: string | null): { text: string; cancelled: number } {
  if (!evidence) return { text: '', cancelled: 0 };
  const match = evidence.match(/\s*\(cancelled_ai_outbox=(\d+)\)\s*$/);
  return match ? { text: evidence.slice(0, match.index).trim(), cancelled: Number(match[1]) } : { text: evidence, cancelled: 0 };
}

export function snippetPrefix(c: SalesConversation): string {
  if (c.last_direction !== 'out') return '';
  const sender = (c.last_sender ?? '').toLowerCase();
  if (/candra|\bai\b/.test(sender)) return 'AI: ';
  if (/kamu|owner|irfan|pemilik/.test(sender)) return 'Kamu: ';
  return 'Terkirim: ';
}

export const DEFAULT_REASON: Record<Control, string> = {
  AUTO: 'Pemilik mengembalikan percakapan ke Candra',
  HOLD: 'Pemilik menahan percakapan untuk ditinjau',
  HUMAN_CONTROLLED: 'Pemilik mengambil alih percakapan',
  DO_NOT_CONTACT: 'Kontak meminta tidak dihubungi lagi',
};

export const CONSEQUENCE: Record<Control, string[]> = {
  AUTO: [
    'Candra boleh menyusun draf lagi untuk percakapan ini.',
    'Setiap draf tetap butuh persetujuanmu sebelum dikirim.',
  ],
  HOLD: [
    'AI berhenti menyusun dan mengirim di percakapan ini.',
    'Draf dan antrean pesan AI yang belum terkirim dibatalkan.',
    'Percakapan muncul di "Butuh kamu" sampai kamu memutuskan.',
  ],
  HUMAN_CONTROLLED: [
    'Kamu yang membalas; AI berhenti di percakapan ini.',
    'Draf dan antrean pesan AI yang belum terkirim dibatalkan.',
    'AI baru aktif lagi setelah kamu kembalikan ke Otomatis.',
  ],
  DO_NOT_CONTACT: [
    'Final — tidak bisa dibatalkan, juga oleh kamu.',
    'Berlaku di semua nomor pengirim; kontak ini tidak akan dihubungi lewat profil mana pun.',
    'Draf dan antrean pesan AI yang belum terkirim dibatalkan.',
  ],
};
