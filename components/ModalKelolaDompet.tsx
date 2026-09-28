"use client";

import React, { useState } from "react";
import { X, Plus, Trash2, Banknote, Building2, CreditCard, Check } from "lucide-react";
import { Dompet, TipeDompet } from "@/types";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  daftarDompet: Dompet[];
  onTambahDompet: (dompetBaru: Omit<Dompet, "id">) => void;
  onHapusDompet: (id: string) => void;
}

export default function ModalKelolaDompet({
  isOpen,
  onClose,
  daftarDompet,
  onTambahDompet,
  onHapusDompet,
}: Props) {
  const [modeTambah, setModeTambah] = useState(false);
  const [nama, setNama] = useState("");
  const [tipe, setTipe] = useState<TipeDompet>("bank");
  const [saldo, setSaldo] = useState("");
  const [warna, setWarna] = useState("bg-blue-600");

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nama || !saldo) return;

    onTambahDompet({
      nama,
      tipe,
      saldo: Number(saldo),
      warna,
    });

    // Reset Form
    setNama("");
    setSaldo("");
    setModeTambah(false);
  };

  const formatRupiah = (angka: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      maximumFractionDigits: 0,
    }).format(angka);
  };

  const getIconDompet = (tipeDompet: TipeDompet) => {
    switch (tipeDompet) {
      case "cash":
        return <Banknote className="w-4 h-4 text-emerald-500" />;
      case "bank":
        return <Building2 className="w-4 h-4 text-blue-500" />;
      case "ewallet":
        return <CreditCard className="w-4 h-4 text-amber-500" />;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-slate-900/45 p-0 sm:items-center sm:p-4">
      <div className="flex max-h-[85dvh] w-full max-w-md flex-col space-y-5 rounded-t-2xl border border-slate-200 bg-white p-5 shadow-sm sm:rounded-2xl sm:p-6">
        
        {/* Header Modal */}
        <div className="flex justify-between items-center shrink-0">
          <h2 className="text-base font-bold text-slate-800">Kelola Dompet & Rekening</h2>
          <button
            onClick={onClose}
            className="p-1.5 bg-slate-100 hover:bg-slate-200 text-slate-500 rounded-full transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Tambah Dompet Baru */}
        {modeTambah ? (
          <form onSubmit={handleSubmit} className="space-y-4 overflow-y-auto pr-1">
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 space-y-3">
              <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                Tambah Dompet Baru
              </h3>

              <div>
                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  Nama Dompet / Rekening
                </label>
                <input
                  type="text"
                  placeholder="Contoh: SeaBank, Dana, Kantong Darurat"
                  value={nama}
                  onChange={(e) => setNama(e.target.value)}
                  required
                  className="w-full mt-1 p-2.5 bg-white border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:border-blue-600"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    Tipe
                  </label>
                  <select
                    value={tipe}
                    onChange={(e) => setTipe(e.target.value as TipeDompet)}
                    className="w-full mt-1 p-2.5 bg-white border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:border-blue-600"
                  >
                    <option value="bank">Bank</option>
                    <option value="ewallet">E-Wallet</option>
                    <option value="cash">Tunai / Cash</option>
                  </select>
                </div>

                <div>
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    Saldo Awal (Rp)
                  </label>
                  <input
                    type="number"
                    placeholder="0"
                    value={saldo}
                    onChange={(e) => setSaldo(e.target.value)}
                    required
                    className="w-full mt-1 p-2.5 bg-white border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:border-blue-600"
                  />
                </div>
              </div>

              {/* Pilihan Warna Card */}
              <div>
                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  Warna Label
                </label>
                <div className="flex gap-2 mt-1">
                  {[
                    "bg-blue-600",
                    "bg-emerald-500",
                    "bg-amber-500",
                    "bg-rose-500",
                    "bg-cyan-600",
                    "bg-slate-800",
                  ].map((w) => (
                    <button
                      key={w}
                      type="button"
                      onClick={() => setWarna(w)}
                      className={`w-6 h-6 rounded-full ${w} flex items-center justify-center transition-transform ${
                        warna === w ? "scale-125 ring-2 ring-offset-2 ring-blue-600" : ""
                      }`}
                    >
                      {warna === w && <Check className="w-3 h-3 text-white stroke-[3]" />}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setModeTambah(false)}
                className="w-1/2 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold text-xs rounded-xl"
              >
                Batal
              </button>
              <button
                type="submit"
                className="w-1/2 rounded-xl bg-blue-600 py-2.5 text-xs font-semibold text-white transition-colors hover:bg-blue-700"
              >
                Simpan
              </button>
            </div>
          </form>
        ) : (
          /* List Daftar Dompet */
          <div className="space-y-4 flex-1 overflow-y-auto pr-1">
            <div className="divide-y divide-slate-100">
              {daftarDompet.map((d) => (
                <div key={d.id} className="py-3 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-slate-50 rounded-xl">{getIconDompet(d.tipe)}</div>
                    <div>
                      <p className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                        {d.nama}
                        <span className={`w-2 h-2 rounded-full ${d.warna}`} />
                      </p>
                      <p className="text-[11px] text-slate-400">{formatRupiah(d.saldo)}</p>
                    </div>
                  </div>

                  {daftarDompet.length > 1 && (
                    <button
                      onClick={() => d.id && onHapusDompet(d.id)}
                      className="p-1.5 text-slate-300 hover:text-rose-500 transition-colors"
                      title="Hapus Dompet"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              ))}
            </div>

            <button
              type="button"
              onClick={() => setModeTambah(true)}
              className="w-full py-3 bg-blue-50 border border-dashed border-blue-200 hover:bg-blue-100/50 text-blue-600 font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 transition-colors"
            >
              <Plus className="w-4 h-4 stroke-[2.5]" />
              Tambah Dompet / Rekening Baru
            </button>
          </div>
        )}
      </div>
    </div>
  );
}