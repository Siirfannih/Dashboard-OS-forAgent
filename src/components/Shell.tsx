import {
  BookOpen, Gauge, House, Inbox, Kanban, LogOut, Menu, MessagesSquare, QrCode, SquareCheck, Workflow, X,
} from 'lucide-react';
import { useState, type ReactNode } from 'react';
import { workspace } from '../config/workspace';
import { useResource, useSource } from '../lib/data';
import { href, type Page } from '../lib/router';
import { Pill } from './ui';

interface NavEntry { page: Page; label: string; icon: ReactNode; badge?: number; tone?: 'warn' | 'danger' | 'info' }

export function Shell({ page, children, onOpenGuide, guideProgress, onLogout }: {
  page: Page;
  children: ReactNode;
  onOpenGuide: () => void;
  guideProgress: number;
  onLogout: () => void;
}) {
  const source = useSource();
  const [drawer, setDrawer] = useState(false);
  const signals = useResource(async s => {
    const [review, bridge, wa, convs] = await Promise.all([
      s.review().catch(() => null),
      s.bridge().catch(() => null),
      s.whatsapp().catch(() => null),
      s.conversations('needs_reply').catch(() => null),
    ]);
    return { review, bridge, wa, convs };
  }, [], 30_000);

  const reviewCount = signals.data?.review?.filter(r => ['draft', 'needs_revision'].includes(r.status)).length;
  const holdCount = signals.data?.convs?.counts.hold;
  const replyCount = signals.data?.convs?.counts.needs_reply;
  const paused = signals.data?.bridge?.paused;
  const waState = signals.data?.wa?.state;
  const compact = page === 'percakapan' || page === 'alur-kerja';

  const groups: { label?: string; items: NavEntry[] }[] = [
    { items: [
      { page: 'beranda', label: 'Beranda', icon: <House size={16} /> },
      { page: 'ruang-tim', label: 'Ruang Tim', icon: <MessagesSquare size={16} /> },
    ] },
    { label: 'Sales', items: [
      { page: 'keputusan', label: 'Keputusan', icon: <SquareCheck size={16} />, badge: reviewCount, tone: 'warn' },
      { page: 'pipeline', label: 'Pipeline', icon: <Kanban size={16} /> },
      { page: 'percakapan', label: 'Percakapan', icon: <Inbox size={16} />, badge: (holdCount ?? 0) + (replyCount ?? 0) || undefined, tone: 'info' },
    ] },
    { label: 'Operasi', items: [
      { page: 'alur-kerja', label: 'Alur Kerja', icon: <Workflow size={16} /> },
      { page: 'kanal', label: 'Kanal WhatsApp', icon: <QrCode size={16} />, badge: waState && waState !== 'connected' ? 1 : undefined, tone: 'danger' },
      { page: 'biaya', label: 'Biaya & Kapasitas', icon: <Gauge size={16} /> },
    ] },
  ];

  const nav = (isCompact: boolean) => (
    <nav aria-label="Navigasi utama" className="flex flex-col gap-0.5 p-3">
      {groups.map((group, gi) => (
        <div key={gi} className="flex flex-col gap-0.5">
          {group.label && !isCompact && <div className="px-2.5 pb-1 pt-4 text-[12px] font-semibold uppercase tracking-[0.06em] text-muted">{group.label}</div>}
          {group.label && isCompact && <div className="mx-3 my-2 h-px bg-line" />}
          {group.items.map(item => {
            const active = item.page === page;
            return (
              <a
                key={item.page}
                href={href(item.page)}
                onClick={() => setDrawer(false)}
                aria-current={active ? 'page' : undefined}
                title={isCompact ? item.label : undefined}
                className={`relative flex min-h-9 items-center gap-2.5 rounded-lg px-2.5 text-[13px] font-medium ${
                  active ? 'border border-line bg-card text-accent shadow-[var(--shadow-card)]' : 'border border-transparent text-ink-soft hover:bg-[#EEF0F3]'
                } ${isCompact ? 'justify-center' : ''}`}
              >
                {item.icon}
                {!isCompact && <span className="flex-1">{item.label}</span>}
                {item.badge !== undefined && item.badge > 0 && (
                  isCompact
                    ? <span className={`absolute right-1.5 top-1.5 size-2 rounded-full ${item.tone === 'danger' ? 'bg-danger' : item.tone === 'warn' ? 'bg-warn' : 'bg-info'}`} />
                    : <span className={`tabular rounded-full px-1.5 text-[12px] font-semibold leading-5 ${item.tone === 'danger' ? 'bg-danger-soft text-danger' : item.tone === 'warn' ? 'bg-warn-soft text-warn' : 'bg-info-soft text-info'}`}>{item.badge}</span>
                )}
              </a>
            );
          })}
        </div>
      ))}
    </nav>
  );

  const footer = (isCompact: boolean) => (
    <div className="border-t border-line p-3">
      {guideProgress < 100 && !isCompact && (
        <button onClick={onOpenGuide} className="mb-2 w-full rounded-xl border border-line bg-card p-3 text-left">
          <div className="flex justify-between text-[13px] font-semibold"><span>Panduan</span><span className="tabular">{guideProgress}%</span></div>
          <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-line-soft"><div className="h-full rounded-full bg-ok" style={{ width: `${guideProgress}%` }} /></div>
        </button>
      )}
      {guideProgress < 100 && isCompact && (
        <button onClick={onOpenGuide} title="Panduan" aria-label="Panduan" className="mb-1 grid h-9 w-full place-items-center rounded-lg text-ink-soft hover:bg-line-soft"><BookOpen size={16} /></button>
      )}
      <div className={`flex items-center gap-2.5 px-1 pt-1 ${isCompact ? 'justify-center' : ''}`}>
        <span className="grid size-8 place-items-center rounded-full bg-ink text-[12px] font-semibold text-white">P</span>
        {!isCompact && (
          <div className="min-w-0 flex-1 leading-4">
            <div className="text-[13px] font-semibold">{workspace.ownerTitle}</div>
            <div className="text-[12px] text-muted">{source.kind === 'demo' ? 'Mode demo' : 'Owner'}</div>
          </div>
        )}
        {!isCompact && source.kind === 'live' && (
          <button onClick={onLogout} aria-label="Keluar" title="Keluar" className="grid size-8 place-items-center rounded-lg text-muted hover:bg-line-soft"><LogOut size={15} /></button>
        )}
      </div>
    </div>
  );

  return (
    <div className="flex h-full overflow-hidden">
      <aside className={`hidden shrink-0 flex-col justify-between border-r border-line bg-surface lg:flex ${compact ? 'w-16' : 'w-60'}`}>
        <div className="min-h-0 overflow-y-auto">
          <div className={`flex items-center gap-2.5 border-b border-line px-4 py-3.5 ${compact ? 'justify-center px-0' : ''}`}>
            <span className="grid size-7 place-items-center rounded-lg bg-ink text-[13px] font-bold text-white">J</span>
            {!compact && <div className="leading-4"><div className="text-[13px] font-semibold">{workspace.name}</div><div className="text-[12px] text-muted">Workspace</div></div>}
          </div>
          {nav(compact)}
        </div>
        {footer(compact)}
      </aside>

      {drawer && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-ink/30" onClick={() => setDrawer(false)} />
          <aside className="absolute inset-y-0 left-0 flex w-[272px] flex-col justify-between bg-surface shadow-[var(--shadow-float)]">
            <div className="min-h-0 overflow-y-auto">
              <div className="flex items-center justify-between border-b border-line px-4 py-3">
                <div className="flex items-center gap-2.5"><span className="grid size-7 place-items-center rounded-lg bg-ink text-[13px] font-bold text-white">J</span><b className="text-[13px]">{workspace.name}</b></div>
                <button aria-label="Tutup menu" onClick={() => setDrawer(false)} className="grid size-9 place-items-center rounded-lg"><X size={18} /></button>
              </div>
              {nav(false)}
            </div>
            {footer(false)}
          </aside>
        </div>
      )}

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex h-14 shrink-0 items-center justify-between gap-3 border-b border-line bg-card px-4 sm:px-5">
          <div className="flex min-w-0 items-center gap-2">
            <button aria-label="Buka menu" onClick={() => setDrawer(true)} className="-ml-1 grid size-9 place-items-center rounded-lg text-ink-soft hover:bg-line-soft lg:hidden"><Menu size={18} /></button>
            <span className="hidden text-[13px] text-muted sm:inline">{workspace.name}</span>
            <span className="hidden text-[13px] text-line sm:inline">/</span>
            <span className="truncate text-[13px] font-semibold">{pageTitle[page]}</span>
          </div>
          <div className="flex items-center gap-2">
            {source.kind === 'demo' && <Pill tone="info">Demo · data fiktif</Pill>}
            {paused === true && <Pill tone="warn" dot title="Tidak ada pesan keluar sampai dilanjutkan">Pengiriman dijeda</Pill>}
            {paused === false && <Pill tone="ok" dot>Pengiriman berjalan</Pill>}
            {paused === undefined && signals.loadedAt && <Pill tone="unknown">Status kirim tidak diketahui</Pill>}
          </div>
        </header>
        {waState && waState !== 'connected' && page !== 'kanal' && (
          <a href={href('kanal')} className="flex items-center gap-2 border-b border-danger/15 bg-danger-soft px-5 py-2 text-[13px] text-danger hover:underline">
            <QrCode size={15} />
            <span><b>WhatsApp belum tersambung</b> ({waLabel[waState] ?? waState}). Pesan keluar ditahan di antrean, tidak hilang. Buka Kanal untuk scan ulang.</span>
          </a>
        )}
        <main className="flex min-h-0 flex-1">{children}</main>
      </div>
    </div>
  );
}

export const waLabel: Record<string, string> = {
  connected: 'Tersambung', waiting_qr: 'Perlu scan QR', disconnected: 'Terputus', logged_out: 'Perangkat dilepas',
  starting: 'Menyambung', error: 'Galat', not_running: 'Bridge tidak berjalan',
};

const pageTitle: Record<Page, string> = {
  beranda: 'Beranda', keputusan: 'Keputusan', pipeline: 'Pipeline', percakapan: 'Percakapan', 'ruang-tim': 'Ruang Tim',
  'alur-kerja': 'Alur Kerja', biaya: 'Biaya & Kapasitas', kanal: 'Kanal WhatsApp',
};
