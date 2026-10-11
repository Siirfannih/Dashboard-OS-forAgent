import { Inbox, MessageSquareText, Search, X } from 'lucide-react';
import { useEffect, useRef, useState, type ReactNode } from 'react';
import { BusinessAvatar, EmptyState, ErrorBanner, IconButton, Overline, Skeleton } from '../components/ui';
import { useResource, useSource } from '../lib/data';
import { ago } from '../lib/format';
import { go } from '../lib/router';
import type { Control, ConversationList, InboxView, SalesConversation } from '../lib/types';
import { ControlDialog } from './percakapan/ModeControl';
import { ProfilePanel } from './percakapan/Profile';
import { Thread, ThreadHeader, ThreadSkeleton } from './percakapan/Thread';
import { ALL_VIEWS, VIEW_GROUPS, snippetPrefix } from './percakapan/labels';

const VIEW_KEY = 'jadisatu.percakapan.view';

function readView(): InboxView {
  try {
    const v = window.localStorage.getItem(VIEW_KEY);
    if (v && ALL_VIEWS.some(e => e.view === v)) return v as InboxView;
  } catch { /* storage unavailable */ }
  return 'prospects';
}

export function PercakapanPage({ id }: { id?: string }) {
  const source = useSource();
  const [view, setView] = useState<InboxView>(readView);
  const [query, setQuery] = useState('');
  const [q, setQ] = useState('');
  const [profileOpen, setProfileOpen] = useState(false);
  const [target, setTarget] = useState<Control | null>(null);
  const [label, setLabel] = useState<string | null>(null);

  useEffect(() => {
    const t = window.setTimeout(() => setQ(query.trim()), 300);
    return () => window.clearTimeout(t);
  }, [query]);

  const chooseView = (v: InboxView) => {
    setView(v);
    try { window.localStorage.setItem(VIEW_KEY, v); } catch { /* ignore */ }
  };

  const list = useResource(s => s.conversations(view, q), [view, q], 20_000);
  const detail = useResource(s => (id ? s.conversation(id) : Promise.resolve(null)), [id], id ? 15_000 : 0);
  const wa = useResource(s => s.whatsapp(), [], 60_000);
  const current = detail.data && detail.data.conversation.id === id ? detail.data : null;

  const reloadList = useRef(list.reload);
  reloadList.current = list.reload;
  useEffect(() => {
    setProfileOpen(false);
    setTarget(null);
    if (!id) return;
    source.markSeen(id).then(() => reloadList.current()).catch(() => undefined);
  }, [id, source]);

  const labels = [...new Set((list.data?.items ?? []).flatMap(c => c.tags ?? []))].sort();
  const shown = list.data && label && labels.includes(label) ? { ...list.data, items: list.data.items.filter(c => c.tags?.includes(label)) } : list.data;
  const refresh = () => { void detail.reload(); void list.reload(); };

  return (
    <div className="flex min-w-0 flex-1 overflow-hidden">
      {/* Column 1 — Kotak masuk */}
      <aside aria-label="Kotak masuk" className="hidden w-[208px] shrink-0 flex-col overflow-y-auto border-r border-line bg-surface px-2 py-4 lg:flex">
        <h1 className="px-2.5 pb-2 font-display text-[18px] font-semibold">Kotak masuk</h1>
        <ViewNav view={view} counts={list.data?.counts} onChange={chooseView} />
      </aside>

      {/* Column 2 — daftar percakapan */}
      <section aria-label="Daftar percakapan" className={`${id ? 'hidden md:flex' : 'flex'} min-w-0 flex-1 flex-col border-r border-line bg-card md:w-[300px] md:flex-none md:shrink-0`}>
        <div className="flex flex-col gap-2 border-b border-line px-3 py-3">
          <div className="flex items-center gap-2 lg:hidden">
            <label htmlFor="view-select" className="sr-only">Tampilan kotak masuk</label>
            <select
              id="view-select"
              value={view}
              onChange={e => chooseView(e.target.value as InboxView)}
              className="h-9 w-full rounded-lg border border-line bg-card px-2.5 text-[14px] font-medium outline-none focus:border-accent focus:ring-2 focus:ring-accent-line"
            >
              {VIEW_GROUPS.map(g => (
                <optgroup key={g.label} label={g.label}>
                  {g.items.map(it => <option key={it.view} value={it.view}>{it.label}{list.data?.counts[it.view] !== undefined ? ` (${list.data.counts[it.view]})` : ''}</option>)}
                </optgroup>
              ))}
            </select>
          </div>
          <div className="relative">
            <Search size={15} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted" aria-hidden />
            <label htmlFor="conv-search" className="sr-only">Cari percakapan</label>
            <input
              id="conv-search"
              type="search"
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="Cari nama, nomor, domain…"
              className="h-9 w-full rounded-lg border border-line bg-surface pl-9 pr-8 text-[14px] outline-none placeholder:text-muted focus:border-accent focus:bg-card focus:ring-2 focus:ring-accent-line"
            />
            {query && (
              <button type="button" aria-label="Hapus pencarian" onClick={() => setQuery('')} className="absolute right-1.5 top-1/2 grid size-6 -translate-y-1/2 place-items-center rounded-md text-muted hover:bg-line-soft">
                <X size={14} />
              </button>
            )}
          </div>
        </div>
        {labels.length > 0 && (
          <div role="group" aria-label="Filter label" className="flex flex-wrap gap-1.5 border-b border-line px-3 py-2">
            {labels.map(t => (
              <button
                key={t}
                type="button"
                aria-pressed={label === t}
                onClick={() => setLabel(label === t ? null : t)}
                className={`max-w-[160px] truncate rounded-full border px-2.5 py-0.5 text-[12px] ${label === t ? 'border-accent bg-accent-soft text-accent' : 'border-line bg-surface text-ink-soft hover:bg-line-soft'}`}
              >
                {t}
              </button>
            ))}
          </div>
        )}
        <ConversationItems list={shown} loading={list.loading && !list.data} error={list.error} onRetry={list.reload} selected={id} view={view} q={q} />
      </section>

      {/* Column 3 — thread */}
      <section aria-label="Percakapan terpilih" className={`${id ? 'flex' : 'hidden md:flex'} min-w-0 flex-1 flex-col bg-surface`}>
        {!id && (
          <div className="grid flex-1 place-items-center">
            <EmptyState icon={<MessageSquareText size={20} />} title="Pilih percakapan">
              Pilih kontak di daftar untuk membaca pesan, melihat draf Candra, dan memutuskan siapa yang menangani.
            </EmptyState>
          </div>
        )}
        {id && !current && detail.error && (
          <div className="p-4"><ErrorBanner message={`Percakapan belum bisa dimuat. ${detail.error}`} onRetry={detail.reload} /></div>
        )}
        {id && !current && !detail.error && <ThreadSkeleton />}
        {current && (
          <>
            <ThreadHeader detail={current} onBack={() => go('percakapan')} onOpenProfile={() => setProfileOpen(true)} onRequest={setTarget} />
            {detail.error && <div className="px-4 pt-3"><ErrorBanner message={`Data terbaru belum bisa dimuat; menampilkan versi terakhir. ${detail.error}`} onRetry={detail.reload} /></div>}
            <Thread detail={current} waState={wa.data?.state} onChanged={refresh} onRequest={setTarget} />
            <ControlDialog conversation={current.conversation} target={target} onClose={() => setTarget(null)} onDone={refresh} />
          </>
        )}
      </section>

      {/* Column 4 — profil (≥1280) */}
      {current && (
        <aside aria-label="Profil kontak" className="hidden w-[300px] shrink-0 overflow-y-auto border-l border-line bg-card xl:block">
          <ProfilePanel detail={current} />
        </aside>
      )}

      {/* Profil sebagai drawer (<1280) / bottom sheet (<768) */}
      {current && profileOpen && (
        <ProfileDrawer onClose={() => setProfileOpen(false)}>
          <ProfilePanel detail={current} />
        </ProfileDrawer>
      )}
    </div>
  );
}

