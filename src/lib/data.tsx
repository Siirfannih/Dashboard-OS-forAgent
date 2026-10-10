import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from 'react';
import type { DataSource } from './source';

const SourceContext = createContext<DataSource | null>(null);

export function SourceProvider({ source, children }: { source: DataSource; children: ReactNode }) {
  return <SourceContext.Provider value={source}>{children}</SourceContext.Provider>;
}

export function useSource(): DataSource {
  const source = useContext(SourceContext);
  if (!source) throw new Error('SourceProvider missing');
  return source;
}

export interface Resource<T> {
  data: T | undefined;
  error: string | null;
  loading: boolean;
  /** When the last successful load finished (ms). */
  loadedAt: number | null;
  reload: () => Promise<void>;
}

/** Loads with the active DataSource and optionally polls. Keeps showing the last good data on errors. */
export function useResource<T>(load: (source: DataSource) => Promise<T>, deps: unknown[] = [], pollMs = 0): Resource<T> {
  const source = useSource();
  const [data, setData] = useState<T>();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadedAt, setLoadedAt] = useState<number | null>(null);
  const loader = useRef(load);
  loader.current = load;
  const generation = useRef(0);

  const reload = useCallback(async () => {
    const mine = ++generation.current;
    try {
      const value = await loader.current(source);
      if (mine !== generation.current) return;
      setData(value);
      setError(null);
      setLoadedAt(Date.now());
    } catch (exc) {
      if (mine !== generation.current) return;
      setError(exc instanceof Error ? exc.message : 'Data belum bisa dimuat.');
    } finally {
      if (mine === generation.current) setLoading(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [source, ...deps]);

  useEffect(() => {
    setLoading(true);
    void reload();
    if (!pollMs) return;
    const timer = window.setInterval(() => {
      if (document.visibilityState === 'visible') void reload();
    }, pollMs);
    return () => window.clearInterval(timer);
  }, [reload, pollMs]);

  return { data, error, loading, loadedAt, reload };
}

/* ---------- Toasts ---------- */

interface Toast { id: number; tone: 'ok' | 'error' | 'info'; text: string }
const ToastContext = createContext<(tone: Toast['tone'], text: string) => void>(() => undefined);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const push = useCallback((tone: Toast['tone'], text: string) => {
    const id = Date.now() + Math.random();
    setToasts(list => [...list, { id, tone, text }]);
    window.setTimeout(() => setToasts(list => list.filter(t => t.id !== id)), tone === 'error' ? 7000 : 4000);
  }, []);
  return (
    <ToastContext.Provider value={push}>
      {children}
      <div className="fixed bottom-4 right-4 z-[80] flex w-[min(380px,calc(100vw-32px))] flex-col gap-2" aria-live="polite">
        {toasts.map(t => (
          <div
            key={t.id}
            role={t.tone === 'error' ? 'alert' : 'status'}
            className={`rounded-xl border px-4 py-3 text-[13px] shadow-[var(--shadow-float)] ${
              t.tone === 'error' ? 'border-danger/20 bg-danger-soft text-danger' : t.tone === 'ok' ? 'border-ok/20 bg-ok-soft text-ok' : 'border-line bg-card text-ink'
            }`}
          >
            {t.text}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export const useToast = () => useContext(ToastContext);
