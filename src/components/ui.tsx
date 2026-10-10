import { X } from 'lucide-react';
import { useEffect, useRef, type ButtonHTMLAttributes, type ReactNode } from 'react';
import { agent } from '../config/workspace';
import { initials } from '../lib/format';

export type Tone = 'ok' | 'warn' | 'danger' | 'info' | 'busy' | 'gray' | 'unknown' | 'accent';

const toneClass: Record<Tone, string> = {
  ok: 'bg-ok-soft text-ok',
  warn: 'bg-warn-soft text-warn',
  danger: 'bg-danger-soft text-danger',
  info: 'bg-info-soft text-info',
  busy: 'bg-busy-soft text-busy',
  gray: 'bg-line-soft text-ink-soft',
  unknown: 'pill-unknown',
  accent: 'bg-accent-soft text-accent',
};

export function Pill({ tone = 'gray', dot, children, title }: { tone?: Tone; dot?: boolean; children: ReactNode; title?: string }) {
  return (
    <span title={title} className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-2 text-[12px] font-medium leading-5 ${toneClass[tone]}`}>
      {dot && <span className="size-1.5 rounded-full bg-current" aria-hidden />}
      {children}
    </span>
  );
}

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'accent';
const variantClass: Record<ButtonVariant, string> = {
  primary: 'bg-ink text-white hover:bg-[#1F2937] disabled:bg-faint',
  secondary: 'border border-line bg-card text-ink hover:bg-surface disabled:text-faint',
  ghost: 'text-ink-soft hover:bg-line-soft disabled:text-faint',
  danger: 'border border-danger/25 bg-card text-danger hover:bg-danger-soft',
  accent: 'bg-accent text-white hover:bg-[#1D4ED8]',
};

export function Button({
  variant = 'secondary', size = 'md', icon, children, className = '', ...rest
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: ButtonVariant; size?: 'sm' | 'md'; icon?: ReactNode }) {
  return (
    <button
      type="button"
      {...rest}
      className={`inline-flex shrink-0 items-center justify-center gap-1.5 whitespace-nowrap rounded-lg font-medium transition-colors ${
        size === 'sm' ? 'h-8 px-3 text-[13px]' : 'h-9 px-3.5 text-[13px]'
      } ${variantClass[variant]} ${className}`}
    >
      {icon}
      {children}
    </button>
  );
}

export function IconButton({ label, children, className = '', ...rest }: ButtonHTMLAttributes<HTMLButtonElement> & { label: string }) {
  return (
    <button type="button" aria-label={label} title={label} {...rest} className={`grid size-9 shrink-0 place-items-center rounded-lg text-ink-soft hover:bg-line-soft ${className}`}>
      {children}
    </button>
  );
}

export function Card({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <section className={`rounded-xl border border-line bg-card shadow-[var(--shadow-card)] ${className}`}>{children}</section>;
}

export function Overline({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <div className={`text-[12px] font-semibold uppercase tracking-[0.06em] text-muted ${className}`}>{children}</div>;
}

export function AgentAvatar({ id, size = 32, status, name }: { id: string | null | undefined; size?: number; status?: 'online' | 'busy' | 'idle' | 'unknown'; name?: string }) {
  const entry = agent(id);
  const label = name ?? entry.displayName;
  const statusColor = { online: '#12B76A', busy: '#7A5AF8', idle: '#98A2B3', unknown: '' }[status ?? 'idle'];
  return (
    <span
      className="relative grid shrink-0 place-items-center rounded-full font-semibold text-white"
      style={{ width: size, height: size, background: entry.hue, fontSize: Math.max(10, size / 2.7) }}
      aria-label={label}
      title={`${label} · ${entry.title}`}
    >
      {initials(label)}
      {status && (
        <span
          className={`absolute -bottom-px -right-px rounded-full border-2 border-white ${status === 'unknown' ? 'pill-unknown' : ''}`}
          style={{ width: Math.max(8, size / 3.4), height: Math.max(8, size / 3.4), background: statusColor || undefined }}
        />
      )}
    </span>
  );
}

const palette = [
  ['#E0EAFF', '#2563EB'], ['#FEF0C7', '#B54708'], ['#EBE9FE', '#5925DC'], ['#D1FADF', '#027A48'],
  ['#FCE7F6', '#C11574'], ['#E0F2FE', '#026AA2'], ['#FFE4E8', '#C01048'],
];

/** Businesses get a stable pastel from their name so lists are scannable. */
export function BusinessAvatar({ name, size = 40, channel }: { name: string; size?: number; channel?: 'whatsapp' | 'telegram' }) {
  let hash = 0;
  for (const ch of name) hash = (hash * 31 + ch.charCodeAt(0)) >>> 0;
  const [bg, fg] = palette[hash % palette.length];
  return (
    <span className="relative grid shrink-0 place-items-center rounded-full font-semibold" style={{ width: size, height: size, background: bg, color: fg, fontSize: size / 3 }}>
      {initials(name)}
      {channel && (
        <span className="absolute -bottom-0.5 -right-0.5 size-4 rounded-full border-2 border-white" style={{ background: channel === 'whatsapp' ? '#25D366' : '#229ED9' }} aria-label={channel} />
      )}
    </span>
  );
}

export function Skeleton({ className = '' }: { className?: string }) {
  return <div className={`animate-pulse rounded-lg bg-line-soft ${className}`} />;
}

export function EmptyState({ icon, title, children, action }: { icon?: ReactNode; title: string; children?: ReactNode; action?: ReactNode }) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 px-6 py-12 text-center">
      {icon && <div className="mb-1 grid size-11 place-items-center rounded-xl border border-line bg-card text-muted">{icon}</div>}
      <div className="font-display text-[17px] font-semibold">{title}</div>
      {children && <p className="max-w-[420px] text-[13px] text-muted">{children}</p>}
      {action && <div className="mt-2">{action}</div>}
    </div>
  );
}

export function ErrorBanner({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <div role="alert" className="flex items-center gap-3 rounded-xl border border-danger/20 bg-danger-soft px-4 py-3 text-[13px] text-danger">
      <span className="flex-1">{message}</span>
      {onRetry && <Button size="sm" variant="danger" onClick={onRetry}>Coba lagi</Button>}
    </div>
  );
}

export function Tabs<T extends string>({ value, options, onChange, label }: { value: T; options: { value: T; label: string; count?: number }[]; onChange: (v: T) => void; label: string }) {
  return (
    <div role="tablist" aria-label={label} className="flex gap-0.5 rounded-[10px] bg-line-soft p-[3px]">
      {options.map(o => (
        <button
          key={o.value}
          role="tab"
          aria-selected={o.value === value}
          onClick={() => onChange(o.value)}
          className={`flex flex-1 items-center justify-center gap-1.5 whitespace-nowrap rounded-lg px-2.5 py-1 text-[13px] font-medium ${
            o.value === value ? 'bg-card text-ink shadow-[var(--shadow-card)]' : 'text-muted hover:text-ink'
          }`}
        >
          {o.label}
          {o.count !== undefined && <span className="tabular text-[12px] text-muted">{o.count}</span>}
        </button>
      ))}
    </div>
  );
}

export function Modal({ open, onClose, title, children, footer, width = 520 }: { open: boolean; onClose: () => void; title: string; children: ReactNode; footer?: ReactNode; width?: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const closeRef = useRef(onClose);
  closeRef.current = onClose;
  useEffect(() => {
    if (!open) return;
    const previous = document.activeElement as HTMLElement | null;
    const root = ref.current;
    // Prefer the first form field; fall back to the first body button, then the close button.
    (root?.querySelector<HTMLElement>('[data-modal-body] textarea, [data-modal-body] input, [data-modal-body] select')
      ?? root?.querySelector<HTMLElement>('[data-modal-body] button, [data-modal-footer] button')
      ?? root?.querySelector<HTMLElement>('button'))?.focus();
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && closeRef.current();
    window.addEventListener('keydown', onKey);
    return () => {
      window.removeEventListener('keydown', onKey);
      previous?.focus();
    };
  }, [open]);
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[70] grid place-items-center bg-ink/30 p-4 backdrop-blur-[2px]" onMouseDown={e => e.target === e.currentTarget && onClose()}>
      <div ref={ref} role="dialog" aria-modal="true" aria-label={title} className="w-full overflow-hidden rounded-2xl bg-card shadow-[var(--shadow-float)]" style={{ maxWidth: width }}>
        <div className="flex items-center justify-between border-b border-line px-5 py-4">
          <h2 className="text-[16px] font-semibold">{title}</h2>
          <IconButton label="Tutup" onClick={onClose}><X size={18} /></IconButton>
        </div>
        <div data-modal-body className="max-h-[70vh] overflow-y-auto px-5 py-4">{children}</div>
        {footer && <div data-modal-footer className="flex flex-wrap justify-end gap-2 border-t border-line bg-surface px-5 py-3">{footer}</div>}
      </div>
    </div>
  );
}

export function Field({ label, hint, children, htmlFor }: { label: string; hint?: ReactNode; children: ReactNode; htmlFor: string }) {
  return (
    <div className="mb-4">
      <label htmlFor={htmlFor} className="mb-1.5 block text-[13px] font-medium">{label}</label>
      {children}
      {hint && <div className="mt-1.5 text-[12px] leading-[18px] text-muted">{hint}</div>}
    </div>
  );
}

export const inputClass = 'w-full rounded-lg border border-line bg-card px-3 py-2 text-[14px] outline-none placeholder:text-faint focus:border-accent focus:ring-2 focus:ring-accent-line';

export function DataAge({ loadedAt }: { loadedAt: number | null }) {
  if (!loadedAt) return null;
  return <span className="text-[12px] text-muted">Diperbarui {new Intl.DateTimeFormat('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' }).format(loadedAt)}</span>;
}
