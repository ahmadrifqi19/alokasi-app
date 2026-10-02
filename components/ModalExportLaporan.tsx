"use client";

import React, { useState } from "react";
import { X, FileSpreadsheet, FileText, Heart, Sparkles } from "lucide-react";
import Papa from "papaparse";
import jsPDF from "jspdf";
import { Transaksi, Dompet } from "@/types";
import { CategoryOption, getCategoryName } from "@/lib/category-options";
import { COPY, formatTanggalIndonesia } from "@/lib/copy";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  daftarTransaksi: (Omit<Transaksi, "tanggal"> & { tanggalStr: string })[];
  daftarDompet: Dompet[];
  kategoriManual: CategoryOption[];
}

export default function ModalExportLaporan({
  isOpen,
  onClose,
  daftarTransaksi,
  daftarDompet,
  kategoriManual,
}: Props) {
  const [format, setFormat] = useState<"csv" | "pdf">("csv");

  if (!isOpen) return null;

  const getNamaDompet = (id: string) => {
    return daftarDompet.find((d) => d.id === id)?.nama || "Dompet";
  };

  const formatRupiah = (angka: number) =>
    `Rp ${new Intl.NumberFormat("id-ID", { maximumFractionDigits: 0 }).format(angka)}`;
  const getTipeTransaksi = (tipe: Transaksi["tipe"]) => {
    if (tipe === "expense") return COPY.transaction.expense;
    if (tipe === "income") return COPY.transaction.income;
    return COPY.transaction.transfer;
  };

  // 1. Export Ke CSV / Excel
  const handleExportCSV = () => {
    const dataCSV = daftarTransaksi.map((t) => ({
      [COPY.export.date]: t.tanggalStr,
      [COPY.export.transactionType]: getTipeTransaksi(t.tipe),
      [COPY.export.category]: getCategoryName(t.kategoriId, kategoriManual) || "-",
      [COPY.export.wallet]: getNamaDompet(t.dompetId),
      [COPY.export.amount]: formatRupiah(t.nominal),
      [COPY.export.note]: t.catatan || "-",
    }));

    const csv = Papa.unparse(dataCSV);
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `Laporan_Keuangan_Alokasi_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    onClose();
  };

  // 2. Export Ke PDF
  const handleExportPDF = () => {
    const doc = new jsPDF();
    doc.setFont("helvetica", "bold");
    doc.setFontSize(16);
    doc.text(COPY.export.pdfTitle, 14, 20);

    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.text(`${COPY.export.printedAt} ${formatTanggalIndonesia(new Date())}`, 14, 28);

    let yPos = 40;
    const drawTableHeader = () => {
      doc.setFont("helvetica", "bold");
      doc.text(COPY.export.date, 14, yPos);
      doc.text(COPY.export.transactionType, 50, yPos);
      doc.text(COPY.export.wallet, 80, yPos);
      doc.text(COPY.export.amount, 130, yPos);
      doc.text(COPY.export.categoryNote, 160, yPos);
      yPos += 6;
      doc.setLineWidth(0.5);
      doc.line(14, yPos, 196, yPos);
      yPos += 8;
      doc.setFont("helvetica", "normal");
    };
    drawTableHeader();

    daftarTransaksi.forEach((t) => {
      const kategoriCatatan = `${getCategoryName(t.kategoriId, kategoriManual) || "-"} | ${t.catatan || "-"}`;
      const detailLines = doc.splitTextToSize(kategoriCatatan, 38);
      const rowHeight = Math.max(8, detailLines.length * 5);
      if (yPos + rowHeight > 280) {
        doc.addPage();
        yPos = 20;
        drawTableHeader();
      }

      doc.text(t.tanggalStr, 14, yPos);
      doc.text(getTipeTransaksi(t.tipe), 50, yPos);
      doc.text(getNamaDompet(t.dompetId), 80, yPos);
      doc.text(formatRupiah(t.nominal), 130, yPos);
      doc.text(detailLines, 160, yPos);
      yPos += rowHeight;
    });

    doc.save(`Laporan_Keuangan_Alokasi_${Date.now()}.pdf`);
    onClose();
  };

  const handleDownload = () => {
    if (format === "csv") {
      handleExportCSV();
    } else {
      handleExportPDF();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-slate-900/40 backdrop-blur-sm p-3 sm:items-center sm:p-4">
      <div className="max-h-[85vh] w-full max-w-md space-y-5 overflow-y-auto overscroll-contain rounded-[2rem] border border-pink-100 bg-white p-5 shadow-2xl sm:p-6">
        {/* Header Modal */}
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-pink-50 text-pink-500 rounded-xl">
              <Heart className="w-5 h-5 fill-pink-500 text-pink-500" />
            </div>
            <div>
              <h2 className="text-base font-extrabold text-slate-800">
                {COPY.export.title}
              </h2>
              <p className="text-[11px] text-pink-400 font-bold">{COPY.export.subtitle}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 bg-pink-50 hover:bg-pink-100 text-pink-400 rounded-full transition-colors"
            aria-label={COPY.common.close}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Pilihan Format Ekspor */}
        <div className="grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={() => setFormat("csv")}
            className={`p-4 rounded-2xl border text-left flex flex-col justify-between space-y-2 transition-all ${
              format === "csv"
                ? "border-pink-500 bg-pink-50/50 ring-2 ring-pink-500/20"
                : "border-pink-100 hover:border-pink-200 bg-pink-50/20"
            }`}
          >
            <FileSpreadsheet
              className={`w-6 h-6 ${
                format === "csv" ? "text-pink-500" : "text-pink-300"
              }`}
            />
            <div>
              <p className="text-xs font-extrabold text-slate-800">{COPY.export.csv}</p>
              <p className="text-[10px] text-pink-400 font-medium">{COPY.export.csvDescription}</p>
            </div>
          </button>

          <button
            type="button"
            onClick={() => setFormat("pdf")}
            className={`p-4 rounded-2xl border text-left flex flex-col justify-between space-y-2 transition-all ${
              format === "pdf"
                ? "border-pink-500 bg-pink-50/50 ring-2 ring-pink-500/20"
                : "border-pink-100 hover:border-pink-200 bg-pink-50/20"
            }`}
          >
            <FileText
              className={`w-6 h-6 ${
                format === "pdf" ? "text-pink-500" : "text-pink-300"
              }`}
            />
            <div>
              <p className="text-xs font-extrabold text-slate-800">{COPY.export.pdf}</p>
              <p className="text-[10px] text-pink-400 font-medium">{COPY.export.pdfDescription}</p>
            </div>
          </button>
        </div>

        {/* Tombol Download */}
        <button
          type="button"
          onClick={handleDownload}
          className="flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-pink-500 via-rose-400 to-fuchsia-400 py-3.5 text-xs font-extrabold text-white transition-opacity hover:opacity-95 active:scale-[0.98] shadow-lg shadow-pink-500/25"
        >
          <Sparkles className="w-4 h-4 text-pink-100" />
          {COPY.export.download.replace("{format}", format.toUpperCase())}
        </button>
      </div>
    </div>
  );
}