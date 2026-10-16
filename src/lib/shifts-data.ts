import { prisma } from "@/lib/db";

export interface ShiftRecord {
  id: string;
  shift_code: string;
  student_worker_1: string;
  student_worker_2: string;
  student_worker_3: string;
  student_supervisor: string;
  opened_at: string;
  closed_at: string | null;
  status: "OPEN" | "PENDING_VERIFICATION" | "VERIFIED_BY_TEACHER" | "CLOSED_AUDITED";
  opening_cash: number;
  expected_cash: number | null;
  actual_cash_counted: number | null;
  cash_variance: number | null;
  variance_status: "BALANCE" | "MINUS" | "PLUS" | null;
  expected_qris: number | null;
  actual_qris_counted: number | null;
  closing_notes: string | null;
  verified_by?: string | null;
  verified_at?: string | null;
  teacher_score?: number | null;
  teacher_evaluation_notes?: string | null;
  audited_by?: string | null;
  audited_at?: string | null;
}

export interface TransactionItemRecord {
  id: string;
  transaction_id: string;
  product_id: string;
  product_name_snapshot: string;
  item_type_snapshot: "SERVICE" | "GOODS";
  qty: number;
  cost_price_snapshot: number;
  selling_price_snapshot: number;
  subtotal: number;
}

export interface TransactionRecord {
  id: string;
  invoice_number: string;
  shift_id: string;
  device_terminal: "POS_1" | "POS_2";
  subtotal: number;
  total_amount: number;
  total_cost: number;
  payment_method: "CASH" | "QRIS";
  cash_received: number | null;
  cash_change: number | null;
  qris_reference: string | null;
  status: "PAID" | "VOID_REQUESTED" | "VOIDED";
  void_reason?: string | null;
  void_approval_method?: "PIN_ON_SITE" | "DASHBOARD_REMOTE" | null;
  void_approved_by?: string | null;
  void_approved_at?: string | null;
  created_at: string;
  items: TransactionItemRecord[];
}

// In-memory global singleton for fallback if PostgreSQL server is not connected
const globalStore = globalThis as unknown as {
  __tefa_shifts?: ShiftRecord[];
  __tefa_transactions?: TransactionRecord[];
};

if (!globalStore.__tefa_shifts) {
  globalStore.__tefa_shifts = [];
}
if (!globalStore.__tefa_transactions) {
  globalStore.__tefa_transactions = [];
}

export async function getActiveShiftWithSummary() {
  try {
    const dbShift = await prisma.shift.findFirst({
      where: { status: "OPEN" },
      include: { transactions: { include: { items: true } } },
    });

    if (dbShift) {
      const paidTransactions = dbShift.transactions.filter((t) => t.status === "PAID");
      const cashSales = paidTransactions
        .filter((t) => t.payment_method === "CASH")
        .reduce((sum, t) => sum + Number(t.total_amount), 0);
      const qrisSales = paidTransactions
        .filter((t) => t.payment_method === "QRIS")
        .reduce((sum, t) => sum + Number(t.total_amount), 0);

      const openingCash = Number(dbShift.opening_cash);
      const currentCashInDrawer = openingCash + cashSales;

      return {
        shift: {
          id: dbShift.id,
          shift_code: dbShift.shift_code,
          student_worker_1: dbShift.student_worker_1,
          student_worker_2: dbShift.student_worker_2,
          student_worker_3: dbShift.student_worker_3,
          student_supervisor: dbShift.student_supervisor,
          opened_at: dbShift.opened_at.toISOString(),
          closed_at: dbShift.closed_at ? dbShift.closed_at.toISOString() : null,
          status: dbShift.status,
          opening_cash: openingCash,
          expected_cash: dbShift.expected_cash ? Number(dbShift.expected_cash) : null,
          actual_cash_counted: dbShift.actual_cash_counted ? Number(dbShift.actual_cash_counted) : null,
          cash_variance: dbShift.cash_variance ? Number(dbShift.cash_variance) : null,
          variance_status: dbShift.variance_status,
          expected_qris: dbShift.expected_qris ? Number(dbShift.expected_qris) : null,
          actual_qris_counted: dbShift.actual_qris_counted ? Number(dbShift.actual_qris_counted) : null,
          closing_notes: dbShift.closing_notes,
        },
        summary: {
          opening_cash: openingCash,
          total_cash_sales: cashSales,
          total_qris_sales: qrisSales,
          current_cash_in_drawer: currentCashInDrawer,
          total_transactions_count: paidTransactions.length,
        },
      };
    }
  } catch {
    // Database offline, use memory store fallback
  }

  // Memory fallback
  const activeShift = globalStore.__tefa_shifts?.find((s) => s.status === "OPEN");
  if (!activeShift) {
    return null;
  }

  const shiftTransactions = (globalStore.__tefa_transactions || []).filter(
    (t) => t.shift_id === activeShift.id && t.status === "PAID"
  );

  const cashSales = shiftTransactions
    .filter((t) => t.payment_method === "CASH")
    .reduce((sum, t) => sum + t.total_amount, 0);

  const qrisSales = shiftTransactions
    .filter((t) => t.payment_method === "QRIS")
    .reduce((sum, t) => sum + t.total_amount, 0);

  const currentCashInDrawer = activeShift.opening_cash + cashSales;

  return {
    shift: activeShift,
    summary: {
      opening_cash: activeShift.opening_cash,
      total_cash_sales: cashSales,
      total_qris_sales: qrisSales,
      current_cash_in_drawer: currentCashInDrawer,
      total_transactions_count: shiftTransactions.length,
    },
  };
}

