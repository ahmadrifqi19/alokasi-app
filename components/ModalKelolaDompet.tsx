"use client";

import React, { useState } from "react";
import { X, Plus, Trash2, Banknote, Building2, CreditCard, Check, Heart, Sparkles } from "lucide-react";
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
  const [warna, setWarna] = useState("bg-pink-500");

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
        return <Building2 className="w-4 h-4 text-pink-500" />;
      case "ewallet":
        return <CreditCard className="w-4 h-4 text-fuchsia-500" />;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-slate-900/40 backdrop-blur-sm p-3 sm:items-center sm:p-4">
      <div className="flex max-h-[85vh] w-full max-w-md flex-col space-y-5 overflow-y-auto overscroll-contain rounded-[2rem] border border-pink-100 bg-white p-5 shadow-2xl sm:p-6">
        
        {/* Header Modal */}
        <div className="flex justify-between items-center shrink-0">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-pink-50 text-pink-500 rounded-xl">
              <Heart className="w-5 h-5 fill-pink-500 text-pink-500" />
            </div>
            <div>
              <h2 className="text-base font-extrabold text-slate-800">Dompet & Rekening Cantik ✨</h2>
              <p className="text-[11px] text-pink-400 font-bold">Atur tempat penyimpanan uang kamu</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 bg-pink-50 hover:bg-pink-100 text-pink-400 rounded-full transition-colors"
            aria-label="Tutup"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Tambah Dompet Baru */}
        {modeTambah ? (
          <form onSubmit={handleSubmit} className="space-y-4 overflow-y-auto pr-1">
            <div className="p-4 bg-pink-50/40 rounded-2xl border border-pink-100 space-y-3">
              <h3 className="text-xs font-extrabold text-pink-500 uppercase tracking-wider flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5" /> Tambah Dompet Cantik
              </h3>

              <div>
                <label className="text-[10px] font-extrabold uppercase tracking-wider text-pink-500">
                  Nama Dompet / Rekening
                </label>
                <input
                  type="text"
                  placeholder="Contoh: SeaBank, Dana Cantik, Cash Jajan"
                  value={nama}
                  onChange={(e) => setNama(e.target.value)}
                  required
                  className="w-full mt-1 p-2.5 bg-white border border-pink-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:border-pink-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[10px] font-extrabold uppercase tracking-wider text-pink-500">
                    Tipe
                  </label>
                  <select
                    value={tipe}
                    onChange={(e) => setTipe(e.target.value as TipeDompet)}
                    className="w-full mt-1 p-2.5 bg-white border border-pink-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:border-pink-500"
                  >
                    <option value="bank">Bank 🏛️</option>
                    <option value="ewallet">E-Wallet 📱</option>
                    <option value="cash">Tunai / Cash 💵</option>
                  </select>
                </div>

                <div>
                  <label className="text-[10px] font-extrabold uppercase tracking-wider text-pink-500">
                    Saldo Awal (Rp)
                  </label>
                  <input
                    type="number"
                    placeholder="0"
                    value={saldo}
                    onChange={(e) => setSaldo(e.target.value)}
                    required
                    className="w-full mt-1 p-2.5 bg-white border border-pink-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:border-pink-500"
                  />
                </div>
              </div>

              {/* Pilihan Warna Label */}
              <div>
                <label className="text-[10px] font-extrabold uppercase tracking-wider text-pink-500">
                  Warna Label Cantik
                </label>
                <div className="flex gap-2 mt-1">
                  {[
                    "bg-pink-500",
                    "bg-rose-400",
                    "bg-fuchsia-500",
                    "bg-purple-400",
                    "bg-amber-400",
                    "bg-emerald-400",
                  ].map((w) => (
                    <button
                      key={w}
                      type="button"
                      onClick={() => setWarna(w)}
                      className={`w-6 h-6 rounded-full ${w} flex items-center justify-center transition-transform ${
                        warna === w ? "scale-125 ring-2 ring-offset-2 ring-pink-500" : ""
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
                className="w-1/2 py-2.5 bg-pink-50 hover:bg-pink-100 text-pink-500 font-extrabold text-xs rounded-xl transition-colors"
              >
                Batal
              </button>
              <button
                type="submit"
                className="w-1/2 rounded-xl bg-gradient-to-r from-pink-500 to-rose-400 py-2.5 text-xs font-extrabold text-white shadow-md shadow-pink-500/20 transition-opacity hover:opacity-95"
              >
                Simpan ✨
              </button>
            </div>
          </form>
        ) : (
          /* List Daftar Dompet */
          <div className="space-y-4 flex-1 overflow-y-auto pr-1">
            <div className="divide-y divide-pink-50">
              {daftarDompet.map((d) => (
                <div key={d.id} className="py-3 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-pink-50/80 border border-pink-100 rounded-xl">{getIconDompet(d.tipe)}</div>
                    <div>
                      <p className="text-xs font-extrabold text-slate-800 flex items-center gap-1.5">
                        {d.nama}
                        <span className={`w-2 h-2 rounded-full ${d.warna}`} />
                      </p>
                      <p className="text-[11px] font-bold text-pink-400">{formatRupiah(d.saldo)}</p>
                    </div>
                  </div>

                  {daftarDompet.length > 1 && (
                    <button
                      type="button"
                      onClick={() => d.id && onHapusDompet(d.id)}
                      className="p-1.5 text-pink-200 hover:text-rose-500 transition-colors"
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
              className="w-full py-3 bg-pink-50 border border-dashed border-pink-200 hover:bg-pink-100/60 text-pink-500 font-extrabold text-xs rounded-2xl flex items-center justify-center gap-1.5 transition-colors"
            >
              <Plus className="w-4 h-4 stroke-[2.5]" />
              Tambah Dompet / Rekening Baru ✨
            </button>
          </div>
        )}
      </div>
    </div>
  );
}