import { FileText, MessagesSquare } from 'lucide-react';
import { href } from '../../lib/router';

export interface ObjectRef { kind: 'draft' | 'conversation'; id: string }

const REF = /\b(ob|cv)_[0-9a-f]{16}\b/g;
const MAX = 8;

/** Draft (ob_…) and sales conversation (cv_…) ids an agent mentions, in order, once each. */
export function objectRefs(text: string): ObjectRef[] {
  const seen = new Set<string>();
  const out: ObjectRef[] = [];
  for (const match of text.matchAll(REF)) {
    if (seen.has(match[0]) || out.length >= MAX) continue;
    seen.add(match[0]);
    out.push({ kind: match[1] === 'ob' ? 'draft' : 'conversation', id: match[0] });
  }
  return out;
}

/** Clickable cards under a message for the objects it refers to. Renders nothing when there are none. */
export function ObjectCards({ text }: { text: string }) {
  const refs = objectRefs(text);
  if (!refs.length) return null;
  return (
    <ul className="mt-2 flex flex-wrap gap-2" aria-label="Objek yang disebut">
      {refs.map(r => (
        <li key={r.id}>
          <a
            href={r.kind === 'draft' ? href('keputusan', r.id) : href('percakapan', r.id)}
            className="inline-flex max-w-full items-center gap-2 rounded-lg border border-line bg-card px-2.5 py-1.5 text-[13px] hover:border-accent hover:bg-accent-soft"
          >
            {r.kind === 'draft' ? <FileText size={14} className="shrink-0 text-accent" aria-hidden /> : <MessagesSquare size={14} className="shrink-0 text-accent" aria-hidden />}
            <span className="font-medium">{r.kind === 'draft' ? 'Draf' : 'Percakapan'}</span>
            <span className="truncate font-mono text-[12px] text-muted">{r.id}</span>
          </a>
        </li>
      ))}
    </ul>
  );
}
