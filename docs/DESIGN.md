# DESIGN.md — Panduan Desain Antarmuka & Pengalaman Pengguna (UI/UX)

Dokumen ini menjadi acuan visual dan tata letak (*UI/UX Blueprint*) untuk pengembangan website Sistem Kasir TeFa Percetakan Sekolah. Pendekatan desain mengutamakan **kejelasan fungsional, tipografi yang tegas, minim distraksi (*editorial utilitarian minimalism*)**, serta kecepatan pengoperasian di meja kasir.

---

## 1. Filosofi Desain & Identitas Visual

1. **Tegas, Bersih, dan Fungsional (Zero Visual Clutter):**
   - Menghindari gradasi warna berlebihan, bayangan (*drop shadow*) yang kabur, atau dekorasi yang tidak memiliki fungsi operasional.
   - Menggunakan garis batas tipis yang presisi (`1px solid`), kontras teks yang tinggi, dan pemisahan ruang yang jelas antara area katalog dan ringkasan pembayaran.
2. **Keterbacaan Angka & Kecepatan Kasir (*Tabular Numerals*):**
   - Seluruh nominal uang, jumlah lembar print, stok, dan perhitungan selisih kas wajib menggunakan properti CSS `font-variant-numeric: tabular-nums` (atau font *monospace*) agar digit angka sejajar vertikal dan mudah diperiksa oleh siswa maupun Guru Pembimbing.

---

## 2. Sistem Warna & Tipografi

### 2.1. Palet Warna (CSS Variables)
| Token Warna | Kode Hex | Penggunaan Utama |
| :--- | :--- | :--- |
| **Background Primary** | `#F7F6F2` | Latar belakang utama aplikasi (Warm Alabaster / Kertas bersih, tidak membuat mata cepat lelah saat jaga kasir lama). |
| **Surface / Card** | `#FFFFFF` | Panel keranjang kasir, tabel laporan, kartu katalog produk. |
| **Text Primary** | `#18181B` | Teks utama, nama produk, nominal total belanja. |
| **Text Muted** | `#71717A` | Label sekunder, SKU, timestamp, informasi HPP. |
| **Border Subtle** | `#E4E4E7` | Garis pemisah tabel, kartu katalog, dan struk. |
| **Primary Accent (Ink)** | `#1E293B` | Tombol aksi utama (Bayar, Buka Shift, Verifikasi), navigasi aktif. |
| **Service Badge (Jasa)** | `#0284C7` (Teks) / `#E0F2FE` (Bg) | Penanda item tipe **Jasa/Layanan** (Print, Fotocopy, Jilid — Tanpa Stok). |
| **Goods Badge (Barang)** | `#4F46E5` (Teks) / `#E0E7FF` (Bg) | Penanda item tipe **Barang Fisik** (Ganci, ID Card, Kertas Foto — Pakai Stok). |
| **Status: Balance / Aman** | `#15803D` (Teks) / `#DCFCE7` (Bg) | Status kas `BALANCE`, transaksi `PAID`, stok mencukupi. |
| **Status: Warning / Alert** | `#B45309` (Teks) / `#FEF3C7` (Bg) | Notifikasi perubahan harga oleh Admin, status `PENDING_VERIFICATION`, selisih `PLUS`. |
| **Status: Danger / Void** | `#B91C1C` (Teks) / `#FEE2E2` (Bg) | Status kas `MINUS` (kurang), tombol Void/Batal, barang rusak/salah print. |

### 2.2. Tipografi
- **UI & Heading:** `Plus Jakarta Sans` atau `Inter` (Ukuran dasar `14px`–`16px`, *line-height* `1.5`).
- **Angka Nominal, Kode Struk & Tabel Kas:** `JetBrains Mono` atau `IBM Plex Mono` (`font-variant-numeric: tabular-nums`).

---

## 3. Arsitektur Layar per Role (Wireframe & Layout Specification)

### 3.1. Layar Role: ADMIN (Kasir Siswa)

