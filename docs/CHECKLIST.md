# CHECKLIST.md — Daftar Periksa Pengembangan Proyek

Gunakan daftar periksa (*checklist*) ini untuk memantau progres pembuatan aplikasi Sistem Kasir TeFa Percetakan & Fotocopy dari awal hingga siap digunakan di sekolah.

---

## Tahap 1: Persiapan & Fondasi Database
- [x] Inisialisasi proyek web (Next.js + TypeScript + Tailwind CSS + shadcn/ui).
- [x] Konfigurasi koneksi database PostgreSQL & skema ORM (`SCHEMA.md`).
- [x] Buat tabel `users` dengan 3 enum role: `AUDIT`, `TEACHER`, `ADMIN`.
- [x] Buat tabel `categories` dan `products` dengan pembeda `item_type` (`SERVICE` vs `GOODS`).
- [x] Buat tabel `shifts` dengan kolom 3 siswa petugas, 1 pengawas, rekonsiliasi kas, dan skor evaluasi guru.
- [x] Buat tabel `transactions` dan `transaction_items` dengan penanda `device_terminal` (`POS_1` / `POS_2`).
- [x] Buat tabel `stock_movements` dan `audit_logs` (*append-only*).
- [x] Buat *Database Seeder* untuk akun awal (1 Audit, 1 Guru Pembimbing dengan PIN default, 1 Admin Kasir) dan katalog awal TeFa Percetakan.

---

## Tahap 2: Autentikasi & Pengaturan Multi-Perangkat
- [x] Buat halaman Login dengan pengalihan halaman (*redirect*) otomatis sesuai role.
- [x] Pastikan akun `ADMIN` mendukung sesi login aktif di 2 perangkat/browser secara bersamaan.
- [x] Buat pemilih identitas terminal di sudut kiri atas layar Admin: **`[Perangkat Kasir 1 (POS_1)]`** atau **`[Perangkat Kasir 2 (POS_2)]`**.
- [x] Pasang *Middleware RBAC* agar Admin tidak bisa mengakses URL `/guru/*` atau `/audit/*`, dan Guru tidak bisa mengakses pengaturan akun milik Audit.

---

## Tahap 3: Modul Shared Shift (1 Laci untuk 2 Perangkat)
- [x] Buat validasi *Single Active Shift* (hanya boleh ada 1 shift berstatus `OPEN`).
- [x] Buat **Modal Buka Shift** dengan input manual wajib:
  - [x] Nama Siswa Bertugas 1
  - [x] Nama Siswa Bertugas 2
  - [x] Nama Siswa Bertugas 3
  - [x] Nama Siswa Pengawas
  - [x] Nominal Modal Awal di Laci
- [x] Pastikan perangkat kedua otomatis mendeteksi shift yang sudah dibuka perangkat pertama tanpa meminta input modal awal lagi.
- [x] Tampilkan bar informasi shift aktif beserta estimasi total uang tunai di laci secara *real-time*.
- [x] Buat **Modal Tutup Shift** yang menjumlahkan transaksi `POS_1` + `POS_2`, menerima input uang fisik tunai, dan menghitung status selisih (`BALANCE`, `MINUS`, `PLUS`).

---

## Tahap 4: Modul Katalog, Stok & Barang Rusak (Spoilage)
- [x] Buat halaman daftar katalog produk dengan badge pembeda **JASA (`SERVICE`)** dan **BARANG (`GOODS`)**.
- [x] Kunci harga di layar kasir (tidak boleh ada input ubah harga manual atau diskon bebas saat transaksi).
- [x] Buat form tambah produk baru & ubah harga modal/harga jual untuk Admin dan Guru Pembimbing.
- [x] Pasang pencatat `audit_logs` otomatis (menyimpan harga lama vs harga baru) setiap kali Admin mengubah harga atau menambah stok.
- [x] Buat form **Lapor Barang Rusak / Salah Print** dengan pilihan alasan (*Salah Print*, *Paper Jam*, *Bahan Cacat*, *Lainnya*) dan keterangan wajib.

---

## Tahap 5: Modul Kasir (POS), Pembayaran & Struk Thermal
- [x] Buat antarmuka kasir *Split-Screen* (Katalog di kiri, Keranjang di kanan).
- [x] Buat fitur pencarian cepat dan filter kategori (*Print & Copy*, *Jilid & Laminating*, *ID Card & Ganci*, *ATK*).
- [x] Buat input kuantitas (*qty*) yang bisa diketik angka langsung (untuk kasus print/fotocopy ratusan lembar).
- [x] Pastikan item tipe `SERVICE` bebas ditransaksikan tanpa batas stok, sedangkan tipe `GOODS` memotong stok gudang.
- [x] Buat modal pembayaran **Cash (Tunai)** dengan tombol nominal cepat dan kalkulator kembalian otomatis.
- [x] Buat modal pembayaran **QRIS Statis** (tampil QR code langsung konfirmasi tanpa input referensi).
- [x] Buat komponen cetak struk *thermal* 58mm/80mm (`@media print`) dan fitur *Reprint* struk dari menu Riwayat.

---

## Tahap 6: Modul Dual-Mode Void Approval (Pembatalan Transaksi)
- [x] Buat tombol **Batalkan Transaksi (Void)** di halaman Riwayat Transaksi Admin.
- [x] Buat **Tab Opsi 1 (PIN Supervisor di Tempat):** Input alasan batal + 6-digit PIN Guru Pembimbing di layar kasir -> langsung membatalkan transaksi & mengembalikan stok barang.
- [x] Buat **Tab Opsi 2 (Request ke Dashboard Guru):** Input alasan batal -> ubah status transaksi menjadi `VOID_REQUESTED` -> tampilkan notifikasi di dashboard Guru Pembimbing.
- [x] Buat tombol **Setujui / Tolak Void** di dashboard Guru Pembimbing.

---

## Tahap 7: Modul Guru Pembimbing (Verifikasi & Penilaian Siswa)
- [x] Buat *Alert Banner* di dashboard Guru untuk permintaan *Void* dan perubahan harga/stok oleh Admin.
- [x] Buat halaman **Verifikasi Tutup Shift** yang menampilkan rincian kas sistem vs uang fisik laci.
- [x] Buat form penilaian wajib sebelum shift diverifikasi:
  - [x] Input **Skor Nilai Tim Siswa (0–100)**.
  - [x] Input **Catatan Evaluasi / Berita Acara** (terutama bila terjadi selisih kas).
- [x] Buat halaman pengaturan ubah PIN 6-Digit Supervisor.

---

## Tahap 8: Modul Audit (Owner / Sekolah) & Export Laporan
- [x] Buat kartu ringkasan eksekutif (Total Omzet, HPP, Laba Bersih, Total Nilai Barang Rusak/Salah Print, Status Kas).
- [x] Buat halaman **Finalisasi Laporan Shift** (`VERIFIED_BY_TEACHER` -> `CLOSED_AUDITED`).
- [x] Buat tabel eksplorasi **Audit Log** dengan filter tanggal, role, dan tingkat keparahan (*Info*, *Warning*, *Critical*).
- [x] Buat fitur **Export Excel (`.xlsx`)** dan **Export PDF (`.pdf`)** untuk laporan keuangan, rekap nilai siswa, dan log audit.
- [x] Buat halaman Manajemen User (kelola akun Admin, Guru Pembimbing, dan Audit).