export async function openNewShift(data: {
  student_worker_1: string;
  student_worker_2: string;
  student_worker_3: string;
  student_supervisor: string;
  opening_cash: number;
}) {
  const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, "");
  const randomSuffix = Math.floor(Math.random() * 90 + 10);
  const shiftCode = `SHF-${dateStr}-${randomSuffix}`;

  try {
    const existingOpen = await prisma.shift.findFirst({ where: { status: "OPEN" } });
    if (existingOpen) {
      throw new Error(`Sudah ada shift yang aktif (#${existingOpen.shift_code}). Tutup shift terlebih dahulu.`);
    }

    const created = await prisma.shift.create({
      data: {
        shift_code: shiftCode,
        student_worker_1: data.student_worker_1,
        student_worker_2: data.student_worker_2,
        student_worker_3: data.student_worker_3,
        student_supervisor: data.student_supervisor,
        opening_cash: data.opening_cash,
        status: "OPEN",
      },
    });

    return {
      id: created.id,
      shift_code: created.shift_code,
      student_worker_1: created.student_worker_1,
      student_worker_2: created.student_worker_2,
      student_worker_3: created.student_worker_3,
      student_supervisor: created.student_supervisor,
      opened_at: created.opened_at.toISOString(),
      closed_at: null,
      status: created.status,
      opening_cash: Number(created.opening_cash),
      expected_cash: null,
      actual_cash_counted: null,
      cash_variance: null,
      variance_status: null,
      expected_qris: null,
      actual_qris_counted: null,
      closing_notes: null,
    } as ShiftRecord;
  } catch (err: unknown) {
    if (err instanceof Error && err.message.includes("Sudah ada shift")) {
      throw err;
    }
    // Fallback to memory store
  }

  // Check in-memory store
  const existingOpen = globalStore.__tefa_shifts?.find((s) => s.status === "OPEN");
  if (existingOpen) {
    throw new Error(`Sudah ada shift yang aktif (#${existingOpen.shift_code}). Tutup shift terlebih dahulu.`);
  }

  const newShift: ShiftRecord = {
    id: `shift-${Date.now()}`,
    shift_code: shiftCode,
    student_worker_1: data.student_worker_1,
    student_worker_2: data.student_worker_2,
    student_worker_3: data.student_worker_3,
    student_supervisor: data.student_supervisor,
    opened_at: new Date().toISOString(),
    closed_at: null,
    status: "OPEN",
    opening_cash: data.opening_cash,
    expected_cash: null,
    actual_cash_counted: null,
    cash_variance: null,
    variance_status: null,
    expected_qris: null,
    actual_qris_counted: null,
    closing_notes: null,
  };

  globalStore.__tefa_shifts?.push(newShift);
  return newShift;
}

export async function closeActiveShift(
  shiftId: string,
  data: {
    actual_cash_counted: number;
    actual_qris_counted?: number;
    closing_notes?: string;
  }
) {
  // Hitung summary sebelum ditutup
  const activeData = await getActiveShiftWithSummary();
  if (!activeData || activeData.shift.id !== shiftId) {
    throw new Error("Shift aktif tidak ditemukan atau ID tidak cocok.");
  }

  const expectedCash = activeData.summary.current_cash_in_drawer;
  const cashVariance = data.actual_cash_counted - expectedCash;
  let varianceStatus: "BALANCE" | "MINUS" | "PLUS" = "BALANCE";
  if (cashVariance < 0) varianceStatus = "MINUS";
  if (cashVariance > 0) varianceStatus = "PLUS";

  const expectedQris = activeData.summary.total_qris_sales;

  try {
    const updated = await prisma.shift.update({
      where: { id: shiftId },
      data: {
        status: "PENDING_VERIFICATION",
        closed_at: new Date(),
        expected_cash: expectedCash,
        actual_cash_counted: data.actual_cash_counted,
        cash_variance: cashVariance,
        variance_status: varianceStatus,
        expected_qris: expectedQris,
        actual_qris_counted: data.actual_qris_counted ?? expectedQris,
        closing_notes: data.closing_notes || null,
      },
    });

    return {
      ...activeData.shift,
      status: updated.status,
      closed_at: updated.closed_at?.toISOString() || null,
      expected_cash: expectedCash,
      actual_cash_counted: data.actual_cash_counted,
      cash_variance: cashVariance,
      variance_status: varianceStatus,
      expected_qris: expectedQris,
      actual_qris_counted: data.actual_qris_counted ?? expectedQris,
      closing_notes: data.closing_notes || null,
    };
  } catch {
    // Memory store fallback
  }

  const shiftIndex = (globalStore.__tefa_shifts || []).findIndex((s) => s.id === shiftId);
  if (shiftIndex > -1 && globalStore.__tefa_shifts) {
    const s = globalStore.__tefa_shifts[shiftIndex];
    s.status = "PENDING_VERIFICATION";
    s.closed_at = new Date().toISOString();
    s.expected_cash = expectedCash;
    s.actual_cash_counted = data.actual_cash_counted;
    s.cash_variance = cashVariance;
    s.variance_status = varianceStatus;
    s.expected_qris = expectedQris;
    s.actual_qris_counted = data.actual_qris_counted ?? expectedQris;
    s.closing_notes = data.closing_notes || null;
    return s;
  }

  throw new Error("Gagal memperbarui shift.");
}

