import React from 'react';
import { ArrowRight, ChevronRight, Clock, ShieldAlert, Cpu } from 'lucide-react';
import { StatusPill, ActorAvatar } from '../common/Pill';

interface HariIniProps {
  onNavigate: (tab: string, contextId?: string) => void;
  onOpenJedaModal: () => void;
  isPaused: boolean;
  waitingDecisionsCount: number;
}

export function HariIni({
  onNavigate,
  onOpenJedaModal,
  isPaused,
  waitingDecisionsCount,
}: HariIniProps) {
  return (
    <div className="flex-1 overflow-y-auto">
      {/* Top Header */}
      <div className="px-6 py-6 border-b border-[#E5E7EB] bg-white">
        <div className="max-w-[1160px] mx-auto">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 mb-4">
            <div>
              <h1 className="text-[24px] font-semibold text-[#111827] tracking-tight">
                Selamat pagi, Irfan
              </h1>
              <p className="text-[13px] text-[#6B7280]">
                Kamis, 8 Oktober 2026 · 07:48 WITA
              </p>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[12px] text-[#6B7280]">Mode saat ini:</span>
              <StatusPill variant="amber" dot>
                Window Review (07:30–09:00 WITA)
              </StatusPill>
            </div>
          </div>

          {/* Thin horizontal day timeline across full width */}
          <div className="pt-2">
            <div className="flex items-center justify-between text-[11px] font-bold uppercase tracking-[0.06em] text-[#9CA3AF] mb-1.5">
              <span>Siklus Operasional 24 Jam (WITA)</span>
              <span className="font-mono text-[#B54708]">Sekarang: 07:48 WITA</span>
            </div>

            <div className="relative h-7 rounded-lg overflow-hidden border border-[#E5E7EB] flex bg-[#F9FAFB] text-[11px] font-medium select-none">
              {/* Segment 1: Riset malam 20:00–07:30 (purple) */}
              <div
                style={{ width: '45%' }}
                className="bg-[#F4F3FF] border-r border-[#D9D6FE] text-[#5925DC] flex items-center px-3 truncate"
                title="Riset malam 20:00–07:30 oleh Worker PC-1"
              >
                <span className="w-1.5 h-1.5 rounded-full bg-[#7A5AF8] shrink-0 mr-2" />
                <span className="truncate">Riset malam 20:00–07:30</span>
              </div>

              {/* Segment 2: Review 07:30–09:00 (amber, active highlighted) */}
              <div
                style={{ width: '22%' }}
                className="relative bg-[#FFFAEB] border-r border-[#FEDF89] text-[#B54708] flex items-center px-3 font-semibold shadow-xs"
                title="Review Founder 07:30–09:00 (Aktif)"
              >
                <span className="w-2 h-2 rounded-full bg-[#B54708] animate-pulse shrink-0 mr-1.5" />
                <span className="truncate">Review 07:30–09:00</span>
                {/* Sekarang marker */}
                <div 
                  style={{ left: '25%' }}
                  className="absolute top-0 bottom-0 w-0.5 bg-[#B54708] z-10 flex flex-col items-center"
                >
                  <span className="absolute -top-4 text-[9px] font-mono font-bold bg-[#111827] text-white px-1 rounded-xs">
                    Sekarang
                  </span>
                </div>
              </div>

              {/* Segment 3: Outbound 09:00–17:00 (gray) */}
              <div
                style={{ width: '33%' }}
                className="bg-[#F2F4F7] text-[#475467] flex items-center px-3 truncate"
                title="Outbound 09:00–17:00"
              >
                <span className="w-1.5 h-1.5 rounded-full bg-[#9CA3AF] shrink-0 mr-2" />
                <span className="truncate">Outbound 09:00–17:00</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="max-w-[1160px] mx-auto p-6 space-y-6">
        {/* Row of 4 metric cards (border only, no charts, 40px light, tabular numbers) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Card 1 */}
          <div 
            onClick={() => onNavigate('keputusan')}
            className="p-5 bg-white rounded-xl border border-[#E5E7EB] hover:border-[#2563EB]/40 transition-colors cursor-pointer group flex flex-col justify-between"
          >
            <div>
              <div className="text-[11px] font-bold uppercase tracking-[0.06em] text-[#9CA3AF] mb-1">
                MENUNGGU KEPUTUSANMU
              </div>
              <div className="text-[40px] font-light leading-[48px] text-[#111827] tabular-nums group-hover:text-[#2563EB] transition-colors">
                {waitingDecisionsCount}
              </div>
            </div>
            <div className="mt-3 pt-3 border-t border-[#F3F4F6] flex items-center justify-between text-[12px]">
              <span className="text-[#6B7280]">Tertua 14 jam</span>
              <StatusPill variant="amber" dot>
                2 kedaluwarsa &lt; 6 jam
              </StatusPill>
            </div>
          </div>

          {/* Card 2 */}
          <div 
            onClick={() => onNavigate('pipeline')}
            className="p-5 bg-white rounded-xl border border-[#E5E7EB] hover:border-[#2563EB]/40 transition-colors cursor-pointer group flex flex-col justify-between"
          >
            <div>
              <div className="text-[11px] font-bold uppercase tracking-[0.06em] text-[#9CA3AF] mb-1">
                PROSPEK TERVERIFIKASI SEMALAM
              </div>
              <div className="text-[40px] font-light leading-[48px] text-[#111827] tabular-nums">
                18
              </div>
            </div>
            <div className="mt-3 pt-3 border-t border-[#F3F4F6] flex items-center justify-between text-[12px] text-[#6B7280]">
              <span>dari target 25</span>
              <span className="text-[#B42318] font-medium">4 ditolak validator</span>
            </div>
          </div>

          {/* Card 3 */}
          <div 
            onClick={() => onNavigate('biaya-kapasitas')}
            className="p-5 bg-white rounded-xl border border-[#E5E7EB] hover:border-[#2563EB]/40 transition-colors cursor-pointer group flex flex-col justify-between"
          >
            <div>
              <div className="text-[11px] font-bold uppercase tracking-[0.06em] text-[#9CA3AF] mb-1">
                BIAYA RISET / PROSPEK
              </div>
              <div className="text-[40px] font-light leading-[48px] text-[#111827] tabular-nums">
                Rp1.240
              </div>
            </div>
            <div className="mt-3 pt-3 border-t border-[#F3F4F6] flex items-center justify-between text-[12px] text-[#6B7280]">
              <span>DeepSeek Flash</span>
              <span className="text-[#027A48] font-medium">92% off-peak</span>
            </div>
          </div>

          {/* Card 4 */}
          <div 
            onClick={onOpenJedaModal}
            className="p-5 bg-white rounded-xl border border-[#E5E7EB] hover:border-[#2563EB]/40 transition-colors cursor-pointer group flex flex-col justify-between"
          >
            <div>
              <div className="text-[11px] font-bold uppercase tracking-[0.06em] text-[#9CA3AF] mb-1">
                OUTBOUND HARI INI
              </div>
              <div className="text-[40px] font-light leading-[48px] text-[#111827] tabular-nums">
                0
              </div>
            </div>
            <div className="mt-3 pt-3 border-t border-[#F3F4F6] flex items-center justify-between text-[12px]">
              <span className="text-[#6B7280]">batas 20</span>
              <StatusPill variant={isPaused ? 'red' : 'green'} dot>
                {isPaused ? 'pengiriman dijeda' : 'siap kirim 09:00'}
              </StatusPill>
            </div>
          </div>
        </div>

        {/* 2-Column Split: Main column & Right rail */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Main Column (8 cols) */}
          <div className="lg:col-span-8 space-y-6">
            {/* Section: "Butuh kamu" */}
            <div className="bg-white rounded-xl border border-[#E5E7EB] overflow-hidden">
              <div className="p-4 px-5 border-b border-[#E5E7EB] flex items-center justify-between bg-[#F9FAFB]">
                <div className="flex items-center gap-2">
                  <h2 className="text-[16px] font-semibold text-[#111827]">
                    Butuh kamu
                  </h2>
                  <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-[#FFFAEB] text-[#B54708] border border-[#FEDF89]">
                    5 antrean
                  </span>
                </div>
                <span className="text-[12px] text-[#6B7280]">
                  Satu klik per keputusan
                </span>
              </div>

              <div className="divide-y divide-[#E5E7EB]">
                {/* Row 1 */}
                <div className="p-4 flex items-center justify-between hover:bg-[#F9FAFB] transition-colors gap-4">
                  <div className="flex items-center gap-3 min-w-0">
                    <ActorAvatar actor="candra" size={32} name="Candra" />
                    <div className="min-w-0">
                      <p className="text-[14px] font-medium text-[#111827] truncate">
                        {waitingDecisionsCount} draft menunggu persetujuan
                      </p>
                      <p className="text-[12px] text-[#9CA3AF]">
                        Disusun oleh Candra · Tertua 14 jam lalu
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => onNavigate('keputusan')}
                    className="shrink-0 px-3.5 py-1.5 bg-[#111827] text-white text-[13px] font-medium rounded-lg hover:bg-[#1F2937] transition-colors"
                  >
                    Tinjau
                  </button>
                </div>

                {/* Row 2 */}
                <div className="p-4 flex items-center justify-between hover:bg-[#F9FAFB] transition-colors gap-4">
                  <div className="flex items-center gap-3 min-w-0">
                    <ActorAvatar actor="candra" size={32} name="Candra" />
                    <div className="min-w-0">
                      <p className="text-[14px] font-medium text-[#111827] truncate">
                        Candra mengeskalasi: Villa Teratai Ubud menanyakan harga paket
                      </p>
                      <p className="text-[12px] text-[#9CA3AF]">
                        23 menit lalu · Permintaan diskon multi-properti
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => onNavigate('percakapan', 'conv-1')}
                    className="shrink-0 px-3.5 py-1.5 bg-white border border-[#E5E7EB] text-[#111827] text-[13px] font-medium rounded-lg hover:bg-[#F3F4F6] transition-colors"
                  >
                    Buka percakapan
                  </button>
                </div>

                {/* Row 3 */}
                <div className="p-4 flex items-center justify-between hover:bg-[#F9FAFB] transition-colors gap-4">
                  <div className="flex items-center gap-3 min-w-0">
                    <ActorAvatar actor="worker-pc" size={32} name="Worker PC-1" />
                    <div className="min-w-0">
                      <p className="text-[14px] font-medium text-[#111827] truncate">
                        Task riset Rumah Gigi Sanur terblokir: nomor tidak cocok dengan Google Maps
                      </p>
                      <p className="text-[12px] text-[#9CA3AF]">
                        Pemilik langkah: Candra · Verifikasi kontak
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => onNavigate('pipeline', 'pipe-blk-1')}
                    className="shrink-0 px-3.5 py-1.5 bg-white border border-[#E5E7EB] text-[#111827] text-[13px] font-medium rounded-lg hover:bg-[#F3F4F6] transition-colors"
                  >
                    Lihat
                  </button>
                </div>

                {/* Row 4 */}
                <div className="p-4 flex items-center justify-between hover:bg-[#F9FAFB] transition-colors gap-4">
                  <div className="flex items-center gap-3 min-w-0">
                    <ActorAvatar actor="angga" size={32} name="Angga" />
                    <div className="min-w-0">
                      <p className="text-[14px] font-medium text-[#111827] truncate">
                        WhatsApp Profil Candra terputus sejak 02:14 · tiket ke Angga dibuka
                      </p>
                      <p className="text-[12px] text-[#9CA3AF]">
                        Tiket #31 · Perlu restart Baileys / QR scan
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => onNavigate('tim-agen')}
                    className="shrink-0 px-3.5 py-1.5 bg-white border border-[#E5E7EB] text-[#111827] text-[13px] font-medium rounded-lg hover:bg-[#F3F4F6] transition-colors"
                  >
                    Detail
                  </button>
                </div>

                {/* Row 5 */}
                <div className="p-4 flex items-center justify-between hover:bg-[#F9FAFB] transition-colors gap-4">
                  <div className="flex items-center gap-3 min-w-0">
                    <ActorAvatar actor="irfan" size={32} name="Irfan" />
                    <div className="min-w-0">
                      <p className="text-[14px] font-medium text-[#111827] truncate">
                        Pengiriman dijeda oleh Irfan kemarin 17:05
                      </p>
                      <p className="text-[12px] text-[#9CA3AF]">
                        Semua pesan tertahan di outbox sampai jeda dicabut
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={onOpenJedaModal}
                    className="shrink-0 px-3.5 py-1.5 bg-white border border-[#E5E7EB] text-[#111827] text-[13px] font-medium rounded-lg hover:bg-[#F3F4F6] transition-colors"
                  >
                    Tinjau jeda
                  </button>
                </div>
              </div>
            </div>

            {/* Section: Batch aktif · Klinik estetika Denpasar (Funnel strip) */}
            <div className="bg-white rounded-xl border border-[#E5E7EB] p-5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
                <div>
                  <div className="text-[11px] font-bold uppercase tracking-[0.06em] text-[#9CA3AF]">
                    PIPELINE BATCH AKTIF
                  </div>
                  <h3 className="text-[16px] font-semibold text-[#111827]">
                    Batch #14 · Klinik estetika Denpasar
                  </h3>
                </div>
                <button
                  onClick={() => onNavigate('pipeline')}
                  className="inline-flex items-center gap-1 text-[13px] font-medium text-[#2563EB] hover:underline"
                >
                  Buka papan kanban <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Horizontal Funnel Strip */}
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
                {[
                  { label: 'Antre', count: 3, color: 'text-[#6B7280]', bg: 'bg-[#F9FAFB]' },
                  { label: 'Berjalan', count: 2, color: 'text-[#5925DC]', bg: 'bg-[#F4F3FF]' },
                  { label: 'Diterima', count: 18, color: 'text-[#027A48]', bg: 'bg-[#ECFDF3]' },
                  { label: 'Draft', count: 7, color: 'text-[#B54708]', bg: 'bg-[#FFFAEB]' },
                  { label: 'Disetujui', count: 0, color: 'text-[#111827]', bg: 'bg-[#F3F4F6]' },
                  { label: 'Terkirim', count: 0, color: 'text-[#6B7280]', bg: 'bg-[#F9FAFB]' },
                ].map((step, idx) => (
                  <div
                    key={idx}
                    className={`p-3 rounded-lg border border-[#E5E7EB] ${step.bg} text-center`}
                  >
                    <div className="text-[11px] font-medium uppercase text-[#6B7280]">
                      {step.label}
                    </div>
                    <div className={`text-[20px] font-semibold tabular-nums mt-0.5 ${step.color}`}>
                      {step.count}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right Rail 320px: "Aktivitas semalam" */}
          <div className="lg:col-span-4">
            <div className="bg-white rounded-xl border border-[#E5E7EB] p-5 h-full">
              <div className="text-[11px] font-bold uppercase tracking-[0.06em] text-[#9CA3AF] mb-1">
                TIMELINE OPERASI
              </div>
              <h3 className="text-[16px] font-semibold text-[#111827] mb-4">
                Aktivitas semalam
              </h3>

              <div className="relative pl-5 space-y-5 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-[1px] before:bg-[#E5E7EB]">
                {/* Entry 1: Worker PC-1 */}
                <div className="relative">
                  <span className="absolute -left-[17px] top-1.5 w-2 h-2 rounded-full bg-[#7A5AF8] ring-4 ring-white" />
                  <p className="text-[13px] font-medium text-[#111827] leading-snug">
                    Worker PC-1 menyelesaikan 18 riset
                  </p>
                  <p className="text-[12px] text-[#9CA3AF] mt-0.5 font-mono">
                    05:40 WITA · Batch #14
                  </p>
                </div>

                {/* Entry 2: Candra */}
                <div className="relative">
                  <span className="absolute -left-[17px] top-1.5 w-2 h-2 rounded-full bg-[#2563EB] ring-4 ring-white" />
                  <p className="text-[13px] font-medium text-[#111827] leading-snug">
                    Candra menilai 18 hasil, 7 jadi draft
                  </p>
                  <p className="text-[12px] text-[#9CA3AF] mt-0.5 font-mono">
                    07:10 WITA · Skor rata-rata 8.4
                  </p>
                </div>

                {/* Entry 3: Validator */}
                <div className="relative">
                  <span className="absolute -left-[17px] top-1.5 w-2 h-2 rounded-full bg-[#9CA3AF] ring-4 ring-white" />
                  <p className="text-[13px] font-medium text-[#111827] leading-snug">
                    Validator menolak 4 hasil: bukti &gt; 7 hari
                  </p>
                  <p className="text-[12px] text-[#9CA3AF] mt-0.5 font-mono">
                    05:52 WITA · Filter integritas
                  </p>
                </div>

                {/* Entry 4: Angga */}
                <div className="relative">
                  <span className="absolute -left-[17px] top-1.5 w-2 h-2 rounded-full bg-[#0E9384] ring-4 ring-white" />
                  <p className="text-[13px] font-medium text-[#111827] leading-snug">
                    Angga me-restart browser PC
                  </p>
                  <p className="text-[12px] text-[#9CA3AF] mt-0.5 font-mono">
                    01:30 WITA · Cleanup RAM Chromium
                  </p>
                </div>
              </div>

              <div className="mt-6 pt-4 border-t border-[#E5E7EB] space-y-2">
                <div className="text-[11px] font-bold uppercase tracking-[0.06em] text-[#9CA3AF]">
                  INFRASTRUKTUR SEMALAM
                </div>
                <div className="text-[12px] text-[#6B7280] flex items-center justify-between">
                  <span>Server VPS</span>
                  <span className="font-mono text-[#027A48]">Load 0.24 · OK</span>
                </div>
                <div className="text-[12px] text-[#6B7280] flex items-center justify-between">
                  <span>PC Riset Lokal</span>
                  <span className="font-mono text-[#027A48]">Uptime 18j · OK</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
