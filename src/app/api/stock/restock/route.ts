import { NextResponse } from "next/server";
import { restockInventoryProduct } from "@/lib/inventory-data";
import { getCurrentUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();
    const body = await request.json();
    const { product_id, qty_added, supplier_notes, shift_id, device_terminal } = body;

    if (!product_id) {
      return NextResponse.json({ error: "Product ID wajib disertakan." }, { status: 400 });
    }

    const qty = Number(qty_added);
    if (isNaN(qty) || qty <= 0) {
      return NextResponse.json(
        { error: "Jumlah restock harus berupa angka positif lebih dari 0." },
        { status: 400 }
      );
    }

    const result = await restockInventoryProduct(
      product_id,
      {
        qty_added: qty,
        supplier_notes: supplier_notes ? String(supplier_notes).trim() : undefined,
      },
      {
        user_id: user?.id,
        user_role: user?.role,
        shift_id: shift_id || null,
        device_terminal: device_terminal || null,
      }
    );

    return NextResponse.json({
      success: true,
      message: `Berhasil restock +${qty} unit untuk '${result.product.name}'.`,
      product: result.product,
      movement: result.movement,
    });
  } catch (error: unknown) {
    console.error("POST /api/stock/restock error:", error);
    const msg = error instanceof Error ? error.message : "Gagal restock produk.";
    return NextResponse.json({ error: msg }, { status: 400 });
  }
}
