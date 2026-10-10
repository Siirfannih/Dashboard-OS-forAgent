import { Check, ExternalLink, TriangleAlert } from 'lucide-react';
import { Card, Overline, Pill, type Tone } from '../../components/ui';
import { ago, ageHours } from '../../lib/format';
import type { ReviewItem, ReviewPolicy, StudyContent, StudyProblem } from '../../lib/types';

const verdictLabel: Record<string, { tone: Tone; text: string }> = {
  contact: { tone: 'ok', text: 'Layak dihubungi' },
  hold: { tone: 'warn', text: 'Tahan dulu' },
  skip: { tone: 'gray', text: 'Lewati' },
};

export function VerdictPill({ verdict }: { verdict: string | null | undefined }) {
  if (!verdict) return <Pill tone="unknown">Belum dinilai</Pill>;
  const v = verdictLabel[verdict] ?? { tone: 'gray' as Tone, text: verdict };
  return <Pill tone={v.tone} dot>{v.text}</Pill>;
}

function problemTone(status: string): { tone: Tone; text: string } {
  const s = status.toLowerCase();
  if (['terbukti', 'fakta', 'verified', 'confirmed'].includes(s)) return { tone: 'ok', text: 'Terbukti' };
  if (['dugaan', 'hipotesis', 'hypothesis', 'belum_terbukti'].includes(s)) return { tone: 'warn', text: 'Dugaan' };
  if (['dibantah', 'tidak_terbukti', 'refuted'].includes(s)) return { tone: 'danger', text: 'Dibantah' };
  return { tone: 'gray', text: status || 'Tanpa status' };
}

const humanize = (key: string) => {
  const text = key.replace(/[_-]+/g, ' ').trim();
  return text ? text[0].toUpperCase() + text.slice(1) : key;
};

const isUrl = (value: string | undefined) => !!value && /^https?:\/\//i.test(value);

/** "Kenapa layak": verdict, summary, checklist, problems with evidence, and evidence age. */
export function WhyEligible({ item, study, policy }: { item: ReviewItem; study: StudyContent | null; policy: ReviewPolicy | null }) {
  const service = typeof study?.solusi?.layanan === 'string' ? study.solusi.layanan : null;
  const checks = study?.verifikasi && typeof study.verifikasi === 'object' ? Object.entries(study.verifikasi).filter(([, v]) => typeof v === 'string' && v) : [];
  const problems: StudyProblem[] = Array.isArray(study?.masalah) ? study.masalah.filter(p => p && typeof p === 'object') : [];

  return (
    <Card className="p-5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <Overline>Kenapa layak</Overline>
          <h3 className="text-[16px] font-semibold">Hasil riset & bukti</h3>
        </div>
        <VerdictPill verdict={item.verdict} />
      </div>

      <EvidenceAge item={item} policy={policy} />

      {item.study_summary ? <p className="mt-3 text-[14px] text-ink-soft">{item.study_summary}</p> : <p className="mt-3 text-[13px] text-muted">Belum ada ringkasan riset untuk prospek ini.</p>}
      {service && (
        <div className="mt-3 text-[13px]"><span className="text-muted">Layanan yang ditawarkan: </span><b className="font-semibold">{service}</b></div>
      )}

      {checks.length > 0 && (
        <div className="mt-4">
          <div className="mb-2 text-[13px] font-semibold">Verifikasi identitas</div>
          <ul className="flex flex-col gap-1.5">
            {checks.map(([key, value]) => (
              <li key={key} className="flex gap-2 text-[13px] leading-5">
                <span className="mt-0.5 grid size-4 shrink-0 place-items-center rounded-full bg-ok-soft text-ok"><Check size={11} strokeWidth={3} /></span>
                <span className="min-w-0 break-words"><span className="text-muted">{humanize(key)}: </span>{value}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="mt-4">
        <div className="mb-2 text-[13px] font-semibold">Masalah yang ditemukan</div>
        {problems.length === 0 && <p className="text-[13px] text-muted">Riset tidak mencatat masalah spesifik.</p>}
        <ul className="flex flex-col gap-2.5">
          {problems.map((p, i) => {
            const t = problemTone(String(p.status ?? ''));
            return (
              <li key={i} className="rounded-lg border border-line bg-surface p-3">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div className="min-w-0 flex-1 text-[14px] font-medium">{p.masalah || 'Masalah tanpa judul'}</div>
                  <Pill tone={t.tone}>{t.text}</Pill>
                </div>
                {p.bukti && <p className="mt-1.5 text-[13px] text-ink-soft"><span className="text-muted">Bukti: </span>{p.bukti}</p>}
                {p.sumber && (
                  <p className="mt-1 min-w-0 truncate text-[12px] text-muted">
                    Sumber:{' '}
                    {isUrl(p.sumber) ? (
                      <a href={p.sumber} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-accent hover:underline">
                        {p.sumber.replace(/^https?:\/\//i, '')}<ExternalLink size={11} aria-hidden />
                      </a>
                    ) : p.sumber}
                  </p>
                )}
                {p.penjelasan_lain && <p className="mt-1 text-[12px] text-muted">Penjelasan lain: {p.penjelasan_lain}</p>}
                {p.pembatal && <p className="mt-1 text-[12px] text-muted">Bisa batal kalau: {p.pembatal}</p>}
              </li>
            );
          })}
        </ul>
      </div>
      {!study && item.study_content && <p className="mt-3 text-[12px] text-muted">Detail riset tersimpan dalam format yang belum bisa ditampilkan.</p>}
    </Card>
  );
}

function EvidenceAge({ item, policy }: { item: ReviewItem; policy: ReviewPolicy | null }) {
  const hours = ageHours(item.study_updated_at);
  if (hours === null) {
    return <div className="mt-3"><Pill tone="unknown">Umur bukti tidak diketahui</Pill></div>;
  }
  const limit = policy?.pitch_evidence_hours;
  const stale = limit !== undefined && hours > limit;
  if (!stale) {
    return (
      <div className="mt-3 text-[13px] text-muted">
        Bukti dicek {ago(item.study_updated_at)}{limit !== undefined ? ` · batas ${limit} jam` : ''}
      </div>
    );
  }
  return (
    <div className="mt-3 flex gap-2 rounded-lg border border-warn-line bg-warn-soft px-3 py-2 text-[13px] text-warn">
      <TriangleAlert size={15} className="mt-0.5 shrink-0" aria-hidden />
      <span>
        <b className="font-semibold">Bukti sudah {ago(item.study_updated_at)}</b>, lebih dari batas {limit} jam. Pesan pertama atau tindak lanjut akan ditahan saat jam kirim sampai riset diperbarui.
      </span>
    </div>
  );
}
