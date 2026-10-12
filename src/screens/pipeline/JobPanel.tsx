import { X } from 'lucide-react';
import { useEffect, useRef, type ReactNode } from 'react';
import { AgentAvatar, IconButton, Overline, Pill } from '../../components/ui';
import { agent, workspace } from '../../config/workspace';
import { ago, clock, dateTime } from '../../lib/format';
import type { WorkJob } from '../../lib/types';
import { batchOf, info, payloadOf, prospectOf, stepLabel, summaryOf, taskOf } from './jobs';

const SHOWN = new Set(['prospect', 'name', 'business', 'prospect_name', 'task', 'job_type', 'type', 'batch_id', 'batch', 'domain', 'head_agent', 'worker_role', 'run_mode', 'idempotency_key']);

/** Read-only side panel for one research job. Escape or backdrop closes it. */
export function JobPanel({ job, onClose }: { job: WorkJob; onClose: () => void }) {
  const ref = useRef<HTMLDivElement>(null);
  const closeRef = useRef(onClose);
  closeRef.current = onClose;

  useEffect(() => {
    const previous = document.activeElement as HTMLElement | null;
    ref.current?.querySelector<HTMLElement>('button')?.focus();
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && closeRef.current();
    window.addEventListener('keydown', onKey);
    return () => { window.removeEventListener('keydown', onKey); previous?.focus(); };
  }, [job.id]);

  const p = payloadOf(job);
  const s = info(job.status);
  const step = stepLabel(job.checkpoint);
  const summary = summaryOf(job);
  const extra = Object.entries(p).filter(([k, v]) => !SHOWN.has(k) && v !== null && v !== undefined && v !== '');
  const head = agent(job.head_agent);
  const worker = agent(job.worker_role);

  return (
    <div className="fixed inset-0 z-[60] flex justify-end bg-ink/20" onMouseDown={e => e.target === e.currentTarget && onClose()}>
      <div ref={ref} role="dialog" aria-modal="true" aria-label={`Tugas ${prospectOf(p) ?? job.id}`} className="flex h-full w-full max-w-[440px] flex-col bg-card shadow-[var(--shadow-float)]">
        <div className="flex items-start gap-3 border-b border-line px-5 py-4">
          <div className="min-w-0 flex-1">
            <Overline>Tugas riset</Overline>
            <h2 className="text-[17px] leading-6 font-semibold break-words">{prospectOf(p) ?? 'Prospek tidak diketahui'}</h2>
            <div className="text-[13px] text-muted">{taskOf(p) ?? 'Jenis tugas tidak tercatat'}</div>
          </div>
          <IconButton label="Tutup panel" onClick={onClose}><X size={18} /></IconButton>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4">
          <div className="flex flex-wrap items-center gap-1.5">
            <Pill tone={s.tone} dot={s.tone !== 'unknown'}>{s.label}</Pill>
            {job.run_mode === 'review_only' && <Pill tone="busy">Uji</Pill>}
            {job.attempt > 1 && <Pill tone="warn">Percobaan ke-{job.attempt}</Pill>}
          </div>
          <p className="mt-3 text-[14px] text-ink-soft">{s.explain}</p>

          {job.error && (
            <Block title="Penyebab" tone="danger">{job.error}</Block>
          )}
          {summary && (
            <div className="mt-4 rounded-lg border border-line bg-surface px-3 py-2.5 text-[13px]">
              <div className="font-semibold">Ringkasan hasil worker</div>
              <div className="mt-0.5 break-words text-ink-soft">{summary}</div>
            </div>
          )}
          {job.feedback && (
            <Block title="Catatan Candra untuk worker" tone="warn">{job.feedback}</Block>
          )}

          <dl className="mt-5 grid grid-cols-[minmax(0,140px)_1fr] gap-x-3 gap-y-2.5 text-[13px]">
            <Row label="Langkah terakhir">{step ?? <span className="text-muted">Belum ada</span>}</Row>
            <Row label="Batas waktu klaim">{job.lease_expiry ? `Diklaim sampai ${clock(job.lease_expiry)} ${workspace.timezoneLabel}` : <span className="text-muted">Tidak sedang diklaim</span>}</Row>
            <Row label="Worker">{job.worker_id ?? <span className="text-muted">Belum diambil</span>}</Row>
            <Row label="Dikerjakan oleh">
              <span className="inline-flex items-center gap-1.5"><AgentAvatar id={job.worker_role} size={20} />{worker.displayName}</span>
            </Row>
            <Row label="Dinilai oleh">
              <span className="inline-flex items-center gap-1.5"><AgentAvatar id={job.head_agent} size={20} />{head.displayName}</span>
            </Row>
            <Row label="Batch">{batchOf(p) ?? <span className="text-muted">Tidak tercatat</span>}</Row>
            <Row label="Revisi hasil">{job.revision}</Row>
            <Row label="Dibuat">{dateTime(job.created_at)}</Row>
            <Row label="Diperbarui">{dateTime(job.updated_at)} · {ago(job.updated_at)}</Row>
          </dl>

          {extra.length > 0 && (
            <details className="mt-5 rounded-lg border border-line">
              <summary className="cursor-pointer px-3 py-2 text-[13px] font-medium text-ink-soft hover:bg-surface">Detail lain dari tugas</summary>
              <dl className="grid grid-cols-[minmax(0,140px)_1fr] gap-x-3 gap-y-2 border-t border-line px-3 py-3 text-[12px]">
                {extra.map(([k, v]) => (
                  <Row key={k} label={k}><span className="font-mono break-all">{typeof v === 'string' ? v : JSON.stringify(v)}</span></Row>
                ))}
              </dl>
            </details>
          )}
          <p className="mt-5 text-[12px] text-muted">ID tugas <span className="font-mono">{job.id}</span>. Halaman ini hanya untuk melihat — Candra yang menilai hasil dan meminta revisi.</p>
        </div>
      </div>
    </div>
  );
}

function Row({ label, children }: { label: string; children: ReactNode }) {
  return (
    <>
      <dt className="text-muted">{label}</dt>
      <dd className="min-w-0 break-words">{children}</dd>
    </>
  );
}

function Block({ title, tone, children }: { title: string; tone: 'danger' | 'warn'; children: ReactNode }) {
  const cls = tone === 'danger' ? 'border-danger/20 bg-danger-soft text-danger' : 'border-warn-line bg-warn-soft text-warn';
  return (
    <div className={`mt-4 rounded-lg border px-3 py-2.5 text-[13px] ${cls}`}>
      <div className="font-semibold">{title}</div>
      <div className="mt-0.5 break-words">{children}</div>
    </div>
  );
}
