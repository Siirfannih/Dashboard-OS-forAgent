// Demo data for the public repository. Every business, number and domain below is fictional
// (.test domains, 62000… numbers). Real data only ever arrives through the live API after login.
import type { DataSource } from './source';
import type {
  ChatSnapshot, Control, ConversationDetail, InboxView, ReviewItem, SalesConversation, SalesMessage, Study,
  CandraSession, WorkJob, WorkflowProposal, WorkflowState, WorkspaceState,
} from './types';

const now = () => Date.now() / 1000;
const H = 3600;
const iso = (secondsAgo: number) => new Date((now() - secondsAgo) * 1000).toISOString();
const wait = (ms = 220) => new Promise(resolve => setTimeout(resolve, ms));
const snap = (n: number) => n.toString(16).padStart(64, '0');

const businesses = [
  { id: 'c1', name: 'Klinik Estetika Lumina', domain: 'lumina-estetika.test', segment: 'Klinik estetika', city: 'Denpasar' },
  { id: 'c2', name: 'Rumah Senyum Dental', domain: 'rumahsenyum.test', segment: 'Klinik gigi', city: 'Sanur' },
  { id: 'c3', name: 'Villa Teratai', domain: 'villateratai.test', segment: 'Villa', city: 'Ubud' },
  { id: 'c4', name: 'Sanur Glow Aesthetic', domain: 'sanurglow.test', segment: 'Klinik estetika', city: 'Sanur' },
  { id: 'c5', name: 'Padma Dental Studio', domain: 'padmadental.test', segment: 'Klinik gigi', city: 'Renon' },
  { id: 'c6', name: 'Ubud Herbal Retreat', domain: 'ubudherbal.test', segment: 'Spa', city: 'Ubud' },
  { id: 'c7', name: 'Kuta Laser Skin', domain: 'kutalaser.test', segment: 'Klinik kulit', city: 'Kuta' },
];

function conv(i: number, over: Partial<SalesConversation>): SalesConversation {
  const b = businesses[i];
  return {
    id: `conv_${b.id}`, control: 'AUTO', mode: 'DRAFT_ONLY', stage: 'ELIGIBLE', hold_reason: null, followups: 0,
    updated_at: now() - (i + 1) * H, last_inbound_at: null, last_outbound_at: null, status: 'Open', priority: 'Medium',
    audience: 'prospect', contact_id: `ct_${b.id}`, name: b.name, prospect_ref: `P-${100 + i}`, phone: `6200000001${String(i).padStart(2, '0')}`,
    profile: { segmen: b.segment, kota: b.city }, domain: b.domain, account_id: `acc_${b.id}`, drafts: 0, queued: 0, unread: 0,
    last_sender: null, last_body: null, last_direction: null, last_at: null, tags: [], assignee: 'candra', ...over,
  };
}

let conversations: SalesConversation[] = [
  conv(0, { control: 'HOLD', hold_reason: 'Prospek menanyakan harga paket 2 cabang', stage: 'REPLIED', unread: 1, last_inbound_at: now() - 0.4 * H, last_outbound_at: now() - 20 * H, last_direction: 'in', last_body: 'Boleh. Sekalian, kira-kira biaya perbaikannya berapa? Kami punya 2 cabang.', last_at: now() - 0.4 * H, assignee: 'none', priority: 'High' }),
  conv(2, { control: 'HUMAN_CONTROLLED', stage: 'REPLIED', last_inbound_at: now() - 1.2 * H, last_direction: 'in', last_body: 'Bisa minta rincian paket untuk 3 properti?', last_at: now() - 1.2 * H, assignee: 'irfan' }),
  conv(1, { drafts: 1, last_direction: null, last_body: null }),
  conv(4, { drafts: 1 }),
  conv(3, { stage: 'SENT', last_outbound_at: now() - 26 * H, last_direction: 'out', last_body: 'Selamat pagi, boleh saya tanya bagaimana pasien biasanya booking?', last_at: now() - 26 * H }),
  conv(5, { control: 'DO_NOT_CONTACT', stage: 'REPLIED', last_inbound_at: now() - 50 * H, last_direction: 'in', last_body: 'Terima kasih, kami tidak tertarik.', last_at: now() - 50 * H, assignee: 'none', status: 'Closed' }),
  conv(6, { drafts: 1 }),
];

