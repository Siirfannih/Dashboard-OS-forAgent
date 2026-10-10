import { Info, Send } from 'lucide-react';
import { Fragment, useEffect, useRef, type ReactNode } from 'react';
import { Button } from '../../components/ui';

/** Plain text with line breaks kept and **bold** spans. Never injects HTML. */
export function RichText({ text }: { text: string }) {
  const parts = text.split(/(\*\*[^*\n]+\*\*)/g);
  return (
    <div className="whitespace-pre-wrap break-words text-[14px] leading-[22px] text-ink">
      {parts.map((part, i) =>
        part.startsWith('**') && part.endsWith('**') && part.length > 4
          ? <strong key={i} className="font-semibold">{part.slice(2, -2)}</strong>
          : <Fragment key={i}>{part}</Fragment>,
      )}
    </div>
  );
}

export function Notice({ children, tone = 'gray' }: { children: ReactNode; tone?: 'gray' | 'warn' }) {
  return (
    <div className={`flex items-start gap-2 rounded-lg border px-3 py-2 text-[13px] leading-5 ${tone === 'warn' ? 'border-warn-line bg-warn-soft text-warn' : 'border-line bg-surface text-ink-soft'}`}>
      <Info size={15} className="mt-0.5 shrink-0" aria-hidden />
      <span>{children}</span>
    </div>
  );
}

/**
 * Enter sends, Shift+Enter adds a line. `blocked` closes the composer entirely
 * (agent cannot receive messages); `waiting` keeps typing open but holds sending.
 */
export function Composer({
  value, onChange, onSend, blocked, waiting, sending, placeholder, hint, before, autoFocus,
}: {
  value: string;
  onChange: (v: string) => void;
  onSend: () => void;
  blocked?: string | null;
  waiting?: string | null;
  sending?: boolean;
  placeholder: string;
  hint?: ReactNode;
  before?: ReactNode;
  autoFocus?: boolean;
}) {
  const ref = useRef<HTMLTextAreaElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = `${Math.min(el.scrollHeight, 200)}px`;
  }, [value]);
  useEffect(() => { if (autoFocus && !blocked) ref.current?.focus(); }, [autoFocus, blocked]);

  if (blocked) return <Notice>{blocked}</Notice>;

  const canSend = !!value.trim() && !waiting && !sending;
  return (
    <div className="rounded-xl border border-line bg-card shadow-[var(--shadow-card)] focus-within:border-accent focus-within:ring-2 focus-within:ring-accent-line">
      {before && <div className="border-b border-line-soft px-3 py-2">{before}</div>}
      <label className="sr-only" htmlFor="ruang-tim-composer">Tulis pesan</label>
      <textarea
        id="ruang-tim-composer"
        ref={ref}
        rows={2}
        value={value}
        maxLength={8000}
        placeholder={placeholder}
        onChange={e => onChange(e.target.value)}
        onKeyDown={e => {
          if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing) {
            e.preventDefault();
            if (canSend) onSend();
          }
        }}
        className="block min-h-[64px] w-full resize-none bg-transparent px-3 pt-3 text-[14px] leading-[22px] outline-none placeholder:text-muted"
      />
      <div className="flex flex-wrap items-center justify-between gap-2 px-3 pb-2.5 pt-1">
        <div className="min-w-0 flex-1 text-[12px] leading-[18px] text-muted">
          {waiting ?? hint ?? <>Enter untuk kirim · Shift+Enter baris baru</>}
        </div>
        <Button variant="primary" size="sm" icon={<Send size={14} />} disabled={!canSend} onClick={onSend}>
          {sending ? 'Mengirim…' : 'Kirim'}
        </Button>
      </div>
    </div>
  );
}
