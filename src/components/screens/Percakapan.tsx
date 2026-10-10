import React, { useState } from 'react';
import { 
  Search, 
  Send, 
  Paperclip, 
  Smile, 
  Sparkles, 
  ChevronDown, 
  ChevronUp, 
  ExternalLink, 
  Copy, 
  Check, 
  CheckCheck, 
  MoreHorizontal, 
  Sidebar, 
  Maximize2, 
  Minus, 
  ArrowLeft, 
  Mail, 
  Phone, 
  MapPin, 
  Tag, 
  SlidersHorizontal,
  X,
  Clock,
  UserCheck,
  AlertTriangle,
  Flame,
  MessageSquare,
  PanelRightClose,
  PanelRightOpen,
  Filter
} from 'lucide-react';
import { ConversationItem, ChatMessage, ActorType } from '../../types';
import { StatusPill, LeadPill, ActorAvatar } from '../common/Pill';

interface PercakapanProps {
  conversations: ConversationItem[];
  initialSelectedId?: string;
}

export function Percakapan({
  conversations: initialConversations,
  initialSelectedId,
}: PercakapanProps) {
  const [conversations, setConversations] = useState<ConversationItem[]>(initialConversations);
  const [activeTab, setActiveTab] = useState<'all' | 'butuh_kamu' | 'candra_menangani' | 'menunggu_balasan' | 'selesai'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedId, setSelectedId] = useState<string>(initialSelectedId || 'conv-theo');
  const [inputText, setInputText] = useState('');
  const [composerMode, setComposerMode] = useState<'reply' | 'note'>('reply');
  const [isCopiedEmail, setIsCopiedEmail] = useState(false);
  const [showRightPanel, setShowRightPanel] = useState(true);
  const [showMobileList, setShowMobileList] = useState(!initialSelectedId);
  const [actionsExpanded, setActionsExpanded] = useState(true);
  const [infoExpanded, setInfoExpanded] = useState(true);
  const [activeInspectorTab, setActiveInspectorTab] = useState<'details' | 'juno'>('details');
  const [filterProfile, setFilterProfile] = useState<'ALL' | 'Profil Irfan' | 'Profil Candra'>('ALL');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const selectedConv = conversations.find((c) => c.id === selectedId) || conversations[0];

  // Filter list
  const filteredList = conversations.filter((item) => {
    if (activeTab !== 'all' && item.tab !== activeTab) return false;
    if (filterProfile !== 'ALL' && item.senderProfile !== filterProfile) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        item.businessName.toLowerCase().includes(q) ||
        (item.subject && item.subject.toLowerCase().includes(q)) ||
        item.lastMessageSnippet.toLowerCase().includes(q) ||
        item.segment.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const handleSelectConv = (id: string) => {
    setSelectedId(id);
    setShowMobileList(false); // On mobile, show chat when conversation clicked
  };

  const handleCopyEmail = (email?: string) => {
    if (!email) return;
    navigator.clipboard?.writeText(email);
    setIsCopiedEmail(true);
    setTimeout(() => setIsCopiedEmail(false), 2000);
  };

  const handleSendMessage = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!inputText.trim() || !selectedConv) return;

    const newMsg: ChatMessage = {
      id: `msg-${Date.now()}`,
      sender: 'irfan',
      senderName: composerMode === 'note' ? 'Internal Note (Irfan)' : (selectedConv.id === 'conv-theo' ? 'Demo User' : 'Irfan (Founder)'),
      text: inputText.trim(),
      timestamp: 'Baru saja',
      dateGroup: 'Hari ini',
      isNote: composerMode === 'note',
      composedBy: 'Irfan',
      approvedBy: 'Irfan',
    };

    setConversations((prev) =>
      prev.map((c) =>
        c.id === selectedConv.id
          ? {
              ...c,
              messages: [...c.messages, newMsg],
              lastMessageSnippet: `${composerMode === 'note' ? '[Note] ' : ''}${inputText.trim()}`,
              lastMessageTime: '07:48 WITA',
            }
          : c
      )
    );

    setToastMessage(composerMode === 'note' ? 'Catatan privat tersimpan' : 'Pesan berhasil dikirim');
    setTimeout(() => setToastMessage(null), 2500);
    setInputText('');
  };

  const handleSuggestTags = () => {
    if (!selectedConv) return;
    const suggestions = ['high-intent', 'priority-queue', 'bali-expat'];
    setConversations((prev) =>
      prev.map((c) =>
        c.id === selectedConv.id
          ? {
              ...c,
              tags: Array.from(new Set([...(c.tags || []), ...suggestions])),
            }
          : c
      )
    );
    setToastMessage('Tag otomatis ditambahkan oleh Candra AI');
    setTimeout(() => setToastMessage(null), 2500);
  };

  const handleRemoveTag = (tagToRemove: string) => {
    if (!selectedConv) return;
    setConversations((prev) =>
      prev.map((c) =>
        c.id === selectedConv.id
          ? {
              ...c,
              tags: (c.tags || []).filter((t) => t !== tagToRemove),
            }
          : c
      )
    );
  };

  const handleTakeover = (convId: string) => {
    setConversations((prev) =>
      prev.map((c) =>
        c.id === convId
          ? {
              ...c,
              isTakenOver: true,
              escalationStatus: 'Kamu ambil alih',
              timeline: [
                ...c.timeline,
                {
                  actor: 'irfan',
                  title: 'Irfan mengambil alih obrolan',
                  desc: 'Founder mengambil kendali manual atas balasan',
                  time: 'Hari ini 07:48',
                },
              ],
            }
          : c
      )
    );
    setToastMessage('Percakapan diambil alih oleh Irfan');
    setTimeout(() => setToastMessage(null), 2500);
  };

  const handleHandback = (convId: string) => {
    setConversations((prev) =>
      prev.map((c) =>
        c.id === convId
          ? {
              ...c,
              isTakenOver: false,
              escalationStatus: undefined,
              tab: 'candra_menangani',
              timeline: [
                ...c.timeline,
                {
                  actor: 'irfan',
                  title: 'Dikembalikan ke Candra',
                  desc: 'Candra melanjutkan tindak lanjut kualifikasi rutin',
                  time: 'Hari ini 07:49',
                },
              ],
            }
          : c
      )
    );
    setToastMessage('Percakapan dikembalikan ke penanganan Candra');
    setTimeout(() => setToastMessage(null), 2500);
  };

  // Group messages by dateGroup
  const groupedMessages: { date: string; msgs: ChatMessage[] }[] = [];
  if (selectedConv) {
    selectedConv.messages.forEach((msg) => {
      const date = msg.dateGroup || 'Hari ini';
      const existing = groupedMessages.find((g) => g.date === date);
      if (existing) {
        existing.msgs.push(msg);
      } else {
        groupedMessages.push({ date, msgs: [msg] });
      }
    });
  }

  return (
    <div className="flex-1 flex h-full overflow-hidden bg-white text-[#111827] relative">
      {/* Toast */}
      {toastMessage && (
        <div className="fixed top-16 left-1/2 -translate-x-1/2 z-50 bg-[#111827] text-white text-[13px] px-4 py-2 rounded-lg shadow-xl flex items-center gap-2 animate-in fade-in slide-in-from-top-2">
          <Check className="w-4 h-4 text-[#10B981]" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* ================= COLUMN 1: CONVERSATION LIST (INBOX) ================= */}
      <div 
        className={`${
          showMobileList ? 'flex' : 'hidden md:flex'
        } w-full md:w-[320px] lg:w-[360px] xl:w-[380px] shrink-0 border-r border-[#E5E7EB] flex-col h-full bg-white z-10`}
      >
        {/* List Header */}
        <div className="p-3.5 border-b border-[#E5E7EB] space-y-2.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-[15px] font-semibold text-[#111827]">
                Semua Obrolan
              </span>
            </div>

            <select
              value={filterProfile}
              onChange={(e) => setFilterProfile(e.target.value as any)}
              className="text-[11px] bg-transparent border border-[#E5E7EB] rounded-md px-2 py-1 text-[#6B7280] focus:outline-hidden"
            >
              <option value="ALL">Semua Akun</option>
              <option value="Profil Irfan">Profil Irfan</option>
              <option value="Profil Candra">Profil Candra</option>
            </select>
          </div>

          {/* Filter Tabs with inline count badges */}
          <div className="flex items-center gap-1 overflow-x-auto no-scrollbar p-0.5 bg-[#F3F4F6] rounded-lg text-[12px]">
            {[
              { id: 'all', label: `Semua (${conversations.length})` },
              { id: 'butuh_kamu', label: `Butuh kamu (${conversations.filter(c => c.tab === 'butuh_kamu').length})` },
              { id: 'candra_menangani', label: `Candra (${conversations.filter(c => c.tab === 'candra_menangani').length})` },
              { id: 'menunggu_balasan', label: `Menunggu (${conversations.filter(c => c.tab === 'menunggu_balasan').length})` },
              { id: 'selesai', label: `Selesai (${conversations.filter(c => c.tab === 'selesai').length})` },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`px-2.5 py-1 rounded-md whitespace-nowrap transition-colors font-medium shrink-0 ${
                  activeTab === tab.id
                    ? 'bg-white text-[#111827] shadow-2xs font-semibold'
                    : 'text-[#6B7280] hover:text-[#111827]'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Search Box */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-[#9CA3AF] absolute left-3 top-2.5" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari kontak, email, atau topik percakapan..."
              className="w-full pl-8 pr-3 py-1.5 text-[13px] bg-[#F9FAFB] border border-[#E5E7EB] rounded-lg text-[#111827] placeholder:text-[#9CA3AF] focus:outline-hidden focus:border-[#2563EB]"
            />
          </div>
        </div>

        {/* Conversation Rows */}
        <div className="flex-1 overflow-y-auto divide-y divide-[#E5E7EB]/70">
          {filteredList.length === 0 ? (
            <div className="p-8 text-center text-[#9CA3AF] text-[13px]">
              Tidak ada percakapan ditemukan.
            </div>
          ) : (
            filteredList.map((conv) => {
              const isSelected = conv.id === selectedConv?.id;
              return (
                <div
                  key={conv.id}
                  onClick={() => handleSelectConv(conv.id)}
                  className={`p-3.5 cursor-pointer transition-colors relative ${
                    isSelected
                      ? 'bg-[#F9FAFB] border-l-3 border-[#2563EB]'
                      : 'hover:bg-[#F9FAFB] border-l-3 border-transparent'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    {/* Avatar */}
                    <div className="relative shrink-0">
                      <ActorAvatar
                        actor={conv.id === 'conv-theo' ? 'prospect' : conv.id.includes('irfan') ? 'irfan' : 'prospect'}
                        size={36}
                        name={conv.businessName}
                      />
                      <span className="w-2.5 h-2.5 rounded-full bg-[#10B981] ring-2 ring-white absolute -bottom-0.5 -right-0.5" />
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      {/* Name & Indicators */}
                      <div className="flex items-center justify-between mb-0.5">
                        <span className="text-[14px] font-semibold text-[#111827] truncate">
                          {conv.businessName}
                        </span>
                        <div className="flex items-center gap-1.5 shrink-0 text-[#9CA3AF] text-[11px] font-mono">
                          <span className="w-1.5 h-2.5 inline-block bg-[#D1D5DB] rounded-2xs" />
                          <Mail className="w-3 h-3" />
                          <span>{conv.daysAgoText || '20d'}</span>
                          {conv.unreadCount && conv.unreadCount > 0 ? (
                            <span className="w-4 h-4 rounded-full bg-[#027A48] text-white text-[10px] font-bold flex items-center justify-center ml-0.5">
                              {conv.unreadCount}
                            </span>
                          ) : null}
                        </div>
                      </div>

                      {/* Subject */}
                      <p className="text-[13px] font-medium text-[#374151] truncate mb-1">
                        {conv.subject || conv.segment}
                      </p>

                      {/* Last Message Snippet */}
                      <p className="text-[12px] text-[#6B7280] line-clamp-1 leading-snug flex items-center gap-1">
                        <span className="text-[#9CA3AF] font-bold">↳</span>
                        <span className="truncate">{conv.lastMessageSnippet}</span>
                      </p>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* ================= COLUMN 2: CENTER CHAT AREA ================= */}
      {selectedConv ? (
        <div 
          className={`${
            showMobileList ? 'hidden md:flex' : 'flex'
          } flex-1 flex-col h-full bg-white overflow-hidden min-w-0 border-r border-[#E5E7EB]`}
        >
          {/* Top Chat Header */}
          <div className="px-4 py-3 border-b border-[#E5E7EB] flex items-center justify-between shrink-0 bg-white">
            <div className="flex items-center gap-3 min-w-0">
              {/* Mobile Back Button */}
              <button
                onClick={() => setShowMobileList(true)}
                className="md:hidden p-1.5 -ml-1 text-[#6B7280] hover:text-[#111827] rounded-lg"
                title="Kembali ke daftar"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>

              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <h2 className="text-[16px] font-semibold text-[#111827] truncate">
                    {selectedConv.businessName}
                  </h2>
                  <span className="hidden sm:inline-flex px-2 py-0.5 rounded-full text-[11px] font-medium bg-[#ECFDF3] text-[#027A48] border border-[#D1FADF]">
                    {selectedConv.statusPillText || 'Open'}
                  </span>
                </div>
                <p className="text-[12px] text-[#6B7280] truncate font-mono">
                  {selectedConv.subject || selectedConv.segment}
                </p>
              </div>
            </div>

            {/* Actions on Top Right */}
            <div className="flex items-center gap-2 shrink-0">
              {selectedConv.isTakenOver ? (
                <button
                  onClick={() => handleHandback(selectedConv.id)}
                  className="hidden sm:inline-flex px-2.5 py-1 text-[12px] font-medium text-[#2563EB] bg-[#EFF8FF] border border-[#B2DDFF] rounded-md hover:bg-[#E0F2FE] transition-colors"
                >
                  Kembalikan ke Candra
                </button>
              ) : (
                <button
                  onClick={() => handleTakeover(selectedConv.id)}
                  className="hidden sm:inline-flex px-2.5 py-1 text-[12px] font-medium text-[#111827] bg-white border border-[#E5E7EB] rounded-md hover:bg-[#F3F4F6] transition-colors"
                >
                  Ambil Alih
                </button>
              )}

              {/* Status button */}
              <button className="flex items-center gap-1 px-3 py-1 bg-[#107548] text-white rounded-md text-[13px] font-medium hover:bg-[#0c5c38] transition-colors">
                <span>{selectedConv.statusPillText || 'Open'}</span>
              </button>

              <button className="p-1.5 text-[#6B7280] hover:text-[#111827] rounded-md hover:bg-[#F3F4F6]">
                <MoreHorizontal className="w-4 h-4" />
              </button>

              {/* Right Panel Toggle Button [◫] */}
              <button
                onClick={() => setShowRightPanel(!showRightPanel)}
                className={`p-1.5 rounded-md border text-[#6B7280] hover:text-[#111827] transition-colors ${
                  showRightPanel ? 'bg-[#F3F4F6] border-[#D1D5DB]' : 'bg-white border-[#E5E7EB]'
                }`}
                title={showRightPanel ? 'Sembunyikan panel detail' : 'Tampilkan panel detail'}
              >
                {showRightPanel ? (
                  <PanelRightClose className="w-4 h-4" />
                ) : (
                  <PanelRightOpen className="w-4 h-4" />
                )}
              </button>
            </div>
          </div>

          {/* Messages Flow Container - Spacious & accommodates 4-5 bubbles easily */}
          <div className="flex-1 overflow-y-auto p-3 sm:p-5 space-y-3 bg-white">
            {groupedMessages.map((group, gIdx) => (
              <div key={gIdx} className="space-y-2.5">
                {/* Centered Date Separator (e.g. '2 Sep 2026', '3 Sep 2026') */}
                <div className="flex items-center justify-center my-2">
                  <span className="text-[11px] font-medium text-[#6B7280] bg-[#F3F4F6] px-3 py-0.5 rounded-full">
                    {group.date}
                  </span>
                </div>

                {/* Messages inside this date group */}
                {group.msgs.map((msg) => {
                  if (msg.sender === 'system') {
                    return (
                      <div key={msg.id} className="flex justify-center my-1.5">
                        <span className="text-[11px] font-medium text-[#6B7280] bg-[#F9FAFB] border border-[#E5E7EB] px-3 py-0.5 rounded-full text-center max-w-[420px]">
                          {msg.text}
                        </span>
                      </div>
                    );
                  }

                  const isOutgoing = msg.sender === 'irfan' || msg.sender === 'candra';

                  if (msg.isNote) {
                    /* Private note display */
                    return (
                      <div key={msg.id} className="p-3 bg-[#FFFBEB] border border-[#FDE68A] rounded-xl text-[13px] text-[#92400E] space-y-1">
                        <div className="flex items-center justify-between text-[11px] font-bold uppercase tracking-wider text-[#B45309]">
                          <span>🔒 Catatan Privat ({msg.senderName})</span>
                          <span>{msg.timestamp}</span>
                        </div>
                        <p>{msg.text}</p>
                      </div>
                    );
                  }

                  return (
                    <div
                      key={msg.id}
                      className={`flex flex-col ${isOutgoing ? 'items-end' : 'items-start'} space-y-0.5`}
                    >
                      <div className="flex items-start gap-2 max-w-[88%] sm:max-w-[78%] md:max-w-[620px]">
                        {/* Avatar on left for incoming */}
                        {!isOutgoing && (
                          <div className="shrink-0 mt-0.5">
                            <ActorAvatar actor="prospect" size={26} name={msg.senderName || selectedConv.businessName} />
                          </div>
                        )}

                        <div className="flex flex-col">
                          {/* Sender name above bubble */}
                          <span className={`text-[11px] font-medium text-[#4B5563] mb-0.5 ${isOutgoing ? 'text-right' : 'text-left'}`}>
                            {msg.senderName || (isOutgoing ? 'Demo User' : selectedConv.businessName)}
                          </span>

                          {/* Speech bubble */}
                          <div
                            className={`p-2.5 sm:p-3 rounded-2xl text-[13.5px] leading-relaxed transition-all ${
                              isOutgoing
                                ? 'bg-[#F3F4F6] text-[#111827] rounded-tr-xs border border-[#E5E7EB]'
                                : 'bg-white text-[#111827] rounded-tl-xs border border-[#E5E7EB] shadow-2xs'
                            }`}
                          >
                            <p className="whitespace-pre-wrap">{msg.text}</p>

                            {/* Checkmark & Status on outgoing */}
                            {isOutgoing && (
                              <div className="flex items-center justify-end gap-1 mt-1 text-[#107548]">
                                <CheckCheck className="w-3.5 h-3.5" />
                              </div>
                            )}
                          </div>

                          {/* Timestamp below bubble */}
                          <div className={`text-[11px] text-[#9CA3AF] mt-1 font-mono ${isOutgoing ? 'text-right' : 'text-left'}`}>
                            {msg.timestamp}
                          </div>
                        </div>

                        {/* Avatar on right for outgoing */}
                        {isOutgoing && (
                          <div className="shrink-0 mt-1">
                            <ActorAvatar actor="irfan" size={28} name={msg.senderName || 'Irfan'} />
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            ))}
          </div>

          {/* Candra / Takeover banner if needed */}
          {!selectedConv.isTakenOver && selectedConv.tab === 'butuh_kamu' && (
            <div className="px-4 py-2 bg-[#EFF8FF] border-t border-[#B2DDFF] flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-[12px] text-[#175CD3]">
              <span>
                <strong>Candra menangani percakapan ini.</strong> Harga & komitmen membutuhkan persetujuan founder.
              </span>
              <button
                onClick={() => handleTakeover(selectedConv.id)}
                className="font-medium underline hover:text-[#1D4ED8] self-start sm:self-auto"
              >
                Ambil alih percakapan
              </button>
            </div>
          )}

          {/* ================= RICH COMPOSER (Matching Image) ================= */}
          <div className="p-3 sm:p-4 bg-white border-t border-[#E5E7EB] space-y-2.5 shrink-0">
            {/* Top Toolbar of Composer: Tabs [Reply] / [Private note], minimize/expand */}
            <div className="flex items-center justify-between">
              <div className="flex items-center p-0.5 bg-[#F3F4F6] rounded-lg text-[12px] font-medium">
                <button
                  type="button"
                  onClick={() => setComposerMode('reply')}
                  className={`px-3 py-1 rounded-md transition-colors ${
                    composerMode === 'reply'
                      ? 'bg-white text-[#111827] shadow-2xs font-semibold'
                      : 'text-[#6B7280] hover:text-[#111827]'
                  }`}
                >
                  Reply
                </button>
                <button
                  type="button"
                  onClick={() => setComposerMode('note')}
                  className={`px-3 py-1 rounded-md transition-colors ${
                    composerMode === 'note'
                      ? 'bg-white text-[#92400E] shadow-2xs font-semibold'
                      : 'text-[#6B7280] hover:text-[#111827]'
                  }`}
                >
                  Private note
                </button>
              </div>

              <div className="flex items-center gap-2 text-[#9CA3AF]">
                <button className="p-1 hover:text-[#111827] rounded-sm" title="Minimize">
                  <Minus className="w-3.5 h-3.5" />
                </button>
                <button className="p-1 hover:text-[#111827] rounded-sm" title="Expand">
                  <Maximize2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Textarea */}
            <form onSubmit={handleSendMessage} className="space-y-2">
              <div className={`rounded-xl border ${
                composerMode === 'note' ? 'border-[#FCD34D] bg-[#FFFDF5]' : 'border-[#E5E7EB] bg-white'
              } p-2.5 transition-colors focus-within:border-[#2563EB]`}>
                <textarea
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  onKeyDown={(e) => {
                    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
                      e.preventDefault();
                      handleSendMessage();
                    }
                  }}
                  placeholder={
                    composerMode === 'note'
                      ? 'Tulis catatan internal untuk tim atau Candra AI...'
                      : 'Ketik balasan untuk ' + selectedConv.businessName + '...'
                  }
                  rows={2}
                  className="w-full text-[14px] bg-transparent text-[#111827] placeholder:text-[#9CA3AF] focus:outline-hidden resize-none"
                />

                {/* Bottom Toolbar inside Composer: 📎, 😊, ✨, [Send ▾] */}
                <div className="flex items-center justify-between pt-2 border-t border-[#F3F4F6] text-[#6B7280]">
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => alert('Lampirkan dokumen penawaran PDF atau gambar.')}
                      className="p-1.5 hover:text-[#111827] hover:bg-[#F3F4F6] rounded-md transition-colors"
                      title="Lampirkan file"
                    >
                      <Paperclip className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setInputText((prev) => prev + ' 😊')}
                      className="p-1.5 hover:text-[#111827] hover:bg-[#F3F4F6] rounded-md transition-colors"
                      title="Emoji"
                    >
                      <Smile className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        const aiDraft = 'Terima kasih atas pertanyaannya. Setiap mailbox dapat dikonfigurasi secara mandiri dalam antrean sistem.';
                        setInputText(aiDraft);
                      }}
                      className="flex items-center gap-1 px-2 py-1 text-[12px] font-medium text-[#2563EB] hover:bg-[#EFF8FF] rounded-md transition-colors"
                      title="Candra AI Draft Assistant"
                    >
                      <Sparkles className="w-3.5 h-3.5 text-[#2563EB]" />
                      <span className="hidden sm:inline">AI Draft</span>
                    </button>
                  </div>

                  {/* Send Button [Send ▾] */}
                  <div className="flex items-center">
                    <button
                      type="submit"
                      disabled={!inputText.trim()}
                      className={`flex items-center gap-1.5 px-4 py-1.5 text-[13px] font-medium text-white rounded-md transition-colors ${
                        composerMode === 'note'
                          ? 'bg-[#B45309] hover:bg-[#92400E] disabled:bg-[#FDE68A]'
                          : 'bg-[#107548] hover:bg-[#0c5c38] disabled:bg-[#D1D5DB]'
                      }`}
                    >
                      <span>{composerMode === 'note' ? 'Simpan Note' : 'Send'}</span>
                      <ChevronDown className="w-3.5 h-3.5 opacity-80" />
                    </button>
                  </div>
                </div>
              </div>
            </form>
          </div>
        </div>
      ) : (
        <div className="flex-1 flex items-center justify-center p-8 text-[#9CA3AF]">
          Pilih percakapan dari daftar.
        </div>
      )}

      {/* ================= COLUMN 3: RIGHT DETAILS PANEL (Matching Image) ================= */}
      {selectedConv && showRightPanel && (
        <div className="w-full md:w-[280px] lg:w-[320px] xl:w-[340px] shrink-0 border-l border-[#E5E7EB] bg-white flex flex-col h-full overflow-y-auto z-10 animate-in slide-in-from-right duration-150">
          {/* Header Segmented Tabs: [ Details ] [ Juno / AI ] */}
          <div className="p-3 border-b border-[#E5E7EB] flex items-center justify-between">
            <div className="flex items-center p-0.5 bg-[#F3F4F6] rounded-lg text-[12px] font-medium flex-1 mr-2">
              <button
                onClick={() => setActiveInspectorTab('details')}
                className={`flex-1 py-1 rounded-md text-center transition-colors ${
                  activeInspectorTab === 'details'
                    ? 'bg-white text-[#111827] shadow-2xs font-semibold'
                    : 'text-[#6B7280] hover:text-[#111827]'
                }`}
              >
                Details
              </button>
              <button
                onClick={() => setActiveInspectorTab('juno')}
                className={`flex-1 py-1 rounded-md text-center transition-colors ${
                  activeInspectorTab === 'juno'
                    ? 'bg-white text-[#2563EB] shadow-2xs font-semibold'
                    : 'text-[#6B7280] hover:text-[#111827]'
                }`}
              >
                Candra AI
              </button>
            </div>

            <button
              onClick={() => setShowRightPanel(false)}
              className="p-1.5 text-[#9CA3AF] hover:text-[#111827] rounded-md"
              title="Tutup panel"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="p-4 space-y-6">
            {/* Contact Avatar & Name */}
            <div className="flex flex-col items-center text-center pb-4 border-b border-[#E5E7EB]">
              <div className="relative mb-2">
                <ActorAvatar
                  actor={selectedConv.id === 'conv-theo' ? 'prospect' : 'prospect'}
                  size={54}
                  name={selectedConv.businessName}
                />
                <span className="w-3.5 h-3.5 rounded-full bg-[#10B981] ring-2 ring-white absolute bottom-0 right-0" />
              </div>

              <div className="flex items-center gap-1.5">
                <h3 className="text-[16px] font-semibold text-[#111827]">
                  {selectedConv.businessName}
                </h3>
                <ExternalLink className="w-3.5 h-3.5 text-[#9CA3AF] cursor-pointer hover:text-[#111827]" />
              </div>
              <p className="text-[12px] text-[#6B7280]">{selectedConv.segment}</p>
            </div>

            {/* Contact Quick Data: Email, Phone, Country, Integrations */}
            <div className="space-y-2.5 text-[13px] text-[#374151]">
              {selectedConv.email && (
                <div className="flex items-center justify-between group">
                  <div className="flex items-center gap-2 truncate">
                    <Mail className="w-4 h-4 text-[#9CA3AF] shrink-0" />
                    <span className="truncate">{selectedConv.email}</span>
                  </div>
                  <button
                    onClick={() => handleCopyEmail(selectedConv.email)}
                    className="p-1 text-[#9CA3AF] hover:text-[#111827] rounded-sm shrink-0"
                    title="Salin email"
                  >
                    {isCopiedEmail ? <Check className="w-3.5 h-3.5 text-[#107548]" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                </div>
              )}

              <div className="flex items-center gap-2">
                <Phone className="w-4 h-4 text-[#9CA3AF] shrink-0" />
                <span className="font-mono">{selectedConv.phoneMasked}</span>
              </div>

              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-[#9CA3AF] shrink-0" />
                <span>{selectedConv.country || 'Bali, Indonesia'}</span>
              </div>

              {/* Integration links matching screenshot */}
              <div className="pt-2 border-t border-[#F3F4F6] space-y-1.5 text-[12px] text-[#4B5563]">
                <a href="#stripe" onClick={(e) => e.preventDefault()} className="flex items-center gap-2 hover:text-[#2563EB]">
                  <ExternalLink className="w-3.5 h-3.5 text-[#9CA3AF]" />
                  <span>Stripe customer</span>
                </a>
                <a href="#hubspot" onClick={(e) => e.preventDefault()} className="flex items-center gap-2 hover:text-[#2563EB]">
                  <ExternalLink className="w-3.5 h-3.5 text-[#9CA3AF]" />
                  <span>HubSpot contact</span>
                </a>
                <a href="#admin" onClick={(e) => e.preventDefault()} className="flex items-center gap-2 hover:text-[#2563EB]">
                  <ExternalLink className="w-3.5 h-3.5 text-[#9CA3AF]" />
                  <span>Internal admin lookup</span>
                </a>
              </div>
            </div>

            {/* Accordion 1: Actions ⌃ */}
            <div className="border-t border-[#E5E7EB] pt-3">
              <button
                onClick={() => setActionsExpanded(!actionsExpanded)}
                className="w-full flex items-center justify-between text-[13px] font-semibold text-[#111827] py-1"
              >
                <span>Actions</span>
                {actionsExpanded ? <ChevronUp className="w-4 h-4 text-[#9CA3AF]" /> : <ChevronDown className="w-4 h-4 text-[#9CA3AF]" />}
              </button>

              {actionsExpanded && (
                <div className="mt-3 space-y-3">
                  {/* Select Agent Dropdown */}
                  <div>
                    <label className="text-[11px] font-medium text-[#6B7280] block mb-1">
                      Assigned agent
                    </label>
                    <select
                      value={selectedConv.assignedAgent || 'Candra (AI Sales)'}
                      onChange={(e) => {
                        const val = e.target.value;
                        setConversations((prev) =>
                          prev.map((c) => (c.id === selectedConv.id ? { ...c, assignedAgent: val } : c))
                        );
                      }}
                      className="w-full p-2 bg-[#F9FAFB] border border-[#E5E7EB] rounded-lg text-[13px] text-[#111827] focus:outline-hidden"
                    >
                      <option value="Candra (AI Sales)">Candra (AI Sales)</option>
                      <option value="Irfan (Founder)">Irfan (Founder)</option>
                      <option value="Angga (Engineering)">Angga (Engineering)</option>
                    </select>
                  </div>

                  {/* Team / Tier */}
                  <div>
                    <label className="text-[11px] font-medium text-[#6B7280] block mb-1">
                      Team queue
                    </label>
                    <select
                      value={selectedConv.supportTier || 'Tier-1 Support'}
                      onChange={(e) => {
                        const val = e.target.value;
                        setConversations((prev) =>
                          prev.map((c) => (c.id === selectedConv.id ? { ...c, supportTier: val } : c))
                        );
                      }}
                      className="w-full p-2 bg-[#F9FAFB] border border-[#E5E7EB] rounded-lg text-[13px] text-[#111827] focus:outline-hidden"
                    >
                      <option value="Tier-1 Support">💪 Tier-1 Support</option>
                      <option value="Eskalasi: Harga">⚡ Eskalasi: Harga</option>
                      <option value="Sales">💼 Sales</option>
                      <option value="Engineering">🛠️ Engineering</option>
                    </select>
                  </div>

                  {/* Priority */}
                  <div>
                    <label className="text-[11px] font-medium text-[#6B7280] block mb-1">
                      Priority
                    </label>
                    <select
                      value={selectedConv.priority || 'Low'}
                      onChange={(e) => {
                        const val = e.target.value as any;
                        setConversations((prev) =>
                          prev.map((c) => (c.id === selectedConv.id ? { ...c, priority: val } : c))
                        );
                      }}
                      className="w-full p-2 bg-[#F9FAFB] border border-[#E5E7EB] rounded-lg text-[13px] text-[#111827] focus:outline-hidden"
                    >
                      <option value="Low">Low</option>
                      <option value="Medium">Medium</option>
                      <option value="High">High</option>
                    </select>
                  </div>

                  {/* Tags */}
                  <div>
                    <label className="text-[11px] font-medium text-[#6B7280] block mb-1">
                      Tags
                    </label>
                    <div className="flex flex-wrap gap-1.5 p-2 bg-[#F9FAFB] border border-[#E5E7EB] rounded-lg">
                      {(selectedConv.tags || ['onboarding', 'feedback']).map((tag) => (
                        <span
                          key={tag}
                          className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-white border border-[#E5E7EB] text-[12px] text-[#374151]"
                        >
                          <span>{tag}</span>
                          <button
                            onClick={() => handleRemoveTag(tag)}
                            className="text-[#9CA3AF] hover:text-[#B42318]"
                          >
                            ×
                          </button>
                        </span>
                      ))}
                      <button
                        onClick={handleSuggestTags}
                        className="text-[12px] text-[#2563EB] hover:underline px-1 py-0.5"
                      >
                        + Select tags
                      </button>
                    </div>

                    <button
                      onClick={handleSuggestTags}
                      className="mt-2 w-full flex items-center justify-center gap-1.5 py-1.5 text-[12px] font-medium text-[#2563EB] bg-[#EFF8FF] rounded-lg border border-[#B2DDFF] hover:bg-[#E0F2FE] transition-colors"
                    >
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>Suggest tags</span>
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Accordion 2: Information ⌃ */}
            <div className="border-t border-[#E5E7EB] pt-3">
              <button
                onClick={() => setInfoExpanded(!infoExpanded)}
                className="w-full flex items-center justify-between text-[13px] font-semibold text-[#111827] py-1"
              >
                <span>Information</span>
                {infoExpanded ? <ChevronUp className="w-4 h-4 text-[#9CA3AF]" /> : <ChevronDown className="w-4 h-4 text-[#9CA3AF]" />}
              </button>

              {infoExpanded && (
                <div className="mt-3 space-y-2 text-[12px]">
                  <div className="flex items-center justify-between">
                    <span className="text-[#6B7280]">Inbox</span>
                    <span className="font-medium text-[#111827]">
                      {selectedConv.inboxChannel || 'Live chat'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-[#6B7280]">Reference</span>
                    <span className="font-mono text-[#111827]">
                      #{selectedConv.referenceNumber || '142'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-[#6B7280]">Initiated at</span>
                    <span className="font-mono text-[#111827]">
                      {selectedConv.initiatedAt || 'Sep 2, 2026, 11:31 PM'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-[#6B7280]">First reply at</span>
                    <span className="font-mono text-[#111827]">
                      {selectedConv.firstReplyAt || 'Sep 3, 2026, 12:55 AM'}
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
