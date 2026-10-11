import { ArrowLeft, Ban, Clock, FileText, Hand, Info, Lock, PauseCircle, StickyNote } from 'lucide-react';
import { useEffect, useLayoutEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { BusinessAvatar, Button, IconButton, Skeleton, inputClass } from '../../components/ui';
import { useSource, useToast } from '../../lib/data';
import { bubbles, clock, dayLabel } from '../../lib/format';
import { href } from '../../lib/router';
import type { Control, ConversationDetail, OutboxItem, SalesEvent, SalesMessage, WaState } from '../../lib/types';
import { HIDDEN_EVENTS, eventDetail, eventLabel, handlerLine } from './labels';
import { ModeSwitch, MoreMenu } from './ModeControl';

type Entry =
  | { kind: 'msg'; at: number; key: string; msg: SalesMessage }
  | { kind: 'note'; at: number; key: string; body: string }
  | { kind: 'event'; at: number; key: string; ev: SalesEvent }
  | { kind: 'outbox'; at: number; key: string; item: OutboxItem };

const PENDING_DRAFT = ['draft', 'needs_revision'];
const IN_QUEUE = ['queued', 'approved', 'sending', 'scheduled'];
const PROBLEM = ['failed', 'delivery_unknown', 'partially_sent', 'blocked'];

export function ThreadHeader({ detail, onBack, onOpenProfile, onRequest }: {
  detail: ConversationDetail;
  onBack: () => void;
  onOpenProfile: () => void;
  onRequest: (c: Control) => void;
}) {
  const c = detail.conversation;
  const dnc = c.control === 'DO_NOT_CONTACT';
  return (
    <div className="flex flex-wrap items-center gap-x-3 gap-y-2 border-b border-line bg-card px-3 py-2.5 sm:px-4">
      <IconButton label="Kembali ke daftar" onClick={onBack} className="md:hidden"><ArrowLeft size={18} /></IconButton>
      <BusinessAvatar name={c.name} size={36} channel="whatsapp" />
      <div className="min-w-0 flex-1 basis-40">
        <h2 className="truncate text-[15px] font-semibold leading-5">{c.name}</h2>
        <p className={`truncate text-[12px] leading-[18px] ${c.control === 'HOLD' ? 'text-warn' : dnc ? 'text-danger' : 'text-muted'}`} title={handlerLine(c)}>
          {handlerLine(c)}
        </p>
      </div>
      <div className="flex items-center gap-1">
        {dnc ? (
          <span className="inline-flex items-center gap-1.5 rounded-lg bg-danger-soft px-2.5 py-1 text-[13px] font-medium text-danger"><Ban size={14} /> Jangan hubungi · final</span>
        ) : (
          <ModeSwitch control={c.control} onRequest={onRequest} />
        )}
        <MoreMenu disabled={dnc} onDnc={() => onRequest('DO_NOT_CONTACT')} />
        <IconButton label="Lihat profil kontak" onClick={onOpenProfile} className="xl:hidden"><Info size={18} /></IconButton>
      </div>
    </div>
  );
}

export function Thread({ detail, waState, onChanged, onRequest }: {
  detail: ConversationDetail;
  waState: WaState | undefined;
  onChanged: () => void;
  onRequest: (c: Control) => void;
}) {
  const c = detail.conversation;
  const scroller = useRef<HTMLDivElement>(null);

  const entries = useMemo<Entry[]>(() => {
    const list: Entry[] = [
      ...detail.messages.map(msg => ({ kind: 'msg' as const, at: msg.at, key: `m${msg.id}`, msg })),
      ...detail.notes.map(n => ({ kind: 'note' as const, at: n.at, key: `n${n.id}`, body: n.body })),
      ...detail.events.filter(ev => !HIDDEN_EVENTS.has(ev.event_type)).map(ev => ({ kind: 'event' as const, at: ev.at, key: `e${ev.id}`, ev })),
      ...detail.outbox
        .filter(o => [...PENDING_DRAFT, ...IN_QUEUE, ...PROBLEM].includes(o.status))
        .map(item => ({ kind: 'outbox' as const, at: item.created_at, key: `o${item.id}`, item })),
    ];
    return list.sort((a, b) => a.at - b.at);
  }, [detail]);

  // Stick to the newest entry when the conversation opens or grows.
  useLayoutEffect(() => {
    const el = scroller.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [c.id, entries.length]);

  let lastDay = '';
  return (
    <>
      <div ref={scroller} className="min-h-0 flex-1 overflow-y-auto bg-surface px-3 py-4 sm:px-6" aria-live="polite">
        {entries.length === 0 && <p className="py-10 text-center text-[13px] text-muted">Belum ada pesan di percakapan ini.</p>}
        <div className="mx-auto flex max-w-[760px] flex-col gap-2">
          {entries.map(e => {
            const day = dayLabel(e.at);
            const sep = day !== lastDay;
            lastDay = day;
            return (
              <div key={e.key} className="flex flex-col gap-2">
                {sep && <div className="my-2 self-center rounded-full bg-line-soft px-3 py-0.5 text-[12px] font-medium text-ink-soft">{day}</div>}
                <EntryView entry={e} />
              </div>
            );
          })}
        </div>
      </div>

      {c.control === 'HOLD' && (
        <div className="flex flex-wrap items-center gap-3 border-t border-warn-line bg-warn-soft px-4 py-3">
          <PauseCircle size={18} className="shrink-0 text-warn" />
          <div className="min-w-0 flex-1 basis-56 text-[13px] text-warn">
            <b className="font-semibold">Ditahan</b> — {c.hold_reason || 'tanpa alasan tercatat'}. AI tidak menyusun atau mengirim apa pun sampai kamu memutuskan.
          </div>
          <div className="flex flex-wrap gap-2">
            <Button size="sm" onClick={() => onRequest('AUTO')}>Kembalikan ke Candra</Button>
            <Button size="sm" variant="primary" icon={<Hand size={14} />} onClick={() => onRequest('HUMAN_CONTROLLED')}>Balas sendiri</Button>
          </div>
        </div>
      )}

      <Composer detail={detail} waState={waState} onTakeOver={() => onRequest('HUMAN_CONTROLLED')} onSent={onChanged} />
    </>
  );
}

function EntryView({ entry }: { entry: Entry }) {
  if (entry.kind === 'msg') {
    const m = entry.msg;
    const out = m.direction === 'out';
    const who = !out ? (m.sender || 'Prospek') : m.actor === 'ai' ? 'Disusun Candra' : m.actor === 'owner' ? 'Kamu' : m.actor === 'system' ? 'Sistem' : (m.sender || 'Terkirim');
    return (
      <div className={`flex max-w-[85%] flex-col gap-1 sm:max-w-[72%] ${out ? 'items-end self-end' : 'items-start self-start'}`}>
        {bubbles(m.body).map((part, i) => (
          <div key={i} className={`whitespace-pre-wrap break-words rounded-2xl px-3.5 py-2 text-[14px] leading-[21px] ${out ? 'rounded-br-md bg-accent-soft text-ink' : 'rounded-bl-md border border-line bg-card text-ink'}`}>
            {part}
          </div>
        ))}
        <span className="px-1 text-[12px] text-muted">{who} · {clock(m.at)}</span>
      </div>
    );
  }
  if (entry.kind === 'note') {
    return (
      <div className="my-1 rounded-xl border border-dashed border-warn-line bg-warn-soft px-4 py-2.5">
        <div className="mb-1 flex items-center gap-1.5 text-[12px] font-semibold text-warn"><StickyNote size={13} /> Catatan internal · hanya tim · {clock(entry.at)}</div>
        <p className="whitespace-pre-wrap break-words text-[13px] text-ink">{entry.body}</p>
      </div>
    );
  }
  if (entry.kind === 'event') {
    const { text, cancelled } = eventDetail(entry.ev.evidence);
    return (
      <div className="flex items-center gap-2 self-center px-2 text-center text-[12px] text-muted">
        <span className="h-px w-6 bg-line" aria-hidden />
        <span className="max-w-[520px]">
          <b className="font-medium text-ink-soft">{eventLabel(entry.ev.event_type)}</b>
          {text && <>: {text}</>}
          {cancelled > 0 && <> · {cancelled} draf AI dibatalkan</>}
          {' · '}{clock(entry.at)}
        </span>
        <span className="h-px w-6 bg-line" aria-hidden />
      </div>
    );
  }
  const item = entry.item;
  if (PENDING_DRAFT.includes(item.status)) {
    return (
      <div className="flex max-w-[85%] flex-col gap-2 self-end rounded-2xl border border-accent-line bg-card p-3 sm:max-w-[72%]">
        <div className="flex items-center gap-1.5 text-[12px] font-semibold text-accent">
          <FileText size={13} /> {item.status === 'draft' ? 'Draf menunggu persetujuan' : 'Draf sedang direvisi Candra'} · v{item.version}
        </div>
        <p className="line-clamp-4 whitespace-pre-wrap text-[13px] text-ink-soft">{item.body}</p>
        {item.status === 'draft' && (
          <a href={href('keputusan', item.id)} className="inline-flex h-8 items-center justify-center self-start rounded-lg bg-ink px-3 text-[13px] font-medium text-white hover:bg-[#1F2937]">Tinjau draf</a>
        )}
      </div>
    );
  }
  if (IN_QUEUE.includes(item.status)) {
    return (
      <div className="flex max-w-[85%] flex-col items-end gap-1 self-end sm:max-w-[72%]">
        <div className="whitespace-pre-wrap break-words rounded-2xl rounded-br-md border border-dashed border-accent-line bg-card px-3.5 py-2 text-[14px] leading-[21px] text-ink-soft">{item.body}</div>
        <span className="flex items-center gap-1 px-1 text-[12px] text-muted"><Clock size={12} /> Di antrean kirim · {item.actor === 'owner' ? 'Kamu' : 'Candra'} · belum terkirim</span>
      </div>
    );
  }
  return (
    <div className="self-end rounded-lg border border-danger/20 bg-danger-soft px-3 py-2 text-[12px] text-danger">
      {item.status === 'delivery_unknown' ? 'Status kirim tidak diketahui — tidak diulang otomatis.' : item.status === 'partially_sent' ? 'Sebagian pesan terkirim — sisanya tidak diulang otomatis.' : 'Pesan belum terkirim.'}
      {item.error && <> ({item.error})</>}
    </div>
  );
}

function Composer({ detail, waState, onTakeOver, onSent }: { detail: ConversationDetail; waState: WaState | undefined; onTakeOver: () => void; onSent: () => void }) {
  const source = useSource();
  const toast = useToast();
  const c = detail.conversation;
  const unlocked = c.control === 'HUMAN_CONTROLLED';
  const [tab, setTab] = useState<'reply' | 'note'>('reply');
  const [drafts, setDrafts] = useState<{ reply: string; note: string }>({ reply: '', note: '' });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => { setDrafts({ reply: '', note: '' }); setError(null); setTab('reply'); }, [c.id]);

  const body = drafts[tab];
  const trimmed = body.trim();
  const canReply = unlocked && tab === 'reply';
  const enabled = tab === 'note' || canReply;

  const submit = async () => {
    if (!trimmed || busy || !enabled) return;
    setBusy(true);
    setError(null);
    try {
      if (tab === 'reply') {
        await source.ownerMessage(c.id, trimmed);
        toast('ok', 'Pesan masuk antrean kirim. Gerbang kirim mengirimnya sesuai jam dan jeda kirim.');
      } else {
        await source.addNote(c.id, trimmed);
        toast('ok', 'Catatan internal tersimpan. Hanya tim yang bisa melihatnya.');
      }
      setDrafts(d => ({ ...d, [tab]: '' }));
      onSent();
    } catch (exc) {
      setError(exc instanceof Error ? exc.message : 'Belum tersimpan.');
    } finally {
      setBusy(false);
    }
  };

  const lockedText: Record<Control, ReactNode> = {
    AUTO: 'Candra sedang menangani. Ambil alih untuk membalas sendiri.',
    HOLD: 'Percakapan ditahan. Ambil alih untuk membalas, atau kembalikan ke Candra.',
    HUMAN_CONTROLLED: '',
    DO_NOT_CONTACT: 'Kontak ini ditandai jangan hubungi. Tidak ada pesan yang bisa dikirim.',
  };

  return (
    <div className="border-t border-line bg-card px-3 pb-3 pt-2 sm:px-4">
      <div role="tablist" aria-label="Jenis tulisan" className="mb-2 flex gap-1">
        {([['reply', 'Balas'], ['note', 'Catatan internal']] as const).map(([value, label]) => (
          <button
            key={value}
            role="tab"
            aria-selected={tab === value}
            onClick={() => setTab(value)}
            className={`rounded-lg px-2.5 py-1 text-[13px] font-medium ${tab === value ? (value === 'note' ? 'bg-warn-soft text-warn' : 'bg-line-soft text-ink') : 'text-muted hover:text-ink'}`}
          >
            {label}
          </button>
        ))}
      </div>

      {tab === 'reply' && !unlocked ? (
        <div className="flex flex-wrap items-center gap-3 rounded-xl border border-line bg-surface px-3 py-3">
          <Lock size={16} className="shrink-0 text-muted" />
          <p className="min-w-0 flex-1 basis-48 text-[13px] text-ink-soft">{lockedText[c.control]}</p>
          {c.control !== 'DO_NOT_CONTACT' && <Button size="sm" variant="primary" icon={<Hand size={14} />} onClick={onTakeOver}>Ambil alih</Button>}
        </div>
      ) : (
        <div className={`rounded-xl border ${tab === 'note' ? 'border-dashed border-warn-line bg-warn-soft/40' : 'border-line'} focus-within:border-accent focus-within:ring-2 focus-within:ring-accent-line`}>
          <label htmlFor="composer" className="sr-only">{tab === 'reply' ? 'Tulis balasan' : 'Tulis catatan internal'}</label>
          <textarea
            id="composer"
            value={body}
            maxLength={4000}
            rows={3}
            onChange={e => setDrafts(d => ({ ...d, [tab]: e.target.value }))}
            onKeyDown={e => { if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) { e.preventDefault(); void submit(); } }}
            placeholder={tab === 'reply' ? `Tulis balasan untuk ${c.name}…` : 'Catatan untuk tim — tidak dikirim ke kontak…'}
            className={`${inputClass} resize-none border-0 bg-transparent focus:ring-0`}
          />
          <div className="flex flex-wrap items-center justify-between gap-2 px-3 pb-2">
            <span className="text-[12px] text-muted">
              {tab === 'reply'
                ? waState && waState !== 'connected' ? 'WhatsApp belum tersambung — pesan menunggu di antrean sampai tersambung.' : 'Masuk antrean kirim, lalu dikirim sesuai jam dan jeda kirim.'
                : 'Hanya terlihat oleh tim.'}
            </span>
            <Button size="sm" variant={tab === 'reply' ? 'primary' : 'secondary'} disabled={!trimmed || busy} onClick={submit}>
              {busy ? 'Menyimpan…' : tab === 'reply' ? 'Masukkan ke antrean kirim' : 'Simpan catatan'}
            </Button>
          </div>
        </div>
      )}
      {error && <p role="alert" className="mt-2 text-[13px] text-danger">Belum tersimpan: {error}</p>}
    </div>
  );
}

export function ThreadSkeleton() {
  return (
    <div className="flex flex-1 flex-col gap-3 bg-surface p-6">
      <Skeleton className="h-10 w-2/3 self-start" />
      <Skeleton className="h-14 w-1/2 self-end" />
      <Skeleton className="h-10 w-1/2 self-start" />
    </div>
  );
}
