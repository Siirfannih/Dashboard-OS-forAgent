import { ArrowLeft, CircleAlert, Loader2, Send } from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { AgentAvatar, ErrorBanner, IconButton, Pill, Skeleton } from '../../components/ui';
import { useResource, useSource, useToast } from '../../lib/data';
import { go } from '../../lib/router';
import type { ChatSnapshot, CandraSession } from '../../lib/types';
import { Composer, Notice } from './Composer';
import { CANDRA_ID, CANDRA_NOTE } from './model';
import { MessageList } from './Thread';

const reasonText: Record<string, string> = {
  not_configured: 'Chat web dengan Candra belum diaktifkan di server.',
  no_telegram_session: 'Belum ada sesi Telegram DM dengan Candra. Kirim satu pesan ke Candra di Telegram, lalu kembali ke sini.',
  gateway_unreachable: 'Gateway Candra tidak bisa dihubungi. Angga bisa memeriksanya dari Ruang Tim.',
  auth_failed: 'Kunci akses ke gateway Candra ditolak. Minta Angga memeriksa konfigurasi.',
  no_session_index: 'Indeks sesi Candra tidak terbaca.',
};

/** Candra's Telegram DM session rendered as a workspace thread. One history, one memory. */
export function CandraThread() {
  const source = useSource();
  const toast = useToast();
  const [draft, setDraft] = useState('');
  const [sending, setSending] = useState(false);
  const [running, setRunning] = useState(false);
  const res = useResource(s => s.candra(), [], running ? 3000 : 15_000);
  const session = res.data;

  useEffect(() => { setRunning(!!session?.turn.running); }, [session?.turn.running]);

  const chat: ChatSnapshot | null = useMemo(() => (session ? asChat(session) : null), [session]);
  const scroller = useRef<HTMLDivElement>(null);
  const count = chat?.messages.length ?? 0;
  useEffect(() => { scroller.current?.scrollTo({ top: scroller.current.scrollHeight }); }, [count, running]);

  const send = async () => {
    const text = draft.trim();
    if (!text) return;
    setSending(true);
    try {
      await source.sendCandra(text);
      setDraft('');
      setRunning(true);
      await res.reload();
    } catch (exc) {
      toast('error', exc instanceof Error ? exc.message : 'Pesan belum terkirim ke Candra.');
    } finally {
      setSending(false);
    }
  };

  const unavailable = session && !session.available;
  return (
    <div className="flex min-w-0 flex-1 flex-col">
      <div className="flex h-14 shrink-0 items-center gap-2 border-b border-line bg-card px-3 sm:px-5">
        <IconButton label="Kembali ke daftar thread" className="md:hidden" onClick={() => go('ruang-tim')}><ArrowLeft size={18} /></IconButton>
        <h1 className="flex min-w-0 flex-1 items-center gap-2 text-[14px] font-semibold">
          <AgentAvatar id={CANDRA_ID} size={22} status={session?.available ? 'online' : 'unknown'} />
          <span className="truncate">Candra</span>
          <span className="hidden truncate font-normal text-muted sm:inline">· Kepala Sales &amp; relasi pelanggan</span>
        </h1>
        {session && (session.available ? <Pill tone="ok" dot>Satu sesi dengan Telegram</Pill> : <Pill tone="unknown">Belum tersambung</Pill>)}
      </div>

      <div ref={scroller} className="min-h-0 flex-1 overflow-y-auto" aria-live="polite" aria-relevant="additions">
        <div className="mx-auto flex max-w-[760px] flex-col px-4 py-5 sm:px-6">
          {res.loading && !session && <div className="flex flex-col gap-3"><Skeleton className="h-14" /><Skeleton className="h-14" /></div>}
          {res.error && !session && <ErrorBanner message={res.error} onRetry={res.reload} />}
          {session?.available && <div className="mb-2"><Notice>{CANDRA_NOTE}</Notice></div>}
          {unavailable && <Notice tone="warn">{reasonText[session.reason ?? ''] ?? session.detail ?? 'Candra belum bisa diajak bicara dari web.'}</Notice>}
          {chat && chat.messages.length > 0 && <MessageList chat={chat} withMedia />}
          {session?.available && chat?.messages.length === 0 && (
            <div className="py-10 text-center">
              <div className="font-display text-[17px] font-semibold">Mau bahas apa dengan Candra?</div>
              <p className="mt-1 text-[13px] text-muted">Tanya prospek, draf, atau percakapan. Persetujuan kirim tetap lewat Keputusan atau DM Telegram.</p>
            </div>
          )}
        </div>
      </div>

      <div className="shrink-0 border-t border-line bg-card px-4 pb-4 pt-3 sm:px-6">
        <div className="mx-auto flex max-w-[712px] flex-col gap-2">
          {running && (
            <div className="flex items-center gap-2 text-[13px] text-busy" role="status">
              <Loader2 size={14} className="animate-spin" aria-hidden /> Candra sedang membalas…
            </div>
          )}
          {!running && session?.turn.error && (
            <div className="flex items-start gap-2 text-[13px] text-danger" role="alert">
              <CircleAlert size={14} className="mt-1 shrink-0" aria-hidden />
              <span>{session.turn.error} Pesanmu tetap tersimpan di sesi kalau sudah diterima Candra; coba kirim ulang bila tidak muncul.</span>
            </div>
          )}
          <Composer
            value={draft}
            onChange={setDraft}
            onSend={send}
            blocked={unavailable ? 'Kirim pesan ke Candra lewat Telegram dulu sampai chat web aktif.' : null}
            waiting={running ? 'Tunggu Candra selesai membalas.' : null}
            sending={sending}
            placeholder="Tulis pesan untuk Candra…"
            hint={<><Send size={11} className="inline" aria-hidden /> Masuk ke sesi Telegram yang sama · Enter untuk kirim</>}
          />
        </div>
      </div>
    </div>
  );
}

function asChat(session: CandraSession): ChatSnapshot {
  return {
    id: session.session_id ?? 'candra', title: 'Candra', agent_id: CANDRA_ID, kind: 'private', member_ids: [CANDRA_ID],
    created_at: '', updated_at: '',
    messages: session.messages.map(m => ({
      id: m.id, role: m.role, agent_id: m.role === 'assistant' ? CANDRA_ID : null,
      content: m.content,
      created_at: typeof m.created_at === 'number' ? new Date(m.created_at * 1000).toISOString() : (m.created_at ?? ''),
    })),
    runs: [],
  };
}
