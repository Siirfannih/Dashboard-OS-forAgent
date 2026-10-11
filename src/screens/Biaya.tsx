import { Cpu, HardDrive, Info, Layers, MemoryStick, Server } from 'lucide-react';
import type { ReactNode } from 'react';
import { Card, DataAge, EmptyState, ErrorBanner, Overline, Pill, Skeleton } from '../components/ui';
import { agent } from '../config/workspace';
import { useResource } from '../lib/data';
import { ago, dateTime, usd } from '../lib/format';
import type { SystemStatus, UsageTotal, WorkBatch } from '../lib/types';

const UNKNOWN = 'Tidak diketahui';
const num = new Intl.NumberFormat('id-ID');

const budgetMeta: Record<string, { label: string; host: string; note: string }> = {
  deepseek: { label: 'DeepSeek · PC Worker', host: 'Bayar per pemakaian', note: 'Riset dan verifikasi malam di PC Worker.' },
  chatgpt: { label: 'ChatGPT · Server Utama', host: 'Langganan', note: 'Keputusan dan draf Candra di server.' },
  openai: { label: 'ChatGPT · Server Utama', host: 'Langganan', note: 'Keputusan dan draf Candra di server.' },
};

function humanize(kind: string): string {
  const words = kind.replace(/[_-]+/g, ' ').trim();
  return words ? words[0].toUpperCase() + words.slice(1) : kind;
}

function Unknown({ children = UNKNOWN }: { children?: ReactNode }) {
  return <Pill tone="unknown">{children}</Pill>;
}

export function BiayaPage(_props: { id?: string }) {
  const usage = useResource(s => s.usage(), [], 60_000);
  const batches = useResource(s => s.batches(), [], 60_000);
  const ops = useResource(async s => {
    const [state, jobs, worker] = await Promise.all([s.state(), s.jobs().catch(() => null), s.worker().catch(() => null)]);
    return { system: state.system ?? null, jobs, workerLast: worker?.last_activity_at ?? null };
  }, [], 60_000);

  return (
    <div className="min-w-0 flex-1 overflow-y-auto">
      <div className="mx-auto flex max-w-[1160px] flex-col gap-6 px-4 py-6 sm:px-7">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h1 className="font-display text-[28px] leading-9 font-semibold">Biaya & Kapasitas</h1>
            <p className="text-muted">Pemakaian model per anggaran, biaya per batch, dan sisa kapasitas server.</p>
          </div>
          <DataAge loadedAt={usage.loadedAt} />
        </div>

        <div className="flex items-start gap-2.5 rounded-xl border border-line bg-card px-4 py-3 text-[13px] leading-5 text-ink-soft">
          <Info size={16} className="mt-0.5 shrink-0 text-muted" aria-hidden />
          <p><b className="font-semibold text-ink">Prinsip:</b> dua anggaran terpisah, tidak dijumlahkan; angka yang tidak dikirim provider ditulis <Unknown />.</p>
        </div>

        <section aria-labelledby="budget-title" className="flex flex-col gap-3">
          <h2 id="budget-title" className="text-[16px] font-semibold">Anggaran model</h2>
          {usage.error && !usage.data && <ErrorBanner message={`Data pemakaian belum bisa dimuat. ${usage.error}`} onRetry={usage.reload} />}
          {!usage.data && !usage.error && <div className="grid grid-cols-1 gap-4 md:grid-cols-2"><Skeleton className="h-48" /><Skeleton className="h-48" /></div>}
          {usage.data && (Object.keys(usage.data).length === 0 ? (
            <Card><EmptyState icon={<Layers size={18} />} title="Belum ada pemakaian tercatat">Belum ada panggilan model yang dicatat. Ini bukan berarti tagihan nol — catatan baru muncul setelah agent bekerja.</EmptyState></Card>
          ) : (
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              {Object.entries(usage.data).map(([kind, total]) => <BudgetCard key={kind} kind={kind} total={total} />)}
            </div>
          ))}
        </section>

        <section aria-labelledby="batch-title" className="flex flex-col gap-3">
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <h2 id="batch-title" className="text-[16px] font-semibold">Biaya per batch</h2>
            <span className="text-[12px] text-muted">Dicadangkan = belum final; bisa turun saat tugas selesai.</span>
          </div>
          {batches.error && !batches.data && <ErrorBanner message={`Data batch belum bisa dimuat. ${batches.error}`} onRetry={batches.reload} />}
          {!batches.data && !batches.error && <Skeleton className="h-32" />}
          {batches.data && <BatchTable items={batches.data} />}
        </section>

        <section aria-labelledby="capacity-title" className="flex flex-col gap-3">
          <h2 id="capacity-title" className="text-[16px] font-semibold">Kapasitas</h2>
          {ops.error && !ops.data && <ErrorBanner message={`Status server belum bisa dimuat. ${ops.error}`} onRetry={ops.reload} />}
          {!ops.data && !ops.error && <div className="grid grid-cols-1 gap-4 md:grid-cols-2"><Skeleton className="h-44" /><Skeleton className="h-44" /></div>}
          {ops.data && <Capacity system={ops.data.system} jobs={ops.data.jobs?.items ?? null} workerLast={ops.data.workerLast} />}
        </section>
      </div>
    </div>
  );
}

