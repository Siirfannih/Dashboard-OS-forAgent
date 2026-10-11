import { Info, Send } from 'lucide-react';
import { Fragment, useEffect, useRef, useState, type ReactNode } from 'react';
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
export interface Mention { handle: string; label: string }

const MENTION = /(^|\s)@([a-z0-9_-]*)$/i;

export function Composer({
  value, onChange, onSend, blocked, waiting, sending, placeholder, hint, before, autoFocus, mentions,
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
  /** Room members the owner can address with '@'. */
  mentions?: Mention[];
}) {
  const ref = useRef<HTMLTextAreaElement>(null);
  const [active, setActive] = useState(0);
  const [dismissed, setDismissed] = useState<string | null>(null);
  const typed = mentions?.length ? MENTION.exec(value) : null;
  const options = typed && dismissed !== value
    ? mentions!.filter(m => m.handle.toLowerCase().startsWith(typed[2].toLowerCase()) || m.label.toLowerCase().includes(typed[2].toLowerCase()))
    : [];
  const pickMention = (m: Mention) => {
    onChange(value.replace(MENTION, `$1@${m.handle} `));
    setActive(0);
    ref.current?.focus();
  };
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
          if (options.length) {
            if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
              e.preventDefault();
              setActive(i => (i + (e.key === 'ArrowDown' ? 1 : options.length - 1)) % options.length);
              return;
            }
            if ((e.key === 'Enter' || e.key === 'Tab') && !e.shiftKey) {
              e.preventDefault();
              pickMention(options[Math.min(active, options.length - 1)]);
              return;
            }
            if (e.key === 'Escape') {
              e.preventDefault();
              setDismissed(value);
              return;
            }
          }
          if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing) {
            e.preventDefault();
            if (canSend) onSend();
          }
        }}
        className="block min-h-[64px] w-full resize-none bg-transparent px-3 pt-3 text-[14px] leading-[22px] outline-none placeholder:text-muted"
        aria-autocomplete={mentions?.length ? 'list' : undefined}
        aria-controls={options.length ? 'mention-list' : undefined}
      />
      {options.length > 0 && (
        <ul id="mention-list" role="listbox" aria-label="Sebut anggota" className="mx-3 mb-1 max-h-48 overflow-y-auto rounded-lg border border-line bg-card py-1 shadow-[var(--shadow-card)]">
          {options.map((m, i) => (
            <li
              key={m.handle}
              role="option"
              aria-selected={i === Math.min(active, options.length - 1)}
              onMouseDown={e => { e.preventDefault(); pickMention(m); }}
              className={`flex cursor-pointer items-center gap-2 px-3 py-1.5 text-[13px] ${i === Math.min(active, options.length - 1) ? 'bg-accent-soft text-accent' : 'text-ink'}`}
            >
              <span className="font-mono">@{m.handle}</span>
              <span className="truncate text-muted">{m.label}</span>
            </li>
          ))}
        </ul>
      )}
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
