import { useEffect, useState } from 'react';

export type Page = 'beranda' | 'keputusan' | 'pipeline' | 'percakapan' | 'ruang-tim' | 'alur-kerja' | 'biaya' | 'kanal';
export const PAGES: Page[] = ['beranda', 'keputusan', 'pipeline', 'percakapan', 'ruang-tim', 'alur-kerja', 'biaya', 'kanal'];

export interface Route { page: Page; id?: string }

function parse(hash: string): Route {
  const [page, id] = hash.replace(/^#\/?/, '').split('/');
  return PAGES.includes(page as Page) ? { page: page as Page, id: id ? decodeURIComponent(id) : undefined } : { page: 'beranda' };
}

export function useRoute(): Route {
  const [route, setRoute] = useState(() => parse(window.location.hash));
  useEffect(() => {
    const onChange = () => setRoute(parse(window.location.hash));
    window.addEventListener('hashchange', onChange);
    return () => window.removeEventListener('hashchange', onChange);
  }, []);
  return route;
}

export function href(page: Page, id?: string): string {
  return `#/${page}${id ? `/${encodeURIComponent(id)}` : ''}`;
}

export function go(page: Page, id?: string) {
  window.location.hash = href(page, id);
}
