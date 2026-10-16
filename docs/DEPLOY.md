# DEPLOY.md — Panduan Deployment & Konfigurasi Operasional Sekolah

Dokumen ini berisi langkah-langkah instalasi, konfigurasi variabel lingkungan (*environment variables*), *deployment* ke server (Cloud maupun Server Lokal Sekolah), serta pengaturan 2 perangkat kasir dan printer *thermal*.

---

## 1. Prasyarat Sistem (System Requirements)

- **Runtime:** Node.js `v20.x LTS` atau lebih baru
- **Database:** PostgreSQL `v15+` (Bisa menggunakan Neon, Supabase, Railway, atau PostgreSQL di server lokal sekolah)
- **Perangkat Kasir:** 2 Unit PC / Laptop / Tablet dengan browser Chrome atau Edge terbaru
- **Printer Kasir:** Thermal Receipt Printer ukuran kertas **58mm** atau **80mm** (Koneksi USB / Bluetooth / LAN)

---

## 2. Konfigurasi Environment Variables (`.env`)

Buat file `.env` pada *root directory* proyek dan sesuaikan nilainya:

```env
# 1. Koneksi Database PostgreSQL
# PENTING: ada 2 endpoint pada Neon. Pilih sesuai keperluan:
#   - endpoint DIRECT  (tanpa "-pooler") -> untuk prisma migrate & db seed
#   - endpoint POOLER  (ada  "-pooler") -> untuk runtime aplikasi di Vercel,
#     WAJIB ditambah parameter pgbouncer=true
DATABASE_URL="postgresql://USER:PASSWORD@ep-xxx.region.aws.neon.tech/neondb?sslmode=require"

# 2. Rahasia Autentikasi & JWT Session (Minimal 32 karakter)
AUTH_SECRET="ganti-dengan-random-secret-minimal-32-karakter"
SESSION_MAX_AGE=86400 # 24 Jam (mendukung 1 shift penuh)

# 3. Pengaturan Identitas Sekolah & Struk Thermal
NEXT_PUBLIC_SCHOOL_NAME="SMK TEFA PERCETAKAN"
NEXT_PUBLIC_UNIT_NAME="Unit Produksi & Bisnis Percetakan Siswa"
NEXT_PUBLIC_RECEIPT_PAPER_SIZE="58mm" # Pilihan: "58mm" atau "80mm"

# 4. Kredensial Akun Awal (Saat Seeding)
# Password & PIN dikosongkan agar di-generate acak dan hanya dicetak ke console
# saat akun benar-benar baru dibuat. Isi manual bila ingin tertentu.
INITIAL_AUDIT_USERNAME="audit_sekolah"
INITIAL_AUDIT_PASSWORD=""
INITIAL_TEACHER_USERNAME="guru_tefa"
INITIAL_TEACHER_PASSWORD=""
INITIAL_TEACHER_PIN=""
INITIAL_ADMIN_USERNAME="kasir_tefa"
INITIAL_ADMIN_PASSWORD=""

# 5. Opsional
# Tiap-tiap akun demo 1-klik di halaman login DITAMPILKAN jika nilainya "true".
# WAJIB kosong/false di production agar username & password tidak bocor ke publik.
NEXT_PUBLIC_SHOW_DEMO_ACCOUNTS=""
```

> **Peringatan:** `AUTH_SECRET` fallback di `src/lib/auth.ts` dan `src/middleware.ts`
> (`tefa-pos-default-fallback-secret-key-32-chars-long`) hanya untuk development.
> **Selalu** set `AUTH_SECRET` di production, jika tidak siapa pun bisa memalsukan
> sesi kasir/guru/audit.

---

## 3. Langkah Instalasi & Menjalankan Proyek

### A. Instalasi Dependensi & Migrasi Database
```bash
# 1. Install seluruh paket
npm install

# 2. Generate Prisma Client & terapkan skema ke database
npx prisma generate
npx prisma migrate deploy   # atau `npx prisma migrate dev` saat development

# 3. Jalankan seeder untuk membuat 3 akun utama & katalog awal percetakan
#    (hanya perlu sekali, dan HANYA pada database yang masih kosong)
npx prisma db seed
```

Untuk mengembalikan database ke kondisi awal (⚠️ **menghapus semua data transaksi**):
```bash
npx prisma migrate reset   # drop + migrate + seed ulang
npx tsx prisma/cleanup-test-data.ts   # hanya menghapus data uji, mempertahankan akun & katalog
```

### B. Build & Menjalankan di Mode Produksi
```bash
# Build aplikasi
npm run build

# Jalankan server produksi (default port 3000)
npm run start
```

---

## 4. Opsi Deployment untuk Lingkungan Sekolah

### Opsi 1: Cloud Deployment (Vercel + Neon) — *Sudah Dilakukan, Produksi Aktif*

**URL Produksi:** <https://kasir-tefa.vercel.app>
**Repository:** <https://github.com/chikka-creator/kasir-tefa>
**Database:** Neon (region `us-east-2`)

