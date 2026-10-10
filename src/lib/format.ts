import { workspace } from '../config/workspace';

const tz = workspace.timezone;

/** Accepts epoch seconds (sales/work API) or ISO strings (chat API). */
export function toDate(value: number | string | null | undefined): Date | null {
  if (value === null || value === undefined || value === '') return null;
  const date = typeof value === 'number' ? new Date(value * 1000) : new Date(value);
  return Number.isNaN(date.valueOf()) ? null : date;
}

export function clock(value: number | string | null | undefined): string {
  const date = toDate(value);
  if (!date) return '—';
  return new Intl.DateTimeFormat('id-ID', { hour: '2-digit', minute: '2-digit', timeZone: tz }).format(date);
}

export function dayLabel(value: number | string | null | undefined): string {
  const date = toDate(value);
  if (!date) return '—';
  const fmt = (d: Date) => new Intl.DateTimeFormat('en-CA', { timeZone: tz }).format(d);
  const today = new Date();
  const yesterday = new Date(today.valueOf() - 86_400_000);
  if (fmt(date) === fmt(today)) return 'Hari ini';
  if (fmt(date) === fmt(yesterday)) return 'Kemarin';
  return new Intl.DateTimeFormat('id-ID', { weekday: 'long', day: 'numeric', month: 'short', timeZone: tz }).format(date);
}

export function dateTime(value: number | string | null | undefined): string {
  const date = toDate(value);
  if (!date) return '—';
  return new Intl.DateTimeFormat('id-ID', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit', timeZone: tz }).format(date);
}

export function ago(value: number | string | null | undefined, now = Date.now()): string {
  const date = toDate(value);
  if (!date) return 'belum ada';
  const seconds = Math.max(0, Math.round((now - date.valueOf()) / 1000));
  if (seconds < 60) return 'baru saja';
  const minutes = Math.round(seconds / 60);
  if (minutes < 60) return `${minutes} mnt lalu`;
  const hours = Math.round(minutes / 60);
  if (hours < 48) return `${hours} jam lalu`;
  return `${Math.round(hours / 24)} hari lalu`;
}

export function ageHours(value: number | string | null | undefined, now = Date.now()): number | null {
  const date = toDate(value);
  return date ? (now - date.valueOf()) / 3_600_000 : null;
}

export function today(): string {
  return new Intl.DateTimeFormat('id-ID', { weekday: 'long', day: 'numeric', month: 'long', timeZone: tz }).format(new Date());
}

export function greeting(): string {
  const hour = Number(new Intl.DateTimeFormat('en-GB', { hour: 'numeric', hour12: false, timeZone: tz }).format(new Date()));
  if (hour < 11) return 'Selamat pagi';
  if (hour < 15) return 'Selamat siang';
  if (hour < 18) return 'Selamat sore';
  return 'Selamat malam';
}

export function usd(value: number | null | undefined): string {
  if (value === null || value === undefined) return 'Tidak diketahui';
  return `US$${value.toFixed(value < 1 ? 3 : 2)}`;
}

/** "belum ada" when the denominator is zero — never a fake 0%. */
export function percent(ratio: { numerator: number; denominator: number; value: number | null }): string {
  if (!ratio.denominator || ratio.value === null) return 'belum ada';
  return `${Math.round(ratio.value * 100)}%`;
}

export function maskPhone(phone: string | null | undefined): string {
  if (!phone) return '—';
  const digits = phone.replace(/\D/g, '');
  if (digits.length < 6) return '•••';
  return `+${digits.slice(0, 2)} ${digits.slice(2, 5)}-•••-${digits.slice(-4)}`;
}

export function initials(name: string | null | undefined): string {
  const words = (name ?? '').replace(/[^\p{L}\p{N} ]/gu, ' ').trim().split(/\s+/).filter(Boolean);
  if (!words.length) return '?';
  return (words.length === 1 ? words[0].slice(0, 2) : words[0][0] + words[1][0]).toUpperCase();
}

export function parseJson<T>(value: unknown): T | null {
  if (value && typeof value === 'object') return value as T;
  if (typeof value !== 'string' || !value) return null;
  try {
    return JSON.parse(value) as T;
  } catch {
    return null;
  }
}

export function bubbles(body: string): string[] {
  return body.split(/\n\s*\n/).map(part => part.trim()).filter(Boolean);
}
