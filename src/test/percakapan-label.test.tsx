// P1-4: lead labels come only from tags the backend returns; no chips are invented when there are none.
import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { Workspace } from '../App';
import { SourceProvider, ToastProvider } from '../lib/data';
import type { DataSource } from '../lib/source';
import type { SalesConversation } from '../lib/types';
import { emptySource, extremeSource } from './fixtures';

async function base(): Promise<SalesConversation> {
  return (await extremeSource.conversations('all', '')).items[0];
}

async function show(items: SalesConversation[]) {
  const source: DataSource = { ...emptySource, conversations: async () => ({ items, counts: { all: items.length } }) };
  window.location.hash = '#/percakapan';
  render(<SourceProvider source={source}><ToastProvider><Workspace onLogout={() => undefined} /></ToastProvider></SourceProvider>);
  await waitFor(() => expect(screen.getAllByText(items[0].name).length).toBeGreaterThan(0));
}

beforeEach(() => {
  window.localStorage.clear();
  window.localStorage.setItem('jadisatu.guide', JSON.stringify({ seen: true, done: [] }));
});
afterEach(() => cleanup());

describe('Percakapan — filter label', () => {
  it('menampilkan label dari backend dan menyaring daftar', async () => {
    const b = await base();
    await show([{ ...b, id: 'a', name: 'Klinik Panas', tags: ['panas'] }, { ...b, id: 'b', name: 'Klinik Dingin', tags: ['dingin'] }]);
    const labels = screen.getByRole('group', { name: 'Filter label' });
    fireEvent.click(within(labels).getByRole('button', { name: 'panas' }));
    await waitFor(() => expect(screen.queryByText('Klinik Dingin')).toBeNull());
    expect(screen.getAllByText('Klinik Panas').length).toBeGreaterThan(0);
    fireEvent.click(within(labels).getByRole('button', { name: 'panas' }));
    await waitFor(() => expect(screen.getAllByText('Klinik Dingin').length).toBeGreaterThan(0));
  });

  it('tanpa label dari backend tidak ada filter label', async () => {
    const b = await base();
    await show([{ ...b, id: 'a', name: 'Klinik Tanpa Label', tags: [] }]);
    expect(screen.queryByRole('group', { name: 'Filter label' })).toBeNull();
  });
});
