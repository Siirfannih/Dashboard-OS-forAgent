import React, { useState } from 'react';
import { 
  Plus, 
  Send, 
  Sparkles, 
  ArrowRight,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { ActorAvatar } from '../common/Pill';

interface ChatMessage {
  id: string;
  sender: 'user' | 'agent';
  agentId?: 'candra' | 'worker-pc' | 'angga';
  text: string;
  time: string;
}

interface ChatSession {
  id: string;
  title: string;
  agentId: 'candra' | 'worker-pc' | 'angga';
  lastActive: string;
  messages: ChatMessage[];
}

const STANDBY_AGENTS = [
  {
    id: 'candra' as const,
    name: 'Candra',
    role: 'AI Head of Sales',
    desc: 'Skoring prospek, analisis draft WhatsApp, dan rekomendasi closing.',
  },
  {
    id: 'worker-pc' as const,
    name: 'Worker Riset PC-1',
    role: 'Research Worker',
    desc: 'Scraping prospek villa & klinik Bali, validasi GMaps, dan kontak.',
  },
  {
    id: 'angga' as const,
    name: 'Angga',
    role: 'Engineering Lead',
    desc: 'Pemeliharaan sesi WhatsApp Baileys dan kestabilan sistem VPS.',
  },
];

const INITIAL_SESSIONS: ChatSession[] = [
  {
    id: 'sess-1',
    title: 'Candra · Playbook Klinik Lumina',
    agentId: 'candra',
    lastActive: '07:15 WITA',
    messages: [
      {
        id: 'm1',
        sender: 'user',
        text: 'Candra, kenapa kamu memilih Playbook C untuk Klinik Estetika Lumina Denpasar?',
        time: '07:12 WITA',
      },
      {
        id: 'm2',
        sender: 'agent',
        agentId: 'candra',
        text: 'Selamat pagi, Irfan! Saya memilih Playbook C karena scraper Worker PC-1 mendeteksi link appointment klinik mengalami HTTP 404 sejak kemarin sore, padahal iklan Instagram mereka aktif. Kita masuk dengan observasi faktual yang sopan.',
        time: '07:13 WITA',
      },
    ],
  },
  {
    id: 'sess-2',
    title: 'Angga · Audit WhatsApp #31',
    agentId: 'angga',
    lastActive: '02:25 WITA',
    messages: [
      {
        id: 'm1',
        sender: 'user',
        text: 'Angga, apakah server VPS Baileys perlu di-reboot untuk menyambungkan ulang profil Candra?',
        time: '02:20 WITA',
      },
      {
        id: 'm2',
        sender: 'agent',
        agentId: 'angga',
        text: 'Halo Irfan. Service Baileys berjalan terisolasi di container Docker tanpa perlu reboot VPS. Token sesi terputus karena update socket WhatsApp, endpoint QR pairing baru sudah siap di tiket #31.',
        time: '02:25 WITA',
      },
    ],
  },
];

export function TeamBoarding() {
  const [sessions, setSessions] = useState<ChatSession[]>(INITIAL_SESSIONS);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [promptInput, setPromptInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [focusedMessageIndex, setFocusedMessageIndex] = useState<number | null>(null);

  const activeSession = sessions.find((s) => s.id === activeSessionId);

  // When switching sessions, default focused message index to the latest message
  const handleSelectSession = (id: string | null) => {
    setActiveSessionId(id);
    setFocusedMessageIndex(null);
  };

  const handleStartWithAgent = (agentId: 'candra' | 'worker-pc' | 'angga', agentName: string) => {
    let greeting = '';
    if (agentId === 'candra') {
      greeting = 'Halo Irfan! Candra di sini. Saya siap mendiskusikan scoring prospek, strategi closing, atau penyesuaian draft pesan.';
    } else if (agentId === 'worker-pc') {
      greeting = 'Worker Riset PC-1 aktif. Engine riset siap menjalankan scraping baru atau memverifikasi kontak prospek Bali.';
    } else {
      greeting = 'Angga melapor. Sistem infrastruktur dan sesi WhatsApp Baileys siap dipantau dan disesuaikan.';
    }

    const newSession: ChatSession = {
      id: `sess-${Date.now()}`,
      title: `${agentName}`,
      agentId,
      lastActive: 'Baru saja',
      messages: [
        {
          id: `m-${Date.now()}-greet`,
          sender: 'agent',
          agentId,
          text: greeting,
          time: 'Baru saja',
        },
      ],
    };

    setSessions((prev) => [newSession, ...prev]);
    setActiveSessionId(newSession.id);
    setFocusedMessageIndex(0);
  };

  const handleSendMessage = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!promptInput.trim()) return;

    const text = promptInput.trim();
    setPromptInput('');

    if (!activeSession) {
      // Create session with default agent (Candra)
      const newSession: ChatSession = {
        id: `sess-${Date.now()}`,
        title: 'Candra',
        agentId: 'candra',
        lastActive: 'Baru saja',
        messages: [
          {
            id: `m-${Date.now()}-1`,
            sender: 'user',
            text,
            time: 'Baru saja',
          },
        ],
      };

      setSessions((prev) => [newSession, ...prev]);
      setActiveSessionId(newSession.id);
      setFocusedMessageIndex(0);
      setIsTyping(true);

      setTimeout(() => {
        const replyMsg: ChatMessage = {
          id: `m-${Date.now()}-2`,
          sender: 'agent',
          agentId: 'candra',
          text: 'Saya terima instruksi ini. Konteks pipeline sudah saya sesuaikan dengan prioritas penawaran terbaru.',
          time: 'Baru saja',
        };
        setSessions((prev) =>
          prev.map((s) =>
            s.id === newSession.id
              ? { ...s, messages: [...s.messages, replyMsg] }
              : s
          )
        );
        setIsTyping(false);
        setFocusedMessageIndex(1);
      }, 800);
      return;
    }

    const userMsg: ChatMessage = {
      id: `m-${Date.now()}`,
      sender: 'user',
      text,
      time: 'Baru saja',
    };

    const nextLen = activeSession.messages.length + 1;

    setSessions((prev) =>
      prev.map((s) =>
        s.id === activeSession.id
          ? {
              ...s,
              messages: [...s.messages, userMsg],
              lastActive: 'Baru saja',
            }
          : s
      )
    );

    setFocusedMessageIndex(nextLen - 1);
    setIsTyping(true);

    setTimeout(() => {
      const targetAgent = activeSession.agentId;
      let replyText = '';
      if (targetAgent === 'candra') {
        replyText = 'Dimengerti Irfan. Saya pastikan scoring kelayakan dan draft closing selaras dengan arahan ini.';
      } else if (targetAgent === 'worker-pc') {
        replyText = 'Instruksi tersimpan. Worker PC-1 siap menjalankan target parameter ini pada siklus riset berikutnya.';
      } else {
        replyText = 'Siap Irfan. Log container dan stabilitas service WhatsApp tetap termonitor normal.';
      }

      const agentReply: ChatMessage = {
        id: `m-${Date.now()}-reply`,
        sender: 'agent',
        agentId: targetAgent,
        text: replyText,
        time: 'Baru saja',
      };

      setSessions((prev) =>
        prev.map((s) =>
          s.id === activeSession.id
            ? {
                ...s,
                messages: [...s.messages, agentReply],
              }
            : s
        )
      );
      setIsTyping(false);
      setFocusedMessageIndex(nextLen);
    }, 800);
  };

  // Determine which single message is currently displayed in the 1-message view
  const currentMessageIndex = 
    activeSession && activeSession.messages.length > 0
      ? focusedMessageIndex !== null && focusedMessageIndex < activeSession.messages.length
        ? focusedMessageIndex
        : activeSession.messages.length - 1
      : 0;

  const currentMessage = activeSession?.messages[currentMessageIndex];

  return (
    <div className="flex-1 flex h-full overflow-hidden bg-white text-[#111827]">
      {/* ================= LEFT SIDEBAR: SIMPLE CONVERSATION HISTORY ================= */}
      <div className="hidden md:flex w-[240px] shrink-0 border-r border-[#F3F4F6] bg-[#FAFAFA] flex-col h-full select-none">
        <div className="p-4 border-b border-[#F3F4F6]">
          <button
            onClick={() => handleSelectSession(null)}
            className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-xl bg-white border border-[#E5E7EB] text-[#111827] text-[13px] font-medium hover:bg-[#F9FAFB] hover:border-[#D1D5DB] transition-all shadow-2xs"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Mulai Obrolan Baru</span>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-3 space-y-1">
          {sessions.map((sess) => {
            const isSelected = sess.id === activeSessionId;
            return (
              <div
                key={sess.id}
                onClick={() => handleSelectSession(sess.id)}
                className={`p-2.5 rounded-xl cursor-pointer transition-colors text-left flex items-start gap-2.5 ${
                  isSelected
                    ? 'bg-white shadow-2xs border border-[#E5E7EB]'
                    : 'hover:bg-white/60 border border-transparent'
                }`}
              >
                <div className="mt-0.5 shrink-0">
                  <ActorAvatar
                    actor={sess.agentId}
                    size={22}
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[13px] font-medium text-[#111827] truncate">
                    {sess.title}
                  </p>
                  <p className="text-[11px] text-[#9CA3AF] font-mono mt-0.5">
                    {sess.lastActive}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ================= MAIN CONTENT: MINIMALIST, HIGH-WHITESPACE ================= */}
      <div className="flex-1 flex flex-col h-full bg-white overflow-hidden min-w-0">
        {!activeSession ? (
          /* ================= STANDBY VIEW: CLEAN, MINIMALIST & 1-MESSAGE CLARITY ================= */
          <div className="flex-1 flex flex-col justify-center items-center px-6 sm:px-12 max-w-[820px] mx-auto w-full">
            <div className="w-full space-y-12">
              {/* Minimalist Greeting */}
              <div className="text-center space-y-2">
                <h1 className="text-[36px] sm:text-[46px] font-semibold text-[#111827] tracking-tight">
                  How Can I Help You?
                </h1>
              </div>

              {/* Minimalist Standby Agent Cards (Ample whitespace) */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
                {STANDBY_AGENTS.map((agent) => (
                  <div
                    key={agent.id}
                    onClick={() => handleStartWithAgent(agent.id, agent.name)}
                    className="p-6 rounded-2xl border border-[#F3F4F6] bg-white hover:border-[#E5E7EB] hover:shadow-sm transition-all cursor-pointer group flex flex-col justify-between space-y-5"
                  >
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <ActorAvatar actor={agent.id} size={40} />
                        <span className="w-2 h-2 rounded-full bg-[#10B981]" />
                      </div>

                      <div className="space-y-0.5">
                        <div className="text-[17px] font-semibold text-[#111827] group-hover:text-[#2563EB] transition-colors">
                          {agent.name}
                        </div>
                        <div className="text-[12px] text-[#9CA3AF]">
                          {agent.role}
                        </div>
                      </div>

                      <p className="text-[13px] text-[#6B7280] leading-relaxed">
                        {agent.desc}
                      </p>
                    </div>

                    <div className="pt-3 border-t border-[#F9FAFB] flex items-center justify-between text-[12px] text-[#2563EB] font-medium">
                      <span>Mulai Diskusi</span>
                      <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                    </div>
                  </div>
                ))}
              </div>

              {/* Simple Clean Input Bar */}
              <div className="pt-2">
                <form onSubmit={handleSendMessage} className="relative">
                  <div className="flex items-center rounded-2xl border border-[#E5E7EB] bg-white shadow-2xs hover:border-[#D1D5DB] focus-within:border-[#111827] transition-all px-4 py-3.5 gap-3">
                    <input
                      type="text"
                      value={promptInput}
                      onChange={(e) => setPromptInput(e.target.value)}
                      placeholder="Ketik pesan atau perintah untuk agen..."
                      className="flex-1 text-[14px] text-[#111827] placeholder:text-[#9CA3AF] bg-transparent focus:outline-hidden"
                    />
                    <button
                      type="submit"
                      disabled={!promptInput.trim()}
                      className="p-2 bg-[#111827] text-white rounded-xl hover:bg-[#1F2937] disabled:opacity-20 disabled:cursor-not-allowed transition-colors shrink-0"
                    >
                      <Send className="w-4 h-4" />
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        ) : (
          /* ================= ACTIVE INTERACTION: 1 ACTIVE MESSAGE INTERACTION AT A TIME ================= */
          <div className="flex-1 flex flex-col h-full overflow-hidden bg-white">
            {/* Top Minimalist Header */}
            <div className="px-6 py-4 border-b border-[#F3F4F6] flex items-center justify-between bg-white shrink-0">
              <div className="flex items-center gap-3">
                <ActorAvatar actor={activeSession.agentId} size={32} />
                <div>
                  <h2 className="text-[15px] font-semibold text-[#111827]">
                    {activeSession.title}
                  </h2>
                </div>
              </div>

              <div className="flex items-center gap-3">
                {/* 1-Message Interaction Pager */}
                {activeSession.messages.length > 1 && (
                  <div className="flex items-center gap-1.5 text-[12px] text-[#6B7280] font-mono bg-[#F9FAFB] px-2.5 py-1 rounded-lg border border-[#E5E7EB]">
                    <span>
                      Pesan {currentMessageIndex + 1} / {activeSession.messages.length}
                    </span>
                    <button
                      type="button"
                      disabled={currentMessageIndex === 0}
                      onClick={() => setFocusedMessageIndex(Math.max(0, currentMessageIndex - 1))}
                      className="p-1 hover:text-[#111827] disabled:opacity-30 disabled:cursor-not-allowed"
                      title="Pesan sebelumnya"
                    >
                      <ChevronLeft className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      disabled={currentMessageIndex === activeSession.messages.length - 1}
                      onClick={() => setFocusedMessageIndex(Math.min(activeSession.messages.length - 1, currentMessageIndex + 1))}
                      className="p-1 hover:text-[#111827] disabled:opacity-30 disabled:cursor-not-allowed"
                      title="Pesan berikutnya"
                    >
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}

                <button
                  onClick={() => handleSelectSession(null)}
                  className="px-3 py-1.5 text-[12px] font-medium text-[#6B7280] hover:text-[#111827] bg-[#F9FAFB] rounded-lg border border-[#E5E7EB] hover:bg-white transition-colors"
                >
                  Selesai
                </button>
              </div>
            </div>

            {/* Central 1-Message Interaction Viewport with High Whitespace */}
            <div className="flex-1 overflow-y-auto flex flex-col justify-center items-center px-6 sm:px-12 max-w-[760px] mx-auto w-full">
              {currentMessage ? (
                <div className="w-full space-y-4">
                  <div className="flex items-center gap-2.5">
                    <ActorAvatar 
                      actor={currentMessage.sender === 'user' ? 'irfan' : (currentMessage.agentId || activeSession.agentId)} 
                      size={28} 
                    />
                    <div className="flex items-center gap-2">
                      <span className="text-[13px] font-semibold text-[#111827]">
                        {currentMessage.sender === 'user'
                          ? 'Irfan'
                          : activeSession.agentId === 'worker-pc'
                          ? 'Worker Riset PC-1'
                          : activeSession.agentId === 'angga'
                          ? 'Angga'
                          : 'Candra'}
                      </span>
                      <span className="text-[11px] text-[#9CA3AF] font-mono">
                        {currentMessage.time}
                      </span>
                    </div>
                  </div>

                  <div className="p-6 sm:p-8 rounded-2xl border border-[#F3F4F6] bg-[#FAFAFA] text-[#111827] shadow-2xs">
                    <p className="text-[16px] sm:text-[17px] leading-relaxed whitespace-pre-wrap text-[#1F2937]">
                      {currentMessage.text}
                    </p>
                  </div>
                </div>
              ) : null}

              {isTyping && (
                <div className="flex items-center gap-2 text-[12px] text-[#6B7280] p-3 bg-white rounded-xl border border-[#E5E7EB] w-fit mt-4 animate-pulse">
                  <Sparkles className="w-4 h-4 text-[#2563EB]" />
                  <span>Agen sedang menyiapkan respon...</span>
                </div>
              )}
            </div>

            {/* Minimalist Reply Input */}
            <div className="p-4 sm:p-6 bg-white border-t border-[#F3F4F6] shrink-0 max-w-[760px] mx-auto w-full">
              <form onSubmit={handleSendMessage} className="flex items-center gap-3">
                <input
                  type="text"
                  value={promptInput}
                  onChange={(e) => setPromptInput(e.target.value)}
                  placeholder="Tulis instruksi atau balasan..."
                  className="flex-1 px-4 py-3 text-[14px] bg-[#FAFAFA] border border-[#E5E7EB] rounded-xl text-[#111827] placeholder:text-[#9CA3AF] focus:outline-hidden focus:border-[#111827] focus:bg-white transition-all"
                />
                <button
                  type="submit"
                  disabled={!promptInput.trim()}
                  className="px-5 py-3 bg-[#111827] text-white text-[13px] font-medium rounded-xl hover:bg-[#1F2937] disabled:opacity-20 disabled:cursor-not-allowed transition-colors flex items-center gap-2 shrink-0"
                >
                  <span>Kirim</span>
                  <Send className="w-3.5 h-3.5" />
                </button>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
