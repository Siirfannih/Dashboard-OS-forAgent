import { Minus, Plus } from 'lucide-react';
import { useLayoutEffect, useRef, useState } from 'react';
import { salesWorkflow, type RoutedEdge } from '../../config/workflow';
import { useToast } from '../../lib/data';
import type { FlowNode } from '../../lib/types';
import {
  effectiveValue, hasFailure, isRunning, nodeStatus, pcSignal, type Draft, type LiveData, type Overrides,
} from './model';
import { NodeView, StatusPills } from './NodeView';

interface Box { x: number; y: number; w: number; h: number }
interface Geo { d: string; label?: { x: number; y: number; anchor: 'center' | 'left' }; plus?: { x: number; y: number } }

const WIDTH = 1000;
const estimate = (n: FlowNode): { w: number; h: number } =>
  n.type === 'decision' ? { w: 56, h: 56 } : n.type === 'trigger' ? { w: 290, h: 40 } : n.type === 'end' ? { w: 150, h: 40 } : { w: 290, h: 200 };

function route(edge: RoutedEdge, a: Box, b: Box): Geo {
  const acx = a.x + a.w / 2, bcx = b.x + b.w / 2, acy = a.y + a.h / 2, bcy = b.y + b.h / 2;
  switch (edge.route ?? 'down') {
    case 'branch': {
      const sx = bcx < acx ? a.x : a.x + a.w;
      return { d: `M${sx} ${acy} H${bcx} V${b.y}`, label: { x: (sx + bcx) / 2, y: acy, anchor: 'center' }, plus: { x: bcx, y: (acy + b.y) / 2 + 6 } };
    }
    case 'side': {
      const y = Math.max(a.y, b.y) + 44;
      const ltr = bcx > acx;
      const sx = ltr ? a.x + a.w : a.x, ex = ltr ? b.x : b.x + b.w;
      return { d: `M${sx} ${y} H${ex}`, label: { x: (sx + ex) / 2 + 12, y, anchor: 'center' }, plus: { x: sx + (ltr ? 22 : -22), y } };
    }
    case 'loop-right': {
      const gx = Math.max(a.x + a.w, b.x + b.w) + 36;
      return { d: `M${a.x + a.w} ${acy} H${gx} V${bcy} H${b.x + b.w}`, label: { x: (gx + b.x + b.w) / 2, y: bcy, anchor: 'center' } };
    }
    case 'loop-left': {
      const gx = Math.min(a.x, b.x) - 44;
      return { d: `M${a.x} ${acy} H${gx} V${bcy} H${b.x}`, label: { x: gx, y: (acy + bcy) / 2, anchor: 'center' } };
    }
    default: {
      const y1 = a.y + a.h, y2 = b.y, my = (y1 + y2) / 2;
      const d = Math.abs(acx - bcx) < 1 ? `M${acx} ${y1} V${y2}` : `M${acx} ${y1} V${my} H${bcx} V${y2}`;
      return { d, label: { x: bcx + 18, y: my, anchor: 'left' }, plus: { x: bcx, y: my } };
    }
  }
}