const study = (i: number, verdict: string, service: string, problem: string, evidence: string): Study => ({
  verdict, summary: `${businesses[i].segment} di ${businesses[i].city}. ${problem}`, target_service: service, version: 1, updated_at: now() - (5 + i) * H,
  content: {
    verdict, pendekatan: 'solusi',
    verifikasi: { nama_sesuai: 'Cocok dengan peta dan situs', masih_beroperasi: 'Ulasan terbaru 3 hari lalu', website: businesses[i].domain, kontak: 'Nomor WhatsApp tercantum di situs' },
    bisnis: { jenis: businesses[i].segment, layanan_utama: 'Perawatan wajah dan konsultasi', target_pelanggan: 'Pasien lokal dan wisatawan' },
    masalah: [{ status: 'terbukti', masalah: problem, bukti: evidence, sumber: `https://${businesses[i].domain}/booking` }],
    solusi: { layanan: service },
  },
});

const studies: Record<string, Study> = {
  conv_c1: study(0, 'contact', 'Perbaikan formulir booking', 'Formulir booking tidak mengirim konfirmasi.', 'Uji kirim formulir 10 Okt 05:12 — tidak ada halaman terima kasih, HTTP 500.'),
  conv_c2: study(1, 'contact', 'Landing page layanan', 'Halaman layanan utama mengembalikan 404.', 'Tautan "Perawatan Saluran Akar" di menu → HTTP 404, dicek 05:20.'),
  conv_c5: study(4, 'contact', 'Perbaikan SSL', 'Sertifikat SSL kedaluwarsa, browser menampilkan peringatan.', 'Sertifikat berakhir 2 Okt; diperiksa 05:31.'),
  conv_c7: study(6, 'contact', 'Booking WhatsApp', 'Tombol WhatsApp di situs mengarah ke nomor yang tidak aktif.', 'Tautan wa.me pada beranda memakai nomor berbeda dari peta; dicek 05:44.'),
};

let reviewItems: ReviewItem[] = [
  { i: 1, body: 'Selamat pagi, Bu. Saya dari tim Jadisatu.\n\nSaat membuka situs Rumah Senyum, tautan "Perawatan Saluran Akar" di menu mengarah ke halaman yang tidak ditemukan.\n\nBoleh saya tanya, pasien biasanya menemukan informasi layanan lewat situs atau langsung lewat WhatsApp?' },
  { i: 4, body: 'Selamat pagi. Saya dari tim Jadisatu.\n\nSaat membuka situs Padma Dental Studio, browser menampilkan peringatan keamanan karena sertifikat situs sudah berakhir.\n\nApakah ini sudah diketahui tim? Kalau berkenan, saya bisa kirim langkah singkat untuk memeriksanya.' },
  { i: 6, body: 'Selamat pagi. Saya dari tim Jadisatu.\n\nTombol WhatsApp di beranda Kuta Laser Skin memakai nomor yang berbeda dengan nomor di Google Maps.\n\nBoleh saya tanya, nomor mana yang sekarang dipakai untuk booking?' },
].map(({ i, body }, n) => {
  const b = businesses[i];
  const s = studies[`conv_${b.id}`];
  return {
    id: `ob_demo${n + 1}`, conversation_id: `conv_${b.id}`, actor: 'ai', kind: 'first', body, status: 'draft', approved: 0,
    version: n === 0 ? 2 : 1, sender_profile: n === 1 ? 'candra' : 'irfan', run_mode: 'review_only', created_at: now() - (14 - n * 3) * H,
    sent_at: null, error: null, namespace: 'pilot', snapshot: snap(n + 1), name: b.name, phone: `6200000001${String(i).padStart(2, '0')}`,
    prospect_ref: `P-${100 + i}`, control: 'AUTO', verdict: s.verdict, study_summary: s.summary, study_content: JSON.stringify(s.content),
    study_updated_at: s.updated_at, feedback_action: n === 0 ? 'revised' : null, feedback_reason: n === 0 ? 'Jangan sebut kerusakan di kalimat pertama.' : null,
  } satisfies ReviewItem;
});

