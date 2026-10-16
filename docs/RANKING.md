# RANKING.md — Sistem Penilaian Siswa, Evaluasi Shift & Peringkat Produk TeFa

Dokumen ini mendefinisikan formula penilaian dan metrik pemeringkatan (*ranking*) di dalam sistem, yang terbagi menjadi **2 fokus utama**:
1. **Penilaian & Peringkat Kinerja Tim Siswa Piket** (oleh Guru Pembimbing).
2. **Peringkat Produk & Layanan TeFa Terlaris** (untuk analisis bisnis Guru & Audit).

---

## 1. Sistem Penilaian & Evaluasi Tim Siswa (Student Shift Grading)

Setiap sesi shift diawaki oleh **3 Siswa Bertugas** dan **1 Siswa Pengawas** (yang namanya diketik saat buka kasir). Saat shift ditutup, Guru Pembimbing memberikan **Skor Akhir (0–100)** dan **Catatan Evaluasi** berdasarkan indikator performa shift yang disajikan oleh sistem.

### 1.1. Indikator Performa Shift (Ditampilkan ke Guru Saat Memberi Nilai)
Sistem secara otomatis menyajikan **4 Metrik Bantuan** di layar verifikasi Guru Pembimbing agar pemberian nilai objektif:

| Indikator Sistem | Cara Perhitungan | Target Ideal |
| :--- | :--- | :--- |
| **1. Akurasi Kas Laci (`Cash Accuracy`)** | `actual_cash_counted - expected_cash` | Status `BALANCE` (Selisih Rp 0). |
| **2. Rasio Salah Print / Rusak (`Spoilage Rate`)** | Jumlah laporan barang rusak / salah print selama shift berlangsung. | Seminimal mungkin & dilaporkan secara jujur dengan alasan jelas. |
| **3. Tingkat Ketelitian Kasir (`Void Frequency`)** | Jumlah transaksi yang diajukan batal (`VOIDED`) karena salah ketik oleh kasir. | `0` transaksi void akibat kesalahan input. |
| **4. Produktivitas Layanan (`Throughput`)** | Total jumlah struk transaksi (`POS_1` + `POS_2`) yang berhasil diselesaikan. | Menunjukkan beban kerja dan keaktifan tim pada shift tersebut. |

### 1.2. Kategori Predikat Nilai Shift (Skala 0–100)
Saat Guru Pembimbing menginput angka skor `teacher_score` (0–100), sistem otomatis menyematkan predikat evaluasi tim:
- **90 – 100 (`Sangat Baik / A`):** Kas laci `BALANCE`, pelayanan tertib, pencatatan stok & barang rusak sangat rapi.
- **80 – 89 (`Baik / B`):** Operasional lancar, terdapat catatan minor namun dapat dipertanggungjawabkan dengan baik.
- **70 – 79 (`Cukup / C`):** Terdapat kesalahan input (*void*) berulang atau selisih kas kecil yang sudah diselesaikan.
- **< 70 (`Perlu Pembinaan / D`):** Terdapat selisih kas signifikan tanpa kejelasan atau kelalaian prosedur pencatatan stok/harga.

### 1.3. Tabel Rekap & Ranking Tim Shift Siswa
Di dashboard **Guru Pembimbing** dan **Audit**, tersedia tabel peringkat riwayat shift yang dapat diurutkan (*sortable*) dan di-export ke Excel/PDF:

| Kode Shift | Tanggal | Tim Bertugas (3 Siswa) | Pengawas (1 Siswa) | Jml Transaksi | Status Kas | Skor Guru | Predikat |
| :--- | :--- | :--- | :--- | :---: | :---: | :---: | :---: |
| `SHF-20261014-01` | 14/10/2026 | Andi, Budi, Citra | Dedi | 68 Struk | `BALANCE` | **95** | Sangat Baik (A) |
| `SHF-20261013-01` | 13/10/2026 | Eka, Fajar, Gita | Hadi | 52 Struk | `MINUS (-Rp2.000)` | **82** | Baik (B) |

---

## 2. Sistem Peringkat Produk & Layanan TeFa (Product & Service Ranking)

Untuk membantu pihak sekolah (**Audit**) dan **Guru Pembimbing** mengetahui layanan apa yang paling menghasilkan keuntungan di TeFa Percetakan, sistem menyusun peringkat produk berdasarkan 3 metrik:

### 2.1. Peringkat Berdasarkan Volume Terjual (`Top Volume`)
Mengukur layanan/barang yang paling sering dibeli oleh warga sekolah (contoh: *Print A4 Hitam Putih*, *Fotocopy A4*, *Laminating*). Berguna untuk merencanakan pembelian bahan baku kertas dan tinta.

### 2.2. Peringkat Berdasarkan Kontribusi Laba Kotor (`Top Profit Contributor`)
Dihitung dengan rumus:
```text
Laba Kotor Produk = SUM((selling_price_snapshot - cost_price_snapshot) * qty)
```
Menampilkan layanan/barang mana yang memberikan margin keuntungan terbesar bagi TeFa (misalnya: *Cetak ID Card PVC*, *Pembuatan Ganci*, *Cetak Foto*, atau *Jilid Buku*).

### 2.3. Peringkat Barang Paling Sering Rusak / Salah Cetak (`Top Spoilage Alert`)
Mengurutkan item yang paling sering mengalami pengurangan stok di menu **Barang Rusak / Salah Print** (`movement_type = 'SPOILAGE_DAMAGE'`).
- Jika suatu item (misal: *Kertas Foto* atau *Bahan ID Card*) menempati peringkat teratas barang rusak, Guru Pembimbing dapat segera memberikan pelatihan teknis penggunaan mesin cetak kepada siswa.
