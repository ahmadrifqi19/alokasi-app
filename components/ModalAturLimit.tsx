"use client";

import React, { useState } from "react";
import { X, Sparkles, Heart, Trash2 } from "lucide-react";
import {
  CategoryOption,
  createOrFindCategoryOption,
  DEFAULT_CATEGORY_OPTIONS,
  OTHER_CATEGORY_OPTION_ID,
} from "@/lib/category-options";

interface ModalAturLimitProps {
  isOpen: boolean;
  kategoriManual: CategoryOption[];
  kategoriArsip: string[];
  onClose: () => void;
  onDeleteCategory: (categoryId: string) => void;
  onTambahLimit: (data: {
    kategoriId: string;
    namaKategori: string;
    limitBulanan: number;
  }) => void;
}

export default function ModalAturLimit({
  isOpen,
  kategoriManual,
  kategoriArsip,
  onClose,
  onDeleteCategory,
  onTambahLimit,
}: ModalAturLimitProps) {
  const [selectedKategoriId, setSelectedKategoriId] = useState("k1");
  const [customKategori, setCustomKategori] = useState("");
  const [limitInput, setLimitInput] = useState("");

  if (!isOpen) return null;

  const kategoriOptions = [
    ...DEFAULT_CATEGORY_OPTIONS.filter(
      (kategori) => !kategoriArsip.includes(kategori.id),
    ),
    ...kategoriManual,
  ];
  const activeSelectedKategoriId = kategoriOptions.some(
    (kategori) => kategori.id === selectedKategoriId,
  )
    ? selectedKategoriId
    : kategoriOptions[0]?.id ?? OTHER_CATEGORY_OPTION_ID;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const limitNum = parseFloat(limitInput);
    if (!limitNum || limitNum <= 0) return;
    if (activeSelectedKategoriId === OTHER_CATEGORY_OPTION_ID && !customKategori.trim()) return;

    const katObj =
      activeSelectedKategoriId === OTHER_CATEGORY_OPTION_ID
        ? createOrFindCategoryOption(customKategori, kategoriOptions)
        : kategoriOptions.find((k) => k.id === activeSelectedKategoriId);
    if (!katObj) return;

    onTambahLimit({
      kategoriId: katObj.id,
      namaKategori: katObj.nama,
      limitBulanan: limitNum,
    });

    setSelectedKategoriId(katObj.id);
    setCustomKategori("");
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
            <div className="flex gap-2">
              <select
                value={activeSelectedKategoriId}
                onChange={(e) => setSelectedKategoriId(e.target.value)}
                className="min-w-0 flex-1 rounded-2xl border border-pink-200 bg-pink-50/30 px-4 py-2.5 text-xs font-bold text-slate-800 focus:border-pink-500 focus:outline-none"
              >
                {kategoriOptions.map((k) => (
                  <option key={k.id} value={k.id}>
                    {k.nama}
                  </option>
                ))}
                <option value={OTHER_CATEGORY_OPTION_ID}>Lainnya...</option>
              </select>
              {kategoriOptions.some((kategori) => kategori.id === activeSelectedKategoriId) && (
                <button
                  type="button"
                  title="Hapus kategori"
                  aria-label="Hapus kategori"
                  onClick={() => {
                    const selectedKategori = kategoriOptions.find(
                      (kategori) => kategori.id === activeSelectedKategoriId,
                    );
                    if (
                      selectedKategori &&
                      window.confirm(
                        `Hapus kategori "${selectedKategori.nama}" dari pilihan? Riwayat lama tetap tersimpan.`,
                      )
                    ) {
                      onDeleteCategory(activeSelectedKategoriId);
                      setSelectedKategoriId(
                        kategoriOptions.find(
                          (kategori) => kategori.id !== activeSelectedKategoriId,
                        )?.id ?? OTHER_CATEGORY_OPTION_ID,
                      );
                    }
                  }}
                  className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-rose-200 text-rose-500 transition-colors hover:bg-rose-50"
                >
                  <Trash2 className="h-4 w-4" aria-hidden="true" />
                </button>
              )}
            </div>
            {activeSelectedKategoriId === OTHER_CATEGORY_OPTION_ID && (
              <input
                type="text"
                required
                maxLength={50}
                placeholder="Tulis nama kategori baru"
                value={customKategori}
                onChange={(e) => setCustomKategori(e.target.value)}
                className="mt-2 w-full rounded-2xl border border-pink-200 bg-pink-50/30 px-4 py-2.5 text-xs font-bold text-slate-800 focus:border-pink-500 focus:outline-none"
              />
            )}
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