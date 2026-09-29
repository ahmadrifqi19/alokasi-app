"use client";

import React, { useState } from "react";
import { X, Sparkles, Heart } from "lucide-react";

interface ModalAturLimitProps {
  isOpen: boolean;
  onClose: () => void;
  onTambahLimit: (data: {
    kategoriId: string;
    namaKategori: string;
    limitBulanan: number;
  }) => void;
}

const KATEGORI_GIRLY_OPTIONS = [
  { id: "k1", nama: "Coffee & Treats ☕🍰" },
  { id: "k2", nama: "Self-Care & Cinema 🍿🎟️" },
  { id: "k3", nama: "Shopping & Skincare 💄👗" },
  { id: "k4", nama: "Kebutuhan Harian 🛒✨" },
  { id: "k5", nama: "Transportasi & Taxi 🚗" },
  { id: "k6", nama: "Tagihan & Wi-Fi 📑" },
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

    const katObj = KATEGORI_GIRLY_OPTIONS.find((k) => k.id === selectedKategoriId);

    onTambahLimit({
      kategoriId: selectedKategoriId,
      namaKategori: katObj?.nama || "Kategori Cantik",
      limitBulanan: limitNum,
    });

    setLimitInput("");
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm px-4">
      <div className="max-h-[85vh] w-full max-w-md space-y-4 overflow-y-auto overscroll-contain rounded-[2rem] border border-pink-100 bg-white p-6 shadow-2xl">
        {/* HEADER MODAL */}
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-pink-50 text-pink-500 rounded-xl">
              <Heart className="w-5 h-5 fill-pink-500 text-pink-500" />
            </div>
            <div>
              <h3 className="text-base font-extrabold text-slate-900">
                Atur Limit Jajan Bulanan 💖
              </h3>
              <p className="text-[11px] text-pink-400 font-bold">Jaga keuangan kamu tetap terkontrol, Babe!</p>
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

        {/* FORM INPUT */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-extrabold text-pink-500 mb-1">
              Kategori Jajan
            </label>
            <select
              value={selectedKategoriId}
              onChange={(e) => setSelectedKategoriId(e.target.value)}
              className="w-full rounded-2xl border border-pink-200 bg-pink-50/30 px-4 py-2.5 text-xs font-bold text-slate-800 focus:border-pink-500 focus:outline-none"
            >
              {KATEGORI_GIRLY_OPTIONS.map((k) => (
                <option key={k.id} value={k.id}>
                  {k.nama}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-extrabold text-pink-500 mb-1">
              Limit Maksimal Bulanan (Rp)
            </label>
            <input
              type="number"
              required
              placeholder="Contoh: 1500000"
              value={limitInput}
              onChange={(e) => setLimitInput(e.target.value)}
              className="w-full rounded-2xl border border-pink-200 bg-pink-50/30 px-4 py-2.5 text-xs font-bold text-slate-800 focus:border-pink-500 focus:outline-none"
            />
          </div>

          <button
            type="submit"
            className="w-full rounded-2xl bg-gradient-to-r from-pink-500 via-rose-400 to-fuchsia-400 py-3.5 text-xs font-extrabold text-white hover:opacity-95 transition-opacity mt-2 flex items-center justify-center gap-2 shadow-lg shadow-pink-500/25"
          >
            <Sparkles className="w-4 h-4 text-pink-100" /> Simpan Limit Anggaran ✨
          </button>
        </form>
      </div>
    </div>
  );
}