export async function createNewTransaction(data: {
  shift_id: string;
  device_terminal: "POS_1" | "POS_2";
  items: Array<{
    product_id: string;
    product_name_snapshot: string;
    item_type_snapshot: "SERVICE" | "GOODS";
    qty: number;
    cost_price_snapshot: number;
    selling_price_snapshot: number;
    subtotal: number;
  }>;
  payment_method: "CASH" | "QRIS";
  cash_received?: number;
  cash_change?: number;
  qris_reference?: string;
}) {
  const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, "");
  const randomInv = Math.floor(Math.random() * 9000 + 1000);
  const invoiceNumber = `INV-${dateStr}-${randomInv}`;

  const subtotal = data.items.reduce((sum, item) => sum + item.subtotal, 0);
  const totalAmount = subtotal;
  const totalCost = data.items.reduce((sum, item) => sum + item.cost_price_snapshot * item.qty, 0);

  try {
    const created = await prisma.transaction.create({
      data: {
        invoice_number: invoiceNumber,
        shift_id: data.shift_id,
        device_terminal: data.device_terminal,
        subtotal,
        total_amount: totalAmount,
        total_cost: totalCost,
        payment_method: data.payment_method,
        cash_received: data.cash_received ?? null,
        cash_change: data.cash_change ?? null,
        qris_reference: data.qris_reference || (data.payment_method === "QRIS" ? "QRIS-STATIS-VERIFIED" : null),
        status: "PAID",
        items: {
          create: data.items.map((item) => ({
            product_id: item.product_id,
            product_name_snapshot: item.product_name_snapshot,
            item_type_snapshot: item.item_type_snapshot,
            qty: item.qty,
            cost_price_snapshot: item.cost_price_snapshot,
            selling_price_snapshot: item.selling_price_snapshot,
            subtotal: item.subtotal,
          })),
        },
      },
      include: { items: true },
    });

    return {
      id: created.id,
      invoice_number: created.invoice_number,
      shift_id: created.shift_id,
      device_terminal: created.device_terminal,
      subtotal: Number(created.subtotal),
      total_amount: Number(created.total_amount),
      total_cost: Number(created.total_cost),
      payment_method: created.payment_method,
      cash_received: created.cash_received ? Number(created.cash_received) : null,
      cash_change: created.cash_change ? Number(created.cash_change) : null,
      qris_reference: created.qris_reference,
      status: created.status,
      created_at: created.created_at.toISOString(),
      items: created.items.map((i) => ({
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
    } as TransactionRecord;
  } catch {
    // Memory store fallback
  }

  const transactionRecord: TransactionRecord = {
    id: `tx-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    invoice_number: invoiceNumber,
    shift_id: data.shift_id,
    device_terminal: data.device_terminal,
    subtotal,
    total_amount: totalAmount,
    total_cost: totalCost,
    payment_method: data.payment_method,
    cash_received: data.cash_received ?? null,
    cash_change: data.cash_change ?? null,
    qris_reference: data.qris_reference || (data.payment_method === "QRIS" ? "QRIS-STATIS-VERIFIED" : null),
    status: "PAID",
    created_at: new Date().toISOString(),
    items: data.items.map((item, idx) => ({
      id: `txi-${Date.now()}-${idx}`,
      transaction_id: `tx-${Date.now()}`,
      product_id: item.product_id,
      product_name_snapshot: item.product_name_snapshot,
      item_type_snapshot: item.item_type_snapshot,
      qty: item.qty,
      cost_price_snapshot: item.cost_price_snapshot,
      selling_price_snapshot: item.selling_price_snapshot,
      subtotal: item.subtotal,
    })),
  };

  globalStore.__tefa_transactions?.unshift(transactionRecord);
  return transactionRecord;
}

export async function getTransactionsByShift(shiftId: string) {
  try {
    const list = await prisma.transaction.findMany({
      where: { shift_id: shiftId },
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
      })) as TransactionRecord[];
    }
  } catch {
    // Memory fallback
  }

  return (globalStore.__tefa_transactions || []).filter((t) => t.shift_id === shiftId);
}

export async function getAllRecentTransactions(limit = 50) {
  try {
    const list = await prisma.transaction.findMany({
      take: limit,
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
      })) as TransactionRecord[];
    }
  } catch {
    // Memory fallback
  }

  return (globalStore.__tefa_transactions || []).slice(0, limit);
}
