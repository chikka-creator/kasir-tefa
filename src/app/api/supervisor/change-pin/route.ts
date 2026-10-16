import { NextResponse } from "next/server";
import { updateSupervisorPin } from "@/lib/supervisor-data";
import { getCurrentUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();
    const body = await request.json();
    const { old_pin, new_pin } = body;

    if (!old_pin || !new_pin) {
      return NextResponse.json(
        { error: "PIN lama dan PIN baru wajib diisi." },
        { status: 400 }
      );
    }

    await updateSupervisorPin(old_pin, new_pin, user?.id);

    return NextResponse.json({
      success: true,
      message: "PIN 6-digit Supervisor berhasil diperbarui.",
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Gagal memperbarui PIN Supervisor.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