const messages: Record<string, SalesMessage[]> = {
  conv_c1: [
    { id: 'm1', conversation_id: 'conv_c1', direction: 'out', actor: 'ai', body: 'Selamat pagi, Bu. Saya dari tim Jadisatu. Boleh saya tanya, pasien Lumina biasanya booking lewat WhatsApp atau lewat formulir di website?', at: now() - 22 * H, sender: 'Candra' },
    { id: 'm2', conversation_id: 'conv_c1', direction: 'in', actor: 'prospect', body: 'Pagi. Kebanyakan lewat WA, formulir jarang dipakai. Memangnya kenapa ya?', at: now() - 21 * H, sender: 'Admin Lumina' },
    { id: 'm3', conversation_id: 'conv_c1', direction: 'out', actor: 'ai', body: 'Kami melihat formulir booking di halaman layanan belum mengirim konfirmasi. Kalau berkenan, saya bisa kirim ringkasan singkat temuan kami untuk diteruskan ke pemilik.', at: now() - 20 * H, sender: 'Candra' },
    { id: 'm4', conversation_id: 'conv_c1', direction: 'in', actor: 'prospect', body: 'Boleh. Sekalian, kira-kira biaya perbaikannya berapa? Kami punya 2 cabang.', at: now() - 0.4 * H, sender: 'Admin Lumina' },
  ],
  conv_c3: [
    { id: 'm5', conversation_id: 'conv_c3', direction: 'out', actor: 'owner', body: 'Halo, terima kasih sudah membalas. Boleh saya tahu ada berapa properti yang dikelola?', at: now() - 3 * H, sender: 'Kamu' },
    { id: 'm6', conversation_id: 'conv_c3', direction: 'in', actor: 'prospect', body: 'Bisa minta rincian paket untuk 3 properti?', at: now() - 1.2 * H, sender: 'Reservasi Teratai' },
  ],
  conv_c4: [
    { id: 'm7', conversation_id: 'conv_c4', direction: 'out', actor: 'ai', body: 'Selamat pagi, boleh saya tanya bagaimana pasien biasanya booking?', at: now() - 26 * H, sender: 'Candra' },
  ],
  conv_c6: [
    { id: 'm8', conversation_id: 'conv_c6', direction: 'in', actor: 'prospect', body: 'Terima kasih, kami tidak tertarik.', at: now() - 50 * H, sender: 'Front office' },
  ],
};

const notes: Record<string, { id: string; body: string; at: number }[]> = {
  conv_c1: [{ id: 'n1', body: 'Harga multi-cabang belum ada di sumber yang disetujui. Draf jawaban disiapkan tanpa angka. — Candra', at: now() - 0.35 * H }],
};

const jobs: WorkJob[] = [
  ...['accepted', 'accepted', 'accepted', 'running', 'queued', 'queued', 'needs_revision', 'blocked', 'abandoned_unknown'].map((status, n) => ({
    id: `job_demo${n + 1}`, domain: 'sales', head_agent: 'candra', worker_role: 'research', status, attempt: status === 'needs_revision' ? 2 : 1,
    worker_id: ['queued'].includes(status) ? null : 'pc-research-1', lease_expiry: status === 'running' ? now() + 0.5 * H : null, revision: 1,
    error: status === 'blocked' ? 'Nomor di situs tidak cocok dengan nomor di peta' : status === 'abandoned_unknown' ? 'Hasil panggilan model tidak diketahui; tidak diulang otomatis' : null,
    payload: JSON.stringify({ batch_id: 'batch_demo14', prospect: businesses[n % businesses.length].name, task: n % 2 ? 'Verifikasi kontak' : 'Riset web & bukti' }),
    checkpoint: status === 'running' ? 'langkah 3 dari 5' : null, feedback: status === 'needs_revision' ? 'Ulangi hanya sumber nomor telepon.' : null,
    run_mode: 'review_only', created_at: now() - (12 - n) * H, updated_at: now() - (9 - n) * H * 0.5,
  })),
];

