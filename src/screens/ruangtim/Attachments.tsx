import { Download, Eye, FileAudio, FileImage, FileText, FileVideo, File as FileIcon, Loader2 } from 'lucide-react';
import { useCallback, useEffect, useState, type ReactNode } from 'react';
import { Button, Modal } from '../../components/ui';
import { useSource } from '../../lib/data';
import { RichText } from './Composer';
import { identityOf } from './model';

type Kind = 'image' | 'text' | 'markdown' | 'pdf' | 'audio' | 'video' | 'other';

function kindOf(name: string): Kind {
  const ext = name.toLowerCase().split('.').pop() ?? '';
  if (['png', 'jpg', 'jpeg', 'webp', 'gif'].includes(ext)) return 'image';
  if (ext === 'md') return 'markdown';
  if (['txt', 'csv', 'json', 'log', 'html', 'htm', 'xml', 'svg'].includes(ext)) return 'text';
  if (ext === 'pdf') return 'pdf';
  if (['mp3', 'ogg', 'oga', 'wav', 'm4a'].includes(ext)) return 'audio';
  if (['mp4', 'webm', 'mov'].includes(ext)) return 'video';
  return 'other';
}

const kindIcon: Record<Kind, ReactNode> = {
  image: <FileImage size={18} />, text: <FileText size={18} />, markdown: <FileText size={18} />, pdf: <FileText size={18} />,
  audio: <FileAudio size={18} />, video: <FileVideo size={18} />, other: <FileIcon size={18} />,
};
const kindLabel: Record<Kind, string> = {
  image: 'Gambar', text: 'Teks', markdown: 'Dokumen', pdf: 'PDF', audio: 'Audio', video: 'Video', other: 'File',
};

const fileName = (path: string) => path.split('/').pop() || path;

/** Files an agent shared in the conversation (Hermes "MEDIA:" lines), with in-place preview. */
export function Attachments({ agentId, paths }: { agentId: string; paths: string[] }) {
  const source = useSource();
  const [open, setOpen] = useState<string | null>(null);
  const name = identityOf(agentId).name;
  if (!paths.length) return null;
  return (
    <div className="mt-2 flex flex-col gap-2">
      {paths.map(path => {
        const file = fileName(path);
        const kind = kindOf(file);
        const url = source.agentMediaUrl(agentId, path);
        const download = source.agentMediaUrl(agentId, path, true);
        return (
          <div key={path} className="flex max-w-[460px] items-center gap-3 rounded-xl border border-line bg-card px-3 py-2.5">
            <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-accent-soft text-accent">{kindIcon[kind]}</span>
            <div className="min-w-0 flex-1">
              <div className="truncate text-[13px] font-medium" title={file}>{file}</div>
              <div className="text-[12px] text-muted">{kindLabel[kind]} · dibagikan {name}</div>
            </div>
            <Button size="sm" variant="secondary" icon={<Eye size={14} />} onClick={() => setOpen(path)}>Lihat</Button>
            {download && (
              <a href={download} download={file} aria-label={`Unduh ${file}`} title="Unduh" className="grid size-8 shrink-0 place-items-center rounded-lg text-ink-soft hover:bg-line-soft">
                <Download size={16} />
              </a>
            )}
            {url === null && <span className="sr-only">Unduhan tidak tersedia di mode demo</span>}
          </div>
        );
      })}
      {open && <Preview agentId={agentId} path={open} onClose={() => setOpen(null)} />}
    </div>
  );
}

