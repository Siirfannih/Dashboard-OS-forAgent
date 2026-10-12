// P1-3: draft/conversation ids an agent mentions become clickable cards; '@' in a room offers member mentions.
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { useState } from 'react';
import { afterEach, describe, expect, it } from 'vitest';
import { Composer } from '../screens/ruangtim/Composer';
import { SourceProvider } from '../lib/data';
import type { DataSource } from '../lib/source';
import type { ReviewItem } from '../lib/types';
import { ObjectCards, objectRefs } from '../screens/ruangtim/ObjectCards';
import { emptySource } from './fixtures';

const withPending = (ids: string[]): DataSource => ({
  ...emptySource,
  review: async () => ids.map(id => ({ id, status: 'draft' }) as ReviewItem),
});
const cards = (text: string, source: DataSource = emptySource) =>
  render(<SourceProvider source={source}><ObjectCards text={text} /></SourceProvider>);

afterEach(() => cleanup());

describe('Ruang Tim — kartu objek', () => {
  it('mengenali id draf dan percakapan sekali saja', () => {
    const text = 'Kalm | ob_eb9eb2e13aa54e7b\nBDA | ob_32dd1e2aa19f41a4 (cv_0123456789abcdef) lagi ob_eb9eb2e13aa54e7b; bukan ob_xyz';
    expect(objectRefs(text)).toEqual([
      { kind: 'draft', id: 'ob_eb9eb2e13aa54e7b' }, { kind: 'draft', id: 'ob_32dd1e2aa19f41a4' }, { kind: 'conversation', id: 'cv_0123456789abcdef' }]);
  });

  it('kartu menautkan ke halaman terkait', () => {
    cards('Draf baru: ob_eb9eb2e13aa54e7b untuk cv_0123456789abcdef');
    expect(screen.getByRole('link', { name: /Draf.*ob_eb9e/ }).getAttribute('href')).toBe('#/keputusan/ob_eb9eb2e13aa54e7b');
    expect(screen.getByRole('link', { name: /Percakapan.*cv_0123/ }).getAttribute('href')).toBe('#/percakapan/cv_0123456789abcdef');
  });

  it('tanpa id tidak ada kartu', () => {
    const { container } = cards('Halo, semua beres.');
    expect(container.innerHTML).toBe('');
  });

  it('draf lama yang sudah dibatalkan ditandai tidak aktif, draf yang menunggu ditandai', async () => {
    cards('Lama ob_1111111111111111, baru ob_2222222222222222', withPending(['ob_2222222222222222']));
    await waitFor(() => expect(screen.getByRole('link', { name: /ob_2222.*Menunggu keputusan/ })).toBeTruthy());
    expect(screen.getByRole('link', { name: /ob_1111.*Tidak aktif/ })).toBeTruthy();
  });
});

function Harness() {
  const [v, setV] = useState('');
  return <Composer value={v} onChange={setV} onSend={() => undefined} placeholder="x"
    mentions={[{ handle: 'engineer', label: 'Angga · Engineer' }, { handle: 'manda', label: 'Manda' }, { handle: 'all', label: 'Semua anggota' }]} />;
}

describe('Ruang Tim — @mention', () => {
  it('mengetik @ menampilkan anggota dan memilih menyisipkan sebutan', () => {
    render(<Harness />);
    const box = screen.getByLabelText('Tulis pesan') as HTMLTextAreaElement;
    fireEvent.change(box, { target: { value: 'Tolong cek @en' } });
    const list = screen.getByRole('listbox', { name: 'Sebut anggota' });
    expect(list.textContent).toContain('Angga');
    expect(list.textContent).not.toContain('Manda');
    fireEvent.mouseDown(screen.getByRole('option', { name: /Angga/ }));
    expect(box.value).toBe('Tolong cek @engineer ');
    expect(screen.queryByRole('listbox')).toBeNull();
  });

  it('Enter memilih saran pertama, bukan mengirim', () => {
    render(<Harness />);
    const box = screen.getByLabelText('Tulis pesan') as HTMLTextAreaElement;
    fireEvent.change(box, { target: { value: '@' } });
    fireEvent.keyDown(box, { key: 'Enter' });
    expect(box.value).toBe('@engineer ');
  });
});
