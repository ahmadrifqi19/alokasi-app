"use client";

import React, { useState } from "react";
import { X, ArrowUpRight, ArrowDownLeft, ArrowRightLeft, Sparkles, Heart, Trash2 } from "lucide-react";
import { Dompet, TipeTransaksi } from "@/types";
import {
  CategoryOption,
  CUSTOM_CATEGORY_PREFIX,
  createOrFindCategoryOption,
  DEFAULT_CATEGORY_OPTIONS,
  OTHER_CATEGORY_OPTION_ID,
} from "@/lib/category-options";

interface Props {
  isOpen: boolean;
  initialData?: { nominal: number; catatan: string; kategoriId: string } | null;
  daftarDompet: Dompet[];
  kategoriManual: CategoryOption[];
  kategoriArsip: string[];
  walletsLoaded: boolean;
  onClose: () => void;
  onDeleteCategory: (categoryId: string) => void;
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
  kategoriManual,
  kategoriArsip,
  walletsLoaded,
  onClose,
  onDeleteCategory,
  onSubmit,
}: Props) {
  const kategoriOptions = [
    ...DEFAULT_CATEGORY_OPTIONS.filter(
      (kategori) => !kategoriArsip.includes(kategori.id),
    ),
    ...kategoriManual,
  ];
  const initialCustomKategoriId = initialData?.kategoriId?.startsWith(CUSTOM_CATEGORY_PREFIX)
    ? initialData.kategoriId
    : "";
  const initialCustomKategoriExists = kategoriOptions.some(
    (kategori) => kategori.id === initialCustomKategoriId,
  );
  const [tipe, setTipe] = useState<TipeTransaksi>("expense");
  const [nominal, setNominal] = useState(() =>
    initialData ? String(initialData.nominal) : "",
  );
  const [dompetId, setDompetId] = useState("");
  const [dompetTujuanId, setDompetTujuanId] = useState("");
  const [kategoriId, setKategoriId] = useState(
    initialCustomKategoriId && !initialCustomKategoriExists
      ? OTHER_CATEGORY_OPTION_ID
      : kategoriOptions.some((kategori) => kategori.id === initialData?.kategoriId)
        ? initialData?.kategoriId ?? "k1"
        : kategoriOptions[0]?.id ?? OTHER_CATEGORY_OPTION_ID,
  );
  const [customKategori, setCustomKategori] = useState(
    initialCustomKategoriId
      ? initialCustomKategoriId.slice(CUSTOM_CATEGORY_PREFIX.length)
      : "",
  );
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
    if (kategoriId === OTHER_CATEGORY_OPTION_ID && !customKategori.trim()) return;
    if (tipe === "transfer" && !selectedDompetTujuanId) return;

    const kategoriManualBaru =
      kategoriId === OTHER_CATEGORY_OPTION_ID
        ? createOrFindCategoryOption(customKategori, kategoriOptions)
        : undefined;

    onSubmit({
      tipe,
      nominal: Number(nominal),
      dompetId: selectedDompetId,
      dompetTujuanId:
        tipe === "transfer" ? selectedDompetTujuanId : undefined,
      kategoriId:
        tipe !== "transfer"
          ? kategoriManualBaru?.id ?? kategoriId
          : undefined,
      catatan,
      tanggal: new Date(),
    });

    setNominal("");
    setKategoriId(kategoriOptions[0]?.id ?? OTHER_CATEGORY_OPTION_ID);
    setCustomKategori("");
    setCatatan("");
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-slate-900/40 backdrop-blur-sm p-3 sm:items-center sm:p-4">
      <div className="max-h-[85vh] w-full max-w-md space-y-5 overflow-y-auto overscroll-contain rounded-[2rem] border border-pink-100 bg-white p-5 shadow-2xl sm:p-6">
        {/* HEADER MODAL */}
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-pink-50 text-pink-500 rounded-xl">
              <Heart className="w-5 h-5 fill-pink-500 text-pink-500" />
            </div>
            <div>
              <h2 className="text-base font-extrabold text-slate-800">Catat Jajan Yuk! ✨</h2>
              <p className="text-[11px] text-pink-400 font-bold">Kelola pengeluaran & pemasukan kamu</p>
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

        {/* TABS TIPE TRANSAKSI */}
        <div className="grid grid-cols-3 gap-1.5 p-1.5 bg-pink-50/50 rounded-2xl border border-pink-100 text-xs font-extrabold text-pink-400">
          <button
            type="button"
            onClick={() => setTipe("expense")}
            className={`py-2.5 rounded-xl flex items-center justify-center gap-1 transition-all ${
              tipe === "expense" ? "bg-white text-rose-500 shadow-sm" : "hover:text-pink-600"
            }`}
          >
            <ArrowUpRight className="w-3.5 h-3.5" />
            Jajan 💸
          </button>
          <button
            type="button"
            onClick={() => setTipe("income")}
            className={`py-2.5 rounded-xl flex items-center justify-center gap-1 transition-all ${
              tipe === "income" ? "bg-white text-emerald-600 shadow-sm" : "hover:text-pink-600"
            }`}
          >
            <ArrowDownLeft className="w-3.5 h-3.5" />
            Income 🌸
          </button>
          <button
            type="button"
            onClick={() => setTipe("transfer")}
            className={`py-2.5 rounded-xl flex items-center justify-center gap-1 transition-all ${
              tipe === "transfer" ? "bg-white text-pink-500 shadow-sm" : "hover:text-pink-600"
            }`}
          >
            <ArrowRightLeft className="w-3.5 h-3.5" />
            Pindah 💖
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-[11px] font-extrabold uppercase tracking-wider text-pink-500">
              Nominal (Rp)
            </label>
            <div className="relative mt-1">
              <span className="absolute left-0 top-1/2 -translate-y-1/2 text-2xl font-black text-pink-300">
                Rp
              </span>
              <input
                type="number"
                value={nominal}
                onChange={(e) => setNominal(e.target.value)}
                placeholder="0"
                autoFocus
                required
                className="w-full pl-10 pr-3 py-1 text-3xl font-black text-slate-800 focus:outline-none placeholder:text-pink-200 border-b border-pink-200 focus:border-pink-500 transition-colors"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[11px] font-extrabold uppercase tracking-wider text-pink-500">
                {tipe === "transfer" ? "Dari Dompet" : "Sumber Dompet"}
              </label>
              <select
                value={selectedDompetId}
                onChange={(e) => setDompetId(e.target.value)}
                disabled={walletOptionsDisabled}
                className="w-full mt-1 p-3 bg-pink-50/30 border border-pink-200 rounded-2xl text-xs font-bold text-slate-700 focus:outline-none focus:border-pink-500"
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
                <p className="mt-1 text-[10px] font-medium text-pink-400">
                  Tambah dompet dulu yuk untuk mulai catat transaksi! 🛍️
                </p>
              )}
            </div>

            {tipe === "transfer" ? (
              <div>
                <label className="text-[11px] font-extrabold uppercase tracking-wider text-pink-500">
                  Ke Dompet
                </label>
                <select
                  value={selectedDompetTujuanId}
                  onChange={(e) => setDompetTujuanId(e.target.value)}
                  disabled={!selectedDompetTujuanId}
                  className="w-full mt-1 p-3 bg-pink-50/30 border border-pink-200 rounded-2xl text-xs font-bold text-slate-700 focus:outline-none focus:border-pink-500"
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
                <label className="text-[11px] font-extrabold uppercase tracking-wider text-pink-500">
                  Kategori
                </label>
                <div className="mt-1 space-y-2">
                  <div className="flex gap-2">
                    <select
                      value={kategoriId}
                      onChange={(e) => setKategoriId(e.target.value)}
                      className="min-w-0 flex-1 rounded-2xl border border-pink-200 bg-pink-50/30 p-3 text-xs font-bold text-slate-700 focus:border-pink-500 focus:outline-none"
                    >
                      {kategoriOptions.map((kategori) => (
                        <option key={kategori.id} value={kategori.id}>
                          {kategori.nama}
                        </option>
                      ))}
                      <option value={OTHER_CATEGORY_OPTION_ID}>Lainnya...</option>
                    </select>
                    {kategoriOptions.some((kategori) => kategori.id === kategoriId) && (
                      <button
                        type="button"
                        title="Hapus kategori"
                        aria-label="Hapus kategori"
                        onClick={() => {
                          const selectedKategori = kategoriOptions.find(
                            (kategori) => kategori.id === kategoriId,
                          );
                          if (
                            selectedKategori &&
                            window.confirm(
                              `Hapus kategori "${selectedKategori.nama}" dari pilihan? Riwayat lama tetap tersimpan.`,
                            )
                          ) {
                            onDeleteCategory(kategoriId);
                            setKategoriId(
                              kategoriOptions.find((kategori) => kategori.id !== kategoriId)?.id ??
                                OTHER_CATEGORY_OPTION_ID,
                            );
                          }
                        }}
                        className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-rose-200 text-rose-500 transition-colors hover:bg-rose-50"
                      >
                        <Trash2 className="h-4 w-4" aria-hidden="true" />
                      </button>
                    )}
                  </div>
                  {kategoriId === OTHER_CATEGORY_OPTION_ID && (
                    <input
                      type="text"
                      value={customKategori}
                      onChange={(e) => setCustomKategori(e.target.value)}
                      placeholder="Tulis nama kategori baru"
                      maxLength={50}
                      required
                      className="w-full rounded-2xl border border-pink-200 bg-pink-50/30 p-3 text-xs font-bold text-slate-700 focus:border-pink-500 focus:outline-none"
                    />
                  )}
                </div>
              </div>
            )}
          </div>

          <div>
            <label className="text-[11px] font-extrabold uppercase tracking-wider text-pink-500">
              Catatan Jajan (Opsional)
            </label>
            <input
              type="text"
              value={catatan}
              onChange={(e) => setCatatan(e.target.value)}
              placeholder="Misal: Matcha Latte & Beli Skincare ✨"
              className="w-full mt-1 p-3 bg-pink-50/30 border border-pink-200 rounded-2xl text-xs font-medium text-slate-700 focus:outline-none focus:border-pink-500"
            />
          </div>

          <button
            type="submit"
            disabled={submitDisabled}
            className="flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-pink-500 via-rose-400 to-fuchsia-400 py-3.5 text-xs font-extrabold text-white transition-opacity hover:opacity-95 active:scale-[0.98] disabled:opacity-50 shadow-lg shadow-pink-500/25"
          >
            <Sparkles className="w-4 h-4 text-pink-100" />
            Simpan Transaksi Cantik
          </button>
        </form>
      </div>
    </div>
  );
}