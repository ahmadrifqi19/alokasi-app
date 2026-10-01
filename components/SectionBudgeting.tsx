"use client";

import React from "react";
import { Award, Flame, Sparkles, Heart } from "lucide-react";
import { AnggaranKategori, UserStreak } from "@/types";
import { getBadgeProgress } from "@/lib/gamification";

interface SectionBudgetingProps {
  streak: UserStreak;
  daftarAnggaran: AnggaranKategori[];
  onOpenModalLimit?: () => void;
}

export default function SectionBudgeting({
  streak,
  daftarAnggaran,
  onOpenModalLimit,
}: SectionBudgetingProps) {
  const badgeProgress = getBadgeProgress(streak.poin);
  const formatRupiah = (angka: number) => {
    return `Rp ${new Intl.NumberFormat("id-ID", {
      maximumFractionDigits: 0,
    }).format(angka)}`;
  };

  return (
    <div className="space-y-4">
      {/* BADGE STREAK BANNER PINK & ROSE */}
      <div className="flex items-center justify-between gap-3 rounded-2xl border border-pink-200/80 bg-gradient-to-r from-pink-50 via-rose-50 to-fuchsia-50 p-4 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-white/80 rounded-2xl border border-pink-100 shadow-2xs">
            <Award className="h-5 w-5 text-rose-500" aria-hidden="true" />
          </div>
          <div>
            <p className="flex items-center gap-1.5 text-xs font-extrabold text-slate-800">
              <Flame className="h-3.5 w-3.5 text-rose-500" aria-hidden="true" />
              {streak.currentStreak > 0
                ? `${streak.currentStreak} Hari Rajin Catat Jajan!`
                : "Mulai streak catat jajan hari ini!"}
            </p>
            <p className="mt-0.5 text-[10px] font-semibold text-pink-500">
              Badge {streak.badgeLevel}
              {badgeProgress.nextLevel
                ? ` · ${badgeProgress.pointsRemaining} poin menuju ${badgeProgress.nextLevel}`
                : " · Level tertinggi tercapai"}
            </p>
          </div>
        </div>
        <div className="flex flex-col items-end gap-1">
          <span className="rounded-full border border-pink-200/80 bg-white/90 px-3 py-1 text-xs font-extrabold text-pink-500 shadow-2xs flex items-center gap-1">
            <Sparkles className="w-3 h-3 text-pink-400" /> {streak.poin} Poin
          </span>
          {badgeProgress.nextLevel && (
            <span className="text-[9px] font-bold text-pink-400">
              {badgeProgress.percentage}%
            </span>
          )}
        </div>
      </div>

      {/* ANGGARAN BULANAN (BUDGET GUARD) */}
      <section>
        <div className="flex justify-between items-center mb-3 px-1">
          <h2 className="text-xs font-black text-pink-400 uppercase tracking-widest flex items-center gap-1.5">
            <Heart className="w-3.5 h-3.5 fill-pink-400 text-pink-400" /> Limit Jajan Bulanan
          </h2>
          <button
            type="button"
            onClick={onOpenModalLimit}
            className="text-xs font-extrabold text-pink-500 hover:text-pink-600 transition-colors"
          >
            + Atur Limit
          </button>
        </div>

        <div className="divide-y divide-pink-50 overflow-hidden rounded-[2rem] border border-pink-100/80 bg-white/80 backdrop-blur-2xl shadow-xs">
          {daftarAnggaran.length === 0 ? (
            <div className="p-5 text-center text-xs text-pink-400 font-medium">
              Belum ada limit anggaran. Klik + Atur Limit untuk membuat batasan jajan! ✨
            </div>
          ) : (
            daftarAnggaran.map((ang) => {
              const sisa = ang.limitBulanan - ang.terpakai;
              const persentase = Math.min(
                Math.round((ang.terpakai / ang.limitBulanan) * 100),
                100
              );

              return (
                <div key={ang.id || ang.kategoriId} className="p-4 space-y-2 hover:bg-pink-50/20 transition-colors">
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="text-xs font-extrabold text-slate-800">
                        {ang.namaKategori}
                      </p>
                      <p className="text-[10px] font-bold text-pink-400">
                        Limit: {formatRupiah(ang.limitBulanan)} / bulan
                      </p>
                    </div>
                    <span
                      className={`text-[10px] font-extrabold px-2.5 py-0.5 rounded-full border ${
                        sisa < 0
                          ? "bg-rose-50 text-rose-600 border-rose-100"
                          : "bg-emerald-50 text-emerald-600 border-emerald-100"
                      }`}
                    >
                      {sisa < 0 ? "Overbudget 🚨" : "Aman ✨"}
                    </span>
                  </div>

                  {/* Progress Bar Visual Pink Gradient */}
                  <div className="w-full bg-pink-50 border border-pink-100/60 h-2.5 rounded-full overflow-hidden p-0.5">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        persentase > 90
                          ? "bg-rose-500"
                          : "bg-gradient-to-r from-pink-500 via-rose-400 to-fuchsia-400"
                      }`}
                      style={{ width: `${persentase}%` }}
                    />
                  </div>

                  <div className="flex justify-between text-[10px] font-bold text-pink-400/90">
                    <span>Terpakai: {formatRupiah(ang.terpakai)}</span>
                    <span>Sisa: {formatRupiah(sisa)}</span>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </section>
    </div>
  );
}