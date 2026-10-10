import { ArrowLeft, Check, Clock, Hourglass, Info, MessageSquareText, PenLine, TriangleAlert } from 'lucide-react';
import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { BusinessAvatar, Button, Card, DataAge, EmptyState, ErrorBanner, Overline, Pill, Skeleton } from '../components/ui';
import { senderLabel, workspace } from '../config/workspace';
import { useResource, useSource, useToast } from '../lib/data';
import { ago, bubbles, dateTime, maskPhone, parseJson } from '../lib/format';
import { go, href } from '../lib/router';
import type { ReviewItem, ReviewPolicy, StudyContent } from '../lib/types';
import { WhyEligible } from './keputusan/Evidence';
import { ReviseModal, type DeclineAction } from './keputusan/ReviseModal';

const PENDING = ['draft', 'needs_revision'];
const APPROVED = ['queued', 'telegram_approved'];
const outbound = workspace.schedule.find(s => s.key === 'outbound');
const research = workspace.schedule.find(s => s.key === 'research');
const sendWindow = outbound ? `${outbound.from}–${outbound.to} ${workspace.timezoneLabel}` : 'jam kirim';

const kindLabel: Record<string, string> = { first: 'Pesan pertama', followup: 'Tindak lanjut', reply: 'Balasan' };
const isTest = (item: ReviewItem) => item.run_mode === 'review_only';
const segmentOf = (study: StudyContent | null) => (typeof study?.bisnis?.jenis === 'string' ? study.bisnis.jenis : null);

/** Why approve is not possible right now, or null when it is. Mirrors sales/review.py rules. */
function approveBlock(item: ReviewItem): string | null {
  if (item.status === 'needs_revision') return 'Revisi sudah diminta. Candra sedang menulis versi baru — kamu akan meninjaunya di sini.';
  if (APPROVED.includes(item.status)) return 'Draf ini sudah disetujui dan ada di antrean kirim.';
  if (item.status !== 'draft') return 'Draf ini tidak lagi menunggu keputusan.';
  if (item.control === 'HOLD') return 'Percakapan sedang ditahan. Kembalikan ke Otomatis di Percakapan dulu sebelum menyetujui draf AI.';
  if (item.control === 'HUMAN_CONTROLLED') return 'Kamu sedang memegang percakapan ini, jadi draf AI tidak bisa disetujui.';
  if (item.control === 'DO_NOT_CONTACT') return 'Prospek ini minta tidak dihubungi. Draf tidak bisa disetujui.';
  if (item.control !== 'AUTO') return 'Status kendali percakapan tidak diketahui, jadi draf belum bisa disetujui.';
  return null;
}

function declineBlock(item: ReviewItem): string | null {
  if (item.status === 'needs_revision') return 'Revisi sudah diminta untuk versi ini.';
  if (!['draft', ...APPROVED].includes(item.status)) return 'Draf ini tidak lagi menunggu keputusan.';
  return null;
}

function friendlyError(message: string): { text: string; changed: boolean } {
  if (/version changed|snapshot changed|sender changed|review again/i.test(message)) {
    return { changed: true, text: 'Draf berubah sejak kamu membukanya (versi baru, bukti diperbarui, atau status prospek berubah). Halaman dimuat ulang — tinjau lagi sebelum memutuskan.' };
  }
  if (/only auto/i.test(message)) return { changed: true, text: 'Percakapan ini tidak lagi di mode Otomatis, jadi draf AI tidak bisa disetujui. Halaman dimuat ulang.' };
  if (/reason is required/i.test(message)) return { changed: false, text: 'Alasan wajib diisi.' };
  if (/too long/i.test(message)) return { changed: false, text: 'Alasan terlalu panjang (maks 1000 karakter).' };
  if (/not a draft|cannot be declined/i.test(message)) return { changed: true, text: 'Draf ini sudah diputuskan di tempat lain. Halaman dimuat ulang.' };
  return { changed: false, text: `Keputusan belum tersimpan: ${message}` };
}

