import { CircleAlert, Clock, Link2, PauseCircle, PlayCircle, RefreshCw, ShieldCheck, Smartphone, Wrench } from 'lucide-react';
import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { AgentAvatar, Button, Card, DataAge, ErrorBanner, Overline, Pill, Skeleton, type Tone } from '../components/ui';
import { waLabel } from '../components/Shell';
import { workspace } from '../config/workspace';
import { useResource } from '../lib/data';
import { ago, maskPhone, toDate } from '../lib/format';
import { href } from '../lib/router';
import type { BridgeStatus, WaState, WhatsAppLink } from '../lib/types';
import { encodeQr, qrPath } from './kanal/qr';

const stateTone: Record<WaState, Tone> = {
  connected: 'ok', waiting_qr: 'danger', disconnected: 'danger', starting: 'busy', logged_out: 'danger', error: 'danger', not_running: 'danger',
};

const stateHelp: Record<WaState, string> = {
  connected: 'Pesan bisa keluar dan masuk lewat nomor ini.',
  waiting_qr: 'Sesi belum tertaut. Pesan keluar ditahan di antrean, tidak hilang. Scan QR dari HP nomor pengirim.',
  disconnected: 'Sesi terputus. Pesan keluar ditahan di antrean, tidak hilang. Bridge mencoba menyambung ulang.',
  starting: 'Bridge sedang menyambung ke WhatsApp. Tunggu sebentar.',
  logged_out: 'Perangkat tertaut dilepas dari HP. Perlu scan ulang setelah bridge menyiapkan QR baru.',
  error: 'Bridge melaporkan galat. Pesan keluar ditahan di antrean. Minta Angga (Teknisi) memeriksa.',
  not_running: 'Bridge tidak mengirim status. Pesan keluar ditahan di antrean. Minta Angga (Teknisi) memeriksa.',
};

/** "6281234567890:12@s.whatsapp.net" → "+62 812-•••-7890". */
function maskAccount(account: string | null): string {
  if (!account) return '—';
  return maskPhone(account.split(/[:@]/)[0]);
}

export function KanalPage(_props: { id?: string }) {
  const wa = useResource(s => s.whatsapp(), [], 10_000);
  const bridge = useResource(s => s.bridge(), [], 10_000);
  const link = wa.data;
  const profileA = workspace.senderProfiles.irfan ?? 'Profil A';
  const profileB = workspace.senderProfiles.candra ?? 'Profil B';

  return (
    <div className="min-w-0 flex-1 overflow-y-auto">
      <div className="mx-auto flex max-w-[1160px] flex-col gap-6 px-4 py-6 sm:px-7">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div className="min-w-0">
            <h1 className="font-display text-[28px] leading-9 font-semibold">Kanal WhatsApp</h1>
            <p className="text-muted">Nomor pengirim yang dipakai Candra, tertaut ke server lewat sesi QR.</p>
          </div>
          <div className="flex items-center gap-2">
            <DataAge loadedAt={wa.loadedAt} />
            <Button size="sm" icon={<RefreshCw size={14} />} onClick={() => { void wa.reload(); void bridge.reload(); }}>Periksa sekarang</Button>
          </div>
        </div>

        {wa.error && <ErrorBanner message={`Status WhatsApp belum bisa dimuat. ${wa.error}`} onRetry={wa.reload} />}

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <ProfileCard name={profileA} link={link} loading={wa.loading && !link} failed={!!wa.error && !link} />
          <Card className="p-5">
            <div className="flex items-start gap-3">
              <span className="grid size-10 shrink-0 place-items-center rounded-full bg-line-soft text-muted"><Smartphone size={18} /></span>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <h2 className="text-[16px] font-semibold">{profileB}</h2>
                  <Pill tone="gray">Belum disiapkan</Pill>
                </div>
                <p className="mt-1 text-[13px] text-muted">Nomor kedua belum punya bridge sendiri. Semua pesan keluar memakai {profileA} sampai {profileB} disiapkan oleh Teknisi.</p>
              </div>
            </div>
          </Card>
        </div>

        {link?.state === 'waiting_qr' && <QrPanel link={link} profile={profileA} />}

        <section aria-labelledby="kanal-ops" className="flex flex-col gap-3">
          <h2 id="kanal-ops" className="text-[16px] font-semibold">Pengiriman & kesehatan</h2>
          {bridge.error && !bridge.data && <ErrorBanner message={`Status bridge belum bisa dimuat. ${bridge.error}`} onRetry={bridge.reload} />}
          <BridgeCards bridge={bridge.data} loading={bridge.loading && !bridge.data} />
        </section>

        <Card className="flex items-start gap-3 p-4">
          <ShieldCheck size={18} className="mt-0.5 shrink-0 text-ok" />
          <p className="text-[13px] text-ink-soft">
            <b className="font-semibold text-ink">Batas kirim harian, jeda antarpesan, dan jam kirim dijaga oleh Candra.</b>{' '}
            Halaman ini hanya menampilkan status sesi; tidak ada kontrol untuk melewati batas tersebut.
          </p>
        </Card>
      </div>
    </div>
  );
}

