import { ArrowRight, CircleAlert, CircleCheck, ExternalLink, FlaskConical, GitPullRequestArrow, History, TriangleAlert, X } from 'lucide-react';
import { useState } from 'react';
import { AgentAvatar, Button, EmptyState, IconButton, Modal, Pill, inputClass } from '../../components/ui';
import { useSource, useToast } from '../../lib/data';
import { dateTime } from '../../lib/format';
import { href } from '../../lib/router';
import type { WorkflowChange, WorkflowProposal, WorkflowSimulation } from '../../lib/types';
import { describeChange, isConflict, proposalStatus } from './model';

export function ChangeList({ changes, compact }: { changes: WorkflowChange[]; compact?: boolean }) {
  return (
    <ul className={`flex flex-col ${compact ? 'gap-1' : 'gap-2'}`}>
      {changes.map(c => {
        const d = describeChange(c);
        return (
          <li key={`${c.node_id}.${c.field}`} className={`text-[13px] leading-5 ${compact ? '' : 'rounded-lg border border-line px-3 py-2'}`}>
            <span className="font-medium">{d.step}</span>
            <span className="text-muted"> · {d.field}: </span>
            <span className="text-ink-soft line-through decoration-faint">{d.from}</span>
            <ArrowRight size={13} className="mx-1 inline align-[-2px] text-muted" aria-label="menjadi" />
            <b>{d.to}</b>
          </li>
        );
      })}
    </ul>
  );
}

