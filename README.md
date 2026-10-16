# Sistem Kasir TeFa Percetakan & Fotocopy

Aplikasi kasir (POS) untuk unit produksi dan bisnis percetakan siswa **SMK TeFa Percetakan**.
Dipakai bersama oleh 3 pihak: **siswa kasir**, **guru pembimbing**, dan **tim audit sekolah**.

Dibuat khusus untuk kebutuhan sekolah: uang Tunai dan QRIS dari dua perangkat kasir
dijabung ke satu laci fisik, dan setiap pembatalan transaksi harus lewat persetujuan guru.

**Versi daring (langsung dipakai):** <https://kasir-tefa.vercel.app>

---

## Daftar Isi

1. [Tiga Peran Pengguna](#tiga-peran-pengguna)
2. [Konsep 2 Kasir 1 Laci](#konsep-2-kasir-1-laci-penting-dipahami)
3. [Cara Pakai Sehari-hari](#cara-pakai-sehari-hari)
4. [Alur Lengkap Satu Hari Prakaktik](#alur-lengkap-satu-hari-praktik)
5. [Cara Install di Komputer Sendiri](#cara-install-di-komputer-sendiri)
6. [Kalau Nemu Error](#kalau-nemu-error)
7. [Cara Deploy ke Server Sendiri](#cara-deploy-ke-server-sendiri)
8. [Isi Folder Proyek](#isi-folder-proyek)
9. [Teknologi yang Dipakai](#teknologi-yang-dipakai)
10. [Catatan Keamanan](#catatan-keamanan)

---

## Tiga Peran Pengguna

Satu aplikasi, tiga tampilan berbeda. Tampilan dan hak aksesnya **otomatis menyesuaikan**
dengan akun yang dipakai login.

| Yang Dilakukan | Admin Kasir | Guru Pembimbing | Tim Audit |
| --- | :---: | :---: | :---: |
| Buka shift, isi modal kas, catat nama petugas | ya | - | - |
| Transaksi penjualan + cetak struk | ya | ya | - |
| Tambah produk / barang datang | ya | ya | ya |
| Ubah harga modal & harga jual | ya | ya | ya |
| Lapor barang rusak / salah cetak | ya | ya | ya |
| Batalkan transaksi | minta izin dulu | menyetujui | ya |
| Verifikasi tutup shift + nilai siswa | - | ya | - |
| Lihat untung-rugi | - | ya | ya |
| Lihat jejak audit (siapa mengubah apa) | - | sebagian | semua |
| Kelola akun & reset password | - | ganti PIN sendiri | ya |
| Tutup buku / finalisasi shift | - | - | ya |

**Akun bawaan:**

| Peran | Username | Password | PIN |
| --- | --- | --- | --- |
| Admin Kasir | `kasir_tefa` | `ADMIN123` | - |
| Guru Pembimbing | `guru_tefa` | `TEACHER123` | `123456` |
| Tim Audit | `audit_sekolah` | `AUDIT123` | - |

> Password di atas hanya berlaku untuk instalasi bawaan. Kalau kamu membuat database
> sendiri, `prisma db seed` akan **membuat password acak** dan menampilkannya di terminal.
> Catat yang muncul di layar.

---

## Konsep 2 Kasir 1 Laci (Penting Dipahami)

Inilah bedanya dengan kasir pada umumnya:

- Ada **2 komputer kasir**, tapi **1 Account Admin** dipakai di keduanya.
- Uang tunainya **tidak dipisah** — semuanya masuk ke **1 laci uang fisik** yang sama.
- Jadi sistem wajib menggabungkan laporan dari dua perangkat itu.

Sistem menanganinya begini:

| Yang | Disimpan Di Mana | Efeknya |
| --- | --- | --- |
| Keranjang belanja | Masing-masing browser | POS 1 dan POS 2 bisa layani 2 pembeli sekaligus, tidak saling ganggu |
| Laci uang & shift | Database (server) | Keduanya lihat angka yang sama, dan sinkron otomatis tiap 8 detik |

**Akibatnya:** shift baru cukup dibuka **satu kali** di perangkat pertama. Perangkat kedua
cukup login, lalu otomatis ikut ke shift yang sama dengan hanya memilih POS_1 atau POS_2 di
paling atas layar.

Saat tutup shift, sistem menjumlahkan semua penjualan tunai + QRIS dari dua perangkat,
lalu dibandingkan dengan uang fisik yang dihitung siswa. Hasilnya bisa:

| Status | Artinya |
| --- | --- |
| `BALANCE (Pas)` | Uang fisik = uang seharusnya. Bagus. |
| `MINUS (Kurang)` | Uang fisik kurang dari seharusnya. Perlu ditelusuri. |
| `PLUS (Lebih)` | Uang fisik lebih dari seharusnya. Perlu ditelusuri. |

---

## Cara Pakai Sehari-hari

### A. Admin Kasir - di halaman `/kasir`

**1. Pastikan identitas terminal sudah benar**

Paling atas layar ada dropdown "Perangkat Kasir". Atur **satu kali saja per komputer**:
komputer pertama = `POS_1`, komputer kedua = `POS_2`. Pengaturan ini tersimpan otomatis
di browser itu.

**2. Buka Shift (pada awal jam praktik)**

Klik tombol hijau **Buka Shift Kasir**, lalu isi:

- Nama 3 siswa yang bertugas
- Nama 1 siswa pengawas
- Modal awal uang di laci

Klik **Buka Shift**. Setelah itu tombol berubah jadi **Tutup Shift** dan angka laci
mulai bergerak otomatis.

**3. Melayani pembeli**

1. Klik produk di katalog (atau cari lewat kolom pencarian), atau klik tombol `+`.
2. Jumlah (*qty*) bisa diatur di keranjang sebelah kanan.
3. Pilih metode bayar: **CASH / TUNAI** atau **QRIS STATIS**.
4. Kalau tunai, isi **Uang Diterima**. Ada tombol pecahan cepat (10rb, 20rb, 50rb, 100rb)
   supaya tidak perlu ngetik. Kembalian terhitung otomatis.
5. Klik tombol bayar warna hijau.
6. Struk muncul di layar — klik **Cetak** untuk keluar dari printer thermal.

> **Tidak bisa ubah harga saat checkout.** Kalau ada versi print yang berbeda harganya
> (misal print warna teks ringan vs full gambar), harus dibuat sebagai **item terpisah**
> di katalog dulu. Ini disengaja supaya harga tidak bisa dikurangi sembarangan.

**4. Empat menu lainnya**

| Menu | Isinya |
| --- | --- |
| **Katalog & Stok** | Tambah produk, ubah harga, catat barang datang |
| **Riwayat Transaksi** | Lihat semua struk hari ini, ajukan pembatalan |
| **Lapor Salah Print (Spoilage)** | Kurangi stok karena kertas nyangkut / salah cetak / barang cacat |
| **Riwayat & Reprint** | Cetak ulang struk yang sudah keluar |

**5. Mengubah harga / menambah barang**

Masuk ke **Katalog & Stok**:

- **+ Tambah Produk Baru** — untuk item baru. Pilih *Jasa* (tidak ada stok, misal print A4)
  atau *Barang* (ada stok, misal ID Card).
- **Restock** — untuk barang yang datang dari luar. Wajib isi jumlah & catatan.
- **Edit** — klik item, ubah harga modal & harga jual baru. Langsung aktif.

Semua perubahan ini **otomatis tercatat di audit log** lengkap dengan nilai sebelum → sesudah,
dan muncul sebagai notifikasi di dashboard Guru serta Audit.

**6. Melaporkan barang rusak**

Masuk ke **Lapor Salah Print (Spoilage)**, pilih barang, isi jumlah, lalu pilih alasan:

| Kategori | Kapan dipakai |
| --- | --- |
| `PAPER_JAM` | Kertas nyangkut di printer |
| `SALAH_PRINT` | Cetak salah, kertas terbuang |
| `BARANG_CACAT` | Hasil produksi cacat |
| `LAINNYA` | Perlu tulis keterangan |

Stok langsung berkurang dan tercatat sebagai kerugian.

**7. Mengajukan pembatalan transaksi (Void)**

Transaksi yang sudah jadi **tidak bisa dihapus sendiri**. Ada 2 cara:

- **Cara A — Guru datang ke kasir.** Kasir klik riwayat → pilih struk → **Ajukan Pembatalan**,
  lalu masukkan PIN guru. Selesai, barang kembali ke stok.
- **Cara B — Guru di jauh.** Kasir **Ajukan Pembatalan** + isi alasan. Permintaan muncul
  di dashboard guru dalam **maksimal 15 detik**, tinggal klik Setujui / Tolak.

> Kalau transaksi dibatalkan, stok barang **otomatis kembali**. Kalau barangnya sudah
> rusak dan dibuang, pakai menu Spoilage — jangan pakai Void.

**8. Tutup Shift (akhir jam praktik)**

Klik **Tutup Shift**, lalu:

1. Hitung uang tunai fisik di laci, masukkan angkanya ke kolom
   **Hitungan Uang Tunai Fisik di Laci (Dihitung Manual)**.
2. Isi bagian QRIS kalau ada selisih antara yang tercatat dan yang benar-benar masuk
   ke rekening. Kalau sama persis, biarkan saja.
3. Tulis **Catatan Penutupan Shift**. Kolom ini **wajib diisi kalau ada selisih**.
4. Sistem langsung menampilkan status `PAS` / `KURANG` / `LEBIH`. Klik tombol tutup.

Setelah ditutup, shift masuk antrean **Guru Pembimbing**.

---

### B. Guru Pembimbing - di halaman `/guru`

Terdapat 3 tab. Halaman ini **menyegarkan sendiri setiap 15 detik**, jadi tidak perlu
tekan refresh kalau ada kasir yang minta izin.

**Tab 1 — Verifikasi Tutup Shift & Penilaian**

Shift yang sudah ditutup kasir akan muncul di sini. Klik untuk membuka, lalu akan terlihat:

- Rincian penjualan tunai & QRIS dari kedua perangkat
- Uang yang seharusnya vs uang fisik, serta status selisih
- Kolom skor 0–100 dan kolom catatan untuk tim siswa

Beri skor, tulis evaluasi, lalu klik **Verifikasi & Teruskan ke Audit**.

| Skor | Predikat |
| --- | --- |
| 90–100 | Sangat Baik (A) |
| 80–89 | Baik (B) |
| 70–79 | Cukup (C) |
| < 70 | Perlu Bimbingan |

**Tab 2 — Antrean Void Jarak Jauh**

Semua permintaan pembatalan dari kasir menumpuk di sini. Periksa alasan dan transaksi
yang relevan, lalu klik **Setujui** atau **Tolak**. Setelah disetujui, stok barang kembali.

**Tab 3 — Log Audit & Mutasi Kasir**

Rekam jejak setiap ada kasir yang mengubah harga, menambah stok, atau melaporkan barang
rusak. Gunanya buat memastikan tidak ada yang berhalangan.

Di bagian atas juga ada kartu **PIN Supervisor Aktif** dengan tombol **Ubah PIN** untuk
mengganti PIN kalau perlu.

---

### C. Tim Audit - di halaman `/audit`

Empat tab:

| Tab | Isi |
| --- | --- |
| **Analisis Financial & HPP** | Omzet, modal, laba bersih, margin, kontribusi POS 1 vs POS 2, kesehatan kas |
| **Finalisasi Tutup Shift** | Daftar shift menunggu finalisasi. Klik → isi catatan → **Tutup Buku** |
| **Audit Forensik (Append-Only)** | Semua jejak perubahan di sistem, tidak bisa dihapus |
| **Manajemen Akun & PIN** | Tambah akun, aktif/nonaktifkan, reset password |

Tombol **Export Excel (.xlsx)** mengunduh laporan keuangan lengkap.
Tombol **Cetak PDF** membuka versi siap cetak dari laporan yang sama.

> Audit adalah pintu **terakhir**. Shift baru dianggap "selesai buku" setelah Audit
> menekan Tutup Buku.

---

## Alur Lengkap Satu Hari Praktik

```
JAM   08.00   Admin buka shift + isi modal awal
       │
       │   (dua kasir melayani pembeli, semua laci & QRIS masuk 1 laci)
       │
JAM   13.00   Admin tutup shift + hitung uang fisik -> status PAS / KURANG / LEBIH
       │
       │   (guru membuka /guru, memberi skor 0-100 + evaluasi)
       ▼
       Guru verifikasi & teruskan ke Audit
       │
       │   (audit membuka /audit, cek laporan lalu tutup buku)
       ▼
       Selesai. Laporan siap di-export kapan saja.
```

Kalau ada void di tengah jalan, kasir **harus** minta izin guru dulu — tidak bisa
dibatalkan diam-diam. Inilah yang membuat uang kas sekolah bisa dipertanggungjawabkan.

---

## Cara Install di Komputer Sendiri

Kalau hanya mau **pakai**, jangan install apa-apa — buka
<https://kasir-tefa.vercel.app> dan langsung login.

Kalau mau **mengambil kodenya** (untuk mengubah tampilan, belajar, atau dipakai offline di
jaringan sekolah), ikuti langkah berikut.

### Yang Perlu Disiapkan Dulu

| Yang | Keterangan | Cara mendapatkannya |
| --- | --- | --- |
| **Node.js 20 atau lebih baru** | Program utama untuk menjalankan kode | Unduh dari [nodejs.org](https://nodejs.org) (pilih versi LTS) |
| **PostgreSQL 15 atau lebih baru** | Database tempat data disimpan | Unduh dari [postgresql.org/download](https://www.postgresql.org/download/) |
| **Git** | Untuk mengunduh kode | Dari [git-scm.com](https://git-scm.com/download/win) |
| **Editor kode** | Untuk melihat dan mengubah kode | [VS Code](https://code.visualstudio.com) (disarankan) |

> **Paling mudah untuk pemula:** pakai database online gratis, tidak perlu install
> PostgreSQL di komputer. Buat akun di [neon.tech](https://neon.tech), buat project,
> lalu salin connection string-nya (lihat langkah 4).

---

### Langkah 1 - Pastikan Node.js dan Git sudah ada

Buka **Command Prompt** (Windows) atau **Terminal** (Mac/Linux), lalu ketik:

```bash
node --version
git --version
```

Kalau muncul nomor versinya (contoh `v20.11.0` dan `2.43.0`), berarti sudah siap.
Kalau muncul error `not recognized`, install dulu Node.js lalu **tutup & buka ulang** terminalnya.

---

### Langkah 2 — Ambil Kode dari GitHub

```bash
git clone https://github.com/chikka-creator/kasir-tefa.git
cd kasir-tefa
```

---

### Langkah 3 — Install Semua Dependensi

```bash
npm install
```

Ini mengunduh semua library yang dibutuhkan. **Butuh koneksi internet**, tahan 1–3 menit.
Kalau selesai tanpa error, lanjut ke langkah 4.

---

### Langkah 4 - Isi File Konfigurasi `.env`

#### Opsi A — Pakai PostgreSQL Online (paling gampang untuk pemula)

1. Daftar di [neon.tech](https://neon.tech), buat project baru (pilih region terdekat).
2. Buka **Connect**, salin **connection string**. Yang berakhiran `-pooler` dipakai untuk
   menjalankan aplikasi; yang **tidak** ada `-pooler` dipakai untuk migrasi & seeding.
3. Salin file contoh lalu edit:

   **Windows (PowerShell):**
   ```powershell
   Copy-Item .env.example .env
   notepad .env
   ```

   **Mac / Linux:**
   ```bash
   cp .env.example .env
   nano .env
   ```

4. Ganti baris `DATABASE_URL` dengan connection string tadi, contoh:

   ```env
   DATABASE_URL="postgresql://USER:PASSWORD@ep-xxx.region.aws.neon.tech/neondb?sslmode=require"
   ```

5. Ganti juga `AUTH_SECRET` dengan teks acak yang panjangan, misalnya:
   ```env
   AUTH_SECRET="k4Tz9xQm2LpVn7RsYwBd3FgHj6Kl0Pq"
   ```

#### Opsi B — Pakai PostgreSQL Lokal

Kalau sudah menginstall PostgreSQL di komputer sendiri, buat dulu database kosong:

```sql
CREATE DATABASE tefa_pos_db;
```

Lalu di `.env`:
```env
DATABASE_URL="postgresql://postgres:PASSWORD_ANDA@localhost:5432/tefa_pos_db?schema=public"
```

---

### Langkah 5 - Siapkan Database (Migrasi dan Isi Data Awal)

```bash
npx prisma migrate dev
npx prisma db seed
```

Perintah pertama membuat semua tabel. Perintah kedua mengisi data awal: **3 akun**,
**4 kategori**, dan **14 produk** percetakan siap pakai.

> **Wajib dicatat:** perintah `db seed` akan mencetak **password acak** untuk ketiga akun
> di terminal, kira-kira begini:
>
> ```
> KREDENSIAL AKUN YANG BARU DIBUAT - CATAT SEKARANG, tidak akan ditampilkan lagi:
>   AUDIT   (audit_sekolah)  password: aBc123XyZ
>   TEACHER (guru_tefa)  password: mNo456PqR  PIN: 654321
>   ADMIN   (kasir_tefa)  password: sTu789VwX
> ```
>
> **Salin ke catatan atau screenshot sebelum terminal tertutup.** Password ini
> tidak bisa dilihat lagi lewat sistem.

---

### Langkah 6 — Jalankan Aplikasinya

```bash
npm run dev
```

Tunggu sampai muncul `Ready in ... detik`, lalu buka browser ke:

**http://localhost:3000**

Login pakai username & password dari langkah 5. Selesai — aplikasi jalan di komputer sendiri.

---

### Langkah 7 — Cara Menutup Aplikasi

Di terminal tempat aplikasi berjalan, tekan `Ctrl + C`. Untuk menjalankan lagi besok,
cukup buka terminal di folder proyek itu dan ketik `npm run dev` lagi.

---

## Kalau Nemu Error

| Masalah | Penyebab & Solusi |
| --- | --- |
| `Error: P1001 Can't reach database` | PostgreSQL tidak jalan / `DATABASE_URL` salah. Cek Postgres-nya hidup, cek username-password-nya benar. |
| `Error: P3005 Database schema is not empty` | Migrasi jalan sebagian. Jalankan `npx prisma migrate reset` (PERINGATAN: **menghapus semua data**). |
| Error `RESTRICT` saat menghapus shift | Ada data lama yang masih terhubung. Hapus manual lewat `npm run prisma:cleanup-test`. |
| `port 3000 is already in use` | Aplikasi lain sedang jalan di port itu. Jalankan `npm run dev -- -p 3001` dan buka `localhost:3001`. |
| `AUTH_SECRET` error saat login | `.env` belum diisi `AUTH_SECRET`, atau lupa restart `npm run dev` setelah edit `.env`. |
| Halaman stuck / loading lama sekali | Coba logout lalu login ulang. Kalau masih, buka terminal & tekan `Ctrl+C`, lalu jalankan ulang. |
| Lupa password admin | Pakai akun Audit: masuk ke `/audit` → tab **Manajemen Akun & PIN** → **Reset Password**. |

---

## Cara Deploy ke Server Sendiri

Kalau ingin menjalankan secara online dengan domain sendiri (misalnya supaya bisa diakses
dari luar kota), panduan lengkapnya ada di:

**[`docs/DEPLOY.md`](docs/DEPLOY.md)** — berisi setup Vercel, setup Neon, konfigurasi
environment variables, sampai konfigurasi printer thermal.

---

## Isi Folder Proyek

```
kasir-tefa/
│
├── docs/                       # Dokumentasi lengkap
│   ├── DEPLOY.md               # Panduan install & deploy ke server
│   ├── FEATURES.md             # Spesifikasi fitur & tabel hak akses
│   ├── ARCHITECTURE.md         # Diagram sistem & skema database
│   ├── SCHEMA.md               # Penjelasan tiap tabel database
│   ├── DESIGN.md               # Panduan tampilan & komponen UI
│   ├── CHECKLIST.md            # Daftar periksa sebelum dipakai
│
├── prisma/
│   ├── schema.prisma           # Struktur tabel database
│   ├── migrations/             # Riwayat perubahan tabel (jangan dihapus)
│   ├── seed.ts                 # Data awal (akun, kategori, produk)
│   ├── set-credentials.ts      # Ubah password akun yang sudah ada
│   └── cleanup-test-data.ts    # Hapus data uji, pertahankan akun & katalog
│
├── src/
│   ├── middleware.ts           # Penjaga akses: halaman + semua API
│   │
│   ├── app/
│   │   ├── (auth)/login/       # Halaman login semua role
│   │   ├── (pos)/kasir/        # Area kasir + katalog + riwayat + spoilage
│   │   ├── (supervisor)/guru/  # Portal Guru Pembimbing
│   │   ├── (owner)/audit/      # Dashboard Tim Audit
│   │   └── api/                # Semua endpoint backend
│   │
│   ├── components/             # Komponen UI (keranjang, struk, modal, panel)
│   ├── lib/                    # Logika bisnis (transaksi, stok, shift, audit)
│   └── store/                  # Penyimpanan data di browser (Zustand)
│
├── .env.example                # Contoh konfigurasi (aman untuk dibagikan)
└── package.json                # Daftar library yang dipakai
```

---

## Teknologi yang Dipakai

| Bagian | Dipakai |
| --- | --- |
| Framework | Next.js 14 (App Router) + React 18 + TypeScript |
| Tampilan | Tailwind CSS + Lucide Icons |
| Database | PostgreSQL + Prisma ORM |
| Login | JWT di dalam cookie, dengan pembatas 3 role |
| Penyimpanan di browser | Zustand |
| Laporan | SheetJS (untuk file Excel) |
| Hosting | Vercel + Neon |

---

## Catatan Keamanan

Beberapa hal penting yang perlu dijaga kalau dipakai sungguhan:

**1. Password default itu lemah.** `ADMIN123` / `TEACHER123` / `AUDIT123` mudah ditebak.
Segera ganti sebelum aplikasi dipakai siswa sungguhan:

```bash
# edit .env -> isi INITIAL_*_PASSWORD dengan password kuat
npm run prisma:set-credentials
```

**2. Jangan pernah menaruh password di `NEXT_PUBLIC_`.**
Prefix `NEXT_PUBLIC_` membuat nilai ikut terbundel ke dalam file yang dikirim ke browser —
siapa pun yang membuka Developer Tools bisa membacanya. Varian yang aman: `AUTH_SECRET`,
`DATABASE_URL`, `INITIAL_*_PASSWORD`.

**3. `AUTH_SECRET` wajib diisi di server.** Kalau dikosongkan, sistem pakai nilai cadangan
yang diketahui publik — artinya siapa pun bisa memalsukan sesi login kasir.

**4. Jangan edit file `.env` di dalam GitHub.** File itu sudah otomatis tidak ikut ter-*commit*
ke repository (sudah masuk `.gitignore`).

**5. Setiap ada endpoint API baru**, daftarkan di `API_ACCESS_RULES` (`src/middleware.ts`).
Endpoint yang tidak terdaftar akan otomatis ditolak — ini memang yang diinginkan supaya
tidak ada route yang lupa dikunci.

**6. Listrik & internet.** Untuk mode offline di sekolah, jalankan di satu PC server lokal
(lihat `docs/DEPLOY.md` bagian Opsi 2), atau tetap pakai versi online tapi siapkan
jalur cadangan.

---

## Repository & Tautan

- **Kode**: <https://github.com/chikka-creator/kasir-tefa>
- **Aplikasi daring**: <https://kasir-tefa.vercel.app>
- **Dokumentasi lengkap**: lihat folder [`docs/`](docs/)

---

<div align="center">

Dibuat khusus untuk **SMK TeFa Percetakan & Fotocopy**

</div>
