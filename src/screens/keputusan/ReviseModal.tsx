import { useCallback, useEffect, useRef, useState } from 'react';
import { Button, Field, Modal, inputClass } from '../../components/ui';
import type { ReviewItem } from '../../lib/types';

export type DeclineAction = 'revise' | 'hold';

const MAX = 1000;

const choices: { value: DeclineAction; title: string; text: string }[] = [
  { value: 'revise', title: 'Revisi draf', text: 'Candra menulis versi baru berdasarkan catatanmu, lalu kembali ke sini untuk kamu tinjau.' },
  { value: 'hold', title: 'Tahan prospek', text: 'Percakapan ditahan dan prospek tidak dihubungi sampai kamu lepaskan. Ini bukan "jangan hubungi" permanen.' },
];

export function ReviseModal({ item, open, busy, error, onClose, onSubmit }: {
  item: ReviewItem;
  open: boolean;
  busy: boolean;
  error: string | null;
  onClose: () => void;
  onSubmit: (reason: string, action: DeclineAction) => void;
}) {
  const [reason, setReason] = useState('');
  const [action, setAction] = useState<DeclineAction>('revise');

  useEffect(() => {
    if (!open) return;
    setReason('');
    setAction('revise');
    // Modal focuses its first control (the close button); start in the reason field instead.
    document.getElementById('revise-reason')?.focus();
  }, [open, item.id]);

  // Modal re-runs its focus effect whenever onClose changes identity; keep it stable so focus doesn't jump.
  const latest = useRef({ busy, onClose });
  latest.current = { busy, onClose };
  const close = useCallback(() => { if (!latest.current.busy) latest.current.onClose(); }, []);

  const trimmed = reason.trim();
  const valid = trimmed.length >= 1 && trimmed.length <= MAX;
  const submit = () => valid && !busy && onSubmit(trimmed, action);

  return (
    <Modal
      open={open}
      onClose={close}
      title={`Minta revisi · ${item.name}`}
      footer={(
        <>
          <Button onClick={onClose} disabled={busy}>Batal</Button>
          <Button variant="primary" onClick={submit} disabled={!valid || busy}>
            {busy ? 'Menyimpan…' : action === 'revise' ? 'Minta versi baru' : 'Tahan prospek'}
          </Button>
        </>
      )}
    >
      <form onSubmit={e => { e.preventDefault(); submit(); }}>
        <Field
          label="Apa yang perlu diubah?"
          htmlFor="revise-reason"
          hint={<span className="flex justify-between gap-2"><span>Wajib diisi. Candra membaca catatan ini apa adanya.</span><span className={`tabular ${trimmed.length > MAX ? 'text-danger' : ''}`}>{trimmed.length}/{MAX}</span></span>}
        >
          <textarea
            id="revise-reason"
            rows={4}
            value={reason}
            maxLength={MAX + 200}
            onChange={e => setReason(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) submit(); }}
            placeholder="Contoh: jangan sebut kerusakan di kalimat pertama; tanya dulu cara pasien booking."
            className={`${inputClass} resize-y`}
            aria-invalid={trimmed.length > MAX}
          />
        </Field>

        <fieldset>
          <legend className="mb-1.5 text-[13px] font-medium">Lalu apa?</legend>
          <div className="flex flex-col gap-2">
            {choices.map(c => (
              <label
                key={c.value}
                className={`flex cursor-pointer gap-3 rounded-lg border p-3 has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-accent ${action === c.value ? 'border-accent bg-accent-soft' : 'border-line bg-card hover:bg-surface'}`}
              >
                <input type="radio" name="decline-action" value={c.value} checked={action === c.value} onChange={() => setAction(c.value)} className="mt-1 accent-[var(--color-accent)]" />
                <span>
                  <span className="block text-[14px] font-medium">{c.title}</span>
                  <span className="block text-[13px] text-muted">{c.text}</span>
                </span>
              </label>
            ))}
          </div>
        </fieldset>

        {error && <div role="alert" className="mt-4 rounded-lg border border-danger/20 bg-danger-soft px-3 py-2 text-[13px] text-danger">{error}</div>}
      </form>
    </Modal>
  );
}
