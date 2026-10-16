# PLAN.md — Rencana Pengembangan Proyek (Development Roadmap)

Dokumen ini menyusun tahapan pengerjaan proyek Sistem Kasir TeFa Percetakan & Fotocopy secara sistematis agar setiap modul dapat diuji dengan baik sebelum digunakan secara penuh di sekolah.

---

## Fase 1: Fondasi Sistem, Database & RBAC (Minggu 1)
**Fokus:** Membangun kerangka proyek, skema database, dan sistem login 3 role.
1. Setup repositori Next.js (TypeScript, Tailwind CSS, shadcn/ui) dan koneksi PostgreSQL + Prisma.
2. Implementasi seluruh tabel sesuai `SCHEMA.md` (`users`, `categories`, `products`, `shifts`, `transactions`, `transaction_items`, `stock_movements`, `audit_logs`).
3. Implementasi autentikasi multi-role (`AUDIT`, `TEACHER`, `ADMIN`) dan pengaturan *concurrent login* agar 1 akun Admin dapat dipakai di 2 perangkat kasir secara bersamaan.
4. Pembuatan data awal (*seeder*) katalog TeFa Percetakan (Print, Fotocopy, Jilid, Laminating, ID Card, Ganci, Stiker, Cetak Foto).

---

## Fase 2: Sesi Shift Bersama & Layar Kasir POS (Minggu 2)
**Fokus:** Memastikan operasional inti kasir berjalan lancar di 2 perangkat dengan 1 laci uang.
1. Pembuatan fitur **Buka Shift Bersama** (input manual 3 siswa bertugas + 1 siswa pengawas + modal awal laci).
2. Pembuatan mekanisme sinkronisasi `POS_1` dan `POS_2` terhadap shift yang sedang aktif.
3. Pengembangan layar kasir *Split-Screen*: pencarian katalog cepat, filter kategori, pembeda item `SERVICE` (tanpa stok) vs `GOODS` (pakai stok), dan input kuantitas cepat.
4. Implementasi pembayaran **Cash** dan **QRIS Statis** serta pencetakan struk *Thermal Printer* 58mm/80mm.

---

## Fase 3: Manajemen Inventori, Salah Print & Audit Trail (Minggu 3)
**Fokus:** Mengamankan perubahan stok dan harga dengan pencatatan rekam jejak otomatis.
1. Pembuatan halaman manajemen katalog produk (tambah produk, restock barang datang, edit harga modal & harga jual).
2. Pembuatan *Interceptor Audit Log* yang otomatis merekam `old_values` dan `new_values` setiap kali Admin mengubah harga atau stok.
3. Pembuatan form **Barang Rusak / Salah Print (*Spoilage*)** dengan kewajiban mengisi alasan pengurangan stok.
4. Pembuatan fitur **Tutup Shift** dengan kalkulasi otomatis uang sistem gabungan (`POS_1` + `POS_2`) vs uang fisik laci (`BALANCE`, `MINUS`, `PLUS`).

---

## Fase 4: Modul Guru Pembimbing — Dual Void & Evaluasi Siswa (Minggu 4)
**Fokus:** Menghadirkan fungsi pengawasan operasional dan bimbingan akademik siswa.
1. Implementasi **Dual-Mode Void Approval**:
   - Validasi PIN 6-Digit Guru Pembimbing langsung di layar kasir.
   - Pengajuan *Void Request* dari kasir ke *Alert Banner* di dashboard Guru Pembimbing.
2. Pembuatan halaman **Verifikasi Tutup Shift** untuk Guru Pembimbing.
3. Implementasi form penilaian tim siswa (**Skor 0–100** + **Catatan Evaluasi / Berita Acara Selisih Kas**).

---

## Fase 5: Modul Audit (Owner/Sekolah), Analitik & Export Data (Minggu 5)
**Fokus:** Menyediakan transparansi keuangan dan laporan resmi sekolah.
1. Pembuatan dashboard eksekutif Role Audit (Omzet Kotor, HPP, Pengurangan Nilai Barang Rusak, Laba Bersih).
2. Pembuatan halaman eksplorasi **Audit Log Forensik** dengan filter lengkap.
3. Pembuatan fitur finalisasi tutup buku (`CLOSED_AUDITED`) dan manajemen akun pengguna.
4. Implementasi fitur **Export ke Excel (`.xlsx`)** dan **Export ke PDF (`.pdf`)** untuk laporan keuangan, rekap nilai shift siswa, dan mutasi stok.

---

## Fase 6: Pengujian Lapangan (UAT) di Ruang TeFa (Minggu 6)
**Fokus:** Simulasi transaksi nyata dengan 2 perangkat kasir dan printer thermal.
1. Uji coba transaksi serentak di `POS_1` dan `POS_2` menggunakan 1 laci uang.
2. Uji cetak struk fisik pada printer thermal 58mm/80mm.
3. Simulasi skenario *edge-case*: salah input jumlah print (*Void* dengan PIN & Dashboard), kertas nyangkut (*Spoilage*), serta selisih uang laci saat tutup kasir.
