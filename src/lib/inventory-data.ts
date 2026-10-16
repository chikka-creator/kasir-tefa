import { prisma } from "@/lib/db";
import { recordAuditLog } from "@/lib/audit-logger";

export interface InventoryProduct {
  id: string;
  category_id?: number | null;
  category_name?: string;
  sku: string;
  name: string;
  item_type: "SERVICE" | "GOODS";
  cost_price: number;
  selling_price: number;
  stock_qty: number | null;
  unit: string;
  is_active: boolean;
}

export interface StockMovementRecord {
  id: string;
  product_id: string;
  product_name: string;
  product_sku: string;
  shift_id: string | null;
  movement_type: "INITIAL" | "RESTOCK" | "SALE" | "VOID_RETURN" | "SPOILAGE_DAMAGE";
  qty_change: number;
  stock_before: number;
  stock_after: number;
  cost_price_snapshot: number;
  loss_value?: number;
  reason_category: string | null;
  notes: string;
  created_by: string;
  created_at: string;
}

// Global in-memory singleton for products and stock movements fallback
const globalInventoryStore = globalThis as unknown as {
  __tefa_products?: InventoryProduct[];
  __tefa_stock_movements?: StockMovementRecord[];
};

if (!globalInventoryStore.__tefa_products) {
  globalInventoryStore.__tefa_products = [
    { id: "p1", sku: "JSA-PRT-BW", name: "Print A4 Hitam Putih (Teks Biasa)", item_type: "SERVICE", selling_price: 500, cost_price: 150, stock_qty: null, unit: "lembar", category_name: "Print & Fotocopy", is_active: true },
    { id: "p2", sku: "JSA-PRT-COL-TXT", name: "Print A4 Warna (Teks Ringan)", item_type: "SERVICE", selling_price: 1500, cost_price: 400, stock_qty: null, unit: "lembar", category_name: "Print & Fotocopy", is_active: true },
    { id: "p3", sku: "JSA-PRT-COL-IMG", name: "Print A4 Warna (Full Gambar / Blok)", item_type: "SERVICE", selling_price: 2500, cost_price: 800, stock_qty: null, unit: "lembar", category_name: "Print & Fotocopy", is_active: true },
    { id: "p4", sku: "JSA-COPY-A4", name: "Fotocopy A4 Hitam Putih", item_type: "SERVICE", selling_price: 300, cost_price: 100, stock_qty: null, unit: "lembar", category_name: "Print & Fotocopy", is_active: true },
    { id: "p5", sku: "JSA-JLD-LKB", name: "Jilid Lakban Biasa", item_type: "SERVICE", selling_price: 3000, cost_price: 1000, stock_qty: null, unit: "buku", category_name: "Jilid & Finishing", is_active: true },
    { id: "p6", sku: "JSA-JLD-SPR", name: "Jilid Spiral Kawat A4", item_type: "SERVICE", selling_price: 7500, cost_price: 3000, stock_qty: null, unit: "buku", category_name: "Jilid & Finishing", is_active: true },
    { id: "p7", sku: "JSA-LAM-A4", name: "Laminating Panas A4", item_type: "SERVICE", selling_price: 3500, cost_price: 1200, stock_qty: null, unit: "lembar", category_name: "Jilid & Finishing", is_active: true },
    { id: "p8", sku: "JSA-FTO-4R", name: "Cetak Foto Ukuran 4R Glossy", item_type: "SERVICE", selling_price: 2500, cost_price: 900, stock_qty: null, unit: "lembar", category_name: "Print & Fotocopy", is_active: true },
    { id: "p9", sku: "JSA-PAS-FTO", name: "Cetak Pas Foto Paket (3x4 & 4x6)", item_type: "SERVICE", selling_price: 10000, cost_price: 2500, stock_qty: null, unit: "paket", category_name: "Print & Fotocopy", is_active: true },
    { id: "p10", sku: "BRG-IDC-PVC", name: "Cetak ID Card PVC Instant", item_type: "GOODS", selling_price: 15000, cost_price: 6000, stock_qty: 100, unit: "pcs", category_name: "Merchandise & Kartu", is_active: true },
    { id: "p11", sku: "BRG-GNC-AKR", name: "Gantungan Kunci Akrilik 2 Sisi", item_type: "GOODS", selling_price: 8000, cost_price: 3200, stock_qty: 150, unit: "pcs", category_name: "Merchandise & Kartu", is_active: true },
    { id: "p12", sku: "BRG-STK-VNL", name: "Cetak Stiker Vinyl A3+ Kiss-cut", item_type: "GOODS", selling_price: 18000, cost_price: 7500, stock_qty: 80, unit: "lembar", category_name: "Merchandise & Kartu", is_active: true },
    { id: "p13", sku: "BRG-KRT-FTO", name: "Kertas Foto Glossy A4 (Pack 20 lbr)", item_type: "GOODS", selling_price: 25000, cost_price: 17000, stock_qty: 30, unit: "pack", category_name: "Kertas & ATK", is_active: true },
    { id: "p14", sku: "BRG-MAP-FLIO", name: "Map Folio TeFa", item_type: "GOODS", selling_price: 2000, cost_price: 1000, stock_qty: 200, unit: "pcs", category_name: "Kertas & ATK", is_active: true },
  ];
}

