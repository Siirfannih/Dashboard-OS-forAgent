// Template workflow definition for the Alur Kerja canvas. A client deployment changes this file,
// not the components. It models the real a2a2u sales flow (spec 8 Oct): Candra plans, the research
// worker verifies, the validator gates evidence, the owner approves every draft, and Candra's send
// safeguards (sales/gate.py) decide when a message may leave. Applied changes arrive from the API as
// WorkflowState.overrides keyed `${node_id}.${field}` and are overlaid on top of these values.
import type { FlowEdge, FlowNode } from '../lib/types';
import { workspace } from './workspace';

/** How the canvas draws an edge. Defaults to `down` (bottom of source → top of target). */
export type EdgeRoute = 'down' | 'branch' | 'side' | 'loop-left' | 'loop-right';
export interface RoutedEdge extends FlowEdge { route?: EdgeRoute }

const slot = (key: string, fallback: string) => workspace.schedule.find(s => s.key === key) ?? { from: fallback, to: fallback };
const research = slot('research', '20:00');
const review = slot('review', '07:30');
const outbound = slot('outbound', '09:00');
const tz = workspace.timezoneLabel;

/** Where a step can run, in user language. */
export const hostLabel: Record<string, string> = {
  pc: 'PC Worker',
  main: 'Server Utama',
  cloud: 'Worker cloud',
  owner: 'Kamu (manusia)',
  whatsapp: 'Kanal WhatsApp · Server Utama',
};

const nodes: FlowNode[] = [
  {
    id: 'start', n: '1', title: `Mulai riset malam · ${research.from} ${tz}`, type: 'trigger', executor: 'validator',
    description: `Jadwal harian memulai batch riset pukul ${research.from} ${tz}. Riset berjalan sampai ${research.to}.`,
    host: 'main', x: 355, y: 24,
  },
  {
    id: 'plan', n: '2', title: 'Candra membagi tugas', type: 'auto', executor: 'candra',
    description: 'Candra memecah target jadi tugas riset per prospek dan memberikannya ke Worker Riset.',
    host: 'main',
    limits: [{ key: 'per_prospect', label: 'Tugas per prospek', value: '1 tugas' }],
    allow: ['Membuat dan membagi tugas riset', 'Membaca hasil riset untuk dinilai'],
    deny: ['Menyetujui atas nama pemilik', 'Mengubah batas biaya atau jeda kirim'],
    x: 355, y: 112,
  },
  {
    id: 'research', n: '3', title: 'Riset web & verifikasi', type: 'auto', executor: 'research',
    description: 'Cari situs, peta, dan kontak tiap bisnis; simpan bukti beserta sumber dan waktu diperiksa.',
    host: 'pc',
    hostOptions: [
      { value: 'pc', label: 'PC Worker', available: true, note: 'Riset paralel di PC saat malam. Butuh PC menyala dan tersambung; kalau PC mati, tugas menunggu.' },
      { value: 'main', label: 'Server Utama', available: true, note: '1 tugas sekaligus, lebih lambat. Memakai server yang sama dengan Candra, jadi batch bisa belum selesai sebelum jam review.' },
      { value: 'cloud', label: 'Worker cloud', available: false, note: 'Segera — belum tersedia di workspace ini.' },
    ],
    limits: [
      { key: 'batch', label: 'Prospek per batch', value: '20 prospek', editable: true },
      { key: 'deadline', label: 'Harus selesai sebelum', value: research.to, editable: true },
      { key: 'call_budget', label: 'Batas biaya per panggilan model', value: 'Belum ditetapkan', editable: true },
    ],
    allow: ['Membuka situs publik dan peta', 'Menyimpan bukti beserta sumber'],
    deny: ['Menghubungi bisnis', 'Membaca percakapan', 'Menyetujui atas nama pemilik'],
    x: 355, y: 390,
  },
  {
    id: 'validator', n: '4', title: 'Validator bukti', type: 'decision', executor: 'validator',
    description: 'Aturan sistem memeriksa setiap hasil: bukti diperiksa ≤ 24 jam lalu, halaman terbuka normal (HTTP 200), bukan duplikat, dan bisnis tidak ada di daftar jangan dihubungi.',
    host: 'main',
    limits: [
      { key: 'evidence_age', label: 'Umur bukti maksimal', value: '24 jam' },
      { key: 'http', label: 'Halaman sumber', value: 'Harus terbuka (HTTP 200)' },
    ],
    allow: ['Meloloskan hasil yang memenuhi semua syarat', 'Mengembalikan hasil untuk revisi'],
    deny: ['Mengubah isi bukti', 'Meloloskan bisnis di daftar jangan dihubungi'],
    locked: true, x: 472, y: 700,
  },
  {
    id: 'draft', n: '5a', title: 'Candra menilai & menyusun draf', type: 'auto', executor: 'candra',
    description: 'Candra menilai hasil yang lolos dan menulis satu pesan pembuka per prospek untuk kamu tinjau.',
    host: 'main',
    limits: [{ key: 'max_drafts', label: 'Draf maksimal per hari', value: '20 draf', editable: true }],
    allow: ['Menyusun draf pesan', 'Menandai prospek layak atau ditunda'],
    deny: ['Mengirim pesan', 'Mengutip harga yang belum disetujui'],
    x: 110, y: 890,
  },
  {
    id: 'revise', n: '5b', title: 'Revisi riset', type: 'auto', executor: 'candra',
    description: 'Hasil yang tidak lolos diberi catatan dan dikembalikan ke riset. Hanya bagian yang bermasalah yang diulang.',
    host: 'main',
    limits: [{ key: 'retries', label: 'Ulang maksimal', value: '1 kali' }],
    allow: ['Menulis catatan revisi untuk Worker Riset'],
    deny: ['Menghapus bukti', 'Mengulang tugas yang hasilnya tidak diketahui'],
    x: 600, y: 890,
  },
  {
    id: 'approval', n: '6', title: 'Persetujuan Pemilik', type: 'gate', executor: 'owner',
    description: 'Kamu menyetujui atau meminta revisi tiap draf. Tidak ada pesan yang keluar tanpa persetujuanmu.',
    host: 'owner',
    limits: [
      { key: 'window_start', label: 'Jendela review mulai', value: review.from, editable: true },
      { key: 'window_end', label: 'Jendela review selesai', value: review.to, editable: true },
      { key: 'expiry', label: 'Persetujuan kedaluwarsa', value: '48 jam' },
    ],
    allow: ['Hanya pemilik yang memutuskan'],
    deny: ['Dilewati oleh agent mana pun', 'Disetujui otomatis'],
    locked: true, x: 110, y: 1200,
  },
  {
    id: 'send', n: '7', title: 'Kirim via WhatsApp', type: 'guard', executor: 'whatsapp',
    description: 'Draf yang kamu setujui dikirim pada jam kirim. Status HOLD dan daftar jangan dihubungi dicek tepat sebelum setiap pesan.',
    host: 'whatsapp',
    limits: [
      { key: 'hours', label: 'Jam kirim', value: `${outbound.from}–${outbound.to}` },
      { key: 'daily', label: 'Pesan pertama per hari', value: 'Maks 20/hari' },
      { key: 'gap', label: 'Jeda antar pesan', value: '90–150 dtk' },
      { key: 'per_contact', label: 'Jeda ke kontak yang sama', value: 'Min 8 jam' },
    ],
    allow: ['Mengirim draf yang sudah kamu setujui'],
    deny: ['Mengirim saat HOLD atau jangan dihubungi', 'Mengirim di luar jam kirim', 'Mengirim saat pengiriman dijeda'],
    locked: true, x: 110, y: 1490,
  },
  {
    id: 'escalation', n: '8', title: 'Balasan masuk & eskalasi', type: 'guard', executor: 'candra',
    description: 'Candra membaca balasan. Pertanyaan harga, negosiasi, atau permintaan demo membuat percakapan Ditahan dan kamu dipanggil.',
    host: 'main',
    limits: [{ key: 'topics', label: 'Selalu ke pemilik', value: 'Harga · negosiasi · demo' }],
    allow: ['Menyusun draf balasan untuk kamu setujui', 'Menahan percakapan dan memanggil pemilik'],
    deny: ['Menjawab harga atau negosiasi sendiri', 'Membuat janji komersial'],
    locked: true, x: 600, y: 1490,
  },
  {
    id: 'end', n: '9', title: 'Selesai', type: 'end', executor: 'validator',
    description: 'Prospek dibalas, ditahan untuk kamu, atau ditutup. Riwayat tetap tersimpan di Percakapan.',
    x: 670, y: 1810,
  },
];

