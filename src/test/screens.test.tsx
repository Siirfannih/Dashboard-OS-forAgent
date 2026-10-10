// Contract tests: every page renders against real-shaped worst-case data without crashing,
// without React/console errors, and shows a visible empty, error or unknown state.
import { cleanup, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { Workspace } from '../App';
import { SourceProvider, ToastProvider } from '../lib/data';
import { PAGES, type Page } from '../lib/router';
import type { DataSource } from '../lib/source';
import { emptySource, extremeSource, failingSource, LONG_TOKEN } from './fixtures';

/** Visible wording for "nothing here yet" or "not measured", per Design.md (no fake zeros). */
const EMPTY_OR_UNKNOWN = /belum|tidak ada|kosong|tidak diketahui|segera|uji coba|tidak berjalan|tidak tersedia|semua beres/i;

let errors: string[] = [];

beforeEach(() => {
  errors = [];
  window.localStorage.clear();
  window.localStorage.setItem('jadisatu.guide', JSON.stringify({ seen: true, done: [] }));
  vi.spyOn(console, 'error').mockImplementation((...args: unknown[]) => { errors.push(args.map(String).join(' ')); });
});

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

async function renderPage(source: DataSource, page: Page, id?: string) {
  window.location.hash = `#/${page}${id ? `/${encodeURIComponent(id)}` : ''}`;
  const view = render(
    <SourceProvider source={source}>
      <ToastProvider>
        <Workspace onLogout={() => undefined} />
      </ToastProvider>
    </SourceProvider>,
  );
  // Loaded once no skeleton remains and the global loading text is gone.
  await waitFor(() => expect(document.querySelector('.animate-pulse')).toBeNull(), { timeout: 5000 });
  const main = view.container.querySelector('main') ?? view.container;
  return { main };
}

function expectHealthy(main: Element) {
  expect(errors, `console.error:\n${errors.join('\n')}`).toEqual([]);
  expect(main.textContent?.trim().length ?? 0).toBeGreaterThan(20);
  expect(screen.queryByText(/Halaman ini gagal dimuat/)).toBeNull();
  // Markup in data stays text.
  expect(document.querySelector('img[src="x"]')).toBeNull();
  expect([...document.querySelectorAll('b')].some(b => b.textContent === 'tebal')).toBe(false);
}

describe.each(PAGES)('halaman %s', page => {
  it('data kosong: tampil state kosong/tidak diketahui yang terlihat', async () => {
    const { main } = await renderPage(emptySource, page);
    expectHealthy(main);
    expect(main.textContent).toMatch(EMPTY_OR_UNKNOWN);
  });

  it('API gagal: tampil pesan error yang terlihat', async () => {
    const { main } = await renderPage(failingSource, page);
    expect(main.textContent?.trim().length ?? 0).toBeGreaterThan(20);
    expect(screen.queryByText(/Halaman ini gagal dimuat/)).toBeNull();
    const alerts = screen.queryAllByRole('alert').map(a => a.textContent ?? '');
    expect(alerts.join(' ')).toMatch(/Server gagal \(500\)/);
  });

  it('data ekstrem (null, enum baru, JSON rusak, teks panjang): tidak patah', async () => {
    const { main } = await renderPage(extremeSource, page);
    expectHealthy(main);
  });
});

describe('detail dengan data ekstrem', () => {
  const cases: [Page, string][] = [
    ['keputusan', 'ob_broken'], ['keputusan', 'ob_partial'], ['keputusan', 'tidak_ada'],
    ['percakapan', 'conv_long'], ['percakapan', 'conv_null'], ['percakapan', 'conv_dnc'], ['percakapan', 'tidak_ada'],
    ['pipeline', 'job_broken'], ['pipeline', 'job_obj'], ['pipeline', 'conv_long'], ['pipeline', 'tidak_ada'],
    ['ruang-tim', 'chat_long'], ['ruang-tim', 'tidak_ada'], ['ruang-tim', 'agent:candra'], ['ruang-tim', 'agent:agent_tak_dikenal'],
    ['alur-kerja', 'research'], ['alur-kerja', 'node_hilang'],
  ];
  it.each(cases)('%s/%s', async (page, id) => {
    const { main } = await renderPage(extremeSource, page, id);
    expectHealthy(main);
  });

  it('teks panjang tanpa spasi dipotong/dibungkus, bukan melebarkan halaman', async () => {
    const { main } = await renderPage(extremeSource, 'percakapan', 'conv_long');
    const holders = [...main.querySelectorAll('*')].filter(el => el.childNodes.length && [...el.childNodes].some(n => n.nodeType === 3 && n.textContent?.includes(LONG_TOKEN.slice(0, 50))));
    expect(holders.length).toBeGreaterThan(0);
    for (const el of holders) {
      let node: Element | null = el;
      let guarded = false;
      while (node && node !== main) {
        if (/\b(truncate|break-words|break-all|wrap-anywhere|overflow-hidden|line-clamp-\d)\b/.test(node.className?.toString() ?? '')) { guarded = true; break; }
        node = node.parentElement;
      }
      expect(guarded, `teks panjang tanpa pembungkus di <${el.tagName.toLowerCase()} class="${el.className}">`).toBe(true);
    }
  });
});

describe('Beranda dengan sebagian sumber gagal', () => {
  it('jobs/state/percakapan gagal → "tidak diketahui", bukan "belum ada"', async () => {
    const fail = async () => { throw new Error('gagal'); };
    const partial: DataSource = { ...emptySource, jobs: fail, state: fail, conversations: fail };
    const { main } = await renderPage(partial, 'beranda');
    expectHealthy(main);
    expect(main.textContent).not.toMatch(/Belum ada batch riset|Belum ada aktivitas tercatat|Semua beres/);
    expect(main.textContent).toMatch(/Aktivitas tidak bisa dimuat/);
    expect(main.textContent).toMatch(/Percakapan yang ditahan tidak bisa dimuat/);
  });
});

describe('PageBoundary', () => {
  it('halaman yang crash tampil sebagai pesan, navigasi tetap ada', async () => {
    const { PageBoundary } = await import('../components/PageBoundary');
    const Boom = () => { throw new Error('boom'); };
    render(<nav>Navigasi</nav>);
    render(<PageBoundary resetKey="a"><Boom /></PageBoundary>);
    expect(screen.getByText('Halaman ini gagal dimuat')).toBeTruthy();
    expect(screen.getByText('Navigasi')).toBeTruthy();
  });
});