/** Step 1: owner writes the reason and submits the draft as a proposal. */
export function SubmitModal({ open, onClose, changes, baseVersion, values, onSubmitted, onReload }: {
  open: boolean;
  onClose: () => void;
  changes: WorkflowChange[];
  baseVersion: number;
  /** Effective values the owner sees now ("node.field" → text), so the dry run checks the whole picture. */
  values: Record<string, string>;
  onSubmitted: (proposal: WorkflowProposal) => void;
  onReload: () => Promise<void>;
}) {
  const source = useSource();
  const [note, setNote] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<{ text: string; conflict: boolean } | null>(null);
  const [touched, setTouched] = useState(false);
  const [simulation, setSimulation] = useState<WorkflowSimulation | null>(null);
  const [simulating, setSimulating] = useState(false);
  const [simError, setSimError] = useState<string | null>(null);
  const noteMissing = !note.trim();

  const simulate = async () => {
    setSimulating(true);
    setSimError(null);
    try {
      const after = { ...values, ...Object.fromEntries(changes.map(c => [`${c.node_id}.${c.field}`, c.to])) };
      setSimulation(await source.simulateWorkflow({ base_version: baseVersion, changes, values: after }));
    } catch (exc) {
      setSimulation(null);
      setSimError(`Simulasi gagal dijalankan. ${exc instanceof Error ? exc.message : ''}`);
    } finally {
      setSimulating(false);
    }
  };

  const submit = async () => {
    setTouched(true);
    if (noteMissing) return;
    setBusy(true);
    setError(null);
    try {
      const proposal = await source.proposeWorkflow({ base_version: baseVersion, changes, note: note.trim() });
      setNote('');
      setTouched(false);
      onSubmitted(proposal);
    } catch (exc) {
      const conflict = isConflict(exc);
      setError({
        conflict,
        text: conflict
          ? 'Alur sudah berubah sejak kamu mulai mengedit. Muat ulang alur, periksa lagi perubahanmu, lalu ajukan ulang.'
          : `Proposal belum terkirim. ${exc instanceof Error ? exc.message : ''} Draf tetap tersimpan di halaman ini — coba lagi.`,
      });
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={`Ajukan perubahan ke v${baseVersion + 1}`}
      width={560}
      footer={
        <>
          <Button onClick={onClose}>Kembali ke draf</Button>
          <Button onClick={simulate} disabled={simulating || changes.length === 0}>
            <FlaskConical size={15} aria-hidden /> {simulating ? 'Menyimulasikan…' : 'Simulasikan'}
          </Button>
          <Button variant="primary" onClick={submit} disabled={busy || changes.length === 0}>
            {busy ? 'Mengajukan…' : `Ajukan ${changes.length} perubahan`}
          </Button>
        </>
      }
    >
      <p className="mb-3 text-[13px] text-ink-soft">Perubahan dari alur aktif v{baseVersion}:</p>
      <ChangeList changes={changes} />
      {(simulation || simError) && <SimulationResult simulation={simulation} error={simError} />}
      <label htmlFor="wf-note" className="mb-1.5 mt-4 block text-[13px] font-medium">Alasan perubahan <span className="text-danger">*</span></label>
      <textarea
        id="wf-note"
        rows={3}
        className={inputClass}
        value={note}
        onChange={e => setNote(e.target.value)}
        onBlur={() => setTouched(true)}
        placeholder="Misalnya: PC sering mati malam hari, pindahkan riset ke Server Utama selama seminggu."
        aria-invalid={touched && noteMissing}
        aria-describedby="wf-note-hint"
      />
      <div id="wf-note-hint" className={`mt-1.5 text-[12px] ${touched && noteMissing ? 'text-danger' : 'text-muted'}`}>
        {touched && noteMissing ? 'Tulis alasannya dulu — Angga memakainya untuk menerapkan perubahan dengan benar.' : 'Wajib. Dibaca Angga saat menerapkan perubahan.'}
      </div>
      <div className="mt-4 flex gap-2.5 rounded-lg border border-line bg-surface px-3 py-2.5 text-[13px] leading-5 text-ink-soft">
        <AgentAvatar id="engineer" size={24} />
        <span>Setelah kamu setujui, perubahan dikirim sebagai tugas ke Angga (Teknisi) untuk diterapkan. Alur aktif tidak berubah sebelum Angga menerapkannya.</span>
      </div>
      {error && (
        <div role="alert" className="mt-3 flex flex-wrap items-center gap-2 rounded-lg border border-danger/20 bg-danger-soft px-3 py-2.5 text-[13px] text-danger">
          <CircleAlert size={15} className="shrink-0" aria-hidden />
          <span className="min-w-0 flex-1">{error.text}</span>
          {error.conflict && <Button size="sm" variant="danger" onClick={async () => { await onReload(); setError(null); onClose(); }}>Muat ulang alur</Button>}
        </div>
      )}
    </Modal>
  );
}

/** Step 2: the owner explicitly approves (dispatch to Angga) or rejects. */
export function PendingPanel({ proposals, recent, onDecided, onDismissRecent, onReload }: {
  proposals: WorkflowProposal[];
  recent: WorkflowProposal | null;
  onDecided: (proposal: WorkflowProposal) => void;
  onDismissRecent: () => void;
  onReload: () => Promise<void>;
}) {
  const source = useSource();
  const toast = useToast();
  const [busy, setBusy] = useState<string | null>(null);
  const pending = proposals.filter(p => p.status === 'pending');
  const waiting = proposals.filter(p => p.status === 'dispatched');
  if (!pending.length && !waiting.length && !recent) return null;

  const markApplied = async (p: WorkflowProposal) => {
    setBusy(`${p.id}:applied`);
    try {
      const result = await source.markApplied(p.id);
      toast('ok', `Perubahan diterapkan. Alur aktif sekarang v${p.base_version + 1}.`);
      onDecided(result);
      await onReload();
    } catch (exc) {
      toast('error', `Belum bisa ditandai. ${exc instanceof Error ? exc.message : ''}`);
      if (isConflict(exc)) await onReload();
    } finally {
      setBusy(null);
    }
  };

  const decide = async (p: WorkflowProposal, action: 'approve' | 'reject') => {
    setBusy(`${p.id}:${action}`);
    try {
      const result = await source.decideProposal(p.id, action);
      toast(action === 'approve' ? 'ok' : 'info', action === 'approve'
        ? 'Disetujui. Tugas penerapan dikirim ke Angga; alur aktif belum berubah.'
        : 'Proposal ditolak. Alur aktif tidak berubah.');
      onDecided(result);
    } catch (exc) {
      toast('error', `Keputusan belum tersimpan. ${exc instanceof Error ? exc.message : ''}`);
      if (isConflict(exc)) await onReload();
    } finally {
      setBusy(null);
    }
  };

  return (
    <div className="flex flex-col gap-2 border-b border-line bg-card px-4 py-3 sm:px-5">
      {pending.map(p => (
        <div key={p.id} className="flex flex-col gap-3 rounded-xl border border-warn-line bg-warn-soft/60 p-3 lg:flex-row lg:items-start">
          <div className="min-w-0 flex-1">
            <div className="mb-1.5 flex flex-wrap items-center gap-2 text-[13px]">
              <GitPullRequestArrow size={15} className="text-warn" aria-hidden />
              <b>Proposal menunggu</b>
              <Pill tone="warn">{proposalStatus.pending.label}</Pill>
              <span className="text-muted">diajukan {dateTime(p.created_at)} · dari v{p.base_version}</span>
            </div>
            <ChangeList changes={p.changes} compact />
            {p.note && <div className="mt-1 text-[12px] text-ink-soft">Alasan: “{p.note}”</div>}
            <div className="mt-1.5 text-[12px] text-muted">Setujui untuk mengirim tugas penerapan ke Angga (Teknisi). Alur aktif tetap berjalan sampai Angga menerapkannya.</div>
          </div>
          <div className="flex shrink-0 gap-2">
            <Button size="sm" variant="danger" disabled={!!busy} onClick={() => decide(p, 'reject')}>{busy === `${p.id}:reject` ? 'Menolak…' : 'Tolak'}</Button>
            <Button size="sm" variant="primary" disabled={!!busy} onClick={() => decide(p, 'approve')}>{busy === `${p.id}:approve` ? 'Menyetujui…' : 'Setujui & kirim ke Angga'}</Button>
          </div>
        </div>
      ))}
      {waiting.map(p => (
        <div key={p.id} className="flex flex-col gap-3 rounded-xl border border-busy/20 bg-busy-soft/60 p-3 lg:flex-row lg:items-start">
          <div className="min-w-0 flex-1">
            <div className="mb-1.5 flex flex-wrap items-center gap-2 text-[13px]">
              <AgentAvatar id="engineer" size={22} />
              <b>Menunggu penerapan</b>
              <Pill tone="busy">{proposalStatus.dispatched.label}</Pill>
              <span className="text-muted">disetujui {dateTime(p.decided_at ?? p.created_at)}</span>
            </div>
            <ChangeList changes={p.changes} compact />
            <div className="mt-1.5 text-[12px] text-muted">Alur aktif masih v{p.base_version}. Tandai diterapkan setelah Angga melaporkan perubahan ini selesai di Ruang Tim.</div>
          </div>
          <div className="flex shrink-0 flex-wrap gap-2">
            {p.task_conversation_id && <a href={href('ruang-tim', p.task_conversation_id)} className="inline-flex h-8 items-center gap-1 rounded-lg border border-line bg-card px-3 text-[13px] font-medium hover:bg-surface">Buka tugas Angga <ExternalLink size={13} aria-hidden /></a>}
            <Button size="sm" variant="primary" disabled={!!busy} onClick={() => markApplied(p)}>{busy === `${p.id}:applied` ? 'Menyimpan…' : 'Tandai sudah diterapkan'}</Button>
          </div>
        </div>
      ))}
      {recent && recent.status !== 'dispatched' && (
        <div className={`flex flex-wrap items-center gap-2 rounded-xl border px-3 py-2 text-[13px] ${recent.status === 'rejected' ? 'border-line bg-surface text-ink-soft' : 'border-ok/20 bg-ok-soft text-ok'}`} role="status">
          <span className="min-w-0 flex-1">
            <b>{proposalStatus[recent.status].label}.</b>{' '}
            {recent.status === 'applied' && 'Alur aktif memakai perubahan ini.'}
            {recent.status === 'approved' && 'Tugas untuk Angga belum terkirim; status akan diperbarui di Riwayat proposal.'}
            {recent.status === 'rejected' && 'Alur aktif tidak berubah.'}
          </span>
          {recent.task_conversation_id && (
            <a href={href('ruang-tim', recent.task_conversation_id)} className="inline-flex items-center gap-1 font-medium underline-offset-2 hover:underline">
              Buka di Ruang Tim <ExternalLink size={13} aria-hidden />
            </a>
          )}
          <IconButton label="Tutup pemberitahuan" onClick={onDismissRecent} className="size-7"><X size={15} /></IconButton>
        </div>
      )}
    </div>
  );
}

function SimulationResult({ simulation, error }: { simulation: WorkflowSimulation | null; error: string | null }) {
  if (error) return <div role="status" className="mt-3 rounded-lg border border-line bg-surface px-3 py-2.5 text-[13px] text-ink-soft">{error}</div>;
  if (!simulation) return null;
  if (!simulation.issues.length) {
    return (
      <div role="status" className="mt-3 flex items-center gap-2 rounded-lg border border-ok/20 bg-ok-soft px-3 py-2.5 text-[13px] text-ok">
        <CircleCheck size={15} aria-hidden /> Lolos simulasi: aturan jam, batas, dan langkah pengaman terpenuhi. Tidak ada yang dikirim atau diubah.
      </div>
    );
  }
  return (
    <ul role="status" aria-label="Hasil simulasi" className="mt-3 flex flex-col gap-1.5">
      {simulation.issues.map((i, n) => (
        <li key={n} className={`flex gap-2 rounded-lg border px-3 py-2 text-[13px] leading-5 ${i.level === 'error' ? 'border-danger/20 bg-danger-soft text-danger' : 'border-warn-line bg-warn-soft text-warn'}`}>
          {i.level === 'error' ? <CircleAlert size={15} className="mt-0.5 shrink-0" aria-hidden /> : <TriangleAlert size={15} className="mt-0.5 shrink-0" aria-hidden />}
          <span className="min-w-0">{i.message}</span>
        </li>
      ))}
    </ul>
  );
}

/** Versions that existed: v1, plus one per applied proposal (base_version + 1). */
function pastVersions(proposals: WorkflowProposal[], version: number): number[] {
  const made = new Set([1, ...proposals.filter(p => p.status === 'applied').map(p => p.base_version + 1)]);
  return [...made].filter(v => v < version).sort((a, b) => b - a);
}

export function HistoryModal({ open, onClose, proposals, version, onReverted }: {
  open: boolean; onClose: () => void; proposals: WorkflowProposal[]; version: number; onReverted: (proposal: WorkflowProposal) => void;
}) {
  const source = useSource();
  const toast = useToast();
  const [busy, setBusy] = useState<number | null>(null);
  const sorted = [...proposals].sort((a, b) => b.created_at - a.created_at);
  const past = pastVersions(proposals, version);
  const revert = async (target: number) => {
    setBusy(target);
    try {
      const proposal = await source.revertWorkflow(target, 'Diminta dari riwayat proposal.');
      toast('ok', `Proposal kembali ke v${target} dibuat. Setujui untuk mengirimnya ke Angga.`);
      onReverted(proposal);
    } catch (exc) {
      toast('error', `Belum bisa kembali ke v${target}. ${exc instanceof Error ? exc.message : ''}`);
    } finally {
      setBusy(null);
    }
  };
  return (
    <Modal open={open} onClose={onClose} title="Riwayat proposal" width={600}>
      {past.length > 0 && (
        <div className="mb-4 rounded-xl border border-line bg-surface p-3.5">
          <div className="mb-2 flex items-center gap-2 text-[13px] font-medium"><History size={15} aria-hidden /> Versi sebelumnya</div>
          <p className="mb-2.5 text-[12px] text-muted">Kembali ke versi lama membuat proposal biasa: kamu setujui, Angga menerapkan. Alur aktif v{version} tidak berubah sebelum itu.</p>
          <div className="flex flex-wrap gap-2">
            {past.map(v => (
              <Button key={v} size="sm" onClick={() => revert(v)} disabled={busy !== null}>{busy === v ? 'Membuat proposal…' : `Kembalikan ke v${v}`}</Button>
            ))}
          </div>
        </div>
      )}
      {sorted.length === 0 ? (
        <EmptyState title="Belum ada proposal">Perubahan yang kamu ajukan dari mode Ubah akan muncul di sini beserta statusnya.</EmptyState>
      ) : (
        <ul className="flex flex-col gap-3">
          {sorted.map(p => (
            <li key={p.id} className="rounded-xl border border-line p-3.5">
              <div className="mb-2 flex flex-wrap items-center gap-2">
                <Pill tone={proposalStatus[p.status].tone}>{proposalStatus[p.status].label}</Pill>
                <span className="text-[12px] text-muted">
                  Diajukan {dateTime(p.created_at)} · dari v{p.base_version}{p.decided_at ? ` · diputuskan ${dateTime(p.decided_at)}` : ''}
                </span>
              </div>
              <ChangeList changes={p.changes} compact />
              {p.note && <div className="mt-1.5 text-[12px] text-ink-soft">Alasan: “{p.note}”</div>}
              {p.task_conversation_id && (
                <a href={href('ruang-tim', p.task_conversation_id)} onClick={onClose} className="mt-2 inline-flex items-center gap-1 text-[13px] font-medium text-accent hover:underline">
                  Lihat tugas Angga di Ruang Tim <ExternalLink size={13} aria-hidden />
                </a>
              )}
            </li>
          ))}
        </ul>
      )}
    </Modal>
  );
}
