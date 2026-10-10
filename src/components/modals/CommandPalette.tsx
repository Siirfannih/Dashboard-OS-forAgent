import React, { useState, useEffect } from 'react';
import { Search, X, CheckSquare, MessageSquare, LayoutGrid, Users, DollarSign, Shield, FileText } from 'lucide-react';

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigate: (tab: string) => void;
}

export function CommandPalette({ isOpen, onClose, onNavigate }: CommandPaletteProps) {
  const [query, setQuery] = useState('');

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        if (isOpen) onClose();
        else setQuery('');
      } else if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const items = [
    { id: 'home', label: 'Home (Beranda & ringkasan operasional)', section: 'Navigasi', icon: FileText },
    { id: 'team-boarding', label: 'Team Boarding (Live Chatbot Asisten Agen Sales & Ops)', section: 'Asisten', icon: MessageSquare },
    { id: 'keputusan', label: 'Keputusan (7 draft menunggu persetujuan)', section: 'Sales', icon: CheckSquare },
    { id: 'percakapan', label: 'Percakapan (3 butuh tindakan: Villa Teratai Ubud)', section: 'Sales', icon: MessageSquare },
    { id: 'pipeline', label: 'Pipeline (Batch #14 · 2 task terblokir)', section: 'Sales', icon: LayoutGrid },
    { id: 'tim-agen', label: 'Tim Agen (Candra, Worker PC-1, Angga)', section: 'Operasi', icon: Users },
    { id: 'biaya-kapasitas', label: 'Biaya & Kapasitas (ChatGPT & DeepSeek)', section: 'Operasi', icon: DollarSign },
    { id: 'kebijakan', label: 'Kebijakan Operasional Sales & Kuota', section: 'Sistem', icon: Shield },
  ];

  const filtered = items.filter((item) =>
    item.label.toLowerCase().includes(query.toLowerCase()) ||
    item.section.toLowerCase().includes(query.toLowerCase())
  );

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-24 bg-black/40 backdrop-blur-xs p-4">
      <div 
        className="bg-white rounded-xl border border-[#E5E7EB] w-full max-w-[560px] overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-150"
        role="dialog"
        aria-modal="true"
      >
        <div className="flex items-center px-4 py-3 border-b border-[#E5E7EB]">
          <Search className="w-5 h-5 text-[#9CA3AF] shrink-0 mr-3" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Cari prospek, task, atau navigasi menu (mis. 'Klinik', 'Keputusan', 'Villa')..."
            className="w-full text-[14px] text-[#111827] placeholder:text-[#9CA3AF] focus:outline-hidden"
            autoFocus
          />
          <button
            onClick={onClose}
            className="text-[#9CA3AF] hover:text-[#111827] p-1 rounded-sm"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="max-h-[360px] overflow-y-auto p-2">
          {filtered.length === 0 ? (
            <div className="py-8 text-center text-[13px] text-[#6B7280]">
              Tidak ditemukan hasil untuk "{query}"
            </div>
          ) : (
            <div className="space-y-1">
              {filtered.map((item) => {
                const Icon = item.icon;
                return (
                  <button
                    key={item.id}
                    onClick={() => {
                      onNavigate(item.id);
                      onClose();
                    }}
                    className="w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-left text-[14px] text-[#111827] hover:bg-[#F3F4F6] transition-colors group"
                  >
                    <div className="flex items-center gap-3">
                      <Icon className="w-4 h-4 text-[#6B7280] group-hover:text-[#2563EB]" />
                      <span>{item.label}</span>
                    </div>
                    <span className="text-[11px] font-mono text-[#9CA3AF] uppercase">
                      {item.section}
                    </span>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        <div className="px-4 py-2 bg-[#F9FAFB] border-t border-[#E5E7EB] flex items-center justify-between text-[12px] text-[#9CA3AF]">
          <span>Gunakan panah untuk navigasi · Enter untuk memilih</span>
          <span className="font-mono">Esc untuk batal</span>
        </div>
      </div>
    </div>
  );
}
