import { Check, Clock, Flag, Lock, MessageCircle, Server, ShieldCheck, User } from 'lucide-react';
import { forwardRef, type ReactNode } from 'react';
import { AgentAvatar, Pill } from '../../components/ui';
import { hostLabel, limitChip } from '../../config/workflow';
import type { FlowNode } from '../../lib/types';
import { displayValue, typeMeta, type StatusPill } from './model';

export function ExecutorIcon({ node, size = 28 }: { node: FlowNode; size?: number }) {
  if (node.executor === 'whatsapp') {
    return (
      <span className="grid shrink-0 place-items-center rounded-full bg-[#25D366] text-white" style={{ width: size, height: size }} aria-label="WhatsApp" title="Kanal WhatsApp">
        <MessageCircle size={Math.round(size * 0.55)} aria-hidden />
      </span>
    );
  }
  if (node.executor === 'owner') {
    return (
      <span className="grid shrink-0 place-items-center rounded-full bg-ink text-white" style={{ width: size, height: size }} aria-label="Kamu" title="Kamu · Pemilik">
        <User size={Math.round(size * 0.55)} aria-hidden />
      </span>
    );
  }
  if (node.executor === 'validator') {
    const Icon = node.type === 'trigger' ? Clock : node.type === 'end' ? Flag : ShieldCheck;
    return (
      <span className="grid shrink-0 place-items-center rounded-full bg-line-soft text-ink-soft" style={{ width: size, height: size }} aria-label="Aturan sistem" title="Aturan sistem">
        <Icon size={Math.round(size * 0.55)} aria-hidden />
      </span>
    );
  }
  return <AgentAvatar id={node.executor} size={size} />;
}

export function StatusPills({ pills }: { pills: StatusPill[] }) {
  return <>{pills.map(p => <Pill key={p.text} tone={p.tone} dot={p.dot} title={p.title}>{p.text}</Pill>)}</>;
}

export interface NodeViewProps {
  node: FlowNode;
  values: { host?: string; limits: Record<string, string> };
  changedFields: Set<string>;
  status: StatusPill[];
  hostSignal: StatusPill | null;
  selected: boolean;
  running: boolean;
  failed: boolean;
  onSelect: () => void;
}

const ring = 'border-accent shadow-[0_0_0_3px_var(--color-accent-line),var(--shadow-float)]';

/** One absolutely-positioned node on the canvas. The ref is measured to route edges. */
export const NodeView = forwardRef<HTMLButtonElement, NodeViewProps>(function NodeView(props, ref) {
  const { node, selected, onSelect } = props;
  const aria = `Langkah ${node.n}: ${node.title}`;
  const pos = { left: node.x, top: node.y };

  if (node.type === 'trigger' || node.type === 'end') {
    return (
      <button
        ref={ref}
        type="button"
        aria-label={aria}
        aria-pressed={selected}
        onClick={onSelect}
        style={pos}
        className={`absolute flex h-10 items-center justify-center gap-2 rounded-full border bg-card px-4 text-[13px] font-semibold shadow-[var(--shadow-card)] transition-shadow hover:shadow-[var(--shadow-float)] ${
          node.type === 'trigger' ? 'w-[290px]' : 'w-[150px] font-medium'
        } ${selected ? ring : 'border-line'}`}
      >
        {node.type === 'trigger' ? <Clock size={15} className="text-muted" aria-hidden /> : <Flag size={14} className="text-muted" aria-hidden />}
        {node.title}
      </button>
    );
  }

  if (node.type === 'decision') {
    return (
      <button
        ref={ref}
        type="button"
        aria-label={aria}
        aria-pressed={selected}
        onClick={onSelect}
        style={pos}
        className="group absolute grid size-14 place-items-center rounded-lg"
      >
        <span className={`grid size-10 rotate-45 place-items-center rounded-lg border bg-card shadow-[var(--shadow-card)] transition-shadow group-hover:shadow-[var(--shadow-float)] ${selected ? ring : 'border-line'}`}>
          <Check size={17} className="-rotate-45 text-ink-soft" aria-hidden />
        </span>
      </button>
    );
  }

  const { values, changedFields, status, hostSignal, running, failed } = props;
  const type = typeMeta[node.type];
  const chips: { key: string; text: string; changed: boolean }[] = [];
  for (const limit of node.limits ?? []) {
    const text = limitChip(node.id, limit.key, values.limits[limit.key] ?? limit.value, values.limits);
    const changed = changedFields.has(`limit.${limit.key}`) || (limit.key === 'window_start' && changedFields.has('limit.window_end'));
    if (text) chips.push({ key: limit.key, text, changed });
  }
  const hostChanged = changedFields.has('host');
  const anyChanged = changedFields.size > 0;

  return (
    <button
      ref={ref}
      type="button"
      aria-label={aria}
      aria-pressed={selected}
      onClick={onSelect}
      style={pos}
      className={`absolute w-[290px] rounded-xl border bg-card p-3.5 text-left shadow-[var(--shadow-card)] transition-shadow hover:shadow-[var(--shadow-float)] ${
        selected ? ring : failed ? 'border-danger/40' : 'border-line'
      }`}
    >
      {node.locked && (
        <span className="absolute right-2.5 top-2.5 text-warn" title="Rel pengaman — tidak bisa dihapus atau dilewati">
          <Lock size={14} aria-hidden />
        </span>
      )}
      <div className="flex items-start gap-3">
        <span className="grid size-10 shrink-0 place-items-center rounded-[10px] border border-line">
          <ExecutorIcon node={node} />
        </span>
        <div className="min-w-0 pr-4">
          <div className="text-[15px] font-semibold leading-5">{node.n}. {node.title}</div>
          <div className={`text-[12px] font-medium leading-[18px] ${type.className}`}>{type.label}</div>
        </div>
      </div>
      <p className="mb-2.5 mt-2 line-clamp-3 text-[13px] leading-[18px] text-muted">{node.description}</p>
      {chips.length > 0 && (
        <div className="flex flex-wrap items-center gap-1.5">
          {chips.map(c => (
            <span key={c.key} className={`inline-flex items-center rounded-md border px-1.5 text-[12px] leading-5 ${c.changed ? 'border-warn-line bg-warn-soft text-warn' : 'border-line bg-card text-ink-soft'}`}>
              {c.text}
            </span>
          ))}
        </div>
      )}
      {status.length > 0 && <div className="mt-2 flex flex-wrap items-center gap-1.5"><StatusPills pills={status} /></div>}
      {(values.host || anyChanged) && (
        <Row>
          <Server size={13} aria-hidden className="shrink-0" />
          <span className={hostChanged ? 'font-medium text-ink' : ''}>{values.host ? displayValue(node, 'host', values.host) || hostLabel[values.host] : '—'}</span>
          {anyChanged && <Pill tone="warn">diubah</Pill>}
          {hostSignal && <Pill tone={hostSignal.tone} dot={hostSignal.dot}>{hostSignal.text}</Pill>}
        </Row>
      )}
      {running && (
        <span className="absolute inset-x-3.5 -bottom-px h-0.5 overflow-hidden rounded-full bg-busy-soft" aria-hidden>
          <span className="block h-full w-3/5 animate-pulse rounded-full bg-busy" />
        </span>
      )}
    </button>
  );
});

function Row({ children }: { children: ReactNode }) {
  return <div className="mt-2 flex flex-wrap items-center gap-1.5 text-[12px] leading-5 text-muted">{children}</div>;
}
