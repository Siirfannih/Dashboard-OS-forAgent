import { ArrowRight, BookOpen, Check, Clock, Lock, QrCode, ShieldCheck, SquareCheck, Users } from 'lucide-react';
import { useCallback, useEffect, useState, type ReactNode } from 'react';
import { AgentAvatar, Button, Pill } from '../components/ui';
import { workspace } from '../config/workspace';
import { href, type Page } from '../lib/router';

const STORE_KEY = 'jadisatu.guide';

export interface GuideStep { key: string; title: string; short: string; long: string; icon: ReactNode; page: Page; cta: string }

export const GUIDE_STEPS: GuideStep[] = [
  { key: 'team', title: 'Kenali tim AI-mu', short: 'Peran, izin, dan batas tiap agent.', icon: <Users size={18} />, page: 'alur-kerja', cta: 'Lihat Alur Kerja',
    long: 'Setiap agent punya peran, izin, dan batas. Mereka bekerja saat kamu tidur, tetapi tidak pernah mengirim apa pun atas namamu tanpa persetujuan.' },
  { key: 'channel', title: 'Hubungkan kanal', short: 'Pindai QR WhatsApp di HP pengirim.', icon: <QrCode size={18} />, page: 'kanal', cta: 'Buka Kanal',
    long: 'Pindai kode QR dengan WhatsApp di HP nomor pengirim, seperti membuka WhatsApp Web. Selama pengiriman dijeda, agent tetap menyusun draf tetapi tidak ada yang terkirim.' },
  { key: 'schedule', title: 'Pahami jam kerja & batas', short: 'Kapan riset, review, dan kirim.', icon: <Clock size={18} />, page: 'beranda', cta: 'Lihat ritme harian',
    long: 'Riset berjalan malam hari, kamu meninjau di pagi hari, dan pesan hanya keluar di jam kirim. Batas harian dan jeda antarpesan dijaga oleh Candra.' },
  { key: 'rules', title: 'Aturan persetujuan', short: 'Apa yang selalu butuh kamu.', icon: <ShieldCheck size={18} />, page: 'percakapan', cta: 'Buka Percakapan',
    long: 'Setiap pesan AI ke prospek butuh persetujuanmu. Pertanyaan harga, negosiasi, atau permintaan bicara langsung membuat percakapan ditahan dan memanggilmu.' },
  { key: 'decide', title: 'Keputusan pertamamu', short: 'Setujui atau minta revisi satu draf.', icon: <SquareCheck size={18} />, page: 'keputusan', cta: 'Buka Keputusan',
    long: 'Tinjau satu draf: bukti, alasan, dan isi pesan. Setujui atau minta revisi. Begitulah kamu bekerja setiap hari, cukup sekitar 10 menit di pagi hari.' },
];

interface GuideStore { seen: boolean; done: string[] }

function read(): GuideStore {
  try {
    const raw = window.localStorage.getItem(STORE_KEY);
    if (raw) return { seen: false, done: [], ...JSON.parse(raw) };
  } catch { /* storage unavailable */ }
  return { seen: false, done: [] };
}

export interface Guide {
  seen: boolean;
  done: string[];
  progress: number;
  markSeen: () => void;
  complete: (key: string) => void;
}

export function useGuide(): Guide {
  const [store, setStore] = useState<GuideStore>(read);
  useEffect(() => {
    try { window.localStorage.setItem(STORE_KEY, JSON.stringify(store)); } catch { /* ignore */ }
  }, [store]);
  const markSeen = useCallback(() => setStore(s => ({ ...s, seen: true })), []);
  const complete = useCallback((key: string) => setStore(s => (s.done.includes(key) ? s : { ...s, done: [...s.done, key] })), []);
  return { ...store, progress: Math.round((store.done.length / GUIDE_STEPS.length) * 100), markSeen, complete };
}

