// Demo for the public repository and for prospective template buyers: a business where the
// system has been running smoothly for a few weeks. Every business, person, number and domain
// below is fictional (.test domains, 62000… numbers). Real data only arrives through the live
// API after the owner logs in.
import type { DataSource } from './source';
import type {
  CandraSession, ChatSnapshot, Control, ConversationDetail, InboxView, ReviewItem, SalesConversation, SalesEvent,
  SalesMessage, Stage, Study, WorkJob, WorkflowProposal, WorkflowSimulation, WorkflowState, WorkspaceState,
} from './types';

const now = () => Date.now() / 1000;
const H = 3600;
const D = 24 * H;
const iso = (secondsAgo: number) => new Date((now() - secondsAgo) * 1000).toISOString();
const wait = (ms = 220) => new Promise(resolve => setTimeout(resolve, ms));
const snap = (n: number) => n.toString(16).padStart(64, '0');

/** Seconds since the most recent 05:40 WITA (UTC+8), when overnight research ends. */
function sinceResearchEnd(): number {
  const local = new Date(Date.now() + 8 * H * 1000);
  const minutes = local.getUTCHours() * 60 + local.getUTCMinutes();
  return ((minutes - (5 * 60 + 40) + 1440) % 1440) * 60;
}

/* ---------- Businesses ---------- */

interface Biz { key: string; name: string; domain: string; segment: string; city: string }
const biz: Biz[] = [
  { key: 'lumina', name: 'Klinik Estetika Lumina', domain: 'lumina-estetika.test', segment: 'Klinik estetika', city: 'Denpasar' },
  { key: 'teratai', name: 'Villa Teratai', domain: 'villateratai.test', segment: 'Villa', city: 'Ubud' },
  { key: 'senyum', name: 'Rumah Senyum Dental', domain: 'rumahsenyum.test', segment: 'Klinik gigi', city: 'Sanur' },
  { key: 'padma', name: 'Padma Dental Studio', domain: 'padmadental.test', segment: 'Klinik gigi', city: 'Renon' },
  { key: 'kutalaser', name: 'Kuta Laser Skin', domain: 'kutalaser.test', segment: 'Klinik kulit', city: 'Kuta' },
  { key: 'canggu', name: 'Canggu Physio Hub', domain: 'canggu-physio.test', segment: 'Fisioterapi', city: 'Canggu' },
  { key: 'jimbaran', name: 'Jimbaran Wellness', domain: 'jimbaran-wellness.test', segment: 'Spa', city: 'Jimbaran' },
  { key: 'lotus', name: 'Lotus Skin Clinic', domain: 'lotusskin.test', segment: 'Klinik kulit', city: 'Seminyak' },
  { key: 'senyumkita', name: 'Senyum Kita Dental', domain: 'senyumkita.test', segment: 'Klinik gigi', city: 'Denpasar' },
  { key: 'ubudherbal', name: 'Ubud Herbal Retreat', domain: 'ubudherbal.test', segment: 'Spa', city: 'Ubud' },
  { key: 'nusadua', name: 'Nusa Dua Kids Clinic', domain: 'nusadua-kids.test', segment: 'Klinik anak', city: 'Nusa Dua' },
  { key: 'sanurglow', name: 'Sanur Glow Aesthetic', domain: 'sanurglow.test', segment: 'Klinik estetika', city: 'Sanur' },
  { key: 'tabanan', name: 'Tabanan Eye Care', domain: 'tabanan-eye.test', segment: 'Klinik mata', city: 'Tabanan' },
  { key: 'renonvet', name: 'Renon Vet Center', domain: 'renonvet.test', segment: 'Klinik hewan', city: 'Renon' },
];
const B = Object.fromEntries(biz.map((b, i) => [b.key, { ...b, i }])) as Record<string, Biz & { i: number }>;
const phone = (i: number) => `6200000001${String(i).padStart(2, '0')}`;

function conv(key: string, over: Partial<SalesConversation>): SalesConversation {
  const b = B[key];
  return {
    id: `conv_${key}`, control: 'AUTO', mode: 'DRAFT_ONLY', stage: 'ELIGIBLE', hold_reason: null, followups: 0,
    updated_at: now() - 2 * H, last_inbound_at: null, last_outbound_at: null, status: 'Open', priority: 'Medium',
    audience: 'prospect', contact_id: `ct_${key}`, name: b.name, prospect_ref: `P-${120 + b.i}`, phone: phone(b.i),
    profile: { segmen: b.segment, kota: b.city }, domain: b.domain, account_id: `acc_${key}`, drafts: 0, queued: 0, unread: 0,
    last_sender: null, last_body: null, last_direction: null, last_at: null, tags: [], assignee: 'candra', ...over,
  };
}

/* ---------- Messages (one realistic thread per funnel stage) ---------- */

const msg = (cid: string, n: number, direction: 'in' | 'out', actor: string, body: string, ago: number, sender: string): SalesMessage =>
  ({ id: `${cid}_m${n}`, conversation_id: `conv_${cid}`, direction, actor, body, at: now() - ago, sender });

