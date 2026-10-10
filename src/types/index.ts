export type ActorType = 'irfan' | 'candra' | 'worker-pc' | 'angga' | 'system' | 'prospect';

export type LeadLabel = 'HOT' | 'WARM' | 'WARM_REFERRAL' | 'COOL' | 'NURTURE' | 'REJECTED';

export type StatusVariant = 
  | 'green'   // accepted, healthy, fresh (<24h)
  | 'amber'   // needs decision, expiring, <6h
  | 'red'     // blocked, failed, paused, stale, DNC
  | 'purple'  // agent working, claimed, running
  | 'blue'    // queued, test mode, review_only
  | 'gray'    // inactive, cancelled
  | 'unknown';// provider did not send (striped)

export interface ActorInfo {
  id: ActorType;
  name: string;
  role: string;
  color: string;
}

export interface FactItem {
  claim: string;
  sourceDomain: string;
  url?: string;
  capturedAt: string;
  ageHours: number;
}

export interface HypothesisItem {
  claim: string;
  counterEvidence: string;
  uncertainty: string;
}

export interface VersionHistoryItem {
  version: string;
  author: string;
  timestamp: string;
  summary: string;
}

export interface DecisionItem {
  id: string;
  businessName: string;
  segment: string;
  location: string;
  phoneMasked: string;
  version: string;
  versionHash: string;
  isTestMode: boolean; // review_only mode
  senderProfile: 'Profil Irfan' | 'Profil Candra';
  leadLabel: LeadLabel;
  evidenceAgeHours: number;
  expiresInHours: number;
  status: 'menunggu' | 'ditunda' | 'disetujui' | 'ditolak';
  
  // Checklist
  checklist: {
    identityMatchedGoogleMaps: boolean;
    phoneMatchedWebsite: boolean;
    notDncOrTakeover: boolean;
    notDuplicate: boolean;
    evidenceFreshEnough: boolean; // <24h
  };

  // Strategy
  strategy: {
    playbook: string;
    targetService: string;
    rationale: string;
  };

  // WhatsApp 3 outgoing bubbles
  whatsappBubbles: string[];

  // Proofs
  facts: FactItem[];
  hypotheses: HypothesisItem[];
  researchCostRp: number;
  toolCallsCount: number;
  retryCount: number;
  versionHistory: VersionHistoryItem[];
}

export interface PipelineCard {
  id: string;
  businessName: string;
  taskType: 'Verifikasi identitas' | 'Riset web & booking' | 'Analisis penawaran' | 'Validasi kontak';
  worker: string;
  attempt: string; // '1/2'
  leaseExpiry: string; // '06:10'
  checkpoint: string; // '3/5'
  costRp: number;
  status: 'antre' | 'diklaim' | 'berjalan' | 'dikirim' | 'diterima' | 'revisi' | 'terblokir' | 'gagal';
  blockedReason?: string;
  nextStepOwner?: 'Candra' | 'Angga' | 'Irfan';
  revisionData?: {
    revisionNum: string;
    candraFeedbackDelta: string;
    validationErrors: string[];
    history: { time: string; event: string; actor: ActorType }[];
  };
}

export interface ChatMessage {
  id: string;
  sender: 'prospect' | 'system' | 'candra' | 'irfan';
  text: string;
  timestamp: string;
  dateGroup?: string; // e.g. '2 Sep 2026' or '3 Sep 2026'
  senderName?: string; // e.g. 'Theo Martin' or 'Demo User'
  avatarUrl?: string;
  isNote?: boolean;
  composedBy?: 'Candra' | 'Irfan';
  approvedBy?: 'Irfan';
}

export interface ConversationItem {
  id: string;
  businessName: string;
  segment: string;
  phoneMasked: string;
  email?: string;
  avatarUrl?: string;
  country?: string;
  subject?: string;
  referenceNumber?: string;
  initiatedAt?: string;
  firstReplyAt?: string;
  tags?: string[];
  assignedAgent?: string;
  supportTier?: string;
  priority?: 'Low' | 'Medium' | 'High';
  inboxChannel?: string;
  daysAgoText?: string;
  statusPillText?: string;
  senderProfile: 'Profil Irfan' | 'Profil Candra';
  leadLabel: LeadLabel;
  tab: 'butuh_kamu' | 'candra_menangani' | 'menunggu_balasan' | 'selesai';
  escalationStatus?: 'Eskalasi: harga' | 'Kamu ambil alih' | 'Menunggu respon';
  lastMessageSnippet: string;
  lastMessageTime: string;
  isDnc: boolean;
  isTakenOver: boolean;
  unreadCount?: number;
  messages: ChatMessage[];
  timeline: {
    actor: ActorType;
    title: string;
    desc: string;
    time: string;
  }[];
}

export interface AgentService {
  name: string;
  status: 'green' | 'amber' | 'red';
  statusLabel: string;
  since: string;
  note: string;
}

export interface AgentNode {
  id: string;
  name: string;
  role: string;
  platform: string;
  model: string;
  statusLabel: string;
  statusVariant: StatusVariant;
  heartbeat: string;
  tasksToday: number;
  reworkRate: string;
  costRp: string;
  quotaLabel?: string;
  quotaUnknown?: boolean;
  allowed: string[];
  disallowed: string[];
  recentActions: {
    time: string;
    action: string;
  }[];
}
