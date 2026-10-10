import { CircleAlert, Clock, Moon } from 'lucide-react';
import { useMemo } from 'react';
import { Card, DataAge, EmptyState, ErrorBanner, Overline, Pill, Skeleton } from '../components/ui';
import { useResource } from '../lib/data';
import { ago, clock, usd } from '../lib/format';
import { go } from '../lib/router';
import { FUNNEL, type Stage, type WorkBatch, type WorkJob } from '../lib/types';
import { JobPanel } from './pipeline/JobPanel';
import { COLUMNS, KNOWN_STATUSES, info, payloadOf, prospectOf, researchWindow, stageLabel, stepLabel, taskOf, type Column } from './pipeline/jobs';

export function PipelinePage({ id }: { id?: string }) {
  const res = useResource(async s => {
    const [jobs, batches, prospects] = await Promise.all([
      s.jobs(),
      s.batches().catch(() => null),
      s.conversations('prospects').catch(() => null),
    ]);
    return { jobs: jobs.items ?? [], batches, prospects };
  }, [], 30_000);

  const d = res.data;
  const jobs = d?.jobs ?? [];
  const columns = useMemo(() => {
    const cols: (Column & { jobs: WorkJob[] })[] = COLUMNS.map(c => ({ ...c, jobs: jobs.filter(j => c.statuses.includes(j.status)) }));
    const other = jobs.filter(j => !KNOWN_STATUSES.includes(j.status));
    if (other.length) cols.push({ key: 'other', title: 'Lainnya', statuses: [], hint: 'Dibatalkan, ditahan, atau status lain', jobs: other });
    for (const c of cols) c.jobs.sort((a, b) => b.updated_at - a.updated_at);
    return cols;
  }, [jobs]);
  const selected = id ? jobs.find(j => j.id === id) : undefined;
  const attention = columns[0]?.jobs.length ?? 0;

  return (
    <div className="min-w-0 flex-1 overflow-y-auto">
      <div className="mx-auto flex max-w-[1400px] flex-col gap-6 px-4 py-6 sm:px-7">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h1 className="font-display text-[28px] leading-9 font-semibold">Pipeline</h1>
            <p className="text-muted">
              {!d ? 'Memuat riset…' : jobs.length ? `${jobs.length} tugas riset${attention ? ` · ${attention} perlu perhatian` : ''}` : 'Belum ada tugas riset'}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-line bg-card px-3 py-1 text-[12px] text-muted"><Moon size={13} aria-hidden />Riset malam {researchWindow}</span>
            <DataAge loadedAt={res.loadedAt} />
          </div>
        </div>

        {res.error && <ErrorBanner message={d ? `Data mungkin usang: ${res.error}` : res.error} onRetry={res.reload} />}

        <section aria-labelledby="batch-h">
          <h2 id="batch-h" className="sr-only">Batch riset</h2>
          {!d ? (
            <Skeleton className="h-[132px]" />
          ) : d.batches === null ? (
            <Card className="flex items-center gap-2 p-4 text-[13px]"><Pill tone="unknown">Tidak diketahui</Pill><span className="text-muted">Data batch tidak bisa dimuat. Biaya dan kapasitas batch belum bisa ditampilkan.</span></Card>
          ) : d.batches.length === 0 ? (
            <Card className="p-4 text-[13px] text-muted">Belum ada batch riset. Candra membuat batch sebelum riset malam dimulai.</Card>
          ) : (
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
              {[...d.batches].sort((a, b) => b.created_at - a.created_at).map(b => <BatchCard key={b.id} batch={b} />)}
            </div>
          )}
        </section>

        <Funnel loading={!d} stages={d?.prospects?.items.map(c => c.stage) ?? null} />

        <section aria-labelledby="kanban-h">
          <div className="mb-3 flex flex-wrap items-baseline justify-between gap-2">
            <h2 id="kanban-h" className="text-[16px] font-semibold">Tugas PC Worker</h2>
            <span className="text-[12px] text-muted">Hanya lihat · klik kartu untuk detail</span>
          </div>
          {!d && (
            <div className="flex gap-3 overflow-hidden">{[0, 1, 2, 3].map(i => <Skeleton key={i} className="h-64 w-[260px] shrink-0" />)}</div>
          )}
          {d && jobs.length === 0 && (
            <Card>
              <EmptyState icon={<Moon size={20} />} title="Belum ada tugas riset">
                PC Worker meriset prospek setiap malam ({researchWindow}). Tugas muncul di sini setelah Candra membuat batch, lalu hasilnya dinilai sebelum pagi.
              </EmptyState>
            </Card>
          )}
          {d && jobs.length > 0 && (
            <div className="-mx-4 overflow-x-auto px-4 pb-2 sm:-mx-7 sm:px-7" role="region" aria-label="Papan tugas" tabIndex={0}>
              <div className="flex min-w-max gap-3">
                {columns.map(c => <KanbanColumn key={c.key} column={c} jobs={c.jobs} activeId={id} />)}
              </div>
            </div>
          )}
        </section>
      </div>

      {selected && <JobPanel job={selected} onClose={() => go('pipeline')} />}
      {d && id && !selected && (
        <div role="status" className="fixed bottom-4 left-1/2 z-[60] w-[min(420px,calc(100vw-32px))] -translate-x-1/2 rounded-xl border border-line bg-card px-4 py-3 text-[13px] shadow-[var(--shadow-float)]">
          Tugas ini tidak ditemukan lagi di daftar.{' '}
          <button onClick={() => go('pipeline')} className="font-medium text-accent hover:underline">Tutup</button>
        </div>
      )}
    </div>
  );
}

