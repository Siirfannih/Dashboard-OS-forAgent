import { useState } from 'react';
import { AgentAvatar, Overline, Pill, Tabs, type Tone } from '../../components/ui';
import { agent, workspace } from '../../config/workspace';
import { dateTime } from '../../lib/format';
import type { ChatSnapshot, WorkspaceAgent } from '../../lib/types';
import { activity14, availabilityOf, availabilityText, membersOf, threadStatus, type AgentAvailability } from './model';

const availabilityTone: Record<AgentAvailability, Tone> = {
  ready: 'ok', history_only: 'gray', planned: 'gray', soon: 'info', unknown: 'unknown',
};

export function AgentStatusPill({ availability }: { availability: AgentAvailability }) {
  return <Pill tone={availabilityTone[availability]} dot={availability === 'ready'}>{availabilityText[availability]}</Pill>;
}

export function InfoPanel({ chat, agents }: { chat: ChatSnapshot; agents: WorkspaceAgent[] | undefined }) {
  const [tab, setTab] = useState<'info' | 'anggota'>('info');
  const members = membersOf(chat);
  const status = threadStatus(chat);
  const completed = chat.runs.filter(r => r.status === 'completed').length;
  const failed = chat.runs.filter(r => r.status === 'failed').length;
  const owner = agent(chat.agent_id);

  return (
    <div className="flex flex-col gap-5">
      <Tabs
        label="Panel thread"
        value={tab}
        onChange={setTab}
        options={[{ value: 'info', label: 'Info' }, { value: 'anggota', label: 'Anggota', count: members.length + 1 }]}
      />
      {tab === 'info' ? (
        <>
          <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-2.5 text-[13px]">
            <dt className="text-muted">{chat.kind === 'room' ? 'Agent utama' : 'Pemilik'}</dt>
            <dd className="flex min-w-0 items-center gap-2 font-medium"><AgentAvatar id={chat.agent_id} size={20} /><span className="truncate">{owner.displayName}</span></dd>
            <dt className="text-muted">Jenis</dt>
            <dd>{chat.kind === 'room' ? 'Ruang bersama' : 'Pesan langsung'}</dd>
            <dt className="text-muted">Dibuat</dt>
            <dd className="tabular">{dateTime(chat.created_at)}</dd>
            <dt className="text-muted">Diperbarui</dt>
            <dd className="tabular">{dateTime(chat.updated_at)}</dd>
            <dt className="text-muted">Status</dt>
            <dd><Pill tone={status.tone} dot>{status.label}</Pill></dd>
            <dt className="text-muted">Pekerjaan</dt>
            <dd className="tabular">{completed} selesai{failed ? <span className="text-danger"> · {failed} gagal</span> : ' · 0 gagal'}</dd>
          </dl>
          <ActivityStrip chat={chat} />
        </>
      ) : (
        <ul className="flex flex-col gap-3">
          <li className="flex items-center gap-3">
            <AgentAvatar id="owner" size={32} />
            <div className="min-w-0 flex-1 leading-5">
              <div className="text-[14px] font-semibold">Kamu</div>
              <div className="text-[12px] text-muted">Pemilik · Manusia</div>
            </div>
          </li>
          {members.map(id => {
            const entry = agent(id);
            const availability = availabilityOf(agents, id);
            return (
              <li key={id} className="flex items-center gap-3">
                <AgentAvatar id={id} size={32} status={availability === 'ready' ? 'online' : 'idle'} />
                <div className="min-w-0 flex-1 leading-5">
                  <div className="truncate text-[14px] font-semibold">{entry.displayName}</div>
                  <div className="truncate text-[12px] text-muted">{entry.title} · {entry.host}</div>
                </div>
                <AgentStatusPill availability={availability} />
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

function ActivityStrip({ chat }: { chat: ChatSnapshot }) {
  const { days, basis } = activity14(chat);
  const max = Math.max(1, ...days.map(d => d.count));
  const total = days.reduce((sum, d) => sum + d.count, 0);
  const shade = (count: number) => {
    if (!count) return 'bg-line-soft border border-line';
    const level = count / max;
    return level > 0.66 ? 'bg-ok' : level > 0.33 ? 'bg-ok/60' : 'bg-ok/30';
  };
  const unit = basis === 'runs' ? 'pekerjaan' : 'balasan';
  const fmt = new Intl.DateTimeFormat('id-ID', { weekday: 'short', day: 'numeric', month: 'short', timeZone: workspace.timezone });
  return (
    <div>
      <div className="mb-2 flex items-baseline justify-between gap-2">
        <Overline>Aktivitas 14 hari</Overline>
        <span className="tabular text-[12px] text-muted">{total} {unit}</span>
      </div>
      <ol className="grid grid-cols-[repeat(14,minmax(0,1fr))] gap-1" aria-label={`Aktivitas thread 14 hari terakhir: ${total} ${unit}`}>
        {days.map(d => (
          <li key={d.key} title={`${fmt.format(d.date)}: ${d.count} ${unit}`} aria-label={`${fmt.format(d.date)}: ${d.count} ${unit}`} className={`aspect-square rounded-[3px] ${shade(d.count)}`} />
        ))}
      </ol>
      <div className="mt-1.5 flex justify-between text-[12px] text-muted"><span>14 hari lalu</span><span>Hari ini</span></div>
      {basis === 'replies' && <p className="mt-2 text-[12px] leading-[18px] text-muted">Dihitung dari balasan agent; waktu pekerjaan tidak dikirim API.</p>}
    </div>
  );
}
