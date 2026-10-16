# SCHEMA.md — Skema Database & Spesifikasi Endpoint API

Dokumen ini memuat skema database relasional PostgreSQL, definisi model Prisma ORM, aturan *constraint* untuk sinkronisasi 2 perangkat kasir, serta spesifikasi *endpoint* REST API.

---

## 1. Skema SQL PostgreSQL (DDL)

### 1.1. Tabel `users` (Akun 3 Role)
```sql
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    username VARCHAR(50) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(100) NOT NULL,
    role VARCHAR(20) NOT NULL CHECK (role IN ('AUDIT', 'TEACHER', 'ADMIN')),
    supervisor_pin_hash VARCHAR(255) NULL, -- Khusus role TEACHER untuk Opsi PIN Void di layar kasir
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
```

### 1.2. Tabel `categories` & `products` (Katalog Jasa vs Barang Fisik)
```sql
CREATE TABLE categories (
    id SERIAL PRIMARY KEY,
    name VARCHAR(50) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE products (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    category_id INT REFERENCES categories(id) ON DELETE SET NULL,
    sku VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(150) NOT NULL,
    item_type VARCHAR(20) NOT NULL CHECK (item_type IN ('SERVICE', 'GOODS')),
    cost_price NUMERIC(12, 2) NOT NULL DEFAULT 0, -- Harga modal / HPP
    selling_price NUMERIC(12, 2) NOT NULL,        -- Harga jual terkunci di kasir
    stock_qty INT NULL,                           -- NULL untuk SERVICE, Integer untuk GOODS
    unit VARCHAR(20) NOT NULL DEFAULT 'pcs',      -- 'lembar', 'pcs', 'buku', 'paket'
    is_active BOOLEAN DEFAULT TRUE,
    created_by UUID REFERENCES users(id),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
```

### 1.3. Tabel `shifts` (Sesi Shift Bersama 1 Laci Uang + Evaluasi Guru)
```sql
CREATE TABLE shifts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    shift_code VARCHAR(30) UNIQUE NOT NULL,
    
    -- 3 Siswa Bertugas & 1 Siswa Pengawas (Diketik manual saat buka kasir)
    student_worker_1 VARCHAR(100) NOT NULL,
    student_worker_2 VARCHAR(100) NOT NULL,
    student_worker_3 VARCHAR(100) NOT NULL,
    student_supervisor VARCHAR(100) NOT NULL,
    
    opened_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    closed_at TIMESTAMP WITH TIME ZONE NULL,
    status VARCHAR(30) NOT NULL DEFAULT 'OPEN' 
        CHECK (status IN ('OPEN', 'PENDING_VERIFICATION', 'VERIFIED_BY_TEACHER', 'CLOSED_AUDITED')),
    
    -- Rekonsiliasi Kas Laci (Gabungan Perangkat Kasir 1 & 2)
    opening_cash NUMERIC(12, 2) NOT NULL DEFAULT 0,
    expected_cash NUMERIC(12, 2) NULL,
    actual_cash_counted NUMERIC(12, 2) NULL,
    cash_variance NUMERIC(12, 2) NULL,
    variance_status VARCHAR(15) NULL 
        CHECK (variance_status IN ('BALANCE', 'MINUS', 'PLUS')),
    
    expected_qris NUMERIC(12, 2) NULL,
    actual_qris_counted NUMERIC(12, 2) NULL,
    closing_notes TEXT NULL,
    
    -- Evaluasi & Verifikasi Guru Pembimbing
    verified_by UUID REFERENCES users(id) NULL,
    verified_at TIMESTAMP WITH TIME ZONE NULL,
    teacher_score INT NULL CHECK (teacher_score BETWEEN 0 AND 100),
    teacher_evaluation_notes TEXT NULL,
    
    -- Finalisasi Role Audit
    audited_by UUID REFERENCES users(id) NULL,
    audited_at TIMESTAMP WITH TIME ZONE NULL
);

-- Constraint: Hanya boleh ada 1 Shift berstatus OPEN pada satu waktu (1 Laci Bersama)
CREATE UNIQUE INDEX idx_single_open_shift ON shifts ((status)) WHERE status = 'OPEN';
```