export function Onboarding({ guide, onClose }: { guide: Guide; onClose: () => void }) {
  const firstOpen = GUIDE_STEPS.findIndex(s => !guide.done.includes(s.key));
  const [current, setCurrent] = useState(firstOpen === -1 ? 0 : firstOpen);
  const step = GUIDE_STEPS[current];

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  const next = () => {
    guide.complete(step.key);
    if (current < GUIDE_STEPS.length - 1) setCurrent(current + 1);
    else onClose();
  };

  return (
    <div className="fixed inset-0 z-[60] grid place-items-center overflow-y-auto bg-ink/30 p-4 backdrop-blur-[3px]">
      <div role="dialog" aria-modal="true" aria-labelledby="onboarding-title" className="grid w-full max-w-[980px] overflow-hidden rounded-2xl bg-card shadow-[var(--shadow-float)] md:grid-cols-[400px_1fr]">
        <div className="flex flex-col">
          <div className="flex items-center gap-2.5 border-b border-line px-7 py-5 text-[16px] font-semibold">
            <span className="grid size-7 place-items-center rounded-lg bg-ink text-[13px] font-bold text-white">J</span>{workspace.product.split(' ')[0]}
          </div>
          <div className="flex-1 px-5 py-6">
            <h2 id="onboarding-title" className="px-3 font-display text-[22px] leading-[30px] font-semibold">Selamat datang di {workspace.product.split(' ')[0]}.</h2>
            <p className="px-3 pb-4 pt-1 text-muted">Tim AI-mu siap bekerja. Kamu tetap memegang keputusan.</p>
            <ol className="flex flex-col gap-1">
              {GUIDE_STEPS.map((s, i) => {
                const active = i === current;
                const done = guide.done.includes(s.key);
                return (
                  <li key={s.key} className={active ? '' : 'hidden md:block'}>
                    <button
                      onClick={() => setCurrent(i)}
                      aria-current={active ? 'step' : undefined}
                      className={`relative flex w-full items-start gap-3.5 rounded-xl p-3 text-left ${active ? 'bg-surface' : 'hover:bg-surface'}`}
                    >
                      {active && <span className="absolute -left-5 bottom-3.5 top-3.5 w-[3px] rounded-full bg-accent" />}
                      <span className={`grid size-[38px] shrink-0 place-items-center rounded-[10px] border bg-card ${active ? 'border-accent-line text-accent' : 'border-line text-ink-soft'}`}>
                        {done ? <Check size={18} className="text-ok" /> : s.icon}
                      </span>
                      <span>
                        <span className="block text-[14px] font-semibold leading-5">{s.title}</span>
                        <span className="block text-[13px] leading-[18px] text-muted">{s.short}</span>
                      </span>
                    </button>
                  </li>
                );
              })}
            </ol>
          </div>
          <div className="flex items-center gap-2 border-t border-line px-5 py-3.5">
            <a href={href(step.page)} onClick={onClose} className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-surface px-3 text-[13px] font-medium hover:bg-line-soft">
              <BookOpen size={15} /> {step.cta}
            </a>
          </div>
        </div>
        <div className="flex flex-col border-line bg-surface md:border-l">
          <div className="relative mx-6 mt-6 h-[260px] overflow-hidden rounded-xl bg-[#EEF0F3]">
            <Preview stepKey={step.key} />
          </div>
          <div className="flex-1 px-7 py-6">
            <h3 className="text-[16px] font-semibold">{step.title}</h3>
            <p className="mt-1.5 max-w-[440px] text-muted">{step.long}</p>
            <p className="mt-3 flex items-center gap-1.5 text-[13px] text-ok"><ShieldCheck size={15} /> Panduan ini tidak mengubah pengaturan apa pun.</p>
          </div>
          <div className="flex items-center justify-between border-t border-line px-6 py-3.5">
            <Button variant="ghost" onClick={onClose}>Lewati untuk sekarang</Button>
            <Button variant="primary" onClick={next} icon={<ArrowRight size={16} />}>{current === GUIDE_STEPS.length - 1 ? 'Mulai bekerja' : 'Lanjut'}</Button>
          </div>
        </div>
      </div>
    </div>
  );
}

