// Template configuration. A client deployment changes this file, not the components.

export type AgentRole = 'owner' | 'sales' | 'research' | 'editorial' | 'engineer' | 'system';

export interface RosterEntry {
  /** Id used by the backend (agent_id, head_agent, worker_role). */
  id: string;
  displayName: string;
  role: AgentRole;
  title: string;
  /** Where it runs, in user language. */
  host: string;
  hue: string;
}

export const workspace = {
  name: 'Jadisatu Sales',
  product: 'Jadisatu Workspace',
  timezone: 'Asia/Makassar',
  timezoneLabel: 'WITA',
  ownerTitle: 'Pemilik',
  roster: [
    { id: 'owner', displayName: 'Kamu', role: 'owner', title: 'Pemilik', host: 'Manusia', hue: 'var(--color-ink)' },
    { id: 'candra', displayName: 'Candra', role: 'sales', title: 'Kepala Sales', host: 'Server Utama', hue: 'var(--color-agent-sales)' },
    { id: 'research', displayName: 'Worker Riset', role: 'research', title: 'Worker riset', host: 'PC Worker', hue: 'var(--color-agent-research)' },
    { id: 'manda', displayName: 'Manda', role: 'editorial', title: 'Penulis naskah', host: 'Server Utama', hue: 'var(--color-agent-editorial)' },
    { id: 'engineer', displayName: 'Angga', role: 'engineer', title: 'Teknisi', host: 'Server Utama', hue: 'var(--color-agent-engineer)' },
    { id: 'strategist', displayName: 'Content Strategist', role: 'editorial', title: 'Strategi konten', host: 'Server Utama', hue: 'var(--color-agent-editorial)' },
    { id: 'validator', displayName: 'Validator', role: 'system', title: 'Aturan sistem', host: 'Server Utama', hue: 'var(--color-agent-system)' },
  ] satisfies RosterEntry[],
  /** Daily rhythm shown on Beranda. Times are local (timezone above). */
  schedule: [
    { key: 'research', label: 'Riset malam', from: '20:00', to: '07:30' },
    { key: 'review', label: 'Review pemilik', from: '07:30', to: '09:00' },
    { key: 'outbound', label: 'Jam kirim', from: '09:00', to: '17:00' },
  ],
  senderProfiles: { irfan: 'Profil A', candra: 'Profil B' } as Record<string, string>,
};

export function agent(id: string | null | undefined): RosterEntry {
  const found = workspace.roster.find(entry => entry.id === id);
  if (found) return found;
  return { id: id ?? 'unknown', displayName: id ?? 'Tidak diketahui', role: 'system', title: 'Agent', host: '—', hue: 'var(--color-agent-system)' };
}

export function senderLabel(profile: string | null | undefined): string {
  if (!profile) return '—';
  return workspace.senderProfiles[profile] ?? profile;
}
