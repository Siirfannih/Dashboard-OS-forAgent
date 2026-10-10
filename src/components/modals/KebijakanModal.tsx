import React from 'react';
import { X, Shield, Clock, AlertCircle } from 'lucide-react';

interface KebijakanModalProps {
  isOpen: boolean;
  onClose: () => void;
  isPaused: boolean;
  onTogglePause: () => void;
}

export function KebijakanModal({ isOpen, onClose, isPaused, onTogglePause }: KebijakanModalProps) {
  if (!isOpen) return null;

  const policies = [
    {
      name: 'Jadwal Riset Malam',
      value: '20:00 – 07:30 WITA',
      impact: 'Worker PC-1 berjalan otomatis saat tarif listrik off-peak dan latency API DeepSeek optimal.',
    },
    {
      name: 'Window Review Founder (Irfan)',
      value: '07:30 – 09:00 WITA',
      impact: 'Founder meninjau draft sebelum jam outbound dimulai; approval durable mengikat versi dan pengirim.',
    },
    {
      name: 'Jadwal Outbound Pesan WhatsApp',
      value: '09:00 – 17:00 WITA',
      impact: 'Pesan hanya dikirim pada jam kerja normal bisnis Bali agar tidak mengganggu jam istirahat prospek.',
    },
    {
      name: 'Batas Pengiriman Harian',
      value: '20 pesan / profil / hari',
      impact: 'Pencegahan deteksi otomatis anti-spam WhatsApp Baileys pada profil WhatsApp nomor resmi.',
    },
    {
      name: 'Batas Usia Bukti Riset (Freshness)',
      value: 'Maksimal 24 jam',
      impact: 'Validator otomatis menolak hasil riset yang bukti link atau nomor teleponnya berusia >24 jam.',
    },
    {
      name: 'Masa Berlaku Approval Founder',
      value: 'Maksimal 48 jam',
      impact: 'Draft yang disetujui lebih dari 48 jam lalu wajib diverifikasi ulang sebelum masuk antrean outbox.',
    },
    {
      name: 'Balasan Percakapan Otomatis',
      value: 'Terkunci (Belum ada kebijakan tertulis)',
      impact: 'Candra hanya boleh mengeskalasi pertanyaan harga & komitmen ke Irfan; dilarang memberi komitmen mandiri.',
    },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
      <div 
        className="bg-white rounded-xl border border-[#E5E7EB] w-full max-w-[640px] max-h-[85vh] flex flex-col shadow-2xl animate-in fade-in zoom-in-95 duration-150"
        role="dialog"
        aria-modal="true"
      >
        <div className="p-6 border-b border-[#E5E7EB] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-[#EFF8FF] flex items-center justify-center text-[#2563EB]">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <div className="text-[11px] font-bold uppercase tracking-[0.06em] text-[#9CA3AF]">
                OPERASI & KEPATUHAN
              </div>
              <h2 className="text-[18px] font-semibold text-[#111827]">
                Kebijakan Operasional Sales
              </h2>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-[#9CA3AF] hover:text-[#111827] p-1.5 rounded-lg transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto space-y-4">
          <div className="p-3.5 bg-[#FEF3F2] border border-[#FECDCA] rounded-lg flex items-center justify-between">
            <div className="flex items-center gap-3">
              <AlertCircle className="w-5 h-5 text-[#B42318] shrink-0" />
              <div>
                <p className="text-[13px] font-semibold text-[#B42318]">
                  Kontrol Darurat: Jeda Semua Pengiriman
                </p>
                <p className="text-[12px] text-[#B42318]/80">
                  {isPaused ? 'Pengiriman saat ini DIJEDA oleh Irfan.' : 'Pengiriman saat ini AKTIF.'}
                </p>
              </div>
            </div>
            <button
              onClick={onTogglePause}
              className={`px-3 py-1.5 text-[12px] font-semibold rounded-lg transition-colors ${
                isPaused
                  ? 'bg-[#111827] text-white hover:bg-[#1F2937]'
                  : 'bg-[#B42318] text-white hover:bg-[#991B1B]'
              }`}
            >
              {isPaused ? 'Aktifkan Outbound' : 'Jeda Outbound'}
            </button>
          </div>

          <div className="space-y-3">
            {policies.map((pol, idx) => (
              <div
                key={idx}
                className="p-3.5 rounded-lg border border-[#E5E7EB] bg-[#F9FAFB] hover:bg-white transition-colors space-y-1"
              >
                <div className="flex items-center justify-between">
                  <span className="text-[14px] font-medium text-[#111827]">
                    {pol.name}
                  </span>
                  <span className="text-[13px] font-mono font-medium text-[#2563EB]">
                    {pol.value}
                  </span>
                </div>
                <p className="text-[12px] text-[#6B7280] leading-relaxed">
                  {pol.impact}
                </p>
              </div>
            ))}
          </div>
        </div>

        <div className="p-4 border-t border-[#E5E7EB] bg-[#F9FAFB] flex items-center justify-between text-[12px] text-[#6B7280]">
          <span className="flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5" />
            Terakhir diselaraskan: 8 Okt 2026 · 07:00 WITA
          </span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 text-[13px] font-medium text-[#111827] bg-white border border-[#E5E7EB] rounded-lg hover:bg-[#F3F4F6] transition-colors"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
}
