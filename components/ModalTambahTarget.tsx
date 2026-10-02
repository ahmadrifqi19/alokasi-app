"use client";

import React, { useState } from "react";
import { X, Heart, Sparkles } from "lucide-react";
import { TargetTabungan } from "@/types";
import { COPY } from "@/lib/copy";

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
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-slate-900/40 backdrop-blur-sm p-3 sm:items-center sm:p-4">
      <div className="max-h-[85vh] w-full max-w-md space-y-5 overflow-y-auto overscroll-contain rounded-[2rem] border border-pink-100 bg-white p-5 shadow-2xl sm:p-6">
        
        {/* Header Modal */}
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-pink-50 text-pink-500 rounded-xl">
              <Heart className="w-5 h-5 fill-pink-500 text-pink-500" />
            </div>
            <div>
              <h2 className="text-base font-extrabold text-slate-800">
                {COPY.goal.add}
              </h2>
              <p className="text-[11px] text-pink-400 font-bold">{COPY.goal.subtitle}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 bg-pink-50 hover:bg-pink-100 text-pink-400 rounded-full transition-colors"
            aria-label={COPY.common.close}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-[10px] font-extrabold uppercase tracking-wider text-pink-500">
              {COPY.goal.name}
            </label>
            <input
              type="text"
              placeholder={COPY.goal.namePlaceholder}
              value={nama}
              onChange={(e) => setNama(e.target.value)}
              required
              className="w-full mt-1 p-3 bg-pink-50/30 border border-pink-200 rounded-2xl text-xs font-bold text-slate-800 focus:outline-none focus:border-pink-500"
            />
          </div>

          <div>
            <label className="text-[10px] font-extrabold uppercase tracking-wider text-pink-500">
              {COPY.goal.amount}
            </label>
            <input
              type="number"
              placeholder="0"
              value={targetNominal}
              onChange={(e) => setTargetNominal(e.target.value)}
              required
              className="w-full mt-1 p-3 bg-pink-50/30 border border-pink-200 rounded-2xl text-xs font-bold text-slate-800 focus:outline-none focus:border-pink-500"
            />
          </div>

          <div>
            <label className="text-[10px] font-extrabold uppercase tracking-wider text-pink-500">
              {COPY.goal.initialAmount}
            </label>
            <input
              type="number"
              placeholder="0"
              value={terkumpul}
              onChange={(e) => setTerkumpul(e.target.value)}
              className="w-full mt-1 p-3 bg-pink-50/30 border border-pink-200 rounded-2xl text-xs font-bold text-slate-800 focus:outline-none focus:border-pink-500"
            />
          </div>

          <button
            type="submit"
            className="flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-pink-500 via-rose-400 to-fuchsia-400 py-3.5 text-xs font-extrabold text-white transition-opacity hover:opacity-95 active:scale-[0.98] shadow-lg shadow-pink-500/25"
          >
            <Sparkles className="w-4 h-4 text-pink-100" />
            {COPY.goal.save}
          </button>
        </form>
      </div>
    </div>
  );
}