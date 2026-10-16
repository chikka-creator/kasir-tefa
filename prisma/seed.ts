import { PrismaClient, Role, ItemType, MovementType } from "@prisma/client";
import bcrypt from "bcryptjs";
import { randomBytes } from "crypto";

const prisma = new PrismaClient();

/**
 * Kredensial awal diambil dari environment variable agar tidak ada password
 * hardcoded di source code. Jika env var tidak diisi, generate acak dan hanya
 * dicetak ke console saat akun benar-benar baru dibuat.
 */
const envOrRandom = (value: string | undefined, bytes = 9): string =>
  value && value.trim().length > 0 ? value : randomBytes(bytes).toString("base64url");

const envPinOrRandom = (value: string | undefined): string => {
  const pin = value?.trim();
  return pin && /^\d{4,8}$/.test(pin) ? pin : String(Math.floor(100000 + Math.random() * 900000));
};

async function main() {
  console.log("🌱 Starting TeFa Percetakan Database Seeding...");

  // 1. Akun Pengguna Awal
  const saltRounds = 10;

  const auditPassword = envOrRandom(process.env.INITIAL_AUDIT_PASSWORD);
  const teacherPassword = envOrRandom(process.env.INITIAL_TEACHER_PASSWORD);
  const adminPassword = envOrRandom(process.env.INITIAL_ADMIN_PASSWORD);
  const teacherPin = envPinOrRandom(process.env.INITIAL_TEACHER_PIN);

  const generatedCredentials: string[] = [];

  const auditUsername = process.env.INITIAL_AUDIT_USERNAME || "audit_sekolah";
  const teacherUsername = process.env.INITIAL_TEACHER_USERNAME || "guru_tefa";
  const adminUsername = process.env.INITIAL_ADMIN_USERNAME || "kasir_tefa";

  const existed = {
    audit: !!(await prisma.user.findUnique({ where: { username: auditUsername } })),
    teacher: !!(await prisma.user.findUnique({ where: { username: teacherUsername } })),
    admin: !!(await prisma.user.findUnique({ where: { username: adminUsername } })),
  };

  const auditUser = await prisma.user.upsert({
    where: { username: auditUsername },
    update: {},
    create: {
      username: auditUsername,
      full_name: "Kepala Unit & Tim Audit",
      password_hash: await bcrypt.hash(auditPassword, saltRounds),
      role: Role.AUDIT,
      is_active: true,
    },
  });

  if (!existed.audit) {
    generatedCredentials.push(`  AUDIT   (${auditUser.username})  password: ${auditPassword}`);
  }

  const teacherUser = await prisma.user.upsert({
    where: { username: teacherUsername },
    update: {},
    create: {
      username: teacherUsername,
      full_name: "Pak Pembimbing TeFa",
      password_hash: await bcrypt.hash(teacherPassword, saltRounds),
      role: Role.TEACHER,
      supervisor_pin_hash: await bcrypt.hash(teacherPin, saltRounds),
      is_active: true,
    },
  });

  if (!existed.teacher) {
    generatedCredentials.push(`  TEACHER (${teacherUser.username})  password: ${teacherPassword}  PIN: ${teacherPin}`);
  }

  const adminUser = await prisma.user.upsert({
    where: { username: adminUsername },
    update: {},
    create: {
      username: adminUsername,
      full_name: "Admin Kasir Siswa (Shared POS 1 & 2)",
      password_hash: await bcrypt.hash(adminPassword, saltRounds),
      role: Role.ADMIN,
      is_active: true,
    },
  });

  if (!existed.admin) {
    generatedCredentials.push(`  ADMIN   (${adminUser.username})  password: ${adminPassword}`);
  }

  console.log("✅ Seeded 3 Core Users (AUDIT, TEACHER with PIN, ADMIN)");
  if (generatedCredentials.length > 0) {
    console.log("\n🔐 Kredensial akun yang baru dibuat — CATAT SEKARANG, tidak akan ditampilkan lagi:");
    generatedCredentials.forEach((line) => console.log(line));
    console.log("");
  }

  // 2. Kategori Percetakan
  const categoriesData = [
    { name: "Print & Fotocopy" },
    { name: "Jilid & Finishing" },
    { name: "Merchandise & Kartu" },
    { name: "Kertas & ATK" },
  ];

  const categories: Record<string, number> = {};
  for (const cat of categoriesData) {
    const existing = await prisma.category.findFirst({ where: { name: cat.name } });
    if (existing) {
      categories[cat.name] = existing.id;
    } else {
      const created = await prisma.category.create({ data: cat });
      categories[cat.name] = created.id;
    }
  }

  console.log("✅ Seeded 4 Categories");

  // 3. Katalog Awal TeFa Percetakan (Jasa & Barang)
  const productsData = [
    // --- JASA (SERVICE) ---
    {
      sku: "JSA-PRT-BW",
      name: "Print A4 Hitam Putih (Teks Biasa)",
      category_id: categories["Print & Fotocopy"],
      item_type: ItemType.SERVICE,
      cost_price: 150,
      selling_price: 500,
      stock_qty: null,
      unit: "lembar",
    },
    {
      sku: "JSA-PRT-COL-TXT",
      name: "Print A4 Warna (Teks Ringan)",
      category_id: categories["Print & Fotocopy"],
      item_type: ItemType.SERVICE,
      cost_price: 400,
      selling_price: 1500,
      stock_qty: null,
      unit: "lembar",
    },
    {
      sku: "JSA-PRT-COL-IMG",
      name: "Print A4 Warna (Full Gambar / Blok)",
      category_id: categories["Print & Fotocopy"],
      item_type: ItemType.SERVICE,
      cost_price: 800,
      selling_price: 2500,
      stock_qty: null,
      unit: "lembar",
    },
    {
      sku: "JSA-COPY-A4",
      name: "Fotocopy A4 Hitam Putih",
      category_id: categories["Print & Fotocopy"],
      item_type: ItemType.SERVICE,
      cost_price: 100,
      selling_price: 300,
      stock_qty: null,
      unit: "lembar",
    },
    {
      sku: "JSA-JLD-LKB",
      name: "Jilid Lakban Biasa",
      category_id: categories["Jilid & Finishing"],
      item_type: ItemType.SERVICE,
      cost_price: 1000,
      selling_price: 3000,
      stock_qty: null,
      unit: "buku",
    },
    {
      sku: "JSA-JLD-SPR",
      name: "Jilid Spiral Kawat A4",
      category_id: categories["Jilid & Finishing"],
      item_type: ItemType.SERVICE,
      cost_price: 3000,
      selling_price: 7500,
      stock_qty: null,
      unit: "buku",
    },
    {
      sku: "JSA-LAM-A4",
      name: "Laminating Panas A4",
      category_id: categories["Jilid & Finishing"],
      item_type: ItemType.SERVICE,
      cost_price: 1200,
      selling_price: 3500,
      stock_qty: null,
      unit: "lembar",
    },
    {
      sku: "JSA-FTO-4R",
      name: "Cetak Foto Ukuran 4R Glossy",
      category_id: categories["Print & Fotocopy"],
      item_type: ItemType.SERVICE,
      cost_price: 900,
      selling_price: 2500,
      stock_qty: null,
      unit: "lembar",
    },
    {
      sku: "JSA-PAS-FTO",
      name: "Cetak Pas Foto Paket (3x4 & 4x6)",
      category_id: categories["Print & Fotocopy"],
      item_type: ItemType.SERVICE,
      cost_price: 2500,
      selling_price: 10000,
      stock_qty: null,
      unit: "paket",
    },

    // --- BARANG FISIK (GOODS) ---
    {
      sku: "BRG-IDC-PVC",
      name: "Cetak ID Card PVC Instant",
      category_id: categories["Merchandise & Kartu"],
      item_type: ItemType.GOODS,
      cost_price: 6000,
      selling_price: 15000,
      stock_qty: 100,
      unit: "pcs",
    },
    {
      sku: "BRG-GNC-AKR",
      name: "Gantungan Kunci Akrilik 2 Sisi",
      category_id: categories["Merchandise & Kartu"],
      item_type: ItemType.GOODS,
      cost_price: 3200,
      selling_price: 8000,
      stock_qty: 150,
      unit: "pcs",
    },
    {
      sku: "BRG-STK-VNL",
      name: "Cetak Stiker Vinyl A3+ Kiss-cut",
      category_id: categories["Merchandise & Kartu"],
      item_type: ItemType.GOODS,
      cost_price: 7500,
      selling_price: 18000,
      stock_qty: 80,
      unit: "lembar",
    },
    {
      sku: "BRG-KRT-FTO",
      name: "Kertas Foto Glossy A4 (Pack 20 lbr)",
      category_id: categories["Kertas & ATK"],
      item_type: ItemType.GOODS,
      cost_price: 17000,
      selling_price: 25000,
      stock_qty: 30,
      unit: "pack",
    },
    {
      sku: "BRG-MAP-FLIO",
      name: "Map Folio TeFa",
      category_id: categories["Kertas & ATK"],
      item_type: ItemType.GOODS,
      cost_price: 1000,
      selling_price: 2000,
      stock_qty: 200,
      unit: "pcs",
    },
  ];

  for (const prod of productsData) {
    const existing = await prisma.product.findUnique({ where: { sku: prod.sku } });
    if (!existing) {
      const created = await prisma.product.create({
        data: {
          ...prod,
          created_by: teacherUser.id,
        },
      });

      // Jika barang fisik, catat stok awal di stock_movements
      if (prod.item_type === ItemType.GOODS && prod.stock_qty) {
        await prisma.stockMovement.create({
          data: {
            product_id: created.id,
            movement_type: MovementType.INITIAL,
            qty_change: prod.stock_qty,
            stock_before: 0,
            stock_after: prod.stock_qty,
            reason_category: "INITIAL_STOCK",
            notes: "Stok awal peluncuran sistem TeFa Percetakan",
            created_by: teacherUser.id,
          },
        });
      }
    }
  }

  console.log(`✅ Seeded ${productsData.length} Products (Services & Goods with initial stock)`);
  console.log("🎉 Database Seeding Completed Successfully!");
}

main()
  .catch((e) => {
    console.error("❌ Seeding Error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
