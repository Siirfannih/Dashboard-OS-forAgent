import React, { useState } from 'react';
import { 
  X, 
  AlertCircle, 
  Clock, 
  CheckCircle2, 
  HelpCircle, 
  LayoutGrid, 
  RefreshCw,
  Cpu,
  ChevronRight,
  Filter
} from 'lucide-react';
import { PipelineCard, ActorType } from '../../types';
import { StatusPill, ActorAvatar } from '../common/Pill';

interface PipelineProps {
  cards: PipelineCard[];
  selectedCardId?: string;
}

export function Pipeline({ cards, selectedCardId }: PipelineProps) {
  const [activeBatch, setActiveBatch] = useState('batch-14');
  const [openedCardId, setOpenedCardId] = useState<string | null>(selectedCardId || 'pipe-blk-1');

  const openedCard = cards.find((c) => c.id === openedCardId);

  // Group columns
  const colAntre = cards.filter((c) => c.status === 'antre');
  const colDiklaim = cards.filter((c) => c.status === 'diklaim');
  const colBerjalan = cards.filter((c) => c.status === 'berjalan');
  const colDikirim = cards.filter((c) => c.status === 'dikirim');
  const colDiterima = cards.filter((c) => c.status === 'diterima');

  // Perlu perhatian lane
  const laneRevisi = cards.filter((c) => c.status === 'revisi');
  const laneTerblokir = cards.filter((c) => c.status === 'terblokir');
  const laneGagal = cards.filter((c) => c.status === 'gagal');

  const budgetSpent = 18400;
  const budgetMax = 40000;
  const budgetPct = Math.round((budgetSpent / budgetMax) * 100);

  return (
    <div className="flex-1 flex flex-col h-full bg-[#F9FAFB] overflow-hidden">
      {/* Header */}
      <div className="p-6 bg-white border-b border-[#E5E7EB] shrink-0">
        <div className="max-w-[1400px] mx-auto space-y-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <select
                  value={activeBatch}
                  onChange={(e) => setActiveBatch(e.target.value)}
                  className="text-[20px] font-semibold text-[#111827] bg-transparent border-0 focus:ring-0 p-0 cursor-pointer"
                >
                  <option value="batch-14">Batch #14 · Klinik estetika Denpasar</option>
                  <option value="batch-13">Batch #13 · Dokter gigi &amp; ortodonti Badung</option>
                  <option value="batch-12">Batch #12 · Villa &amp; boutique hotel Ubud</option>
                </select>
                <StatusPill variant="green" dot>
                  Aktif
                </StatusPill>
              </div>

              <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-[13px] text-[#6B7280]">
                <span>Target 25 prospek</span>
                <span aria-hidden="true">·</span>
                <span>Layanan: Smart Growth</span>
                <span aria-hidden="true">·</span>
                <span>Bukti maks 24 jam</span>
                <span aria-hidden="true">·</span>
                <span className="font-mono text-[#111827]">Deadline 07:30 WITA</span>
              </div>
            </div>

            {/* Budget Progress Bar */}
            <div className="w-full md:w-[320px] p-3 rounded-lg border border-[#E5E7EB] bg-[#F9FAFB] space-y-1.5">
              <div className="flex items-center justify-between text-[12px]">
                <span className="text-[#6B7280]">Anggaran Batch:</span>
                <span className="font-mono font-medium text-[#111827]">
                  Rp18.400 / Rp40.000
                </span>
              </div>
              <div className="w-full h-2 rounded-full bg-[#E5E7EB] overflow-hidden">
                <div
                  style={{ width: `${budgetPct}%` }}
                  className="h-full bg-[#2563EB] rounded-full transition-all"
                />
              </div>
              <div className="flex items-center justify-between text-[11px] text-[#9CA3AF] font-mono">
                <span>Model: DeepSeek Flash</span>
                <span>{budgetPct}% terpakai</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Board Area */}
      <div className="flex-1 flex overflow-hidden">
        {/* Kanban Board Container (Scrollable Horizontally) */}
        <div className="flex-1 overflow-x-auto overflow-y-hidden p-6">
          <div className="flex gap-4 min-w-[1240px] h-full items-start">
            {/* Column 1: Antre */}
            <KanbanColumn
              title="Antre"
              count={colAntre.length}
              cards={colAntre}
              onSelectCard={setOpenedCardId}
              selectedId={openedCardId}
            />

            {/* Column 2: Diklaim */}
            <KanbanColumn
              title="Diklaim"
              count={colDiklaim.length}
              cards={colDiklaim}
              onSelectCard={setOpenedCardId}
              selectedId={openedCardId}
            />

            {/* Column 3: Berjalan */}
            <KanbanColumn
              title="Berjalan"
              count={colBerjalan.length}
              cards={colBerjalan}
              badgeVariant="purple"
              onSelectCard={setOpenedCardId}
              selectedId={openedCardId}
            />

            {/* Column 4: Dikirim */}
            <KanbanColumn
              title="Dikirim"
              count={colDikirim.length}
              cards={colDikirim}
              onSelectCard={setOpenedCardId}
              selectedId={openedCardId}
            />

            {/* Column 5: Diterima */}
            <KanbanColumn
              title="Diterima"
              count={colDiterima.length}
              cards={colDiterima}
              badgeVariant="green"
              onSelectCard={setOpenedCardId}
              selectedId={openedCardId}
            />

            {/* Separate Right Lane: "Perlu perhatian" */}
            <div className="w-[300px] shrink-0 bg-[#FEF3F2]/40 rounded-xl border border-[#FECDCA] p-3 flex flex-col h-full overflow-hidden">
              <div className="flex items-center justify-between mb-3 pb-2 border-b border-[#FECDCA]">
                <div className="flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-[#B42318]" />
                  <span className="text-[14px] font-semibold text-[#B42318]">
                    Perlu perhatian
                  </span>
                </div>
                <span className="text-[11px] font-mono font-semibold px-2 py-0.5 rounded-full bg-[#FEF3F2] text-[#B42318] border border-[#FECDCA]">
                  {laneRevisi.length + laneTerblokir.length + laneGagal.length}
                </span>
              </div>

              <div className="flex-1 overflow-y-auto space-y-4 pr-1">
                {/* Subgroup: Perlu revisi (2) */}
                <div>
                  <div className="text-[11px] font-bold uppercase tracking-[0.06em] text-[#B54708] mb-1.5 flex items-center justify-between">
                    <span>Perlu revisi</span>
                    <span className="font-mono">({laneRevisi.length})</span>
                  </div>
                  <div className="space-y-2">
                    {laneRevisi.map((card) => (
                      <KanbanCardItem
                        key={card.id}
                        card={card}
                        onSelect={() => setOpenedCardId(card.id)}
                        isSelected={card.id === openedCardId}
                      />
                    ))}
                  </div>
                </div>

                {/* Subgroup: Terblokir (2) */}
                <div>
                  <div className="text-[11px] font-bold uppercase tracking-[0.06em] text-[#B42318] mb-1.5 flex items-center justify-between">
                    <span>Terblokir</span>
                    <span className="font-mono">({laneTerblokir.length})</span>
                  </div>
                  <div className="space-y-2">
                    {laneTerblokir.map((card) => (
                      <KanbanCardItem
                        key={card.id}
                        card={card}
                        onSelect={() => setOpenedCardId(card.id)}
                        isSelected={card.id === openedCardId}
                      />
                    ))}
                  </div>
                </div>

                {/* Subgroup: Gagal (0) */}
                <div>
                  <div className="text-[11px] font-bold uppercase tracking-[0.06em] text-[#6B7280] mb-1.5 flex items-center justify-between">
                    <span>Gagal</span>
                    <span className="font-mono">({laneGagal.length})</span>
                  </div>
                  {laneGagal.length === 0 && (
                    <div className="p-3 text-center text-[12px] text-[#9CA3AF] bg-white/60 rounded-lg border border-[#E5E7EB]">
                      0 kegagalan fatal
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Drawer (When a card is opened) */}
        {openedCard && (
          <div className="fixed md:static inset-y-0 right-0 z-40 w-full sm:w-[360px] shrink-0 bg-white border-l border-[#E5E7EB] flex flex-col h-full shadow-xl md:shadow-none animate-in slide-in-from-right duration-150">
            {/* Drawer Header */}
            <div className="p-4 border-b border-[#E5E7EB] flex items-center justify-between">
              <div>
                <span className="text-[11px] font-bold uppercase tracking-[0.06em] text-[#9CA3AF]">
                  DETAIL TASK RISET
                </span>
                <h3 className="text-[16px] font-semibold text-[#111827]">
                  {openedCard.businessName}
                </h3>
              </div>
              <button
                onClick={() => setOpenedCardId(null)}
                className="p-1 rounded-lg text-[#9CA3AF] hover:text-[#111827]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Drawer Body */}
            <div className="flex-1 overflow-y-auto p-5 space-y-5 text-[13px]">
              {/* Status & Assignment */}
              <div className="p-3 bg-[#F9FAFB] rounded-lg border border-[#E5E7EB] space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[#6B7280]">Status Task:</span>
                  <StatusPill
                    variant={
                      openedCard.status === 'terblokir'
                        ? 'red'
                        : openedCard.status === 'berjalan'
                        ? 'purple'
                        : openedCard.status === 'diterima'
                        ? 'green'
                        : 'amber'
                    }
                  >
                    {openedCard.status.toUpperCase()}
                  </StatusPill>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[#6B7280]">Jenis Task:</span>
                  <span className="font-medium text-[#111827]">{openedCard.taskType}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[#6B7280]">Worker:</span>
                  <span className="font-mono text-[#7A5AF8] font-medium">{openedCard.worker}</span>
                </div>
                <div className="flex items-center justify-between font-mono text-[12px] text-[#6B7280] pt-1 border-t border-[#E5E7EB]">
                  <span>Biaya task: Rp{openedCard.costRp}</span>
                  <span>Checkpoint {openedCard.checkpoint}</span>
                </div>
              </div>

              {/* Blocked or Revision Alert */}
              {openedCard.blockedReason && (
                <div className="p-3 bg-[#FEF3F2] rounded-lg border border-[#FECDCA] space-y-1.5">
                  <div className="flex items-center gap-1.5 text-[#B42318] font-semibold">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>Penyebab Terblokir</span>
                  </div>
                  <p className="text-[13px] text-[#B42318]">
                    {openedCard.blockedReason}
                  </p>
                  <p className="text-[12px] text-[#4B5563] pt-1">
                    Pemilik langkah berikutnya: <strong>{openedCard.nextStepOwner}</strong>
                  </p>
                </div>
              )}

              {/* Revision Data: Revision r2, Candra's feedback as delta */}
              {openedCard.revisionData && (
                <div className="space-y-4">
                  <div className="p-3 bg-[#EFF8FF] rounded-lg border border-[#B2DDFF] space-y-2">
                    <div className="flex items-center justify-between text-[#175CD3]">
                      <span className="font-semibold text-[13px]">
                        Revisi Hasil ({openedCard.revisionData.revisionNum})
                      </span>
                      <span className="text-[11px] font-mono uppercase">Delta Feedback</span>
                    </div>
                    <div className="p-2.5 bg-white rounded-md border border-[#B2DDFF] text-[13px] text-[#111827] leading-relaxed">
                      "{openedCard.revisionData.candraFeedbackDelta}"
                    </div>
                  </div>

                  {/* Validation errors */}
                  <div className="space-y-2">
                    <div className="text-[11px] font-bold uppercase tracking-[0.06em] text-[#9CA3AF]">
                      ERROR VALIDATOR
                    </div>
                    <ul className="space-y-1.5">
                      {openedCard.revisionData.validationErrors.map((err, i) => (
                        <li
                          key={i}
                          className="p-2 bg-[#F9FAFB] rounded-md border border-[#E5E7EB] text-[12px] text-[#4B5563] flex items-start gap-2"
                        >
                          <span className="text-[#B42318] font-bold">✕</span>
                          <span>{err}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* History Timeline */}
                  <div className="space-y-2">
                    <div className="text-[11px] font-bold uppercase tracking-[0.06em] text-[#9CA3AF]">
                      RIWAYAT EKSEKUSI
                    </div>
                    <div className="relative pl-4 space-y-3 before:absolute before:left-1.5 before:top-1.5 before:bottom-1.5 before:w-[1px] before:bg-[#E5E7EB]">
                      {openedCard.revisionData.history.map((h, i) => (
                        <div key={i} className="relative text-[12px]">
                          <span className="absolute -left-[14px] top-1 w-2 h-2 rounded-full bg-[#7A5AF8] ring-2 ring-white" />
                          <div className="font-medium text-[#111827]">{h.event}</div>
                          <div className="text-[11px] text-[#9CA3AF] font-mono mt-0.5">{h.time}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Drawer Footer */}
            <div className="p-4 border-t border-[#E5E7EB] bg-[#F9FAFB] flex items-center justify-between">
              <span className="text-[12px] text-[#6B7280]">
                Lease habis {openedCard.leaseExpiry} WITA
              </span>
              <button
                onClick={() => setOpenedCardId(null)}
                className="px-3 py-1.5 bg-white border border-[#E5E7EB] rounded-lg text-[13px] font-medium text-[#111827] hover:bg-[#F3F4F6]"
              >
                Tutup Drawer
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function KanbanColumn({
  title,
  count,
  cards,
  badgeVariant = 'gray',
  onSelectCard,
  selectedId,
}: {
  title: string;
  count: number;
  cards: PipelineCard[];
  badgeVariant?: any;
  onSelectCard: (id: string) => void;
  selectedId: string | null;
}) {
  return (
    <div className="w-[230px] shrink-0 bg-white rounded-xl border border-[#E5E7EB] p-3 flex flex-col h-full overflow-hidden">
      <div className="flex items-center justify-between mb-3 pb-2 border-b border-[#E5E7EB]">
        <span className="text-[14px] font-semibold text-[#111827]">{title}</span>
        <span className="text-[12px] font-mono font-medium px-2 py-0.5 rounded-full bg-[#F3F4F6] text-[#4B5563]">
          {count}
        </span>
      </div>

      <div className="flex-1 overflow-y-auto space-y-2.5 pr-1">
        {cards.length === 0 ? (
          <div className="p-4 text-center text-[12px] text-[#9CA3AF]">Kosong</div>
        ) : (
          cards.map((card) => (
            <KanbanCardItem
              key={card.id}
              card={card}
              onSelect={() => onSelectCard(card.id)}
              isSelected={card.id === selectedId}
            />
          ))
        )}
      </div>
    </div>
  );
}

function KanbanCardItem({
  card,
  onSelect,
  isSelected,
}: {
  card: PipelineCard;
  onSelect: () => void;
  isSelected: boolean;
}) {
  const isRunning = card.status === 'berjalan';
  const isBlocked = card.status === 'terblokir';

  return (
    <div
      onClick={onSelect}
      className={`p-3 rounded-xl border cursor-pointer transition-all ${
        isSelected
          ? 'bg-[#EFF4FF] border-[#2563EB] shadow-xs'
          : isBlocked
          ? 'bg-[#FEF3F2]/60 border-[#FECDCA] hover:border-[#B42318]'
          : 'bg-white border-[#E5E7EB] hover:border-[#2563EB]/40'
      }`}
    >
      <div className="text-[13px] font-semibold text-[#111827] leading-snug mb-1.5 truncate">
        {card.businessName}
      </div>

      <div className="flex items-center justify-between gap-1 mb-2">
        <StatusPill variant={isRunning ? 'purple' : 'gray'} dot={isRunning} className="text-[11px] h-[20px]">
          {card.taskType}
        </StatusPill>
        <ActorAvatar actor="worker-pc" size={18} name={card.worker} />
      </div>

      {isBlocked && (
        <div className="mb-2 p-1.5 rounded-md bg-[#FEF3F2] border border-[#FECDCA] text-[11px] text-[#B42318] space-y-0.5">
          <p className="font-medium truncate">{card.blockedReason}</p>
          <p className="text-[10px] text-[#6B7280]">Langkah berikut: {card.nextStepOwner}</p>
        </div>
      )}

      <div className="text-[11px] font-mono text-[#9CA3AF] border-t border-[#F3F4F6] pt-1.5 flex items-center justify-between">
        <span>perc. {card.attempt}</span>
        <span>Rp{card.costRp}</span>
      </div>
    </div>
  );
}
