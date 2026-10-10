import { ArrowLeft, Eye, History, Lock, Monitor, Pencil, PencilLine, Send } from 'lucide-react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { AgentAvatar, Button, ErrorBanner, IconButton } from '../components/ui';
import { hostLabel, salesWorkflow } from '../config/workflow';
import { agent } from '../config/workspace';
import { ApiError } from '../lib/api';
import { useResource, useToast } from '../lib/data';
import { go } from '../lib/router';
import type { WorkflowProposal } from '../lib/types';
import { Canvas } from './alurkerja/Canvas';
import { Inspector } from './alurkerja/Inspector';
import {
  computeChanges, currentValue, nodeById, nodeStatus, splitKey, typeMeta, validateDraft, type Draft, type LiveData,
} from './alurkerja/model';
import { ExecutorIcon, StatusPills } from './alurkerja/NodeView';
import { HistoryModal, PendingPanel, SubmitModal } from './alurkerja/Proposals';

function useMedia(query: string): boolean {
  const [match, setMatch] = useState(() => typeof window !== 'undefined' && window.matchMedia(query).matches);
  useEffect(() => {
    const mq = window.matchMedia(query);
    const on = () => setMatch(mq.matches);
    on();
    mq.addEventListener('change', on);
    return () => mq.removeEventListener('change', on);
  }, [query]);
  return match;
}

const TEAM = ['candra', 'research', 'owner'];

