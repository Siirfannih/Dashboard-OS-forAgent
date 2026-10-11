import { ArrowRight, Eye, Lock } from 'lucide-react';
import { useState, type FormEvent } from 'react';
import { Button, inputClass } from '../components/ui';
import { workspace } from '../config/workspace';
import { ApiError } from '../lib/api';

export function LoginPage({ message, onLogin, onDemo }: { message?: string; onLogin: (password: string) => Promise<void>; onDemo: () => void }) {
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(message ?? null);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (!password) return setError('Masukkan kata sandi workspace.');
    setBusy(true);
    setError(null);
    try {
      await onLogin(password);
    } catch (exc) {
      if (exc instanceof ApiError && exc.status === 429) setError('Terlalu banyak percobaan. Tunggu 10 menit, lalu coba lagi.');
      else if (exc instanceof ApiError && exc.status === 401) setError('Kata sandi tidak cocok.');
      else setError(exc instanceof Error ? exc.message : 'Belum bisa masuk. Coba lagi.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="grid min-h-full place-items-center bg-surface px-4 py-10">
      <div className="w-full max-w-[400px]">
        <div className="mb-8 flex items-center gap-2.5">
          <span className="grid size-8 place-items-center rounded-lg bg-ink text-[14px] font-bold text-white">J</span>
          <span className="text-[15px] font-semibold">{workspace.product}</span>
        </div>
        <h1 className="font-display text-[28px] leading-9 font-semibold">Masuk ke workspace</h1>
        <p className="mt-1 text-muted">Tim AI-mu bekerja. Kamu memegang keputusan.</p>
        <form onSubmit={submit} className="mt-8 rounded-2xl border border-line bg-card p-5 shadow-[var(--shadow-card)]">
          <label htmlFor="password" className="mb-1.5 block text-[13px] font-medium">Kata sandi</label>
          <div className="relative">
            <Lock size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-faint" />
            <input
              id="password"
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              className={`${inputClass} pl-9`}
            />
          </div>
          {error && <p role="alert" className="mt-3 text-[13px] text-danger">{error}</p>}
          <Button type="submit" variant="primary" disabled={busy} className="mt-5 w-full" icon={busy ? undefined : <ArrowRight size={16} />}>
            {busy ? 'Memeriksa…' : 'Masuk'}
          </Button>
        </form>
        <button onClick={onDemo} className="mt-4 inline-flex items-center gap-1.5 text-[13px] text-muted hover:text-ink">
          <Eye size={15} /> Lihat demo dengan data fiktif
        </button>
      </div>
    </div>
  );
}
