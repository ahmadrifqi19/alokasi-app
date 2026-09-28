"use client";

import React, { useState } from "react";
import { X } from "lucide-react";

interface ModalAturLimitProps {
  isOpen: boolean;
  onClose: () => void;
  onTambahLimit: (data: {
    kategoriId: string;
    namaKategori: string;
    limitBulanan: number;
  }) => void;
}

const KATEGORI_OPTIONS = [
  { id: "k1", nama: "Makanan & Kopi" },
  { id: "k2", nama: "Hiburan & Nonton" },
  { id: "k3", nama: "Belanja" },
  { id: "k4", nama: "Kebutuhan Harian" },
  { id: "k5", nama: "Transportasi" },
  { id: "k6", nama: "Tagihan & Utilitas" },
];

export default function ModalAturLimit({
  isOpen,
  onClose,
  onTambahLimit,
}: ModalAturLimitProps) {
  const [selectedKategoriId, setSelectedKategoriId] = useState("k1");
  const [limitInput, setLimitInput] = useState("");

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const limitNum = parseFloat(limitInput);
    if (!limitNum || limitNum <= 0) return;

    const katObj = KATEGORI_OPTIONS.find((k) => k.id === selectedKategoriId);

    onTambahLimit({
      kategoriId: selectedKategoriId,
      namaKategori: katObj?.nama || "Kategori Lain",
      limitBulanan: limitNum,
    });

    setLimitInput("");
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/45 px-4">
      <div className="w-full max-w-md space-y-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
        <div className="flex justify-between items-center">
          <h3 className="text-base font-bold text-slate-900">
            Atur Limit Anggaran Bulanan
          </h3>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">
              Kategori
            </label>
            <select
              value={selectedKategoriId}
              onChange={(e) => setSelectedKategoriId(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-xs text-slate-800 focus:border-blue-500 focus:outline-none"
            >
              {KATEGORI_OPTIONS.map((k) => (
                <option key={k.id} value={k.id}>
                  {k.nama}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">
              Limit Bulanan (Rp)
            </label>
            <input
              type="number"
              required
              placeholder="Contoh: 1500000"
              value={limitInput}
              onChange={(e) => setLimitInput(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-xs text-slate-800 focus:border-blue-500 focus:outline-none"
            />
          </div>

          <button
            type="submit"
            className="w-full rounded-xl bg-blue-600 py-3 text-xs font-bold text-white hover:bg-blue-700 transition-colors mt-2"
          >
            Simpan Limit Anggaran
          </button>
        </form>
      </div>
    </div>
  );
}