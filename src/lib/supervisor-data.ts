import { prisma } from "@/lib/db";
import bcrypt from "bcryptjs";
import { recordAuditLog } from "@/lib/audit-logger";
import { returnStockForVoidedItems, getRecentSpoilageList } from "@/lib/inventory-data";
import { ShiftRecord, TransactionRecord } from "@/lib/shifts-data";

// In-memory global store references
const globalStore = globalThis as unknown as {
  __tefa_shifts?: ShiftRecord[];
  __tefa_transactions?: TransactionRecord[];
  __tefa_supervisor_pin?: string;
};

if (!globalStore.__tefa_supervisor_pin) {
  globalStore.__tefa_supervisor_pin = "123456";
}

/**
 * Memverifikasi PIN 6-digit Supervisor Guru Pembimbing.
 * Default PIN: "123456"
 */
export async function verifySupervisorPin(pin: string): Promise<boolean> {
  const trimmed = String(pin).trim();
  if (trimmed.length !== 6 || !/^\d{6}$/.test(trimmed)) {
    return false;
  }

  try {
    const teacher = await prisma.user.findFirst({
      where: { role: "TEACHER", is_active: true },
    });

    if (teacher?.supervisor_pin_hash) {
      return await bcrypt.compare(trimmed, teacher.supervisor_pin_hash);
    }
  } catch {
    // Memory store fallback
  }

  return trimmed === (globalStore.__tefa_supervisor_pin || "123456");
}

/**
 * Mengubah PIN 6-digit Supervisor Guru Pembimbing.
 */
export async function updateSupervisorPin(oldPin: string, newPin: string, userId?: string) {
  const isOldValid = await verifySupervisorPin(oldPin);
  if (!isOldValid) {
    throw new Error("PIN Supervisor lama tidak cocok.");
  }

  const trimmedNew = String(newPin).trim();
  if (trimmedNew.length !== 6 || !/^\d{6}$/.test(trimmedNew)) {
    throw new Error("PIN Baru wajib berupa 6 digit angka numerik.");
  }

  const hashed = await bcrypt.hash(trimmedNew, 10);

  try {
    const teacher = await prisma.user.findFirst({
      where: { role: "TEACHER", is_active: true },
    });

    if (teacher) {
      await prisma.user.update({
        where: { id: teacher.id },
        data: { supervisor_pin_hash: hashed },
      });
    }
  } catch {
    // Memory store fallback
  }

  globalStore.__tefa_supervisor_pin = trimmedNew;

  await recordAuditLog({
    user_id: userId,
    user_role: "TEACHER",
    action_type: "SUPERVISOR_PIN_CHANGE",
    severity: "INFO",
    entity_name: "User",
    entity_id: userId || "teacher-1",
    description: "Guru Pembimbing berhasil memperbarui 6-digit PIN Supervisor.",
  });

  return { success: true };
}

/**
 * Mode 1: Membatalkan transaksi seketika dengan 6-digit PIN Supervisor di layar kasir.
 */