export function Canvas({ selectedId, onSelect, editing, overrides, draft, changedByNode, live }: {
  selectedId?: string;
  onSelect: (id: string) => void;
  editing: boolean;
  overrides: Overrides;
  draft: Draft;
  changedByNode: Map<string, Set<string>>;
  live: LiveData | undefined;
}) {
  const toast = useToast();
  const [zoom, setZoom] = useState(1);
  const refs = useRef(new Map<string, HTMLElement>());
  const [sizes, setSizes] = useState<Record<string, { w: number; h: number }>>({});

  useLayoutEffect(() => {
    const measure = () => {
      setSizes(prev => {
        let changed = false;
        const next: Record<string, { w: number; h: number }> = {};
        for (const [id, el] of refs.current) {
          next[id] = { w: el.offsetWidth, h: el.offsetHeight };
          if (prev[id]?.w !== next[id].w || prev[id]?.h !== next[id].h) changed = true;
        }
        return changed ? next : prev;
      });
    };
    measure();
    const observer = new ResizeObserver(measure);
    for (const el of refs.current.values()) observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const nodes = salesWorkflow.nodes;
  const box = (id: string): Box | null => {
    const n = nodes.find(x => x.id === id);
    if (!n) return null;
    const s = sizes[id] ?? estimate(n);
    return { x: n.x, y: n.y, w: s.w, h: s.h };
  };
  const height = Math.max(...nodes.map(n => n.y + (sizes[n.id] ?? estimate(n)).h)) + 140;
  const geos = salesWorkflow.edges.map(e => {
    const a = box(e.from), b = box(e.to);
    return a && b ? { edge: e, geo: route(e, a, b) } : null;
  }).filter(Boolean) as { edge: RoutedEdge; geo: Geo }[];
  const signal = pcSignal(live);
  const nodeName = (id: string) => nodes.find(n => n.id === id)?.title ?? id;

  const setZoomClamped = (z: number) => setZoom(Math.min(1.5, Math.max(0.5, Math.round(z * 10) / 10)));

  return (
    <div className="relative min-w-0 flex-1">
      <div className="dotgrid absolute inset-0 overflow-auto" role="region" aria-label="Kanvas alur kerja">
        <div className="relative mx-auto" style={{ width: WIDTH * zoom, height: height * zoom }}>
          <div className="absolute left-0 top-0 origin-top-left" style={{ width: WIDTH, height, transform: `scale(${zoom})` }}>
            <svg className="pointer-events-none absolute inset-0" width={WIDTH} height={height} fill="none" aria-hidden>
              <defs>
                <marker id="ak-arrow" viewBox="0 0 8 8" refX="7" refY="4" markerWidth="8" markerHeight="8" orient="auto-start-reverse">
                  <path d="M0 0 L8 4 L0 8 z" fill="var(--color-faint)" />
                </marker>
              </defs>
              {geos.map(({ edge, geo }) => (
                <path
                  key={`${edge.from}-${edge.to}`}
                  d={geo.d}
                  stroke="var(--color-faint)"
                  strokeWidth={1.5}
                  strokeDasharray={edge.dashed ? '5 5' : undefined}
                  strokeLinejoin="round"
                  markerEnd="url(#ak-arrow)"
                />
              ))}
            </svg>

            {geos.map(({ edge, geo }) => geo.label && edge.label && (
              <span
                key={`l-${edge.from}-${edge.to}`}
                className="pointer-events-none absolute whitespace-nowrap rounded-full border border-line bg-card px-2 text-[12px] leading-5 text-muted"
                style={{ left: geo.label.x, top: geo.label.y, transform: geo.label.anchor === 'center' ? 'translate(-50%,-50%)' : 'translate(0,-50%)' }}
              >
                {edge.label}
              </span>
            ))}

            {nodes.map(node => {
              const limits: Record<string, string> = {};
              for (const l of node.limits ?? []) limits[l.key] = effectiveValue(node, `limit.${l.key}`, overrides, draft) ?? l.value;
              const host = effectiveValue(node, 'host', overrides, draft);
              const activeHost = overrides[`${node.id}.host`] ?? node.host;
              const status = nodeStatus(node, live);
              return (
                <div key={node.id}>
                  <NodeView
                    ref={el => { if (el) refs.current.set(node.id, el); else refs.current.delete(node.id); }}
                    node={node}
                    values={{ host, limits }}
                    changedFields={changedByNode.get(node.id) ?? new Set()}
                    status={status}
                    hostSignal={node.id === 'research' && activeHost === 'pc' && host === 'pc' ? signal : null}
                    selected={node.id === selectedId}
                    running={isRunning(node, live)}
                    failed={hasFailure(node, live)}
                    onSelect={() => onSelect(node.id)}
                  />
                  {node.type === 'decision' && (
                    <div
                      className="absolute flex w-[210px] -translate-x-1/2 cursor-pointer flex-col items-center gap-1 text-center"
                      style={{ left: node.x + 28, top: node.y + 62 }}
                      onClick={() => onSelect(node.id)}
                    >
                      <div className="rounded-md bg-card/90 px-1.5 text-[13px] font-semibold leading-5">{node.n}. {node.title}</div>
                      <div className="text-[12px] leading-4 text-muted">Bukti ≤ 24 jam · HTTP 200 · bukan duplikat · bukan DNC</div>
                      <div className="flex flex-wrap justify-center gap-1"><StatusPills pills={status} /></div>
                    </div>
                  )}
                </div>
              );
            })}

            {editing && geos.map(({ edge, geo }) => geo.plus && !edge.dashed && (
              <button
                key={`p-${edge.from}-${edge.to}`}
                type="button"
                aria-label={`Tambah langkah antara ${nodeName(edge.from)} dan ${nodeName(edge.to)}`}
                title="Tambah langkah"
                onClick={() => toast('info', 'Menambah langkah baru akan tersedia setelah proposal pertama berjalan. Untuk sekarang kamu bisa mengubah pelaksana dan batas.')}
                className="absolute grid size-6 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full border-[1.5px] border-accent bg-card text-accent shadow-[var(--shadow-card)] hover:bg-accent-soft"
                style={{ left: geo.plus.x, top: geo.plus.y }}
              >
                <Plus size={13} aria-hidden />
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="absolute right-3 top-3 z-10 flex items-center rounded-lg border border-line bg-card text-[12px] shadow-[var(--shadow-card)]">
        <button type="button" aria-label="Perkecil" title="Perkecil" disabled={zoom <= 0.5} onClick={() => setZoomClamped(zoom - 0.1)} className="grid size-8 place-items-center text-ink-soft hover:bg-line-soft disabled:text-faint"><Minus size={14} /></button>
        <button type="button" aria-label="Kembali ke 100%" title="Kembali ke 100%" onClick={() => setZoom(1)} className="tabular h-8 min-w-12 border-x border-line px-2 font-medium text-ink-soft hover:bg-line-soft">{Math.round(zoom * 100)}%</button>
        <button type="button" aria-label="Perbesar" title="Perbesar" disabled={zoom >= 1.5} onClick={() => setZoomClamped(zoom + 0.1)} className="grid size-8 place-items-center text-ink-soft hover:bg-line-soft disabled:text-faint"><Plus size={14} /></button>
      </div>

      <div className="pointer-events-none absolute bottom-3 left-3 z-10 hidden flex-wrap items-center gap-x-3 gap-y-1 rounded-lg border border-line bg-card/95 px-3 py-1.5 text-[12px] text-muted shadow-[var(--shadow-card)] xl:flex">
        <span><b className="font-medium text-muted">Otomatis</b></span>
        <span><b className="font-medium text-ink">Manusia</b></span>
        <span><b className="font-medium text-warn">Gerbang</b></span>
        <span><b className="font-medium text-danger">Pengaman</b></span>
        <span className="flex items-center gap-1.5"><svg width="22" height="2" aria-hidden><line x1="0" y1="1" x2="22" y2="1" stroke="var(--color-faint)" strokeWidth="1.5" strokeDasharray="4 4" /></svg>jalur ulang</span>
      </div>
    </div>
  );
}