if (!globalInventoryStore.__tefa_stock_movements) {
  globalInventoryStore.__tefa_stock_movements = [];
}

export async function getInventoryProducts(): Promise<InventoryProduct[]> {
  try {
    const list = await prisma.product.findMany({
      where: { is_active: true },
      include: { category: true },
      orderBy: [{ item_type: "asc" }, { name: "asc" }],
    });

    if (list && list.length > 0) {
      return list.map((p) => ({
        id: p.id,
        category_id: p.category_id,
        category_name: p.category?.name || "Lainnya",
        sku: p.sku,
        name: p.name,
        item_type: p.item_type,
        cost_price: Number(p.cost_price),
        selling_price: Number(p.selling_price),
        stock_qty: p.stock_qty,
        unit: p.unit,
        is_active: p.is_active,
      }));
    }
  } catch {
    // Memory store fallback
  }

  return globalInventoryStore.__tefa_products || [];
}

export async function getProductById(id: string): Promise<InventoryProduct | null> {
  const products = await getInventoryProducts();
  return products.find((p) => p.id === id) || null;
}

export async function createInventoryProduct(data: {
  sku: string;
  name: string;
  item_type: "SERVICE" | "GOODS";
  cost_price: number;
  selling_price: number;
  stock_qty?: number | null;
  unit: string;
  category_name?: string;
  user_id?: string;
  user_role?: string;
  shift_id?: string | null;
  device_terminal?: string | null;
}): Promise<InventoryProduct> {
  const stockQty = data.item_type === "GOODS" ? (data.stock_qty ?? 0) : null;

  try {
    let categoryId: number | undefined = undefined;
    if (data.category_name) {
      const cat = await prisma.category.findFirst({ where: { name: data.category_name } });
      if (cat) categoryId = cat.id;
    }

    const created = await prisma.product.create({
      data: {
        sku: data.sku,
        name: data.name,
        item_type: data.item_type,
        cost_price: data.cost_price,
        selling_price: data.selling_price,
        stock_qty: stockQty,
        unit: data.unit,
        category_id: categoryId,
      },
      include: { category: true },
    });

    // Record Audit Log
    await recordAuditLog({
      user_id: data.user_id,
      user_role: data.user_role || "ADMIN",
      shift_id: data.shift_id,
      device_terminal: data.device_terminal,
      action_type: "PRODUCT_CREATE",
      severity: "INFO",
      entity_name: "Product",
      entity_id: created.id,
      new_values: {
        sku: created.sku,
        name: created.name,
        item_type: created.item_type,
        cost_price: Number(created.cost_price),
        selling_price: Number(created.selling_price),
        stock_qty: created.stock_qty,
      },
      description: `Menambahkan item baru '${created.name}' (${created.item_type}) dengan harga jual Rp ${Number(created.selling_price).toLocaleString("id-ID")}`,
    });

    return {
      id: created.id,
      category_id: created.category_id,
      category_name: created.category?.name || data.category_name || "Lainnya",
      sku: created.sku,
      name: created.name,
      item_type: created.item_type,
      cost_price: Number(created.cost_price),
      selling_price: Number(created.selling_price),
      stock_qty: created.stock_qty,
      unit: created.unit,
      is_active: created.is_active,
    };
  } catch {
    // Memory store fallback
  }

  const newProd: InventoryProduct = {
    id: `prod-${Date.now()}`,
    sku: data.sku,
    name: data.name,
    item_type: data.item_type,
    cost_price: data.cost_price,
    selling_price: data.selling_price,
    stock_qty: stockQty,
    unit: data.unit,
    category_name: data.category_name || "Lainnya",
    is_active: true,
  };

  globalInventoryStore.__tefa_products?.push(newProd);

  await recordAuditLog({
    user_id: data.user_id,
    user_role: data.user_role || "ADMIN",
    shift_id: data.shift_id,
    device_terminal: data.device_terminal,
    action_type: "PRODUCT_CREATE",
    severity: "INFO",
    entity_name: "Product",
    entity_id: newProd.id,
    new_values: {
      sku: newProd.sku,
      name: newProd.name,
      item_type: newProd.item_type,
      cost_price: newProd.cost_price,
      selling_price: newProd.selling_price,
      stock_qty: newProd.stock_qty,
    },
    description: `Menambahkan item baru '${newProd.name}' (${newProd.item_type}) dengan harga jual Rp ${newProd.selling_price.toLocaleString("id-ID")}`,
  });

  return newProd;
}