function ViewNav({ view, counts, onChange }: { view: InboxView; counts: ConversationList['counts'] | undefined; onChange: (v: InboxView) => void }) {
  return (
    <nav aria-label="Tampilan kotak masuk" className="flex flex-col gap-3">
      {VIEW_GROUPS.map((g, gi) => (
        <div key={g.label} className="flex flex-col gap-0.5">
          <Overline className="px-2.5 pb-1">{g.label}</Overline>
          {g.items.map(it => {
            const active = it.view === view;
            const n = counts?.[it.view];
            const urgent = gi === 0 && (n ?? 0) > 0;
            return (
              <button
                key={it.view}
                type="button"
                aria-current={active ? 'true' : undefined}
                onClick={() => onChange(it.view)}
                className={`flex min-h-9 items-center justify-between gap-2 rounded-lg px-2.5 text-left text-[13px] font-medium ${
                  active ? 'border border-line bg-card text-accent shadow-[var(--shadow-card)]' : 'border border-transparent text-ink-soft hover:bg-line-soft'
                }`}
              >
                <span className="truncate">{it.label}</span>
                {n === undefined ? (
                  <span className="text-[12px] text-muted" aria-label="jumlah tidak diketahui">—</span>
                ) : (
                  <span className={`tabular rounded-full px-1.5 text-[12px] font-semibold leading-5 ${urgent ? (it.view === 'hold' ? 'bg-warn-soft text-warn' : 'bg-info-soft text-info') : 'text-muted'}`}>{n}</span>
                )}
              </button>
            );
          })}
        </div>
      ))}
    </nav>
  );
}

