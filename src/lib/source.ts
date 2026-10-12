import { get, post } from './api';
import type {
  BridgeStatus, ChatConversation, ChatSnapshot, Control, ConversationDetail, ConversationList, InboxView,
  Metrics, OutboxItem, ReviewItem, ReviewPolicy, UsageTotal, WhatsAppLink, WorkBatch, WorkJobs, WorkflowChange, WorkflowProposal, WorkflowSimulation,
  CandraSession, WorkerSignal, WorkflowState, WorkspaceState,
} from './types';

export interface Auth { authenticated: boolean; user?: { name?: string } | null }

/** Everything the UI reads or writes. LiveSource talks to /api; DemoSource is fictional data for the public repo. */
export interface DataSource {
  kind: 'live' | 'demo';
  auth(): Promise<Auth>;
  login(password: string): Promise<void>;
  logout(): Promise<void>;
  state(): Promise<WorkspaceState>;
  review(): Promise<ReviewItem[]>;
  /** One outbox row in any status (cancelled, sent, …) — for links to drafts that are no longer pending. */
  draft(id: string): Promise<OutboxItem>;
  reviewPolicy(): Promise<ReviewPolicy>;
  approve(item: ReviewItem): Promise<void>;
  decline(item: ReviewItem, reason: string, action: 'revise' | 'hold'): Promise<void>;
  conversations(view: InboxView, q?: string): Promise<ConversationList>;
  conversation(id: string): Promise<ConversationDetail>;
  setControl(id: string, control: Control, reason: string): Promise<void>;
  ownerMessage(id: string, body: string): Promise<void>;
  addNote(id: string, body: string): Promise<void>;
  markSeen(id: string): Promise<void>;
  metrics(): Promise<Metrics>;
  bridge(): Promise<BridgeStatus>;
  whatsapp(): Promise<WhatsAppLink>;
  jobs(): Promise<WorkJobs>;
  batches(): Promise<WorkBatch[]>;
  usage(): Promise<Record<string, UsageTotal>>;
  chat(id: string): Promise<ChatSnapshot>;
  createChat(input: { title: string; agent_id: string; kind?: 'private' | 'room'; member_ids?: string[] }): Promise<ChatConversation>;
  sendChat(id: string, content: string, agent_id?: string): Promise<void>;
  workflow(): Promise<WorkflowState>;
  proposeWorkflow(input: { base_version: number; changes: WorkflowChange[]; note: string }): Promise<WorkflowProposal>;
  decideProposal(id: string, action: 'approve' | 'reject', reason?: string): Promise<WorkflowProposal>;
  markApplied(id: string): Promise<WorkflowProposal>;
  /** Dry run: guards + timing/size rules, no side effects. */
  simulateWorkflow(input: { base_version: number; changes: WorkflowChange[]; values: Record<string, string> }): Promise<WorkflowSimulation>;
  /** Creates a normal pending proposal that restores version `target`; nothing is applied directly. */
  revertWorkflow(target: number, note: string): Promise<WorkflowProposal>;
  worker(): Promise<WorkerSignal>;
  /** Candra's Telegram DM session, shared with the web (one history, one memory). */
  candra(): Promise<CandraSession>;
  sendCandra(content: string): Promise<void>;
  /** Same-origin URL for a file Candra shared in the session (null when not previewable here). */
  candraMediaUrl(path: string, download?: boolean): string | null;
  candraMediaText(path: string): Promise<string>;
}

const enc = encodeURIComponent;

export const liveSource: DataSource = {
  kind: 'live',
  auth: () => get<Auth>('/auth'),
  login: async password => { await post('/login', { password }); },
  logout: async () => { await post('/logout'); },
  state: () => get<WorkspaceState>('/state'),
  review: () => get<ReviewItem[]>('/sales/review'),
  draft: id => get<OutboxItem>(`/sales/outbox/${enc(id)}/review`),
  reviewPolicy: () => get<ReviewPolicy>('/sales/review-policy'),
  approve: async item => {
    await post(`/sales/outbox/${enc(item.id)}/approve`, { version: item.version, snapshot: item.snapshot, namespace: item.namespace });
  },
  decline: async (item, reason, action) => {
    await post(`/sales/outbox/${enc(item.id)}/decline`, { version: item.version, snapshot: item.snapshot, namespace: item.namespace, reason, action });
  },
  conversations: (view, q = '') => get<ConversationList>(`/sales/conversations?view=${enc(view)}${q ? `&q=${enc(q)}` : ''}`),
  conversation: id => get<ConversationDetail>(`/sales/conversations/${enc(id)}`),
  setControl: async (id, control, reason) => { await post(`/sales/conversations/${enc(id)}/control`, { control, reason }); },
  ownerMessage: async (id, body) => { await post(`/sales/conversations/${enc(id)}/messages`, { body }); },
  addNote: async (id, body) => { await post(`/sales/conversations/${enc(id)}/notes`, { body }); },
  markSeen: async id => { await post(`/sales/conversations/${enc(id)}/seen`); },
  metrics: () => get<Metrics>('/sales/metrics'),
  bridge: () => get<BridgeStatus>('/sales/bridge'),
  whatsapp: () => get<WhatsAppLink>('/sales/whatsapp'),
  jobs: () => get<WorkJobs>('/work/jobs'),
  batches: () => get<WorkBatch[]>('/work/batches'),
  usage: () => get<Record<string, UsageTotal>>('/work/usage'),
  chat: id => get<ChatSnapshot>(`/conversations/${enc(id)}`),
  createChat: input => post<ChatConversation>('/conversations', { kind: 'private', ...input }),
  sendChat: async (id, content, agent_id) => {
    await post(`/conversations/${enc(id)}/messages`, agent_id ? { content, agent_id } : { content });
  },
  workflow: () => get<WorkflowState>('/v2/workflow'),
  proposeWorkflow: input => post<WorkflowProposal>('/v2/workflow/proposals', input),
  decideProposal: (id, action, reason) => post<WorkflowProposal>(`/v2/workflow/proposals/${enc(id)}/decision`, { action, reason: reason ?? '' }),
  markApplied: id => post<WorkflowProposal>(`/v2/workflow/proposals/${enc(id)}/applied`),
  simulateWorkflow: input => post<WorkflowSimulation>('/v2/workflow/simulate', input),
  revertWorkflow: (target, note) => post<WorkflowProposal>('/v2/workflow/revert', { target_version: target, note }),
  worker: () => get<WorkerSignal>('/v2/worker'),
  candra: () => get<CandraSession>('/v2/candra'),
  sendCandra: async content => { await post('/v2/candra/messages', { content }); },
  candraMediaUrl: (path, download = false) => `/api/v2/candra/media?path=${enc(path)}${download ? '&download=true' : ''}`,
  candraMediaText: async path => {
    const response = await fetch(`/api/v2/candra/media?path=${enc(path)}`, { credentials: 'same-origin' });
    if (!response.ok) throw new Error(response.status === 404 ? 'Lampiran tidak ditemukan di server.' : 'Lampiran tidak bisa dibuka.');
    return response.text();
  },
};
