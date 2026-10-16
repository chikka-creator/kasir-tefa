# DEPLOY.md — Panduan Deployment & Konfigurasi Operasional Sekolah

Dokumen ini berisi langkah-langkah instalasi, konfigurasi variabel lingkungan (*environment variables*), *deployment* ke server (Cloud maupun Server Lokal Sekolah), serta pengaturan 2 perangkat kasir dan printer *thermal*.

---

## 1. Prasyarat Sistem (System Requirements)

- **Runtime:** Node.js `v20.x LTS` atau lebih baru
- **Database:** PostgreSQL `v15+` (Bisa menggunakan Supabase, Neon, Railway, atau PostgreSQL di server lokal sekolah)
- **Perangkat Kasir:** 2 Unit PC / Laptop / Tablet dengan browser Chrome atau Edge terbaru
- **Printer Kasir:** Thermal Receipt Printer ukuran kertas **58mm** atau **80mm** (Koneksi USB / Bluetooth / LAN)

---

## 2. Konfigurasi Environment Variables (`.env`)

Buat file `.env` pada *root directory* proyek dan sesuaikan nilainya:

```env
# 1. Koneksi Database PostgreSQL
DATABASE_URL="postgresql://postgres:password@localhost:5432/tefa_pos_db?schema=public"

# 2. Rahasia Autentikasi & JWT Session
AUTH_SECRET="ganti-dengan-random-secret-minimal-32-karakter"
SESSION_MAX_AGE=86400 # 24 Jam (mendukung 1 shift penuh)

# 3. Pengaturan Identitas Sekolah & Struk Thermal
NEXT_PUBLIC_SCHOOL_NAME="SMK TEFA PERCETAKAN"
NEXT_PUBLIC_UNIT_NAME="Unit Produksi & Bisnis Percetakan Siswa"
NEXT_PUBLIC_RECEIPT_PAPER_SIZE="58mm" # Pilihan: "58mm" atau "80mm"

# 4. Konfigurasi Keamanan Default (Saat Seeding Awal)
INITIAL_AUDIT_USERNAME="audit_sekolah"
INITIAL_TEACHER_USERNAME="guru_tefa"
INITIAL_TEACHER_PIN="123456"
INITIAL_ADMIN_USERNAME="kasir_tefa"
```

---

## 3. Langkah Instalasi & Menjalankan Proyek

### A. Instalasi Dependensi & Migrasi Database
```bash
# 1. Install seluruh paket
npm install

# 2. Generate Prisma Client & terapkan skema ke database
npx prisma generate
npx prisma migrate deploy

# 3. Jalankan seeder untuk membuat 3 akun utama & katalog awal percetakan
npx prisma db seed
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

### Opsi 1: Cloud Deployment (Vercel + Supabase/Neon) — *Direkomendasikan*
Cocok jika ruang TeFa memiliki koneksi internet stabil, sehingga **Guru Pembimbing** dan **Audit (Kepala Sekolah/Kaprodi)** dapat memantau laporan dan meng-*approve* permintaan *Void* dari HP atau ruang guru.
1. Unggah *repository* ke GitHub.
2. Hubungkan proyek ke **Vercel** dan masukkan seluruh variabel `.env`.
3. Gunakan **Supabase** atau **Neon** sebagai *managed PostgreSQL database*.

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