function ConversationItems({ list, loading, error, onRetry, selected, view, q }: {
  list: ConversationList | undefined;
  loading: boolean;
  error: string | null;
  onRetry: () => void;
  selected?: string;
  view: InboxView;
  q: string;
}) {
  if (loading) {
    return (
      <div className="flex flex-col gap-1 p-3">
        {[0, 1, 2, 3].map(i => (
          <div key={i} className="flex gap-3 p-2"><Skeleton className="size-10 rounded-full" /><div className="flex flex-1 flex-col gap-2"><Skeleton className="h-4 w-2/3" /><Skeleton className="h-3 w-full" /></div></div>
        ))}
      </div>
    );
  }
  if (error && !list) return <div className="p-3"><ErrorBanner message={`Daftar belum bisa dimuat. ${error}`} onRetry={onRetry} /></div>;
  const items = list?.items ?? [];
  const label = ALL_VIEWS.find(v => v.view === view)?.label ?? '';
  return (
    <div className="min-h-0 flex-1 overflow-y-auto">
      {error && <div className="p-3"><ErrorBanner message="Daftar terbaru belum bisa dimuat; menampilkan versi terakhir." onRetry={onRetry} /></div>}
      {items.length === 0 && (
        <EmptyState icon={<Inbox size={20} />} title={q ? 'Tidak ada yang cocok' : 'Kosong'}>
          {q ? `Tidak ada percakapan "${q}" di ${label}.` : view === 'hold' || view === 'needs_reply' ? 'Tidak ada yang menunggu kamu di sini.' : `Belum ada percakapan di ${label}.`}
        </EmptyState>
      )}
      <ul>
        {items.map(c => <li key={c.id}><ConversationRow c={c} selected={c.id === selected} /></li>)}
      </ul>
    </div>
  );
}

function ConversationRow({ c, selected }: { c: SalesConversation; selected: boolean }) {
  const chip = c.control === 'HOLD' ? <span className="rounded-full bg-warn-soft px-2 text-[12px] font-medium leading-5 text-warn">Ditahan</span>
    : c.control === 'HUMAN_CONTROLLED' ? <span className="rounded-full bg-ink px-2 text-[12px] font-medium leading-5 text-white">Kamu</span>
    : c.control === 'DO_NOT_CONTACT' ? <span className="rounded-full bg-danger-soft px-2 text-[12px] font-medium leading-5 text-danger">Jangan hubungi</span>
    : null;
  const at = c.last_at ?? c.updated_at;
  return (
    <button
      type="button"
      onClick={() => go('percakapan', c.id)}
      aria-current={selected ? 'true' : undefined}
      className={`flex w-full gap-3 border-b border-line-soft px-3 py-3 text-left ${selected ? 'bg-accent-soft' : 'hover:bg-surface'}`}
    >
      <BusinessAvatar name={c.name} size={40} channel="whatsapp" />
      <div className="min-w-0 flex-1">
        <div className="flex items-baseline justify-between gap-2">
          <span className={`truncate text-[14px] ${c.unread ? 'font-semibold' : 'font-medium'}`}>{c.name}</span>
          <span className="shrink-0 text-[12px] text-muted">{ago(at)}</span>
        </div>
        <p className={`mt-0.5 line-clamp-2 text-[13px] leading-[19px] ${c.unread ? 'text-ink' : 'text-muted'}`}>
          {c.last_body ? <>{snippetPrefix(c)}{c.last_body}</> : <span className="italic">Belum ada pesan</span>}
        </p>
        {(chip || c.drafts > 0 || c.unread > 0) && (
          <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
            {chip}
            {c.drafts > 0 && <span className="rounded-full bg-accent-soft px-2 text-[12px] font-medium leading-5 text-accent ring-1 ring-accent-line">{c.drafts} draf</span>}
            {c.unread > 0 && (
              <span className="tabular ml-auto grid h-5 min-w-5 place-items-center rounded-full bg-accent px-1.5 text-[12px] font-semibold text-white" aria-label={`${c.unread} belum dibaca`}>{c.unread}</span>
            )}
          </div>
        )}
      </div>
    </button>
  );
}

function ProfileDrawer({ onClose, children }: { onClose: () => void; children: ReactNode }) {
  useEffect(() => {
    const esc = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', esc);
    return () => window.removeEventListener('keydown', esc);
  }, [onClose]);
  return (
    <div className="fixed inset-0 z-[60] xl:hidden" role="dialog" aria-modal="true" aria-label="Profil kontak">
      <div className="absolute inset-0 bg-ink/30" onClick={onClose} />
      <div className="absolute inset-x-0 bottom-0 max-h-[85vh] overflow-y-auto rounded-t-2xl bg-card shadow-[var(--shadow-float)] md:inset-y-0 md:left-auto md:right-0 md:max-h-none md:w-[340px] md:rounded-none">
        <div className="sticky top-0 z-10 flex justify-end bg-card/95 p-2">
          <IconButton label="Tutup profil" onClick={onClose} autoFocus><X size={18} /></IconButton>
        </div>
        <div className="-mt-10">{children}</div>
      </div>
    </div>
  );
}
