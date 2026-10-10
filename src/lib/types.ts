// Shapes returned by the Hermes workspace API (FastAPI, /api/*).
// Timestamps from the sales and work APIs are epoch seconds (float);
// workspace chat timestamps are ISO strings.

export type Control = 'AUTO' | 'HOLD' | 'HUMAN_CONTROLLED' | 'DO_NOT_CONTACT';
export type Mode = 'DRAFT_ONLY' | 'AUTO_REPLY';
export const FUNNEL = [
  'ELIGIBLE', 'DRAFT_APPROVED', 'SENT', 'DELIVERED', 'REPLIED', 'DEMO_REQUESTED',
  'DEMO_SENT', 'OWNER_CONFIRMED', 'MEETING_CONFIRMED', 'TRIAL_AGREED', 'PAID',
] as const;
export type Stage = (typeof FUNNEL)[number];
export type Audience = 'prospect' | 'observed' | 'group';
export type InboxView =
  | 'all' | 'prospects' | 'others' | 'groups' | 'candra' | 'unassigned' | 'needs_reply'
  | 'hold' | 'drafts' | 'human' | 'unread' | 'snoozed' | 'resolved' | 'dnc';

export interface SalesConversation {
  id: string;
  control: Control;
  mode: Mode;
  stage: Stage;
  hold_reason: string | null;
  followups: number;
  updated_at: number;
  last_inbound_at: number | null;
  last_outbound_at: number | null;
  status: 'Open' | 'Snoozed' | 'Resolved' | 'Closed';
  priority: 'Low' | 'Medium' | 'High' | 'Urgent';
  audience: Audience;
  contact_id: string;
  name: string;
  prospect_ref: string | null;
  phone: string | null;
  profile: Record<string, unknown> | string | null;
  domain: string | null;
  account_id: string;
  drafts: number;
  queued: number;
  unread: number;
  last_sender: string | null;
  last_body: string | null;
  last_direction: 'in' | 'out' | null;
  last_at: number | null;
  tags: string[];
  assignee: 'candra' | 'irfan' | 'none';
}

export interface ConversationList {
  items: SalesConversation[];
  counts: Partial<Record<InboxView, number>>;
}

export interface SalesMessage {
  id: string;
  conversation_id: string;
  direction: 'in' | 'out';
  actor: 'prospect' | 'owner' | 'ai' | 'system' | string;
  body: string;
  at: number;
  sender: string | null;
}

export interface SalesEvent {
  id: number;
  actor: string;
  event_type: string;
  evidence: string | null;
  at: number;
  at_wita?: string;
}

export interface OutboxItem {
  id: string;
  conversation_id: string;
  actor: 'ai' | 'owner' | string;
  kind: 'first' | 'followup' | 'reply' | string;
  body: string;
  status: string;
  approved: number;
  version: number;
  sender_profile: string;
  run_mode: 'production' | 'review_only' | string;
  created_at: number;
  sent_at: number | null;
  error: string | null;
}

export interface StudyProblem {
  status: string;
  masalah: string;
  bukti: string;
  sumber?: string;
  penjelasan_lain?: string;
  pembatal?: string;
}

export interface StudyContent {
  verdict?: string;
  pendekatan?: string;
  verifikasi?: Record<string, string>;
  bisnis?: Record<string, string>;
  masalah?: StudyProblem[];
  solusi?: { layanan?: string; [k: string]: unknown };
  [k: string]: unknown;
}

export interface Study {
  verdict: 'contact' | 'hold' | 'skip' | string;
  summary: string | null;
  target_service: string | null;
  content: StudyContent;
  version: number;
  updated_at: number;
}

export interface ConversationDetail {
  conversation: SalesConversation;
  messages: SalesMessage[];
  outbox: OutboxItem[];
  notes: { id: string; body: string; at: number }[];
  events: SalesEvent[];
  study: Study | null;
  previous: { id: string; status: string; stage: Stage; updated_at: number }[];
}

export interface ReviewItem extends OutboxItem {
  namespace: 'sales' | 'pilot';
  snapshot: string;
  name: string;
  phone: string | null;
  prospect_ref: string | null;
  control: Control;
  verdict: string | null;
  study_summary: string | null;
  study_content: string | null;
  study_updated_at: number | null;
  feedback_action: string | null;
  feedback_reason: string | null;
}

export interface ReviewPolicy {
  owner_approval: string;
  approval_expires_hours: number;
  pitch_evidence_hours: number;
  autonomous_replies: boolean;
  pilot_outbound: boolean;
}

