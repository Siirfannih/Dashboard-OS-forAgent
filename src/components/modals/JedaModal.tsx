import React from 'react';
import { AlertTriangle, X, Play, Clock, ShieldAlert } from 'lucide-react';
import { StatusPill } from '../common/Pill';

interface JedaModalProps {
  isOpen: boolean;
  onClose: () => void;
  isPaused: boolean;
  onTogglePause: () => void;
}

export function JedaModal({ isOpen, onClose, isPaused, onTogglePause }: JedaModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
      <div 
        className="bg-white rounded-xl border border-[#E5E7EB] w-full max-w-[520px] p-6 shadow-xl relative animate-in fade-in zoom-in-95 duration-150"
        role="dialog"
        aria-modal="true"
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-[#9CA3AF] hover:text-[#111827] p-1 rounded-lg transition-colors"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-full bg-[#FEF3F2] flex items-center justify-center text-[#B42318] shrink-0">
            <AlertTriangle className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[11px] font-bold uppercase tracking-[0.06em] text-[#9CA3AF]">
              KONTROL OPERASIONAL SALES
            </div>
            <h2 className="text-[18px] font-semibold text-[#111827]">
              Status Pengiriman WhatsApp Outbound
            </h2>
          </div>
        </div>

        <div className="space-y-4 text-[14px]">
          <div className="p-3.5 bg-[#F9FAFB] rounded-lg border border-[#E5E7EB] space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[#6B7280]">Status saat ini:</span>
              <StatusPill variant={isPaused ? 'red' : 'green'}>
                {isPaused ? 'Pengiriman: Dijeda' : 'Pengiriman: Aktif'}
              </StatusPill>
            </div>
            <div className="flex items-center justify-between text-[13px]">
              <span className="text-[#6B7280]">Pelaku & Waktu:</span>
              <span className="font-medium text-[#111827]">
                {isPaused ? 'Irfan · Kemarin 17:05 WITA' : 'Irfan · Hari ini'}
              </span>
            </div>
            <div className="flex items-center justify-between text-[13px]">
              <span className="text-[#6B7280]">Draft menunggu di antrean:</span>
              <span className="font-mono font-medium text-[#111827]">7 draft disiapkan</span>
            </div>
          </div>

          <div className="space-y-2.5">
            <h3 className="text-[14px] font-semibold text-[#111827]">
              Dampak Operasional
            </h3>
            <ul className="text-[13px] text-[#6B7280] space-y-2">
              <li className="flex items-start gap-2">
                <ShieldAlert className="w-4 h-4 text-[#B54708] shrink-0 mt-0.5" />
                <span>
                  <strong>Pencegahan Banned:</strong> Menjeda pengiriman mencegah nomor WhatsApp terkena deteksi spam saat pergantian shift atau kuota limit terlampaui.
                </span>
              </li>
              <li className="flex items-start gap-2">
                <Clock className="w-4 h-4 text-[#2563EB] shrink-0 mt-0.5" />
                <span>
                  <strong>Jadwal Outbound Resmi:</strong> Pengiriman otomatis hanya boleh berjalan pada window <strong>09:00–17:00 WITA</strong> setelah review founder disetujui.
                </span>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-6 pt-4 border-t border-[#E5E7EB] flex items-center justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-[14px] font-medium text-[#6B7280] hover:text-[#111827] rounded-lg transition-colors"
          >
            Tutup
          </button>
          <button
            onClick={() => {
              onTogglePause();
              onClose();
            }}
            className={`flex items-center gap-2 px-4 py-2 text-[14px] font-medium text-white rounded-lg transition-colors ${
              isPaused ? 'bg-[#111827] hover:bg-[#1F2937]' : 'bg-[#B42318] hover:bg-[#991B1B]'
            }`}
          >
            {isPaused ? (
              <>
                <Play className="w-4 h-4" />
                <span>Lanjutkan Pengiriman (Aktifkan)</span>
              </>
            ) : (
              <>
                <AlertTriangle className="w-4 h-4" />
                <span>Jeda Seluruh Pengiriman</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