export async function updateInventoryProductPrice(
  id: string,
  update: {
    cost_price?: number;
    selling_price?: number;
    name?: string;
    unit?: string;
  },
  userContext?: {
    user_id?: string;
    user_role?: string;
    shift_id?: string | null;
    device_terminal?: string | null;
  }
): Promise<InventoryProduct> {
  const current = await getProductById(id);
  if (!current) throw new Error("Produk tidak ditemukan.");

  const oldValues = {
    name: current.name,
    cost_price: current.cost_price,
    selling_price: current.selling_price,
    unit: current.unit,
  };

  const newCostPrice = update.cost_price !== undefined ? update.cost_price : current.cost_price;
  const newSellingPrice = update.selling_price !== undefined ? update.selling_price : current.selling_price;
  const newName = update.name || current.name;
  const newUnit = update.unit || current.unit;

  const newValues = {
    name: newName,
    cost_price: newCostPrice,
    selling_price: newSellingPrice,
    unit: newUnit,
  };

  let descriptionParts: string[] = [];
  if (current.selling_price !== newSellingPrice) {
    descriptionParts.push(`Harga jual: Rp ${current.selling_price.toLocaleString("id-ID")} ➔ Rp ${newSellingPrice.toLocaleString("id-ID")}`);
  }
  if (current.cost_price !== newCostPrice) {
    descriptionParts.push(`HPP/Modal: Rp ${current.cost_price.toLocaleString("id-ID")} ➔ Rp ${newCostPrice.toLocaleString("id-ID")}`);
  }
  const description = `Mengubah harga produk '${current.name}': ${descriptionParts.join(", ")}`;

  try {
    const updated = await prisma.product.update({
      where: { id },
      data: {
        name: newName,
        cost_price: newCostPrice,
        selling_price: newSellingPrice,
        unit: newUnit,
      },
      include: { category: true },
    });

    // Perubahan harga wajib dicatat dengan severity WARNING per SCHEMA.md 2.C line 191
    await recordAuditLog({
      user_id: userContext?.user_id,
      user_role: userContext?.user_role || "ADMIN",
      shift_id: userContext?.shift_id,
      device_terminal: userContext?.device_terminal,
      action_type: "PRICE_UPDATE",
      severity: "WARNING",
      entity_name: "Product",
      entity_id: id,
      old_values: oldValues,
      new_values: newValues,
      description,
    });

    return {
      id: updated.id,
      category_id: updated.category_id,
      category_name: updated.category?.name || current.category_name,
      sku: updated.sku,
      name: updated.name,
      item_type: updated.item_type,
      cost_price: Number(updated.cost_price),
      selling_price: Number(updated.selling_price),
      stock_qty: updated.stock_qty,
      unit: updated.unit,
      is_active: updated.is_active,
    };
  } catch {
    // Memory store fallback
  }

  const idx = (globalInventoryStore.__tefa_products || []).findIndex((p) => p.id === id);
  if (idx > -1 && globalInventoryStore.__tefa_products) {
    const p = globalInventoryStore.__tefa_products[idx];
    p.name = newName;
    p.cost_price = newCostPrice;
    p.selling_price = newSellingPrice;
    p.unit = newUnit;

    await recordAuditLog({
      user_id: userContext?.user_id,
      user_role: userContext?.user_role || "ADMIN",
      shift_id: userContext?.shift_id,
      device_terminal: userContext?.device_terminal,
      action_type: "PRICE_UPDATE",
      severity: "WARNING",
      entity_name: "Product",
      entity_id: id,
      old_values: oldValues,
      new_values: newValues,
      description,
    });

    return p;
  }

  throw new Error("Gagal memperbarui harga produk.");
}

