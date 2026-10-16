import { prisma } from "@/lib/db";
import bcrypt from "bcryptjs";
import { recordAuditLog } from "@/lib/audit-logger";
import { ShiftRecord, TransactionRecord } from "@/lib/shifts-data";
import { StockMovementRecord } from "@/lib/inventory-data";

export interface UserRecord {
  id: string;
  username: string;
  full_name: string;
  role: "ADMIN" | "TEACHER" | "AUDIT";
  is_active: boolean;
  supervisor_pin_hash?: string | null;
  password_hash?: string;
  created_at: string;
}

// In-memory global store references
const globalStore = globalThis as unknown as {
  __tefa_shifts?: ShiftRecord[];
  __tefa_transactions?: TransactionRecord[];
  __tefa_stock_movements?: StockMovementRecord[];
  __tefa_users?: UserRecord[];
};

if (!globalStore.__tefa_users) {
  globalStore.__tefa_users = [
    {
      id: "00000000-0000-0000-0000-000000000001",
      username: "kasir_tefa",
      full_name: "Admin Kasir Siswa (Shared POS 1 & 2)",
      role: "ADMIN",
      is_active: true,
      created_at: "2026-10-01T08:00:00Z",
    },
    {
      id: "00000000-0000-0000-0000-000000000002",
      username: "guru_tefa",
      full_name: "Pak Pembimbing TeFa",
      role: "TEACHER",
      is_active: true,
      supervisor_pin_hash: "123456",
      created_at: "2026-10-01T08:00:00Z",
    },
    {
      id: "00000000-0000-0000-0000-000000000003",
      username: "audit_sekolah",
      full_name: "Kepala Unit & Tim Audit",
      role: "AUDIT",
      is_active: true,
      created_at: "2026-10-01T08:00:00Z",
    },
  ];
}

/**
 * Mengkalkulasi seluruh metrik finansial eksekutif TeFa:
 * Gross Revenue, Total HPP, Total Spoilage Loss, Net Profit, dan Akurasi Kas.
 */
export async function getFinancialAnalytics() {
  let transactions: TransactionRecord[] = [];
  let shifts: ShiftRecord[] = [];
  let spoilageMovements: StockMovementRecord[] = [];

  try {
    const dbTxs = await prisma.transaction.findMany({
      include: { items: true },
    });
    if (dbTxs && dbTxs.length > 0) {
      transactions = dbTxs.map((t) => ({
        id: t.id,
        invoice_number: t.invoice_number,
        shift_id: t.shift_id,
        device_terminal: t.device_terminal,
        subtotal: Number(t.subtotal),
        total_amount: Number(t.total_amount),
        total_cost: Number(t.total_cost),
        payment_method: t.payment_method,
        cash_received: t.cash_received ? Number(t.cash_received) : null,
        cash_change: t.cash_change ? Number(t.cash_change) : null,
        qris_reference: t.qris_reference,
        status: t.status,
        created_at: t.created_at.toISOString(),
        items: t.items.map((i) => ({
          id: i.id,
          transaction_id: i.transaction_id,
          product_id: i.product_id,
          product_name_snapshot: i.product_name_snapshot,
          item_type_snapshot: i.item_type_snapshot as "SERVICE" | "GOODS",
          qty: i.qty,
          cost_price_snapshot: Number(i.cost_price_snapshot),
          selling_price_snapshot: Number(i.selling_price_snapshot),
          subtotal: Number(i.subtotal),
        })),
      }));
    }

    const dbShifts = await prisma.shift.findMany();
    if (dbShifts && dbShifts.length > 0) {
      shifts = dbShifts.map((s) => ({
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

    const dbSpoilage = await prisma.stockMovement.findMany({
      where: { movement_type: "SPOILAGE_DAMAGE" },
      include: { product: true },
    });
    if (dbSpoilage && dbSpoilage.length > 0) {
      spoilageMovements = dbSpoilage.map((m) => {
        const costPrice = Number(m.product.cost_price);
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
          loss_value: Math.abs(m.qty_change) * costPrice,
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

  if (transactions.length === 0) {
    transactions = globalStore.__tefa_transactions || [];
  }
  if (shifts.length === 0) {
    shifts = globalStore.__tefa_shifts || [];
  }
  if (spoilageMovements.length === 0) {
    spoilageMovements = (globalStore.__tefa_stock_movements || []).filter(
      (m) => m.movement_type === "SPOILAGE_DAMAGE"
    );
  }

  // Hanya transaksi PAID yang dihitung (VOIDED dikecualikan)
  const paidTransactions = transactions.filter((t) => t.status === "PAID");

  const grossRevenue = paidTransactions.reduce((sum, t) => sum + t.total_amount, 0);
  const totalCogs = paidTransactions.reduce((sum, t) => sum + t.total_cost, 0);
  const totalSpoilageLoss = spoilageMovements.reduce(
    (sum, m) => sum + (m.loss_value || Math.abs(m.qty_change) * m.cost_price_snapshot),
    0
  );

  const netProfit = grossRevenue - totalCogs - totalSpoilageLoss;

  // Breakdown Metode Pembayaran
  const cashTxs = paidTransactions.filter((t) => t.payment_method === "CASH");
  const qrisTxs = paidTransactions.filter((t) => t.payment_method === "QRIS");

  const cashTotal = cashTxs.reduce((sum, t) => sum + t.total_amount, 0);
  const qrisTotal = qrisTxs.reduce((sum, t) => sum + t.total_amount, 0);

  // Breakdown Terminal Kasir
  const pos1Txs = paidTransactions.filter((t) => t.device_terminal === "POS_1");
  const pos2Txs = paidTransactions.filter((t) => t.device_terminal === "POS_2");

  const pos1Total = pos1Txs.reduce((sum, t) => sum + t.total_amount, 0);
  const pos2Total = pos2Txs.reduce((sum, t) => sum + t.total_amount, 0);

  // Kesehatan Kas Fisik Laci
  const closedShifts = shifts.filter((s) => s.status !== "OPEN");
  const balanceShifts = closedShifts.filter((s) => s.variance_status === "BALANCE");
  const cashAccuracyRate =
    closedShifts.length > 0
      ? Math.round((balanceShifts.length / closedShifts.length) * 100)
      : 100;
  const netVariance = closedShifts.reduce((sum, s) => sum + (s.cash_variance || 0), 0);

  // Kategori Produk Breakdown
  const categoryMap: Record<string, { revenue: number; count: number }> = {};
  paidTransactions.forEach((t) => {
    t.items.forEach((item) => {
      const key = item.item_type_snapshot === "SERVICE" ? "Layanan Jasa Cetak" : "Barang Fisik / ATK";
      if (!categoryMap[key]) categoryMap[key] = { revenue: 0, count: 0 };
      categoryMap[key].revenue += item.subtotal;
      categoryMap[key].count += item.qty;
    });
  });

  return {
    kpi: {
      gross_revenue: grossRevenue,
      total_cogs: totalCogs,
      total_spoilage_loss: totalSpoilageLoss,
      net_profit: netProfit,
      total_transactions: paidTransactions.length,
      cash_accuracy_rate: cashAccuracyRate,
      net_variance: netVariance,
      total_shifts_closed: closedShifts.length,
    },
    payment_breakdown: {
      cash: { amount: cashTotal, count: cashTxs.length },
      qris: { amount: qrisTotal, count: qrisTxs.length },
    },
    terminal_breakdown: {
      pos_1: { amount: pos1Total, count: pos1Txs.length },
      pos_2: { amount: pos2Total, count: pos2Txs.length },
    },
    category_breakdown: Object.entries(categoryMap).map(([category, val]) => ({
      category,
      revenue: val.revenue,
      item_count: val.count,
    })),
  };
}

/**
 * Mengambil daftar shift yang siap difinalisasi oleh Audit (status VERIFIED_BY_TEACHER).
 */
export async function getVerifiedShiftsForAudit() {
  let list: ShiftRecord[] = [];

  try {
    const dbList = await prisma.shift.findMany({
      where: { status: "VERIFIED_BY_TEACHER" },
      orderBy: { closed_at: "desc" },
    });
    if (dbList && dbList.length > 0) {
      list = dbList.map((s) => ({
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

  if (list.length === 0) {
    list = (globalStore.__tefa_shifts || []).filter(
      (s) => s.status === "VERIFIED_BY_TEACHER"
    );
  }

  return list;
}

/**
 * Mengambil daftar seluruh shift yang telah berstatus CLOSED_AUDITED (Buku Terkunci).
 */
export async function getAuditedShiftsList() {
  let list: ShiftRecord[] = [];

  try {
    const dbList = await prisma.shift.findMany({
      where: { status: "CLOSED_AUDITED" },
      orderBy: { closed_at: "desc" },
    });
    if (dbList && dbList.length > 0) {
      list = dbList.map((s) => ({
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
        audited_at: s.audited_at ? s.audited_at.toISOString() : null,
        audited_by: s.audited_by,
      }));
    }
  } catch {
    // Memory store fallback
  }

  if (list.length === 0) {
    list = (globalStore.__tefa_shifts || []).filter(
      (s) => s.status === "CLOSED_AUDITED"
    );
  }

  return list;
}

/**
 * Finalisasi tutup buku shift oleh Role Audit (VERIFIED_BY_TEACHER -> CLOSED_AUDITED).
 */
export async function finalizeAuditShift(shiftId: string, auditorId?: string) {
  try {
    const dbShift = await prisma.shift.findUnique({
      where: { id: shiftId },
    });

    if (dbShift) {
      if (dbShift.status !== "VERIFIED_BY_TEACHER") {
        throw new Error("Shift ini belum diverifikasi oleh Guru Pembimbing.");
      }

      const updated = await prisma.shift.update({
        where: { id: shiftId },
        data: {
          status: "CLOSED_AUDITED",
          audited_at: new Date(),
          audited_by: auditorId || null,
        },
      });

      await recordAuditLog({
        user_id: auditorId,
        user_role: "AUDIT",
        shift_id: updated.id,
        action_type: "SHIFT_AUDITED",
        severity: "INFO",
        entity_name: "Shift",
        entity_id: updated.id,
        old_values: { status: "VERIFIED_BY_TEACHER" },
        new_values: { status: "CLOSED_AUDITED", audited_at: new Date().toISOString() },
        description: `Role Audit mengesahkan dan mengunci pembukuan Shift #${updated.shift_code} (Status: CLOSED_AUDITED).`,
      });

      return updated;
    }
  } catch (err: unknown) {
    if (err instanceof Error && err.message.includes("belum diverifikasi")) {
      throw err;
    }
    // Memory store fallback
  }

  const memShift = (globalStore.__tefa_shifts || []).find((s) => s.id === shiftId);
  if (!memShift) {
    throw new Error("Shift tidak ditemukan.");
  }
  if (memShift.status !== "VERIFIED_BY_TEACHER") {
    throw new Error("Shift ini belum diverifikasi oleh Guru Pembimbing.");
  }

  memShift.status = "CLOSED_AUDITED";
  memShift.audited_at = new Date().toISOString();
  memShift.audited_by = auditorId || "audit-1";

  await recordAuditLog({
    user_id: auditorId,
    user_role: "AUDIT",
    shift_id: memShift.id,
    action_type: "SHIFT_AUDITED",
    severity: "INFO",
    entity_name: "Shift",
    entity_id: memShift.id,
    old_values: { status: "VERIFIED_BY_TEACHER" },
    new_values: { status: "CLOSED_AUDITED", audited_at: new Date().toISOString() },
    description: `Role Audit mengesahkan dan mengunci pembukuan Shift #${memShift.shift_code} (Status: CLOSED_AUDITED).`,
  });

  return memShift;
}

/**
 * Mengambil daftar seluruh pengguna sistem untuk panel User Management.
 */
export async function getSystemUsers() {
  try {
    const list = await prisma.user.findMany({
      orderBy: { created_at: "asc" },
    });

    if (list && list.length > 0) {
      return list.map((u) => ({
        id: u.id,
        username: u.username,
        full_name: u.full_name,
        role: u.role,
        is_active: u.is_active,
        has_pin: !!u.supervisor_pin_hash,
        created_at: u.created_at.toISOString(),
      }));
    }
  } catch {
    // Memory store fallback
  }

  return (globalStore.__tefa_users || []).map((u) => ({
    id: u.id,
    username: u.username,
    full_name: u.full_name,
    role: u.role,
    is_active: u.is_active,
    has_pin: !!u.supervisor_pin_hash,
    created_at: u.created_at,
  }));
}

/**
 * Menambahkan akun pengguna baru ke sistem.
 */
export async function createSystemUser(data: {
  username: string;
  full_name: string;
  role: "ADMIN" | "TEACHER" | "AUDIT";
  password: string;
  supervisor_pin?: string;
  creatorId?: string;
}) {
  const normalizedUsername = data.username.trim().toLowerCase();
  if (normalizedUsername.length < 3) {
    throw new Error("Username minimal 3 karakter.");
  }
  if (!data.full_name || data.full_name.trim().length < 2) {
    throw new Error("Nama lengkap wajib diisi.");
  }
  if (!data.password || data.password.length < 4) {
    throw new Error("Password minimal 4 karakter.");
  }

  const passwordHash = await bcrypt.hash(data.password, 10);
  let pinHash: string | null = null;
  if (data.role === "TEACHER" && data.supervisor_pin) {
    pinHash = await bcrypt.hash(data.supervisor_pin, 10);
  }

  try {
    const existing = await prisma.user.findUnique({
      where: { username: normalizedUsername },
    });
    if (existing) {
      throw new Error(`Username '${normalizedUsername}' sudah digunakan.`);
    }

    const created = await prisma.user.create({
      data: {
        username: normalizedUsername,
        full_name: data.full_name.trim(),
        role: data.role,
        password_hash: passwordHash,
        supervisor_pin_hash: pinHash,
        is_active: true,
      },
    });

    await recordAuditLog({
      user_id: data.creatorId,
      user_role: "AUDIT",
      action_type: "USER_CREATE",
      severity: "INFO",
      entity_name: "User",
      entity_id: created.id,
      description: `Membuat akun pengguna baru '${created.username}' dengan role ${created.role}.`,
    });

    return {
      id: created.id,
      username: created.username,
      full_name: created.full_name,
      role: created.role,
      is_active: created.is_active,
    };
  } catch (err: unknown) {
    if (err instanceof Error && err.message.includes("sudah digunakan")) {
      throw err;
    }
    // Memory store fallback
  }

  const existingMem = (globalStore.__tefa_users || []).find((u) => u.username === normalizedUsername);
  if (existingMem) {
    throw new Error(`Username '${normalizedUsername}' sudah digunakan.`);
  }

  const newUser: UserRecord = {
    id: `user-${Date.now()}`,
    username: normalizedUsername,
    full_name: data.full_name.trim(),
    role: data.role,
    is_active: true,
    supervisor_pin_hash: data.supervisor_pin || null,
    created_at: new Date().toISOString(),
  };

  globalStore.__tefa_users?.push(newUser);

  await recordAuditLog({
    user_id: data.creatorId,
    user_role: "AUDIT",
    action_type: "USER_CREATE",
    severity: "INFO",
    entity_name: "User",
    entity_id: newUser.id,
    description: `Membuat akun pengguna baru '${newUser.username}' dengan role ${newUser.role}.`,
  });

  return {
    id: newUser.id,
    username: newUser.username,
    full_name: newUser.full_name,
    role: newUser.role,
    is_active: newUser.is_active,
  };
}

/**
 * Mengubah status aktif/non-aktif akun pengguna.
 */
export async function toggleUserActiveStatus(userId: string, currentUserId?: string) {
  try {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (user) {
      const updated = await prisma.user.update({
        where: { id: userId },
        data: { is_active: !user.is_active },
      });

      await recordAuditLog({
        user_id: currentUserId,
        user_role: "AUDIT",
        action_type: "USER_STATUS_CHANGE",
        severity: "WARNING",
        entity_name: "User",
        entity_id: user.id,
        old_values: { is_active: user.is_active },
        new_values: { is_active: updated.is_active },
        description: `Mengubah status akun '${user.username}' menjadi ${updated.is_active ? "AKTIF" : "NON-AKTIF"}.`,
      });

      return updated;
    }
  } catch {
    // Memory store fallback
  }

  const memUser = (globalStore.__tefa_users || []).find((u) => u.id === userId);
  if (!memUser) throw new Error("Pengguna tidak ditemukan.");

  const oldStatus = memUser.is_active;
  memUser.is_active = !memUser.is_active;

  await recordAuditLog({
    user_id: currentUserId,
    user_role: "AUDIT",
    action_type: "USER_STATUS_CHANGE",
    severity: "WARNING",
    entity_name: "User",
    entity_id: memUser.id,
    old_values: { is_active: oldStatus },
    new_values: { is_active: memUser.is_active },
    description: `Mengubah status akun '${memUser.username}' menjadi ${memUser.is_active ? "AKTIF" : "NON-AKTIF"}.`,
  });

  return memUser;
}

/**
 * Mereset password atau supervisor PIN pengguna.
 */
export async function resetUserCredentials(
  userId: string,
  data: { new_password?: string; new_pin?: string },
  currentUserId?: string
) {
  try {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (user) {
      const updateData: Record<string, string> = {};
      if (data.new_password) {
        updateData.password_hash = await bcrypt.hash(data.new_password, 10);
      }
      if (data.new_pin) {
        updateData.supervisor_pin_hash = await bcrypt.hash(data.new_pin, 10);
      }

      await prisma.user.update({
        where: { id: userId },
        data: updateData,
      });

      await recordAuditLog({
        user_id: currentUserId,
        user_role: "AUDIT",
        action_type: "USER_PASSWORD_RESET",
        severity: "WARNING",
        entity_name: "User",
        entity_id: user.id,
        description: `Mereset password/PIN untuk akun '${user.username}'.`,
      });

      return { success: true };
    }
  } catch {
    // Memory store fallback
  }

  const memUser = (globalStore.__tefa_users || []).find((u) => u.id === userId);
  if (!memUser) throw new Error("Pengguna tidak ditemukan.");

  if (data.new_pin) {
    memUser.supervisor_pin_hash = data.new_pin;
  }

  await recordAuditLog({
    user_id: currentUserId,
    user_role: "AUDIT",
    action_type: "USER_PASSWORD_RESET",
    severity: "WARNING",
    entity_name: "User",
    entity_id: memUser.id,
    description: `Mereset password/PIN untuk akun '${memUser.username}'.`,
  });

  return { success: true };
}