function Preview({ agentId, path, onClose }: { agentId: string; path: string; onClose: () => void }) {
  const source = useSource();
  const name = fileName(path);
  const kind = kindOf(name);
  const url = source.agentMediaUrl(agentId, path);
  const [text, setText] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const close = useCallback(() => onClose(), [onClose]);

  useEffect(() => {
    if (kind !== 'text' && kind !== 'markdown') return;
    let alive = true;
    source.agentMediaText(agentId, path).then(t => alive && setText(t)).catch(e => alive && setError(e instanceof Error ? e.message : 'Lampiran tidak bisa dibuka.'));
    return () => { alive = false; };
  }, [agentId, kind, path, source]);

  const download = source.agentMediaUrl(agentId, path, true);
  return (
    <Modal open onClose={close} title={name} width={kind === 'image' || kind === 'markdown' ? 860 : 640}
      footer={<>
        {url && (kind === 'pdf' || kind === 'other') && <a href={url} target="_blank" rel="noopener noreferrer" className="inline-flex h-9 items-center rounded-lg border border-line bg-card px-3.5 text-[13px] font-medium hover:bg-surface">Buka di tab baru</a>}
        {download && <a href={download} download={name} className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-ink px-3.5 text-[13px] font-medium text-white"><Download size={15} /> Unduh</a>}
        <Button onClick={close}>Tutup</Button>
      </>}>
      {kind === 'image' && (url ? <img src={url} alt={name} className="mx-auto max-h-[60vh] rounded-lg" /> : <p className="text-muted">Pratinjau gambar tidak tersedia di mode demo.</p>)}
      {kind === 'audio' && url && <audio controls src={url} className="w-full" />}
      {kind === 'video' && url && <video controls src={url} className="max-h-[60vh] w-full rounded-lg" />}
      {(kind === 'pdf' || kind === 'other') && <p className="text-[13px] text-muted">Pratinjau langsung belum tersedia untuk {kindLabel[kind].toLowerCase()}. Buka di tab baru atau unduh.</p>}
      {(kind === 'text' || kind === 'markdown') && (
        error ? <p role="alert" className="text-[13px] text-danger">{error}</p>
          : text === null ? <div className="flex items-center gap-2 text-[13px] text-muted"><Loader2 size={14} className="animate-spin" /> Memuat…</div>
            : kind === 'markdown' ? <Markdown text={text} /> : <pre className="max-h-[60vh] overflow-auto whitespace-pre-wrap break-words rounded-lg bg-surface p-3 font-mono text-[12px] leading-5">{text}</pre>
      )}
    </Modal>
  );
}

/** Small, safe markdown subset (headings, tables, lists, bold, paragraphs). Never injects HTML. */
export function Markdown({ text }: { text: string }) {
  const lines = text.replace(/\r\n/g, '\n').split('\n');
  const blocks: ReactNode[] = [];
  let i = 0;
  while (i < lines.length) {
    const line = lines[i];
    if (!line.trim()) { i++; continue; }
    const heading = /^(#{1,4})\s+(.*)$/.exec(line);
    if (heading) {
      const size = ['text-[20px]', 'text-[17px]', 'text-[15px]', 'text-[14px]'][heading[1].length - 1];
      blocks.push(<div key={i} className={`${size} mt-3 font-semibold first:mt-0`}><RichText text={heading[2]} /></div>);
      i++; continue;
    }
    if (line.trim().startsWith('|')) {
      const rows: string[][] = [];
      while (i < lines.length && lines[i].trim().startsWith('|')) {
        const cells = lines[i].trim().replace(/^\||\|$/g, '').split('|').map(c => c.trim());
        if (!cells.every(c => /^:?-{2,}:?$/.test(c))) rows.push(cells);
        i++;
      }
      const [head, ...body] = rows;
      blocks.push(
        <div key={`t${i}`} className="my-2 overflow-x-auto rounded-lg border border-line">
          <table className="w-full border-collapse text-left text-[13px]">
            <thead className="bg-surface"><tr>{head?.map((c, k) => <th key={k} className="border-b border-line px-3 py-2 font-semibold">{c}</th>)}</tr></thead>
            <tbody>{body.map((r, k) => <tr key={k} className="border-t border-line-soft">{r.map((c, j) => <td key={j} className="px-3 py-2 align-top"><RichText text={c} /></td>)}</tr>)}</tbody>
          </table>
        </div>,
      );
      continue;
    }
    if (/^\s*([-*]|\d+\.)\s+/.test(line)) {
      const items: string[] = [];
      while (i < lines.length && /^\s*([-*]|\d+\.)\s+/.test(lines[i])) { items.push(lines[i].replace(/^\s*([-*]|\d+\.)\s+/, '')); i++; }
      blocks.push(<ul key={`l${i}`} className="my-1 list-disc pl-5">{items.map((t, k) => <li key={k}><RichText text={t} /></li>)}</ul>);
      continue;
    }
    const para: string[] = [];
    while (i < lines.length && lines[i].trim() && !/^(#{1,4}\s|\s*\||\s*([-*]|\d+\.)\s)/.test(lines[i])) { para.push(lines[i]); i++; }
    blocks.push(<div key={`p${i}`} className="my-1.5"><RichText text={para.join('\n')} /></div>);
  }
  return <div className="max-h-[60vh] overflow-y-auto pr-1">{blocks}</div>;
}