export function KeputusanPage({ id }: { id?: string }) {
  const source = useSource();
  const toast = useToast();
  const res = useResource(async s => {
    const [items, policy] = await Promise.all([s.review(), s.reviewPolicy().catch(() => null)]);
    return { items, policy };
  }, [], 30_000);

  const items = res.data?.items;
  const policy = res.data?.policy ?? null;
  const pending = useMemo(() => (items ?? [])
    .filter(r => PENDING.includes(r.status))
    .sort((a, b) => (a.status === b.status ? a.created_at - b.created_at : a.status === 'draft' ? -1 : 1)), [items]);
  const approved = useMemo(() => (items ?? []).filter(r => APPROVED.includes(r.status)), [items]);
  const drafts = pending.filter(r => r.status === 'draft').length;

  // Route id wins; on wide screens with no id we preview the first pending draft.
  const routed = id ? (items ?? []).find(r => r.id === id) : undefined;
  const selected = routed ?? (!id ? pending[0] : undefined);

  const [busy, setBusy] = useState<'approve' | 'decline' | null>(null);
  const [reviseOpen, setReviseOpen] = useState(false);
  const [modalError, setModalError] = useState<string | null>(null);

  const moveNext = useCallback((current: ReviewItem) => {
    const index = pending.findIndex(r => r.id === current.id);
    const rest = pending.filter(r => r.id !== current.id && r.status === 'draft');
    const next = rest.find(r => pending.indexOf(r) > index) ?? rest[0];
    go('keputusan', next?.id);
  }, [pending]);

  const approve = useCallback(async (item: ReviewItem) => {
    if (busy || approveBlock(item)) return;
    setBusy('approve');
    try {
      await source.approve(item);
      toast('ok', isTest(item)
        ? `${item.name}: v${item.version} disetujui sebagai uji. Draf ini tidak akan terkirim.`
        : `${item.name}: v${item.version} disetujui dan masuk antrean kirim. Dikirim saat jam kirim (${sendWindow}) dan WhatsApp tersambung.`);
      await res.reload();
      moveNext(item);
    } catch (exc) {
      const f = friendlyError(exc instanceof Error ? exc.message : String(exc));
      toast('error', f.text);
      if (f.changed) await res.reload();
    } finally {
      setBusy(null);
    }
  }, [busy, source, toast, moveNext, res]);

  const decline = useCallback(async (item: ReviewItem, reason: string, action: DeclineAction) => {
    setBusy('decline');
    setModalError(null);
    try {
      await source.decline(item, reason, action);
      setReviseOpen(false);
      toast('ok', action === 'revise'
        ? `${item.name}: revisi diminta. Candra akan menulis versi baru untuk kamu tinjau.`
        : `${item.name}: prospek ditahan. Tidak ada yang menghubunginya sampai kamu lepaskan.`);
      await res.reload();
      moveNext(item);
    } catch (exc) {
      const f = friendlyError(exc instanceof Error ? exc.message : String(exc));
      if (f.changed) {
        setReviseOpen(false);
        toast('error', f.text);
        await res.reload();
      } else setModalError(f.text);
    } finally {
      setBusy(null);
    }
  }, [source, toast, moveNext, res]);

  const openRevise = useCallback(() => { setModalError(null); setReviseOpen(true); }, []);

  // Keyboard: A = approve, R = request revision (ignored while typing or with a dialog open).
  const keys = useRef({ selected, approve, openRevise, reviseOpen });
  keys.current = { selected, approve, openRevise, reviseOpen };
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey || e.altKey || e.repeat) return;
      const t = e.target as HTMLElement | null;
      if (t && (t.isContentEditable || ['INPUT', 'TEXTAREA', 'SELECT'].includes(t.tagName))) return;
      const { selected: item, approve: doApprove, openRevise: doRevise, reviseOpen: modalOpen } = keys.current;
      if (!item || modalOpen || document.querySelector('[role="dialog"]')) return;
      const k = e.key.toLowerCase();
      if (k === 'a' && !approveBlock(item)) { e.preventDefault(); void doApprove(item); }
      if (k === 'r' && !declineBlock(item)) { e.preventDefault(); doRevise(); }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  const loading = !res.data && res.loading;

  return (
    <div className="flex min-h-0 min-w-0 flex-1">
      {/* List */}
      <aside className={`${id ? 'hidden lg:flex' : 'flex'} w-full min-w-0 flex-col border-line bg-surface lg:w-[340px] lg:shrink-0 lg:border-r`} aria-label="Daftar draf">
        <div className="border-b border-line px-4 py-4 sm:px-5">
          <div className="flex items-baseline justify-between gap-2">
            <h1 className="font-display text-[20px] leading-7 font-semibold">Keputusan</h1>
            <DataAge loadedAt={res.loadedAt} />
          </div>
          <p className="text-[13px] text-muted">
            {loading ? 'Memuat draf…' : drafts ? `${drafts} draf menunggu persetujuanmu` : 'Tidak ada draf yang menunggu'}
            {pending.length > drafts ? ` · ${pending.length - drafts} sedang direvisi` : ''}
          </p>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto">
          {res.error && <div className="p-3"><ErrorBanner message={res.data ? `Data mungkin usang: ${res.error}` : res.error} onRetry={res.reload} /></div>}
          {loading && <div className="flex flex-col gap-2 p-3">{[0, 1, 2].map(i => <Skeleton key={i} className="h-[76px]" />)}</div>}
          {res.data && pending.length === 0 && (
            <div className="px-5 py-8 text-center">
              <div className="mx-auto mb-2 grid size-10 place-items-center rounded-full bg-ok-soft text-ok"><Check size={18} /></div>
              <div className="font-semibold">Semua draf sudah ditinjau</div>
              <p className="text-[13px] text-muted">Draf baru muncul di sini setelah riset malam.</p>
            </div>
          )}
          <ul>
            {pending.map(item => <ListRow key={`${item.namespace}:${item.id}`} item={item} active={selected?.id === item.id} preview={!id} />)}
          </ul>
          {approved.length > 0 && (
            <details className="border-t border-line">
              <summary className="cursor-pointer px-5 py-3 text-[13px] font-medium text-ink-soft hover:bg-line-soft">Sudah disetujui, menunggu kirim · {approved.length}</summary>
              <ul>{approved.map(item => <ListRow key={`${item.namespace}:${item.id}`} item={item} active={selected?.id === item.id} preview={!id} />)}</ul>
            </details>
          )}
        </div>
      </aside>

      {/* Detail */}
      <section className={`${id ? 'flex' : 'hidden lg:flex'} min-h-0 min-w-0 flex-1 flex-col`} aria-label="Detail draf">
        {loading && <DetailSkeleton />}
        {res.data && !selected && id && (
          <div className="flex-1 overflow-y-auto">
            <BackLink />
            <EmptyState icon={<Info size={20} />} title="Draf ini sudah tidak menunggu keputusan" action={<Button onClick={() => go('keputusan')}>Kembali ke daftar</Button>}>
              Mungkin sudah diputuskan, direvisi menjadi versi baru, atau sudah terkirim.
            </EmptyState>
          </div>
        )}
        {res.data && !selected && !id && (
          <div className="grid flex-1 place-items-center overflow-y-auto">
            <EmptyState icon={<Check size={20} />} title="Semua draf sudah ditinjau" action={<a href={href('beranda')} className="inline-flex h-9 items-center rounded-lg border border-line bg-card px-3.5 text-[13px] font-medium hover:bg-surface">Kembali ke Beranda</a>}>
              Candra menaruh draf baru di sini setelah riset malam{research ? ` (${research.from}–${research.to} ${workspace.timezoneLabel})` : ''}. Kamu juga akan melihatnya di Beranda.
            </EmptyState>
          </div>
        )}
        {selected && (
          <Detail
            key={`${selected.id}:${selected.version}`}
            item={selected}
            policy={policy}
            busy={busy}
            onApprove={() => void approve(selected)}
            onRevise={openRevise}
          />
        )}
      </section>

      {selected && (
        <ReviseModal
          item={selected}
          open={reviseOpen}
          busy={busy === 'decline'}
          error={modalError}
          onClose={() => setReviseOpen(false)}
          onSubmit={(reason, action) => void decline(selected, reason, action)}
        />
      )}
    </div>
  );
}

