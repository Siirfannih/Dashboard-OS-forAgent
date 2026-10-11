import { Ban, Bot, Hand, MoreHorizontal, PauseCircle } from 'lucide-react';
import { useEffect, useRef, useState, type KeyboardEvent } from 'react';
import { Button, Modal, inputClass } from '../../components/ui';
import { useSource, useToast } from '../../lib/data';
import type { Control, SalesConversation } from '../../lib/types';
import { CONSEQUENCE, DEFAULT_REASON, controlLabel } from './labels';

const MODES: { value: Control; label: string; icon: typeof Bot }[] = [
  { value: 'AUTO', label: 'Otomatis', icon: Bot },
  { value: 'HOLD', label: 'Ditahan', icon: PauseCircle },
  { value: 'HUMAN_CONTROLLED', label: 'Kamu', icon: Hand },
];

/** Segmented Otomatis | Ditahan | Kamu. Choosing a mode only opens the confirm dialog. */
export function ModeSwitch({ control, onRequest }: { control: Control; onRequest: (c: Control) => void }) {
  const locked = control === 'DO_NOT_CONTACT';
  const refs = useRef<(HTMLButtonElement | null)[]>([]);
  const current = MODES.findIndex(m => m.value === control);

  const onKey = (e: KeyboardEvent, i: number) => {
    const delta = e.key === 'ArrowRight' || e.key === 'ArrowDown' ? 1 : e.key === 'ArrowLeft' || e.key === 'ArrowUp' ? -1 : 0;
    if (!delta) return;
    e.preventDefault();
    const next = (i + delta + MODES.length) % MODES.length;
    refs.current[next]?.focus();
  };

  return (
    <div role="radiogroup" aria-label="Siapa yang menangani percakapan" aria-disabled={locked || undefined} className="flex gap-0.5 rounded-[10px] bg-line-soft p-[3px]">
      {MODES.map((m, i) => {
        const active = m.value === control;
        const Icon = m.icon;
        return (
          <button
            key={m.value}
            ref={el => { refs.current[i] = el; }}
            role="radio"
            aria-checked={active}
            tabIndex={active || (current < 0 && i === 0) ? 0 : -1}
            disabled={locked}
            onKeyDown={e => onKey(e, i)}
            onClick={() => !active && onRequest(m.value)}
            className={`flex items-center gap-1.5 whitespace-nowrap rounded-lg px-2.5 py-1 text-[13px] font-medium ${
              active
                ? m.value === 'HOLD' ? 'bg-warn-soft text-warn shadow-[var(--shadow-card)]'
                  : m.value === 'HUMAN_CONTROLLED' ? 'bg-ink text-white shadow-[var(--shadow-card)]'
                  : 'bg-card text-accent shadow-[var(--shadow-card)]'
                : 'text-ink-soft hover:text-ink disabled:text-muted'
            }`}
          >
            <Icon size={14} aria-hidden />
            {m.label}
          </button>
        );
      })}
    </div>
  );
}

export function MoreMenu({ disabled, onDnc }: { disabled: boolean; onDnc: () => void }) {
  const [open, setOpen] = useState(false);
  const wrap = useRef<HTMLDivElement>(null);
  const item = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    if (!open) return;
    item.current?.focus();
    const close = (e: MouseEvent) => { if (!wrap.current?.contains(e.target as Node)) setOpen(false); };
    const esc = (e: globalThis.KeyboardEvent) => { if (e.key === 'Escape') setOpen(false); };
    window.addEventListener('mousedown', close);
    window.addEventListener('keydown', esc);
    return () => { window.removeEventListener('mousedown', close); window.removeEventListener('keydown', esc); };
  }, [open]);
  return (
    <div ref={wrap} className="relative">
      <button
        type="button"
        aria-label="Tindakan lain"
        title="Tindakan lain"
        aria-haspopup="menu"
        aria-expanded={open}
        disabled={disabled}
        onClick={() => setOpen(o => !o)}
        className="grid size-9 place-items-center rounded-lg text-ink-soft hover:bg-line-soft disabled:text-faint"
      >
        <MoreHorizontal size={18} />
      </button>
      {open && (
        <div role="menu" className="absolute right-0 top-10 z-30 w-60 rounded-xl border border-line bg-card p-1 shadow-[var(--shadow-float)]">
          <button
            ref={item}
            role="menuitem"
            onClick={() => { setOpen(false); onDnc(); }}
            className="flex w-full items-start gap-2 rounded-lg px-3 py-2 text-left text-[13px] text-danger hover:bg-danger-soft"
          >
            <Ban size={15} className="mt-0.5 shrink-0" />
            <span><b className="font-semibold">Jangan hubungi lagi</b><span className="block text-[12px] text-ink-soft">Final, berlaku di semua nomor pengirim</span></span>
          </button>
        </div>
      )}
    </div>
  );
}