function Float({ children, className = '', ghost = false, style }: { children: ReactNode; className?: string; ghost?: boolean; style?: React.CSSProperties }) {
  return (
    <div style={style} className={`absolute flex items-center gap-2.5 rounded-xl bg-card px-3.5 py-3 text-[13px] transition-all duration-300 ${ghost ? 'scale-[.96] opacity-50' : 'shadow-[var(--shadow-float)]'} ${className}`}>
      {children}
    </div>
  );
}

function Preview({ stepKey }: { stepKey: string }) {
  if (stepKey === 'team') return (
    <>
      <Float ghost style={{ left: '52%', top: 20 }}><AgentAvatar id="manda" size={28} /><div><b>Manda</b><div className="text-[12px] text-muted">Penulis naskah</div></div></Float>
      <Float style={{ left: '20%', top: 100 }}><AgentAvatar id="candra" size={34} status="busy" /><div><b>Candra</b><div className="text-[12px] text-muted">Kepala Sales · menyusun draf</div></div><Pill tone="busy" dot>Bekerja</Pill></Float>
      <Float ghost style={{ left: '6%', top: 186 }}><AgentAvatar id="research" size={28} status="unknown" /><div><b>Worker Riset</b><div className="text-[12px] text-muted">PC · malam hari</div></div><Pill tone="unknown">Belum ada sinyal</Pill></Float>
    </>
  );
  if (stepKey === 'channel') return (
    <>
      <Float style={{ left: '10%', top: 50 }}><span className="size-7 rounded-full bg-[#25D366]" /><div><b>WhatsApp · {workspace.senderProfiles.irfan}</b><div className="text-[12px] text-muted">Perangkat tertaut</div></div><Pill tone="ok" dot>Tersambung</Pill></Float>
      <Float ghost style={{ left: '26%', top: 140 }}><span className="size-7 rounded-full bg-[#25D366]" /><div><b>WhatsApp · {workspace.senderProfiles.candra}</b><div className="text-[12px] text-muted">Pesan keluar ditahan</div></div><Pill tone="danger">Perlu scan ulang</Pill></Float>
    </>
  );
  if (stepKey === 'schedule') return (
    <Float style={{ left: '6%', right: '6%', top: 92 }} className="block">
      <div className="flex h-2.5 gap-[3px] overflow-hidden rounded-full"><i className="flex-[11] bg-[#BDB4FE]" /><i className="flex-[1.5] bg-[#FEC84B]" /><i className="flex-[8] bg-[#84ADFF]" /><i className="flex-[3.5] bg-line" /></div>
      <div className="mt-2.5 flex justify-between text-[12px] text-muted">{workspace.schedule.map(s => <span key={s.key}>{s.label} {s.from}</span>)}</div>
    </Float>
  );
  if (stepKey === 'rules') return (
    <>
      <Float style={{ left: '14%', top: 56 }}><AgentAvatar id="candra" size={30} /><div><b>Prospek tanya harga</b><div className="text-[12px] text-muted">Percakapan ditahan, memanggilmu</div></div></Float>
      <Float style={{ left: '30%', top: 146 }} className="border border-warn-line"><Lock size={16} className="text-warn" /><div><b>Persetujuan pemilik</b><div className="text-[12px] text-muted">Setiap pesan AI · harga · minta bicara</div></div></Float>
    </>
  );
  return (
    <Float style={{ left: '12%', right: '12%', top: 52 }} className="block">
      <div className="text-[12px] font-semibold uppercase tracking-[0.06em] text-muted">Draf · klinik contoh</div>
      <p className="my-2 text-ink-soft">“Selamat pagi, boleh saya tanya pasien biasanya booking lewat mana?”</p>
      <div className="flex justify-end gap-2"><span className="rounded-lg border border-line px-3 py-1 text-[13px]">Minta revisi</span><span className="rounded-lg bg-ink px-3 py-1 text-[13px] text-white">Setujui</span></div>
    </Float>
  );
}
