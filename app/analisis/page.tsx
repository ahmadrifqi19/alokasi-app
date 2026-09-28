"use client";

import React, { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import Link from "next/link";
import BottomNavigation from "@/components/BottomNavigation";
import {
  ArrowLeft,
  Sparkles,
  TrendingUp,
  TrendingDown,
  Wallet,
  Loader2,
  PieChart,
} from "lucide-react";

import {
  subscribeFirebaseTransactions,
  DashboardTransaction,
} from "@/lib/firestore-sync";
import { getFinancialInsight } from "@/lib/gemini";

// Helper Mapping Nama Kategori berdasarkan ID Kategori
const KATEGORI_MAP: Record<string, string> = {
  k1: "Makanan & Kopi",
  k2: "Hiburan & Nonton",
  k3: "Belanja",
  k4: "Kebutuhan Harian",
  k5: "Transportasi",
  k6: "Tagihan & Utilitas",
};

export default function AnalisisPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  // State Transaksi & Real-time Metrics
  const [transactions, setTransactions] = useState<DashboardTransaction[]>([]);
  const [aiInsight, setAiInsight] = useState<string>(
    "Pilih Minta saran untuk mendapatkan ringkasan pengeluaran Anda."
  );
  const [isGeneratingAi, setIsGeneratingAi] = useState(false);

  // Guard Route: Redirect jika belum login
  useEffect(() => {
    if (!loading && !user) {
      router.push("/login");
    }
  }, [user, loading, router]);

  // Subscribe ke Firestore Transactions Real-time
  useEffect(() => {
    if (!user) return;

    const unsubscribe = subscribeFirebaseTransactions(user.uid, (data) => {
      setTransactions(data);
    });

    return () => unsubscribe();
  }, [user]);

  // ------------------------------------------------------------------
  // KALKULASI DINAMIS DARI FIRESTORE (DENGAN FALLBACK AMAN)
  // ------------------------------------------------------------------
  const getNominal = (transaction: DashboardTransaction): number =>
    transaction.nominal;

  const totalPemasukan = transactions
    .filter((t) => t.tipe === "income")
    .reduce((acc, t) => acc + getNominal(t), 0);

  const totalPengeluaran = transactions
    .filter((t) => t.tipe === "expense")
    .reduce((acc, t) => acc + getNominal(t), 0);

  const surplusBersih = totalPemasukan - totalPengeluaran;

  // Grouping Pengeluaran berdasarkan Kategori
  const pengeluaranPerKategoriMap = transactions
    .filter((t) => t.tipe === "expense")
    .reduce((acc, t) => {
      const namaKategori =
        KATEGORI_MAP[t.kategoriId || ""] ||
        t.catatan ||
        "Lainnya";
      const nominal = getNominal(t);
      acc[namaKategori] = (acc[namaKategori] || 0) + nominal;
      return acc;
    }, {} as Record<string, number>);

  const kategoriList = Object.entries(pengeluaranPerKategoriMap).map(
    ([nama, nominal]) => ({
      nama,
      nominal,
      persentase:
        totalPengeluaran > 0
          ? Math.round((nominal / totalPengeluaran) * 100)
          : 0,
    })
  );

  // Sorting dari pengeluaran terbesar
  kategoriList.sort((a, b) => b.nominal - a.nominal);

  // Request a financial insight.
  const handleFetchAiAdvice = async () => {
    if (transactions.length === 0) {
      setAiInsight("Belum ada data transaksi yang dicatat untuk dianalisis.");
      return;
    }

    setIsGeneratingAi(true);
    try {
      const summaryText = transactions
        .slice(0, 10)
        .map((t) => {
          const cat =
            KATEGORI_MAP[t.kategoriId || ""] ||
            t.catatan ||
            "Lainnya";
          const nom = getNominal(t);
          return `${t.tipe === "expense" ? "Pengeluaran" : "Pemasukan"} ${cat}: Rp${nom}`;
        })
        .join(", ");

      const res = await getFinancialInsight(summaryText);
      setAiInsight(res);
    } catch (error) {
      console.error("Gagal mendapatkan saran AI:", error);
      setAiInsight(
        "Saran belum tersedia. Silakan coba lagi sebentar."
      );
    } finally {
      setIsGeneratingAi(false);
    }
  };

  const formatRupiah = (angka: number) => {
    return `Rp ${new Intl.NumberFormat("id-ID", {
      maximumFractionDigits: 0,
    }).format(angka)}`;
  };

  if (loading || !user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-900 text-sky-400">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-sky-500" />
          <p className="text-xs font-semibold text-slate-400">
            Menyiapkan Analisis Keuangan...
          </p>
        </div>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-[#F8FAFC] pb-36 text-slate-800 font-sans antialiased">

      {/* TOP BAR */}
      <header className="flex items-center justify-between px-6 pt-8 pb-4">
        <Link
          href="/"
          className="p-2.5 bg-white hover:bg-slate-50 border border-slate-100 rounded-full text-slate-600 transition-all shadow-sm"
        >
          <ArrowLeft className="w-4 h-4" />
        </Link>
        <h1 className="text-base font-bold text-slate-800 tracking-tight">
          Analisis Keuangan
        </h1>
        <div className="w-9" />
      </header>

      <div className="px-6 space-y-6 relative z-10 mt-2">
        {/* INSIGHT KEUANGAN */}
        <section className="space-y-3 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-blue-600" />
              <span className="text-[11px] font-semibold tracking-wider uppercase text-slate-500">
                Insight Keuangan
              </span>
            </div>
            <button
              onClick={handleFetchAiAdvice}
              disabled={isGeneratingAi}
              className="flex items-center gap-1.5 rounded-lg bg-blue-600 px-3 py-2 text-xs font-semibold text-white transition-colors hover:bg-blue-700 active:scale-95 disabled:opacity-50"
            >
              {isGeneratingAi ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" /> Menganalisis...
                </>
              ) : (
                <>
                  <Sparkles className="w-3.5 h-3.5" /> Minta saran
                </>
              )}
            </button>
          </div>

          <p className="pt-1 text-xs font-medium leading-relaxed text-slate-600">
            {aiInsight}
          </p>
        </section>

        {/* CARD 2: ARUS KAS BULAN INI */}
        <section className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
              Arus Kas Bulan Ini
            </h2>
            <span className="text-[10px] text-slate-400 font-semibold">
              Berdasarkan transaksi tersimpan
            </span>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="p-3.5 bg-emerald-50 rounded-xl border border-emerald-100/80 space-y-1">
              <div className="flex items-center gap-1.5 text-emerald-600 text-[10px] font-bold uppercase">
                <TrendingUp className="w-3.5 h-3.5" /> Pemasukan
              </div>
              <p className="text-sm font-bold text-slate-900">
                {formatRupiah(totalPemasukan)}
              </p>
            </div>

            <div className="p-3.5 bg-rose-50 rounded-xl border border-rose-100/80 space-y-1">
              <div className="flex items-center gap-1.5 text-rose-500 text-[10px] font-bold uppercase">
                <TrendingDown className="w-3.5 h-3.5" /> Pengeluaran
              </div>
              <p className="text-sm font-bold text-slate-900">
                {formatRupiah(totalPengeluaran)}
              </p>
            </div>
          </div>

          <div className="flex justify-between items-center pt-2 border-t border-slate-100 px-1">
            <span className="text-xs font-bold text-slate-600 flex items-center gap-1.5">
              <Wallet className="w-4 h-4 text-blue-600" /> Surplus bersih
            </span>
            <span
              className={`text-xs font-extrabold ${
                surplusBersih >= 0 ? "text-emerald-600" : "text-rose-600"
              }`}
            >
              {formatRupiah(surplusBersih)}
            </span>
          </div>
        </section>

        {/* CARD 3: PENGELUARAN PER KATEGORI */}
        <section className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
              Pengeluaran Per Kategori
            </h2>
            <PieChart className="w-4 h-4 text-slate-400" />
          </div>

          {kategoriList.length === 0 ? (
            <div className="p-6 text-center text-xs text-slate-400 font-medium">
              Belum ada pengeluaran tercatat bulan ini.
            </div>
          ) : (
            <div className="space-y-3.5">
              {kategoriList.map((kat, index) => (
                <div key={index} className="space-y-1.5">
                  <div className="flex justify-between text-xs font-bold text-slate-800">
                    <span>{kat.nama}</span>
                    <span className="text-slate-500">
                      {formatRupiah(kat.nominal)}{" "}
                      <span className="text-blue-600 font-bold">
                        • {kat.persentase}%
                      </span>
                    </span>
                  </div>

                  <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        index % 3 === 0
                          ? "bg-rose-500"
                          : index % 3 === 1
                          ? "bg-amber-500"
                          : "bg-blue-500"
                      }`}
                      style={{ width: `${Math.min(kat.persentase, 100)}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>

      <BottomNavigation activePage="analytics" />
    </main>
  );
}