function ListRow({ item, active, preview }: { item: ReviewItem; active: boolean; preview: boolean }) {
  const study = parseJson<StudyContent>(item.study_content);
  const segment = segmentOf(study);
  return (
    <li>
      <a
        href={href('keputusan', item.id)}
        aria-current={active && !preview ? 'true' : undefined}
        className={`flex gap-3 border-b border-line-soft px-4 py-3 sm:px-5 ${!active ? 'hover:bg-line-soft' : preview
          ? 'hover:bg-line-soft lg:bg-accent-soft lg:shadow-[inset_3px_0_0_var(--color-accent)]'
          : 'bg-accent-soft shadow-[inset_3px_0_0_var(--color-accent)]'}`}
      >
        <BusinessAvatar name={item.name} size={36} channel="whatsapp" />
        <div className="min-w-0 flex-1">
          <div className="flex items-baseline justify-between gap-2">
            <span className="truncate text-[14px] font-medium">{item.name}</span>
            <span className="shrink-0 text-[12px] text-muted">{ago(item.created_at)}</span>
          </div>
          <div className="truncate text-[12px] leading-[18px] text-muted">
            {[item.prospect_ref, segment, `v${item.version}`, senderLabel(item.sender_profile)].filter(Boolean).join(' · ')}
          </div>
          <div className="mt-1 flex flex-wrap gap-1">
            {item.status === 'needs_revision' && <Pill tone="info">Menunggu versi baru</Pill>}
            {APPROVED.includes(item.status) && <Pill tone="ok">Disetujui</Pill>}
            {item.control !== 'AUTO' && <Pill tone="warn">{controlLabel[item.control] ?? item.control}</Pill>}
            {isTest(item) && <Pill tone="busy">Uji — tidak terkirim</Pill>}
          </div>
        </div>
      </a>
    </li>
  );
}