/** Confirm a control change with a required reason (1–500 chars, backend rule). */
export function ControlDialog({ conversation, target, onClose, onDone }: {
  conversation: SalesConversation;
  target: Control | null;
  onClose: () => void;
  onDone: () => void;
}) {
  const source = useSource();
  const toast = useToast();
  const [reason, setReason] = useState('');
  const [confirmName, setConfirmName] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (target) { setReason(DEFAULT_REASON[target]); setConfirmName(''); setError(null); }
  }, [target]);

  if (!target) return null;
  const dnc = target === 'DO_NOT_CONTACT';
  const trimmed = reason.trim();
  const nameOk = !dnc || confirmName.trim().toLowerCase() === conversation.name.trim().toLowerCase();
  const valid = trimmed.length >= 1 && trimmed.length <= 500 && nameOk;

  const title = {
    AUTO: 'Kembalikan ke Candra?',
    HOLD: 'Tahan percakapan ini?',
    HUMAN_CONTROLLED: 'Ambil alih percakapan ini?',
    DO_NOT_CONTACT: 'Jangan hubungi lagi?',
  }[target];
  const action = {
    AUTO: 'Kembalikan ke Candra', HOLD: 'Tahan percakapan', HUMAN_CONTROLLED: 'Ambil alih', DO_NOT_CONTACT: 'Tandai jangan hubungi',
  }[target];
  const done = {
    AUTO: `${conversation.name} dikembalikan ke Candra. Draf baru tetap menunggu persetujuanmu.`,
    HOLD: `${conversation.name} ditahan. AI berhenti di percakapan ini.`,
    HUMAN_CONTROLLED: 'Kamu sekarang memegang percakapan ini. AI berhenti membalas sampai kamu kembalikan ke Otomatis.',
    DO_NOT_CONTACT: `${conversation.name} ditandai jangan hubungi. Berlaku di semua nomor pengirim.`,
  }[target];

  const submit = async () => {
    if (!valid || busy) return;
    setBusy(true);
    setError(null);
    try {
      await source.setControl(conversation.id, target, trimmed);
      toast('ok', done);
      onDone();
      onClose();
    } catch (exc) {
      setError(exc instanceof Error ? exc.message : 'Perubahan belum tersimpan.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal
      open
      onClose={busy ? () => undefined : onClose}
      title={title}
      footer={
        <>
          <Button onClick={onClose} disabled={busy}>Batal</Button>
          {dnc ? (
            <button
              type="button"
              onClick={submit}
              disabled={!valid || busy}
              className="inline-flex h-9 items-center justify-center rounded-lg bg-danger px-3.5 text-[13px] font-medium text-white hover:opacity-90 disabled:opacity-50"
            >
              {busy ? 'Menyimpan…' : action}
            </button>
          ) : (
            <Button variant="primary" onClick={submit} disabled={!valid || busy}>{busy ? 'Menyimpan…' : action}</Button>
          )}
        </>
      }
    >
      <p className="text-[14px]">
        <b>{conversation.name}</b> · dari <b>{controlLabel[conversation.control]}</b> ke <b>{controlLabel[target]}</b>
      </p>
      <ul className={`mt-3 flex flex-col gap-1.5 rounded-xl border px-4 py-3 text-[13px] ${dnc ? 'border-danger/20 bg-danger-soft text-danger' : 'border-line bg-surface text-ink-soft'}`}>
        {CONSEQUENCE[target].map(line => <li key={line} className="flex gap-2"><span aria-hidden>•</span><span>{line}</span></li>)}
      </ul>
      <div className="mt-4">
        <label htmlFor="control-reason" className="mb-1.5 block text-[13px] font-medium">Alasan (tercatat di riwayat)</label>
        <textarea
          id="control-reason"
          value={reason}
          maxLength={500}
          rows={3}
          onChange={e => setReason(e.target.value)}
          className={`${inputClass} resize-y`}
        />
        <div className={`mt-1 text-right text-[12px] tabular ${trimmed.length === 0 ? 'text-danger' : 'text-muted'}`}>
          {trimmed.length === 0 ? 'Alasan wajib diisi · ' : ''}{reason.length}/500
        </div>
      </div>
      {dnc && (
        <div className="mt-2">
          <label htmlFor="control-confirm" className="mb-1.5 block text-[13px] font-medium">Ketik <b>{conversation.name}</b> untuk konfirmasi</label>
          <input id="control-confirm" value={confirmName} onChange={e => setConfirmName(e.target.value)} autoComplete="off" className={inputClass} />
        </div>
      )}
      {error && <p role="alert" className="mt-3 rounded-lg border border-danger/20 bg-danger-soft px-3 py-2 text-[13px] text-danger">Belum tersimpan: {error}</p>}
    </Modal>
  );
}
