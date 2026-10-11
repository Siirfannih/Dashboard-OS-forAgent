// P1-5: "Simulasikan" shows the backend's dry-run issues before submitting; history offers "Kembalikan ke vN",
// which only creates a normal proposal (owner approval → Angga) — nothing is applied directly.
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { SourceProvider, ToastProvider } from '../lib/data';
import type { DataSource } from '../lib/source';
import type { WorkflowProposal } from '../lib/types';
import { HistoryModal, SubmitModal } from '../screens/alurkerja/Proposals';
import { emptySource } from './fixtures';

afterEach(() => cleanup());

const change = { node_id: 'approval', field: 'limit.window_end', from: '10:00', to: '06:00' };

function wrap(source: DataSource, node: React.ReactNode) {
  return render(<SourceProvider source={source}><ToastProvider>{node}</ToastProvider></SourceProvider>);
}

describe('Alur Kerja — simulasi', () => {
  it('menampilkan masalah dari simulasi tanpa mengajukan proposal', async () => {
    const propose = vi.fn();
    const simulate = vi.fn(async () => ({ ok: false, version: 1, result: {},
      issues: [{ level: 'error' as const, node_id: 'approval', field: 'limit.window_end', message: 'Jendela review harus selesai setelah dimulai.' }] }));
    wrap({ ...emptySource, proposeWorkflow: propose, simulateWorkflow: simulate },
      <SubmitModal open onClose={() => undefined} changes={[change]} baseVersion={1} values={{ 'approval.limit.window_start': '07:00' }} onSubmitted={() => undefined} onReload={async () => undefined} />);
    fireEvent.click(screen.getByRole('button', { name: /Simulasikan/ }));
    await waitFor(() => expect(screen.getByText('Jendela review harus selesai setelah dimulai.')).toBeTruthy());
    expect(simulate).toHaveBeenCalledWith({ base_version: 1, changes: [change], values: { 'approval.limit.window_start': '07:00', 'approval.limit.window_end': '06:00' } });
    expect(propose).not.toHaveBeenCalled();
  });

  it('simulasi tanpa masalah ditandai lolos', async () => {
    wrap({ ...emptySource, simulateWorkflow: async () => ({ ok: true, version: 1, result: {}, issues: [] }) },
      <SubmitModal open onClose={() => undefined} changes={[change]} baseVersion={1} values={{}} onSubmitted={() => undefined} onReload={async () => undefined} />);
    fireEvent.click(screen.getByRole('button', { name: /Simulasikan/ }));
    await waitFor(() => expect(screen.getByText(/Lolos simulasi/)).toBeTruthy());
  });
});

describe('Alur Kerja — kembalikan versi', () => {
  const applied: WorkflowProposal = { id: 'wp_1', base_version: 1, status: 'applied', changes: [change], note: 'x', created_at: 1, applied_at: 2 };

  it('menawarkan kembali ke versi sebelumnya dan hanya membuat proposal', async () => {
    const revert = vi.fn(async () => ({ ...applied, id: 'wp_2', base_version: 2, status: 'pending' as const }));
    const onReverted = vi.fn();
    wrap({ ...emptySource, revertWorkflow: revert },
      <HistoryModal open onClose={() => undefined} proposals={[applied]} version={2} onReverted={onReverted} />);
    fireEvent.click(screen.getByRole('button', { name: 'Kembalikan ke v1' }));
    await waitFor(() => expect(onReverted).toHaveBeenCalled());
    expect(revert).toHaveBeenCalledWith(1, expect.any(String));
  });

  it('versi pertama tanpa riwayat tidak menawarkan pengembalian', () => {
    wrap(emptySource, <HistoryModal open onClose={() => undefined} proposals={[]} version={1} onReverted={() => undefined} />);
    expect(screen.queryByRole('button', { name: /Kembalikan ke/ })).toBeNull();
  });
});
