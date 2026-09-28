"use client";

import React, { useState } from "react";
import { X, ArrowUpRight, ArrowDownLeft, ArrowRightLeft, Check } from "lucide-react";
import { TipeTransaksi } from "@/types";

interface Props {
  isOpen: boolean;
  initialData?: { nominal: number; catatan: string; kategoriId: string } | null;
  onClose: () => void;
  onSubmit: (data: {
    tipe: TipeTransaksi;
    nominal: number;
    dompetId: string;
    dompetTujuanId?: string;
    kategoriId?: string;
    catatan?: string;
    tanggal: Date;
  }) => void;
}

export default function FormCatatTransaksi({ isOpen, initialData, onClose, onSubmit }: Props) {
  const [tipe, setTipe] = useState<TipeTransaksi>("expense");
  const [nominal, setNominal] = useState(() =>
    initialData ? String(initialData.nominal) : "",
  );
  const [dompetId, setDompetId] = useState("d1");
  const [dompetTujuanId, setDompetTujuanId] = useState("d2");
  const [kategoriId, setKategoriId] = useState(initialData?.kategoriId ?? "k1");
  const [catatan, setCatatan] = useState(initialData?.catatan ?? "");

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nominal || Number(nominal) <= 0) return;

    onSubmit({
      tipe,
      nominal: Number(nominal),
      dompetId,
      dompetTujuanId: tipe === "transfer" ? dompetTujuanId : undefined,
      kategoriId: tipe !== "transfer" ? kategoriId : undefined,
      catatan,
      tanggal: new Date(),
    });

    setNominal("");
    setCatatan("");
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-slate-900/45 p-0 sm:items-center sm:p-4">
      <div className="w-full max-w-md space-y-5 rounded-t-2xl border border-slate-200 bg-white p-5 shadow-sm sm:rounded-2xl sm:p-6">
        <div className="flex justify-between items-center">
          <h2 className="text-base font-bold text-slate-800">Catat Transaksi</h2>
          <button
            onClick={onClose}
            className="p-1.5 bg-slate-100 hover:bg-slate-200 text-slate-500 rounded-full transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="grid grid-cols-3 gap-1.5 p-1 bg-slate-100 rounded-2xl text-xs font-bold text-slate-600">
          <button
            type="button"
            onClick={() => setTipe("expense")}
            className={`py-2.5 rounded-xl flex items-center justify-center gap-1 transition-all ${
              tipe === "expense" ? "bg-rose-500 text-white shadow-sm" : ""
            }`}
          >
            <ArrowUpRight className="w-3.5 h-3.5" />
            Pengeluaran
          </button>
          <button
            type="button"
            onClick={() => setTipe("income")}
            className={`py-2.5 rounded-xl flex items-center justify-center gap-1 transition-all ${
              tipe === "income" ? "bg-emerald-500 text-white shadow-sm" : ""
            }`}
          >
            <ArrowDownLeft className="w-3.5 h-3.5" />
            Pemasukan
          </button>
          <button
            type="button"
            onClick={() => setTipe("transfer")}
            className={`py-2.5 rounded-xl flex items-center justify-center gap-1 transition-all ${
              tipe === "transfer" ? "bg-blue-600 text-white shadow-sm" : ""
            }`}
          >
            <ArrowRightLeft className="w-3.5 h-3.5" />
            Transfer
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
              Nominal (Rp)
            </label>
            <div className="relative mt-1">
              <span className="absolute left-0 top-1/2 -translate-y-1/2 text-2xl font-black text-slate-400">
                Rp
              </span>
              <input
                type="number"
                value={nominal}
                onChange={(e) => setNominal(e.target.value)}
                placeholder="0"
                autoFocus
                required
                className="w-full pl-10 pr-3 py-1 text-3xl font-black text-slate-800 focus:outline-none placeholder:text-slate-200 border-b border-slate-200 focus:border-blue-600 transition-colors"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                {tipe === "transfer" ? "Dari Dompet" : "Sumber Dompet"}
              </label>
              <select
                value={dompetId}
                onChange={(e) => setDompetId(e.target.value)}
                className="w-full mt-1 p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 focus:outline-none focus:border-blue-600"
              >
                <option value="d1">Dompet Tunai</option>
                <option value="d2">Bank BCA</option>
                <option value="d3">GoPay / OVO</option>
              </select>
            </div>

            {tipe === "transfer" ? (
              <div>
                <label className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                  Ke Dompet
                </label>
                <select
                  value={dompetTujuanId}
                  onChange={(e) => setDompetTujuanId(e.target.value)}
                  className="w-full mt-1 p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 focus:outline-none focus:border-blue-600"
                >
                  <option value="d1">Dompet Tunai</option>
                  <option value="d2">Bank BCA</option>
                  <option value="d3">GoPay / OVO</option>
                </select>
              </div>
            ) : (
              <div>
                <label className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                  Kategori
                </label>
                <select
                  value={kategoriId}
                  onChange={(e) => setKategoriId(e.target.value)}
                  className="w-full mt-1 p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 focus:outline-none focus:border-blue-600"
                >
                  <option value="k1">Makanan & Kopi</option>
                  <option value="k2">Hiburan & Nonton</option>
                  <option value="k3">Belanja</option>
                  <option value="k4">Gaji & Project</option>
                  <option value="k5">Transportasi</option>
                  <option value="k6">Tagihan & Utilitas</option>
                </select>
              </div>
            )}
          </div>

          <div>
            <label className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
              Catatan (Opsional)
            </label>
            <input
              type="text"
              value={catatan}
              onChange={(e) => setCatatan(e.target.value)}
              placeholder="Contoh: Beli Kopi, Nasi Goreng"
              className="w-full mt-1 p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-700 focus:outline-none focus:border-blue-600"
            />
          </div>

          <button
            type="submit"
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 py-3.5 text-sm font-semibold text-white transition-colors hover:bg-blue-700 active:scale-[0.98]"
          >
            <Check className="w-4 h-4 stroke-[3]" />
            Simpan Transaksi
          </button>
        </form>
      </div>
    </div>
  );
}