const messages: Record<string, SalesMessage[]> = {
  conv_lumina: [
    msg('lumina', 1, 'out', 'ai', 'Selamat pagi, Bu. Saya dari tim Jadisatu. Boleh saya tanya, pasien Lumina biasanya booking lewat WhatsApp atau lewat formulir di website?', 2 * D, 'Candra'),
    msg('lumina', 2, 'in', 'prospect', 'Pagi. Kebanyakan lewat WA, formulir jarang dipakai. Memangnya kenapa ya?', 2 * D - 3 * H, 'Admin Lumina'),
    msg('lumina', 3, 'out', 'ai', 'Kami melihat formulir booking di halaman layanan belum mengirim konfirmasi ke pasien. Kalau berkenan, saya kirim ringkasan singkat temuan kami untuk diteruskan ke pemilik.', 2 * D - 2.5 * H, 'Candra'),
    msg('lumina', 4, 'in', 'prospect', 'Boleh. Sekalian, kira-kira biaya perbaikannya berapa? Kami punya 2 cabang.', 0.6 * H, 'Admin Lumina'),
  ],
  conv_teratai: [
    msg('teratai', 1, 'out', 'ai', 'Selamat siang. Saya dari tim Jadisatu. Halaman reservasi Villa Teratai belum menampilkan ketersediaan kamar. Apakah tamu biasanya bertanya lewat WhatsApp dulu?', 3 * D, 'Candra'),
    msg('teratai', 2, 'in', 'prospect', 'Iya betul, hampir semua tanya lewat WA dulu.', 3 * D - 5 * H, 'Reservasi Teratai'),
    msg('teratai', 3, 'out', 'owner', 'Terima kasih. Boleh saya tahu ada berapa properti yang dikelola?', 26 * H, 'Kamu'),
    msg('teratai', 4, 'in', 'prospect', 'Ada 3 villa. Bisa minta rincian paket untuk 3 properti?', 1.4 * H, 'Reservasi Teratai'),
  ],
  conv_canggu: [
    msg('canggu', 1, 'out', 'ai', 'Selamat pagi. Saya dari tim Jadisatu. Jadwal terapi di situs Canggu Physio Hub masih menampilkan jam bulan lalu. Apakah pasien sering menanyakan ulang jadwalnya?', 4 * D, 'Candra'),
    msg('canggu', 2, 'in', 'prospect', 'Sering sekali. Ada contoh tampilannya kalau diperbaiki?', 3 * D, 'Admin Physio'),
    msg('canggu', 3, 'out', 'ai', 'Tentu. Ini contoh halaman jadwal yang bisa diperbarui sendiri oleh admin: demo.canggu-physio.test. Kalau cocok, saya bisa jadwalkan obrolan singkat dengan pemilik.', 2 * D, 'Candra'),
    msg('canggu', 4, 'in', 'prospect', 'Bagus. Pemilik kami mau ngobrol Kamis jam 10.', 5 * H, 'Admin Physio'),
  ],
  conv_renonvet: [
    msg('renonvet', 1, 'out', 'ai', 'Selamat siang. Saya dari tim Jadisatu. Jam buka di situs Renon Vet Center belum mencantumkan layanan darurat. Apakah layanan darurat masih tersedia?', 7 * D, 'Candra'),
    msg('renonvet', 2, 'in', 'prospect', 'Masih, 24 jam. Bisa diperbaiki? Saya ingin bicara langsung.', 6 * D, 'Owner Renon Vet'),
    msg('renonvet', 3, 'out', 'owner', 'Tentu. Bagaimana kalau Selasa pukul 14.00 di klinik?', 5 * D, 'Kamu'),
    msg('renonvet', 4, 'in', 'prospect', 'Oke, Selasa jam 2 ya.', 5 * D - 2 * H, 'Owner Renon Vet'),
  ],
  conv_sanurglow: [
    msg('sanurglow', 1, 'out', 'ai', 'Selamat pagi. Saya dari tim Jadisatu. Galeri hasil perawatan di situs Sanur Glow belum bisa dibuka dari HP. Apakah calon pasien biasanya minta contoh hasil lewat WhatsApp?', 9 * D, 'Candra'),
    msg('sanurglow', 2, 'in', 'prospect', 'Iya. Kami tertarik coba 2 minggu dulu.', 7 * D, 'Owner Sanur Glow'),
    msg('sanurglow', 3, 'out', 'owner', 'Siap, uji coba mulai Senin. Kami kirim laporan mingguan.', 7 * D - 3 * H, 'Kamu'),
  ],
  conv_jimbaran: [
    msg('jimbaran', 1, 'out', 'ai', 'Selamat sore. Saya dari tim Jadisatu. Paket spa di situs Jimbaran Wellness belum mencantumkan durasi, jadi tamu sering bertanya ulang. Boleh saya kirim contoh tampilannya?', 5 * D, 'Candra'),
    msg('jimbaran', 2, 'in', 'prospect', 'Boleh kirim contohnya.', 4 * D, 'Spa manager'),
    msg('jimbaran', 3, 'out', 'ai', 'Ini contohnya: demo.jimbaran-wellness.test. Durasi dan harga tampil per paket, dan tombol booking langsung ke WhatsApp.', 4 * D - 2 * H, 'Candra'),
  ],
  conv_nusadua: [
    msg('nusadua', 1, 'out', 'ai', 'Selamat pagi. Saya dari tim Jadisatu. Nomor WhatsApp di situs Nusa Dua Kids Clinic berbeda dengan nomor di Google Maps. Nomor mana yang dipakai untuk janji temu?', 1.2 * D, 'Candra'),
  ],
  conv_tabanan: [
    msg('tabanan', 1, 'out', 'ai', 'Selamat pagi. Saya dari tim Jadisatu. Halaman layanan katarak di situs Tabanan Eye Care tidak bisa dibuka. Apakah pasien biasanya menanyakan layanan ini lewat telepon?', 2.2 * D, 'Candra'),
  ],
  conv_lotus: [
    msg('lotus', 1, 'out', 'ai', 'Selamat pagi. Saya dari tim Jadisatu. Tombol "Booking" di situs Lotus Skin Clinic mengarah ke halaman kosong. Sudah tahu soal ini?', 19 * D, 'Candra'),
    msg('lotus', 2, 'in', 'prospect', 'Wah belum tahu. Tolong bantu ya.', 18 * D, 'Owner Lotus'),
    msg('lotus', 3, 'in', 'prospect', 'Invoice sudah kami bayar ya. Terima kasih, booking minggu ini sudah naik.', 2 * D, 'Owner Lotus'),
    msg('lotus', 4, 'out', 'owner', 'Terima kasih banyak, Bu. Senang mendengarnya. Kami pantau terus minggu depan.', 2 * D - 1 * H, 'Kamu'),
  ],
  conv_senyumkita: [
    msg('senyumkita', 1, 'in', 'prospect', 'Kami lanjut paket bulanan ya. Sudah transfer.', 6 * D, 'Owner Senyum Kita'),
    msg('senyumkita', 2, 'out', 'owner', 'Terima kasih, pembayaran sudah kami terima. Laporan bulan ini kami kirim tanggal 1.', 6 * D - 2 * H, 'Kamu'),
  ],
  conv_ubudherbal: [
    msg('ubudherbal', 1, 'out', 'ai', 'Selamat pagi. Saya dari tim Jadisatu. Formulir reservasi di situs Ubud Herbal Retreat tidak bisa dikirim dari HP. Apakah tamu biasanya memesan lewat WhatsApp?', 6 * D, 'Candra'),
    msg('ubudherbal', 2, 'in', 'prospect', 'Terima kasih, tapi kami sedang tidak mencari vendor. Tolong jangan dihubungi lagi.', 5 * D, 'Front office'),
  ],
};

