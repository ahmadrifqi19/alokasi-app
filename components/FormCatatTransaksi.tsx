"use client";

import React, { useState } from "react";
import { X, ArrowUpRight, ArrowDownLeft, ArrowRightLeft, Check } from "lucide-react";
import { Dompet, TipeTransaksi } from "@/types";

interface Props {
  isOpen: boolean;
  initialData?: { nominal: number; catatan: string; kategoriId: string } | null;
  daftarDompet: Dompet[];
  walletsLoaded: boolean;
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

export default function FormCatatTransaksi({
  isOpen,
  initialData,
  daftarDompet,
  walletsLoaded,
  onClose,
  onSubmit,
}: Props) {
  const [tipe, setTipe] = useState<TipeTransaksi>("expense");
  const [nominal, setNominal] = useState(() =>
    initialData ? String(initialData.nominal) : "",
  );
  const [dompetId, setDompetId] = useState("");
  const [dompetTujuanId, setDompetTujuanId] = useState("");
  const [kategoriId, setKategoriId] = useState(initialData?.kategoriId ?? "k1");
  const [catatan, setCatatan] = useState(initialData?.catatan ?? "");

  const walletsWithId = daftarDompet.filter(
    (dompet): dompet is Dompet & { id: string } => Boolean(dompet.id),
  );
  const selectedDompetId = walletsWithId.some((dompet) => dompet.id === dompetId)
    ? dompetId
    : walletsWithId[0]?.id ?? "";
  const transferWallets = walletsWithId.filter(
    (dompet) => dompet.id !== selectedDompetId,
  );
  const selectedDompetTujuanId = transferWallets.some(
    (dompet) => dompet.id === dompetTujuanId,
  )
    ? dompetTujuanId
    : transferWallets[0]?.id ?? "";
  const walletOptionsDisabled = !walletsLoaded || walletsWithId.length === 0;
  const submitDisabled =
    walletOptionsDisabled ||
    (tipe === "transfer" && !selectedDompetTujuanId);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nominal || Number(nominal) <= 0 || !selectedDompetId) return;
    if (tipe === "transfer" && !selectedDompetTujuanId) return;

    onSubmit({
      tipe,
      nominal: Number(nominal),
      dompetId: selectedDompetId,
      dompetTujuanId:
        tipe === "transfer" ? selectedDompetTujuanId : undefined,
      kategoriId: tipe !== "transfer" ? kategoriId : undefined,
      catatan,
      tanggal: new Date(),
    });

    setNominal("");
    setCatatan("");
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-slate-900/45 p-3 sm:items-center sm:p-4">
      <div className="max-h-[85vh] w-full max-w-md space-y-5 overflow-y-auto overscroll-contain rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
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
                value={selectedDompetId}
                onChange={(e) => setDompetId(e.target.value)}
                disabled={walletOptionsDisabled}
                className="w-full mt-1 p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 focus:outline-none focus:border-blue-600"
              >
                {!walletsLoaded ? (
                  <option value="">Memuat dompet...</option>
                ) : walletsWithId.length === 0 ? (
                  <option value="">Belum ada dompet</option>
                ) : (
                  walletsWithId.map((dompet) => (
                    <option key={dompet.id} value={dompet.id}>
                      {dompet.nama}
                    </option>
                  ))
                )}
              </select>
              {walletsLoaded && walletsWithId.length === 0 && (
                <p className="mt-1 text-[10px] text-slate-500">
                  Tambahkan dompet terlebih dahulu untuk mencatat transaksi.
                </p>
              )}
            </div>

            {tipe === "transfer" ? (
              <div>
                <label className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                  Ke Dompet
                </label>
                <select
                  value={selectedDompetTujuanId}
                  onChange={(e) => setDompetTujuanId(e.target.value)}
                  disabled={!selectedDompetTujuanId}
                  className="w-full mt-1 p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 focus:outline-none focus:border-blue-600"
                >
                  {transferWallets.length === 0 ? (
                    <option value="">Perlu dompet lain</option>
                  ) : (
                    transferWallets.map((dompet) => (
                      <option key={dompet.id} value={dompet.id}>
                        {dompet.nama}
                      </option>
                    ))
                  )}
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
            disabled={submitDisabled}
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