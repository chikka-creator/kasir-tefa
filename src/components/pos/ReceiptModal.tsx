"use client";

import React, { useRef } from "react";
import { X, Printer, CheckCircle } from "lucide-react";
import { TransactionRecord } from "@/lib/shifts-data";

interface ReceiptModalProps {
  isOpen: boolean;
  onClose: () => void;
  transaction: TransactionRecord | null;
  shiftInfo?: {
    student_worker_1: string;
    student_worker_2: string;
    student_worker_3: string;
    student_supervisor: string;
  } | null;
}

export function ReceiptModal({
  isOpen,
  onClose,
  transaction,
  shiftInfo,
}: ReceiptModalProps) {
  const receiptRef = useRef<HTMLDivElement>(null);

  if (!isOpen || !transaction) return null;

  const handlePrint = () => {
    const receiptElement = receiptRef.current;
    if (!receiptElement) {
      window.print();
      return;
    }

    // Buat iframe tersembunyi agar dokumen yang dicetak HANYA struk ini saja (tidak men-spit halaman kosong)
    const printFrame = document.createElement("iframe");
    printFrame.style.position = "fixed";
    printFrame.style.right = "0";
    printFrame.style.bottom = "0";
    printFrame.style.width = "0";
    printFrame.style.height = "0";
    printFrame.style.border = "none";
    document.body.appendChild(printFrame);

    const frameDoc = printFrame.contentWindow?.document;
    if (!frameDoc) {
      window.print();
      return;
    }

    const htmlContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Struk_${transaction.invoice_number}</title>
          <style>
            @page {
              size: 58mm auto;
              margin: 0mm !important;
            }
            html, body {
              width: 58mm !important;
              max-width: 58mm !important;
              margin: 0 !important;
              padding: 0 !important;
              background: #fff !important;
              color: #000 !important;
              font-family: 'Courier New', Courier, monospace !important;
              font-size: 11px !important;
              line-height: 1.25 !important;
              -webkit-print-color-adjust: exact;
              print-color-adjust: exact;
            }
            * {
              box-sizing: border-box;
              margin: 0;
              padding: 0;
            }
            .thermal-container {
              width: 54mm;
              margin: 0 auto;
              padding: 2mm 1mm;
              page-break-inside: avoid;
              page-break-after: avoid;
              break-inside: avoid;
              break-after: avoid;
            }
            .text-center { text-align: center; }
            .text-right { text-align: right; }
            .truncate {
              white-space: nowrap;
              overflow: hidden;
              text-overflow: ellipsis;
            }
            .flex { display: flex; }
            .justify-between { justify-content: space-between; }
            .border-dashed { border-style: dashed; }
            .border-t { border-top: 1px dashed #000; }
            .border-b { border-bottom: 1px dashed #000; }
            .my-1 { margin-top: 2px; margin-bottom: 2px; }
            .my-2 { margin-top: 5px; margin-bottom: 5px; }
            .my-3 { margin-top: 8px; margin-bottom: 8px; }
            .py-0\\.5 { padding-top: 2px; padding-bottom: 2px; }
            .py-1 { padding-top: 3px; padding-bottom: 3px; }
            .font-bold { font-weight: bold; }
            .font-semibold { font-weight: 600; }
            .text-xs { font-size: 12px; }
            .text-\\[10px\\] { font-size: 10px; }
            .text-\\[9px\\] { font-size: 9px; }
            .text-\\[8px\\] { font-size: 8px; }
            .space-y-0\\.5 > * + * { margin-top: 2px; }
            .space-y-1 > * + * { margin-top: 4px; }
            .space-y-1\\.5 > * + * { margin-top: 5px; }
          </style>
        </head>
        <body>
          <div class="thermal-container">
            ${receiptElement.innerHTML}
          </div>
          <script>
            window.onload = function() {
              window.focus();
              window.print();
              setTimeout(function() {
                try {
                  window.parent.document.body.removeChild(window.frameElement);
                } catch(e) {}
              }, 1500);
            };
          </script>
        </body>
      </html>
    `;

    frameDoc.open();
    frameDoc.write(htmlContent);
    frameDoc.close();
  };

  const formattedDate = new Date(transaction.created_at).toLocaleString("id-ID", {
    dateStyle: "short",
    timeStyle: "short",
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="w-full max-w-sm rounded-xl border border-subtle bg-white shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header Modal (Hidden on Print) */}
        <div className="print:hidden flex items-center justify-between border-b border-subtle px-4 py-3 bg-neutral-50">
          <div className="flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-emerald-600" />
            <h3 className="text-xs font-bold text-ink">Transaksi Berhasil</h3>
          </div>
          <button
            onClick={onClose}
            className="rounded p-1 text-ink-muted hover:bg-neutral-200 hover:text-ink"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Receipt Content Area */}
        <div className="overflow-y-auto p-4 flex justify-center bg-neutral-100 print:bg-white print:p-0">
          {/* Printable Receipt Paper Container */}
          <div
            ref={receiptRef}
            id="printable-receipt"
            className="w-[300px] bg-white p-4 font-mono text-[11px] leading-relaxed text-black shadow-md border border-neutral-200 print:border-none print:shadow-none print:p-0 print:w-full"
          >
            {/* Header */}
            <div className="text-center">
              <div className="text-xs font-bold tracking-wider">TEFA PERCETAKAN SMK</div>
              <div className="text-[10px]">Unit Produksi & Bisnis Siswa</div>
              <div className="text-[9px] text-neutral-600">SMK Negeri Pusat Keunggulan</div>
              <div className="my-1.5 border-t border-b border-dashed border-black py-0.5 text-[10px]">
                STRUK PENJUALAN
              </div>
            </div>

            {/* Metadata */}
            <div className="space-y-0.5 text-[10px] my-2">
              <div className="flex justify-between">
                <span>No Struk :</span>
                <span className="font-bold">{transaction.invoice_number}</span>
              </div>
              <div className="flex justify-between">
                <span>Tanggal  :</span>
                <span>{formattedDate} WIB</span>
              </div>
              <div className="flex justify-between">
                <span>Terminal :</span>
                <span>
                  {transaction.device_terminal === "POS_1" ? "Perangkat Kasir 1" : "Perangkat Kasir 2"}
                </span>
              </div>
              {shiftInfo && (
                <>
                  <div className="flex justify-between">
                    <span>Tim Jaga :</span>
                    <span className="text-right truncate max-w-[170px]">
                      {shiftInfo.student_worker_1}, {shiftInfo.student_worker_2}, {shiftInfo.student_worker_3}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Pengawas :</span>
                    <span>{shiftInfo.student_supervisor}</span>
                  </div>
                </>
              )}
            </div>

            <div className="border-t border-dashed border-black my-2"></div>

            {/* Items */}
            <div className="space-y-1.5 my-2">
              {transaction.items.map((item, idx) => (
                <div key={idx} className="text-[10px]">
                  <div className="font-bold truncate">{item.product_name_snapshot}</div>
                  <div className="flex justify-between">
                    <span>
                      {item.qty} x {item.selling_price_snapshot.toLocaleString("id-ID")}
                    </span>
                    <span className="tabular-nums font-semibold">
                      Rp {item.subtotal.toLocaleString("id-ID")}
                    </span>
                  </div>
                </div>
              ))}
            </div>

            <div className="border-t border-dashed border-black my-2"></div>

            {/* Totals */}
            <div className="space-y-1 text-[10px]">
              <div className="flex justify-between font-bold text-xs pt-0.5">
                <span>TOTAL TAGIHAN</span>
                <span className="tabular-nums">
                  Rp {transaction.total_amount.toLocaleString("id-ID")}
                </span>
              </div>
              <div className="flex justify-between text-neutral-800">
                <span>Metode Bayar :</span>
                <span className="font-bold">{transaction.payment_method}</span>
              </div>

              {transaction.payment_method === "CASH" && (
                <>
                  <div className="flex justify-between">
                    <span>Bayar (CASH)   :</span>
                    <span className="tabular-nums">
                      Rp {(transaction.cash_received ?? 0).toLocaleString("id-ID")}
                    </span>
                  </div>
                  <div className="flex justify-between font-bold">
                    <span>Kembalian      :</span>
                    <span className="tabular-nums">
                      Rp {(transaction.cash_change ?? 0).toLocaleString("id-ID")}
                    </span>
                  </div>
                </>
              )}

              {transaction.payment_method === "QRIS" && (
                <div className="flex justify-between text-[9px] text-neutral-600">
                  <span>Status QRIS   :</span>
                  <span className="font-semibold text-emerald-700">LUNAS / TERVERIFIKASI</span>
                </div>
              )}
            </div>

            <div className="border-t border-b border-dashed border-black my-3 py-1 text-center text-[9px]">
              <div>Terima Kasih Atas Kunjungan Anda</div>
              <div>Simpan Struk Ini Sebagai Bukti Pembayaran</div>
            </div>
          </div>
        </div>

        {/* Footer Actions (Hidden on Print) */}
        <div className="print:hidden flex items-center justify-between gap-2 border-t border-subtle p-3 bg-white">
          <button
            onClick={onClose}
            className="flex-1 py-2 px-3 rounded-lg border border-subtle text-xs font-semibold text-ink hover:bg-neutral-100 transition-colors"
          >
            Selesai (Tutup)
          </button>
          <button
            onClick={handlePrint}
            className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold shadow-sm transition-colors"
          >
            <Printer className="w-4 h-4" />
            <span>Cetak Struk (Print)</span>
          </button>
        </div>
      </div>

      {/* Global CSS for @media print thermal receipt sizing */}
      <style jsx global>{`
        @media print {
          @page {
            size: 58mm auto;
            margin: 0mm !important;
          }
          html, body {
            margin: 0 !important;
            padding: 0 !important;
            width: 58mm !important;
            max-width: 58mm !important;
            height: auto !important;
            background: #fff !important;
            overflow: hidden !important;
          }
          body * {
            visibility: hidden;
          }
          #printable-receipt,
          #printable-receipt * {
            visibility: visible;
          }
          #printable-receipt {
            position: absolute;
            left: 0;
            top: 0;
            width: 54mm !important;
            max-width: 54mm !important;
            margin: 0 auto !important;
            padding: 2mm 1mm !important;
            color: #000 !important;
            background: #fff !important;
            box-shadow: none !important;
            border: none !important;
            font-family: "Courier New", Courier, monospace !important;
            font-size: 10px !important;
            line-height: 1.25 !important;
            page-break-after: avoid !important;
            page-break-inside: avoid !important;
            break-after: avoid !important;
            break-inside: avoid !important;
          }
        }
      `}</style>
    </div>
  );
}