function thread(key: string, over: Partial<SalesConversation>): SalesConversation {
  const list = messages[`conv_${key}`] ?? [];
  const lastMsg = list[list.length - 1];
  const lastIn = [...list].reverse().find(m => m.direction === 'in')?.at ?? null;
  const lastOut = [...list].reverse().find(m => m.direction === 'out')?.at ?? null;
  return conv(key, {
    last_inbound_at: lastIn, last_outbound_at: lastOut, updated_at: lastMsg?.at ?? now() - 5 * H,
    ...(lastMsg ? { last_body: lastMsg.body, last_direction: lastMsg.direction, last_at: lastMsg.at, last_sender: lastMsg.actor === 'ai' ? 'Candra' : lastMsg.actor === 'owner' ? 'Kamu' : lastMsg.sender } : {}),
    ...over,
  });
}

let conversations: SalesConversation[] = [
  thread('lumina', { control: 'HOLD', stage: 'REPLIED', hold_reason: 'Prospek menanyakan harga paket 2 cabang', unread: 1, assignee: 'none', priority: 'High', tags: ['multi-cabang'] }),
  thread('teratai', { control: 'HUMAN_CONTROLLED', stage: 'REPLIED', unread: 1, assignee: 'irfan', tags: ['3 properti'] }),
  thread('canggu', { stage: 'OWNER_CONFIRMED', unread: 1, priority: 'High', tags: ['rapat kamis'] }),
  thread('renonvet', { stage: 'MEETING_CONFIRMED', priority: 'High' }),
  thread('sanurglow', { stage: 'TRIAL_AGREED', tags: ['uji coba 2 minggu'] }),
  thread('jimbaran', { stage: 'DEMO_SENT', followups: 1, drafts: 1 }),
  thread('nusadua', { stage: 'SENT', queued: 1 }),
  thread('tabanan', { stage: 'SENT', followups: 1 }),
  thread('senyum', { drafts: 1 }),
  thread('padma', { drafts: 1 }),
  thread('kutalaser', { drafts: 1 }),
  thread('lotus', { stage: 'PAID', status: 'Resolved', tags: ['klien'] }),
  thread('senyumkita', { stage: 'PAID', status: 'Resolved', tags: ['klien', 'paket bulanan'] }),
  thread('ubudherbal', { control: 'DO_NOT_CONTACT', stage: 'REPLIED', assignee: 'none', status: 'Closed' }),
];

/* ---------- Studies ---------- */

function study(key: string, service: string, problem: string, evidence: string, hoursOld: number): Study {
  const b = B[key];
  return {
    verdict: 'contact', summary: `${b.segment} di ${b.city}. ${problem}`, target_service: service, version: 1, updated_at: now() - hoursOld * H,
    content: {
      verdict: 'contact', pendekatan: 'solusi',
      verifikasi: { nama_sesuai: 'Cocok dengan Google Maps dan situs', masih_beroperasi: 'Ulasan terbaru minggu ini', website: b.domain, kontak: 'Nomor WhatsApp di situs cocok dengan Maps' },
      bisnis: { jenis: b.segment, layanan_utama: 'Perawatan dan konsultasi', target_pelanggan: 'Pasien lokal dan wisatawan' },
      masalah: [{ status: 'terbukti', masalah: problem, bukti: evidence, sumber: `https://${b.domain}/` }],
      solusi: { layanan: service },
    },
  };
}

