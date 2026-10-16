/**
 * Membersihkan data hasil pengujian otomatis, tanpa menyentuh akun/katalog seed.
 * Produk kembali ke stok awal hasil seeding dan movement INITIAL tetap konsisten.
 */
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// Stok awal sesuai prisma/seed.ts
const SEED_STOCK: Record<string, number> = {
  "BRG-IDC-PVC": 100,
  "BRG-GNC-AKR": 150,
  "BRG-STK-VNL": 80,
  "BRG-KRT-FTO": 30,
  "BRG-MAP-FLIO": 200,
};

async function main() {
  const before = {
    shifts: await prisma.shift.count(),
    transactions: await prisma.transaction.count(),
    items: await prisma.transactionItem.count(),
    movements: await prisma.stockMovement.count(),
    auditLogs: await prisma.auditLog.count(),
  };
  console.log("Sebelum:", before);

  // 1. Hapus log audit testing
  await prisma.auditLog.deleteMany({});

  // 2. Hapus pergerakan stok hasil transaksi (SALE / VOID_RETURN).
  //    Movement INITIAL dari seed dipertahankan.
  await prisma.stockMovement.deleteMany({
    where: { movement_type: { in: ["SALE", "VOID_RETURN"] } },
  });

  // 3. Hapus shift testing.
  //    Relasi Transaction -> Shift di schema tidak punya onDelete, jadi default-nya
  //    RESTRICT: transaction_items (cascade dari transaction) dan transactions
  //    harus dihapus lebih dulu secara berurutan.
  await prisma.transactionItem.deleteMany({});
  await prisma.transaction.deleteMany({});
  await prisma.shift.deleteMany({});

  // 4. Pulihkan stok barang ke nilai awal seed
  for (const [sku, qty] of Object.entries(SEED_STOCK)) {
    await prisma.product.updateMany({
      where: { sku },
      data: { stock_qty: qty },
    });
  }

  // 5. Pastikan movement INITIAL cocok dengan stok yang dipulihkan
  for (const [sku, qty] of Object.entries(SEED_STOCK)) {
    const product = await prisma.product.findUnique({ where: { sku } });
    await prisma.stockMovement.deleteMany({
      where: { product_id: product!.id, movement_type: "INITIAL" },
    });
    await prisma.stockMovement.create({
      data: {
        product_id: product!.id,
        movement_type: "INITIAL",
        qty_change: qty,
        stock_before: 0,
        stock_after: qty,
        reason_category: "INITIAL_STOCK",
        notes: "Stok awal peluncuran sistem TeFa Percetakan",
        created_by: (await prisma.user.findUnique({ where: { username: "guru_tefa" } }))!.id,
      },
    });
  }

  const after = {
    shifts: await prisma.shift.count(),
    transactions: await prisma.transaction.count(),
    items: await prisma.transactionItem.count(),
    movements: await prisma.stockMovement.count(),
    auditLogs: await prisma.auditLog.count(),
    users: await prisma.user.count(),
    products: await prisma.product.count(),
    categories: await prisma.category.count(),
  };
  console.log("Sesudah:", after);

  console.log("\nStok akhir:");
  const goods = await prisma.product.findMany({
    where: { item_type: "GOODS" },
    select: { sku: true, name: true, stock_qty: true },
  });
  for (const g of goods) console.log(`  ${g.sku.padEnd(14)} ${String(g.stock_qty).padStart(5)}  ${g.name}`);
}

main()
  .catch((e) => { console.error("Error:", e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });