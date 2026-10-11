import { ArrowLeft, Hash, MessageSquarePlus, Plus } from 'lucide-react';
import { useCallback, useMemo, useState } from 'react';
import { AgentAvatar, Button, ErrorBanner, Field, IconButton, inputClass, Modal, Overline, Skeleton } from '../components/ui';
import { agent } from '../config/workspace';
import { useResource, useSource, useToast } from '../lib/data';
import { ago, dateTime } from '../lib/format';
import { go, href } from '../lib/router';
import type { ChatConversation, WorkspaceAgent } from '../lib/types';
import { CandraThread } from './ruangtim/CandraThread';
import { Composer, Notice } from './ruangtim/Composer';
import { AgentStatusPill } from './ruangtim/InfoPanel';
import {
  AGENT_PREFIX, availabilityOf, blockedReason, CANDRA_ID, directAgents, sortByUpdated, SUGGESTIONS, type AgentAvailability,
} from './ruangtim/model';
import { Thread } from './ruangtim/Thread';

export function RuangTimPage({ id }: { id?: string }) {
  const state = useResource(s => s.state(), [], 20_000);
  const [newFor, setNewFor] = useState<string | null>(null);
  const reloadState = state.reload;
  const onChanged = useCallback(() => { void reloadState(); }, [reloadState]);
  const closeNew = useCallback(() => setNewFor(null), []);

  const agents = state.data?.agents;
  const conversations = useMemo(() => [...(state.data?.conversations ?? [])].sort(sortByUpdated), [state.data]);
  const agentView = id?.startsWith(AGENT_PREFIX) ? id.slice(AGENT_PREFIX.length) : null;
  const threadId = id && !agentView ? id : null;
  const firstReady = agents?.find(a => a.status === 'ready')?.id ?? '';

  return (
    <div className="flex min-w-0 flex-1">
      <aside
        aria-label="Daftar thread"
        className={`w-full shrink-0 flex-col border-r border-line bg-surface md:flex md:w-[260px] ${id ? 'hidden' : 'flex'}`}
      >
        <div className="flex h-14 shrink-0 items-center justify-between border-b border-line px-4">
          <h2 className="text-[15px] font-semibold">Ruang Tim</h2>
          <IconButton label="Mulai thread baru" onClick={() => setNewFor(firstReady)}><MessageSquarePlus size={18} /></IconButton>
        </div>
        <ThreadList
          loading={!state.data && !state.error}
          error={state.data ? null : state.error}
          onRetry={state.reload}
          agents={agents ?? []}
          conversations={conversations}
          selected={id}
        />
      </aside>

      <section className={`min-w-0 flex-1 bg-card ${id ? 'flex' : 'hidden md:flex'}`} aria-label="Isi thread">
        {threadId && <Thread id={threadId} agents={agents} onChanged={onChanged} />}
        {agentView === CANDRA_ID && <CandraThread />}
        {agentView && agentView !== CANDRA_ID && (
          <AgentPane
            id={agentView}
            agents={agents}
            conversations={conversations.filter(c => c.agent_id === agentView || c.member_ids?.includes(agentView))}
            loading={!state.data && !state.error}
            onNew={() => setNewFor(agentView)}
          />
        )}
        {!id && <StartView agents={agents} loading={!state.data && !state.error} onCreated={onChanged} />}
      </section>

      <NewThreadModal
        open={newFor !== null}
        initialAgent={newFor ?? ''}
        agents={agents ?? []}
        onClose={closeNew}
        onCreated={created => { setNewFor(null); onChanged(); go('ruang-tim', created.id); }}
      />
    </div>
  );
}

/* ---------- Left column ---------- */