export async function restockInventoryProduct(
  id: string,
  data: {
    qty_added: number;
    supplier_notes?: string;
  },
  userContext?: {
    user_id?: string;
    user_role?: string;
    shift_id?: string | null;
    device_terminal?: string | null;
  }
): Promise<{ product: InventoryProduct; movement: StockMovementRecord }> {
  const current = await getProductById(id);
  if (!current) throw new Error("Produk tidak ditemukan.");
  if (current.item_type !== "GOODS") throw new Error("Hanya item bertipe BARANG (GOODS) yang dapat direstock.");

  const stockBefore = current.stock_qty ?? 0;
  const stockAfter = stockBefore + data.qty_added;

  try {
    const updated = await prisma.product.update({
      where: { id },
      data: { stock_qty: stockAfter },
    });

    const movement = await prisma.stockMovement.create({
      data: {
        product_id: id,
        shift_id: userContext?.shift_id || null,
        movement_type: "RESTOCK",
        qty_change: data.qty_added,
        stock_before: stockBefore,
        stock_after: stockAfter,
        reason_category: "RESTOCK_SUPPLIER",
        notes: data.supplier_notes || "Restock barang masuk",
        created_by: userContext?.user_id || "00000000-0000-0000-0000-000000000001",
      },
    });

    await recordAuditLog({
      user_id: userContext?.user_id,
      user_role: userContext?.user_role || "ADMIN",
      shift_id: userContext?.shift_id,
      device_terminal: userContext?.device_terminal,
      action_type: "RESTOCK",
      severity: "INFO",
      entity_name: "StockMovement",
      entity_id: movement.id,
      old_values: { stock_qty: stockBefore },
      new_values: { stock_qty: stockAfter, qty_added: data.qty_added },
      description: `Restock barang datang '${current.name}': +${data.qty_added} ${current.unit} (Stok: ${stockBefore} ➔ ${stockAfter})`,
    });

    const movementRecord: StockMovementRecord = {
      id: movement.id,
      product_id: current.id,
      product_name: current.name,
      product_sku: current.sku,
      shift_id: movement.shift_id,
      movement_type: "RESTOCK",
      qty_change: movement.qty_change,
      stock_before: movement.stock_before,
      stock_after: movement.stock_after,
      cost_price_snapshot: current.cost_price,
      reason_category: movement.reason_category,
      notes: movement.notes,
      created_by: movement.created_by,
      created_at: movement.created_at.toISOString(),
    };

    return {
      product: {
        ...current,
        stock_qty: stockAfter,
      },
      movement: movementRecord,
    };
  } catch {
    // Memory store fallback
  }

  const idx = (globalInventoryStore.__tefa_products || []).findIndex((p) => p.id === id);
  if (idx > -1 && globalInventoryStore.__tefa_products) {
    const p = globalInventoryStore.__tefa_products[idx];
    p.stock_qty = stockAfter;

    const memoryMovement: StockMovementRecord = {
      id: `mov-${Date.now()}`,
      product_id: current.id,
      product_name: current.name,
      product_sku: current.sku,
      shift_id: userContext?.shift_id || null,
      movement_type: "RESTOCK",
      qty_change: data.qty_added,
      stock_before: stockBefore,
      stock_after: stockAfter,
      cost_price_snapshot: current.cost_price,
      reason_category: "RESTOCK_SUPPLIER",
      notes: data.supplier_notes || "Restock barang masuk",
      created_by: userContext?.user_id || "admin",
      created_at: new Date().toISOString(),
    };

    globalInventoryStore.__tefa_stock_movements?.unshift(memoryMovement);

    await recordAuditLog({
      user_id: userContext?.user_id,
      user_role: userContext?.user_role || "ADMIN",
      shift_id: userContext?.shift_id,
      device_terminal: userContext?.device_terminal,
      action_type: "RESTOCK",
      severity: "INFO",
      entity_name: "StockMovement",
      entity_id: memoryMovement.id,
      old_values: { stock_qty: stockBefore },
      new_values: { stock_qty: stockAfter, qty_added: data.qty_added },
      description: `Restock barang datang '${current.name}': +${data.qty_added} ${current.unit} (Stok: ${stockBefore} ➔ ${stockAfter})`,
    });

    return { product: p, movement: memoryMovement };
  }

  throw new Error("Gagal restock produk.");
}

