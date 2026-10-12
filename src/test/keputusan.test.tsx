// Regression: the send gate silently revokes approvals for drafts whose research evidence is older
// than 24 h (outbox.error = 'study_stale'). The owner must see why, and must not be offered an
// approval that will be revoked a second later.
import { cleanup, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { Workspace } from '../App';
import { SourceProvider, ToastProvider } from '../lib/data';
import type { DataSource } from '../lib/source';
import type { ReviewItem } from '../lib/types';
import { emptySource } from './fixtures';

const now = Date.now() / 1000;

function item(over: Partial<ReviewItem>): ReviewItem {
  return {
    id: 'ob_x', conversation_id: 'cv_x', actor: 'ai', kind: 'first', body: 'Selamat pagi.', status: 'draft', approved: 0, version: 1,
    sender_profile: 'irfan', run_mode: 'production', created_at: now - 3600, sent_at: null, error: null, namespace: 'sales',
    snapshot: '0'.repeat(64), name: 'Klinik Contoh', phone: '620000000101', prospect_ref: 'P-1', control: 'AUTO', verdict: 'contact',
    study_summary: 'Contoh', study_content: null, study_updated_at: now - 2 * 3600, feedback_action: null, feedback_reason: null, ...over,
  };
}

function sourceWith(review: ReviewItem): DataSource {
  return { ...emptySource, review: async () => [review] };
}

async function open(review: ReviewItem) {
  window.location.hash = `#/keputusan/${review.id}`;
  render(
    <SourceProvider source={sourceWith(review)}>
      <ToastProvider><Workspace onLogout={() => undefined} /></ToastProvider>
    </SourceProvider>,
  );
  await waitFor(() => expect(screen.getAllByText(review.name).length).toBeGreaterThan(0));
}

beforeEach(() => {
  window.localStorage.clear();
  window.localStorage.setItem('jadisatu.guide', JSON.stringify({ seen: true, done: [] }));
});
afterEach(() => cleanup());

const approveButton = () => screen.getAllByRole('button').find(b => /^Setujui/.test(b.textContent ?? ''));

describe('Keputusan — persetujuan yang dicabut sistem', () => {
  it('menampilkan alasan pencabutan pada draf yang kembali dari gerbang kirim', async () => {
    await open(item({ id: 'ob_revoked', error: 'study_stale' }));
    expect(screen.getByText(/Persetujuan sebelumnya dicabut otomatis/)).toBeTruthy();
    expect(screen.getAllByText(/bukti riset sudah lebih dari 24 jam/).length).toBeGreaterThan(0);
  });

  it('tidak menawarkan persetujuan bila bukti riset lebih dari 24 jam', async () => {
    await open(item({ id: 'ob_stale', study_updated_at: now - 30 * 3600 }));
    expect(approveButton()?.hasAttribute('disabled')).toBe(true);
    expect(screen.getAllByText(/Minta Candra memperbarui riset/).length).toBeGreaterThan(0);
  });

  it('draf uji (review_only) tetap bisa disetujui walau buktinya lama', async () => {
    await open(item({ id: 'ob_test', run_mode: 'review_only', study_updated_at: now - 30 * 3600 }));
    expect(approveButton()?.hasAttribute('disabled')).toBe(false);
  });

  it('bukti segar: tombol setujui aktif', async () => {
    await open(item({ id: 'ob_fresh' }));
    expect(approveButton()?.hasAttribute('disabled')).toBe(false);
  });
});

describe('Keputusan — tautan ke draf yang tidak aktif lagi', () => {
  it('menjelaskan draf dibatalkan dan menautkan ke draf aktif prospek yang sama', async () => {
    const active = item({ id: 'ob_baru', conversation_id: 'cv_x', name: 'Klinik Contoh' });
    const source: DataSource = {
      ...emptySource,
      review: async () => [active],
      draft: async id => ({ ...active, id, status: 'cancelled', error: 'study_stale', body: 'Isi lama.\n\nParagraf dua.' }),
    };
    window.location.hash = '#/keputusan/ob_lama';
    render(<SourceProvider source={source}><ToastProvider><Workspace onLogout={() => undefined} /></ToastProvider></SourceProvider>);
    await waitFor(() => expect(screen.getByText('Draf ini sudah dibatalkan')).toBeTruthy());
    expect(screen.getByText(/bukti riset sudah lebih dari 24 jam/)).toBeTruthy();
    expect(screen.getByText('Isi lama.')).toBeTruthy();
    expect(screen.getByRole('button', { name: /Buka draf aktif Klinik Contoh/ })).toBeTruthy();
  });
});