const chats: ChatSnapshot[] = [
  {
    id: 'chat_engineer', title: 'Cek kesehatan harian', agent_id: 'engineer', kind: 'private', created_at: iso(30 * H), updated_at: iso(6 * H), member_ids: null,
    messages: [
      { id: 'cm1', role: 'user', content: 'Tolong cek kenapa sesi WhatsApp terputus semalam.', agent_id: null, created_at: iso(7 * H) },
      { id: 'cm2', role: 'assistant', content: 'Sesi WhatsApp menunggu scan QR sejak 02:14. Bridge berjalan normal; tidak ada pesan yang hilang karena pengiriman sedang dijeda. Langkah berikutnya: pindai QR dari HP nomor pengirim di halaman Kanal.', agent_id: 'engineer', created_at: iso(6.9 * H) },
    ],
    runs: [{ id: 'run1', status: 'completed', agent_id: 'engineer', created_at: iso(7 * H) }],
  },
  {
    id: 'chat_room_ops', title: 'Operasi harian', agent_id: 'engineer', kind: 'room', created_at: iso(80 * H), updated_at: iso(26 * H), member_ids: ['engineer', 'manda'],
    messages: [
      { id: 'cr1', role: 'user', content: '@engineer tolong pastikan backup harian berjalan.', agent_id: 'engineer', created_at: iso(27 * H) },
      { id: 'cr2', role: 'assistant', content: 'Backup harian terakhir selesai pukul 03:15 dan bisa dipulihkan. Tidak ada tindakan yang dibutuhkan.', agent_id: 'engineer', created_at: iso(26 * H) },
    ],
    runs: [{ id: 'run2', status: 'completed', agent_id: 'engineer', created_at: iso(27 * H) }],
  },
];

const workflowState: WorkflowState = {
  version: 7,
  overrides: {},
  proposals: [
    { id: 'wp_demo1', base_version: 6, status: 'applied', applied_at: now() - 30 * H, note: 'Batas batch diturunkan selama pilot.', created_at: now() - 50 * H, decided_at: now() - 49 * H,
      changes: [{ node_id: 'research', field: 'limit.batch', from: '25 prospek', to: '20 prospek' }], task_conversation_id: 'chat_engineer' },
  ],
};

const candraSession: CandraSession = {
  available: true, reason: null, detail: null, session_id: 'demo-telegram-dm',
  turn: { running: false, started_at: null, error: null, finished_at: null },
  messages: [
    { id: 'cd1', role: 'user', content: 'Candra, berapa draf yang siap aku tinjau pagi ini?', created_at: now() - 3 * H, source: 'telegram' },
    { id: 'cd2', role: 'assistant', content: 'Ada **3 draf** yang siap: Rumah Senyum Dental, Padma Dental Studio, dan Kuta Laser Skin. Semuanya masih mode uji, jadi tidak ada yang terkirim walau disetujui.', created_at: now() - 2.9 * H, source: 'telegram' },
  ],
};

