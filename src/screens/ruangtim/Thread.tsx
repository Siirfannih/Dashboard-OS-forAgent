import { ArrowLeft, CircleAlert, Hash, Info, Loader2, PanelRight } from 'lucide-react';
import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react';
import { AgentAvatar, ErrorBanner, IconButton, Modal, Skeleton } from '../../components/ui';
import { agent } from '../../config/workspace';
import { useResource, useSource, useToast } from '../../lib/data';
import { clock, dayLabel, splitMedia, toDate } from '../../lib/format';
import { go } from '../../lib/router';
import type { ChatMessage, ChatSnapshot, WorkspaceAgent } from '../../lib/types';
import { Attachments } from './Attachments';
import { ObjectCards } from './ObjectCards';
import { Composer, Notice, RichText } from './Composer';
import { InfoPanel } from './InfoPanel';
import { availabilityOf, blockedReason, isActiveRun, membersOf, type AgentLinks } from './model';

export function Thread({ id, agents, links, onChanged, prefill }: {
  id: string;
  agents: WorkspaceAgent[] | undefined;
  links: AgentLinks;
  onChanged: () => void;
  prefill?: string;
}) {
  const source = useSource();
  const toast = useToast();
  const [busy, setBusy] = useState(false);
  const res = useResource(s => s.chat(id), [id], busy ? 3000 : 20_000);
  const chat = res.data?.id === id ? res.data : undefined;
  const [draft, setDraft] = useState(prefill ?? '');
  const [pick, setPick] = useState('');
  const [sending, setSending] = useState(false);
  const [infoOpen, setInfoOpen] = useState(false);
  const closeInfo = useCallback(() => setInfoOpen(false), []);
  const scroller = useRef<HTMLDivElement>(null);
  const wasBusy = useRef(false);

  useEffect(() => { setDraft(prefill ?? ''); setPick(''); }, [id, prefill]);

  const active = chat?.runs.some(isActiveRun) ?? false;
  useEffect(() => {
    if (!chat) return;
    setBusy(active);
    // A run just finished: refresh the thread list so ordering/time stay true.
    if (wasBusy.current && !active) onChanged();
    wasBusy.current = active;
  }, [chat, active, onChanged]);

  const messageCount = chat?.messages.length ?? 0;
  useEffect(() => {
    const el = scroller.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messageCount, id, active]);

  if (!chat) {
    return (
      <div className="flex min-w-0 flex-1 flex-col">
        <ThreadHeader title="Memuat thread…" />
        <div className="flex flex-col gap-5 p-6">
          {res.error ? <ErrorBanner message={`Thread belum bisa dimuat. ${res.error}`} onRetry={res.reload} /> : (
            <>
              <div className="flex gap-3"><Skeleton className="size-8 rounded-full" /><div className="flex flex-1 flex-col gap-2"><Skeleton className="h-4 w-40" /><Skeleton className="h-14 max-w-[680px]" /></div></div>
              <div className="flex gap-3"><Skeleton className="size-8 rounded-full" /><div className="flex flex-1 flex-col gap-2"><Skeleton className="h-4 w-32" /><Skeleton className="h-20 max-w-[680px]" /></div></div>
            </>
          )}
        </div>
      </div>
    );
  }

  const room = chat.kind === 'room';
  const members = membersOf(chat);
  const readyMembers = members.filter(m => availabilityOf(agents, links, m) === 'ready');
  const owner = agent(chat.agent_id);
  const blocked = room
    ? (readyMembers.length ? null : 'Belum ada anggota ruang ini yang bisa menerima pesan. Riwayat tetap bisa dibaca.')
    : blockedReason(availabilityOf(agents, links, chat.agent_id), chat.agent_id);
  const activeRun = chat.runs.find(r => r.status === 'running') ?? chat.runs.find(r => r.status === 'queued');
  const lastRun = chat.runs[chat.runs.length - 1];
  const waiting = active ? `${agent(activeRun?.agent_id ?? chat.agent_id).displayName} masih mengerjakan pesan sebelumnya. Kamu bisa menulis; kirim setelah balasannya masuk.` : null;

  async function send() {
    const text = draft.trim();
    if (!text) return;
    setSending(true);
    try {
      await source.sendChat(id, text, room && pick ? pick : undefined);
      setDraft('');
      setBusy(true);
      await res.reload();
      onChanged();
    } catch (exc) {
      const why = exc instanceof Error ? exc.message : 'Coba lagi sebentar lagi.';
      toast('error', `Pesan belum terkirim. ${why}`);
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="flex min-w-0 flex-1">
      <div className="flex min-w-0 flex-1 flex-col">
        <ThreadHeader
          title={chat.title}
          crumb={room ? <><Hash size={15} className="text-muted" aria-hidden /><span className="sr-only">Ruang</span></> : <><AgentAvatar id={chat.agent_id} size={20} /><span className="truncate text-muted">{owner.displayName}</span><span className="text-muted" aria-hidden>/</span></>}
          onInfo={() => setInfoOpen(true)}
        />
        <div ref={scroller} className="min-h-0 flex-1 overflow-y-auto" aria-live="polite" aria-relevant="additions">
          <div className="mx-auto flex max-w-[760px] flex-col px-4 py-5 sm:px-6">
            {chat.messages.length === 0 ? (
              <div className="py-10 text-center">
                <div className="font-display text-[17px] font-semibold">Thread ini masih kosong</div>
                <p className="mt-1 text-[13px] text-muted">{blocked ? 'Belum ada riwayat di workspace.' : `Tulis pesan pertama untuk ${room ? 'ruang ini' : owner.displayName}.`}</p>
              </div>
            ) : <MessageList chat={chat} />}
          </div>
        </div>
        <div className="shrink-0 border-t border-line bg-card px-4 pb-4 pt-3 sm:px-6">
          <div className="mx-auto flex max-w-[712px] flex-col gap-2">
            <RunLine chat={chat} activeRunAgent={activeRun?.agent_id} activeStatus={activeRun?.status} lastRun={lastRun} />
            <Composer
              value={draft}
              onChange={setDraft}
              onSend={send}
              blocked={blocked}
              waiting={waiting}
              sending={sending}
              placeholder={room ? 'Tulis pesan… ketik @ untuk menyebut anggota' : `Tulis pesan untuk ${owner.displayName}…`}
              mentions={room ? [...readyMembers.map(m => ({ handle: m, label: `${agent(m).displayName} · ${agent(m).title}` })), { handle: 'all', label: 'Semua anggota' }] : undefined}
              hint={room ? <>Tanpa sebutan, pesan ke {owner.displayName}. Enter untuk kirim.</> : undefined}
              before={room && readyMembers.length > 1 ? (
                <label className="flex items-center gap-2 text-[12px] text-muted">
                  Kirim ke
                  <select value={pick} onChange={e => setPick(e.target.value)} className="rounded-md border border-line bg-card px-2 py-0.5 text-[13px] text-ink">
                    <option value="">Sesuai sebutan di pesan</option>
                    {readyMembers.map(m => <option key={m} value={m}>Hanya {agent(m).displayName}</option>)}
                  </select>
                </label>
              ) : undefined}
            />
          </div>
        </div>
      </div>
      <aside className="hidden w-[320px] shrink-0 overflow-y-auto border-l border-line bg-card p-5 xl:block" aria-label="Info thread">
        <InfoPanel chat={chat} agents={agents} links={links} />
      </aside>
      <Modal open={infoOpen} onClose={closeInfo} title="Info thread" width={420}>
        <InfoPanel chat={chat} agents={agents} links={links} />
      </Modal>
    </div>
  );
}

function ThreadHeader({ title, crumb, onInfo }: { title: string; crumb?: ReactNode; onInfo?: () => void }) {
  return (
    <div className="flex h-14 shrink-0 items-center gap-2 border-b border-line bg-card px-3 sm:px-5">
      <IconButton label="Kembali ke daftar thread" className="md:hidden" onClick={() => go('ruang-tim')}><ArrowLeft size={18} /></IconButton>
      <h1 className="flex min-w-0 flex-1 items-center gap-2 text-[14px] font-semibold">
        {crumb}
        <span className="truncate">{title}</span>
      </h1>
      {onInfo && <IconButton label="Info thread" className="xl:hidden" onClick={onInfo}><PanelRight size={18} /></IconButton>}
    </div>
  );
}

/** `mediaAgent`: render Hermes "MEDIA:" lines as attachment cards served by that agent's gateway session. */
export function MessageList({ chat, mediaAgent }: { chat: ChatSnapshot; mediaAgent?: string }) {
  let lastDay = '';
  let prev: ChatMessage | null = null;
  const rows = chat.messages.map(m => {
    const day = dayLabel(m.created_at);
    const showDay = day !== lastDay;
    lastDay = day;
    const author = m.role === 'user' ? 'owner' : (m.agent_id ?? chat.agent_id);
    const prevAuthor = prev ? (prev.role === 'user' ? 'owner' : (prev.agent_id ?? chat.agent_id)) : null;
    const gap = prev ? (toDate(m.created_at)?.valueOf() ?? 0) - (toDate(prev.created_at)?.valueOf() ?? 0) : Infinity;
    const compact = !showDay && prev?.role !== 'system' && prevAuthor === author && gap < 10 * 60_000;
    prev = m;
    return { m, day, showDay, author, compact };
  });

  return (
    <ol className="flex flex-col">
      {rows.map(({ m, day, showDay, author, compact }) => (
        <li key={m.id}>
          {showDay && (
            <div className="my-4 flex items-center gap-3 text-[12px] font-medium text-muted" role="separator" aria-label={day}>
              <span className="h-px flex-1 bg-line" /><span>{day}</span><span className="h-px flex-1 bg-line" />
            </div>
          )}
          {m.role === 'system' ? (
            <div className="my-2 flex items-start gap-2 pl-11 text-[12px] leading-[18px] text-muted">
              <Info size={13} className="mt-0.5 shrink-0" aria-hidden />
              <span className="whitespace-pre-wrap">{m.content}</span>
              <span className="tabular shrink-0">{clock(m.created_at)}</span>
            </div>
          ) : (
            <article className={`flex gap-3 ${compact ? 'mt-1' : 'mt-4'}`} aria-label={`${agent(author).displayName}, ${clock(m.created_at)}`}>
              <div className="w-8 shrink-0">{!compact && <AgentAvatar id={author} size={32} />}</div>
              <div className="min-w-0 max-w-[680px] flex-1">
                {!compact && (
                  <div className="mb-0.5 flex flex-wrap items-baseline gap-x-2">
                    <span className="text-[14px] font-semibold">{agent(author).displayName}</span>
                    <span className="text-[12px] text-muted">{agent(author).title} · <span className="tabular">{clock(m.created_at)}</span></span>
                  </div>
                )}
                {(() => {
                  const { text, media } = mediaAgent ? splitMedia(m.content) : { text: m.content, media: [] as string[] };
                  return <>{text && <RichText text={text} />}{author !== 'owner' && text && <ObjectCards text={text} />}{media.length > 0 && <Attachments agentId={mediaAgent!} paths={media} />}</>;
                })()}
              </div>
            </article>
          )}
        </li>
      ))}
    </ol>
  );
}

function RunLine({ chat, activeRunAgent, activeStatus, lastRun }: {
  chat: ChatSnapshot;
  activeRunAgent?: string;
  activeStatus?: string;
  lastRun?: ChatSnapshot['runs'][number];
}) {
  if (activeStatus) {
    const name = agent(activeRunAgent ?? chat.agent_id).displayName;
    return (
      <div className="flex items-center gap-2 text-[13px] text-busy" role="status">
        <Loader2 size={14} className="animate-spin" aria-hidden />
        {activeStatus === 'running' ? `${name} sedang mengerjakan…` : `Mengantre — ${name} akan mulai setelah pekerjaan lain selesai.`}
      </div>
    );
  }
  if (lastRun?.status === 'failed') {
    return (
      <div className="flex items-start gap-2 text-[13px] text-danger" role="alert">
        <CircleAlert size={14} className="mt-1 shrink-0" aria-hidden />
        <span>{agent(lastRun.agent_id).displayName} gagal menyelesaikan pesan terakhir. {lastRun.error || 'Agent tidak mengirim alasan.'} Kirim ulang atau ubah permintaanmu.</span>
      </div>
    );
  }
  if (lastRun?.status === 'waiting_for_help') {
    return <Notice tone="warn">{agent(lastRun.agent_id).displayName} butuh bantuanmu untuk melanjutkan. Balas di bawah.</Notice>;
  }
  return null;
}
