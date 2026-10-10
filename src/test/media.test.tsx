import { cleanup, render } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { splitMedia } from '../lib/format';
import { Markdown } from '../screens/ruangtim/Attachments';

afterEach(() => cleanup());

describe('lampiran agent (MEDIA:)', () => {
  it('memisahkan baris MEDIA dari teks', () => {
    const { text, media } = splitMedia('Ini filenya.\n\nMEDIA:/var/lib/x/workspaces/a.md\nMEDIA:/var/lib/x/cache/images/b.png');
    expect(text).toBe('Ini filenya.');
    expect(media).toEqual(['/var/lib/x/workspaces/a.md', '/var/lib/x/cache/images/b.png']);
  });

  it('tidak menganggap MEDIA di tengah kalimat atau path relatif sebagai lampiran', () => {
    expect(splitMedia('lihat MEDIA:/a.md di sini').media).toEqual([]);
    expect(splitMedia('MEDIA:relatif.md').media).toEqual([]);
  });

  it('markdown merender tabel dan tebal tanpa menyuntikkan HTML', () => {
    const { container } = render(<Markdown text={'# Judul\n\n| A | B |\n|---|---|\n| **x** | <img src=x onerror=alert(1)> |\n\n- satu\n- dua'} />);
    expect(container.querySelector('table')).not.toBeNull();
    expect(container.querySelectorAll('tbody tr').length).toBe(1);
    expect(container.querySelector('strong')?.textContent).toBe('x');
    expect(container.querySelector('img')).toBeNull();
    expect(container.querySelectorAll('li').length).toBe(2);
  });
});
