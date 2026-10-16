import { NextResponse } from "next/server";
import { reportInventorySpoilage } from "@/lib/inventory-data";
import { getCurrentUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();
    const body = await request.json();
    const {
      product_id,
      qty_damaged,
      reason_category,
      notes,
      shift_id,
      device_terminal,
    } = body;

    if (!product_id) {
      return NextResponse.json({ error: "Pilih barang/bahan yang rusak terlebih dahulu." }, { status: 400 });
    }

    const qty = Number(qty_damaged);
    if (isNaN(qty) || qty <= 0) {
      return NextResponse.json(
        { error: "Jumlah barang rusak/terbuang harus lebih dari 0." },
        { status: 400 }
      );
    }

    if (!reason_category) {
      return NextResponse.json(
        { error: "Pilih kategori penyebab barang rusak/salah print." },
        { status: 400 }
      );
    }

    if (!notes || String(notes).trim().length < 5) {
      return NextResponse.json(
        { error: "Keterangan detail alasan wajib diisi (minimal 5 karakter)." },
        { status: 400 }
      );
    }

    const result = await reportInventorySpoilage(
      product_id,
      {
        qty_damaged: qty,
        reason_category: String(reason_category),
        notes: String(notes).trim(),
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
      message: `Laporan barang rusak berhasil dicatat (-${qty} unit '${result.product.name}').`,
      product: result.product,
      movement: result.movement,
    });
  } catch (error: unknown) {
    console.error("POST /api/stock/spoilage error:", error);
    const msg = error instanceof Error ? error.message : "Gagal mencatat barang rusak.";
    return NextResponse.json({ error: msg }, { status: 400 });
  }
}