### 1.4. Tabel `transactions` & `transaction_items` (Penjualan POS)
```sql
CREATE TABLE transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    invoice_number VARCHAR(40) UNIQUE NOT NULL,
    shift_id UUID NOT NULL REFERENCES shifts(id),
    device_terminal VARCHAR(15) NOT NULL CHECK (device_terminal IN ('POS_1', 'POS_2')),
    
    subtotal NUMERIC(12, 2) NOT NULL,
    total_amount NUMERIC(12, 2) NOT NULL,
    total_cost NUMERIC(12, 2) NOT NULL,
    
    payment_method VARCHAR(10) NOT NULL CHECK (payment_method IN ('CASH', 'QRIS')),
    cash_received NUMERIC(12, 2) NULL,
    cash_change NUMERIC(12, 2) NULL,
    qris_reference VARCHAR(100) NULL,
    
    -- Status Transaksi & Dual-Mode Void
    status VARCHAR(20) NOT NULL DEFAULT 'PAID' 
        CHECK (status IN ('PAID', 'VOID_REQUESTED', 'VOIDED')),
    void_reason TEXT NULL,
    void_approval_method VARCHAR(20) NULL CHECK (void_approval_method IN ('PIN_ON_SITE', 'DASHBOARD_REMOTE')),
    void_approved_by UUID REFERENCES users(id) NULL,
    void_approved_at TIMESTAMP WITH TIME ZONE NULL,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE transaction_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    transaction_id UUID NOT NULL REFERENCES transactions(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES products(id),
    product_name_snapshot VARCHAR(150) NOT NULL,
    item_type_snapshot VARCHAR(20) NOT NULL,
    qty INT NOT NULL CHECK (qty > 0),
    cost_price_snapshot NUMERIC(12, 2) NOT NULL,
    selling_price_snapshot NUMERIC(12, 2) NOT NULL,
    subtotal NUMERIC(12, 2) NOT NULL
);
```

### 1.5. Tabel `stock_movements` (Mutasi Stok & Barang Rusak/Salah Print)
```sql
CREATE TABLE stock_movements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id UUID NOT NULL REFERENCES products(id),
    shift_id UUID REFERENCES shifts(id) NULL,
    movement_type VARCHAR(25) NOT NULL 
        CHECK (movement_type IN ('INITIAL', 'RESTOCK', 'SALE', 'VOID_RETURN', 'SPOILAGE_DAMAGE')),
    qty_change INT NOT NULL,
    stock_before INT NOT NULL,
    stock_after INT NOT NULL,
    reason_category VARCHAR(50) NULL, -- 'SALAH_PRINT', 'PAPER_JAM', 'BARANG_CACAT', 'STOK_DATANG'
    notes TEXT NOT NULL,
    created_by UUID NOT NULL REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
```

### 1.6. Tabel `audit_logs` (Rekam Jejak Keamanan Sistem)
```sql
CREATE TABLE audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id),
    user_role VARCHAR(20) NOT NULL,
    shift_id UUID REFERENCES shifts(id) NULL,
    device_terminal VARCHAR(20) NULL,
    action_type VARCHAR(50) NOT NULL,
    severity VARCHAR(15) NOT NULL DEFAULT 'INFO' CHECK (severity IN ('INFO', 'WARNING', 'CRITICAL')),
    entity_name VARCHAR(50) NOT NULL,
    entity_id UUID NOT NULL,
    old_values JSONB NULL,
    new_values JSONB NULL,
    description TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
```

---

## 2. Daftar Endpoint REST API

### A. Autentikasi & Sesi Shift
- `POST /api/auth/login` — Autentikasi pengguna (`ADMIN`, `TEACHER`, `AUDIT`).
- `GET /api/shifts/active` — Mengambil sesi shift `OPEN` yang sedang berjalan untuk disinkronkan ke `POS_1` dan `POS_2`.
- `POST /api/shifts/open` — Membuka shift baru (input 3 petugas, 1 pengawas, modal awal laci).
- `POST /api/shifts/:id/close` — Menutup shift oleh Admin (input uang fisik tunai & rekap QRIS, hitung status selisih).
- `POST /api/shifts/:id/verify` — Verifikasi laporan shift oleh Guru Pembimbing disertai input skor nilai (0–100) & catatan evaluasi.
- `POST /api/shifts/:id/audit-close` — Finalisasi tutup buku oleh Role Audit.

### B. Transaksi POS & Dual-Mode Void
- `POST /api/transactions` — Mencatat transaksi baru (`CASH` / `QRIS`), memotong stok untuk barang fisik (`GOODS`), dan mengembalikan payload struk thermal.
- `POST /api/transactions/:id/void-with-pin` — Membatalkan transaksi secara instan di layar kasir menggunakan PIN 6-Digit Guru Pembimbing.
- `POST /api/transactions/:id/void-request` — Mengirim pengajuan pembatalan transaksi dari kasir ke dashboard Guru Pembimbing.
- `POST /api/transactions/:id/void-approve` — Persetujuan atau penolakan pengajuan *void* oleh Guru Pembimbing dari dashboard.

### C. Katalog, Inventori & Laporan
- `GET /api/products` — Mengambil daftar katalog layanan (`SERVICE`) dan barang (`GOODS`).
- `POST /api/products` — Menambahkan item katalog baru (+ otomatis mencatat `audit_logs`).
- `PATCH /api/products/:id` — Mengubah harga modal/harga jual/nama item (+ otomatis mencatat `audit_logs` dengan level `WARNING`).
- `POST /api/stock/restock` — Menambahkan jumlah stok barang masuk.
- `POST /api/stock/spoilage` — Mengurangi stok karena salah print / kertas nyangkut / rusak dengan alasan wajib (+ otomatis mencatat `audit_logs`).
- `GET /api/audit-logs` — Mengambil daftar rekam jejak sistem untuk Guru Pembimbing dan Audit.
- `GET /api/reports/export` — Mengunduh laporan ke format `.xlsx` atau `.pdf`.
