// Fixtures shaped like the live workspace API (src/lib/types.ts), built to break screens:
// every nullable field null, empty lists, unknown enum values from a newer backend,
// malformed JSON in string fields, and extreme text. All data is fictional (.test, 62000…).
import { ApiError } from '../lib/api';
import type { DataSource } from '../lib/source';
import type {
  CandraSession, ChatSnapshot, ConversationDetail, ReviewItem, SalesConversation, Stage, WorkJob, WorkspaceState,
} from '../lib/types';

const NOW = Date.now() / 1000;
/** One unbroken 600-character token: catches missing `break-words` / `min-w-0`. */
export const LONG_TOKEN = 'X'.repeat(600);
export const LONG_TEXT = 'kata panjang sekali '.repeat(150).trim();
/** Markup and control characters must render as text, never as HTML. */
export const HOSTILE = '<img src=x onerror=alert(1)> <b>tebal</b> 🙂 ‮balik‬';

const noop = async () => undefined;

function conversation(over: Partial<SalesConversation> = {}): SalesConversation {
  return {
    id: 'conv_null', control: 'AUTO', mode: 'DRAFT_ONLY', stage: 'ELIGIBLE', hold_reason: null, followups: 0,
    updated_at: NOW, last_inbound_at: null, last_outbound_at: null, status: 'Open', priority: 'Low',
    audience: 'prospect', contact_id: 'ct_null', name: '', prospect_ref: null, phone: null, profile: null, domain: null,
    account_id: 'acc_null', drafts: 0, queued: 0, unread: 0, last_sender: null, last_body: null, last_direction: null,
    last_at: null, tags: [], assignee: 'none', ...over,
  };
}

const conversations: SalesConversation[] = [
  conversation(),
  conversation({
    id: 'conv_long', control: 'HOLD', stage: 'SOMETHING_NEW' as Stage, hold_reason: LONG_TOKEN, name: LONG_TOKEN,
    phone: '123', profile: 'profil sebagai teks biasa', domain: `${LONG_TOKEN}.test`, unread: 999_999, drafts: 3,
    last_body: LONG_TEXT, last_direction: 'in', last_sender: HOSTILE, last_at: NOW - 400 * 86_400, tags: [LONG_TOKEN, HOSTILE],
    priority: 'Urgent', assignee: 'irfan',
  }),
  conversation({ id: 'conv_dnc', control: 'DO_NOT_CONTACT', name: HOSTILE, phone: '620000000199', profile: { kota: { nested: true } }, status: 'Closed' }),
];

function detail(conv: SalesConversation): ConversationDetail {
  return {
    conversation: conv,
    messages: [
      { id: 'm1', conversation_id: conv.id, direction: 'in', actor: 'prospect', body: '', at: NOW - 60, sender: null },
      { id: 'm2', conversation_id: conv.id, direction: 'out', actor: 'robot_baru', body: LONG_TOKEN, at: NOW, sender: HOSTILE },
      { id: 'm3', conversation_id: conv.id, direction: 'in', actor: 'prospect', body: `${LONG_TEXT}\n\n\n\n${HOSTILE}`, at: NOW, sender: null },
    ],
    outbox: [{
      id: 'ob1', conversation_id: conv.id, actor: 'ai', kind: 'unknown_kind', body: LONG_TOKEN, status: 'mystery', approved: 0,
      version: 1, sender_profile: '', run_mode: 'review_only', created_at: NOW, sent_at: null, error: LONG_TOKEN,
    }],
    notes: [{ id: 'n1', body: LONG_TOKEN, at: NOW }],
    events: [{ id: 1, actor: '', event_type: 'event_baru', evidence: null, at: NOW }],
    study: { verdict: 'unknown_verdict', summary: null, target_service: null, content: {}, version: 1, updated_at: NOW },
    previous: [],
  };
}

