import { NextResponse } from "next/server";
import { updateInventoryProductPrice } from "@/lib/inventory-data";
import { getCurrentUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getCurrentUser();
    const id = params.id;
    const body = await request.json();
    const { cost_price, selling_price, name, unit, shift_id, device_terminal } = body;

    const updatePayload: {
      cost_price?: number;
      selling_price?: number;
      name?: string;
      unit?: string;
    } = {};

    if (cost_price !== undefined) {
      const c = Number(cost_price);
      if (isNaN(c) || c < 0) {
        return NextResponse.json({ error: "Harga modal (HPP) tidak valid." }, { status: 400 });
      }
      updatePayload.cost_price = c;
    }

    if (selling_price !== undefined) {
      const s = Number(selling_price);
      if (isNaN(s) || s < 0) {
        return NextResponse.json({ error: "Harga jual tidak valid." }, { status: 400 });
      }
      updatePayload.selling_price = s;
    }

    if (name) updatePayload.name = String(name).trim();
    if (unit) updatePayload.unit = String(unit).trim();

    const updated = await updateInventoryProductPrice(id, updatePayload, {
      user_id: user?.id,
      user_role: user?.role,
      shift_id: shift_id || null,
      device_terminal: device_terminal || null,
    });

    return NextResponse.json({
      success: true,
      message: `Harga produk '${updated.name}' berhasil diperbarui dan dicatat ke Audit Log.`,
      product: updated,
    });
  } catch (error: unknown) {
    console.error("PATCH /api/products/[id] error:", error);
    const msg = error instanceof Error ? error.message : "Gagal memperbarui harga produk.";
    return NextResponse.json({ error: msg }, { status: 400 });
  }
}