export async function voidTransactionWithPin(
  transactionId: string,
  pin: string,
  reason: string,
  userContext?: {
    user_id?: string;
    user_role?: string;
    device_terminal?: string;
    shift_id?: string;
  }
) {
  const isPinValid = await verifySupervisorPin(pin);
  if (!isPinValid) {
    throw new Error("PIN Supervisor tidak valid. Masukkan 6 digit PIN Guru Pembimbing yang benar.");
  }

  const trimmedReason = String(reason || "").trim();
  if (trimmedReason.length < 5) {
    throw new Error("Alasan pembatalan transaksi wajib diisi minimal 5 karakter.");
  }

  try {
    const dbTx = await prisma.transaction.findUnique({
      where: { id: transactionId },
      include: { items: true },
    });

    if (dbTx) {
      if (dbTx.status === "VOIDED") {
        throw new Error("Transaksi ini sudah berstatus VOID (dibatalkan).");
      }

      const updated = await prisma.transaction.update({
        where: { id: transactionId },
        data: {
          status: "VOIDED",
          void_reason: trimmedReason,
          void_approval_method: "PIN_ON_SITE",
          void_approved_at: new Date(),
        },
        include: { items: true },
      });

      // Kembalikan stok barang fisik (GOODS)
      await returnStockForVoidedItems(
        updated.items.map((i) => ({
          product_id: i.product_id,
          product_name_snapshot: i.product_name_snapshot,
          item_type_snapshot: i.item_type_snapshot,
          qty: i.qty,
          cost_price_snapshot: Number(i.cost_price_snapshot),
        })),
        updated.invoice_number,
        updated.shift_id,
        userContext?.user_id || "supervisor"
      );

      await recordAuditLog({
        user_id: userContext?.user_id,
        user_role: userContext?.user_role || "ADMIN",
        shift_id: updated.shift_id,
        device_terminal: updated.device_terminal,
        action_type: "TRANSACTION_VOID",
        severity: "WARNING",
        entity_name: "Transaction",
        entity_id: updated.id,
        old_values: { status: dbTx.status },
        new_values: {
          status: "VOIDED",
          method: "PIN_ON_SITE",
          reason: trimmedReason,
          total_amount: Number(updated.total_amount),
        },
        description: `Membatalkan transaksi #${updated.invoice_number} (Rp ${Number(updated.total_amount).toLocaleString("id-ID")}) menggunakan PIN Supervisor di tempat. Alasan: ${trimmedReason}`,
      });

      return {
        id: updated.id,
        invoice_number: updated.invoice_number,
        status: updated.status,
        void_approval_method: updated.void_approval_method,
      };
    }
  } catch (err: unknown) {
    if (err instanceof Error && (err.message.includes("Alasan") || err.message.includes("PIN") || err.message.includes("sudah berstatus"))) {
      throw err;
    }
    // Memory store fallback
  }

  // Memory store fallback
  const memTx = (globalStore.__tefa_transactions || []).find((t) => t.id === transactionId);
  if (!memTx) {
    throw new Error("Transaksi tidak ditemukan.");
  }
  if (memTx.status === "VOIDED") {
    throw new Error("Transaksi ini sudah berstatus VOID (dibatalkan).");
  }

  const oldStatus = memTx.status;
  memTx.status = "VOIDED";
  memTx.void_reason = trimmedReason;
  memTx.void_approval_method = "PIN_ON_SITE";
  memTx.void_approved_at = new Date().toISOString();

  await returnStockForVoidedItems(
    memTx.items,
    memTx.invoice_number,
    memTx.shift_id,
    userContext?.user_id || "supervisor"
  );

  await recordAuditLog({
    user_id: userContext?.user_id,
    user_role: userContext?.user_role || "ADMIN",
    shift_id: memTx.shift_id,
    device_terminal: memTx.device_terminal,
    action_type: "TRANSACTION_VOID",
    severity: "WARNING",
    entity_name: "Transaction",
    entity_id: memTx.id,
    old_values: { status: oldStatus },
    new_values: {
      status: "VOIDED",
      method: "PIN_ON_SITE",
      reason: trimmedReason,
      total_amount: memTx.total_amount,
    },
    description: `Membatalkan transaksi #${memTx.invoice_number} (Rp ${memTx.total_amount.toLocaleString("id-ID")}) menggunakan PIN Supervisor di tempat. Alasan: ${trimmedReason}`,
  });

  return {
    id: memTx.id,
    invoice_number: memTx.invoice_number,
    status: memTx.status,
    void_approval_method: memTx.void_approval_method,
  };
}

/**
 * Mode 2: Siswa kasir mengajukan pembatalan jarak jauh ke dashboard Guru Pembimbing.
 */