function BatchCard({ batch }: { batch: WorkBatch }) {
  const cap = batch.cap_usd;
  const known = batch.known_cost_usd;
  const reserved = batch.reserved_usd;
  const pct = (v: number | null | undefined) => (cap && v !== null && v !== undefined ? Math.min(100, Math.max(0, (v / cap) * 100)) : 0);
  const capKnown = cap !== null && cap !== undefined;
  return (
    <Card className="p-5">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <Overline>Batch</Overline>
          <div className="truncate font-mono text-[13px]" title={batch.id}>{batch.id}</div>
        </div>
        <span className="shrink-0 text-[12px] text-muted">dibuat {ago(batch.created_at)}</span>
      </div>
      <div className="mt-2 text-[14px]">
        <b className="tabular text-[22px] font-medium">{batch.items}</b>
        <span className="text-muted"> tugas · maks {batch.max_items} prospek</span>
      </div>
      <div className="mt-3 flex h-2 overflow-hidden rounded-full bg-line-soft" aria-hidden>
        <div className="bg-ink" style={{ width: `${pct(known)}%` }} />
        <div className="bg-faint" style={{ width: `${pct(reserved)}%` }} />
      </div>
      <dl className="mt-3 flex flex-col gap-1 text-[12px]">
        <Money label="Batas biaya" value={cap} />
        <Money label="Sudah terpakai" value={known} dot="bg-ink" />
        <Money label="Dicadangkan" value={reserved} dot="bg-faint" />
        <Money label="Sisa" value={batch.remaining_usd} />
      </dl>
      {!capKnown && <p className="mt-2 text-[12px] text-muted">Batas biaya tidak tercatat — persentase tidak ditampilkan.</p>}
    </Card>
  );
}

function Money({ label, value, dot }: { label: string; value: number | null | undefined; dot?: string }) {
  const unknown = value === null || value === undefined;
  return (
    <div className="flex items-center justify-between gap-2">
      <dt className="flex items-center gap-1.5 text-muted">{dot && <span className={`size-2 rounded-full ${dot}`} aria-hidden />}{label}</dt>
      <dd className="tabular font-medium">{unknown ? <Pill tone="unknown">Tidak diketahui</Pill> : usd(value)}</dd>
    </div>
  );
}