const workspaceState = (): WorkspaceState => ({
  user: { name: 'Pemilik' },
  agents: [
    { id: 'engineer', name: 'Angga', role: 'Teknisi', status: 'ready', description: 'Memeriksa sistem dan menyiapkan perbaikan.' },
    { id: 'manda', name: 'Manda', role: 'Penulis naskah', status: 'history_only', description: 'Bekerja lewat Telegram; riwayat tersedia di sini.' },
    { id: 'strategist', name: 'Content Strategist', role: 'Strategi', status: 'planned' },
  ],
  conversations: chats.map(({ messages: _m, runs: _r, ...c }) => c),
  activity: [
    { id: 'a1', type: 'run', title: 'Worker Riset menyelesaikan 18 riset', detail: 'Batch 14', created_at: iso(2.2 * H) },
    { id: 'a2', type: 'approval', title: 'Candra menilai 18 hasil, 3 jadi draf', detail: 'Rata-rata bukti 7 jam', created_at: iso(0.7 * H) },
    { id: 'a3', type: 'failure', title: 'Validator menolak 4 hasil: bukti lebih dari 24 jam', created_at: iso(2 * H) },
    { id: 'a4', type: 'run', title: 'Angga memeriksa sesi WhatsApp', detail: 'Menunggu scan QR', created_at: iso(6.9 * H) },
  ],
  integrations: [],
  system: { hostname: 'server-utama', memory: { total_mb: 3913, available_mb: 2180 }, disk: { total_gb: 48, free_gb: 14 }, worker: { status: 'unknown', label: 'Belum ada sinyal dari PC Worker', last_seen: null }, runtime: { model: 'Terkonfigurasi per agent', engine: 'Hermes' } },
});

const viewFilter: Record<InboxView, (c: SalesConversation) => boolean> = {
  all: c => c.control !== 'DO_NOT_CONTACT' && !['Resolved', 'Closed'].includes(c.status),
  prospects: c => c.audience === 'prospect' && c.control !== 'DO_NOT_CONTACT',
  others: c => c.audience === 'observed',
  groups: c => c.audience === 'group',
  candra: c => c.control === 'AUTO' && c.audience === 'prospect',
  unassigned: c => c.assignee === 'none' && c.control !== 'DO_NOT_CONTACT',
  needs_reply: c => c.control !== 'DO_NOT_CONTACT' && !!c.last_inbound_at && c.last_inbound_at >= (c.last_outbound_at ?? 0),
  hold: c => c.control === 'HOLD',
  drafts: c => c.drafts > 0,
  human: c => c.control === 'HUMAN_CONTROLLED',
  unread: c => c.unread > 0,
  snoozed: c => c.status === 'Snoozed',
  resolved: c => ['Resolved', 'Closed'].includes(c.status),
  dnc: c => c.control === 'DO_NOT_CONTACT',
};