const freshHours = () => sinceResearchEnd() / H + 0.3;
const studies: Record<string, Study> = {
  conv_lumina: study('lumina', 'Perbaikan formulir booking', 'Formulir booking tidak mengirim konfirmasi.', 'Uji kirim formulir — tidak ada halaman terima kasih, HTTP 500.', 50),
  conv_senyum: study('senyum', 'Landing page layanan', 'Halaman layanan utama mengembalikan 404.', 'Tautan "Perawatan Saluran Akar" di menu → HTTP 404.', freshHours()),
  conv_padma: study('padma', 'Perbaikan SSL', 'Sertifikat SSL kedaluwarsa, browser menampilkan peringatan.', 'Sertifikat berakhir 2 Okt; diperiksa semalam.', freshHours()),
  conv_kutalaser: study('kutalaser', 'Booking WhatsApp', 'Tombol WhatsApp di situs mengarah ke nomor yang tidak aktif.', 'Tautan wa.me di beranda berbeda dengan nomor di Maps; dicek semalam.', freshHours()),
  conv_jimbaran: study('jimbaran', 'Halaman paket spa', 'Paket spa tanpa durasi dan harga.', 'Halaman paket tidak mencantumkan durasi; dicek semalam.', freshHours()),
  conv_nusadua: study('nusadua', 'Sinkron nomor kontak', 'Nomor WhatsApp di situs berbeda dengan Maps.', 'Dua nomor berbeda di situs dan Maps; dicek 2 hari lalu.', 30),
  conv_canggu: study('canggu', 'Jadwal terapi mandiri', 'Jadwal di situs tidak diperbarui sejak bulan lalu.', 'Halaman jadwal menampilkan bulan lalu; dicek 4 hari lalu.', 96),
};

/* ---------- Review queue: drafts Candra wrote after last night's research ---------- */

function draft(n: number, key: string, kind: string, body: string, sender: string, status = 'draft'): ReviewItem {
  const b = B[key];
  const s = studies[`conv_${key}`];
  return {
    id: `ob_demo${n}`, conversation_id: `conv_${key}`, actor: 'ai', kind, body, status, approved: status === 'queued' ? 1 : 0,
    version: 1, sender_profile: sender, run_mode: 'production', created_at: now() - sinceResearchEnd() + (0.5 + n * 0.15) * H, sent_at: null, error: null,
    namespace: 'sales', snapshot: snap(n), name: b.name, phone: phone(b.i), prospect_ref: `P-${120 + b.i}`, control: 'AUTO',
    verdict: s?.verdict ?? 'contact', study_summary: s?.summary ?? null, study_content: s ? JSON.stringify(s.content) : null,
    study_updated_at: s?.updated_at ?? null, feedback_action: null, feedback_reason: null,
  };
}

let reviewItems: ReviewItem[] = [
  draft(1, 'senyum', 'first', 'Selamat pagi, Bu. Saya dari tim Jadisatu.\n\nSaat membuka situs Rumah Senyum, tautan "Perawatan Saluran Akar" di menu mengarah ke halaman yang tidak ditemukan.\n\nBoleh saya tanya, pasien biasanya mencari informasi layanan lewat situs atau langsung lewat WhatsApp?', 'irfan'),
  draft(2, 'padma', 'first', 'Selamat pagi. Saya dari tim Jadisatu.\n\nSaat membuka situs Padma Dental Studio, browser menampilkan peringatan keamanan karena sertifikat situs sudah berakhir.\n\nApakah ini sudah diketahui tim? Kalau berkenan, saya kirim langkah singkat untuk memeriksanya.', 'candra'),
  draft(3, 'kutalaser', 'first', 'Selamat pagi. Saya dari tim Jadisatu.\n\nTombol WhatsApp di beranda Kuta Laser Skin memakai nomor yang berbeda dengan nomor di Google Maps.\n\nBoleh saya tanya, nomor mana yang sekarang dipakai untuk booking?', 'irfan'),
  draft(4, 'jimbaran', 'followup', 'Selamat siang. Menyambung contoh halaman paket spa kemarin.\n\nKalau berkenan, saya bisa siapkan versi dengan paket dan harga Jimbaran Wellness sendiri untuk dilihat pemilik. Cukup 2 menit untuk dicek.', 'candra'),
  draft(5, 'nusadua', 'followup', 'Selamat pagi. Menyambung pesan kemarin soal nomor WhatsApp.\n\nKami hanya ingin memastikan orang tua pasien tidak salah menghubungi. Nomor mana yang sebaiknya kami catat?', 'irfan', 'queued'),
];

/* ---------- Notes and events ---------- */

const notes: Record<string, { id: string; body: string; at: number }[]> = {
  conv_lumina: [{ id: 'n1', body: 'Harga multi-cabang belum ada di daftar harga yang disetujui. Draf jawaban sudah kusiapkan tanpa angka. — Candra', at: now() - 0.55 * H }],
  conv_canggu: [{ id: 'n2', body: 'Pemilik bisnis mau rapat Kamis 10:00. Mohon konfirmasi jadwalmu sebelum aku balas. — Candra', at: now() - 4.8 * H }],
  conv_teratai: [{ id: 'n3', body: 'Kuambil alih karena menyangkut paket 3 properti. — Pemilik', at: now() - 26 * H }],
};

