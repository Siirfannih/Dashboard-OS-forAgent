import React, { useState } from 'react';
import { 
  Check, 
  ChevronDown, 
  ChevronUp, 
  ChevronLeft, 
  ChevronRight, 
  AlertTriangle, 
  X, 
  CheckCircle2, 
  HelpCircle,
  ExternalLink
} from 'lucide-react';
import { DecisionItem } from '../../types';
import { StatusPill, LeadPill, ActorAvatar } from '../common/Pill';

interface MobileKeputusanProps {
  items: DecisionItem[];
  onApprove: (id: string) => void;
  onReject: (id: string, reason: string, scope: string, tags: string[]) => void;
  isPaused: boolean;
  onOpenJedaModal: () => void;
}

export function MobileKeputusan({
  items,
  onApprove,
  onReject,
  isPaused,
  onOpenJedaModal,
}: MobileKeputusanProps) {
  const waitingItems = items.filter((i) => i.status === 'menunggu');
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isChecklistExpanded, setIsChecklistExpanded] = useState(false);
  const [isBuktiExpanded, setIsBuktiExpanded] = useState(false);
  const [isRejectOpen, setIsRejectOpen] = useState(false);
  const [rejectType, setRejectType] = useState('Revisi draft');
  const [rejectReason, setRejectReason] = useState('');
  const [selectedChips, setSelectedChips] = useState<string[]>([]);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const currentItem = waitingItems[currentIndex] || waitingItems[0];

  const handleNext = () => {
    if (currentIndex < waitingItems.length - 1) {
      setCurrentIndex((prev) => prev + 1);
      setIsRejectOpen(false);
    }
  };

  const handlePrev = () => {
    if (currentIndex > 0) {
      setCurrentIndex((prev) => prev - 1);
      setIsRejectOpen(false);
    }
  };

  const handleApprove = () => {
    if (!currentItem) return;
    onApprove(currentItem.id);
    setToastMessage(`Disetujui: ${currentItem.businessName}`);
    setTimeout(() => setToastMessage(null), 2500);
    if (currentIndex >= waitingItems.length - 1 && currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
    }
  };

  const handleReject = () => {
    if (!currentItem || !rejectReason.trim()) {
      alert('Mohon isi alasan revisi/penolakan.');
      return;
    }
    onReject(currentItem.id, rejectReason, rejectType, selectedChips);
    setToastMessage(`Ditolak/Revisi: ${currentItem.businessName}`);
    setTimeout(() => setToastMessage(null), 2500);
    setIsRejectOpen(false);
    setRejectReason('');
    setSelectedChips([]);
    if (currentIndex >= waitingItems.length - 1 && currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
    }
  };

  if (!currentItem) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-6 text-center bg-[#F9FAFB]">
        <div className="w-12 h-12 rounded-full bg-[#ECFDF3] text-[#027A48] flex items-center justify-center mb-3">
          <Check className="w-6 h-6 stroke-[2.5]" />
        </div>
        <h3 className="text-[18px] font-semibold text-[#111827]">
          Semua draft telah ditinjau!
        </h3>
        <p className="text-[13px] text-[#6B7280] mt-1 max-w-[280px]">
          Tidak ada draft menunggu persetujuan founder. Batch riset berikutnya akan dimulai pukul 20:00 WITA.
        </p>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col h-full bg-[#F9FAFB] overflow-hidden relative max-w-[440px] mx-auto border-x border-[#E5E7EB] shadow-sm">
      {/* Toast */}
      {toastMessage && (
        <div className="absolute top-12 left-4 right-4 z-50 bg-[#111827] text-white text-[13px] p-2.5 rounded-lg shadow-xl text-center">
          {toastMessage}
        </div>
      )}

      {/* Top: Compact status strip horizontally scrollable */}
      <div className="px-3 py-2 bg-white border-b border-[#E5E7EB] shrink-0">
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-0.5">
          <button onClick={onOpenJedaModal} className="shrink-0">
            <StatusPill variant={isPaused ? 'red' : 'green'}>
              {isPaused ? 'Pengiriman: Dijeda' : 'Pengiriman: Aktif'}
            </StatusPill>
          </button>
          <div className="shrink-0">
            <StatusPill variant="amber">WhatsApp 1/2 tersambung</StatusPill>
          </div>
          <div className="shrink-0">
            <StatusPill variant="purple">PC: Riset berjalan</StatusPill>
          </div>
        </div>
      </div>

      {/* Main Single Draft Card (Full-Screen Card scrollable) */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* Card Header */}
        <div className="bg-white rounded-xl border border-[#E5E7EB] p-4 space-y-3">
          <div className="flex items-start justify-between gap-2">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <LeadPill label={currentItem.leadLabel} />
                <StatusPill
                  variant={currentItem.evidenceAgeHours <= 6 ? 'green' : 'amber'}
                  dot
                >
                  Bukti {currentItem.evidenceAgeHours} jam
                </StatusPill>
              </div>
              <h2 className="text-[18px] font-semibold text-[#111827] leading-tight">
                {currentItem.businessName}
              </h2>
            </div>
            <span className="text-[11px] font-mono font-medium text-[#B54708] bg-[#FFFAEB] px-2 py-0.5 rounded-full shrink-0">
              habis {currentItem.expiresInHours}j
            </span>
          </div>

          <div className="text-[13px] text-[#6B7280]">
            <div>{currentItem.segment}</div>
            <div className="font-mono text-[#111827] mt-0.5">{currentItem.phoneMasked}</div>
          </div>

          <div className="pt-2 border-t border-[#F3F4F6] flex items-center justify-between text-[11px] text-[#6B7280]">
            <span className="font-mono">Draft {currentItem.version} · {currentItem.versionHash}</span>
            <span>{currentItem.senderProfile}</span>
          </div>

          {/* "Kenapa layak" collapsed to one line ("5/5 lolos" expandable) */}
          <div className="pt-1">
            <button
              onClick={() => setIsChecklistExpanded(!isChecklistExpanded)}
              className="w-full flex items-center justify-between p-2 rounded-lg bg-[#F9FAFB] border border-[#E5E7EB] text-[13px]"
            >
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded-full bg-[#ECFDF3] text-[#027A48] flex items-center justify-center">
                  <Check className="w-3 h-3 stroke-[3]" />
                </div>
                <span className="font-medium text-[#111827]">Kenapa layak</span>
                <span className="text-[12px] text-[#027A48] font-semibold">5/5 lolos</span>
              </div>
              {isChecklistExpanded ? (
                <ChevronUp className="w-4 h-4 text-[#9CA3AF]" />
              ) : (
                <ChevronDown className="w-4 h-4 text-[#9CA3AF]" />
              )}
            </button>

            {isChecklistExpanded && (
              <div className="mt-2 p-2.5 rounded-lg border border-[#E5E7EB] bg-white space-y-1.5 text-[12px]">
                <div className="flex items-center gap-2 text-[#111827]">
                  <Check className="w-3.5 h-3.5 text-[#027A48]" />
                  <span>Identitas cocok Google Maps</span>
                </div>
                <div className="flex items-center gap-2 text-[#111827]">
                  <Check className="w-3.5 h-3.5 text-[#027A48]" />
                  <span>Nomor cocok website resmi</span>
                </div>
                <div className="flex items-center gap-2 text-[#111827]">
                  <Check className="w-3.5 h-3.5 text-[#027A48]" />
                  <span>Bukan DNC atau ambil alih</span>
                </div>
                <div className="flex items-center gap-2 text-[#111827]">
                  <Check className="w-3.5 h-3.5 text-[#027A48]" />
                  <span>Tidak ada duplikasi pesan</span>
                </div>
                <div className="flex items-center gap-2 text-[#111827]">
                  <Check className="w-3.5 h-3.5 text-[#027A48]" />
                  <span>Bukti termuda &lt; 24 jam</span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* WhatsApp draft preview */}
        <div className="bg-white rounded-xl border border-[#E5E7EB] p-4 space-y-3">
          <div className="text-[11px] font-bold uppercase tracking-[0.06em] text-[#9CA3AF]">
            PRATINJAU PESAN WHATSAPP
          </div>

          <div className="space-y-2 bg-[#F3F4F6] p-3 rounded-xl border border-[#E5E7EB]">
            {currentItem.whatsappBubbles.map((bubble, idx) => (
              <div
                key={idx}
                className="bg-[#2563EB] text-white p-3 rounded-2xl rounded-tr-xs text-[13px] leading-relaxed"
              >
                <p>{bubble}</p>
                <div className="text-right text-[10px] text-white/70 mt-1 font-mono">
                  09:0{idx} WITA
                </div>
              </div>
            ))}
            <div className="text-[11px] text-[#6B7280] text-center pt-1">
              Disusun Candra · disetujui Irfan
            </div>
          </div>
        </div>

        {/* Expandable "Bukti" section */}
        <div className="bg-white rounded-xl border border-[#E5E7EB] overflow-hidden">
          <button
            onClick={() => setIsBuktiExpanded(!isBuktiExpanded)}
            className="w-full flex items-center justify-between p-4 text-left"
          >
            <div>
              <div className="text-[11px] font-bold uppercase tracking-[0.06em] text-[#9CA3AF]">
                BUKTI RISET
              </div>
              <div className="text-[14px] font-semibold text-[#111827]">
                {currentItem.facts.length} Fakta &amp; {currentItem.hypotheses.length} Hipotesis
              </div>
            </div>
            {isBuktiExpanded ? (
              <ChevronUp className="w-5 h-5 text-[#9CA3AF]" />
            ) : (
              <ChevronDown className="w-5 h-5 text-[#9CA3AF]" />
            )}
          </button>

          {isBuktiExpanded && (
            <div className="p-4 pt-0 border-t border-[#F3F4F6] space-y-3 text-[13px]">
              <div className="space-y-2">
                <span className="text-[11px] font-bold text-[#027A48] uppercase tracking-wider">
                  Fakta Terverifikasi
                </span>
                {currentItem.facts.map((f, i) => (
                  <div key={i} className="p-2 bg-[#F9FAFB] rounded-lg border border-[#E5E7EB]">
                    <p className="font-medium text-[#111827]">{f.claim}</p>
                    <p className="text-[11px] text-[#6B7280] font-mono mt-0.5">
                      {f.sourceDomain} · {f.ageHours}j lalu
                    </p>
                  </div>
                ))}
              </div>

              <div className="space-y-2 pt-2">
                <span className="text-[11px] font-bold text-[#B54708] uppercase tracking-wider">
                  Hipotesis
                </span>
                {currentItem.hypotheses.map((h, i) => (
                  <div key={i} className="p-2 bg-[#F9FAFB] rounded-lg border border-[#E5E7EB]">
                    <p className="font-medium text-[#111827]">{h.claim}</p>
                    <p className="text-[11px] text-[#B54708] mt-1">
                      Tandingan: {h.counterEvidence}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Swipe & Pager Hint */}
      <div className="px-4 py-2 bg-white border-t border-[#E5E7EB] flex items-center justify-between text-[12px] text-[#6B7280]">
        <button
          onClick={handlePrev}
          disabled={currentIndex === 0}
          className="p-1 disabled:opacity-30 hover:text-[#111827]"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>
        <span className="font-medium">
          Draft {currentIndex + 1} dari {waitingItems.length}
        </span>
        <button
          onClick={handleNext}
          disabled={currentIndex >= waitingItems.length - 1}
          className="p-1 disabled:opacity-30 hover:text-[#111827]"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>

      {/* Sticky Bottom Action Bar */}
      <div className="p-3 bg-white border-t border-[#E5E7EB] shrink-0">
        {isRejectOpen ? (
          <div className="space-y-2 p-3 bg-[#FEF3F2] rounded-xl border border-[#FECDCA]">
            <div className="flex items-center justify-between">
              <span className="text-[13px] font-semibold text-[#B42318]">
                Alasan Penolakan
              </span>
              <button onClick={() => setIsRejectOpen(false)}>
                <X className="w-4 h-4 text-[#9CA3AF]" />
              </button>
            </div>
            <textarea
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder="Tuliskan catatan revisi..."
              className="w-full text-[12px] p-2 bg-white border border-[#E5E7EB] rounded-lg"
              rows={2}
            />
            <div className="flex gap-2">
              <button
                onClick={() => setIsRejectOpen(false)}
                className="flex-1 py-1.5 text-[12px] bg-white border border-[#E5E7EB] rounded-lg"
              >
                Batal
              </button>
              <button
                onClick={handleReject}
                className="flex-1 py-1.5 text-[12px] font-medium text-white bg-[#B42318] rounded-lg"
              >
                Kirim
              </button>
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsRejectOpen(true)}
              className="px-4 py-2.5 text-[13px] font-medium text-[#B42318] bg-white border border-[#FECDCA] rounded-lg"
            >
              Tolak…
            </button>
            <button
              onClick={handleApprove}
              className="flex-1 py-2.5 text-[13px] font-medium text-white bg-[#111827] rounded-lg text-center"
            >
              Setujui {currentItem.version}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
