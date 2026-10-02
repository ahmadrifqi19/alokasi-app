"use client";

import React from "react";
import { Sparkles, CheckCircle2, Heart } from "lucide-react";
import { TargetTabungan } from "@/types";
import { COPY } from "@/lib/copy";

interface Props {
  target: TargetTabungan;
  onTambahAlokasi?: (id: string) => void;
}

export default function CardTargetTabungan({ target }: Props) {
  const namaGoal = target.nama || COPY.goal.title;
  
  const persentase = Math.min(
    Math.round((target.terkumpul / target.targetNominal) * 100),
    100
  );

  const formatRupiah = (angka: number) => {
    return `Rp ${new Intl.NumberFormat("id-ID", {
      maximumFractionDigits: 0,
    }).format(angka)}`;
  };

  return (
    <div className="bg-white/90 backdrop-blur-md p-4 rounded-3xl border border-pink-100/80 shadow-sm hover:border-pink-200 transition-all space-y-3">
      <div className="flex justify-between items-start">
        <div className="flex items-center gap-2.5">
          <div className="p-2.5 bg-pink-50 text-pink-500 border border-pink-100/80 rounded-2xl">
            <Heart className="w-4 h-4 fill-pink-500 text-pink-500" />
          </div>
          <div>
            <h3 className="text-xs font-extrabold text-slate-800 flex items-center gap-1">
              {namaGoal}
            </h3>
            <p className="text-[11px] font-bold text-pink-400 mt-0.5">
              {COPY.goal.target}: {formatRupiah(target.targetNominal)}
            </p>
          </div>
        </div>
        
        {persentase >= 100 ? (
            <span className="flex items-center gap-1 text-[10px] font-extrabold text-emerald-600 bg-emerald-50 border border-emerald-100 px-2.5 py-1 rounded-full shadow-2xs">
            <CheckCircle2 className="w-3 h-3 text-emerald-500" /> {COPY.goal.completed}
          </span>
        ) : (
          <span className="text-xs font-black text-pink-500 flex items-center gap-0.5 bg-pink-50 border border-pink-100 px-2.5 py-1 rounded-full">
            <Sparkles className="w-3 h-3 text-pink-400" /> {persentase}%
          </span>
        )}
      </div>

      {/* Progress Bar Visual Pink Gradient */}
      <div className="space-y-1.5 pt-1">
        <div className="w-full bg-pink-50/80 border border-pink-100/50 h-3 rounded-full overflow-hidden p-0.5">
          <div
            className="bg-gradient-to-r from-pink-500 via-rose-400 to-fuchsia-400 h-full rounded-full transition-all duration-500 shadow-xs"
            style={{ width: `${persentase}%` }}
          />
        </div>
        <div className="flex justify-between text-[10px] font-bold text-pink-400/90 px-0.5">
          <span>{COPY.goal.collected}: {formatRupiah(target.terkumpul)}</span>
          <span>{COPY.goal.remaining}: {formatRupiah(Math.max(0, target.targetNominal - target.terkumpul))}</span>
        </div>
      </div>
    </div>
  );
}