const stageEvents: Partial<Record<Stage, [string, string, string][]>> = {
  SENT: [['candra', 'SENT', 'Pesan pertama terkirim']],
  REPLIED: [['candra', 'SENT', 'Pesan pertama terkirim'], ['candra', 'REPLIED', 'Prospek membalas']],
  DEMO_SENT: [['candra', 'REPLIED', 'Prospek membalas'], ['candra', 'DEMO_SENT', 'Contoh halaman dikirim']],
  OWNER_CONFIRMED: [['candra', 'DEMO_SENT', 'Contoh halaman dikirim'], ['owner', 'OWNER_CONFIRMED', 'Pemilik bisnis terlibat']],
  MEETING_CONFIRMED: [['owner', 'OWNER_CONFIRMED', 'Pemilik bisnis terlibat'], ['owner', 'MEETING_CONFIRMED', 'Rapat dijadwalkan']],
  TRIAL_AGREED: [['owner', 'MEETING_CONFIRMED', 'Rapat selesai'], ['owner', 'TRIAL_AGREED', 'Uji coba 2 minggu disepakati']],
  PAID: [['owner', 'TRIAL_AGREED', 'Uji coba selesai'], ['owner', 'PAID', 'Pembayaran diterima']],
};

function eventsFor(c: SalesConversation): SalesEvent[] {
  const base = c.updated_at;
  const list: SalesEvent[] = [
    { id: 1, actor: 'research', event_type: 'STUDY_SAVED', evidence: 'Riset & bukti tersimpan', at: base - 30 * H },
    { id: 2, actor: 'candra', event_type: 'ELIGIBLE', evidence: 'Lolos checklist kelayakan', at: base - 29 * H },
  ];
  (stageEvents[c.stage] ?? []).forEach(([actor, type, evidence], i) => list.push({ id: 10 + i, actor, event_type: type, evidence, at: base - (3 - i) * H }));
  if (c.control === 'HOLD') list.push({ id: 30, actor: 'candra', event_type: 'HOLD', evidence: c.hold_reason, at: (c.last_inbound_at ?? now()) + 30 });
  if (c.control === 'HUMAN_CONTROLLED') list.push({ id: 31, actor: 'owner', event_type: 'ASSIGNED', evidence: 'Diambil alih pemilik', at: now() - 26 * H });
  if (c.control === 'DO_NOT_CONTACT') list.push({ id: 32, actor: 'candra', event_type: 'DO_NOT_CONTACT', evidence: 'Prospek meminta tidak dihubungi lagi', at: (c.last_inbound_at ?? now()) + 60 });
  return list.sort((a, b) => a.at - b.at);
}

/* ---------- PC worker ledger: three nights of research ---------- */

const taskNames = ['Riset web & bukti', 'Verifikasi kontak', 'Cek ulang bukti'];
function night(batch: string, nightsAgo: number, statuses: string[]): WorkJob[] {
  const end = now() - sinceResearchEnd() - nightsAgo * D;
  return statuses.map((status, n) => ({
    id: `job_${batch}_${n + 1}`, domain: 'sales', head_agent: 'candra', worker_role: 'research', status, attempt: status === 'needs_revision' ? 2 : 1,
    worker_id: 'pc-research-1', lease_expiry: null, revision: 1,
    error: status === 'blocked' ? 'Nomor di situs tidak cocok dengan nomor di Google Maps' : status === 'failed' ? 'Situs tidak merespons setelah 2 percobaan' : null,
    payload: JSON.stringify({ batch_id: batch, prospect: biz[(n + nightsAgo * 3) % biz.length].name, task: taskNames[n % taskNames.length] }),
    checkpoint: null, feedback: status === 'needs_revision' ? 'Ulangi hanya sumber nomor telepon.' : null,
    run_mode: 'production', created_at: end - 10 * H + n * 600, updated_at: end - (statuses.length - n) * 900,
  }));
}
const accepted = (n: number) => Array.from({ length: n }, () => 'accepted');
const jobs: WorkJob[] = [
  ...night('batch_16', 0, [...accepted(17), 'needs_revision', 'blocked', 'accepted', 'accepted']),
  ...night('batch_15', 1, accepted(20)),
  ...night('batch_14', 2, [...accepted(18), 'failed', 'accepted']),
];

/* ---------- Team chat ---------- */

const chats: ChatSnapshot[] = [
  {
    id: 'chat_engineer', title: 'Cek kesehatan harian', agent_id: 'engineer', kind: 'private', created_at: iso(14 * D), updated_at: iso(6 * H), member_ids: null,
    messages: [
      { id: 'cm1', role: 'user', content: 'Angga, tolong cek semua sistem sebelum review pagi.', agent_id: null, created_at: iso(6.2 * H) },
      { id: 'cm2', role: 'assistant', content: 'Semua normal. **Server utama** sehat, **PC Worker** menyelesaikan 21 tugas riset semalam, dan **WhatsApp** tersambung. Backup harian terakhir selesai pukul 03:15 dan sudah diuji bisa dipulihkan.', agent_id: 'engineer', created_at: iso(6.1 * H) },
    ],
    runs: [{ id: 'run1', status: 'completed', agent_id: 'engineer', created_at: iso(6.2 * H) }],
  },
  {
    id: 'chat_engineer_flow', title: 'Terapkan perubahan Alur Kerja v7', agent_id: 'engineer', kind: 'private', created_at: iso(4 * D), updated_at: iso(3.8 * D), member_ids: null,
    messages: [
      { id: 'cf1', role: 'user', content: 'Pemilik menyetujui perubahan Alur Kerja (v6 → v7): batas riset per malam 25 → 20 prospek. Siapkan rencana penerapan dan rollback, lalu minta persetujuan sebelum mengubah produksi.', agent_id: 'engineer', created_at: iso(4 * D) },
      { id: 'cf2', role: 'assistant', content: 'Rencana: ubah batas batch di konfigurasi worker, uji satu batch kecil, lalu aktifkan untuk malam ini. Rollback: kembalikan nilai lama. Setuju untuk diterapkan?', agent_id: 'engineer', created_at: iso(4 * D - 600) },
      { id: 'cf3', role: 'user', content: 'Setuju.', agent_id: 'engineer', created_at: iso(3.9 * D) },
      { id: 'cf4', role: 'assistant', content: 'Sudah diterapkan dan diuji. Batch malam ini memakai batas 20 prospek.', agent_id: 'engineer', created_at: iso(3.8 * D) },
    ],
    runs: [{ id: 'run3', status: 'completed', agent_id: 'engineer', created_at: iso(4 * D) }, { id: 'run4', status: 'completed', agent_id: 'engineer', created_at: iso(3.9 * D) }],
  },
  {
    id: 'chat_room_ops', title: 'Operasi harian', agent_id: 'engineer', kind: 'room', created_at: iso(20 * D), updated_at: iso(26 * H), member_ids: ['engineer', 'manda'],
    messages: [
      { id: 'cr1', role: 'user', content: '@engineer tolong pastikan backup minggu ini lengkap.', agent_id: 'engineer', created_at: iso(27 * H) },
      { id: 'cr2', role: 'assistant', content: 'Tujuh backup harian lengkap dan satu sudah diuji pulih. Tidak ada tindakan yang dibutuhkan.', agent_id: 'engineer', created_at: iso(26 * H) },
    ],
    runs: [{ id: 'run2', status: 'completed', agent_id: 'engineer', created_at: iso(27 * H) }],
  },
];