function ThreadList({ loading, error, onRetry, agents, conversations, selected }: {
  loading: boolean;
  error: string | null;
  onRetry: () => void;
  agents: WorkspaceAgent[];
  conversations: ChatConversation[];
  selected?: string;
}) {
  if (loading) {
    return <div className="flex flex-col gap-2 p-3">{[0, 1, 2, 3, 4].map(i => <Skeleton key={i} className="h-10" />)}</div>;
  }
  if (error) return <div className="p-3"><ErrorBanner message={`Daftar thread belum bisa dimuat. ${error}`} onRetry={onRetry} /></div>;

  const threads = conversations.filter(c => c.kind !== 'room');
  const rooms = conversations.filter(c => c.kind === 'room');
  const rowClass = (active: boolean) =>
    `flex w-full min-h-10 items-center gap-2.5 rounded-lg px-2.5 py-1.5 text-left text-[13px] ${
      active ? 'border border-line bg-card shadow-[var(--shadow-card)]' : 'border border-transparent hover:bg-line-soft'
    }`;

  return (
    <nav className="min-h-0 flex-1 overflow-y-auto px-2 pb-6" aria-label="Thread dan pesan langsung">
      <Overline className="px-2.5 pb-1 pt-4">Pesan langsung</Overline>
      <ul className="flex flex-col gap-0.5">
        {directAgents(agents).map(a => {
          const key = `${AGENT_PREFIX}${a.id}`;
          const entry = agent(a.id);
          return (
            <li key={a.id}>
              <a href={href('ruang-tim', key)} aria-current={selected === key ? 'page' : undefined} className={rowClass(selected === key)}>
                <AgentAvatar id={a.id} size={26} status={a.availability === 'ready' ? 'online' : 'idle'} />
                <span className="min-w-0 flex-1 leading-[18px]">
                  <span className="block truncate font-medium text-ink">{entry.displayName}</span>
                  <span className="block truncate text-[12px] text-muted">{entry.title}</span>
                </span>
                {a.availability !== 'ready' && <AgentStatusPill availability={a.availability} />}
              </a>
            </li>
          );
        })}
      </ul>

      <Overline className="px-2.5 pb-1 pt-5">Thread</Overline>
      {threads.length === 0 ? (
        <p className="px-2.5 text-[12px] leading-[18px] text-muted">Belum ada thread. Mulai satu dengan tombol di atas.</p>
      ) : (
        <ul className="flex flex-col gap-0.5">
          {threads.map(c => (
            <li key={c.id}>
              <a href={href('ruang-tim', c.id)} aria-current={selected === c.id ? 'page' : undefined} className={rowClass(selected === c.id)}>
                <span className="min-w-0 flex-1 leading-[18px]">
                  <span className={`block truncate ${selected === c.id ? 'font-semibold' : 'font-medium'} text-ink`}>{c.title}</span>
                  <span className="block truncate text-[12px] text-muted">{agent(c.agent_id).displayName} · {ago(c.updated_at)}</span>
                </span>
              </a>
            </li>
          ))}
        </ul>
      )}

      {rooms.length > 0 && (
        <>
          <Overline className="px-2.5 pb-1 pt-5">Ruang</Overline>
          <ul className="flex flex-col gap-0.5">
            {rooms.map(c => (
              <li key={c.id}>
                <a href={href('ruang-tim', c.id)} aria-current={selected === c.id ? 'page' : undefined} className={rowClass(selected === c.id)}>
                  <Hash size={15} className="shrink-0 text-muted" aria-hidden />
                  <span className="min-w-0 flex-1 leading-[18px]">
                    <span className="block truncate font-medium text-ink">{c.title}</span>
                    <span className="block truncate text-[12px] text-muted">{(c.member_ids?.length ?? 1)} anggota · {ago(c.updated_at)}</span>
                  </span>
                </a>
              </li>
            ))}
          </ul>
        </>
      )}
    </nav>
  );
}

/* ---------- Empty state: start a thread ---------- */

