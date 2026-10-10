import React, { useState, useEffect } from 'react';
import { 
  Check, 
  CheckCircle2, 
  Clock, 
  HelpCircle, 
  Info, 
  MessageSquare, 
  ShieldCheck, 
  X, 
  ExternalLink,
  ChevronRight,
  Sparkles,
  AlertTriangle,
  ArrowLeft,
  PanelRightClose,
  PanelRightOpen
} from 'lucide-react';
import { DecisionItem } from '../../types';
import { StatusPill, LeadPill, ActorAvatar } from '../common/Pill';

interface KeputusanProps {
  items: DecisionItem[];
  onApprove: (id: string) => void;
  onReject: (id: string, reason: string, scope: string, tags: string[]) => void;
}

export function Keputusan({ items, onApprove, onReject }: KeputusanProps) {
  const [activeTab, setActiveTab] = useState<'menunggu' | 'ditunda' | 'riwayat'>('menunggu');
  const [selectedId, setSelectedId] = useState<string>(items[0]?.id || '');
  const [isRejectOpen, setIsRejectOpen] = useState(false);
  const [rejectType, setRejectType] = useState<'Revisi draft' | 'Revisi strategi' | 'Tunda prospek' | 'Tolak prospek'>('Revisi draft');
  const [rejectReason, setRejectReason] = useState('');
  const [selectedChips, setSelectedChips] = useState<string[]>([]);
  const [feedbackToast, setFeedbackToast] = useState<string | null>(null);
  const [showRightRail, setShowRightRail] = useState(true);
  const [showMobileList, setShowMobileList] = useState(false);

  // Filter items based on activeTab and sort strictly by expiration time (earliest expiring first)
  const filteredItems = items
    .filter((item) => {
      if (activeTab === 'menunggu') return item.status === 'menunggu';
      if (activeTab === 'ditunda') return item.status === 'ditunda';
      return item.status === 'disetujui' || item.status === 'ditolak';
    })
    .sort((a, b) => a.expiresInHours - b.expiresInHours);

  // Ensure selected item exists
  const selectedItem = items.find((i) => i.id === selectedId) || filteredItems[0] || items[0];

  useEffect(() => {
    if (filteredItems.length > 0 && !filteredItems.find((i) => i.id === selectedId)) {
      setSelectedId(filteredItems[0].id);
    }
  }, [activeTab, filteredItems, selectedId]);

  // Keyboard shortcuts: A (Setujui), D (Tolak)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger if typing in textarea or input
      if (['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement)?.tagName)) {
        return;
      }

      if (e.key === 'a' || e.key === 'A') {
        e.preventDefault();
        if (selectedItem && selectedItem.status === 'menunggu' && !isRejectOpen) {
          handleApproveCurrent();
        }
      } else if (e.key === 'd' || e.key === 'D') {
        e.preventDefault();
        if (!isRejectOpen) {
          setIsRejectOpen(true);
        }
      } else if (e.key === 'Escape' && isRejectOpen) {
        setIsRejectOpen(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedItem, isRejectOpen, filteredItems, selectedId]);

  const handleApproveCurrent = () => {
    if (!selectedItem) return;
    onApprove(selectedItem.id);
    setFeedbackToast(`Disetujui: ${selectedItem.businessName} (${selectedItem.version})`);
    setTimeout(() => setFeedbackToast(null), 3000);
    // Advance to next item
    const currentIndex = filteredItems.findIndex((i) => i.id === selectedId);
    if (currentIndex < filteredItems.length - 1) {
      setSelectedId(filteredItems[currentIndex + 1].id);
    }
  };

  const handleRejectSubmit = () => {
    if (!selectedItem) return;
    if (!rejectReason.trim()) {
      alert('Mohon isi alasan penolakan.');
      return;
    }
    onReject(selectedItem.id, rejectReason, rejectType, selectedChips);
    setFeedbackToast(`Ditolak/Revisi: ${selectedItem.businessName} → ${rejectType}`);
    setTimeout(() => setFeedbackToast(null), 3000);
    setIsRejectOpen(false);
    setRejectReason('');
    setSelectedChips([]);
    // Advance to next
    const currentIndex = filteredItems.findIndex((i) => i.id === selectedId);
    if (currentIndex < filteredItems.length - 1) {
      setSelectedId(filteredItems[currentIndex + 1].id);
    }
  };

  const toggleChip = (chip: string) => {
    setSelectedChips((prev) =>
      prev.includes(chip) ? prev.filter((c) => c !== chip) : [...prev, chip]
    );
  };

  const countMenunggu = items.filter((i) => i.status === 'menunggu').length;
  const countDitunda = items.filter((i) => i.status === 'ditunda').length;
  const countRiwayat = items.filter((i) => i.status === 'disetujui' || i.status === 'ditolak').length;

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden bg-white">
      {/* Toast Notification */}
      {feedbackToast && (
        <div className="fixed top-14 left-1/2 -translate-x-1/2 z-50 bg-[#111827] text-white text-[13px] px-4 py-2 rounded-lg shadow-xl flex items-center gap-2 animate-in fade-in slide-in-from-top-2">
          <CheckCircle2 className="w-4 h-4 text-[#10B981]" />
          <span>{feedbackToast}</span>
        </div>
      )}

      {/* 3-Column Workspace: Left List (360px), Center Detail (flex), Right Rail (320px) */}
      <div className="flex-1 flex overflow-hidden">
        {/* ================= COLUMN 1: LEFT LIST ================= */}
        <div className={`${showMobileList ? 'flex' : 'hidden md:flex'} w-full md:w-[320px] lg:w-[360px] border-r border-[#E5E7EB] flex-col h-full bg-white shrink-0`}>
          {/* Header & Tabs */}
          <div className="p-4 border-b border-[#E5E7EB]">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-[16px] font-semibold text-[#111827]">
                Keputusan
              </h2>
            </div>

            {/* Segmented control tabs */}
            <div className="flex p-1 bg-[#F3F4F6] rounded-lg text-[13px] font-medium">
              <button
                onClick={() => setActiveTab('menunggu')}
                className={`flex-1 py-1.5 rounded-md text-center transition-colors ${
                  activeTab === 'menunggu'
                    ? 'bg-white text-[#111827] shadow-xs'
                    : 'text-[#6B7280] hover:text-[#111827]'
                }`}
              >
                Menunggu ({countMenunggu})
              </button>
              <button
                onClick={() => setActiveTab('ditunda')}
                className={`flex-1 py-1.5 rounded-md text-center transition-colors ${
                  activeTab === 'ditunda'
                    ? 'bg-white text-[#111827] shadow-xs'
                    : 'text-[#6B7280] hover:text-[#111827]'
                }`}
              >
                Ditunda ({countDitunda})
              </button>
              <button
                onClick={() => setActiveTab('riwayat')}
                className={`flex-1 py-1.5 rounded-md text-center transition-colors ${
                  activeTab === 'riwayat'
                    ? 'bg-white text-[#111827] shadow-xs'
                    : 'text-[#6B7280] hover:text-[#111827]'
                }`}
              >
                Riwayat ({countRiwayat})
              </button>
            </div>
          </div>

          {/* Rows List */}
          <div className="flex-1 overflow-y-auto divide-y divide-[#E5E7EB]">
            {filteredItems.length === 0 ? (
              <div className="p-8 text-center text-[#6B7280] text-[13px]">
                Tidak ada draft di kategori ini.
              </div>
            ) : (
              filteredItems.map((item) => {
                const isSelected = item.id === selectedItem?.id;
                return (
                  <div
                    key={item.id}
                    onClick={() => {
                      setSelectedId(item.id);
                      setIsRejectOpen(false);
                      setShowMobileList(false);
                    }}
                    className={`p-3.5 cursor-pointer transition-colors relative ${
                      isSelected
                        ? 'bg-[#EFF4FF] border-l-2 border-[#2563EB]'
                        : 'hover:bg-[#F9FAFB] border-l-2 border-transparent'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <div className="text-[14px] font-medium text-[#111827] truncate">
                        {item.businessName}
                      </div>
                      <span className="text-[11px] font-mono font-medium text-[#B54708] shrink-0 bg-[#FFFAEB] px-1.5 py-0.5 rounded-sm">
                        habis {item.expiresInHours}j
                      </span>
                    </div>

                    <div className="text-[13px] text-[#6B7280] truncate mb-2">
                      {item.segment}
                    </div>

                    <div className="flex items-center justify-between text-[12px]">
                      <div className="flex items-center gap-1.5">
                        <LeadPill label={item.leadLabel} />
                        <StatusPill
                          variant={item.evidenceAgeHours <= 6 ? 'green' : 'amber'}
                          dot
                        >
                          Bukti {item.evidenceAgeHours} jam
                        </StatusPill>
                      </div>

                      <div className="flex items-center gap-1">
                        <ActorAvatar
                          actor={item.senderProfile === 'Profil Irfan' ? 'irfan' : 'candra'}
                          size={18}
                          name={item.senderProfile}
                        />
                        <span className="text-[11px] font-mono text-[#9CA3AF]">
                          {item.version}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Action buttons replacing J/K shortcuts: D (Tolak) & A (Setujui) */}
          {selectedItem && selectedItem.status === 'menunggu' && (
            <div className="p-3 bg-[#F9FAFB] border-t border-[#E5E7EB] flex items-center gap-2">
              <button
                onClick={() => setIsRejectOpen(true)}
                className="flex-1 py-2 px-3 text-[13px] font-medium text-[#B42318] bg-white hover:bg-[#FEF3F2] border border-[#FECDCA] rounded-lg transition-colors flex items-center justify-center gap-1.5 cursor-pointer shadow-2xs"
                title="Tolak draft prospek"
              >
                <X className="w-3.5 h-3.5" />
                <span>D (Tolak)</span>
              </button>
              <button
                onClick={handleApproveCurrent}
                className="flex-1 py-2 px-3 text-[13px] font-medium text-white bg-[#111827] hover:bg-[#1F2937] rounded-lg transition-colors flex items-center justify-center gap-1.5 cursor-pointer shadow-2xs"
                title="Setujui draft prospek"
              >
                <Check className="w-3.5 h-3.5 text-[#10B981]" />
                <span>A (Setujui)</span>
              </button>
            </div>
          )}
        </div>

        {/* ================= COLUMN 2: CENTER DETAIL (Flexible) ================= */}
        {selectedItem ? (
          <div className={`${showMobileList ? 'hidden md:flex' : 'flex'} flex-1 flex-col h-full overflow-hidden bg-white border-r border-[#E5E7EB] min-w-0`}>
            {/* Scrollable Detail Body */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
              {/* Header Box */}
              <div className="pb-5 border-b border-[#E5E7EB]">
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="flex items-center gap-2 flex-wrap">
                    <button
                      onClick={() => setShowMobileList(true)}
                      className="md:hidden p-1 -ml-1 text-[#6B7280] hover:text-[#111827] rounded-md"
                      title="Kembali ke daftar"
                    >
                      <ArrowLeft className="w-5 h-5" />
                    </button>
                    <h1 className="text-[20px] font-semibold text-[#111827]">
                      {selectedItem.businessName}
                    </h1>
                    <StatusPill variant="gray" dot={false}>
                      Draft {selectedItem.version} · {selectedItem.versionHash}
                    </StatusPill>
                    {selectedItem.isTestMode && (
                      <StatusPill variant="blue" dot>
                        Mode uji · tidak terkirim
                      </StatusPill>
                    )}
                  </div>

                  {/* Right Rail Toggle Button */}
                  <button
                    onClick={() => setShowRightRail(!showRightRail)}
                    className="hidden xl:inline-flex p-1.5 rounded-md border border-[#E5E7EB] text-[#6B7280] hover:text-[#111827] hover:bg-[#F3F4F6] transition-colors"
                    title={showRightRail ? 'Sembunyikan bukti' : 'Tampilkan bukti'}
                  >
                    {showRightRail ? <PanelRightClose className="w-4 h-4" /> : <PanelRightOpen className="w-4 h-4" />}
                  </button>
                </div>

                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[13px] text-[#6B7280]">
                  <span>{selectedItem.segment}</span>
                  <span className="font-mono font-medium text-[#111827]">
                    {selectedItem.phoneMasked}
                  </span>
                  <span>{selectedItem.location}</span>
                </div>

                <div className="mt-3 flex items-center gap-2 text-[12px] text-[#6B7280]">
                  <ActorAvatar
                    actor={selectedItem.senderProfile === 'Profil Irfan' ? 'irfan' : 'candra'}
                    size={20}
                  />
                  <span>
                    Dikirim dari: <strong>{selectedItem.senderProfile}</strong>
                  </span>
                </div>
              </div>

              {/* Section: Kenapa layak (Checklist with green checks) */}
              <div className="space-y-3">
                <div className="text-[11px] font-bold uppercase tracking-[0.06em] text-[#9CA3AF]">
                  VERIFIKASI INTEGRITAS
                </div>
                <h3 className="text-[16px] font-semibold text-[#111827]">
                  Kenapa layak
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {[
                    { label: 'Identitas cocok dengan Google Maps', pass: selectedItem.checklist.identityMatchedGoogleMaps },
                    { label: 'Nomor cocok dengan website', pass: selectedItem.checklist.phoneMatchedWebsite },
                    { label: 'Bukan DNC atau ambil alih', pass: selectedItem.checklist.notDncOrTakeover },
                    { label: 'Tidak duplikat di riwayat outbox', pass: selectedItem.checklist.notDuplicate },
                    { label: `Bukti termuda ${selectedItem.evidenceAgeHours} jam (batas 24 jam)`, pass: selectedItem.checklist.evidenceFreshEnough },
                  ].map((rule, idx) => (
                    <div
                      key={idx}
                      className="flex items-center gap-2.5 p-2.5 rounded-lg border border-[#E5E7EB] bg-[#F9FAFB] text-[13px] text-[#111827]"
                    >
                      <div className="w-5 h-5 rounded-full bg-[#ECFDF3] text-[#027A48] flex items-center justify-center shrink-0">
                        <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                      </div>
                      <span className="truncate">{rule.label}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Section: Strategi */}
              <div className="space-y-2.5 p-4 rounded-xl border border-[#E5E7EB] bg-[#F9FAFB]">
                <div className="text-[11px] font-bold uppercase tracking-[0.06em] text-[#9CA3AF]">
                  PENDEKATAN PROSPEK
                </div>
                <div className="flex flex-wrap items-center gap-3">
                  <span className="text-[14px] font-semibold text-[#111827]">
                    {selectedItem.strategy.playbook}
                  </span>
                  <span className="text-[12px] px-2 py-0.5 rounded-full bg-white border border-[#E5E7EB] font-medium text-[#2563EB]">
                    Layanan: {selectedItem.strategy.targetService}
                  </span>
                </div>
                <p className="text-[13px] text-[#6B7280] leading-relaxed">
                  {selectedItem.strategy.rationale}
                </p>
              </div>

              {/* Section: Draft WhatsApp (Realistic preview) */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="text-[11px] font-bold uppercase tracking-[0.06em] text-[#9CA3AF]">
                    PESAN OUTBOUND PROSPEK
                  </div>
                  <span className="text-[12px] text-[#6B7280]">
                    3 bubble berurutan · tanpa link
                  </span>
                </div>

                <h3 className="text-[16px] font-semibold text-[#111827]">
                  Draft yang akan diterima prospek
                </h3>

                {/* WhatsApp simulated card */}
                <div className="rounded-xl border border-[#E5E7EB] bg-[#F3F4F6] p-4 sm:p-5">
                  <div className="max-w-[480px] space-y-2.5">
                    {selectedItem.whatsappBubbles.map((bubbleText, idx) => (
                      <div
                        key={idx}
                        className="bg-[#2563EB] text-white p-3.5 rounded-2xl rounded-tr-xs text-[14px] leading-relaxed shadow-xs"
                      >
                        <p>{bubbleText}</p>
                        <div className="flex items-center justify-between mt-1 text-[10px] text-white/80 pt-0.5">
                          <span>Bubble #{idx + 1}</span>
                          <span className="font-mono">09:0{idx} · Centang dua</span>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="mt-3 text-[12px] text-[#6B7280] flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#2563EB]" />
                    <span>Disusun oleh Candra · disetujui Irfan</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Sticky Action Bar at bottom */}
            <div className="p-4 border-t border-[#E5E7EB] bg-white">
              {isRejectOpen ? (
                /* Inline Reject Panel */
                <div className="space-y-3 p-4 bg-[#FEF3F2]/50 rounded-xl border border-[#FECDCA] animate-in fade-in duration-150">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4 text-[#B42318]" />
                      <span className="text-[14px] font-semibold text-[#B42318]">
                        Penolakan atau Revisi Draft
                      </span>
                    </div>
                    <button
                      onClick={() => setIsRejectOpen(false)}
                      className="text-[#9CA3AF] hover:text-[#111827] p-1"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Radio options */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[13px]">
                    {[
                      'Revisi draft',
                      'Revisi strategi',
                      'Tunda prospek',
                      'Tolak prospek',
                    ].map((opt) => (
                      <label
                        key={opt}
                        className={`flex items-center gap-2 p-2 rounded-lg border cursor-pointer ${
                          rejectType === opt
                            ? 'bg-white border-[#B42318] text-[#B42318] font-medium'
                            : 'bg-white/60 border-[#E5E7EB] text-[#4B5563]'
                        }`}
                      >
                        <input
                          type="radio"
                          name="rejectType"
                          value={opt}
                          checked={rejectType === opt}
                          onChange={() => setRejectType(opt as any)}
                          className="accent-[#B42318]"
                        />
                        <span>{opt}</span>
                      </label>
                    ))}
                  </div>

                  {/* Optional chips to mark which part was wrong */}
                  <div className="flex items-center gap-2 flex-wrap text-[12px]">
                    <span className="text-[#6B7280]">Tandai bagian:</span>
                    {['Bukti', 'Strategi', 'Bubble 1', 'Bubble 2', 'Bubble 3'].map((chip) => (
                      <button
                        key={chip}
                        type="button"
                        onClick={() => toggleChip(chip)}
                        className={`px-2.5 py-1 rounded-md border text-[12px] transition-colors ${
                          selectedChips.includes(chip)
                            ? 'bg-[#B42318] text-white border-[#B42318]'
                            : 'bg-white text-[#6B7280] border-[#E5E7EB] hover:bg-[#F3F4F6]'
                        }`}
                      >
                        {chip}
                      </button>
                    ))}
                  </div>

                  {/* Required textarea */}
                  <div>
                    <textarea
                      value={rejectReason}
                      onChange={(e) => setRejectReason(e.target.value)}
                      placeholder="Tuliskan catatan revisi spesifik untuk Candra (wajib)..."
                      className="w-full text-[13px] p-2.5 border border-[#E5E7EB] rounded-lg bg-white focus:outline-hidden focus:border-[#B42318]"
                      rows={2}
                      autoFocus
                    />
                  </div>

                  {/* Actions */}
                  <div className="flex items-center justify-end gap-2 pt-1">
                    <button
                      onClick={() => setIsRejectOpen(false)}
                      className="px-3 py-1.5 text-[13px] text-[#6B7280] hover:text-[#111827]"
                    >
                      Batal
                    </button>
                    <button
                      onClick={handleRejectSubmit}
                      className="px-4 py-1.5 text-[13px] font-medium text-[#B42318] border border-[#B42318] rounded-lg hover:bg-[#FEF3F2] transition-colors"
                    >
                      Kirim penolakan
                    </button>
                  </div>
                </div>
              ) : (
                /* Standard Action Bar */
                <div>
                  <div className="flex items-center justify-between gap-4">
                    <button
                      onClick={() => setIsRejectOpen(true)}
                      className="px-5 py-2.5 text-[14px] font-medium text-[#B42318] hover:bg-[#FEF3F2] border border-[#FECDCA] rounded-lg transition-colors flex items-center gap-2 cursor-pointer shadow-2xs"
                    >
                      <X className="w-4 h-4" />
                      <span>D (Tolak)</span>
                    </button>

                    <button
                      onClick={handleApproveCurrent}
                      className="flex-1 max-w-[340px] px-6 py-2.5 bg-[#111827] text-white text-[14px] font-medium rounded-lg hover:bg-[#1F2937] transition-colors flex items-center justify-center gap-2 shadow-xs cursor-pointer"
                    >
                      <Check className="w-4 h-4 text-[#10B981]" />
                      <span>A (Setujui) {selectedItem.version}</span>
                    </button>
                  </div>

                  <div className="mt-2 text-[11px] text-[#9CA3AF]">
                    <span>
                      Keputusan mengikat versi {selectedItem.version}, pengirim, dan isi draft ini.
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="flex-1 flex items-center justify-center p-8 text-[#6B7280]">
            Pilih draft dari daftar sebelah kiri.
          </div>
        )}

        {/* ================= COLUMN 3: RIGHT RAIL (320px) ================= */}
        {selectedItem && (
          <div className={`${showRightRail ? 'hidden xl:block' : 'hidden'} w-[320px] shrink-0 h-full overflow-y-auto p-5 bg-[#F9FAFB] space-y-5 border-l border-[#E5E7EB]`}>
            <div>
              <div className="text-[11px] font-bold uppercase tracking-[0.06em] text-[#9CA3AF] mb-1">
                BUKTI · {selectedItem.facts.length} SUMBER
              </div>
              <h3 className="text-[16px] font-semibold text-[#111827]">
                Bukti riset
              </h3>
            </div>

            {/* Group 1: Fakta */}
            <div className="space-y-3">
              <div className="text-[12px] font-semibold text-[#111827] flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-[#027A48]" />
                <span>Fakta (Terverifikasi)</span>
              </div>

              <div className="space-y-2">
                {selectedItem.facts.map((fact, idx) => (
                  <div
                    key={idx}
                    className="p-3 rounded-lg border border-[#E5E7EB] bg-white text-[13px] space-y-1.5"
                  >
                    <p className="text-[#111827] font-medium leading-snug">
                      {fact.claim}
                    </p>
                    <div className="flex items-center justify-between text-[11px] text-[#6B7280]">
                      <span className="font-mono truncate">{fact.sourceDomain}</span>
                      <StatusPill variant="green" dot={false} className="h-[18px] text-[10px]">
                        {fact.ageHours}j lalu
                      </StatusPill>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Group 2: Hipotesis */}
            <div className="space-y-3">
              <div className="text-[12px] font-semibold text-[#111827] flex items-center gap-1.5">
                <HelpCircle className="w-3.5 h-3.5 text-[#B54708]" />
                <span>Hipotesis & Keraguan</span>
              </div>

              <div className="space-y-2">
                {selectedItem.hypotheses.map((hyp, idx) => (
                  <div
                    key={idx}
                    className="p-3 rounded-lg border border-[#E5E7EB] bg-white text-[13px] space-y-1.5"
                  >
                    <p className="text-[#111827] font-medium leading-snug">
                      {hyp.claim}
                    </p>
                    <div className="text-[12px] text-[#6B7280] space-y-1 pt-1 border-t border-[#F3F4F6]">
                      <p>
                        <strong className="text-[#B54708]">Bukti tandingan:</strong>{' '}
                        {hyp.counterEvidence}
                      </p>
                      <p>
                        <strong className="text-[#4B5563]">Ketidakpastian:</strong>{' '}
                        {hyp.uncertainty}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Stats: Biaya riset */}
            <div className="p-3.5 bg-white rounded-lg border border-[#E5E7EB] space-y-1">
              <div className="text-[12px] font-medium text-[#111827] flex items-center justify-between">
                <span>Biaya riset:</span>
                <span className="font-mono text-[#027A48] font-semibold">
                  Rp{selectedItem.researchCostRp.toLocaleString('id-ID')}
                </span>
              </div>
              <div className="text-[11px] text-[#9CA3AF] flex items-center justify-between font-mono">
                <span>{selectedItem.toolCallsCount} tool calls</span>
                <span>{selectedItem.retryCount} retry</span>
              </div>
            </div>

            {/* Version Timeline v1 -> v3 */}
            <div className="space-y-2 pt-2 border-t border-[#E5E7EB]">
              <div className="text-[11px] font-bold uppercase tracking-[0.06em] text-[#9CA3AF]">
                RIWAYAT VERSI
              </div>
              <div className="relative pl-4 space-y-3 before:absolute before:left-1.5 before:top-1.5 before:bottom-1.5 before:w-[1px] before:bg-[#E5E7EB]">
                {selectedItem.versionHistory.map((ver, idx) => (
                  <div key={idx} className="relative text-[12px]">
                    <span className="absolute -left-[14px] top-1 w-2 h-2 rounded-full bg-[#2563EB] ring-2 ring-white" />
                    <div className="flex items-center justify-between font-medium text-[#111827]">
                      <span>{ver.version} · {ver.author}</span>
                      <span className="text-[11px] font-mono text-[#9CA3AF]">{ver.timestamp}</span>
                    </div>
                    <p className="text-[11px] text-[#6B7280] mt-0.5 leading-snug">
                      {ver.summary}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
