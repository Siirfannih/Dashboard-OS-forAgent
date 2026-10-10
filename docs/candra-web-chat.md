# Chat web dengan agent sales (Candra)

Panduan integrasi. Tidak berisi kunci, alamat server, atau data percakapan.

## Cara kerja

- Agent sales berjalan di gateway Hermes miliknya sendiri dan sudah melayani pemilik lewat Telegram.
- Workspace **tidak** menjalankan engine agent kedua dan tidak menyimpan transkrip sendiri. Pesan dari halaman Ruang Tim diteruskan ke sesi Telegram DM pemilik yang sama, sehingga Telegram dan web berbagi satu riwayat dan satu memori.
- Gateway membaca ulang transkrip di setiap giliran, jadi giliran dari web langsung dikenali saat percakapan berlanjut di Telegram, dan sebaliknya.

## Akses

- Browser hanya memanggil `GET /api/v2/candra` dan `POST /api/v2/candra/messages` pada workspace. Keduanya wajib sesi login pemilik (cookie HttpOnly, SameSite=Strict, cek Origin).
- Backend workspace memanggil API server gateway agent yang hanya mendengarkan di localhost dan wajib **token akses** (Bearer). Token dibuat di server, disimpan di luar repository, dan tidak pernah dikirim ke browser.
- Toolset agent lewat jalur web dibatasi pada pekerjaan sales dan relasi pelanggan (data sales, peta, riset web, memori, skill, pencarian sesi, todo, web). Tidak ada terminal, akses file, atau penjadwalan.
- Persetujuan pengiriman WhatsApp tidak bisa diberikan lewat chat web; tetap lewat halaman Keputusan atau DM Telegram pemilik.

## Status yang ditampilkan

| Status | Arti |
|---|---|
| `not_configured` | Jalur web belum diaktifkan di server |
| `no_telegram_session` | Belum ada sesi Telegram DM; kirim satu pesan ke agent di Telegram |
| `gateway_unreachable` | Gateway agent tidak bisa dihubungi |
| `auth_failed` | Token akses ditolak gateway |