export async function requestVoidTransaction(
  transactionId: string,
  reason: string,
  userContext?: {
    user_id?: string;
    user_role?: string;
    device_terminal?: string;
    shift_id?: string;
  }
) {
  const trimmedReason = String(reason || "").trim();
  if (trimmedReason.length < 5) {
    throw new Error("Alasan pengajuan pembatalan wajib diisi minimal 5 karakter.");
  }

  try {
    const dbTx = await prisma.transaction.findUnique({
      where: { id: transactionId },
    });

    if (dbTx) {
      if (dbTx.status === "VOIDED") {
        throw new Error("Transaksi ini sudah berstatus VOID (dibatalkan).");
      }
      if (dbTx.status === "VOID_REQUESTED") {
        throw new Error("Transaksi ini sudah dalam antrean pengajuan void.");
      }

      const updated = await prisma.transaction.update({
        where: { id: transactionId },
        data: {
          status: "VOID_REQUESTED",
          void_reason: trimmedReason,
          void_approval_method: "DASHBOARD_REMOTE",
        },
      });

      await recordAuditLog({
        user_id: userContext?.user_id,
        user_role: userContext?.user_role || "ADMIN",
        shift_id: updated.shift_id,
        device_terminal: updated.device_terminal,
        action_type: "VOID_REQUEST",
        severity: "INFO",
        entity_name: "Transaction",
        entity_id: updated.id,
        old_values: { status: dbTx.status },
        new_values: { status: "VOID_REQUESTED", reason: trimmedReason },
        description: `Kasir mengajukan pembatalan transaksi #${updated.invoice_number} ke Guru Pembimbing. Alasan: ${trimmedReason}`,
      });

      return {
        id: updated.id,
        invoice_number: updated.invoice_number,
        status: updated.status,
      };
    }
  } catch (err: unknown) {
    if (err instanceof Error && (err.message.includes("Alasan") || err.message.includes("sudah"))) {
      throw err;
    }
    // Memory store fallback
  }

  const memTx = (globalStore.__tefa_transactions || []).find((t) => t.id === transactionId);
  if (!memTx) {
    throw new Error("Transaksi tidak ditemukan.");
  }
  if (memTx.status === "VOIDED") {
    throw new Error("Transaksi ini sudah berstatus VOID (dibatalkan).");
  }
  if (memTx.status === "VOID_REQUESTED") {
    throw new Error("Transaksi ini sudah dalam antrean pengajuan void.");
  }

  const oldStatus = memTx.status;
  memTx.status = "VOID_REQUESTED";
  memTx.void_reason = trimmedReason;
  memTx.void_approval_method = "DASHBOARD_REMOTE";

  await recordAuditLog({
    user_id: userContext?.user_id,
    user_role: userContext?.user_role || "ADMIN",
    shift_id: memTx.shift_id,
    device_terminal: memTx.device_terminal,
    action_type: "VOID_REQUEST",
    severity: "INFO",
    entity_name: "Transaction",
    entity_id: memTx.id,
    old_values: { status: oldStatus },
    new_values: { status: "VOID_REQUESTED", reason: trimmedReason },
    description: `Kasir mengajukan pembatalan transaksi #${memTx.invoice_number} ke Guru Pembimbing. Alasan: ${trimmedReason}`,
  });

  return {
    id: memTx.id,
    invoice_number: memTx.invoice_number,
    status: memTx.status,
  };
}

/**
 * Guru Pembimbing menyetujui atau menolak pengajuan void dari dashboard.
 */
export async function approveVoidTransaction(
  transactionId: string,
  action: "APPROVE" | "REJECT",
  teacherNotes?: string,
  userContext?: {
    user_id?: string;
    user_role?: string;
  }
) {
  try {
    const dbTx = await prisma.transaction.findUnique({
      where: { id: transactionId },
      include: { items: true },
    });

    if (dbTx) {
      if (dbTx.status !== "VOID_REQUESTED") {
        throw new Error("Hanya transaksi dengan status VOID_REQUESTED yang dapat diproses.");
      }

      if (action === "APPROVE") {
        const updated = await prisma.transaction.update({
          where: { id: transactionId },
          data: {
            status: "VOIDED",
            void_approved_at: new Date(),
          },
          include: { items: true },
        });

        // Kembalikan stok barang fisik
        await returnStockForVoidedItems(
          updated.items.map((i) => ({
            product_id: i.product_id,
            product_name_snapshot: i.product_name_snapshot,
            item_type_snapshot: i.item_type_snapshot,
            qty: i.qty,
            cost_price_snapshot: Number(i.cost_price_snapshot),
          })),
          updated.invoice_number,
          updated.shift_id,
          userContext?.user_id || "teacher"
        );

        await recordAuditLog({
          user_id: userContext?.user_id,
          user_role: "TEACHER",
          shift_id: updated.shift_id,
          device_terminal: updated.device_terminal,
          action_type: "TRANSACTION_VOID_APPROVED",
          severity: "WARNING",
          entity_name: "Transaction",
          entity_id: updated.id,
          old_values: { status: "VOID_REQUESTED" },
          new_values: { status: "VOIDED", approved_by: userContext?.user_id },
          description: `Guru Pembimbing MENYETUJUI pembatalan transaksi #${updated.invoice_number} (Rp ${Number(updated.total_amount).toLocaleString("id-ID")}).`,
        });

        return { success: true, status: "VOIDED" };
      } else {
        // REJECT
        const updated = await prisma.transaction.update({
          where: { id: transactionId },
          data: {
            status: "PAID",
          },
        });

        await recordAuditLog({
          user_id: userContext?.user_id,
          user_role: "TEACHER",
          shift_id: updated.shift_id,
          device_terminal: updated.device_terminal,
          action_type: "TRANSACTION_VOID_REJECTED",
          severity: "INFO",
          entity_name: "Transaction",
          entity_id: updated.id,
          old_values: { status: "VOID_REQUESTED" },
          new_values: { status: "PAID", teacher_notes: teacherNotes || "Ditolak" },
          description: `Guru Pembimbing MENOLAK pembatalan transaksi #${updated.invoice_number}. Catatan: ${teacherNotes || "-"}`,
        });

        return { success: true, status: "PAID" };
      }
    }
  } catch (err: unknown) {
    if (err instanceof Error && err.message.includes("Hanya transaksi")) {
      throw err;
    }
    // Memory store fallback
  }

  const memTx = (globalStore.__tefa_transactions || []).find((t) => t.id === transactionId);
  if (!memTx) {
    throw new Error("Transaksi tidak ditemukan.");
  }
  if (memTx.status !== "VOID_REQUESTED") {
    throw new Error("Hanya transaksi dengan status VOID_REQUESTED yang dapat diproses.");
  }

  if (action === "APPROVE") {
    memTx.status = "VOIDED";
    memTx.void_approved_at = new Date().toISOString();

    await returnStockForVoidedItems(
      memTx.items,
      memTx.invoice_number,
      memTx.shift_id,
      userContext?.user_id || "teacher"
    );

    await recordAuditLog({
      user_id: userContext?.user_id,
      user_role: "TEACHER",
      shift_id: memTx.shift_id,
      device_terminal: memTx.device_terminal,
      action_type: "TRANSACTION_VOID_APPROVED",
      severity: "WARNING",
      entity_name: "Transaction",
      entity_id: memTx.id,
      old_values: { status: "VOID_REQUESTED" },
      new_values: { status: "VOIDED", approved_by: userContext?.user_id },
      description: `Guru Pembimbing MENYETUJUI pembatalan transaksi #${memTx.invoice_number} (Rp ${memTx.total_amount.toLocaleString("id-ID")}).`,
    });

    return { success: true, status: "VOIDED" };
  } else {
    memTx.status = "PAID";

    await recordAuditLog({
      user_id: userContext?.user_id,
      user_role: "TEACHER",
      shift_id: memTx.shift_id,
      device_terminal: memTx.device_terminal,
      action_type: "TRANSACTION_VOID_REJECTED",
      severity: "INFO",
      entity_name: "Transaction",
      entity_id: memTx.id,
      old_values: { status: "VOID_REQUESTED" },
      new_values: { status: "PAID", teacher_notes: teacherNotes || "Ditolak" },
      description: `Guru Pembimbing MENOLAK pembatalan transaksi #${memTx.invoice_number}. Catatan: ${teacherNotes || "-"}`,
    });

    return { success: true, status: "PAID" };
  }
}

/**
 * Mengambil daftar antrean transaksi yang berstatus VOID_REQUESTED untuk Guru.
 */
export async function getPendingVoidRequests() {
  try {
    const list = await prisma.transaction.findMany({
      where: { status: "VOID_REQUESTED" },
      include: { items: true },
      orderBy: { created_at: "desc" },
    });

    if (list.length > 0) {
      return list.map((t) => ({
        id: t.id,
        invoice_number: t.invoice_number,
        shift_id: t.shift_id,
        device_terminal: t.device_terminal,
        subtotal: Number(t.subtotal),
        total_amount: Number(t.total_amount),
        payment_method: t.payment_method,
        status: t.status,
        void_reason: t.void_reason,
        void_approval_method: t.void_approval_method,
        created_at: t.created_at.toISOString(),
        items: t.items.map((i) => ({
          product_name: i.product_name_snapshot,
          qty: i.qty,
          subtotal: Number(i.subtotal),
        })),
      }));
    }
  } catch {
    // Memory store fallback
  }

  return (globalStore.__tefa_transactions || [])
    .filter((t) => t.status === "VOID_REQUESTED")
    .map((t) => ({
      id: t.id,
      invoice_number: t.invoice_number,
      shift_id: t.shift_id,
      device_terminal: t.device_terminal,
      subtotal: t.subtotal,
      total_amount: t.total_amount,
      payment_method: t.payment_method,
      status: t.status,
      void_reason: t.void_reason || null,
      void_approval_method: t.void_approval_method || null,
      created_at: t.created_at,
      items: t.items.map((i) => ({
        product_name: i.product_name_snapshot,
        qty: i.qty,
        subtotal: i.subtotal,
      })),
    }));
}

/**
 * Mengambil daftar shift berstatus PENDING_VERIFICATION (ditutup siswa, menunggu guru).
 */
export async function getPendingShifts() {
  let pendingList: ShiftRecord[] = [];

  try {
    const dbList = await prisma.shift.findMany({
      where: { status: "PENDING_VERIFICATION" },
      include: { transactions: { include: { items: true } } },
      orderBy: { closed_at: "desc" },
    });

    if (dbList.length > 0) {
      pendingList = dbList.map((s) => ({
        id: s.id,
        shift_code: s.shift_code,
        student_worker_1: s.student_worker_1,
        student_worker_2: s.student_worker_2,
        student_worker_3: s.student_worker_3,
        student_supervisor: s.student_supervisor,
        opened_at: s.opened_at.toISOString(),
        closed_at: s.closed_at ? s.closed_at.toISOString() : null,
        status: s.status,
        opening_cash: Number(s.opening_cash),
        expected_cash: s.expected_cash ? Number(s.expected_cash) : null,
        actual_cash_counted: s.actual_cash_counted ? Number(s.actual_cash_counted) : null,
        cash_variance: s.cash_variance ? Number(s.cash_variance) : null,
        variance_status: s.variance_status,
        expected_qris: s.expected_qris ? Number(s.expected_qris) : null,
        actual_qris_counted: s.actual_qris_counted ? Number(s.actual_qris_counted) : null,
        closing_notes: s.closing_notes,
        teacher_score: s.teacher_score,
        teacher_evaluation_notes: s.teacher_evaluation_notes,
      }));
    }
  } catch {
    // Memory store fallback
  }

  if (pendingList.length === 0) {
    pendingList = (globalStore.__tefa_shifts || []).filter(
      (s) => s.status === "PENDING_VERIFICATION"
    );
  }

  // Lengkapi dengan agregasi transaksi & spoilage
  const enriched = await Promise.all(
    pendingList.map(async (shift) => {
      const shiftTxs = (globalStore.__tefa_transactions || []).filter((t) => t.shift_id === shift.id);
      const paidTxs = shiftTxs.filter((t) => t.status === "PAID");
      const cashSales = paidTxs
        .filter((t) => t.payment_method === "CASH")
        .reduce((sum, t) => sum + t.total_amount, 0);
      const qrisSales = paidTxs
        .filter((t) => t.payment_method === "QRIS")
        .reduce((sum, t) => sum + t.total_amount, 0);

      const spoilageList = await getRecentSpoilageList(shift.id);
      const totalSpoilageLoss = spoilageList.reduce((sum, s) => sum + (s.loss_value || 0), 0);

      return {
        ...shift,
        summary: {
          total_transactions: paidTxs.length,
          cash_sales: cashSales,
          qris_sales: qrisSales,
          spoilage_count: spoilageList.length,
          spoilage_loss: totalSpoilageLoss,
        },
      };
    })
  );

  return enriched;
}