export async function reportInventorySpoilage(
  id: string,
  data: {
    qty_damaged: number;
    reason_category: "SALAH_PRINT" | "PAPER_JAM" | "BARANG_CACAT" | "LAINNYA" | string;
    notes: string;
  },
  userContext?: {
    user_id?: string;
    user_role?: string;
    shift_id?: string | null;
    device_terminal?: string | null;
  }
): Promise<{ product: InventoryProduct; movement: StockMovementRecord }> {
  const current = await getProductById(id);
  if (!current) throw new Error("Produk tidak ditemukan.");
  if (current.item_type !== "GOODS") throw new Error("Laporan barang rusak (spoilage) hanya berlaku untuk item bertipe BARANG fisik.");

  const stockBefore = current.stock_qty ?? 0;
  if (stockBefore < data.qty_damaged) {
    throw new Error(`Jumlah rusak (${data.qty_damaged}) melebihi stok yang tersedia (${stockBefore}).`);
  }

  const stockAfter = stockBefore - data.qty_damaged;
  const lossValue = data.qty_damaged * current.cost_price;

  try {
    const updated = await prisma.product.update({
      where: { id },
      data: { stock_qty: stockAfter },
    });

    const movement = await prisma.stockMovement.create({
      data: {
        product_id: id,
        shift_id: userContext?.shift_id || null,
        movement_type: "SPOILAGE_DAMAGE",
        qty_change: -data.qty_damaged,
        stock_before: stockBefore,
        stock_after: stockAfter,
        reason_category: data.reason_category,
        notes: data.notes,
        created_by: userContext?.user_id || "00000000-0000-0000-0000-000000000001",
      },
    });

    // Perekaman Audit Log level WARNING
    await recordAuditLog({
      user_id: userContext?.user_id,
      user_role: userContext?.user_role || "ADMIN",
      shift_id: userContext?.shift_id,
      device_terminal: userContext?.device_terminal,
      action_type: "SPOILAGE_DAMAGE",
      severity: "WARNING",
      entity_name: "StockMovement",
      entity_id: movement.id,
      old_values: { stock_qty: stockBefore },
      new_values: {
        stock_qty: stockAfter,
        qty_damaged: data.qty_damaged,
        reason_category: data.reason_category,
        loss_value: lossValue,
      },
      description: `Lapor barang rusak/salah print '${current.name}': -${data.qty_damaged} ${current.unit} (Penyebab: ${data.reason_category}, Nilai Kerugian: Rp ${lossValue.toLocaleString("id-ID")})`,
    });

    const movementRecord: StockMovementRecord = {
      id: movement.id,
      product_id: current.id,
      product_name: current.name,
      product_sku: current.sku,
      shift_id: movement.shift_id,
      movement_type: "SPOILAGE_DAMAGE",
      qty_change: movement.qty_change,
      stock_before: movement.stock_before,
      stock_after: movement.stock_after,
      cost_price_snapshot: current.cost_price,
      loss_value: lossValue,
      reason_category: movement.reason_category,
      notes: movement.notes,
      created_by: movement.created_by,
      created_at: movement.created_at.toISOString(),
    };

    return {
      product: { ...current, stock_qty: stockAfter },
      movement: movementRecord,
    };
  } catch {
    // Memory store fallback
  }

  const idx = (globalInventoryStore.__tefa_products || []).findIndex((p) => p.id === id);
  if (idx > -1 && globalInventoryStore.__tefa_products) {
    const p = globalInventoryStore.__tefa_products[idx];
    p.stock_qty = stockAfter;

    const memoryMovement: StockMovementRecord = {
      id: `mov-${Date.now()}`,
      product_id: current.id,
      product_name: current.name,
      product_sku: current.sku,
      shift_id: userContext?.shift_id || null,
      movement_type: "SPOILAGE_DAMAGE",
      qty_change: -data.qty_damaged,
      stock_before: stockBefore,
      stock_after: stockAfter,
      cost_price_snapshot: current.cost_price,
      loss_value: lossValue,
      reason_category: data.reason_category,
      notes: data.notes,
      created_by: userContext?.user_id || "admin",
      created_at: new Date().toISOString(),
    };

    globalInventoryStore.__tefa_stock_movements?.unshift(memoryMovement);

    await recordAuditLog({
      user_id: userContext?.user_id,
      user_role: userContext?.user_role || "ADMIN",
      shift_id: userContext?.shift_id,
      device_terminal: userContext?.device_terminal,
      action_type: "SPOILAGE_DAMAGE",
      severity: "WARNING",
      entity_name: "StockMovement",
      entity_id: memoryMovement.id,
      old_values: { stock_qty: stockBefore },
      new_values: {
        stock_qty: stockAfter,
        qty_damaged: data.qty_damaged,
        reason_category: data.reason_category,
        loss_value: lossValue,
      },
      description: `Lapor barang rusak/salah print '${current.name}': -${data.qty_damaged} ${current.unit} (Penyebab: ${data.reason_category}, Nilai Kerugian: Rp ${lossValue.toLocaleString("id-ID")})`,
    });

    return { product: p, movement: memoryMovement };
  }

  throw new Error("Gagal mencatat barang rusak.");
}

