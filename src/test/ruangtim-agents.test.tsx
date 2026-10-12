// Ruang Tim: every agent with a web link (/v2/agents) is chattable; nothing is hard-coded to one agent.
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { Workspace } from '../App';
import { SourceProvider, ToastProvider } from '../lib/data';
import type { DataSource } from '../lib/source';
import type { AgentLinkInfo, AgentSession } from '../lib/types';
import { emptySource } from './fixtures';

const idle = { running: false, started_at: null, error: null, finished_at: null };
const link = (id: string, label: string, available = true, reason: string | null = null): AgentLinkInfo =>
  ({ id, label, transport: 'gateway_api', available, reason });
const session = (id: string, label: string, over: Partial<AgentSession> = {}): AgentSession =>
  ({ agent_id: id, label, available: true, reason: null, detail: null, session_id: `s_${id}`, messages: [], turn: idle, ...over });

function sourceWith(links: AgentLinkInfo[] | 'fail', sessions: Record<string, AgentSession>, extra: Partial<DataSource> = {}): DataSource {
  return {
    ...emptySource,
    state: async () => ({
      user: null, conversations: [], activity: [], integrations: [],
      agents: [{ id: 'manda', name: 'Manda', role: 'Penulis naskah', status: 'history_only' }],
    }),
    agentLinks: async () => { if (links === 'fail') throw new Error('404'); return { items: links }; },
    agentSession: async id => { const s = sessions[id]; if (!s) throw new Error('Agent tidak ditemukan'); return structuredClone(s); },
    sendAgent: vi.fn(async () => undefined),
    ...extra,
  };
}

async function open(source: DataSource, id?: string) {
  window.location.hash = `#/ruang-tim${id ? `/${encodeURIComponent(id)}` : ''}`;
  render(
    <SourceProvider source={source}>
      <ToastProvider><Workspace onLogout={() => undefined} /></ToastProvider>
    </SourceProvider>,
  );
  await waitFor(() => expect(document.querySelector('.animate-pulse')).toBeNull(), { timeout: 5000 });
}

const sidebar = () => screen.getByRole('navigation', { name: 'Thread dan pesan langsung' });

beforeEach(() => {
  window.localStorage.clear();
  window.localStorage.setItem('jadisatu.guide', JSON.stringify({ seen: true, done: [] }));
});
afterEach(() => cleanup());

describe('Ruang Tim — agent dengan tautan web', () => {
  const sessions = { candra: session('candra', 'Candra'), manda: session('manda', 'Manda') };
  const both = [link('candra', 'Candra'), link('manda', 'Manda')];

  it('dua agent tertaut sama-sama "Telegram + web" dan sama-sama membuka thread dengan composer', async () => {
    const source = sourceWith(both, sessions);
    await open(source, 'agent:candra');
    await waitFor(() => expect(screen.getByPlaceholderText('Tulis pesan untuk Candra…')).toBeTruthy());
    await waitFor(() => expect(sidebar().textContent?.match(/Telegram \+ web/g)?.length).toBe(2));
    cleanup();
    await open(source, 'agent:manda');
    await waitFor(() => expect(screen.getByPlaceholderText('Tulis pesan untuk Manda…')).toBeTruthy());
  });

  it('mengirim ke Manda memanggil sendAgent("manda", ...)', async () => {
    const source = sourceWith(both, sessions);
    await open(source, 'agent:manda');
    const box = await screen.findByPlaceholderText('Tulis pesan untuk Manda…');
    fireEvent.change(box, { target: { value: 'Halo Manda' } });
    fireEvent.click(screen.getByRole('button', { name: 'Kirim' }));
    await waitFor(() => expect(source.sendAgent).toHaveBeenCalledWith('manda', 'Halo Manda'));
  });

  it('tautan tidak tersedia: alasan terlihat dan composer terblokir', async () => {
    const source = sourceWith(
      [link('candra', 'Candra'), link('manda', 'Manda', false, 'gateway_unreachable')],
      { ...sessions, manda: session('manda', 'Manda', { available: false, reason: 'gateway_unreachable' }) },
    );
    await open(source, 'agent:manda');
    await screen.findByText(/Gateway Manda tidak bisa dihubungi/);
    expect(screen.getByText(/Kirim pesan ke Manda lewat Telegram dulu/)).toBeTruthy();
    expect(screen.queryByPlaceholderText('Tulis pesan untuk Manda…')).toBeNull();
    expect(sidebar().textContent).toContain('Belum tersambung');
  });

  it('endpoint tautan gagal: kembali ke perilaku lama, hanya Candra yang bersama', async () => {
    const source = sourceWith('fail', sessions);
    await open(source, 'agent:candra');
    await screen.findByPlaceholderText('Tulis pesan untuk Candra…');
    await waitFor(() => expect(sidebar().textContent?.match(/Telegram \+ web/g)?.length).toBe(1));
    cleanup();
    await open(source, 'agent:manda');
    // Manda stays an ordinary read-only agent pane.
    await screen.findByText(/riwayat saja/i);
    expect(screen.queryByPlaceholderText('Tulis pesan untuk Manda…')).toBeNull();
  });

  it('agent yang hanya ada di tautan (tidak di state.agents) tetap terdaftar dan bisa diajak chat', async () => {
    const source = sourceWith(
      [link('candra', 'Candra'), link('agent_baru', 'Agent Baru')],
      { candra: sessions.candra, agent_baru: session('agent_baru', 'Agent Baru') },
    );
    await open(source, 'agent:agent_baru');
    await waitFor(() => expect(sidebar().textContent).toContain('Agent Baru'));
    await screen.findByPlaceholderText('Tulis pesan untuk Agent Baru…');
  });
});
