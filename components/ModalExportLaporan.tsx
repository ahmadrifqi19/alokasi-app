"use client";

import React, { useState } from "react";
import { X, FileSpreadsheet, FileText, Download } from "lucide-react";
import Papa from "papaparse";
import jsPDF from "jspdf";
import { Transaksi, Dompet } from "@/types";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  daftarTransaksi: (Omit<Transaksi, "tanggal"> & { tanggalStr: string })[];
  daftarDompet: Dompet[];
}

export default function ModalExportLaporan({
  isOpen,
  onClose,
  daftarTransaksi,
  daftarDompet,
}: Props) {
  const [format, setFormat] = useState<"csv" | "pdf">("csv");

  if (!isOpen) return null;

  const getNamaDompet = (id: string) => {
    return daftarDompet.find((d) => d.id === id)?.nama || "Dompet";
  };

  // 1. Export Ke CSV / Excel
  const handleExportCSV = () => {
    const dataCSV = daftarTransaksi.map((t) => ({
      Tanggal: t.tanggalStr,
      Tipe: t.tipe.toUpperCase(),
      Dompet: getNamaDompet(t.dompetId),
      Nominal: t.nominal,
      Catatan: t.catatan || "-",
    }));

    const csv = Papa.unparse(dataCSV);
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `Laporan_Alokasi_${Date.now()}.csv`);
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
    doc.text("Laporan Keuangan - Alokasi", 14, 20);

    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.text(`Dicetak pada: ${new Date().toLocaleDateString("id-ID")}`, 14, 28);

    let yPos = 40;
    doc.setFont("helvetica", "bold");
    doc.text("Tanggal", 14, yPos);
    doc.text("Tipe", 50, yPos);
    doc.text("Dompet", 80, yPos);
    doc.text("Nominal (Rp)", 130, yPos);
    doc.text("Catatan", 170, yPos);

    yPos += 6;
    doc.setLineWidth(0.5);
    doc.line(14, yPos, 196, yPos);
    yPos += 8;

    doc.setFont("helvetica", "normal");
    daftarTransaksi.forEach((t) => {
      doc.text(t.tanggalStr, 14, yPos);
      doc.text(t.tipe.toUpperCase(), 50, yPos);
      doc.text(getNamaDompet(t.dompetId), 80, yPos);
      doc.text(t.nominal.toLocaleString("id-ID"), 130, yPos);
      doc.text(t.catatan || "-", 170, yPos);
      yPos += 8;
    });

    doc.save(`Laporan_Alokasi_${Date.now()}.pdf`);
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
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-slate-900/45 p-0 sm:items-center sm:p-4">
      <div className="w-full max-w-md space-y-5 rounded-t-2xl border border-slate-200 bg-white p-5 shadow-sm sm:rounded-2xl sm:p-6">
        <div className="flex justify-between items-center">
          <h2 className="text-base font-bold text-slate-800">
            Export Laporan Bulanan
          </h2>
          <button
            onClick={onClose}
            className="p-1.5 bg-slate-100 hover:bg-slate-200 text-slate-500 rounded-full transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={() => setFormat("csv")}
            className={`p-4 rounded-2xl border text-left flex flex-col justify-between space-y-2 transition-all ${
              format === "csv"
                ? "border-blue-600 bg-blue-50/50 ring-2 ring-blue-600/20"
                : "border-slate-200 hover:border-slate-300"
            }`}
          >
            <FileSpreadsheet
              className={`w-6 h-6 ${
                format === "csv" ? "text-blue-600" : "text-slate-400"
              }`}
            />
            <div>
              <p className="text-xs font-bold text-slate-800">Format CSV / Excel</p>
              <p className="text-[10px] text-slate-400">Cocok untuk diolah di Excel</p>
            </div>
          </button>

          <button
            type="button"
            onClick={() => setFormat("pdf")}
            className={`p-4 rounded-2xl border text-left flex flex-col justify-between space-y-2 transition-all ${
              format === "pdf"
                ? "border-blue-600 bg-blue-50/50 ring-2 ring-blue-600/20"
                : "border-slate-200 hover:border-slate-300"
            }`}
          >
            <FileText
              className={`w-6 h-6 ${
                format === "pdf" ? "text-blue-600" : "text-slate-400"
              }`}
            />
            <div>
              <p className="text-xs font-bold text-slate-800">Format PDF</p>
              <p className="text-[10px] text-slate-400">Siap cetak & dibaca</p>
            </div>
          </button>
        </div>

        <button
          onClick={handleDownload}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 py-3.5 text-xs font-semibold text-white transition-colors hover:bg-blue-700 active:scale-[0.98]"
        >
          <Download className="w-4 h-4 stroke-[2.5]" />
          Unduh Laporan ({format.toUpperCase()})
        </button>
      </div>
    </div>
  );
}