const controlLabel: Record<string, string> = { HOLD: 'Ditahan', HUMAN_CONTROLLED: 'Dipegang kamu', DO_NOT_CONTACT: 'Jangan hubungi', AUTO: 'Otomatis' };

function BackLink() {
  return (
    <div className="border-b border-line bg-card px-2 py-1.5 lg:hidden">
      <button onClick={() => go('keputusan')} className="inline-flex h-9 items-center gap-1.5 rounded-lg px-2 text-[13px] font-medium text-ink-soft hover:bg-line-soft">
        <ArrowLeft size={16} aria-hidden /> Semua draf
      </button>
    </div>
  );
}

function Detail({ item, policy, busy, onApprove, onRevise }: {
  item: ReviewItem;
  policy: ReviewPolicy | null;
  busy: 'approve' | 'decline' | null;
  onApprove: () => void;
  onRevise: () => void;
}) {
  const study = useMemo(() => parseJson<StudyContent>(item.study_content), [item.study_content]);
  const parts = bubbles(item.body);
  const segment = segmentOf(study);
  const blockApprove = approveBlock(item);
  const blockDecline = declineBlock(item);
  const test = isTest(item);
  const scrollRef = useRef<HTMLDivElement>(null);
  useEffect(() => { scrollRef.current?.scrollTo({ top: 0 }); }, [item.id]);

  return (
    <>
      <BackLink />
      <div ref={scrollRef} className="min-h-0 flex-1 overflow-y-auto">
        <div className="mx-auto flex max-w-[860px] flex-col gap-4 px-4 py-5 sm:px-6">
          {/* Header */}
          <div className="flex items-start gap-3">
            <BusinessAvatar name={item.name} size={48} channel="whatsapp" />
            <div className="min-w-0 flex-1">
              <h2 className="font-display text-[20px] leading-7 font-semibold break-words">{item.name}</h2>
              <div className="text-[13px] text-muted">
                {[item.prospect_ref, segment, maskPhone(item.phone)].filter(Boolean).join(' · ')}
              </div>
              <div className="mt-2 flex flex-wrap gap-1.5">
                <Pill tone="gray">Versi v{item.version}</Pill>
                <Pill tone="gray">{kindLabel[item.kind] ?? item.kind}</Pill>
                <Pill tone="accent" title="Nomor WhatsApp yang akan mengirim">Dari {senderLabel(item.sender_profile)}</Pill>
                {test && <Pill tone="busy" title="Mode uji: semua jalur kirim menolak draf ini">Uji — tidak terkirim</Pill>}
                {item.control !== 'AUTO' && <Pill tone="warn" dot>{controlLabel[item.control] ?? item.control}</Pill>}
              </div>
            </div>
          </div>

          {item.status === 'needs_revision' && (
            <Notice tone="info" icon={<Hourglass size={15} />}>
              <b className="font-semibold">Revisi diminta.</b> Candra sedang menulis versi baru dari draf ini. Versi lama tidak bisa disetujui.
            </Notice>
          )}
          {APPROVED.includes(item.status) && (
            <Notice tone="ok" icon={<Check size={15} />}>
              <b className="font-semibold">Sudah disetujui.</b> {test ? 'Ini keputusan uji — draf tidak akan terkirim.' : `Ada di antrean kirim; dikirim saat jam kirim (${sendWindow}) dan WhatsApp tersambung.`}
            </Notice>
          )}
          {item.feedback_reason && (
            <Notice tone="gray" icon={<PenLine size={15} />}>
              <span className="block text-[12px] font-semibold uppercase tracking-[0.06em] text-muted">Catatanmu sebelumnya{item.feedback_action === 'hold' ? ' · prospek ditahan' : ' · revisi'}</span>
              <span className="block text-ink">“{item.feedback_reason}”</span>
            </Notice>
          )}

          {/* Draft */}
          <Card className="overflow-hidden">
            <div className="flex flex-wrap items-center justify-between gap-2 px-5 pt-4">
              <div>
                <Overline>Draf lengkap</Overline>
                <h3 className="text-[16px] font-semibold">Yang akan diterima prospek</h3>
              </div>
              <span className="text-[12px] text-muted">{parts.length} gelembung · disusun {ago(item.created_at)}</span>
            </div>
            <div className="mt-3 flex flex-col items-end gap-2 bg-surface px-4 py-5 sm:px-5" aria-label="Pratinjau pesan WhatsApp">
              {parts.length === 0 && <p className="self-center text-[13px] text-muted">Draf kosong.</p>}
              {parts.map((text, i) => (
                <div key={i} className="max-w-[88%] rounded-2xl rounded-br-md border border-ok/10 bg-ok-soft px-3.5 py-2 text-[14px] leading-[22px] whitespace-pre-wrap break-words text-ink shadow-[var(--shadow-card)] sm:max-w-[75%]">
                  {text}
                </div>
              ))}
            </div>
          </Card>

          <WhyEligible item={item} study={study} policy={policy} />

          <Card className="p-5">
            <Overline>Setelah kamu setujui</Overline>
            <ul className="mt-2 flex flex-col gap-2 text-[13px] text-ink-soft">
              {test ? (
                <li className="flex gap-2"><Info size={15} className="mt-0.5 shrink-0 text-busy" aria-hidden />Mode uji: keputusanmu dicatat, tetapi draf ini tidak akan pernah terkirim.</li>
              ) : (
                <li className="flex gap-2"><MessageSquareText size={15} className="mt-0.5 shrink-0 text-muted" aria-hidden />Draf masuk antrean kirim lewat {senderLabel(item.sender_profile)}. Dikirim saat jam kirim ({sendWindow}) dan WhatsApp tersambung — bukan langsung.</li>
              )}
              <li className="flex gap-2">
                <Clock size={15} className="mt-0.5 shrink-0 text-muted" aria-hidden />
                {policy
                  ? `Persetujuan berlaku ${policy.approval_expires_hours} jam. Kalau belum terkirim dalam waktu itu, draf kembali ke sini untuk ditinjau ulang.`
                  : 'Masa berlaku persetujuan tidak bisa dimuat saat ini.'}
              </li>
              <li className="flex gap-2"><PenLine size={15} className="mt-0.5 shrink-0 text-muted" aria-hidden />Mengubah isi, nomor, atau profil pengirim membatalkan persetujuan dan membuat versi baru untuk ditinjau.</li>
            </ul>
            <div className="mt-3 text-[12px] text-muted">Draf dibuat {dateTime(item.created_at)} {workspace.timezoneLabel}</div>
          </Card>
        </div>
      </div>

      {/* Action bar */}
      <div className="border-t border-line bg-card px-4 py-3 sm:px-6">
        <div className="mx-auto flex max-w-[860px] flex-col gap-2">
          <div className="flex flex-wrap items-center gap-2">
            <Button
              variant="primary"
              onClick={onApprove}
              disabled={!!blockApprove || !!busy}
              aria-describedby={blockApprove ? 'approve-block' : undefined}
              aria-keyshortcuts="A"
              icon={<Check size={15} aria-hidden />}
              className="max-sm:flex-1"
            >
              {busy === 'approve' ? 'Menyimpan…' : test ? `Setujui v${item.version} (uji — tidak terkirim)` : `Setujui draf v${item.version}`}
              <Kbd>A</Kbd>
            </Button>
            <Button onClick={onRevise} disabled={!!blockDecline || !!busy} aria-keyshortcuts="R" icon={<PenLine size={15} aria-hidden />} className="max-sm:flex-1">
              Minta revisi <Kbd>R</Kbd>
            </Button>
          </div>
          {blockApprove && (
            <p id="approve-block" className="flex gap-1.5 text-[12px] leading-[18px] text-warn"><TriangleAlert size={13} className="mt-0.5 shrink-0" aria-hidden />{blockApprove}</p>
          )}
        </div>
      </div>
    </>
  );
}