export function AlurKerjaPage({ id }: { id?: string }) {
  const toast = useToast();
  const isMobile = useMedia('(max-width: 767px)');
  const isWide = useMedia('(min-width: 1024px)');

  const wf = useResource(async s => {
    try {
      return { state: await s.workflow(), missing: false };
    } catch (exc) {
      if (exc instanceof ApiError && exc.status === 404) return { state: null, missing: true };
      throw exc;
    }
  }, []);
  const live = useResource<LiveData>(async s => {
    const [jobs, review, bridge, wa, held] = await Promise.all([
      s.jobs().then(r => r.items).catch(() => null),
      s.review().catch(() => null),
      s.bridge().catch(() => null),
      s.whatsapp().catch(() => null),
      s.conversations('hold').catch(() => null),
    ]);
    return { jobs, review, bridge, wa, holds: held ? held.counts.hold ?? held.items.length : null };
  }, [], 30_000);

  const state = wf.data?.state ?? null;
  const missing = wf.data?.missing ?? false;
  const overrides = useMemo(() => state?.overrides ?? {}, [state]);
  const version = state?.version;
  const proposals = state?.proposals ?? [];
  const canEdit = !!state && !missing;

  const [mode, setMode] = useState<'view' | 'edit'>('view');
  const [draft, setDraft] = useState<Draft>({});
  const [submitOpen, setSubmitOpen] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [recent, setRecent] = useState<WorkflowProposal | null>(null);

  const editing = mode === 'edit' && canEdit && !isMobile;
  const changes = useMemo(() => computeChanges(draft, overrides), [draft, overrides]);
  const errors = useMemo(() => validateDraft(draft, overrides), [draft, overrides]);
  const hasErrors = Object.keys(errors).length > 0;
  const changedByNode = useMemo(() => {
    const map = new Map<string, Set<string>>();
    for (const c of changes) {
      if (!map.has(c.node_id)) map.set(c.node_id, new Set());
      map.get(c.node_id)!.add(c.field);
    }
    return map;
  }, [changes]);

  const selected = nodeById(id);
  const select = (nodeId: string) => go('alur-kerja', nodeId);
  const deselect = useCallback(() => go('alur-kerja'), []);

  useEffect(() => {
    if (!selected || isWide) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && deselect();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [selected, isWide, deselect]);

  const setValue = (key: string, value: string) => {
    const { nodeId, field } = splitKey(key);
    const node = nodeById(nodeId);
    if (!node) return;
    setDraft(prev => {
      const next = { ...prev };
      if (value === currentValue(node, field, overrides)) delete next[key];
      else next[key] = value;
      return next;
    });
  };

  const discard = () => {
    setDraft({});
    setMode('view');
    toast('info', 'Draf dibuang. Alur aktif tidak berubah.');
  };

  const closeSubmit = useCallback(() => setSubmitOpen(false), []);
  const closeHistory = useCallback(() => setHistoryOpen(false), []);

  const onSubmitted = async (_proposal: WorkflowProposal) => {
    setSubmitOpen(false);
    setDraft({});
    setMode('view');
    setRecent(null);
    toast('ok', 'Proposal tersimpan. Periksa sekali lagi, lalu setujui untuk mengirimnya ke Angga.');
    await wf.reload();
  };

  const onDecided = async (proposal: WorkflowProposal) => {
    setRecent(proposal);
    await wf.reload();
  };

  const versionText = version !== undefined
    ? editing ? `draf v${version + 1} · v${version} aktif` : `v${version} aktif`
    : missing ? 'versi belum tersedia' : wf.error ? 'versi tidak diketahui' : 'memuat…';
  const editBlockedReason = missing
    ? 'Proposal perubahan belum aktif di server ini'
    : !state ? (wf.error ? 'Versi alur belum bisa dimuat' : 'Memuat versi alur…') : undefined;

  return (
    <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
      {/* Header */}
      <div className="flex shrink-0 flex-wrap items-center gap-x-3.5 gap-y-2 border-b border-line bg-card px-4 py-2.5 sm:px-5">
        <IconButton label="Kembali ke Beranda" onClick={() => go('beranda')} className="-ml-1.5"><ArrowLeft size={18} /></IconButton>
        <div className="min-w-0">
          <h1 className="truncate text-[15px] font-semibold leading-5">{salesWorkflow.name}</h1>
          <div className="truncate text-[12px] text-muted">{salesWorkflow.path} · {versionText}</div>
        </div>

        <div role="group" aria-label="Mode alur" className="hidden gap-0.5 rounded-[10px] border border-line bg-card p-[3px] md:flex">
          <button
            type="button"
            aria-pressed={mode === 'view'}
            onClick={() => setMode('view')}
            className={`flex items-center gap-1.5 rounded-[7px] px-2.5 py-1 text-[13px] font-medium ${mode === 'view' ? 'bg-accent-soft text-accent' : 'text-muted hover:text-ink'}`}
          >
            <Eye size={14} aria-hidden />Lihat
          </button>
          <button
            type="button"
            aria-pressed={mode === 'edit'}
            disabled={!canEdit}
            title={editBlockedReason}
            onClick={() => setMode('edit')}
            className={`flex items-center gap-1.5 rounded-[7px] px-2.5 py-1 text-[13px] font-medium disabled:text-faint ${mode === 'edit' && canEdit ? 'bg-accent-soft text-accent' : 'text-muted hover:text-ink'}`}
          >
            <Pencil size={14} aria-hidden />Ubah
          </button>
        </div>

        <div className="hidden items-center gap-2 xl:flex">
          <span className="text-[12px] font-semibold uppercase tracking-[0.06em] text-muted">Tim</span>
          {TEAM.map(t => (
            <span key={t} className="inline-flex items-center gap-1.5 rounded-full border border-line bg-card py-0.5 pl-0.5 pr-2 text-[12px] font-medium text-ink-soft">
              {t === 'owner' ? <ExecutorIcon node={{ ...salesWorkflow.nodes[0], executor: 'owner' }} size={20} /> : <AgentAvatar id={t} size={20} />}
              {t === 'owner' ? 'Kamu' : agent(t).displayName}
            </span>
          ))}
        </div>

        <div className="ml-auto flex items-center gap-2">
          <Button size="sm" icon={<History size={14} />} onClick={() => setHistoryOpen(true)} disabled={!state}>
            <span className="hidden sm:inline">Riwayat proposal</span><span className="sm:hidden">Riwayat</span>
          </Button>
<span className="hidden md:contents">
          <Button
            size="sm"
            variant="primary"
            icon={<Send size={14} />}
            disabled={!canEdit || changes.length === 0 || hasErrors}
            title={hasErrors ? 'Perbaiki isian yang salah dulu' : changes.length === 0 ? 'Belum ada perubahan di draf' : undefined}
            onClick={() => setSubmitOpen(true)}
          >
            Ajukan perubahan{changes.length ? ` (${changes.length})` : ''}
          </Button>
          </span>
        </div>
      </div>

      {/* Banners */}
      {missing && (
        <div role="status" className="flex shrink-0 items-start gap-2.5 border-b border-info/15 bg-info-soft px-4 py-2.5 text-[13px] text-info sm:px-5">
          <Lock size={15} className="mt-0.5 shrink-0" aria-hidden />
          <span><b>Proposal perubahan belum aktif di server ini.</b> Kamu tetap bisa melihat alur dan status langsungnya. Mode Ubah aktif setelah fitur ini dipasang di server.</span>
        </div>
      )}
      {wf.error && !wf.data && (
        <div className="shrink-0 border-b border-line bg-card px-4 py-2.5 sm:px-5">
          <ErrorBanner message={`Versi alur belum bisa dimuat (${wf.error}). Menampilkan alur bawaan; mode Ubah dimatikan.`} onRetry={wf.reload} />
        </div>
      )}
      {editing && (
        <div className="flex shrink-0 flex-wrap items-center gap-2.5 border-b border-warn-line bg-warn-soft px-4 py-2 text-[13px] text-warn sm:px-5">
          <PencilLine size={15} className="shrink-0" aria-hidden />
          <span className="min-w-0 flex-1">
            Kamu mengedit <b>draf v{(version ?? 0) + 1}</b>. Alur aktif v{version} tetap berjalan sampai perubahan disetujui.
            {changes.length > 0 && <> · {changes.length} perubahan</>}
          </span>
          <button type="button" onClick={discard} className="rounded-md px-2 py-1 font-medium hover:bg-warn-line/40">Buang draf</button>
        </div>
      )}
      {!editing && mode === 'view' && changes.length > 0 && !isMobile && (
        <div className="flex shrink-0 flex-wrap items-center gap-2.5 border-b border-line bg-surface px-4 py-2 text-[13px] text-ink-soft sm:px-5">
          <PencilLine size={15} className="shrink-0 text-muted" aria-hidden />
          <span className="min-w-0 flex-1">Kamu punya draf dengan {changes.length} perubahan yang belum diajukan. Kanvas menampilkan alur aktif.</span>
          <button type="button" onClick={() => setMode('edit')} className="rounded-md px-2 py-1 font-medium text-accent hover:bg-accent-soft">Lanjutkan draf</button>
        </div>
      )}

      {state && (
        <PendingPanel
          proposals={proposals}
          recent={recent}
          onDecided={onDecided}
          onDismissRecent={() => setRecent(null)}
          onReload={wf.reload}
        />
      )}

      {/* Desktop / tablet: canvas + inspector */}
      {!isMobile && (
        <div className="flex min-h-0 flex-1">
          <Canvas
            selectedId={selected?.id}
            onSelect={select}
            editing={editing}
            overrides={overrides}
            draft={editing ? draft : {}}
            changedByNode={editing ? changedByNode : new Map()}
            live={live.data}
          />
          {isWide && (
            <aside className="w-[360px] shrink-0 overflow-y-auto border-l border-line bg-card" aria-label="Detail langkah">
              {selected ? (
                <Inspector
                  key={selected.id}
                  node={selected}
                  editing={editing}
                  canEdit={canEdit}
                  overrides={overrides}
                  draft={draft}
                  errors={errors}
                  onChange={setValue}
                  live={live.data}
                  proposals={proposals}
                  onClose={deselect}
                />
              ) : (
                <InspectorEmpty />
              )}
            </aside>
          )}
        </div>
      )}

      {/* Mobile: read-only vertical list */}
      {isMobile && <MobileSteps live={live.data} overrides={overrides} onSelect={select} selectedId={selected?.id} />}

      {/* Bottom sheet below 1024px */}
      {!isWide && selected && (
        <div className="fixed inset-0 z-40 flex flex-col justify-end">
          <div className="absolute inset-0 bg-ink/25" onClick={deselect} aria-hidden />
          <div role="dialog" aria-modal="true" aria-label={`Detail langkah ${selected.n}`} className="relative max-h-[75vh] overflow-y-auto rounded-t-2xl bg-card shadow-[var(--shadow-float)]">
            <div className="mx-auto mt-2 h-1 w-10 rounded-full bg-line" aria-hidden />
            <Inspector
              key={selected.id}
              node={selected}
              editing={editing}
              canEdit={canEdit && !isMobile}
              overrides={overrides}
              draft={draft}
              errors={errors}
              onChange={setValue}
              live={live.data}
              proposals={proposals}
              onClose={deselect}
            />
          </div>
        </div>
      )}

      {version !== undefined && (
        <SubmitModal
          open={submitOpen}
          onClose={closeSubmit}
          changes={changes}
          baseVersion={version}
          onSubmitted={onSubmitted}
          onReload={wf.reload}
        />
      )}
      <HistoryModal open={historyOpen} onClose={closeHistory} proposals={proposals} />
    </div>
  );
}

function InspectorEmpty() {
  return (
    <div className="px-[18px] py-5">
      <h2 className="text-[15px] font-semibold">Pilih satu langkah</h2>
      <p className="mt-1 text-[13px] leading-5 text-muted">Klik kartu di kanvas untuk melihat siapa yang menjalankannya, batasnya, izinnya, dan riwayat perubahannya.</p>
      <div className="mt-5 flex flex-col gap-3 text-[13px] leading-5">
        <div><b className="font-medium text-muted">Otomatis</b> — dijalankan agent tanpa menunggu kamu.</div>
        <div><b className="font-medium text-ink">Manusia</b> — dikerjakan kamu.</div>
        <div><b className="font-medium text-warn">Gerbang</b> — alur berhenti sampai kamu memutuskan.</div>
        <div><b className="font-medium text-danger">Pengaman</b> — aturan tetap; tidak bisa dihapus atau dilewati.</div>
        <div className="flex items-center gap-1.5 text-muted"><Lock size={13} className="text-warn" aria-hidden /> Gembok = rel pengaman.</div>
      </div>
      <p className="mt-5 text-[12px] leading-[18px] text-muted">Perubahan selalu lewat draf dan proposal. Alur aktif tetap berjalan sampai Angga menerapkan perubahan yang kamu setujui.</p>
    </div>
  );
}

function MobileSteps({ live, overrides, onSelect, selectedId }: {
  live: LiveData | undefined;
  overrides: Record<string, string>;
  onSelect: (id: string) => void;
  selectedId?: string;
}) {
  return (
    <div className="min-h-0 flex-1 overflow-y-auto">
      <div className="mx-4 mt-4 flex items-center gap-2 rounded-xl border border-line bg-card px-3 py-2.5 text-[13px] text-ink-soft">
        <Monitor size={16} className="shrink-0 text-muted" aria-hidden />
        Buka di desktop untuk mengubah alur.
      </div>
      <ol className="flex flex-col gap-2 p-4">
        {salesWorkflow.nodes.map(node => {
          const host = currentValue(node, 'host', overrides);
          const status = nodeStatus(node, live);
          return (
            <li key={node.id}>
              <button
                type="button"
                aria-label={`Langkah ${node.n}: ${node.title}`}
                onClick={() => onSelect(node.id)}
                className={`flex w-full items-start gap-3 rounded-xl border bg-card p-3 text-left shadow-[var(--shadow-card)] ${selectedId === node.id ? 'border-accent' : 'border-line'}`}
              >
                <ExecutorIcon node={node} size={32} />
                <span className="min-w-0 flex-1">
                  <span className="flex items-start gap-1.5 text-[14px] font-semibold leading-5">
                    <span className="flex-1">{node.n}. {node.title}</span>
                    {node.locked && <Lock size={14} className="mt-0.5 shrink-0 text-warn" aria-label="Terkunci" />}
                  </span>
                  <span className="mt-0.5 block text-[12px] text-muted">
                    <span className={`font-medium ${typeMeta[node.type].className}`}>{typeMeta[node.type].label}</span>
                    {host && <> · {node.hostOptions?.find(o => o.value === host)?.label ?? hostLabel[host] ?? host}</>}
                  </span>
                  {status.length > 0 && <span className="mt-1.5 flex flex-wrap gap-1.5"><StatusPills pills={status} /></span>}
                </span>
              </button>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