const edges: RoutedEdge[] = [
  { from: 'start', to: 'plan' },
  { from: 'plan', to: 'research' },
  { from: 'research', to: 'validator' },
  { from: 'validator', to: 'draft', label: 'lolos', route: 'branch' },
  { from: 'validator', to: 'revise', label: 'tidak lolos', route: 'branch' },
  { from: 'revise', to: 'research', label: 'perlu revisi · maks 1 ulang', dashed: true, route: 'loop-right' },
  { from: 'draft', to: 'approval' },
  { from: 'approval', to: 'draft', label: 'minta revisi', dashed: true, route: 'loop-left' },
  { from: 'approval', to: 'send', label: 'disetujui' },
  { from: 'send', to: 'escalation', label: 'balasan masuk', route: 'side' },
  { from: 'escalation', to: 'end' },
];

export const salesWorkflow = {
  id: 'sales-outbound',
  name: 'Alur sales harian',
  path: 'Sales / Pipeline outbound',
  nodes,
  edges,
};

/** Short chip text for a limit on the node card; null hides it from the card (still in the inspector). */
export function limitChip(nodeId: string, key: string, value: string, all: Record<string, string>): string | null {
  if (nodeId === 'research' && key === 'deadline') return `Selesai ≤ ${value}`;
  if (nodeId === 'research' && key === 'call_budget') return value === 'Belum ditetapkan' ? null : `${value}/panggilan`;
  if (nodeId === 'approval' && key === 'window_start') return `${value}–${all.window_end ?? ''}`;
  if (nodeId === 'approval' && (key === 'window_end' || key === 'expiry')) return null;
  if (nodeId === 'validator') return null;
  if (nodeId === 'send' && key === 'per_contact') return null;
  return value;
}