const workflowState: WorkflowState = {
  version: 7,
  overrides: { 'research.limit.batch': '20 prospek' },
  proposals: [
    { id: 'wp_demo2', base_version: 7, status: 'rejected', note: 'Coba naikkan jumlah draf harian.', created_at: now() - 2 * D, decided_at: now() - 2 * D + 600,
      changes: [{ node_id: 'draft', field: 'limit.max_drafts', from: '20 draf', to: '30 draf' }] },
    { id: 'wp_demo1', base_version: 6, status: 'applied', note: 'Fokus kualitas riset: batas batch diturunkan.', created_at: now() - 4 * D, decided_at: now() - 4 * D + 300, applied_at: now() - 3.8 * D,
      changes: [{ node_id: 'research', field: 'limit.batch', from: '25 prospek', to: '20 prospek' }], task_conversation_id: 'chat_engineer_flow' },
  ],
};

const candraSession: CandraSession = {
  available: true, reason: null, detail: null, session_id: 'demo-telegram-dm',
  turn: { running: false, started_at: null, error: null, finished_at: null },
  messages: [
    { id: 'cd1', role: 'user', content: 'Candra, ringkas hasil semalam.', created_at: now() - 5 * H, source: 'telegram' },
    { id: 'cd2', role: 'assistant', content: 'Semalam Worker Riset memeriksa **21 bisnis**: 19 diterima, 1 perlu revisi sumber nomor, 1 terblokir karena nomornya tidak cocok dengan Maps. Dari yang diterima, aku siapkan **3 pesan pertama** dan **2 follow-up**. Follow-up untuk Nusa Dua Kids Clinic sudah kamu setujui dan akan terkirim di jam kirim.', created_at: now() - 4.9 * H, source: 'telegram' },
    { id: 'cd3b', role: 'assistant', content: 'Ini ringkasan prospek siap kontak untuk review pagi ini.\n\nMEDIA:/demo/candra/workspaces/prospek-siap-kontak.md', created_at: now() - 4.8 * H, source: 'telegram' },
    { id: 'cd3', role: 'user', content: 'Klinik Lumina tanya harga 2 cabang. Gimana sebaiknya?', created_at: now() - 0.5 * H, source: 'web' },
    { id: 'cd4', role: 'assistant', content: 'Harga multi-cabang belum ada di daftar yang disetujui, jadi percakapannya kutahan. Saranku: tawarkan panggilan 15 menit dengan pemiliknya untuk melihat kebutuhan tiap cabang, lalu kirim penawaran tertulis. Kalau setuju, balas sendiri dari Percakapan atau minta aku siapkan drafnya.', created_at: now() - 0.48 * H, source: 'web' },
  ],
};

const workspaceState = (): WorkspaceState => ({
  user: { name: 'Pemilik' },
  agents: [
    { id: 'engineer', name: 'Angga', role: 'Teknisi', status: 'ready', description: 'Memeriksa sistem, menjaga PC Worker, dan menerapkan perubahan alur.' },
    { id: 'manda', name: 'Manda', role: 'Penulis naskah', status: 'history_only', description: 'Menulis konten lewat Telegram; riwayatnya tersedia di sini.' },
    { id: 'strategist', name: 'Content Strategist', role: 'Strategi', status: 'planned' },
  ],
  conversations: chats.map(({ messages: _m, runs: _r, ...c }) => c),
  activity: [
    { id: 'a1', type: 'approval', title: 'Kamu menyetujui follow-up untuk Nusa Dua Kids Clinic', detail: 'Terkirim di jam kirim', created_at: iso(Math.min(2.6 * H, sinceResearchEnd() - 0.2 * H)) },
    { id: 'a2', type: 'run', title: 'Candra menyiapkan 5 draf dari riset semalam', detail: '3 pesan pertama · 2 follow-up', created_at: iso(Math.max(0, sinceResearchEnd() - 0.6 * H)) },
    { id: 'a3', type: 'run', title: 'Worker Riset menyelesaikan 21 riset', detail: 'Batch 16', created_at: iso(sinceResearchEnd()) },
    { id: 'a4', type: 'failure', title: 'Validator menahan 1 hasil: nomor tidak cocok dengan Maps', created_at: iso(sinceResearchEnd() + 900) },
    { id: 'a5', type: 'approval', title: 'Canggu Physio Hub: pemilik bisnis setuju rapat Kamis', created_at: iso(5 * H) },
    { id: 'a6', type: 'approval', title: 'Lotus Skin Clinic membayar invoice pertama', created_at: iso(2 * D) },
  ],
  integrations: [],
  system: {
    hostname: 'server-utama', memory: { total_mb: 3913, available_mb: 2240 }, disk: { total_gb: 48, free_gb: 18 },
    worker: { status: 'online', label: 'PC Worker aktif semalam', last_seen: now() - sinceResearchEnd() },
    runtime: { model: 'Terkonfigurasi per agent', engine: 'Hermes' }, queue: { queued: 0, running: 0 },
  },
});

