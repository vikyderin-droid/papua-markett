# PAPUA MARKET

Marketplace produk lokal Papua. Aplikasi **full-stack**: React + Vite (tampilan) dan
Express (API, keranjang, login, checkout) dengan database file JSON di `data/`.

## Menjalankan di VS Code (localhost)

Prasyarat: **Node.js 20 atau lebih baru** (https://nodejs.org).

1. Buka folder proyek di VS Code, lalu buka Terminal (`Ctrl + ``).
2. Pasang dependensi (cukup sekali; hapus folder `node_modules` lama jika ada):
   ```
   npm install
   ```
3. Jalankan:
   ```
   npm run dev
   ```
4. Buka **http://localhost:3000** di browser.

> Jangan membuka `index.html` langsung atau memakai Live Server. Tampilan hanya
> berjalan lewat `npm run dev` karena data produk diambil dari server `/api`.

Port lain: `PORT=3001 npm run dev` (Mac/Linux) atau `$env:PORT=3001; npm run dev` (PowerShell).

## Akun demo (kata sandi: `papua123`)

| Peran   | Email                       |
|---------|-----------------------------|
| Pembeli | pembeli@papuamarket.id      |
| Penjual | penjual@papuamarket.id      |
| Admin   | admin@papuamarket.id        |

Ganti kata sandi akun demo sebelum website dipublikasikan.

## Mode produksi

```
npm run build:start
```
(`npm run build` membuat folder `dist/`, lalu server menyajikannya di port 3000.)

## Deployment

Website ini **butuh server Node.js**, sehingga **tidak bisa berjalan di GitHub Pages**
(hosting statis tanpa backend). Gunakan layanan yang menjalankan Node.js, misalnya
Render, Railway, Fly.io, atau VPS:

- Build command: `npm install && npm run build`
- Start command: `npm start`
- Variabel `PORT` biasanya diisi otomatis oleh hosting.
- Database `data/papua-market-db.json` dan gambar unggahan `uploads/` disimpan di disk.
  Aktifkan **persistent disk/volume** di hosting, jika tidak data hilang setiap redeploy.
- Pembayaran dan kurir pada website ini masih **simulasi**.
- Untuk trafik nyata, pindahkan database ke PostgreSQL/MySQL
  (skema tersedia di `database/papua_market.sql`).
