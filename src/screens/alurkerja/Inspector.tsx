import { ArrowRight, Check, ExternalLink, Lock, ShieldCheck, X } from 'lucide-react';
import { useState, type ReactNode } from 'react';
import { IconButton, Overline, Pill, Tabs, inputClass } from '../../components/ui';
import { agent } from '../../config/workspace';
import { hostLabel } from '../../config/workflow';
import { dateTime } from '../../lib/format';
import { href } from '../../lib/router';
import type { FlowNode, WorkflowProposal } from '../../lib/types';
import {
  TIME_RE, UNIT_RE, baseValue, currentValue, describeChange, displayValue, effectiveValue, nodeStatus, pcSignal,
  proposalStatus, typeMeta, type Draft, type LiveData, type Overrides,
} from './model';
import { ExecutorIcon, StatusPills } from './NodeView';

type Tab = 'pelaksana' | 'batas' | 'izin' | 'riwayat';

export interface InspectorProps {
  node: FlowNode;
  editing: boolean;
  /** False when the workflow API is missing or failed: everything is read-only. */
  canEdit: boolean;
  overrides: Overrides;
  draft: Draft;
  errors: Record<string, string>;
  onChange: (key: string, value: string) => void;
  live: LiveData | undefined;
  proposals: WorkflowProposal[];
  onClose: () => void;
}

export function Inspector(props: InspectorProps) {
  const { node, onClose } = props;
  const [tab, setTab] = useState<Tab>('pelaksana');
  const type = typeMeta[node.type];
  const touching = props.proposals.filter(p => p.changes.some(c => c.node_id === node.id));

  return (
    <div className="flex flex-col">
      <div className="border-b border-line px-[18px] pb-3 pt-4">
        <div className="flex items-start gap-2.5">
          <ExecutorIcon node={node} size={32} />
          <div className="min-w-0 flex-1">
            <h2 className="text-[15px] font-semibold leading-5">{node.n}. {node.title}</h2>
            <div className={`text-[12px] font-medium ${type.className}`}>{type.label}{node.locked ? ' · tidak bisa dihapus' : ''}</div>
          </div>
          <IconButton label="Tutup detail langkah" onClick={onClose} className="-mr-2 -mt-1"><X size={17} /></IconButton>
        </div>
        <div className="mt-3.5">
          <Tabs<Tab>
            label="Detail langkah"
            value={tab}
            onChange={setTab}
            options={[
              { value: 'pelaksana', label: 'Pelaksana' },
              { value: 'batas', label: 'Batas' },
              { value: 'izin', label: 'Izin' },
              { value: 'riwayat', label: 'Riwayat', count: touching.length || undefined },
            ]}
          />
        </div>
      </div>
      <div className="px-[18px] py-4" role="tabpanel" aria-label={tab}>
        {tab === 'pelaksana' && <ExecutorTab {...props} />}
        {tab === 'batas' && <LimitsTab {...props} />}
        {tab === 'izin' && <PermissionsTab node={node} />}
        {tab === 'riwayat' && <HistoryTab node={node} proposals={touching} />}
      </div>
    </div>
  );
}

function LockNote({ children }: { children: ReactNode }) {
  return (
    <div className="mb-4 flex gap-2 rounded-lg border border-warn-line bg-warn-soft px-3 py-2 text-[13px] leading-[18px] text-warn">
      <Lock size={15} className="mt-0.5 shrink-0" aria-hidden />
      <span>{children}</span>
    </div>
  );
}

