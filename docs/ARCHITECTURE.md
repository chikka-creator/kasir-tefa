# ARCHITECTURE.md — Arsitektur Sistem POS TeFa Percetakan & Fotocopy

Dokumen ini mendefinisikan arsitektur teknis, pemilihan teknologi (*tech stack*), struktur direktori, mekanisme sinkronisasi 2 perangkat kasir pada 1 laci uang (*Shared Shift*), serta lapisan keamanan *Role-Based Access Control* (RBAC).

---

## 1. Diagram Arsitektur Tingkat Tinggi (High-Level Architecture)

```text
+-------------------------------------------------------------------------+
|                        CLIENT LAYER (WEB BROWSER)                       |
|                                                                         |
|  +-----------------------+   +-----------------------+                  |
|  | Perangkat Kasir 1     |   | Perangkat Kasir 2     |  (1 Akun Admin   |
|  | Terminal ID: POS_1    |   | Terminal ID: POS_2    |   Shared Login)  |
|  +-----------+-----------+   +-----------+-----------+                  |
|              |                           |                              |
|              +-------------+-------------+                              |
|                            | (Shared Shift & Real-time Sync)            |
|                            v                                            |
|  +-------------------------------------------------------------------+  |
|  | Next.js App Router (React Server & Client Components)             |  |
|  | - Layar POS & Thermal Print (@media print 58mm/80mm)              |  |
|  | - Dashboard Guru Pembimbing (Approval Void, Verifikasi, Nilai)    |  |
|  | - Dashboard Audit / Sekolah (Laporan Laba/Rugi & Audit Trail)     |  |
|  +-------------------------------------------------------------------+  |
+------------------------------------+------------------------------------+
                                     | HTTPS / REST API / WebSocket (SSE)
                                     v
+-------------------------------------------------------------------------+
|                      APPLICATION & API LAYER                            |
|                                                                         |
|  - Auth & RBAC Middleware (JWT Session: ADMIN, TEACHER, AUDIT)          |
|  - Shift Sync Engine (Single Active Shift Lock untuk 1 Laci Uang)       |
|  - Dual-Mode Void Engine (Validasi PIN 6-Digit Hash & Remote Approval)  |
|  - Automatic Audit Logger (Interceptor Perubahan Harga, Stok & Void)    |
|  - Report Generator (SheetJS / ExcelJS untuk .xlsx & PDF Generator)     |
+------------------------------------+------------------------------------+
                                     | Prisma ORM / SQL Query
                                     v
+-------------------------------------------------------------------------+
|                         DATA STORAGE LAYER                              |
|                                                                         |
|  PostgreSQL Database                                                    |
|  - Transactional Tables (shifts, transactions, transaction_items)       |
|  - Catalog & Inventory (categories, products, stock_movements)          |
|  - Security & Governance (users, audit_logs [Append-Only])              |
+-------------------------------------------------------------------------+
```

---

## 2. Rekomendasi Tech Stack

- **Frontend & Fullstack Framework:** Next.js (App Router, TypeScript)
- **Styling & UI Components:** Tailwind CSS + shadcn/ui + Lucide Icons
- **State Management (Kasir):** Zustand (untuk keranjang belanja lokal per terminal dan *terminal identity* `POS_1` / `POS_2`) + TanStack Query / SWR (untuk sinkronisasi data shift & notifikasi *void*).
- **Database & ORM:** PostgreSQL (Supabase / Neon / Local PostgreSQL Server Sekolah) + Prisma ORM.
- **Autentikasi:** NextAuth.js (Auth.js) atau Custom JWT via `httpOnly` Cookie dengan dukungan *multi-device concurrent login* khusus untuk akun role `ADMIN`.
- **Cetak Struk:** CSS `@media print` khusus kertas *thermal roll* 58mm/80mm + integrasi `react-to-print`.
- **Export Laporan:** `exceljs` / `xlsx` untuk laporan Excel dan `@react-pdf/renderer` / `jspdf` untuk laporan PDF.

---

## 3. Struktur Direktori Proyek

