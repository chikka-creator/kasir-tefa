import { NextResponse } from "next/server";
import { getInventoryProducts, createInventoryProduct } from "@/lib/inventory-data";
import { getCurrentUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const products = await getInventoryProducts();
    return NextResponse.json({ products });
  } catch (error) {
    console.error("GET /api/products error:", error);
    return NextResponse.json(
      { error: "Gagal mengambil daftar katalog produk." },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();
    const body = await request.json();
    const {
      sku,
      name,
      item_type,
      cost_price,
      selling_price,
      stock_qty,
      unit,
      category_name,
      shift_id,
      device_terminal,
    } = body;

    if (!sku || !name || !item_type || selling_price === undefined) {
      return NextResponse.json(
        { error: "SKU, nama produk, tipe item, dan harga jual wajib diisi." },
        { status: 400 }
      );
    }

    if (item_type !== "SERVICE" && item_type !== "GOODS") {
      return NextResponse.json(
        { error: "Tipe item harus berupa SERVICE atau GOODS." },
        { status: 400 }
      );
    }

    const costPriceNum = Number(cost_price || 0);
    const sellingPriceNum = Number(selling_price);

    if (sellingPriceNum < 0) {
      return NextResponse.json(
        { error: "Harga jual tidak boleh negatif." },
        { status: 400 }
      );
    }

    const created = await createInventoryProduct({
      sku: String(sku).trim().toUpperCase(),
      name: String(name).trim(),
      item_type,
      cost_price: costPriceNum,
      selling_price: sellingPriceNum,
      stock_qty: item_type === "GOODS" ? Number(stock_qty || 0) : null,
      unit: unit ? String(unit).trim() : "pcs",
      category_name: category_name ? String(category_name).trim() : undefined,
      user_id: user?.id,
      user_role: user?.role,
      shift_id: shift_id || null,
      device_terminal: device_terminal || null,
    });

    return NextResponse.json({
      success: true,
      message: `Item '${created.name}' berhasil ditambahkan.`,
      product: created,
    });
  } catch (error: unknown) {
    console.error("POST /api/products error:", error);
    const msg = error instanceof Error ? error.message : "Gagal menambahkan produk.";
    return NextResponse.json({ error: msg }, { status: 400 });
  }
}