#### A. Top Bar (Status Shared Shift & Identitas Perangkat)
Terletak permanen di bagian paling atas layar (`height: 56px`):
- **Kiri:** Logo TeFa Sekolah + Pemilih Identitas Perangkat: Badge **`[Perangkat Kasir 1]`** atau **`[Perangkat Kasir 2]`**.
- **Tengah (Info Shift Bersama):** Menampilkan status aktif:
  `🟢 Shift Aktif (#SHF-01) | Tim: Andi, Budi, Citra (Pengawas: Dedi) | Kas Laci Saat Ini: Rp 345.000`
- **Kanan:** Navigasi tab cepat: `[1. Kasir POS]` `[2. Riwayat & Void]` `[3. Katalog & Stok]` `[4. Lapor Salah Print/Rusak]` + Tombol merah **`[Tutup Shift]`**.

#### B. Halaman Utama POS (Split-Screen 65% : 35%)
```text
+---------------------------------------------------+-------------------------------+
| [Cari item / ketik nama layanan...]  [Semua] [Print] [Jilid] [Ganci/ID]           |
|---------------------------------------------------| KERANJANG TRANSAKSI           |
| +---------------+ +---------------+ +-----------+ | Perangkat: POS 1              |
| | [JASA]        | | [JASA]        | | [BARANG]  | |-------------------------------|
| | Print A4 B/W  | | Print A4 Wrn  | | Cetak ID  | | 1. Print A4 B/W               |
| | Teks Biasa    | | Full Gambar   | | Card PVC  | |    [ 45 ] lbr x Rp500 = 22.500|
| | Rp 500 / lbr  | | Rp 2.500 /lbr | | Rp 15.000 | | 2. Jilid Lakban               |
| | Stok: ∞       | | Stok: ∞       | | Stok: 84  | |    [  1 ] pcs x Rp3.000= 3.000|
| +---------------+ +---------------+ +-----------+ |-------------------------------|
|                                                   | Total Item: 2 (46 unit)       |
| (Catatan: Harga terkunci sesuai katalog.          | TOTAL TAGIHAN:                |
|  Kasir hanya klik item & ketik jumlah kuantitas)  | Rp 25.500                     |
|                                                   |-------------------------------|
|                                                   | Metode Bayar:                 |
|                                                   | (•) CASH / TUNAI  ( ) QRIS    |
|                                                   | Uang Diterima: [ Rp 50.000  ] |
|                                                   | [Uang Pas] [20rb] [50rb]      |
|                                                   | Kembalian    : Rp 24.500      |
|                                                   |                               |
|                                                   | [ BAYAR & CETAK STRUK (F9) ]  |
+---------------------------------------------------+-------------------------------+
```

#### C. Modal Dual-Mode Void (Saat Kasir Klik "Batalkan Transaksi")
Saat transaksi yang sudah lunas ingin dibatalkan, muncul *dialog modal* dengan 2 tab:
1. **Tab 1: Input PIN Guru di Tempat (Instan)**
   - Field: *Alasan Pembatalan* (wajib diisi, misal: "Salah input jumlah lembar print").
   - Field: *6-Digit PIN Supervisor* (diinput langsung oleh Guru Pembimbing di meja kasir).
   - Tombol: `[Verifikasi PIN & Batalkan Sekarang]`.
2. **Tab 2: Kirim Permintaan ke Dashboard Guru (Remote)**
   - Field: *Alasan Pembatalan*.
   - Tombol: `[Kirim Request Approval ke Guru Pembimbing]`. Status struk berubah menjadi *Menunggu Persetujuan Guru*.

#### D. Form Lapor Barang Rusak / Salah Print (*Spoilage*)
- Form ringkas 1 halaman agar siswa jujur dan mudah melapor saat terjadi *paper jam* atau gagal cetak:
  - **Pilih Barang/Bahan:** Dropdown item katalog (atau kertas/bahan baku).
  - **Jumlah Rusak/Terbuang:** Input angka.
  - **Kategori Penyebab:** Radio button (`Salah Print / Setting`, `Kertas Nyangkut (Paper Jam)`, `Bahan Cacat Produksi`, `Lainnya`).
  - **Keterangan Detail:** Textarea singkat.

---

### 3.2. Layar Role: GURU PEMBIMBING (Supervisor & Evaluator)