function ExecutorTab({ node, editing, canEdit, overrides, draft, onChange, live }: InspectorProps) {
  const who = node.executor === 'whatsapp'
    ? { name: 'Kanal WhatsApp', title: 'Dikirim oleh Candra lewat sesi QR' }
    : node.executor === 'owner'
      ? { name: 'Kamu', title: 'Pemilik' }
      : { name: agent(node.executor).displayName, title: agent(node.executor).title };
  const active = currentValue(node, 'host', overrides);
  const value = effectiveValue(node, 'host', overrides, draft);
  const selected = node.hostOptions?.find(o => o.value === value);
  const status = nodeStatus(node, live);
  const signal = node.id === 'research' && active === 'pc' ? pcSignal(live) : null;
  const disabled = !editing || !!node.locked || !canEdit;

  return (
    <>
      {node.locked && (
        <LockNote>
          {node.id === 'approval'
            ? 'Rel pengaman. Jamnya bisa diatur, tetapi langkah ini tidak bisa dihapus atau dilewati.'
            : 'Rel pengaman. Langkah ini tidak bisa dihapus, dilewati, atau dipindah.'}
        </LockNote>
      )}
      <p className="mb-4 text-[13px] leading-5 text-ink-soft">{node.description}</p>

      <Overline className="mb-2">Pelaksana</Overline>
      <div className="mb-4 flex items-center gap-2.5">
        <ExecutorIcon node={node} size={28} />
        <div className="leading-4">
          <div className="text-[13px] font-semibold">{who.name}</div>
          <div className="text-[12px] text-muted">{who.title}</div>
        </div>
      </div>

      {node.hostOptions ? (
        <div className="mb-4">
          <label htmlFor={`host-${node.id}`} className="mb-1.5 block text-[13px] font-medium">Dijalankan di</label>
          <select
            id={`host-${node.id}`}
            className={`${inputClass} h-[38px] py-0 disabled:bg-surface disabled:text-muted`}
            value={value}
            disabled={disabled}
            onChange={e => onChange(`${node.id}.host`, e.target.value)}
          >
            {node.hostOptions.map(o => (
              <option key={o.value} value={o.value} disabled={!o.available}>{o.label}{o.available ? '' : ' — segera'}</option>
            ))}
          </select>
          {selected?.note && <div className="mt-1.5 text-[12px] leading-[18px] text-muted">{selected.note}</div>}
          {value !== active && active && (
            <div className="mt-2 flex flex-wrap items-center gap-1.5 rounded-lg border border-dashed border-warn-line bg-warn-soft px-3 py-2 text-[13px] text-warn">
              Di draf: {displayValue(node, 'host', active)} <ArrowRight size={13} aria-hidden /> <b>{displayValue(node, 'host', value ?? '')}</b>
            </div>
          )}
          <div className="mt-3 flex flex-col gap-2">
            {node.hostOptions.map(o => (
              <div key={o.value} className={`rounded-lg border px-3 py-2 text-[12px] leading-[18px] ${o.value === value ? 'border-accent-line bg-accent-soft' : 'border-line'}`}>
                <div className="flex items-center gap-1.5 text-[13px] font-medium">
                  {o.label}
                  {o.value === active && <Pill tone="gray">aktif</Pill>}
                  {!o.available && <Pill tone="gray">Segera</Pill>}
                </div>
                <div className="text-muted">{o.note}</div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="mb-4 text-[13px]">
          <div className="mb-1.5 font-medium">Dijalankan di</div>
          <div className="text-ink-soft">{node.host ? hostLabel[node.host] ?? node.host : '—'}</div>
          <div className="mt-1 text-[12px] text-muted">Pelaksana langkah ini tetap.</div>
        </div>
      )}

      {(status.length > 0 || signal) && (
        <>
          <Overline className="mb-2">Sekarang</Overline>
          <div className="mb-4 flex flex-wrap gap-1.5">
            <StatusPills pills={status} />
            {signal && <Pill tone={signal.tone} dot={signal.dot}>PC Worker: {signal.text}</Pill>}
          </div>
        </>
      )}
      {node.id === 'research' && <LinkRow to={href('pipeline')}>Lihat tugas riset di Pipeline</LinkRow>}
      {(node.id === 'draft' || node.id === 'approval') && <LinkRow to={href('keputusan')}>Buka Keputusan</LinkRow>}
      {node.id === 'send' && <LinkRow to={href('kanal')}>Buka Kanal WhatsApp</LinkRow>}
      {node.id === 'escalation' && <LinkRow to={href('percakapan')}>Buka Percakapan</LinkRow>}

      {node.hostOptions && !node.locked && <EditHint editing={editing} canEdit={canEdit} />}
    </>
  );
}

function EditHint({ editing, canEdit }: { editing: boolean; canEdit: boolean }) {
  if (!canEdit) return <p className="mt-4 text-[12px] leading-[18px] text-muted">Mengubah alur belum aktif di server ini. Kamu tetap bisa melihat semua langkah.</p>;
  if (editing) return null;
  return <p className="mt-4 text-[12px] leading-[18px] text-muted">Tekan <b className="text-ink-soft">Ubah</b> di atas untuk membuat draf perubahan.</p>;
}

function LinkRow({ to, children }: { to: string; children: ReactNode }) {
  return (
    <a href={to} className="mb-2 flex items-center gap-1.5 text-[13px] font-medium text-accent hover:underline">
      {children}<ExternalLink size={13} aria-hidden />
    </a>
  );
}

function LimitsTab({ node, editing, canEdit, overrides, draft, errors, onChange }: InspectorProps) {
  const limits = node.limits ?? [];
  if (!limits.length) return <p className="text-[13px] text-muted">Langkah ini tidak punya batas yang bisa diatur.</p>;
  const editableHere = editing && canEdit;
  return (
    <>
      {node.id === 'send' && (
        <LockNote>Batas ini dijaga oleh pengaman pengiriman Candra dan dicek ulang tepat sebelum setiap pesan. Tidak bisa diubah dari sini.</LockNote>
      )}
      {limits.map(limit => {
        const key = `${node.id}.limit.${limit.key}`;
        const active = currentValue(node, `limit.${limit.key}`, overrides) ?? limit.value;
        const value = effectiveValue(node, `limit.${limit.key}`, overrides, draft) ?? limit.value;
        const changed = value !== active;
        const id = `limit-${node.id}-${limit.key}`;
        const base = baseValue(node, `limit.${limit.key}`) ?? '';
        const unit = UNIT_RE.exec(base)?.[2];
        const unitMatch = UNIT_RE.exec(value);

        if (limit.editable && editableHere) {
          return (
            <div key={limit.key} className="mb-4">
              <label htmlFor={id} className="mb-1.5 flex items-center gap-1.5 text-[13px] font-medium">
                {limit.label}{changed && <Pill tone="warn">diubah</Pill>}
              </label>
              {TIME_RE.test(base) ? (
                <input id={id} type="time" className={inputClass} value={value} onChange={e => onChange(key, e.target.value)} aria-invalid={!!errors[key]} />
              ) : unit ? (
                <div className="flex items-center gap-2">
                  <input
                    id={id}
                    type="number"
                    min={1}
                    max={200}
                    inputMode="numeric"
                    className={`${inputClass} w-28`}
                    value={unitMatch ? unitMatch[1] : ''}
                    onChange={e => onChange(key, `${e.target.value.replace(/\D/g, '')} ${unit}`)}
                    aria-invalid={!!errors[key]}
                  />
                  <span className="text-[13px] text-muted">{unit}</span>
                </div>
              ) : (
                <input
                  id={id}
                  className={inputClass}
                  value={value === 'Belum ditetapkan' ? '' : value}
                  placeholder={value === 'Belum ditetapkan' ? 'Belum ditetapkan, misalnya US$0,10' : undefined}
                  onChange={e => onChange(key, e.target.value || base)}
                  aria-invalid={!!errors[key]}
                />
              )}
              {errors[key] && <div role="alert" className="mt-1.5 text-[12px] text-danger">{errors[key]}</div>}
              {changed && !errors[key] && <div className="mt-1.5 text-[12px] text-muted">Aktif sekarang: {active}</div>}
            </div>
          );
        }
        return (
          <div key={limit.key} className="mb-3 flex items-start justify-between gap-3 border-b border-line-soft pb-3 text-[13px] last:border-0">
            <div>
              <div className="font-medium">{limit.label}</div>
              <div className="mt-0.5 text-[12px] text-muted">
                {limit.editable
                  ? canEdit ? 'Bisa diubah di mode Ubah' : 'Bisa diubah setelah fitur proposal aktif'
                  : node.id === 'send' ? 'Dijaga pengaman pengiriman' : 'Tetap'}
              </div>
            </div>
            <div className="flex shrink-0 items-center gap-1.5 text-right text-ink-soft">
              {!limit.editable && <Lock size={12} className="text-muted" aria-label="Terkunci" />}
              {value}
              {changed && <Pill tone="warn">diubah</Pill>}
            </div>
          </div>
        );
      })}
      {node.id === 'approval' && editableHere && (
        <p className="text-[12px] leading-[18px] text-muted">Jendela review sebaiknya selesai sebelum jam kirim. Persetujuan tetap wajib walaupun jamnya diubah.</p>
      )}
    </>
  );
}

function PermissionsTab({ node }: { node: FlowNode }) {
  const allow = node.allow ?? [];
  const deny = node.deny ?? [];
  if (!allow.length && !deny.length) return <p className="text-[13px] text-muted">Tidak ada izin khusus untuk langkah ini.</p>;
  return (
    <>
      <Overline className="mb-1.5">Boleh</Overline>
      <ul className="mb-4">
        {allow.map(item => (
          <li key={item} className="flex gap-2 py-1.5 text-[13px] leading-[18px]">
            <Check size={15} className="mt-px shrink-0 text-ok" aria-hidden />
            <span className="flex-1">{item}{node.locked && <PolicyNote />}</span>
          </li>
        ))}
      </ul>
      <Overline className="mb-1.5">Tidak boleh</Overline>
      <ul>
        {deny.map(item => (
          <li key={item} className="flex gap-2 py-1.5 text-[13px] leading-[18px]">
            <X size={15} className="mt-px shrink-0 text-danger" aria-hidden />
            <span className="flex-1">{item}<PolicyNote /></span>
          </li>
        ))}
      </ul>
    </>
  );
}

function PolicyNote() {
  return (
    <span className="mt-0.5 flex items-center gap-1 text-[12px] text-muted">
      <ShieldCheck size={12} aria-hidden />Terkunci · dari kebijakan workspace
    </span>
  );
}

function HistoryTab({ node, proposals }: { node: FlowNode; proposals: WorkflowProposal[] }) {
  return (
    <>
      {proposals.length === 0 ? (
        <p className="text-[13px] text-muted">Belum ada perubahan yang diajukan untuk langkah ini.</p>
      ) : (
        <ul className="flex flex-col gap-3">
          {proposals.map(p => (
            <li key={p.id} className="rounded-lg border border-line p-3 text-[13px]">
              <div className="mb-1.5 flex flex-wrap items-center justify-between gap-2">
                <Pill tone={proposalStatus[p.status].tone}>{proposalStatus[p.status].label}</Pill>
                <span className="text-[12px] text-muted">{dateTime(p.created_at)} · dari v{p.base_version}</span>
              </div>
              {p.changes.filter(c => c.node_id === node.id).map(c => {
                const d = describeChange(c);
                return <div key={c.field} className="leading-5">{d.field}: {d.from} → <b>{d.to}</b></div>;
              })}
              {p.note && <div className="mt-1 text-[12px] text-muted">“{p.note}”</div>}
              {p.task_conversation_id && (
                <a href={href('ruang-tim', p.task_conversation_id)} className="mt-1.5 inline-flex items-center gap-1 text-[12px] font-medium text-accent hover:underline">
                  Lihat tugas Angga <ExternalLink size={12} aria-hidden />
                </a>
              )}
            </li>
          ))}
        </ul>
      )}
      <p className="mt-4 text-[12px] leading-[18px] text-muted">
        Riwayat jalan per langkah (berhasil, gagal, durasi, biaya) belum tersedia di sini. Lihat Pipeline dan Biaya & Kapasitas untuk angka harian.
      </p>
    </>
  );
}