export async function getRecentSpoilageList(shiftId?: string | null): Promise<StockMovementRecord[]> {
  try {
    const where: Record<string, unknown> = {
      movement_type: "SPOILAGE_DAMAGE",
    };
    if (shiftId) where.shift_id = shiftId;

    const list = await prisma.stockMovement.findMany({
      where,
      include: { product: true },
      orderBy: { created_at: "desc" },
      take: 20,
    });

    if (list.length > 0) {
      return list.map((m) => {
        const costPrice = Number(m.product.cost_price);
        const qtyDamaged = Math.abs(m.qty_change);
        return {
          id: m.id,
          product_id: m.product_id,
          product_name: m.product.name,
          product_sku: m.product.sku,
          shift_id: m.shift_id,
          movement_type: m.movement_type,
          qty_change: m.qty_change,
          stock_before: m.stock_before,
          stock_after: m.stock_after,
          cost_price_snapshot: costPrice,
          loss_value: qtyDamaged * costPrice,
          reason_category: m.reason_category,
          notes: m.notes,
          created_by: m.created_by,
          created_at: m.created_at.toISOString(),
        };
      });
    }
  } catch {
    // Memory store fallback
  }

  return (globalInventoryStore.__tefa_stock_movements || [])
    .filter((m) => m.movement_type === "SPOILAGE_DAMAGE")
    .map((m) => ({
      ...m,
      loss_value: Math.abs(m.qty_change) * m.cost_price_snapshot,
    }));
}

/**
 * Mengembalikan stok barang fisik (GOODS) jika sebuah transaksi dibatalkan (VOID).
 */
export async function returnStockForVoidedItems(
  items: Array<{
    product_id: string;
    product_name_snapshot: string;
    item_type_snapshot: string;
    qty: number;
    cost_price_snapshot: number;
  }>,
  invoiceNumber: string,
  shiftId: string | null,
  userId: string = "system"
) {
  for (const item of items) {
    if (item.item_type_snapshot !== "GOODS") continue;

    const current = await getProductById(item.product_id);
    if (!current || current.stock_qty === null) continue;

    const stockBefore = current.stock_qty;
    const stockAfter = stockBefore + item.qty;

    try {
      await prisma.product.update({
        where: { id: item.product_id },
        data: { stock_qty: stockAfter },
      });

      await prisma.stockMovement.create({
        data: {
          product_id: item.product_id,
          shift_id: shiftId,
          movement_type: "VOID_RETURN",
          qty_change: item.qty,
          stock_before: stockBefore,
          stock_after: stockAfter,
          reason_category: "VOID_TRANSACTION",
          notes: `Pengembalian stok pembatalan transaksi #${invoiceNumber}`,
          created_by: userId,
        },
      });
    } catch {
      // Memory store fallback
    }

    const idx = (globalInventoryStore.__tefa_products || []).findIndex((p) => p.id === item.product_id);
    if (idx > -1 && globalInventoryStore.__tefa_products) {
      globalInventoryStore.__tefa_products[idx].stock_qty = stockAfter;

      const memMovement: StockMovementRecord = {
        id: `mov-void-${Date.now()}-${Math.random().toString(36).substring(2, 5)}`,
        product_id: item.product_id,
        product_name: item.product_name_snapshot,
        product_sku: current.sku,
        shift_id: shiftId,
        movement_type: "VOID_RETURN",
        qty_change: item.qty,
        stock_before: stockBefore,
        stock_after: stockAfter,
        cost_price_snapshot: item.cost_price_snapshot,
        reason_category: "VOID_TRANSACTION",
        notes: `Pengembalian stok pembatalan transaksi #${invoiceNumber}`,
        created_by: userId,
        created_at: new Date().toISOString(),
      };

      globalInventoryStore.__tefa_stock_movements?.unshift(memMovement);
    }
  }
}

