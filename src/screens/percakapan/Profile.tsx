import { Check, Copy, ExternalLink, Globe } from 'lucide-react';
import type { ReactNode } from 'react';
import { BusinessAvatar, Overline, Pill, type Tone } from '../../components/ui';
import { useToast } from '../../lib/data';
import { ago, maskPhone, parseJson } from '../../lib/format';
import { go } from '../../lib/router';
import { FUNNEL, type ConversationDetail, type Stage } from '../../lib/types';
import { KEY_STAGES, stageLabel } from './labels';

const verdictPill: Record<string, { tone: Tone; label: string }> = {
  contact: { tone: 'ok', label: 'Layak dihubungi' },
  hold: { tone: 'warn', label: 'Tahan dulu' },
  skip: { tone: 'gray', label: 'Dilewati' },
};

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="border-t border-line px-5 py-4">
      <Overline className="mb-2">{title}</Overline>
      {children}
    </section>
  );
}

export function ProfilePanel({ detail }: { detail: ConversationDetail }) {
  const toast = useToast();
  const c = detail.conversation;
  const profile = parseJson<Record<string, unknown>>(c.profile) ?? {};
  const pick = (...keys: string[]) => keys.map(k => profile[k]).find(v => typeof v === 'string' && v.trim()) as string | undefined;
  const segment = pick('segmen', 'segment', 'kategori', 'category');
  const city = pick('kota', 'city', 'lokasi', 'location');
  const stageIdx = FUNNEL.indexOf(c.stage);
  const study = detail.study;
  const problems = study?.content?.masalah ?? [];

  const copy = async () => {
    if (!c.phone) return;
    try {
      await navigator.clipboard.writeText(c.phone.startsWith('+') ? c.phone : `+${c.phone.replace(/\D/g, '')}`);
      toast('ok', 'Nomor disalin.');
    } catch {
      toast('error', 'Nomor belum bisa disalin. Browser menolak akses papan klip.');
    }
  };

  return (
    <div className="flex flex-col">
      <div className="flex flex-col items-center gap-2 px-5 pb-4 pt-6 text-center">
        <BusinessAvatar name={c.name} size={64} channel="whatsapp" />
        <h2 className="mt-1 text-[16px] font-semibold leading-6">{c.name}</h2>
        <p className="text-[13px] text-muted">{[segment, city].filter(Boolean).join(' · ') || 'Segmen belum tercatat'}</p>
        {c.domain && (
          <a href={`https://${c.domain}`} target="_blank" rel="noreferrer noopener" className="inline-flex items-center gap-1 text-[13px] text-accent hover:underline">
            <Globe size={13} /> {c.domain} <ExternalLink size={12} aria-hidden />
          </a>
        )}
        <div className="mt-1 flex items-center gap-1.5 rounded-lg border border-line bg-surface py-1 pl-3 pr-1">
          <span className="tabular text-[13px]">{maskPhone(c.phone)}</span>
          <button type="button" onClick={copy} disabled={!c.phone} aria-label="Salin nomor" title="Salin nomor" className="grid size-7 place-items-center rounded-md text-ink-soft hover:bg-line-soft disabled:text-faint">
            <Copy size={14} />
          </button>
        </div>
        {c.prospect_ref && <span className="text-[12px] text-muted">Ref. prospek {c.prospect_ref}</span>}
      </div>

      <Section title="Tahap funnel">
        <ol className="flex items-start" aria-label={`Tahap sekarang: ${stageLabel[c.stage] ?? c.stage}`}>
          {KEY_STAGES.map((s: Stage, i) => {
            const reached = stageIdx >= FUNNEL.indexOf(s);
            const isCurrent = reached && (i === KEY_STAGES.length - 1 || stageIdx < FUNNEL.indexOf(KEY_STAGES[i + 1]));
            return (
              <li key={s} className="relative flex flex-1 flex-col items-center gap-1.5 text-center">
                {i > 0 && <span className={`absolute right-1/2 top-[9px] h-0.5 w-full ${reached ? 'bg-accent' : 'bg-line'}`} aria-hidden />}
                <span className={`relative z-10 grid size-5 place-items-center rounded-full border-2 ${reached ? 'border-accent bg-accent text-white' : 'border-line bg-card'} ${isCurrent ? 'ring-4 ring-accent-soft' : ''}`}>
                  {reached && <Check size={11} strokeWidth={3} />}
                </span>
                <span className={`text-[12px] leading-4 ${isCurrent ? 'font-semibold text-ink' : reached ? 'text-ink-soft' : 'text-muted'}`}>{stageLabel[s]}</span>
              </li>
            );
          })}
        </ol>
        <p className="mt-3 text-[12px] text-muted">Sekarang: <b className="font-semibold text-ink-soft">{stageLabel[c.stage] ?? c.stage}</b> · follow-up terkirim {c.followups} dari maks. 2</p>
      </Section>

      <Section title="Riset Candra">
        {!study && <p className="text-[13px] text-muted">Belum ada riset untuk kontak ini.</p>}
        {study && (
          <div className="flex flex-col gap-2.5">
            <div className="flex flex-wrap items-center gap-2">
              <Pill tone={verdictPill[study.verdict]?.tone ?? 'gray'}>{verdictPill[study.verdict]?.label ?? study.verdict}</Pill>
              <span className="text-[12px] text-muted">diperbarui {ago(study.updated_at)}</span>
            </div>
            {study.summary && <p className="text-[13px] text-ink-soft">{study.summary}</p>}
            {study.target_service && <p className="text-[13px]"><span className="text-muted">Layanan yang ditawarkan: </span>{study.target_service}</p>}
            {problems.map((p, i) => (
              <div key={i} className="rounded-lg border border-line bg-surface p-3 text-[13px]">
                <div className="flex items-start justify-between gap-2">
                  <b className="font-semibold">{p.masalah}</b>
                  {p.status && <Pill tone={p.status === 'terbukti' ? 'ok' : 'gray'}>{p.status}</Pill>}
                </div>
                {p.bukti && <p className="mt-1 text-ink-soft">Bukti: {p.bukti}</p>}
                {p.sumber && <p className="mt-1 truncate text-[12px] text-muted" title={p.sumber}>Sumber: {p.sumber}</p>}
              </div>
            ))}
          </div>
        )}
      </Section>

      <Section title="Label">
        {c.tags.length ? (
          <div className="flex flex-wrap gap-1.5">{c.tags.map(t => <Pill key={t} tone="gray">{t}</Pill>)}</div>
        ) : <p className="text-[13px] text-muted">Belum ada label.</p>}
      </Section>

      <Section title="Riwayat kontak">
        {detail.previous.length === 0 ? (
          <p className="text-[13px] text-muted">Tidak ada percakapan sebelumnya.</p>
        ) : (
          <ul className="flex flex-col gap-1">
            <li className="mb-1 text-[13px] text-ink-soft">{detail.previous.length} percakapan sebelumnya</li>
            {detail.previous.map(p => (
              <li key={p.id}>
                <button type="button" onClick={() => go('percakapan', p.id)} className="flex w-full items-center justify-between gap-2 rounded-lg px-2 py-1.5 text-left text-[13px] hover:bg-surface">
                  <span>{stageLabel[p.stage] ?? p.stage} · {p.status}</span>
                  <span className="text-[12px] text-muted">{ago(p.updated_at)}</span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </Section>

      <Section title="Mode kirim">
        <p className="text-[13px] text-ink-soft">
          {c.mode === 'DRAFT_ONLY' ? 'Draf saja — setiap pesan AI menunggu persetujuanmu.' : 'Balas otomatis diizinkan untuk pesan yang lolos gerbang kirim.'}
        </p>
      </Section>
    </div>
  );
}
