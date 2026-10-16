import { NextResponse } from "next/server";
import { verifyShiftWithEvaluation } from "@/lib/supervisor-data";
import { getCurrentUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getCurrentUser();
    const body = await request.json();
    const { teacher_score, teacher_evaluation_notes } = body;

    const score = Number(teacher_score);
    if (isNaN(score) || score < 0 || score > 100) {
      return NextResponse.json(
        { error: "Skor penilaian tim siswa wajib berupa angka antara 0 hingga 100." },
        { status: 400 }
      );
    }

    if (!teacher_evaluation_notes || String(teacher_evaluation_notes).trim().length === 0) {
      return NextResponse.json(
        { error: "Catatan evaluasi / berita acara Guru Pembimbing wajib diisi." },
        { status: 400 }
      );
    }

    const verified = await verifyShiftWithEvaluation(params.id, {
      teacher_score: score,
      teacher_evaluation_notes: String(teacher_evaluation_notes).trim(),
      verified_by: user?.id,
    });

    return NextResponse.json({
      success: true,
      message: "Laporan tutup shift berhasil diverifikasi dan disahkan.",
      shift: verified,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Gagal memverifikasi shift.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
