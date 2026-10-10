import React from 'react';
import { 
  DollarSign, 
  Cpu, 
  ShieldCheck, 
  HelpCircle, 
  Zap, 
  Layers, 
  FileCheck2, 
  AlertTriangle,
  RotateCcw
} from 'lucide-react';
import { EFFICIENCY_METRICS, BATCH_PERFORMANCE } from '../../data/mockData';
import { StatusPill } from '../common/Pill';

export function BiayaKapasitas() {
  const budgetSpent = 18400;
  const budgetMax = 40000;
  const budgetPct = Math.round((budgetSpent / budgetMax) * 100);

  return (
    <div className="flex-1 overflow-y-auto p-6 space-y-8 bg-[#F9FAFB]">
      <div className="max-w-[1200px] mx-auto space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-[24px] font-semibold text-[#111827]">
            Biaya &amp; Kapasitas Model AI
          </h1>
          <p className="text-[13px] text-[#6B7280]">
            Monitoring efisiensi komputasi terpisah: ChatGPT pada VPS vs DeepSeek pada PC lokal
          </p>
        </div>

        {/* Rule Notice */}
        <div className="p-3 bg-white rounded-lg border border-[#E5E7EB] text-[12px] text-[#6B7280] flex items-center justify-between">
          <span>
            ⚠️ <strong>Prinsip Akuntansi AI:</strong> Biaya fixed subscription VPS ChatGPT dan API per-token DeepSeek worker dipisahkan sepenuhnya; tidak pernah digabung menjadi satu angka total.
          </span>
          <span className="font-mono text-[#9CA3AF]">Periode: Oktober 2026</span>
        </div>

        {/* Two Side-by-Side Panels of Equal Width */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Panel 1: Paket ChatGPT · VPS (Candra) */}
          <div className="bg-white rounded-xl border border-[#E5E7EB] p-5 space-y-4">
            <div className="flex items-start justify-between">
              <div>
                <div className="text-[11px] font-bold uppercase tracking-[0.06em] text-[#9CA3AF]">
                  SUBSCRIPTION · FIXED VPS
                </div>
                <h2 className="text-[18px] font-semibold text-[#111827]">
                  Paket ChatGPT · VPS (Candra)
                </h2>
              </div>
              <StatusPill variant="purple">GPT-4o (Chat)</StatusPill>
            </div>

            <p className="text-[13px] text-[#6B7280]">
              Digunakan untuk scoring kelayakan prospek, penyusunan draft 3-bubble WhatsApp, dan eskalasi percakapan.
            </p>

            <div className="grid grid-cols-2 gap-3 pt-2">
              <div className="p-3 bg-[#F9FAFB] rounded-lg border border-[#E5E7EB]">
                <div className="text-[11px] text-[#6B7280]">Panggilan hari ini</div>
                <div className="text-[24px] font-light text-[#111827] tabular-nums mt-0.5">
                  46
                </div>
                <div className="text-[11px] text-[#9CA3AF] mt-1">interaksi API</div>
              </div>

              <div className="p-3 bg-[#F9FAFB] rounded-lg border border-[#E5E7EB]">
                <div className="text-[11px] text-[#6B7280]">Rata-rata konteks</div>
                <div className="text-[24px] font-light text-[#111827] tabular-nums mt-0.5">
                  7,2 rb
                </div>
                <div className="text-[11px] text-[#9CA3AF] mt-1">token / panggilan</div>
              </div>

              <div className="p-3 bg-[#F9FAFB] rounded-lg border border-[#E5E7EB]">
                <div className="text-[11px] text-[#6B7280]">Menunggu kuota</div>
                <div className="text-[24px] font-light text-[#027A48] tabular-nums mt-0.5">
                  0
                </div>
                <div className="text-[11px] text-[#9CA3AF] mt-1">antrean rate-limit</div>
              </div>

              <div className="p-3 bg-[#F9FAFB] rounded-lg border border-[#E5E7EB] flex flex-col justify-between">
                <div>
                  <div className="text-[11px] text-[#6B7280]">Sisa limit kuota</div>
                  <div className="mt-1">
                    <StatusPill
                      variant="unknown"
                      dot={false}
                      tooltip="Provider tidak mengirim data ini"
                    >
                      Tidak diketahui
                    </StatusPill>
                  </div>
                </div>
                <p className="text-[10px] text-[#6B7280] italic mt-1">
                  Provider tidak mengirim data ini
                </p>
              </div>
            </div>
          </div>

          {/* Panel 2: DeepSeek · PC (Worker) */}
          <div className="bg-white rounded-xl border border-[#E5E7EB] p-5 space-y-4">
            <div className="flex items-start justify-between">
              <div>
                <div className="text-[11px] font-bold uppercase tracking-[0.06em] text-[#9CA3AF]">
                  PAY-PER-TOKEN · LOCAL PC
                </div>
                <h2 className="text-[18px] font-semibold text-[#111827]">
                  DeepSeek · PC (Worker)
                </h2>
              </div>
              <StatusPill variant="green">Worker PC-1</StatusPill>
            </div>

            <p className="text-[13px] text-[#6B7280]">
              Digunakan untuk scraping semalam, parsing HTML website klinik, verifikasi dokumen, dan validasi jam operasional.
            </p>

            {/* Budget Progress Bar */}
            <div className="p-3.5 bg-[#F9FAFB] rounded-lg border border-[#E5E7EB] space-y-2">
              <div className="flex items-center justify-between text-[13px]">
                <span className="text-[#6B7280]">Pengeluaran hari ini:</span>
                <span className="font-mono font-semibold text-[#111827]">
                  Rp18.400 <span className="text-[#9CA3AF] font-normal">/ batas Rp40.000</span>
                </span>
              </div>
              <div className="w-full h-2.5 rounded-full bg-[#E5E7EB] overflow-hidden">
                <div
                  style={{ width: `${budgetPct}%` }}
                  className="h-full bg-[#2563EB] rounded-full transition-all"
                />
              </div>
              <div className="flex items-center justify-between text-[11px] text-[#9CA3AF] font-mono">
                <span>Model: Flash</span>
                <span>{budgetPct}% dari pagu harian</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 pt-1">
              <div className="p-3 bg-[#F9FAFB] rounded-lg border border-[#E5E7EB]">
                <div className="text-[11px] text-[#6B7280]">Cache hit</div>
                <div className="text-[24px] font-light text-[#027A48] tabular-nums mt-0.5">
                  63%
                </div>
                <div className="text-[11px] text-[#9CA3AF] mt-1">prompt cache reuse</div>
              </div>

              <div className="p-3 bg-[#F9FAFB] rounded-lg border border-[#E5E7EB]">
                <div className="text-[11px] text-[#6B7280]">Off-peak window</div>
                <div className="text-[24px] font-light text-[#027A48] tabular-nums mt-0.5">
                  92%
                </div>
                <div className="text-[11px] text-[#9CA3AF] mt-1">dijalankan 20:00–07:30</div>
              </div>
            </div>
          </div>
        </div>

        {/* Row of 5 Small Efficiency Cards */}
        <div className="space-y-3">
          <div className="text-[11px] font-bold uppercase tracking-[0.06em] text-[#9CA3AF]">
            METRIK EFISIENSI &amp; PENGHEMATAN
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
            {[
              {
                label: 'Pekerjaan duplikat dicegah',
                value: EFFICIENCY_METRICS.duplicatePrevented,
                desc: 'deduplikasi hash data',
              },
              {
                label: 'Hasil dipakai ulang',
                value: EFFICIENCY_METRICS.resultsReused,
                desc: 'cache hasil <24 jam',
              },
              {
                label: 'Retry / rework',
                value: EFFICIENCY_METRICS.retryRework,
                desc: 'hanya delta yang diulang',
              },
              {
                label: 'Bukti stale',
                value: EFFICIENCY_METRICS.staleEvidence,
                desc: 'dibuang sebelum draft',
              },
              {
                label: 'Klaim palsu terdeteksi',
                value: EFFICIENCY_METRICS.falseClaimsDetected,
                desc: 'filter validator KKI',
              },
            ].map((card, idx) => (
              <div
                key={idx}
                className="p-3.5 bg-white rounded-xl border border-[#E5E7EB] flex flex-col justify-between"
              >
                <div className="text-[12px] font-medium text-[#6B7280] leading-snug">
                  {card.label}
                </div>
                <div className="mt-2">
                  <div className="text-[28px] font-light text-[#111827] tabular-nums">
                    {card.value}
                  </div>
                  <div className="text-[11px] text-[#9CA3AF] mt-0.5">{card.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Table: Per batch */}
        <div className="bg-white rounded-xl border border-[#E5E7EB] overflow-hidden">
          <div className="p-4 px-5 border-b border-[#E5E7EB] bg-[#F9FAFB] flex items-center justify-between">
            <div>
              <div className="text-[11px] font-bold uppercase tracking-[0.06em] text-[#9CA3AF]">
                ANALISIS UNIT EKONOMI
              </div>
              <h2 className="text-[16px] font-semibold text-[#111827]">
                Performa &amp; Biaya Per Batch
              </h2>
            </div>
            <span className="text-[12px] text-[#6B7280]">
              Diurutkan dari batch terbaru
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-[13px] border-collapse min-w-[580px]">
              <thead>
                <tr className="border-b border-[#E5E7EB] text-[#6B7280] bg-[#F9FAFB]/50 text-[12px]">
                  <th className="py-3 px-4 font-medium">Batch</th>
                  <th className="py-3 px-4 font-medium">Prospek Terverifikasi</th>
                  <th className="py-3 px-4 font-medium">Biaya / Prospek</th>
                  <th className="py-3 px-4 font-medium">Approval Rate</th>
                  <th className="py-3 px-4 font-medium">Waktu Review Owner</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E5E7EB]">
                {BATCH_PERFORMANCE.map((b, idx) => (
                  <tr key={idx} className="hover:bg-[#F9FAFB] transition-colors">
                    <td className="py-3 px-4 font-medium text-[#111827]">
                      {b.batch}
                    </td>
                    <td className="py-3 px-4 font-mono">
                      {b.verifiedProspects} prospek
                    </td>
                    <td className="py-3 px-4 font-mono text-[#027A48] font-semibold">
                      {b.costPerProspect}
                    </td>
                    <td className="py-3 px-4 font-mono font-medium text-[#111827]">
                      {b.approvalRate}
                    </td>
                    <td className="py-3 px-4 text-[#6B7280] font-mono">
                      {b.reviewTimeOwner}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Separate Small Row Below Table: Engineering (Angga) */}
          <div className="p-3.5 bg-[#F9FAFB] border-t border-[#E5E7EB] flex items-center justify-between text-[12px]">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[#0E9384]" />
              <span className="font-semibold text-[#111827]">Engineering (Angga)</span>
              <span className="text-[#6B7280]">
                · Biaya pemeliharaan server, browser automation, dan tiket #31
              </span>
            </div>
            <div className="font-mono font-semibold text-[#0E9384]">
              Rp4.800 <span className="text-[#9CA3AF] font-normal">(terpisah dari pipeline sales)</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
