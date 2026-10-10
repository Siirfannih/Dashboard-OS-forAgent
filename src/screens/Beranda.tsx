import { ArrowRight, Check, ChevronRight, CircleAlert, Hand, QrCode, SquareCheck, Wrench } from 'lucide-react';
import type { ReactNode } from 'react';
import { AgentAvatar, Button, Card, ErrorBanner, Overline, Pill, Skeleton, type Tone } from '../components/ui';
import { waLabel } from '../components/Shell';
import { workspace } from '../config/workspace';
import { useResource } from '../lib/data';
import { ago, ageHours, greeting, percent, today, toDate } from '../lib/format';
import { go, href } from '../lib/router';
import type { ActivityItem } from '../lib/types';
import { GUIDE_STEPS, type Guide } from './Onboarding';

export function BerandaPage({ guide, onOpenGuide }: { guide: Guide; onOpenGuide: () => void }) {
  const res = useResource(async s => {
    const [state, review, metrics, bridge, wa, jobs, held, worker] = await Promise.all([
      s.state().catch(() => null),
      s.review(),
      s.metrics().catch(() => null),
      s.bridge().catch(() => null),
      s.whatsapp().catch(() => null),
      s.jobs().catch(() => null),
      s.conversations('hold').catch(() => null),
      s.worker().catch(() => null),
    ]);
    return { state, review, metrics, bridge, wa, jobs, held, worker };
  }, [], 30_000);

  const d = res.data;
  const pending = d?.review.filter(r => ['draft', 'needs_revision'].includes(r.status)) ?? [];
  const oldest = pending.reduce<number | null>((min, r) => (min === null || r.created_at < min ? r.created_at : min), null);
  const expiringSoon = pending.filter(r => (ageHours(r.created_at) ?? 0) > 42).length;
  const jobs = d?.jobs?.items ?? [];
  const jobCount = (statuses: string[]) => jobs.filter(j => statuses.includes(j.status)).length;
  const blockedJobs = jobs.filter(j => ['blocked', 'needs_revision', 'abandoned_unknown'].includes(j.status));
  const holds = d?.held?.items ?? [];

  const tasks: { key: string; icon: ReactNode; title: string; meta: string; action: string; to: string; primary?: boolean }[] = [];
  if (pending.length) tasks.push({ key: 'review', icon: <AgentAvatar id="candra" />, title: `${pending.length} draf menunggu persetujuanmu`, meta: `Disusun Candra · tertua ${ago(oldest)}`, action: 'Tinjau', to: href('keputusan'), primary: true });
  for (const c of holds.slice(0, 3)) tasks.push({ key: c.id, icon: <span className="grid size-8 place-items-center rounded-full bg-warn-soft text-warn"><Hand size={15} /></span>, title: `${c.name} ditahan`, meta: c.hold_reason ?? 'Butuh jawabanmu', action: 'Buka percakapan', to: href('percakapan', c.id) });
  if (d?.wa && d.wa.state !== 'connected') tasks.push({ key: 'wa', icon: <span className="grid size-8 place-items-center rounded-full bg-danger-soft text-danger"><QrCode size={15} /></span>, title: `WhatsApp: ${waLabel[d.wa.state] ?? d.wa.state}`, meta: 'Pesan keluar ditahan sampai tersambung', action: 'Buka Kanal', to: href('kanal') });
  if (blockedJobs.length) tasks.push({ key: 'jobs', icon: <AgentAvatar id="research" />, title: `${blockedJobs.length} tugas riset perlu perhatian`, meta: 'Terblokir, perlu revisi, atau hasil tidak diketahui', action: 'Lihat', to: href('pipeline') });

  const candraFresh = d?.bridge ? d.bridge.candra_online : undefined;
  const workerLast = d?.worker?.last_activity_at
    ?? jobs.reduce<number | null>((max, j) => (j.worker_id && (max === null || j.updated_at > max) ? j.updated_at : max), null);

  return (
    <div className="min-w-0 flex-1 overflow-y-auto">
      <div className="mx-auto flex max-w-[1160px] flex-col gap-6 px-4 py-6 sm:px-7">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h1 className="font-display text-[28px] leading-9 font-semibold">{greeting()}</h1>
            <p className="text-muted">{today()} · {res.loading && !d ? 'memuat…' : tasks.length ? `${tasks.length} hal butuh kamu` : 'tidak ada yang butuh kamu sekarang'}</p>
          </div>
          <ScheduleStrip />
        </div>

        {res.error && !d && <ErrorBanner message={res.error} onRetry={res.reload} />}

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard label="Menunggu keputusanmu" loading={!d} onClick={() => go('keputusan')}
            value={pending.length} foot={pending.length ? <>Tertua {ago(oldest)}{expiringSoon ? <Pill tone="warn" dot>{expiringSoon} hampir kedaluwarsa</Pill> : null}</> : 'Semua draf sudah ditinjau'} />
          <StatCard label="Riset worker" loading={!d} onClick={() => go('pipeline')}
            value={jobCount(['accepted', 'submitted'])}
            suffix={jobs.length ? ` / ${jobs.length}` : undefined}
            foot={jobs.length ? <><span>{jobCount(['queued', 'claimed', 'running'])} berjalan/antre</span>{blockedJobs.length > 0 && <span className="text-danger">{blockedJobs.length} perlu perhatian</span>}</> : 'Belum ada batch riset'} />
          <StatCard label="Balasan prospek" loading={!d} onClick={() => go('percakapan')}
            value={d?.metrics ? percent(d.metrics.reply_rate) : '—'}
            foot={d?.metrics ? `${d.metrics.reply_rate.numerator} dari ${d.metrics.reply_rate.denominator} bisnis yang dikirimi` : 'Metrik belum tersedia'} />
          <Card className="p-5">
            <Overline>Kesehatan tim</Overline>
            <div className="mt-3 flex flex-col gap-1.5">
              <Health label="Candra" tone={candraFresh === undefined ? 'unknown' : candraFresh ? 'ok' : 'danger'} text={candraFresh === undefined ? 'tidak diketahui' : candraFresh ? 'aktif' : 'tidak aktif'} />
              <Health label="WhatsApp" tone={!d?.wa ? 'unknown' : d.wa.state === 'connected' ? 'ok' : 'danger'} text={d?.wa ? (waLabel[d.wa.state] ?? d.wa.state).toLowerCase() : 'tidak diketahui'} />
              <Health label="PC Worker" tone={workerLast && (ageHours(workerLast) ?? 99) < 20 ? 'ok' : 'unknown'} text={!workerLast ? 'belum ada sinyal' : (ageHours(workerLast) ?? 99) < 1 ? 'aktif' : (ageHours(workerLast) ?? 99) < 20 ? 'selesai semalam' : `terakhir ${ago(workerLast)}`} />
            </div>
          </Card>
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_340px]">
          <Card>
            <div className="flex items-center justify-between px-5 py-4">
              <h2 className="text-[16px] font-semibold">Butuh kamu</h2>
              <span className="text-[12px] text-muted">Satu klik per keputusan</span>
            </div>
            {!d && <div className="flex flex-col gap-3 px-5 pb-5"><Skeleton className="h-12" /><Skeleton className="h-12" /></div>}
            {d && tasks.length === 0 && (
              <div className="border-t border-line px-5 py-10 text-center">
                <div className="mx-auto mb-2 grid size-10 place-items-center rounded-full bg-ok-soft text-ok"><Check size={18} /></div>
                <div className="font-semibold">Semua beres</div>
                <p className="text-[13px] text-muted">Tidak ada yang butuh kamu sekarang. Tim akan memanggil kalau ada.</p>
              </div>
            )}
            {tasks.map(t => (
              <div key={t.key} className="flex items-center gap-3 border-t border-line px-5 py-3.5">
                {t.icon}
                <div className="min-w-0 flex-1">
                  <div className="truncate font-medium">{t.title}</div>
                  <div className="truncate text-[12px] leading-[18px] text-muted">{t.meta}</div>
                </div>
                <a href={t.to} className={`inline-flex h-9 shrink-0 items-center rounded-lg px-3.5 text-[13px] font-medium ${t.primary ? 'bg-ink text-white hover:bg-[#1F2937]' : 'border border-line hover:bg-surface'}`}>{t.action}</a>
              </div>
            ))}
          </Card>

          <div className="flex flex-col gap-6">
            {guide.progress < 100 && (
              <Card className="p-5">
                <div className="flex items-center justify-between"><h2 className="text-[16px] font-semibold">Mulai</h2><b className="tabular text-[20px]">{guide.progress}%</b></div>
                <ul className="mt-2">
                  {GUIDE_STEPS.map((s, i) => {
                    const done = guide.done.includes(s.key);
                    const nextUp = !done && GUIDE_STEPS.findIndex(x => !guide.done.includes(x.key)) === i;
                    return (
                      <li key={s.key}>
                        <button onClick={onOpenGuide} className="flex w-full items-center gap-3 border-t border-line py-3 text-left text-[14px] first:border-t-0">
                          <span className={`grid size-5 shrink-0 place-items-center rounded-full ${done ? 'bg-[#12B76A] text-white' : nextUp ? 'border-2 border-dashed border-[#F79009]' : 'border-2 border-dashed border-faint'}`}>
                            {done && <Check size={12} strokeWidth={3} />}
                          </span>
                          <span className={`flex-1 ${done ? 'text-muted' : ''}`}>{s.title}</span>
                          <ChevronRight size={16} className="text-faint" />
                        </button>
                      </li>
                    );
                  })}
                </ul>
                <div className="mt-2 text-right"><Button className="rounded-full" onClick={onOpenGuide}>Lanjutkan panduan</Button></div>
              </Card>
            )}
            <Card className="p-5">
              <Overline>Aktivitas</Overline>
              <h2 className="mb-4 text-[16px] font-semibold">Yang terjadi belakangan</h2>
              <Timeline items={d?.state?.activity?.slice(0, 6) ?? []} loading={!d} />
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({ label, value, suffix, foot, onClick, loading }: { label: string; value: ReactNode; suffix?: string; foot: ReactNode; onClick: () => void; loading?: boolean }) {
  return (
    <button onClick={onClick} className="group flex flex-col justify-between rounded-xl border border-line bg-card p-5 text-left shadow-[var(--shadow-card)] transition-colors hover:border-accent/40">
      <div>
        <Overline>{label}</Overline>
        {loading ? <Skeleton className="mt-3 h-9 w-16" /> : (
          <div className="tabular mt-2 text-[32px] leading-10 font-medium group-hover:text-accent">{value}{suffix && <span className="text-[16px] text-muted">{suffix}</span>}</div>
        )}
      </div>
      <div className="mt-3 flex flex-wrap items-center justify-between gap-2 border-t border-line-soft pt-3 text-[12px] text-muted">{foot}</div>
    </button>
  );
}

function Health({ label, tone, text }: { label: string; tone: Tone; text: string }) {
  return (
    <div className="flex items-center justify-between gap-2 text-[13px]">
      <span className="text-ink-soft">{label}</span>
      <Pill tone={tone} dot={tone !== 'unknown'}>{text}</Pill>
    </div>
  );
}

function ScheduleStrip() {
  const now = new Intl.DateTimeFormat('en-GB', { hour: '2-digit', minute: '2-digit', hour12: false, timeZone: workspace.timezone }).format(new Date());
  const inRange = (from: string, to: string) => (from <= to ? now >= from && now < to : now >= from || now < to);
  const active = workspace.schedule.find(s => inRange(s.from, s.to));
  return (
    <div className="flex items-center gap-2 rounded-full border border-line bg-card px-3 py-1 text-[12px] text-muted">
      <span className="size-1.5 rounded-full bg-warn" />
      <b className="font-semibold text-ink">{active ? active.label : 'Di luar jadwal'}</b>
      {active && <span className="tabular">{active.from}–{active.to} {workspace.timezoneLabel}</span>}
    </div>
  );
}

const activityIcon: Record<string, ReactNode> = {
  failure: <CircleAlert size={13} />, approval: <SquareCheck size={13} />, run: <Wrench size={13} />,
};

function Timeline({ items, loading }: { items: ActivityItem[]; loading: boolean }) {
  if (loading) return <div className="flex flex-col gap-3"><Skeleton className="h-10" /><Skeleton className="h-10" /></div>;
  if (!items.length) return <p className="text-[13px] text-muted">Belum ada aktivitas tercatat.</p>;
  return (
    <ol className="relative flex flex-col gap-4 pl-6 before:absolute before:bottom-2 before:left-[9px] before:top-2 before:w-px before:bg-line">
      {items.map(item => (
        <li key={item.id} className="relative">
          <span className={`absolute -left-6 top-0.5 grid size-[19px] place-items-center rounded-full ring-4 ring-white ${item.type === 'failure' ? 'bg-danger-soft text-danger' : 'bg-line-soft text-ink-soft'}`}>
            {activityIcon[item.type] ?? <ArrowRight size={12} />}
          </span>
          <div className="text-[13px] font-medium leading-[18px]">{item.title}</div>
          <div className="text-[12px] text-muted">{toDate(item.created_at) ? ago(item.created_at) : ''}{item.detail ? ` · ${item.detail}` : ''}</div>
        </li>
      ))}
    </ol>
  );
}
