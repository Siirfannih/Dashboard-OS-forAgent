import { useCallback, useEffect, useState } from 'react';
import { PageBoundary } from './components/PageBoundary';
import { Shell } from './components/Shell';
import { ApiError } from './lib/api';
import { SourceProvider, ToastProvider } from './lib/data';
import { demoSource } from './lib/demo';
import { useRoute } from './lib/router';
import { liveSource, type DataSource } from './lib/source';
import { Onboarding, useGuide } from './screens/Onboarding';
import { AlurKerjaPage } from './screens/AlurKerja';
import { BerandaPage } from './screens/Beranda';
import { BiayaPage } from './screens/Biaya';
import { KanalPage } from './screens/Kanal';
import { KeputusanPage } from './screens/Keputusan';
import { LoginPage } from './screens/Login';
import { PercakapanPage } from './screens/Percakapan';
import { PipelinePage } from './screens/Pipeline';
import { RuangTimPage } from './screens/RuangTim';

type Boot = { phase: 'loading' } | { phase: 'login'; message?: string } | { phase: 'ready'; source: DataSource };

const DEMO_KEY = 'jadisatu.demo';

// Demo is per tab (sessionStorage) so it never sticks to the real workspace.
function readDemoFlag(): boolean {
  try {
    window.localStorage.removeItem(DEMO_KEY); // clear the old persistent flag from earlier builds
    return new URLSearchParams(window.location.search).has('demo') || window.sessionStorage.getItem(DEMO_KEY) === '1';
  } catch {
    return false;
  }
}

export function exitDemo() {
  try { window.sessionStorage.removeItem(DEMO_KEY); window.localStorage.removeItem(DEMO_KEY); } catch { /* ignore */ }
  const url = new URL(window.location.href);
  url.searchParams.delete('demo');
  url.hash = '';
  window.location.replace(url.toString());
}

export default function App() {
  const [boot, setBoot] = useState<Boot>({ phase: 'loading' });

  const start = useCallback(async () => {
    if (readDemoFlag()) return setBoot({ phase: 'ready', source: demoSource });
    try {
      const auth = await liveSource.auth();
      setBoot(auth.authenticated ? { phase: 'ready', source: liveSource } : { phase: 'login' });
    } catch (exc) {
      // No workspace API on this host (e.g. a static preview): fall back to the fictional demo.
      if (exc instanceof ApiError && (exc.status === 0 || exc.status === 404)) setBoot({ phase: 'ready', source: demoSource });
      else setBoot({ phase: 'login', message: exc instanceof Error ? exc.message : undefined });
    }
  }, []);

  useEffect(() => { void start(); }, [start]);

  useEffect(() => {
    const expired = () => setBoot({ phase: 'login', message: 'Sesi berakhir. Masuk lagi untuk melanjutkan.' });
    window.addEventListener('session-expired', expired);
    return () => window.removeEventListener('session-expired', expired);
  }, []);

  const useDemo = () => {
    try { window.sessionStorage.setItem(DEMO_KEY, '1'); } catch { /* storage unavailable: demo lasts this visit */ }
    setBoot({ phase: 'ready', source: demoSource });
  };

  if (boot.phase === 'loading') {
    return <div className="grid h-full place-items-center text-[13px] text-muted">Memuat workspace…</div>;
  }
  if (boot.phase === 'login') {
    return (
      <ToastProvider>
        <LoginPage
          message={boot.message}
          onLogin={async password => { await liveSource.login(password); setBoot({ phase: 'ready', source: liveSource }); }}
          onDemo={useDemo}
        />
      </ToastProvider>
    );
  }
  return (
    <SourceProvider source={boot.source}>
      <ToastProvider>
        <Workspace
          onLogout={async () => {
            if (boot.source.kind === 'demo') return exitDemo();
            await liveSource.logout().catch(() => undefined);
            setBoot({ phase: 'login' });
          }}
        />
      </ToastProvider>
    </SourceProvider>
  );
}

export function Workspace({ onLogout }: { onLogout: () => void }) {
  const route = useRoute();
  const guide = useGuide();
  const [guideOpen, setGuideOpen] = useState(() => !guide.seen);

  return (
    <>
      <Shell page={route.page} onOpenGuide={() => setGuideOpen(true)} guideProgress={guide.progress} onLogout={onLogout}>
        <PageBoundary resetKey={`${route.page}/${route.id ?? ''}`}>
          {route.page === 'beranda' && <BerandaPage guide={guide} onOpenGuide={() => setGuideOpen(true)} />}
          {route.page === 'keputusan' && <KeputusanPage id={route.id} />}
          {route.page === 'pipeline' && <PipelinePage id={route.id} />}
          {route.page === 'percakapan' && <PercakapanPage id={route.id} />}
          {route.page === 'ruang-tim' && <RuangTimPage id={route.id} />}
          {route.page === 'alur-kerja' && <AlurKerjaPage id={route.id} />}
          {route.page === 'biaya' && <BiayaPage id={route.id} />}
          {route.page === 'kanal' && <KanalPage id={route.id} />}
        </PageBoundary>
      </Shell>
      {guideOpen && <Onboarding guide={guide} onClose={() => { guide.markSeen(); setGuideOpen(false); }} />}
    </>
  );
}