/* ---------- Budgets ---------- */

function BudgetCard({ kind, total }: { kind: string; total: UsageTotal }) {
  const meta = budgetMeta[kind.toLowerCase()] ?? { label: humanize(kind), host: 'Anggaran terpisah', note: 'Tidak dijumlahkan dengan anggaran lain.' };
  const tokens = (v: number | null) => (v === null || v === undefined ? <Unknown /> : <span className="tabular">{num.format(v)}</span>);
  return (
    <Card className="flex flex-col p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <Overline>{meta.host}</Overline>
          <h3 className="text-[16px] font-semibold">{meta.label}</h3>
          <p className="text-[12px] leading-[18px] text-muted">{meta.note}</p>
        </div>
        <Server size={18} className="shrink-0 text-muted" aria-hidden />
      </div>
      <div className="mt-4">
        <div className="text-[12px] text-muted">Biaya tercatat</div>
        {total.cost_usd === null || total.cost_usd === undefined
          ? <div className="mt-1"><Unknown>Provider tidak mengirim biaya</Unknown></div>
          : <div className="tabular text-[32px] leading-10 font-medium">{usd(total.cost_usd)}</div>}
      </div>
      <dl className="mt-4 grid grid-cols-3 gap-3 border-t border-line-soft pt-3 text-[13px]">
        <div><dt className="text-[12px] text-muted">Panggilan</dt><dd className="tabular mt-0.5 font-medium">{num.format(total.calls)}</dd></div>
        <div><dt className="text-[12px] text-muted">Token masuk</dt><dd className="mt-0.5 font-medium">{tokens(total.input_tokens)}</dd></div>
        <div><dt className="text-[12px] text-muted">Token keluar</dt><dd className="mt-0.5 font-medium">{tokens(total.output_tokens)}</dd></div>
      </dl>
      {total.unknown_cost_calls > 0 && (
        <p className="mt-3 text-[12px] leading-[18px] text-warn">
          <span className="tabular font-semibold">{num.format(total.unknown_cost_calls)}</span> panggilan tanpa data biaya — totalnya bisa lebih besar dari yang tercatat.
        </p>
      )}
    </Card>
  );
}

/* ---------- Batches ---------- */