Cocok jika ruang TeFa memiliki koneksi internet stabil, sehingga **Guru Pembimbing** dan **Audit (Kepala Sekolah/Kaprodi)** dapat memantau laporan dan meng-*approve* permintaan *Void* dari HP atau ruang guru.

#### Service Neon yang perlu diaktifkan
Aktifkan **hanya** `Postgres database`. `Object storage`, `Functions`, dan `AI gateway` tidak dipakai. `Realtime` boleh mati — sinkronisasi antar 2 POS dan portal guru/audit berjalan lewat *polling* HTTP, bukan Neon Realtime.

#### Langkah 1 — Siapkan database Neon
1. Buat project, **hanya** service `Postgres database`.
2. Buka **Connect** → salin **connection string endpoint DIRECT** (tanpa `-pooler`).
3. Salin juga **connection string endpoint POOLER** (ada `-pooler`) untuk runtime Vercel.

#### Langkah 2 — Migrasi & seed (dijalankan di komputer, sekali saja)
```bash
# .env lokal memakai endpoint DIRECT
npx prisma migrate dev      # membuat + menerapkan prisma/migrations/
npx prisma db seed          # membuat 3 akun + 4 kategori + 14 produk
```
`npx prisma db seed` akan mencetak **password acak** ke console HANYA jika akunnya benar-benar baru dibuat. **Catat password tersebut** — tidak akan ditampilkan lagi dan `AUTH_SECRET`/password tidak tersimpan di dalam repository.

#### Langkah 3 — Hubungkan ke Vercel
```bash
npm i -g vercel
vercel link --yes --project kasir-tefa      # hubungkan repo GitHub
vercel env add DATABASE_URL production      # pakai string POOLER + "&pgbouncer=true"
vercel env add AUTH_SECRET   production      # random minimal 32 karakter
# ... ulangi untuk SESSION_MAX_AGE, NEXT_PUBLIC_*, INITIAL_*
vercel --prod
```
Setelah repo terhubung, setiap `git push` ke `main` otomatis *rebuild* di Vercel.

#### Catatan penting
- **Jangan pernah** menaruh password atau `DATABASE_URL` di dalam `NEXT_PUBLIC_*` — prefix itu membuat nilainya ikut ter-*bundle* ke browser dan bisa dibaca siapa pun.
- Tambah endpoint API baru? Daftarkan di `API_ACCESS_RULES` (`src/middleware.ts`). Route yang tidak terdaftar otomatis ditolak (*default deny*).
- `next.config.mjs` tidak perlu diubah; `postinstall: prisma generate` sudah ada di `package.json`.

### Opsi 2: Local Network Deployment (LAN Sekolah / Offline-First)
Cocok jika komputer kasir TeFa tidak selalu terhubung ke internet luar:
1. Pasang aplikasi dan PostgreSQL di **1 PC Server Lokal / PC Kasir Utama**.
2. Atur IP Statis pada PC Server di jaringan Wi-Fi/LAN TeFa (contoh: `192.168.1.100`).
3. Jalankan aplikasi dengan perintah `npm run start -- -H 0.0.0.0 -p 3000`.
4. **Perangkat Kasir 1**, **Perangkat Kasir 2**, laptop **Guru Pembimbing**, dan **Audit** cukup membuka alamat `http://192.168.1.100:3000` melalui jaringan Wi-Fi TeFa yang sama.

---

## 5. Pengaturan 2 Perangkat Kasir & Thermal Printer

### 5.1. Konfigurasi Perangkat Kasir 1 & Perangkat Kasir 2
1. Buka browser di komputer pertama, login menggunakan akun **Admin (`kasir_tefa`)**.
2. Pada bar atas, pilih identitas perangkat: **`Perangkat Kasir 1 (POS_1)`**. Pilihan ini akan tersimpan otomatis di perangkat tersebut.
3. Buka browser di komputer kedua, login menggunakan akun **Admin (`kasir_tefa`)** yang sama.
4. Pada bar atas, pilih identitas perangkat: **`Perangkat Kasir 2 (POS_2)`**.
5. Kedua perangkat kini terhubung ke **1 Sesi Shift dan 1 Laci Uang** yang sama.

### 5.2. Konfigurasi Cetak Struk Cepat (Silent Print / Kiosk Printing)
Agar kasir siswa tidak perlu menekan tombol "Print" berulang kali di *dialog* browser setiap selesai transaksi:
1. Pasang driver *Thermal Printer* (58mm/80mm) dan jadikan sebagai **Default Printer** di Windows.
2. Pada pengaturan printer Windows, pastikan ukuran kertas diatur ke **Roll Paper 58mm / 80mm** dan matikan opsi *Headers and Footers* di dialog cetak Chrome.
3. *(Opsional)* Buat *shortcut* Google Chrome khusus kasir dengan flag `--kiosk-printing` agar ketika tombol **Bayar & Cetak Struk** ditekan, kertas struk langsung keluar detik itu juga.