/**
 * Guru Pembimbing mengesahkan laporan tutup shift dan memberikan nilai akademik siswa.
 */
export async function verifyShiftWithEvaluation(
  shiftId: string,
  data: {
    teacher_score: number;
    teacher_evaluation_notes: string;
    verified_by?: string;
  }
) {
  const score = Number(data.teacher_score);
  if (isNaN(score) || score < 0 || score > 100) {
    throw new Error("Skor penilaian tim siswa wajib bernilai antara 0 hingga 100.");
  }

  const notes = String(data.teacher_evaluation_notes || "").trim();
  if (!notes) {
    throw new Error("Catatan evaluasi / berita acara guru wajib diisi.");
  }

  try {
    const dbShift = await prisma.shift.findUnique({
      where: { id: shiftId },
    });

    if (dbShift) {
      if (dbShift.status !== "PENDING_VERIFICATION") {
        throw new Error("Shift ini tidak dalam status menunggu verifikasi.");
      }

      const updated = await prisma.shift.update({
        where: { id: shiftId },
        data: {
          status: "VERIFIED_BY_TEACHER",
          teacher_score: score,
          teacher_evaluation_notes: notes,
          verified_at: new Date(),
          verified_by: data.verified_by || null,
        },
      });

      await recordAuditLog({
        user_id: data.verified_by,
        user_role: "TEACHER",
        shift_id: updated.id,
        action_type: "SHIFT_VERIFIED_BY_TEACHER",
        severity: updated.variance_status === "BALANCE" ? "INFO" : "WARNING",
        entity_name: "Shift",
        entity_id: updated.id,
        old_values: { status: "PENDING_VERIFICATION" },
        new_values: {
          status: "VERIFIED_BY_TEACHER",
          teacher_score: score,
          variance_status: updated.variance_status,
          cash_variance: updated.cash_variance ? Number(updated.cash_variance) : 0,
        },
        description: `Guru Pembimbing memverifikasi Shift #${updated.shift_code} dengan Skor: ${score}/100. Evaluasi: "${notes}"`,
      });

      return updated;
    }
  } catch (err: unknown) {
    if (err instanceof Error && (err.message.includes("Skor") || err.message.includes("Catatan") || err.message.includes("tidak dalam status"))) {
      throw err;
    }
    // Memory store fallback
  }

  const memShift = (globalStore.__tefa_shifts || []).find((s) => s.id === shiftId);
  if (!memShift) {
    throw new Error("Data shift tidak ditemukan.");
  }
  if (memShift.status !== "PENDING_VERIFICATION") {
    throw new Error("Shift ini tidak dalam status menunggu verifikasi.");
  }

  memShift.status = "VERIFIED_BY_TEACHER";
  memShift.teacher_score = score;
  memShift.teacher_evaluation_notes = notes;
  memShift.verified_at = new Date().toISOString();
  memShift.verified_by = data.verified_by || "teacher-1";

  await recordAuditLog({
    user_id: data.verified_by,
    user_role: "TEACHER",
    shift_id: memShift.id,
    action_type: "SHIFT_VERIFIED_BY_TEACHER",
    severity: memShift.variance_status === "BALANCE" ? "INFO" : "WARNING",
    entity_name: "Shift",
    entity_id: memShift.id,
    old_values: { status: "PENDING_VERIFICATION" },
    new_values: {
      status: "VERIFIED_BY_TEACHER",
      teacher_score: score,
      variance_status: memShift.variance_status,
      cash_variance: memShift.cash_variance || 0,
    },
    description: `Guru Pembimbing memverifikasi Shift #${memShift.shift_code} dengan Skor: ${score}/100. Evaluasi: "${notes}"`,
  });

  return memShift;
}

/**
 * Mengambil ringkasan alert & notifikasi live untuk dashboard Guru.
 */
export async function getSupervisorAlerts() {
  const pendingVoids = await getPendingVoidRequests();
  const pendingShifts = await getPendingShifts();

  return {
    pending_void_count: pendingVoids.length,
    pending_voids: pendingVoids,
    pending_shift_count: pendingShifts.length,
    pending_shifts: pendingShifts,
  };
}