export interface Ratio { numerator: number; denominator: number; value: number | null }
export interface Metrics {
  reply_rate: Ratio;
  demo_request_rate: Ratio;
  owner_reach_rate: Ratio;
  paid_win_rate: Ratio;
  control: Partial<Record<Control, number>>;
  stages: Partial<Record<Stage, number>>;
}

export interface BridgeStatus {
  configured: boolean;
  paused: boolean;
  drafting: boolean;
  candra_online: boolean;
  dropped_inbound: number;
  last_error?: string | null;
  last_tick_at?: number | null;
  health?: { status?: string; error?: string; [k: string]: unknown };
}

export type WaState = 'starting' | 'waiting_qr' | 'connected' | 'disconnected' | 'logged_out' | 'error' | 'not_running';
export interface WhatsAppLink { state: WaState; qr: string | null; account: string | null; updated_at: number | null }

export interface WorkJob {
  id: string;
  domain: string;
  head_agent: string;
  worker_role: string;
  status: string;
  attempt: number;
  worker_id: string | null;
  lease_expiry: number | null;
  revision: number;
  error: string | null;
  payload: string | Record<string, unknown> | null;
  checkpoint: string | null;
  feedback: string | null;
  run_mode: string;
  created_at: number;
  updated_at: number;
}

export interface WorkJobs { items: WorkJob[]; head_status?: unknown }

export interface WorkBatch {
  id: string;
  cap_usd: number;
  max_items: number;
  domain: string;
  head_agent: string;
  created_at: number;
  items: number;
  known_cost_usd: number;
  reserved_usd: number;
  remaining_usd: number;
}

export interface UsageTotal {
  calls: number;
  input_tokens: number | null;
  output_tokens: number | null;
  cost_usd: number | null;
  unknown_cost_calls: number;
}

export interface WorkspaceAgent {
  id: string;
  name: string;
  role: string;
  color?: string;
  status: 'ready' | 'planned' | 'history_only';
  description?: string;
  history_only?: boolean;
}

export interface ChatConversation {
  id: string;
  title: string;
  agent_id: string;
  kind: 'private' | 'room';
  member_ids?: string[] | null;
  created_at: string;
  updated_at: string;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system' | string;
  content: string;
  agent_id: string | null;
  created_at: string;
}

export interface ChatRun { id: string; status: string; agent_id: string; error?: string | null; created_at?: string; updated_at?: string }

export interface ChatSnapshot extends ChatConversation {
  messages: ChatMessage[];
  runs: ChatRun[];
}

export interface ActivityItem { id: string; type: string; title: string; detail?: string; created_at: string }
export interface Integration { id: string; name: string; status: string; description?: string }

export interface SystemStatus {
  hostname?: string;
  memory?: { total_mb: number | null; available_mb: number | null };
  disk?: { total_gb: number | null; free_gb: number | null };
  worker?: { status: string; label: string; last_seen: number | null };
  runtime?: { model?: string; engine?: string };
  queue?: { queued?: number; running?: number };
}

export interface WorkspaceState {
  user: { name?: string } | null;
  agents: WorkspaceAgent[];
  conversations: ChatConversation[];
  activity: ActivityItem[];
  integrations: Integration[];
  system?: SystemStatus;
}

/* ---------- Alur Kerja (workflow) ---------- */

export type NodeType = 'trigger' | 'auto' | 'human' | 'gate' | 'guard' | 'decision' | 'end';

export interface FlowNode {
  id: string;
  n: string;
  title: string;
  type: NodeType;
  /** Roster id of who executes the step. */
  executor: string;
  description: string;
  /** Where it runs; editable when hostOptions is set. */
  host?: string;
  hostOptions?: { value: string; label: string; available: boolean; note?: string }[];
  limits?: { key: string; label: string; value: string; editable?: boolean }[];
  allow?: string[];
  deny?: string[];
  locked?: boolean;
  x: number;
  y: number;
}

export interface FlowEdge { from: string; to: string; label?: string; dashed?: boolean }

export interface WorkflowChange { node_id: string; field: string; from: string; to: string }

export interface WorkflowProposal {
  id: string;
  base_version: number;
  status: 'pending' | 'approved' | 'rejected' | 'dispatched' | 'applied';
  changes: WorkflowChange[];
  note: string;
  created_at: number;
  decided_at?: number | null;
  /** Workspace conversation id where the Engineer received the task. */
  task_conversation_id?: string | null;
  applied_at?: number | null;
}

export interface WorkerSignal { last_activity_at: number | null; by_status: Record<string, number>; identities: number }

export interface WorkflowState {
  version: number;
  /** Applied overrides by `${node_id}.${field}`. */
  overrides: Record<string, string>;
  proposals: WorkflowProposal[];
}