function StartView({ agents, loading, onCreated }: { agents: WorkspaceAgent[] | undefined; loading: boolean; onCreated: () => void }) {
  const source = useSource();
  const toast = useToast();
  const cards = directAgents(agents ?? []);
  const [target, setTarget] = useState<string>('');
  const [draft, setDraft] = useState('');
  const [sending, setSending] = useState(false);
  const chosen = target || agents?.find(a => a.status === 'ready')?.id || '';
  const name = agent(chosen).displayName;

  async function start() {
    const text = draft.trim();
    if (!text || !chosen) return;
    setSending(true);
    try {
      const firstLine = text.split('\n')[0];
      const title = firstLine.length > 60 ? `${firstLine.slice(0, 57)}…` : firstLine;
      const created = await source.createChat({ title, agent_id: chosen, kind: 'private' });
      await source.sendChat(created.id, text);
      setDraft('');
      onCreated();
      go('ruang-tim', created.id);
    } catch (exc) {
      toast('error', `Thread belum bisa dibuat. ${exc instanceof Error ? exc.message : 'Coba lagi sebentar lagi.'}`);
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="flex min-w-0 flex-1 flex-col overflow-y-auto">
      <div className="mx-auto flex w-full max-w-[720px] flex-1 flex-col justify-center gap-6 px-4 py-10 sm:px-6">
        <div className="text-center">
          <h2 className="font-display text-[26px] leading-9 font-semibold">Mau bahas apa hari ini?</h2>
          <p className="mt-1 text-muted">Pilih rekan tim, lalu tulis permintaanmu. Satu thread untuk satu topik.</p>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3"><Skeleton className="h-24" /><Skeleton className="h-24" /><Skeleton className="h-24" /></div>
        ) : (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {cards.map(c => {
              const entry = agent(c.id);
              const ready = c.availability === 'ready';
              const selected = ready && chosen === c.id;
              const inner = (
                <>
                  <div className="flex items-center gap-2.5">
                    <AgentAvatar id={c.id} size={32} status={ready ? 'online' : 'idle'} />
                    <div className="min-w-0 flex-1 leading-5">
                      <div className="truncate text-[14px] font-semibold">{entry.displayName}</div>
                      <div className="truncate text-[12px] text-muted">{entry.title}</div>
                    </div>
                    {!ready && <AgentStatusPill availability={c.availability} />}
                  </div>
                  <p className="mt-2 text-[12px] leading-[18px] text-muted">{ready ? (c.description ?? 'Siap menerima tugas.') : shortNote(c.availability)}</p>
                </>
              );
              return ready ? (
                <button
                  key={c.id}
                  onClick={() => setTarget(c.id)}
                  aria-pressed={selected}
                  className={`rounded-xl border p-3.5 text-left transition-colors ${selected ? 'border-accent bg-accent-soft' : 'border-line bg-card hover:border-accent/40'}`}
                >
                  {inner}
                </button>
              ) : (
                <a key={c.id} href={href('ruang-tim', `${AGENT_PREFIX}${c.id}`)} className="rounded-xl border border-dashed border-line bg-surface p-3.5 hover:border-line">
                  {inner}
                </a>
              );
            })}
          </div>
        )}

        <div className="flex flex-wrap justify-center gap-2" aria-label="Saran pertanyaan">
          {SUGGESTIONS.map(s => (
            <button key={s} onClick={() => setDraft(s)} className="rounded-full border border-line bg-card px-3 py-1.5 text-[13px] text-ink-soft hover:border-accent/40 hover:text-ink">
              {s}
            </button>
          ))}
        </div>

        <Composer
          value={draft}
          onChange={setDraft}
          onSend={start}
          sending={sending}
          blocked={loading ? null : chosen ? null : 'Belum ada agent yang siap menerima pesan. Agent lain bekerja lewat Telegram atau belum diaktifkan.'}
          placeholder={chosen ? `Tulis pesan untuk ${name}…` : 'Tulis pesan…'}
          hint={chosen ? <>Thread baru dengan <b className="font-semibold text-ink-soft">{name}</b> dibuat saat kamu kirim.</> : undefined}
        />
      </div>
    </div>
  );
}

function shortNote(a: AgentAvailability): string {
  if (a === 'shared') return 'Satu sesi dengan Telegram.';
  if (a === 'history_only') return 'Bekerja lewat Telegram — riwayat saja.';
  if (a === 'planned') return 'Belum diaktifkan.';
  return 'Tidak tersedia untuk chat.';
}

/* ---------- Agent (direct message) view ---------- */