export const demoSource: DataSource = {
  kind: 'demo',
  auth: async () => ({ authenticated: true, user: { name: 'Pemilik' } }),
  login: async () => undefined,
  logout: async () => undefined,
  state: async () => { await wait(); return workspaceState(); },
  review: async () => { await wait(); return reviewItems.filter(item => ['draft', 'needs_revision', 'queued', 'telegram_approved'].includes(item.status)); },
  reviewPolicy: async () => ({ owner_approval: 'all_ai', approval_expires_hours: 48, pitch_evidence_hours: 24, autonomous_replies: false, pilot_outbound: false }),
  approve: async item => {
    await wait(400);
    reviewItems = reviewItems.map(r => (r.id === item.id ? { ...r, status: 'queued', approved: 1 } : r));
    conversations = conversations.map(c => (c.id === item.conversation_id ? { ...c, drafts: 0, queued: 1, stage: 'DRAFT_APPROVED' } : c));
  },
  decline: async (item, _reason, action) => {
    await wait(400);
    reviewItems = reviewItems.map(r => (r.id === item.id ? { ...r, status: action === 'revise' ? 'needs_revision' : 'cancelled' } : r));
    if (action === 'hold') conversations = conversations.map(c => (c.id === item.conversation_id ? { ...c, control: 'HOLD', drafts: 0 } : c));
  },
  conversations: async (view, q = '') => {
    await wait();
    const needle = q.trim().toLowerCase();
    const counts = Object.fromEntries((Object.keys(viewFilter) as InboxView[]).map(v => [v, conversations.filter(viewFilter[v]).length]));
    const items = conversations.filter(viewFilter[view]).filter(c => !needle || `${c.name} ${c.domain}`.toLowerCase().includes(needle));
    return { items, counts };
  },
  conversation: async id => {
    await wait();
    const c = conversations.find(x => x.id === id);
    if (!c) throw new Error('Percakapan tidak ditemukan');
    const detail: ConversationDetail = {
      conversation: c, messages: messages[id] ?? [], notes: notes[id] ?? [], study: studies[id] ?? null, previous: [],
      outbox: reviewItems.filter(r => r.conversation_id === id),
      events: [
        { id: 1, actor: 'research', event_type: 'STUDY_SAVED', evidence: 'Riset & bukti tersimpan', at: c.updated_at - 6 * H },
        { id: 2, actor: 'candra', event_type: 'ELIGIBLE', evidence: 'Lolos checklist kelayakan', at: c.updated_at - 5 * H },
        ...(c.control === 'HOLD' ? [{ id: 3, actor: 'candra', event_type: 'HOLD', evidence: c.hold_reason, at: (c.last_inbound_at ?? now()) + 30 }] : []),
      ],
    };
    return detail;
  },
  setControl: async (id, control: Control) => {
    await wait(300);
    conversations = conversations.map(c => (c.id === id ? { ...c, control, assignee: control === 'HUMAN_CONTROLLED' ? 'irfan' : control === 'AUTO' ? 'candra' : 'none', hold_reason: control === 'HOLD' ? c.hold_reason ?? 'Ditahan pemilik' : null } : c));
  },
  ownerMessage: async (id, body) => {
    await wait(300);
    (messages[id] ??= []).push({ id: `m${Date.now()}`, conversation_id: id, direction: 'out', actor: 'owner', body, at: now(), sender: 'Kamu' });
  },
  addNote: async (id, body) => { await wait(200); (notes[id] ??= []).push({ id: `n${Date.now()}`, body, at: now() }); },
  markSeen: async id => { conversations = conversations.map(c => (c.id === id ? { ...c, unread: 0 } : c)); },
  metrics: async () => ({
    reply_rate: { numerator: 2, denominator: 4, value: 0.5 }, demo_request_rate: { numerator: 1, denominator: 2, value: 0.5 },
    owner_reach_rate: { numerator: 0, denominator: 2, value: 0 }, paid_win_rate: { numerator: 0, denominator: 4, value: 0 },
    control: { AUTO: 4, HOLD: 1, HUMAN_CONTROLLED: 1, DO_NOT_CONTACT: 1 }, stages: { ELIGIBLE: 3, SENT: 1, REPLIED: 3 },
  }),
  bridge: async () => ({ configured: true, paused: true, drafting: true, candra_online: true, dropped_inbound: 0, last_error: null, last_tick_at: now() - 40, health: { status: 'disconnected' } }),
  // Fictional pairing string: renders a QR for preview, pairs with nothing.
  whatsapp: async () => ({ state: 'waiting_qr', qr: '2@DEMO-ONLY-not-a-real-pairing-code,jadisatu-workspace-demo,AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA=,BBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBB=,1', account: null, updated_at: now() - 20 }),
  jobs: async () => { await wait(); return { items: jobs }; },
  batches: async () => [{ id: 'batch_demo14', cap_usd: 2, max_items: 25, domain: 'sales', head_agent: 'candra', created_at: now() - 12 * H, items: jobs.length, known_cost_usd: 0.84, reserved_usd: 0.12, remaining_usd: 1.04 }],
  usage: async () => ({
    deepseek: { calls: 64, input_tokens: 412_000, output_tokens: 58_000, cost_usd: 0.84, unknown_cost_calls: 0 },
    chatgpt: { calls: 31, input_tokens: null, output_tokens: null, cost_usd: null, unknown_cost_calls: 31 },
  }),
  chat: async id => {
    await wait();
    const c = chats.find(x => x.id === id);
    if (!c) throw new Error('Percakapan tidak ditemukan');
    return structuredClone(c);
  },
  createChat: async input => {
    await wait(300);
    const created: ChatSnapshot = { id: `chat_${Date.now()}`, title: input.title, agent_id: input.agent_id, kind: input.kind ?? 'private', member_ids: input.member_ids ?? null, created_at: iso(0), updated_at: iso(0), messages: [], runs: [] };
    chats.unshift(created);
    const { messages: _m, runs: _r, ...meta } = created;
    return meta;
  },
  sendChat: async (id, content) => {
    await wait(300);
    const c = chats.find(x => x.id === id);
    if (!c) return;
    c.messages.push({ id: `cm${Date.now()}`, role: 'user', content, agent_id: null, created_at: iso(0) });
    const runId = `run${Date.now()}`;
    c.runs.push({ id: runId, status: 'running', agent_id: c.agent_id, created_at: iso(0) });
    setTimeout(() => {
      c.messages.push({ id: `cm${Date.now()}`, role: 'assistant', content: 'Ini mode demo — di workspace asli, agent membalas lewat Hermes. Pesanmu tercatat.', agent_id: c.agent_id, created_at: iso(0) });
      c.runs = c.runs.map(r => (r.id === runId ? { ...r, status: 'completed' } : r));
    }, 1600);
  },
  workflow: async () => { await wait(); return structuredClone(workflowState); },
  proposeWorkflow: async input => {
    await wait(400);
    if (input.base_version !== workflowState.version) throw new Error('Alur sudah berubah. Muat ulang lalu ulangi perubahanmu.');
    const proposal: WorkflowProposal = { id: `wp_${Date.now()}`, status: 'pending', created_at: now(), ...input };
    workflowState.proposals.unshift(proposal);
    return proposal;
  },
  decideProposal: async (id, action) => {
    await wait(400);
    const proposal = workflowState.proposals.find(p => p.id === id);
    if (!proposal) throw new Error('Proposal tidak ditemukan');
    if (proposal.status !== 'pending') throw new Error('Proposal ini sudah diputuskan');
    proposal.decided_at = now();
    if (action === 'reject') proposal.status = 'rejected';
    else {
      if (workflowState.proposals.some(p => p.status === 'dispatched')) throw new Error('Masih ada perubahan yang menunggu diterapkan Angga. Selesaikan itu dulu.');
      proposal.status = 'dispatched';
      proposal.task_conversation_id = 'chat_engineer';
    }
    return structuredClone(proposal);
  },
  candra: async () => { await wait(); return structuredClone(candraSession); },
  sendCandra: async content => {
    await wait(300);
    if (candraSession.turn.running) throw new Error('Candra masih membalas pesan sebelumnya.');
    candraSession.messages.push({ id: `cw${Date.now()}`, role: 'user', content, created_at: now(), source: 'web' });
    candraSession.turn = { running: true, started_at: now(), error: null, finished_at: null };
    setTimeout(() => {
      candraSession.messages.push({ id: `cr${Date.now()}`, role: 'assistant', content: 'Ini mode demo. Di workspace asli, Candra membalas di sesi yang sama dengan Telegram, jadi percakapan ini juga ia ingat saat kamu lanjut dari HP.', created_at: now(), source: 'web' });
      candraSession.turn = { running: false, started_at: candraSession.turn.started_at, error: null, finished_at: now() };
    }, 1800);
  },
  worker: async () => ({ last_activity_at: now() - 5 * H, by_status: { accepted: 3, running: 1, queued: 2, needs_revision: 1, blocked: 1, abandoned_unknown: 1 }, identities: 1 }),
  markApplied: async id => {
    await wait(300);
    const proposal = workflowState.proposals.find(p => p.id === id);
    if (!proposal || proposal.status !== 'dispatched') throw new Error('Hanya proposal yang sudah dikirim ke Angga yang bisa ditandai diterapkan');
    for (const ch of proposal.changes) workflowState.overrides[`${ch.node_id}.${ch.field}`] = ch.to;
    workflowState.version += 1;
    proposal.status = 'applied';
    proposal.applied_at = now();
    return structuredClone(proposal);
  },
};