```text
tefa-pos-system/
├── docs/
│   ├── ARCHITECTURE.md
│   ├── CHECKLIST.md
│   ├── DEPLOY.md
│   ├── DESIGN.md
│   ├── FEATURES.md
│   ├── PLAN.md
│   ├── RANKING.md
│   └── SCHEMA.md
├── prisma/
│   ├── schema.prisma
│   └── seed.ts
├── src/
│   ├── app/
│   │   ├── (auth)/login/              # Halaman login semua role
│   │   ├── (pos)/kasir/               # Area kerja Role ADMIN (POS 1 & POS 2)
│   │   │   ├── page.tsx               # Layar utama kasir & keranjang
│   │   │   ├── riwayat/               # Riwayat struk & pengajuan Void
│   │   │   ├── katalog/               # Kelola barang, stok masuk & harga
│   │   │   └── barang-rusak/          # Form lapor salah print / paper jam
│   │   ├── (supervisor)/guru/         # Area kerja Role GURU PEMBIMBING
│   │   │   ├── page.tsx               # Overview & Alert Void/Perubahan Harga
│   │   │   ├── verifikasi-shift/      # Rekonsiliasi kas & input Nilai Siswa (0-100)
│   │   │   └── pengaturan-pin/        # Kelola PIN 6-digit Supervisor
│   │   ├── (owner)/audit/             # Area kerja Role AUDIT (Pihak Sekolah)
│   │   │   ├── page.tsx               # Executive Dashboard & Laba Rugi
│   │   │   ├── audit-logs/            # Forensik rekam jejak sistem
│   │   │   ├── laporan-shift/         # Finalisasi tutup buku & rekap nilai
│   │   │   └── users/                 # Manajemen akun user
│   │   └── api/                       # Route Handlers (REST API)
│   ├── components/
│   │   ├── pos/                       # Komponen keranjang, modal bayar, struk thermal
│   │   ├── shift/                     # Modal buka/tutup shift bersama
│   │   ├── void/                      # Modal Dual-Mode Void (Tab PIN & Tab Remote)
│   │   └── ui/                        # Komponen dasar shadcn/ui
│   ├── lib/
│   │   ├── db.ts                      # Koneksi Prisma Client
│   │   ├── audit-logger.ts            # Helper otomatis pencatat Audit Log
│   │   ├── pin-verifier.ts            # Bcrypt validator untuk PIN Supervisor
│   │   └── rbac.ts                    # Guard pembatas hak akses role
│   └── store/
│       └── usePosTerminalStore.ts     # Penyimpan identitas POS_1 / POS_2 & keranjang
```

---

## 4. Arsitektur Sinkronisasi 2 Perangkat pada 1 Laci Uang (Shared Shift)

Karena terdapat **1 akun Admin** yang digunakan bersamaan di **2 perangkat kasir (`POS_1` dan `POS_2`)** namun uang tunainya digabung dalam **1 laci kasir fisik yang sama**, sistem menerapkan mekanisme berikut:

1. **Pemisahan Session Cart vs Shared Cash Drawer:**
   - **Keranjang Belanja (`Cart State`):** Disimpan secara lokal di masing-masing browser perangkat (`localStorage` / Zustand). Artinya, `POS_1` dan `POS_2` dapat melayani dua pembeli berbeda secara bersamaan tanpa keranjang belanja saling menimpa.
   - **Laci Kas & Sesi Shift (`Shift State`):** Disimpan terpusat di database PostgreSQL dengan constraint **hanya boleh ada 1 baris `shifts` berstatus `OPEN`**.
2. **Alur Sinkronisasi Saat Buka Shift:**
   - Perangkat pertama yang login dan membuka kasir akan mengisi **Modal Awal Laci**, **3 Nama Siswa Petugas**, dan **1 Nama Siswa Pengawas**.
   - Ketika perangkat kedua dibuka, endpoint `GET /api/shifts/active` langsung mendeteksi shift yang sedang `OPEN`. Perangkat kedua otomatis terhubung ke sesi tersebut dan hanya perlu memilih label terminal (`POS_1` atau `POS_2`).
3. **Akumulasi Kas Real-time:**
   - Setiap transaksi `CASH` atau `QRIS` dari `POS_1` maupun `POS_2` menyimpan `shift_id` yang sama tetapi mencatat asal perangkat pada kolom `device_terminal`.
   - Saat tutup shift di akhir jam praktik, sistem menjumlahkan seluruh uang masuk dari kedua perangkat dan membandingkannya dengan **1 angka perhitungan uang fisik laci**.

---

## 5. Arsitektur Audit Trail (Zero-Trust Inventory & Pricing)

Untuk mengakomodasi aturan bisnis di mana **Admin diperbolehkan menambah stok dan mengubah harga modal/jual secara langsung**, sistem memasang *interceptor* pada level API:
- Setiap pemanggilan API `PATCH /api/products/:id` atau `POST /api/stock/spoilage` wajib melewati fungsi `recordAuditLog()` di dalam **1 Database Transaction (`prisma.$transaction`)**.
- Jika pencatatan ke tabel `audit_logs` gagal, maka perubahan harga atau pengurangan stok otomatis di-*rollback*.
- Tabel `audit_logs` tidak memiliki endpoint `UPDATE` maupun `DELETE` sehingga rekam jejaknya bersifat permanen (*immutable*) untuk diperiksa oleh Guru Pembimbing dan Audit.