function AgentPane({ id, agents, conversations, loading, onNew }: {
  id: string;
  agents: WorkspaceAgent[] | undefined;
  conversations: ChatConversation[];
  loading: boolean;
  onNew: () => void;
}) {
  const entry = agent(id);
  const availability = availabilityOf(agents, id);
  const description = agents?.find(a => a.id === id)?.description;
  const reason = blockedReason(availability, id);

  return (
    <div className="flex min-w-0 flex-1 flex-col">
      <div className="flex h-14 shrink-0 items-center gap-2 border-b border-line px-3 sm:px-5">
        <IconButton label="Kembali ke daftar thread" className="md:hidden" onClick={() => go('ruang-tim')}><ArrowLeft size={18} /></IconButton>
        <h1 className="flex min-w-0 items-center gap-2 text-[14px] font-semibold"><AgentAvatar id={id} size={20} /><span className="truncate">{entry.displayName}</span></h1>
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto">
        <div className="mx-auto flex max-w-[720px] flex-col gap-5 px-4 py-8 sm:px-6">
          <div className="flex items-start gap-4">
            <AgentAvatar id={id} size={56} status={availability === 'ready' ? 'online' : 'idle'} />
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="font-display text-[22px] leading-8 font-semibold">{entry.displayName}</h2>
                {loading ? <Skeleton className="h-5 w-16" /> : <AgentStatusPill availability={availability} />}
              </div>
              <p className="text-[13px] text-muted">{entry.title} · {entry.host}</p>
              {description && <p className="mt-2 text-[14px] text-ink-soft">{description}</p>}
            </div>
          </div>

          {!loading && reason && <Notice>{reason}</Notice>}
          {!loading && id === CANDRA_ID && (
            <div className="flex flex-wrap gap-2">
              <a href={href('keputusan')} className="inline-flex h-9 items-center rounded-lg bg-ink px-3.5 text-[13px] font-medium text-white">Buka Keputusan</a>
              <a href={href('percakapan')} className="inline-flex h-9 items-center rounded-lg border border-line px-3.5 text-[13px] font-medium hover:bg-surface">Buka Percakapan</a>
            </div>
          )}
          {!loading && availability === 'ready' && (
            <div><Button variant="primary" icon={<Plus size={15} />} onClick={onNew}>Mulai thread dengan {entry.displayName}</Button></div>
          )}

          <div>
            <Overline className="mb-2">Thread dengan {entry.displayName}</Overline>
            {loading ? <Skeleton className="h-12" /> : conversations.length === 0 ? (
              <p className="text-[13px] text-muted">
                {availability === 'history_only' ? `Belum ada riwayat ${entry.displayName} di workspace. Riwayat lengkapnya ada di Telegram.` : 'Belum ada thread.'}
              </p>
            ) : (
              <ul className="overflow-hidden rounded-xl border border-line">
                {conversations.map(c => (
                  <li key={c.id} className="border-t border-line first:border-t-0">
                    <a href={href('ruang-tim', c.id)} className="flex items-center gap-3 px-4 py-3 hover:bg-surface">
                      {c.kind === 'room' ? <Hash size={15} className="text-muted" aria-hidden /> : null}
                      <span className="min-w-0 flex-1 truncate font-medium">{c.title}</span>
                      <span className="tabular shrink-0 text-[12px] text-muted">{dateTime(c.updated_at)}</span>
                    </a>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ---------- New thread ---------- */

function NewThreadModal({ open, initialAgent, agents, onClose, onCreated }: {
  open: boolean;
  initialAgent: string;
  agents: WorkspaceAgent[];
  onClose: () => void;
  onCreated: (c: ChatConversation) => void;
}) {
  const source = useSource();
  const ready = agents.filter(a => a.status === 'ready');
  const [title, setTitle] = useState('');
  const [agentId, setAgentId] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [touched, setTouched] = useState(false);
  const [lastOpen, setLastOpen] = useState(false);

  // Reset the form each time the modal opens.
  if (open !== lastOpen) {
    setLastOpen(open);
    if (open) {
      setTitle('');
      setError(null);
      setTouched(false);
      setAgentId(ready.some(a => a.id === initialAgent) ? initialAgent : (ready[0]?.id ?? ''));
    }
  }

  const trimmed = title.trim();
  const titleError = !trimmed ? 'Judul wajib diisi.' : trimmed.length > 200 ? 'Judul maksimal 200 karakter.' : null;

  async function create() {
    setTouched(true);
    if (titleError || !agentId) return;
    setSaving(true);
    setError(null);
    try {
      onCreated(await source.createChat({ title: trimmed, agent_id: agentId, kind: 'private' }));
    } catch (exc) {
      setError(`Thread belum bisa dibuat. ${exc instanceof Error ? exc.message : 'Coba lagi sebentar lagi.'}`);
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Thread baru"
      width={480}
      footer={<>
        <Button onClick={onClose}>Batal</Button>
        <Button variant="primary" disabled={saving || !ready.length} onClick={create}>{saving ? 'Membuat…' : 'Buat thread'}</Button>
      </>}
    >
      <form onSubmit={e => { e.preventDefault(); void create(); }}>
        <Field label="Judul topik" htmlFor="thread-title" hint={touched && titleError ? <span className="text-danger">{titleError}</span> : `Satu thread untuk satu topik. ${trimmed.length}/200`}>
          <input
            id="thread-title"
            className={inputClass}
            value={title}
            maxLength={200}
            required
            aria-invalid={touched && !!titleError}
            placeholder="Mis. Cek kesehatan harian"
            onChange={e => setTitle(e.target.value)}
          />
        </Field>
        <Field label="Dengan siapa" htmlFor="thread-agent" hint="Hanya agent yang siap menerima pesan dari workspace yang bisa dipilih.">
          {ready.length ? (
            <select id="thread-agent" className={inputClass} value={agentId} onChange={e => setAgentId(e.target.value)}>
              {ready.map(a => <option key={a.id} value={a.id}>{agent(a.id).displayName} · {agent(a.id).title}</option>)}
            </select>
          ) : <Notice>Belum ada agent yang siap menerima pesan.</Notice>}
        </Field>
        {error && <ErrorBanner message={error} />}
        <button type="submit" className="hidden" aria-hidden tabIndex={-1} />
      </form>
    </Modal>
  );
}