function BatchTable({ items }: { items: WorkBatch[] }) {
  if (!items.length) {
    return <Card><EmptyState icon={<Layers size={18} />} title="Belum ada batch">Batch riset muncul di sini setelah Candra membuatnya, lengkap dengan batas dan sisa biayanya.</EmptyState></Card>;
  }
  return (
    <Card className="overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[760px] text-left text-[13px]">
          <caption className="sr-only">Biaya per batch: batas, tercatat, dicadangkan, dan sisa</caption>
          <thead className="border-b border-line bg-surface text-[12px] text-muted">
            <tr>
              <th scope="col" className="px-4 py-2.5 font-medium">Batch</th>
              <th scope="col" className="px-4 py-2.5 font-medium">Item</th>
              <th scope="col" className="px-4 py-2.5 text-right font-medium">Batas</th>
              <th scope="col" className="px-4 py-2.5 text-right font-medium">Tercatat</th>
              <th scope="col" className="px-4 py-2.5 text-right font-medium">Dicadangkan <span className="font-normal">(belum final)</span></th>
              <th scope="col" className="px-4 py-2.5 font-medium">Sisa</th>
            </tr>
          </thead>
          <tbody>
            {items.map(b => {
              const cap = b.cap_usd > 0 ? b.cap_usd : null;
              const pct = (v: number) => (cap ? Math.min(100, Math.max(0, (v / cap) * 100)) : 0);
              return (
                <tr key={b.id} className="border-t border-line first:border-t-0">
                  <td className="px-4 py-3">
                    <div className="font-mono text-[12px] text-ink">{b.id}</div>
                    <div className="text-[12px] text-muted">{agent(b.head_agent).displayName} · {dateTime(b.created_at)}</div>
                  </td>
                  <td className="tabular px-4 py-3">{num.format(b.items)}<span className="text-muted"> / {num.format(b.max_items)}</span></td>
                  <td className="tabular px-4 py-3 text-right">{usd(b.cap_usd)}</td>
                  <td className="tabular px-4 py-3 text-right">{usd(b.known_cost_usd)}</td>
                  <td className="tabular px-4 py-3 text-right text-warn">{usd(b.reserved_usd)}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <span className="tabular w-[72px] shrink-0 font-medium">{usd(b.remaining_usd)}</span>
                      {cap ? (
                        <div
                          className="flex h-2 w-full min-w-[120px] overflow-hidden rounded-full bg-line-soft"
                          role="img"
                          aria-label={`Terpakai ${usd(b.known_cost_usd)}, dicadangkan ${usd(b.reserved_usd)}, sisa ${usd(b.remaining_usd)} dari ${usd(b.cap_usd)}`}
                        >
                          <span className="h-full bg-ink" style={{ width: `${pct(b.known_cost_usd)}%` }} />
                          <span className="h-full bg-warn/60" style={{ width: `${pct(b.reserved_usd)}%` }} />
                        </div>
                      ) : <Unknown>Tanpa batas</Unknown>}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <div className="flex flex-wrap gap-4 border-t border-line bg-surface px-4 py-2 text-[12px] text-muted">
        <span className="flex items-center gap-1.5"><span className="size-2 rounded-full bg-ink" aria-hidden />Tercatat</span>
        <span className="flex items-center gap-1.5"><span className="size-2 rounded-full bg-warn/60" aria-hidden />Dicadangkan</span>
        <span className="flex items-center gap-1.5"><span className="size-2 rounded-full border border-line bg-line-soft" aria-hidden />Sisa</span>
      </div>
    </Card>
  );
}

/* ---------- Capacity ---------- */

function Meter({ icon, label, free, total, unit, freeLabel }: { icon: ReactNode; label: string; free: number | null | undefined; total: number | null | undefined; unit: string; freeLabel: string }) {
  const known = free !== null && free !== undefined && total !== null && total !== undefined && total > 0;
  const fmt = (v: number) => `${v.toLocaleString('id-ID', { maximumFractionDigits: 1 })} ${unit}`;
  const usedPct = known ? Math.min(100, Math.max(0, ((total - free) / total) * 100)) : 0;
  return (
    <div>
      <div className="flex items-center justify-between gap-2 text-[13px]">
        <span className="flex items-center gap-2 text-ink-soft">{icon}{label}</span>
        {known ? <span className="tabular font-medium">{fmt(free)} {freeLabel} <span className="text-muted">/ {fmt(total)}</span></span> : <Unknown />}
      </div>
      {known && (
        <div className="mt-2 h-2 overflow-hidden rounded-full bg-line-soft" role="img" aria-label={`${Math.round(usedPct)}% terpakai`}>
          <div className={`h-full rounded-full ${usedPct > 85 ? 'bg-danger' : usedPct > 70 ? 'bg-warn' : 'bg-ok'}`} style={{ width: `${usedPct}%` }} />
        </div>
      )}
    </div>
  );
}

function Capacity({ system, jobs, workerLast }: { system: SystemStatus | null; jobs: { status: string }[] | null; workerLast: number | null }) {
  const memTotal = system?.memory?.total_mb;
  const memFree = system?.memory?.available_mb;
  const gb = (mb: number | null | undefined) => (mb === null || mb === undefined ? mb : mb / 1024);
  const queue = system?.queue;
  const pcQueued = jobs?.filter(j => j.status === 'queued').length;
  const pcRunning = jobs?.filter(j => ['claimed', 'running'].includes(j.status)).length;

  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
      <Card className="flex flex-col gap-4 p-5">
        <div className="flex items-start justify-between gap-3">
          <div>
            <Overline>Server Utama{system?.hostname ? ` · ${system.hostname}` : ''}</Overline>
            <h3 className="text-[16px] font-semibold">Ruang kerja server</h3>
          </div>
          <Server size={18} className="text-muted" aria-hidden />
        </div>
        <Meter icon={<MemoryStick size={15} aria-hidden />} label="Memori" free={gb(memFree)} total={gb(memTotal)} unit="GB" freeLabel="tersedia" />
        <Meter icon={<HardDrive size={15} aria-hidden />} label="Disk" free={system?.disk?.free_gb} total={system?.disk?.total_gb} unit="GB" freeLabel="kosong" />
        <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-2 border-t border-line-soft pt-3 text-[13px]">
          <dt className="text-muted">Mesin</dt>
          <dd className="min-w-0 break-words">{system?.runtime?.engine || <Unknown />}</dd>
          <dt className="text-muted">Model</dt>
          <dd className="min-w-0 break-words">{system?.runtime?.model || <Unknown />}</dd>
        </dl>
      </Card>

      <Card className="flex flex-col gap-4 p-5">
        <div className="flex items-start justify-between gap-3">
          <div>
            <Overline>Antrean</Overline>
            <h3 className="text-[16px] font-semibold">Pekerjaan yang menunggu</h3>
          </div>
          <Cpu size={18} className="text-muted" aria-hidden />
        </div>
        <dl className="grid grid-cols-2 gap-4">
          <QueueStat label="Server · menunggu" value={queue?.queued} />
          <QueueStat label="Server · berjalan" value={queue?.running} />
          <QueueStat label="Riset PC · menunggu" value={pcQueued} />
          <QueueStat label="Riset PC · berjalan" value={pcRunning} />
        </dl>
        <div className="flex flex-col gap-2 border-t border-line-soft pt-3 text-[13px]">
          <div className="flex items-center justify-between gap-2">
            <span className="text-muted">PC Worker</span>
            {workerLast
              ? <span>aktif terakhir {ago(workerLast)}</span>
              : <Unknown>Belum ada sinyal</Unknown>}
          </div>
          <div className="flex items-center justify-between gap-2">
            <span className="text-muted">Perkiraan selesai</span>
            <Unknown>Belum ada data laju</Unknown>
          </div>
        </div>
      </Card>
    </div>
  );
}

function QueueStat({ label, value }: { label: string; value: number | null | undefined }) {
  return (
    <div>
      <dt className="text-[12px] text-muted">{label}</dt>
      <dd className="mt-1">{value === null || value === undefined ? <Unknown /> : <span className="tabular text-[24px] leading-8 font-medium">{num.format(value)}</span>}</dd>
    </div>
  );
}