/* ---------- Inbox views (same rules as the backend) ---------- */

const closed = (c: SalesConversation) => ['Resolved', 'Closed'].includes(c.status);
const viewFilter: Record<InboxView, (c: SalesConversation) => boolean> = {
  all: c => c.control !== 'DO_NOT_CONTACT' && !closed(c),
  prospects: c => c.audience === 'prospect' && c.control !== 'DO_NOT_CONTACT' && !closed(c),
  others: c => c.audience === 'observed' && !closed(c),
  groups: c => c.audience === 'group' && !closed(c),
  candra: c => c.control === 'AUTO' && c.audience === 'prospect' && !closed(c),
  unassigned: c => c.assignee === 'none' && c.control !== 'DO_NOT_CONTACT' && !closed(c),
  needs_reply: c => !closed(c) && c.control !== 'DO_NOT_CONTACT' && !!c.last_inbound_at && c.last_inbound_at >= (c.last_outbound_at ?? 0),
  hold: c => c.control === 'HOLD',
  drafts: c => c.drafts > 0,
  human: c => c.control === 'HUMAN_CONTROLLED' && !closed(c),
  unread: c => c.unread > 0,
  snoozed: c => c.status === 'Snoozed',
  resolved: c => closed(c),
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
    conversations = conversations.map(c => (c.id === item.conversation_id ? { ...c, drafts: 0, queued: 1, stage: c.stage === 'ELIGIBLE' ? 'DRAFT_APPROVED' : c.stage } : c));
  },
  decline: async (item, reason, action) => {
    await wait(400);
    reviewItems = reviewItems.map(r => (r.id === item.id ? { ...r, status: action === 'revise' ? 'needs_revision' : 'cancelled', feedback_reason: reason } : r));
    if (action === 'hold') conversations = conversations.map(c => (c.id === item.conversation_id ? { ...c, control: 'HOLD', drafts: 0, hold_reason: reason } : c));
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
      outbox: reviewItems.filter(r => r.conversation_id === id), events: eventsFor(c),
    };
    return detail;
  },
  setControl: async (id, control: Control, reason) => {
    await wait(300);
    conversations = conversations.map(c => (c.id === id ? { ...c, control, assignee: control === 'HUMAN_CONTROLLED' ? 'irfan' : control === 'AUTO' ? 'candra' : 'none', hold_reason: control === 'HOLD' ? reason : null } : c));
  },
  ownerMessage: async (id, body) => {
    await wait(300);
    (messages[id] ??= []).push({ id: `m${Date.now()}`, conversation_id: id, direction: 'out', actor: 'owner', body, at: now(), sender: 'Kamu' });
    conversations = conversations.map(c => (c.id === id ? { ...c, last_body: body, last_direction: 'out', last_at: now(), last_outbound_at: now(), last_sender: 'Kamu' } : c));
  },
  addNote: async (id, body) => { await wait(200); (notes[id] ??= []).push({ id: `n${Date.now()}`, body, at: now() }); },
  markSeen: async id => { conversations = conversations.map(c => (c.id === id ? { ...c, unread: 0 } : c)); },
  // Business-wide funnel since launch, counted per unique business.
  metrics: async () => ({
    reply_rate: { numerator: 17, denominator: 46, value: 17 / 46 },
    demo_request_rate: { numerator: 7, denominator: 17, value: 7 / 17 },
    owner_reach_rate: { numerator: 5, denominator: 17, value: 5 / 17 },
    paid_win_rate: { numerator: 2, denominator: 46, value: 2 / 46 },
    control: { AUTO: 58, HOLD: 1, HUMAN_CONTROLLED: 1, DO_NOT_CONTACT: 3 },
    stages: { ELIGIBLE: 21, DRAFT_APPROVED: 4, SENT: 21, REPLIED: 6, DEMO_REQUESTED: 1, DEMO_SENT: 3, OWNER_CONFIRMED: 2, MEETING_CONFIRMED: 1, TRIAL_AGREED: 1, PAID: 2 },
  }),
  bridge: async () => ({ configured: true, paused: false, drafting: true, candra_online: true, dropped_inbound: 0, last_error: null, last_tick_at: now() - 25, health: { status: 'connected' } }),
  whatsapp: async () => ({ state: 'connected', qr: null, account: '620000000100:4@s.whatsapp.net', updated_at: now() - 35 }),
  jobs: async () => { await wait(); return { items: jobs }; },
  batches: async () => [
    { id: 'batch_16', cap_usd: 2, max_items: 20, domain: 'sales', head_agent: 'candra', created_at: now() - sinceResearchEnd() - 10 * H, items: 21, known_cost_usd: 0.91, reserved_usd: 0.04, remaining_usd: 1.05 },
    { id: 'batch_15', cap_usd: 2, max_items: 20, domain: 'sales', head_agent: 'candra', created_at: now() - sinceResearchEnd() - 34 * H, items: 20, known_cost_usd: 0.86, reserved_usd: 0, remaining_usd: 1.14 },
    { id: 'batch_14', cap_usd: 2, max_items: 25, domain: 'sales', head_agent: 'candra', created_at: now() - sinceResearchEnd() - 58 * H, items: 20, known_cost_usd: 1.02, reserved_usd: 0, remaining_usd: 0.98 },
  ],
  usage: async () => ({
    deepseek: { calls: 1_284, input_tokens: 8_960_000, output_tokens: 1_140_000, cost_usd: 11.42, unknown_cost_calls: 0 },
    chatgpt: { calls: 612, input_tokens: null, output_tokens: null, cost_usd: null, unknown_cost_calls: 612 },
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
      c.messages.push({ id: `cm${Date.now()}`, role: 'assistant', content: 'Siap, sedang kuperiksa. (Mode demo: di workspace asli, agent membalas lewat Hermes.)', agent_id: c.agent_id, created_at: iso(0) });
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
      proposal.task_conversation_id = 'chat_engineer_flow';
    }
    return structuredClone(proposal);
  },
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
  simulateWorkflow: async input => {
    await wait(300);
    const result = { ...input.values, ...Object.fromEntries(input.changes.map(c => [`${c.node_id}.${c.field}`, c.to])) };
    const issues: WorkflowSimulation['issues'] = [];
    if (input.base_version !== workflowState.version) issues.push({ level: 'error', node_id: 'workflow', field: 'version', message: `Alur sudah di v${workflowState.version}; muat ulang dulu.` });
    const hhmm = (v?: string) => (v && /^([01]\d|2[0-3]):[0-5]\d$/.test(v) ? Number(v.slice(0, 2)) * 60 + Number(v.slice(3)) : null);
    const start = hhmm(result['approval.limit.window_start']); const end = hhmm(result['approval.limit.window_end']);
    if (start !== null && end !== null && end <= start) issues.push({ level: 'error', node_id: 'approval', field: 'limit.window_end', message: 'Jendela review harus selesai setelah dimulai.' });
    return { ok: !issues.some(i => i.level === 'error'), version: workflowState.version, issues, result };
  },
  revertWorkflow: async (target, note) => {
    await wait(300);
    if (target >= workflowState.version) throw new Error(`Pilih versi sebelum v${workflowState.version}`);
    const applied = workflowState.proposals.filter(p => p.status === 'applied').sort((a, b) => a.base_version - b.base_version);
    const at: Record<string, string> = {}; const original: Record<string, string> = {};
    for (const p of applied) for (const c of p.changes) {
      const key = `${c.node_id}.${c.field}`;
      original[key] ??= c.from;
      if (p.base_version < target) at[key] = c.to;
    }
    const changes = Object.entries(workflowState.overrides).flatMap(([key, current]) => {
      const wanted = at[key] ?? original[key];
      const [node_id, ...rest] = key.split('.');
      return wanted && wanted !== current ? [{ node_id, field: rest.join('.'), from: current, to: wanted }] : [];
    });
    if (!changes.length) throw new Error(`v${target} sama dengan versi aktif`);
    const proposal: WorkflowProposal = { id: `wp_${Date.now()}`, status: 'pending', created_at: now(), base_version: workflowState.version, changes, note: `Kembalikan ke v${target}. ${note}` };
    workflowState.proposals.unshift(proposal);
    return structuredClone(proposal);
  },
  worker: async () => ({
    last_activity_at: now() - sinceResearchEnd(),
    by_status: jobs.reduce<Record<string, number>>((acc, j) => ({ ...acc, [j.status]: (acc[j.status] ?? 0) + 1 }), {}),
    identities: 1,
  }),
  candra: async () => { await wait(); return structuredClone(candraSession); },
  candraMediaUrl: () => null,
  candraMediaText: async () => {
    await wait();
    return '# Prospek siap kontak — contoh\n\n| Bisnis | Kota | Masalah terbukti | Draf |\n|---|---|---|---|\n| Rumah Senyum Dental | Sanur | Halaman layanan 404 | ob_demo1 |\n| Padma Dental Studio | Renon | SSL kedaluwarsa | ob_demo2 |\n| Kuta Laser Skin | Kuta | Nomor WhatsApp tidak cocok | ob_demo3 |\n\n**Catatan:** semua bukti dicek semalam. (Data demo fiktif.)';
  },
  sendCandra: async content => {
    await wait(300);
    if (candraSession.turn.running) throw new Error('Candra masih membalas pesan sebelumnya.');
    candraSession.messages.push({ id: `cw${Date.now()}`, role: 'user', content, created_at: now(), source: 'web' });
    candraSession.turn = { running: true, started_at: now(), error: null, finished_at: null };
    setTimeout(() => {
      candraSession.messages.push({ id: `cr${Date.now()}`, role: 'assistant', content: 'Siap, kuperiksa sekarang. (Mode demo: di workspace asli, Candra membalas di sesi yang sama dengan Telegram.)', created_at: now(), source: 'web' });
      candraSession.turn = { running: false, started_at: candraSession.turn.started_at, error: null, finished_at: now() };
    }, 1800);
  },
};