const review: ReviewItem[] = [
  {
    id: 'ob_broken', conversation_id: 'conv_long', actor: 'ai', kind: 'first', body: LONG_TOKEN, status: 'pending', approved: 0,
    version: 1, sender_profile: 'b', run_mode: 'review_only', created_at: NOW, sent_at: null, error: null, namespace: 'pilot',
    snapshot: '0'.repeat(64), name: '', phone: null, prospect_ref: null, control: 'AUTO', verdict: null, study_summary: null,
    study_content: '{bukan json', study_updated_at: null, feedback_action: null, feedback_reason: null,
  },
  {
    id: 'ob_partial', conversation_id: 'conv_null', actor: 'ai', kind: 'followup', body: `${LONG_TEXT}\n\n${HOSTILE}`, status: 'pending',
    approved: 0, version: 7, sender_profile: 'a', run_mode: 'production', created_at: NOW - 90 * 86_400, sent_at: null, error: LONG_TOKEN,
    namespace: 'sales', snapshot: '1'.repeat(64), name: LONG_TOKEN, phone: '620000000198', prospect_ref: 'P-000', control: 'HOLD',
    verdict: 'contact', study_summary: LONG_TEXT, study_updated_at: NOW - 400 * 86_400, feedback_action: 'revise', feedback_reason: LONG_TOKEN,
    study_content: JSON.stringify({
      verdict: 'contact', masalah: [{ status: 'aneh', masalah: LONG_TOKEN, bukti: '' }, {}],
      verifikasi: { [LONG_TOKEN]: LONG_TOKEN }, bisnis: {}, solusi: { layanan: HOSTILE },
    }),
  },
];

const jobs: WorkJob[] = [
  {
    id: 'job_broken', domain: 'sales', head_agent: 'agent_baru', worker_role: 'peran_baru', status: 'status_baru', attempt: 99,
    worker_id: null, lease_expiry: null, revision: 0, error: LONG_TOKEN, payload: '{rusak', checkpoint: null, feedback: null,
    run_mode: 'review_only', created_at: NOW, updated_at: NOW,
  },
  {
    id: 'job_obj', domain: LONG_TOKEN, head_agent: 'candra', worker_role: 'research', status: 'failed', attempt: 1,
    worker_id: 'w1', lease_expiry: NOW - 10, revision: 2, error: null, payload: { name: LONG_TOKEN, nested: { a: [1, 2] } },
    checkpoint: LONG_TOKEN, feedback: HOSTILE, run_mode: 'production', created_at: 0, updated_at: 0,
  },
];

const state: WorkspaceState = {
  user: null,
  agents: [
    { id: 'agent_tak_dikenal', name: LONG_TOKEN, role: HOSTILE, status: 'ready' },
    { id: 'engineer', name: '', role: '', status: 'history_only', history_only: true },
  ],
  conversations: [
    { id: 'chat_long', title: LONG_TOKEN, agent_id: 'agent_tak_dikenal', kind: 'room', member_ids: null, created_at: 'bukan tanggal', updated_at: '' },
  ],
  activity: [{ id: 'a1', type: 'tipe_baru', title: LONG_TOKEN, created_at: 'bukan tanggal' }],
  integrations: [{ id: 'i1', name: HOSTILE, status: 'status_baru' }],
  system: {},
};

const chat: ChatSnapshot = {
  ...state.conversations[0],
  messages: [
    { id: 'c1', role: 'system', content: LONG_TOKEN, agent_id: null, created_at: '' },
    { id: 'c2', role: 'assistant', content: HOSTILE, agent_id: 'agent_tak_dikenal', created_at: 'bukan tanggal' },
  ],
  runs: [{ id: 'r1', status: 'failed', agent_id: 'agent_tak_dikenal', error: LONG_TOKEN }],
};

const candra: CandraSession = {
  available: true, reason: null, detail: null, session_id: 's1',
  messages: [
    { id: 'k1', role: 'user', content: LONG_TOKEN, created_at: null, source: null },
    { id: 'k2', role: 'assistant', content: `${LONG_TEXT}\n\n${HOSTILE}\n\nMEDIA:/x/../../etc/${LONG_TOKEN}.md`, created_at: 'bukan tanggal', source: 'platform_baru' },
  ],
  turn: { running: false, started_at: null, error: LONG_TOKEN, finished_at: null },
};

const base = {
  auth: async () => ({ authenticated: true }),
  login: noop, logout: noop, approve: noop, decline: noop, setControl: noop, ownerMessage: noop, addNote: noop, markSeen: noop,
  sendChat: noop, sendCandra: noop,
  candraMediaUrl: () => null, candraMediaText: async () => '',
};