function ProfileCard({ name, link, loading, failed }: { name: string; link: WhatsAppLink | undefined; loading: boolean; failed: boolean }) {
  if (loading) {
    return <Card className="p-5"><Skeleton className="h-5 w-32" /><Skeleton className="mt-3 h-4 w-full" /><Skeleton className="mt-2 h-4 w-2/3" /></Card>;
  }
  const state = link?.state;
  const updated = link?.updated_at ?? null;
  const staleMin = updated ? (Date.now() / 1000 - updated) / 60 : null;
  return (
    <Card className="p-5">
      <div className="flex items-start gap-3">
        <span className="grid size-10 shrink-0 place-items-center rounded-full text-white" style={{ background: '#25D366' }} aria-hidden>
          <Smartphone size={18} />
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 className="text-[16px] font-semibold">{name}</h2>
            {state ? (
              <Pill tone={stateTone[state] ?? 'unknown'} dot>{waLabel[state] ?? state}</Pill>
            ) : (
              <Pill tone="unknown">Tidak diketahui</Pill>
            )}
          </div>
          <dl className="mt-2 grid grid-cols-[auto_1fr] gap-x-3 gap-y-1 text-[13px]">
            <dt className="text-muted">Nomor</dt>
            <dd className="tabular min-w-0 truncate">{state === 'connected' ? maskAccount(link?.account ?? null) : 'Tampil setelah tersambung'}</dd>
            <dt className="text-muted">Sinyal</dt>
            <dd>{updated ? `diperbarui ${ago(updated)}` : 'belum ada sinyal'}</dd>
          </dl>
          <p className="mt-3 text-[13px] text-ink-soft">
            {failed || !state ? 'Status sesi tidak diketahui karena data belum bisa dimuat.' : stateHelp[state]}
          </p>
          {staleMin !== null && staleMin > 15 && state !== 'waiting_qr' && (
            <p className="mt-2 flex items-center gap-1.5 text-[12px] text-warn"><Clock size={13} /> Status belum diperbarui {Math.round(staleMin)} menit — kondisi sebenarnya bisa sudah berubah.</p>
          )}
          {state && ['error', 'not_running', 'disconnected', 'logged_out'].includes(state) && (
            <a href={href('ruang-tim')} className="mt-3 inline-flex h-8 items-center gap-1.5 rounded-lg border border-line px-3 text-[13px] font-medium hover:bg-surface">
              <Wrench size={14} /> Minta Angga memeriksa
            </a>
          )}
        </div>
      </div>
    </Card>
  );
}

function QrPanel({ link, profile }: { link: WhatsAppLink; profile: string }) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const t = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(t);
  }, []);
  const qr = useMemo(() => {
    if (!link.qr) return null;
    try { return encodeQr(link.qr, 'M'); } catch { return null; }
  }, [link.qr]);
  const generated = toDate(link.updated_at);
  const age = generated ? Math.max(0, Math.round((now - generated.valueOf()) / 1000)) : null;
  const dim = qr ? qr.size + 8 : 0;

  return (
    <Card className="overflow-hidden">
      <div className="grid grid-cols-1 gap-6 p-5 md:grid-cols-[auto_1fr] md:p-6">
        <div className="flex flex-col items-center gap-2">
          {qr ? (
            <svg
              viewBox={`0 0 ${dim} ${dim}`}
              className="size-[min(272px,calc(100vw-80px))] rounded-xl border border-line bg-white"
              role="img"
              aria-label={`Kode QR untuk menautkan ${profile}`}
              shapeRendering="crispEdges"
            >
              <rect width={dim} height={dim} fill="#FFFFFF" />
              <path d={qrPath(qr)} fill="#111827" />
            </svg>
          ) : (
            <div className="grid size-[min(272px,calc(100vw-80px))] place-items-center rounded-xl border border-dashed border-line bg-surface p-6 text-center text-[13px] text-muted">
              {link.qr ? 'QR tidak bisa ditampilkan. Muat ulang halaman.' : 'Menunggu QR baru dari bridge…'}
            </div>
          )}
          <span className="flex items-center gap-1.5 text-[12px] text-muted">
            <RefreshCw size={12} />
            {link.qr && age !== null ? `QR dibuat ${age} dtk lalu · diganti otomatis` : 'Diperiksa otomatis setiap 10 detik'}
          </span>
        </div>
        <div className="min-w-0">
          <Overline>Tautkan {profile}</Overline>
          <h2 className="mt-1 text-[18px] font-semibold">Scan QR dari HP nomor pengirim</h2>
          <ol className="mt-4 flex flex-col gap-3">
            {[
              <>Buka <b>WhatsApp</b> di HP nomor pengirim.</>,
              <>Ketuk <b>Perangkat tertaut</b> (menu ⋮ di Android, Pengaturan di iPhone).</>,
              <>Ketuk <b>Tautkan perangkat</b>, lalu arahkan kamera ke QR ini.</>,
            ].map((step, i) => (
              <li key={i} className="flex items-start gap-3 text-[14px]">
                <span className="tabular grid size-6 shrink-0 place-items-center rounded-full bg-accent-soft text-[12px] font-semibold text-accent">{i + 1}</span>
                <span className="pt-0.5">{step}</span>
              </li>
            ))}
          </ol>
          <div className="mt-5 flex flex-col gap-2">
            <p className="flex items-start gap-2 rounded-lg border border-warn-line bg-warn-soft px-3 py-2 text-[13px] text-warn">
              <Link2 size={15} className="mt-0.5 shrink-0" />
              <span>Setelah di-scan, nomor ini tertaut ke server Jadisatu sebagai perangkat. Candra memakai sesi ini untuk mengirim pesan yang sudah kamu setujui.</span>
            </p>
            <p className="flex items-start gap-2 text-[13px] text-ink-soft">
              <CircleAlert size={15} className="mt-0.5 shrink-0 text-muted" />
              <span>QR kedaluwarsa dalam hitungan detik dan diganti otomatis di halaman ini. Jangan memotret atau membagikan QR ini.</span>
            </p>
          </div>
        </div>
      </div>
    </Card>
  );
}

