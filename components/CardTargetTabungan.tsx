"use client";

import React from "react";
import { Target, CheckCircle2 } from "lucide-react";
import { TargetTabungan } from "@/types";

interface Props {
  target: TargetTabungan;
  onTambahAlokasi?: (id: string) => void;
}

export default function CardTargetTabungan({ target }: Props) {
  const persentase = Math.min(
    Math.round((target.terkumpul / target.targetNominal) * 100),
    100
  );

  const formatRupiah = (angka: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      maximumFractionDigits: 0,
    }).format(angka);
  };

  return (
    <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm space-y-3">
      <div className="flex justify-between items-start">
        <div className="flex items-center gap-2.5">
          <div className="p-2 bg-blue-50 text-blue-600 rounded-xl">
            <Target className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-xs font-bold text-slate-800">{target.nama}</h3>
            <p className="text-[11px] text-slate-400">
              Target: {formatRupiah(target.targetNominal)}
            </p>
          </div>
        </div>
        
        {persentase >= 100 ? (
          <span className="flex items-center gap-1 text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-1 rounded-full">
            <CheckCircle2 className="w-3 h-3" /> Selesai
          </span>
        ) : (
          <span className="text-xs font-black text-blue-600">{persentase}%</span>
        )}
      </div>

      {/* Progress Bar Visual */}
      <div className="space-y-1">
        <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
          <div
            className="bg-blue-600 h-full rounded-full transition-all duration-500"
            style={{ width: `${persentase}%` }}
          />
        </div>
        <div className="flex justify-between text-[10px] font-medium text-slate-400">
          <span>Terkumpul: {formatRupiah(target.terkumpul)}</span>
          <span>Sisa: {formatRupiah(Math.max(0, target.targetNominal - target.terkumpul))}</span>
        </div>
      </div>
    </div>
  );
}