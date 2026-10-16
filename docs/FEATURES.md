# FEATURES.md — Spesifikasi Fitur & Hak Akses (RBAC)

Dokumen ini menjabarkan seluruh fitur fungsional Sistem Kasir TeFa Percetakan & Fotocopy beserta aturan bisnis untuk 3 role pengguna: **Audit (Owner/Sekolah)**, **Guru Pembimbing**, dan **Admin (Kasir Siswa)**.

---

## 1. Matriks Hak Akses (Role-Based Access Control)

| Modul / Fitur | Admin (Kasir Siswa) | Guru Pembimbing | Audit (Owner/Sekolah) |
| :--- | :---: | :---: | :---: |
| **Skema Akun** | 1 Akun (Dipakai di 2 Perangkat) | 1 Akun Supervisor | Akun Superadmin |
| **Buka & Tutup Shift Kasir** | ✅ Ya (Input 3 Petugas + 1 Pengawas) | ❌ Hanya Verifikasi | ❌ Hanya Pantau & Audit |
| **Transaksi Kasir (POS) & Cetak Struk** | ✅ Ya (`POS_1` & `POS_2`) | ✅ Bisa Akses (Jika Perlu) | ❌ Tidak |
| **Ubah Harga Manual Saat Checkout** | ❌ Dilarang (Terkunci Katalog) | ❌ Dilarang (Terkunci Katalog) | ❌ Dilarang |
| **Batalkan Transaksi (Void/Refund)** | ⚠️ Hanya Request / Panggil PIN | ✅ Approve via Dashboard / PIN | ✅ Full Akses |
| **Tambah Produk & Tambah Stok Masuk** | ✅ Ya (Tercatat di Audit Log) | ✅ Ya (Tercatat di Audit Log) | ✅ Ya |
| **Ubah Harga Modal & Harga Jual Katalog** | ✅ Ya (Langsung Aktif + Alert Log) | ✅ Ya (Langsung Aktif + Alert Log) | ✅ Ya |
| **Kurangi Stok (Barang Rusak / Salah Print)** | ✅ Ya (Wajib Isi Alasan) | ✅ Ya (Wajib Isi Alasan) | ✅ Ya |
| **Verifikasi Selisih Kas Tutup Shift** | ❌ Tidak | ✅ Ya (Verifikasi Tahap 1) | ✅ Ya (Finalisasi Tutup Buku) |
| **Beri Nilai (0-100) & Evaluasi Tim Siswa** | ❌ Tidak | ✅ Ya (Saat Verifikasi Shift) | 👀 Lihat & Export Nilai |
| **Lihat Laporan Laba/Rugi & HPP** | ❌ Disembunyikan | ✅ Ya | ✅ Ya (Full Analytics) |
| **Lihat Audit Log (Rekam Jejak Sistem)** | ❌ Tidak | ✅ Log Operasional Kasir | ✅ Semua Log (Global) |
| **Export Laporan (Excel / PDF)** | ❌ Tidak | ✅ Laporan Shift & Nilai Siswa | ✅ Semua Laporan Keuangan & Log |
| **Manajemen Akun & Reset Password/PIN** | ❌ Tidak | ✅ Atur PIN Supervisor Sendiri | ✅ Kelola Semua Akun & PIN |

---

## 2. Rincian Fitur Utama

### 2.1. Sesi Shift Bersama 2 Perangkat & 1 Laci Uang (*Shared Shift*)
- **Input Tim Siswa Manual:** Setiap buka shift, Admin wajib mengetik nama **3 Siswa Bertugas** dan **1 Siswa Pengawas**, serta memasukkan **Modal Awal Laci**.
- **Sinkronisasi Otomatis:** Perangkat kasir kedua yang menggunakan akun Admin yang sama otomatis bergabung ke sesi shift yang sedang aktif tanpa menduplikasi modal awal.
- **Rekonsiliasi Laci Gabungan:** Saat tutup shift, sistem menjumlahkan penjualan tunai (`CASH`) dan non-tunai (`QRIS`) dari Perangkat 1 dan Perangkat 2, lalu membandingkannya dengan uang fisik yang dihitung siswa (`BALANCE`, `MINUS`, atau `PLUS`).

