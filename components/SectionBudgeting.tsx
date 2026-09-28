import React from "react";
import { Flame } from "lucide-react";
import { AnggaranKategori, UserStreak } from "@/types";

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
  const formatRupiah = (angka: number) => {
    return `Rp ${new Intl.NumberFormat("id-ID", {
      maximumFractionDigits: 0,
    }).format(angka)}`;
  };

  return (
    <div className="space-y-4">
      {/* BADGE STREAK BANNER */}
      <div className="flex items-center justify-between gap-3 rounded-2xl border border-amber-200/70 bg-amber-50 p-4">
        <div>
          <p className="flex items-center gap-1.5 text-xs font-semibold text-slate-800">
            <Flame className="h-4 w-4 text-amber-600" aria-hidden="true" />
            {streak.currentStreak} hari berturut-turut
          </p>
          <p className="mt-1 text-[10px] text-slate-500">
            Catatan keuangan harian
          </p>
        </div>
        <span className="rounded-full border border-amber-200 bg-white px-3 py-1 text-xs font-semibold text-slate-700">
          {streak.poin} Poin
        </span>
      </div>

      {/* ANGGARAN BULANAN */}
      <section>
        <div className="flex justify-between items-center mb-3 px-1">
          <h2 className="text-xs font-black text-slate-400 uppercase tracking-widest">
            Anggaran Bulanan (Budget Guard)
          </h2>
          <button
            onClick={onOpenModalLimit}
            className="text-xs font-bold text-blue-600 hover:text-blue-700"
          >
            + Atur Limit
          </button>
        </div>

        <div className="divide-y divide-slate-100 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          {daftarAnggaran.map((ang) => {
            const sisa = ang.limitBulanan - ang.terpakai;
            const persentase = Math.min(
              Math.round((ang.terpakai / ang.limitBulanan) * 100),
              100
            );

            return (
              <div key={ang.id} className="p-4 space-y-2">
                <div className="flex justify-between items-center">
                  <div>
                    <p className="text-xs font-bold text-slate-800">
                      {ang.namaKategori}
                    </p>
                    <p className="text-[10px] text-slate-400">
                      Limit: {formatRupiah(ang.limitBulanan)} / bulan
                    </p>
                  </div>
                  <span
                    className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full ${
                      sisa < 0
                        ? "bg-rose-50 text-rose-600"
                        : "bg-emerald-50 text-emerald-600"
                    }`}
                  >
                    {sisa < 0 ? "Overbudget" : "Aman"}
                  </span>
                </div>

                <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full ${
                      persentase > 90 ? "bg-rose-500" : "bg-blue-500"
                    }`}
                    style={{ width: `${persentase}%` }}
                  />
                </div>

                <div className="flex justify-between text-[10px] text-slate-400 font-medium">
                  <span>Terpakai: {formatRupiah(ang.terpakai)}</span>
                  <span>Sisa: {formatRupiah(sisa)}</span>
                </div>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}