/** Real-shaped data at its worst. */
export const extremeSource: DataSource = {
  ...base,
  kind: 'live',
  state: async () => structuredClone(state),
  review: async () => structuredClone(review),
  reviewPolicy: async () => ({ owner_approval: 'mode_baru', approval_expires_hours: 0, pitch_evidence_hours: 0, autonomous_replies: true, pilot_outbound: true }),
  conversations: async () => ({ items: structuredClone(conversations), counts: { all: 3, hold: 999_999 } }),
  conversation: async id => {
    const conv = conversations.find(c => c.id === id);
    if (!conv) throw new ApiError('Percakapan tidak ditemukan', 404);
    return detail(structuredClone(conv));
  },
  metrics: async () => ({
    reply_rate: { numerator: 0, denominator: 0, value: null },
    demo_request_rate: { numerator: 5, denominator: 0, value: null },
    owner_reach_rate: { numerator: 1, denominator: 3, value: 1 / 3 },
    paid_win_rate: { numerator: 9, denominator: 3, value: 3 },
    control: {}, stages: { ['SOMETHING_NEW' as Stage]: 4 },
  }),
  bridge: async () => ({ configured: false, paused: true, drafting: false, candra_online: false, dropped_inbound: 12, last_error: LONG_TOKEN, last_tick_at: null }),
  whatsapp: async () => ({ state: 'waiting_qr', qr: LONG_TOKEN, account: null, updated_at: null }),
  jobs: async () => ({ items: structuredClone(jobs), head_status: { anything: true } }),
  batches: async () => [{ id: 'b0', cap_usd: 0, max_items: 0, domain: 'sales', head_agent: '', created_at: 0, items: 0, known_cost_usd: 0, reserved_usd: 0, remaining_usd: -1 }],
  usage: async () => ({ [LONG_TOKEN]: { calls: 0, input_tokens: null, output_tokens: null, cost_usd: null, unknown_cost_calls: 0 } }),
  chat: async id => {
    if (id !== chat.id) throw new ApiError('Percakapan tidak ditemukan', 404);
    return structuredClone(chat);
  },
  createChat: async input => ({ ...state.conversations[0], ...input, kind: input.kind ?? 'private' }),
  workflow: async () => ({
    version: 3,
    overrides: { 'research.host': 'host_tak_dikenal', 'node_hilang.field': 'x' },
    proposals: [
      { id: 'wp1', base_version: 1, status: 'applied', changes: [{ node_id: 'node_hilang', field: 'x', from: '', to: LONG_TOKEN }], note: LONG_TOKEN, created_at: NOW, task_conversation_id: null },
      { id: 'wp2', base_version: 3, status: 'pending', changes: [], note: '', created_at: 0 },
    ],
  }),
  proposeWorkflow: async () => { throw new ApiError('Alur sudah berubah', 409); },
  decideProposal: async () => { throw new ApiError('Konflik', 409); },
  markApplied: async () => { throw new ApiError('Konflik', 409); },
  worker: async () => ({ last_activity_at: null, by_status: { status_baru: 3 }, identities: 0 }),
  candra: async () => structuredClone(candra),
};

/** A brand-new workspace: nothing yet, every metric unmeasured. */
export const emptySource: DataSource = {
  ...extremeSource,
  state: async () => ({ user: null, agents: [], conversations: [], activity: [], integrations: [] }),
  review: async () => [],
  conversations: async () => ({ items: [], counts: {} }),
  metrics: async () => {
    const zero = { numerator: 0, denominator: 0, value: null };
    return { reply_rate: zero, demo_request_rate: zero, owner_reach_rate: zero, paid_win_rate: zero, control: {}, stages: {} };
  },
  bridge: async () => ({ configured: false, paused: false, drafting: false, candra_online: false, dropped_inbound: 0 }),
  whatsapp: async () => ({ state: 'not_running', qr: null, account: null, updated_at: null }),
  jobs: async () => ({ items: [] }),
  batches: async () => [],
  usage: async () => ({}),
  workflow: async () => ({ version: 1, overrides: {}, proposals: [] }),
  worker: async () => ({ last_activity_at: null, by_status: {}, identities: 0 }),
  candra: async () => ({ available: false, reason: 'not_configured', detail: null, session_id: null, messages: [], turn: { running: false, started_at: null, error: null, finished_at: null } }),
};

/** Every read fails like a broken backend (500). */
export const failingSource: DataSource = Object.fromEntries(
  Object.entries(extremeSource).map(([key, value]) => [
    key,
    typeof value === 'function' ? async () => { throw new ApiError(`Server gagal (500) di ${key}.`, 500); } : value,
  ]),
) as unknown as DataSource;