### 2.2. Katalog Produk Percetakan (Jasa vs Barang Fisik)
- **Tipe Jasa/Layanan (`SERVICE`):** Meliputi *Print Hitam Putih*, *Print Warna Teks*, *Print Warna Full*, *Fotocopy*, *Laminating*, *Jilid*, dll. Tidak dibatasi jumlah stok saat transaksi di kasir, namun tetap menyimpan estimasi HPP per lembar/unit untuk perhitungan laba bersih.
- **Tipe Barang Fisik (`GOODS`):** Meliputi *Gantungan Kunci (Ganci)*, *ID Card PVC*, *Kertas Foto*, *Stiker*, *ATK/Bahan*. Memiliki jumlah stok gudang yang otomatis berkurang saat terjual dan bertambah kembali jika transaksi di-*void*.
- **Variasi Harga Terkunci di Katalog:** Kasir tidak dapat mengubah harga satuan atau memberi diskon bebas di layar keranjang. Semua variasi harga (misal: harga print blok warna vs teks, atau harga ganci grosir) wajib dipilih dari daftar item terpisah di katalog.

### 2.3. Kelola Stok, Harga & Pencatatan Salah Print (*Instant Active + Audit Trail*)
- **Perubahan Langsung Aktif:** Admin maupun Guru Pembimbing dapat menginput barang baru, menambah stok barang datang, serta memperbarui harga modal dan harga jual tanpa menunggu persetujuan yang menghambat antrean kasir.
- **Notifikasi & Log Otomatis:** Setiap perubahan harga atau stok oleh Admin langsung memicu peringatan (*Warning Badge*) di dashboard Guru Pembimbing dan Audit, lengkap dengan perbandingan nilai sebelum dan sesudah diubah.
- **Menu Barang Rusak / Salah Print (*Spoilage*):** Admin dapat mengurangi stok karena kertas nyangkut (*paper jam*), salah cetak, atau bahan rusak dengan syarat wajib memilih kategori penyebab dan menulis keterangan alasan.

### 2.4. Pembayaran Langsung Lunas (*Direct POS*: Cash & QRIS Statis)
- Seluruh pesanan dibayar lunas di tempat (*Direct POS*).
- Mendukung metode **Cash** (dilengkapi kalkulator uang kembalian & tombol pecahan cepat) dan **QRIS Statis** (pembeli memindai papan QRIS di meja kasir, kasir memverifikasi bukti bayar dan mencatat transaksi).
- Mendukung cetak struk langsung ke **Thermal Printer (58mm/80mm)** dan penyimpanan riwayat struk untuk cetak ulang (*reprint*).

### 2.5. Dual-Mode Void Approval (Otorisasi Pembatalan Transaksi)
Transaksi yang sudah selesai tidak dapat dihapus sendiri oleh Admin, melainkan harus melewati salah satu dari 2 jalur otorisasi Guru Pembimbing:
1. **Otorisasi PIN di Tempat:** Guru Pembimbing menghampiri meja kasir dan memasukkan **6-Digit PIN Supervisor** pada layar kasir.
2. **Otorisasi Jarak Jauh via Dashboard:** Admin mengirim pengajuan batal beserta alasannya dari layar kasir, lalu Guru Pembimbing menekan tombol **Setujui** dari laptop/HP-nya.

### 2.6. Alur Estafet Verifikasi Kas & Penilaian Akademik
1. **Admin** menutup shift dan menginput jumlah uang fisik di laci.
2. **Guru Pembimbing** memeriksa laporan shift tersebut, menginvestigasi jika terdapat selisih kas (`MINUS`/`PLUS`), memberikan **Skor Nilai (0–100)** dan **Catatan Evaluasi** untuk tim piket (3 petugas + 1 pengawas), lalu menekan tombol **Verifikasi & Teruskan ke Audit**.
3. **Audit (Pihak Sekolah)** menerima laporan yang telah diverifikasi guru, memantau laporan laba-rugi bersih, memeriksa *Audit Log*, mengunduh laporan dalam format **Excel/PDF**, dan melakukan finalisasi tutup buku.
