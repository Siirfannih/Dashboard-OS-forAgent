// The PC worker signal must come from the work ledger (/api/v2/worker), never from the static
// "Tailscale perlu login" label the old /api/state still returns.
import { cleanup, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { Workspace } from '../App';
import { SourceProvider, ToastProvider } from '../lib/data';
import type { DataSource } from '../lib/source';
import { emptySource } from './fixtures';

const now = Date.now() / 1000;
const staleState = async () => ({
  user: null, agents: [], conversations: [], activity: [], integrations: [],
  system: { worker: { status: 'offline', label: 'PC worker belum terhubung; Tailscale perlu login', last_seen: null } },
}) as unknown as Awaited<ReturnType<DataSource['state']>>;

function show(source: DataSource) {
  window.location.hash = '#/biaya';
  render(<SourceProvider source={source}><ToastProvider><Workspace onLogout={() => undefined} /></ToastProvider></SourceProvider>);
}

beforeEach(() => {
  window.localStorage.clear();
  window.localStorage.setItem('jadisatu.guide', JSON.stringify({ seen: true, done: [] }));
});
afterEach(() => cleanup());

describe('Biaya — sinyal PC worker', () => {
  it('memakai aktivitas terakhir dari ledger', async () => {
    show({ ...emptySource, state: staleState, worker: async () => ({ last_activity_at: now - 120, by_status: { accepted: 4 }, identities: 2 }) });
    await waitFor(() => expect(screen.getByText(/aktif terakhir/)).toBeTruthy());
    expect(screen.queryByText(/Tailscale perlu login/)).toBeNull();
  });

  it('tanpa aktivitas ledger menampilkan "Belum ada sinyal", bukan label statis lama', async () => {
    show({ ...emptySource, state: staleState });
    await waitFor(() => expect(screen.getAllByText(/Belum ada sinyal/).length).toBeGreaterThan(0));
    expect(screen.queryByText(/Tailscale perlu login/)).toBeNull();
  });
});