function BridgeCards({ bridge, loading }: { bridge: BridgeStatus | undefined; loading: boolean }) {
  if (loading) {
    return <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">{[0, 1, 2].map(i => <Skeleton key={i} className="h-24" />)}</div>;
  }
  const healthStatus = bridge?.health?.status;
  const healthError = bridge?.health?.error;
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
      <OpsCard
        icon={bridge?.paused ? <PauseCircle size={18} /> : <PlayCircle size={18} />}
        label="Pengiriman"
        pill={bridge === undefined ? <Pill tone="unknown">Tidak diketahui</Pill> : bridge.paused ? <Pill tone="warn" dot>Dijeda</Pill> : <Pill tone="ok" dot>Berjalan</Pill>}
      >
        {bridge === undefined ? 'Status jeda belum bisa dibaca.' : bridge.paused ? 'Pengiriman dijeda — tidak ada pesan keluar sampai dilanjutkan.' : 'Pesan yang sudah disetujui dikirim sesuai jam dan jeda kirim.'}
      </OpsCard>
      <OpsCard
        icon={<AgentAvatar id="candra" size={22} />}
        label="Candra menyusun draf"
        pill={bridge === undefined ? <Pill tone="unknown">Tidak diketahui</Pill> : bridge.candra_online ? <Pill tone="ok" dot>Aktif</Pill> : <Pill tone="danger" dot>Tidak aktif</Pill>}
      >
        {bridge?.last_tick_at ? `Detak terakhir ${ago(bridge.last_tick_at)}.` : 'Belum ada detak tercatat.'}
        {bridge?.last_error ? <span className="mt-1 block text-danger">Galat terakhir: {bridge.last_error}</span> : null}
      </OpsCard>
      <OpsCard
        icon={<ShieldCheck size={18} />}
        label="Kesehatan bridge"
        pill={
          bridge === undefined || (!healthStatus && !healthError) ? <Pill tone="unknown">Tidak diketahui</Pill>
            : healthError ? <Pill tone="danger" dot>Galat</Pill>
            : healthStatus === 'connected' || healthStatus === 'ok' ? <Pill tone="ok" dot>{waLabel[healthStatus] ?? 'Sehat'}</Pill>
            : <Pill tone="warn" dot>{waLabel[healthStatus ?? ''] ?? healthStatus}</Pill>
        }
      >
        {bridge && !bridge.configured ? 'Bridge belum dikonfigurasi di server.' : healthError ? `Bridge tidak menjawab: ${healthError}` : healthStatus ? 'Dilaporkan langsung oleh bridge.' : 'Bridge belum melaporkan kesehatannya.'}
        {bridge && bridge.dropped_inbound > 0 && <span className="mt-1 block text-warn">{bridge.dropped_inbound} pesan masuk tidak tercatat.</span>}
      </OpsCard>
    </div>
  );
}

function OpsCard({ icon, label, pill, children }: { icon: ReactNode; label: string; pill: ReactNode; children: ReactNode }) {
  return (
    <Card className="flex flex-col gap-2 p-4">
      <div className="flex items-center justify-between gap-2">
        <span className="flex min-w-0 items-center gap-2 text-[13px] font-semibold"><span className="shrink-0 text-muted">{icon}</span><span className="truncate">{label}</span></span>
        {pill}
      </div>
      <p className="text-[13px] text-ink-soft">{children}</p>
    </Card>
  );
}