Dirancang sebagai *Control & Coaching Center* dengan 4 komponen utama:
1. **Alert Banner (Bagian Atas):**
   - Muncul otomatis jika ada:
     - 🔴 **Permintaan Void Menunggu Persetujuan** (lengkap dengan tombol `[Setujui]` / `[Tolak]`).
     - 🟡 **Peringatan Perubahan Harga/Stok oleh Admin** (menampilkan produk apa yang diubah harganya oleh siswa kasir beserta harga lama vs harga baru).
2. **Panel Verifikasi Tutup Shift & Penilaian Siswa (Fitur Inti Guru):**
   - Menampilkan kartu perbandingan berdampingan (*Side-by-Side Comparison*):
     - **Kolom Kiri (Data Sistem Gabungan POS 1 & POS 2):** Modal Awal, Total Tunai Sistem, Total QRIS Sistem, Daftar Void, Daftar Salah Print/Rusak.
     - **Kolom Kanan (Input Fisik Siswa & Evaluasi Guru):**
       - Uang Fisik Dihitung Siswa + Indikator Selisih (`BALANCE Rp 0` / `MINUS -Rp 10.000` / `PLUS +Rp 5.000`).
       - **Input Skor Nilai Tim (0 - 100):** Slider atau *number box* tegas untuk menilai kinerja 3 siswa bertugas + 1 pengawas.
       - **Catatan Evaluasi / Berita Acara:** Textarea wajib isi (terutama jika ada selisih kas).
       - Tombol Utama: **`[Verifikasi & Teruskan Laporan ke Audit]`**.
3. **Manajemen Katalog & Pengaturan PIN Supervisor:**
   - Tabel katalog untuk menambah variasi harga baru atau mengoreksi harga yang diinput siswa.
   - Pengaturan ubah **PIN 6-Digit Supervisor** untuk otorisasi *void* di kasir.

---

### 3.3. Layar Role: AUDIT (Owner / Pihak Sekolah)

Dirancang sebagai *Executive & Forensic Dashboard*:
1. **KPI Cards (4 Kartu Ringkasan Atas):**
   - **Total Omzet Kotor** (Cash + QRIS)
   - **Estimasi Laba Bersih** (Omzet dikurangi Total HPP/Modal & Nilai Barang Rusak)
   - **Status Rekonsiliasi Kas Shift** (Jumlah shift *Balance* vs *Selisih*)
   - **Aktivitas Sensitif (Audit Alert)** (Jumlah perubahan harga/stok & void minggu ini)
2. **Tabel Arsip Shift Terverifikasi & Nilai Siswa:**
   - Menampilkan laporan shift yang sudah diperiksa dan diberi nilai oleh Guru Pembimbing, lengkap dengan tombol **`[Finalisasi / Tutup Buku]`**.
3. **Tabel Audit Log (Rekam Jejak Forensik):**
   - Dilengkapi filter berdasarkan Tanggal, Role (`ADMIN` / `TEACHER`), dan Jenis Aksi (`Ubah Harga`, `Kurangi Stok Rusak`, `Void Transaksi`, `Selisih Kas`).
   - Menampilkan perbandingan jelas: `Harga Jual: Rp 2.000 ➔ Rp 1.500 (Diubah oleh: Admin POS 1 - Shift Tim Andi dkk)`.
4. **Action Bar Export Laporan:**
   - Tombol unduh instan: **`[Export Excel (.xlsx)]`** dan **`[Export PDF (.pdf)]`**.

---

## 4. Desain Layout Struk Thermal Printer (58mm / 80mm)

Struk dirancang menggunakan font *monospace* murni agar presisi saat dicetak melalui *browser print dialog* (`@media print`) ke printer thermal kasir:

```text
================================
      TEFA PERCETAKAN SMK       
   Unit Produksi & Bisnis Siswa 
================================
No Struk : INV-20261014-0012
Tanggal  : 14/10/2026 10:42 WIB
Terminal : Perangkat Kasir 1
Tim Jaga : Andi, Budi, Citra
Pengawas : Dedi
--------------------------------
Print A4 Hitam Putih
45 x 500                  22.500
Print A4 Warna Full
4 x 2.500                 10.000
Jilid Lakban
1 x 3.000                  3.000
--------------------------------
TOTAL TAGIHAN          Rp 35.500
Bayar (CASH)           Rp 50.000
Kembalian              Rp 14.500
================================
  Terima Kasih Atas Kunjungan   
  Simpan Struk Sebagai Bukti    
================================
```