function Kbd({ children }: { children: ReactNode }) {
  return <kbd className="ml-1 hidden rounded border border-current/30 px-1 font-mono text-[12px] leading-4 opacity-80 lg:inline">{children}</kbd>;
}

function Notice({ tone, icon, children }: { tone: 'info' | 'ok' | 'gray'; icon: ReactNode; children: ReactNode }) {
  const cls = { info: 'border-info/15 bg-info-soft text-info', ok: 'border-ok/15 bg-ok-soft text-ok', gray: 'border-line bg-card text-ink-soft' }[tone];
  return <div className={`flex gap-2 rounded-xl border px-4 py-3 text-[13px] ${cls}`}><span className="mt-0.5 shrink-0" aria-hidden>{icon}</span><div className="min-w-0">{children}</div></div>;
}

function DetailSkeleton() {
  return (
    <div className="mx-auto flex w-full max-w-[860px] flex-col gap-4 px-4 py-5 sm:px-6">
      <div className="flex gap-3"><Skeleton className="size-12 rounded-full" /><div className="flex-1"><Skeleton className="h-6 w-1/2" /><Skeleton className="mt-2 h-4 w-1/3" /></div></div>
      <Skeleton className="h-48" />
      <Skeleton className="h-64" />
    </div>
  );
}