function Funnel({ loading, stages }: { loading: boolean; stages: Stage[] | null }) {
  const counts = useMemo(() => {
    const m = new Map<Stage, number>();
    for (const s of stages ?? []) m.set(s, (m.get(s) ?? 0) + 1);
    return m;
  }, [stages]);
  return (
    <section aria-labelledby="funnel-h">
      <div className="mb-3 flex flex-wrap items-baseline justify-between gap-2">
        <h2 id="funnel-h" className="text-[16px] font-semibold">Posisi prospek saat ini</h2>
        <span className="text-[12px] text-muted">Jumlah prospek yang sekarang berada di tiap tahap</span>
      </div>
      {loading ? <Skeleton className="h-[76px]" /> : stages === null ? (
        <Card className="flex items-center gap-2 p-4 text-[13px]"><Pill tone="unknown">Tidak diketahui</Pill><span className="text-muted">Data percakapan prospek tidak bisa dimuat.</span></Card>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-line bg-card shadow-[var(--shadow-card)]" role="region" aria-label="Tahap penjualan" tabIndex={0}>
          <ol className="grid w-full min-w-[1056px] grid-cols-[repeat(11,minmax(0,1fr))]">
            {FUNNEL.map((stage, i) => {
              const n = counts.get(stage) ?? 0;
              return (
                <li key={stage} className={`px-3 py-3 ${i ? 'border-l border-line-soft' : ''}`}>
                  <div className={`tabular text-[22px] leading-7 font-medium ${n ? 'text-ink' : 'text-muted'}`}>{n}</div>
                  <div className="text-[12px] leading-4 text-muted">{stageLabel[stage]}</div>
                </li>
              );
            })}
          </ol>
        </div>
      )}
    </section>
  );
}

function KanbanColumn({ column, jobs, activeId }: { column: Column; jobs: WorkJob[]; activeId?: string }) {
  const attention = column.attention;
  return (
    <div className={`flex w-[272px] shrink-0 flex-col rounded-xl border ${attention ? 'border-danger/20 bg-danger-soft' : 'border-line bg-line-soft'}`}>
      <div className="px-3 pt-3 pb-2">
        <div className="flex items-center justify-between gap-2">
          <h3 className={`flex items-center gap-1.5 text-[13px] font-semibold ${attention ? 'text-danger' : ''}`}>
            {attention && <CircleAlert size={14} aria-hidden />}{column.title}
          </h3>
          <span className="tabular rounded-full bg-card px-2 text-[12px] font-medium text-ink-soft">{jobs.length}</span>
        </div>
        <p className="text-[12px] leading-4 text-muted">{column.hint}</p>
      </div>
      <ul className="flex flex-col gap-2 px-2 pb-2">
        {jobs.length === 0 && <li className="rounded-lg border border-dashed border-line px-3 py-4 text-center text-[12px] text-muted">{attention ? 'Tidak ada masalah' : 'Kosong'}</li>}
        {jobs.map(j => <li key={j.id}><JobCard job={j} active={j.id === activeId} /></li>)}
      </ul>
    </div>
  );
}

function JobCard({ job, active }: { job: WorkJob; active: boolean }) {
  const p = payloadOf(job);
  const s = info(job.status);
  const step = stepLabel(job.checkpoint);
  return (
    <button
      onClick={() => go('pipeline', job.id)}
      aria-current={active ? 'true' : undefined}
      className={`w-full rounded-lg border bg-card p-3 text-left shadow-[var(--shadow-card)] transition-colors hover:border-accent/40 ${active ? 'border-accent' : 'border-line'}`}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 truncate text-[14px] font-medium">{prospectOf(p) ?? 'Prospek tidak diketahui'}</div>
        {job.run_mode === 'review_only' && <Pill tone="busy">Uji</Pill>}
      </div>
      <div className="truncate text-[12px] leading-[18px] text-muted">{taskOf(p) ?? job.worker_role}</div>
      <div className="mt-2 flex flex-wrap gap-1">
        <Pill tone={s.tone} dot={s.tone !== 'unknown'}>{s.label}</Pill>
        {job.attempt > 1 && <Pill tone="warn">Percobaan ke-{job.attempt}</Pill>}
      </div>
      {job.error && <p className="mt-2 line-clamp-2 text-[12px] leading-4 text-danger">{job.error}</p>}
      {!job.error && job.feedback && <p className="mt-2 line-clamp-2 text-[12px] leading-4 text-warn">{job.feedback}</p>}
      <div className="mt-2 flex flex-wrap gap-x-2 gap-y-0.5 text-[12px] leading-4 text-muted">
        <span>{job.worker_id ?? 'belum diambil worker'}</span>
        {job.lease_expiry && <span className="inline-flex items-center gap-1"><Clock size={11} aria-hidden />diklaim sampai {clock(job.lease_expiry)}</span>}
        {step && <span>· {step}</span>}
        <span>· {ago(job.updated_at)}</span>
      </div>
    </button>
  );
}
