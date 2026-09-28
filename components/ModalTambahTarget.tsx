"use client";

import React, { useState } from "react";
import { X, Target, Check } from "lucide-react";
import { TargetTabungan } from "@/types";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onTambahTarget: (targetBaru: TargetTabungan) => void;
}

export default function ModalTambahTarget({
  isOpen,
  onClose,
  onTambahTarget,
}: Props) {
  const [nama, setNama] = useState("");
  const [targetNominal, setTargetNominal] = useState("");
  const [terkumpul, setTerkumpul] = useState("");

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nama || !targetNominal) return;

    onTambahTarget({
      id: `g-${Date.now()}`,
      nama,
      targetNominal: Number(targetNominal),
      terkumpul: terkumpul ? Number(terkumpul) : 0,
    });

    // Reset Form & Close
    setNama("");
    setTargetNominal("");
    setTerkumpul("");
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-slate-900/45 p-3 sm:items-center sm:p-4">
      <div className="max-h-[85vh] w-full max-w-md space-y-5 overflow-y-auto overscroll-contain rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
        
        {/* Header Modal */}
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-blue-50 text-blue-600 rounded-xl">
              <Target className="w-5 h-5" />
            </div>
            <h2 className="text-base font-bold text-slate-800">
              Buat Target Tabungan Baru
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 bg-slate-100 hover:bg-slate-200 text-slate-500 rounded-full transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
              Nama Impian / Target
            </label>
            <input
              type="text"
              placeholder="Contoh: Beli Laptop Baru, Liburan Bali"
              value={nama}
              onChange={(e) => setNama(e.target.value)}
              required
              className="w-full mt-1 p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none focus:border-blue-600"
            />
          </div>

          <div>
            <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
              Target Nominal (Rp)
            </label>
            <input
              type="number"
              placeholder="0"
              value={targetNominal}
              onChange={(e) => setTargetNominal(e.target.value)}
              required
              className="w-full mt-1 p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none focus:border-blue-600"
            />
          </div>

          <div>
            <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
              Saldo Awal Terkumpul (Opsional)
            </label>
            <input
              type="number"
              placeholder="0"
              value={terkumpul}
              onChange={(e) => setTerkumpul(e.target.value)}
              className="w-full mt-1 p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none focus:border-blue-600"
            />
          </div>

          <button
            type="submit"
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 py-3.5 text-xs font-semibold text-white transition-colors hover:bg-blue-700 active:scale-[0.98]"
          >
            <Check className="w-4 h-4 stroke-[3]" />
            Simpan Target Impian
          </button>
        </form>
      </div>
    </div>
  );
}