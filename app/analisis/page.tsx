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
  Heart,
} from "lucide-react";

import {
  subscribeFirebaseTransactions,
  DashboardTransaction,
} from "@/lib/firestore-sync";
import { getFinancialInsight } from "@/lib/gemini";
import { getCategoryName } from "@/lib/category-options";

export default function AnalisisPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  // State Transaksi & Real-time Metrics
  const [transactions, setTransactions] = useState<DashboardTransaction[]>([]);
  const [aiInsight, setAiInsight] = useState<string>(
    "Klik 'Minta Saran' biar AI kasih tips keuangan estetik buat kamu, Babe! ✨"
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
  const getNamaKategori = (kategoriId?: string, fallback?: string) =>
    getCategoryName(kategoriId) ||
    fallback ||
    "Jajan Lainnya ✨";

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
      const namaKategori = getNamaKategori(t.kategoriId, t.catatan);
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
      setAiInsight("Belum ada data jajan yang dicatat nih, yuk catat transaksi dulu! 🌸");
      return;
    }

    setIsGeneratingAi(true);
    try {
      const summaryText = transactions
        .slice(0, 10)
        .map((t) => {
          const cat = getNamaKategori(t.kategoriId, t.catatan);
          const nom = getNominal(t);
          return `${t.tipe === "expense" ? "Pengeluaran" : "Pemasukan"} ${cat}: Rp${nom}`;
        })
        .join(", ");

      const res = await getFinancialInsight(summaryText);
      setAiInsight(res);
    } catch (error) {
      console.error("Gagal mendapatkan saran AI:", error);
      setAiInsight(
        "Saran belum tersedia. Silakan coba lagi sebentar ya, Cantik! 💕"
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
      <div className="flex min-h-screen items-center justify-center bg-[#FFF0F5] text-pink-500">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-pink-500" />
          <p className="text-xs font-semibold text-pink-400">
            Menganalisis Keuangan Cantik Kamu...
          </p>
        </div>
      </div>
    );
  }

  return (
    <main className="relative mx-auto min-h-screen w-full max-w-md bg-[#FFF0F5] pb-36 text-slate-800 font-sans antialiased overflow-hidden">
      {/* BACKGROUND AMBIENT GLOW PINK & ROSE */}
      <div className="fixed top-[-10%] left-[-15%] w-[130%] h-[400px] bg-gradient-to-br from-pink-300/60 via-rose-200/50 to-fuchsia-200/60 blur-[110px] pointer-events-none rounded-full" />
      <div className="fixed top-[40%] right-[-10%] w-[300px] h-[300px] bg-pink-200/50 blur-[90px] pointer-events-none rounded-full" />

      {/* TOP BAR */}
      <header className="flex items-center justify-between px-6 pt-8 pb-4 relative z-10">
        <Link
          href="/"
          className="p-2.5 bg-white/80 hover:bg-pink-50 border border-pink-100 rounded-full text-pink-400 hover:text-pink-600 transition-all shadow-xs"
        >
          <ArrowLeft className="w-4 h-4" />
        </Link>
        <h1 className="text-base font-extrabold text-slate-800 tracking-tight flex items-center gap-1.5">
          <Heart className="w-4 h-4 fill-pink-500 text-pink-500" /> Analisis Keuangan
        </h1>
        <div className="w-9" />
      </header>

      <div className="px-6 space-y-6 relative z-10 mt-2">
        {/* INSIGHT KEUANGAN AI */}
        <section className="space-y-3 rounded-[2rem] border border-pink-100/80 bg-white/80 backdrop-blur-2xl p-5 shadow-xs">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-pink-50 text-pink-500 rounded-xl">
                <Sparkles className="w-4 h-4" />
              </div>
              <span className="text-[11px] font-extrabold tracking-wider uppercase text-pink-400">
                AI Financial Advisor ✨
              </span>
            </div>
            <button
              onClick={handleFetchAiAdvice}
              disabled={isGeneratingAi}
              className="flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-pink-500 to-rose-400 px-3.5 py-2 text-xs font-extrabold text-white transition-opacity hover:opacity-95 active:scale-95 disabled:opacity-50 shadow-md shadow-pink-500/20"
            >
              {isGeneratingAi ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" /> Menganalisis...
                </>
              ) : (
                <>
                  <Sparkles className="w-3.5 h-3.5" /> Minta Saran 💖
                </>
              )}
            </button>
          </div>

          <p className="pt-1 text-xs font-bold leading-relaxed text-slate-700">
            {aiInsight}
          </p>
        </section>

        {/* CARD 2: ARUS KAS BULAN INI */}
        <section className="bg-white/80 backdrop-blur-2xl p-5 rounded-[2rem] shadow-xs border border-pink-100/80 space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-xs font-black text-slate-800 uppercase tracking-wider">
              Arus Kas Bulan Ini 📊
            </h2>
            <span className="text-[10px] text-pink-400 font-extrabold">
              Real-time
            </span>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="p-3.5 bg-emerald-50/70 rounded-2xl border border-emerald-100/80 space-y-1">
              <div className="flex items-center gap-1.5 text-emerald-600 text-[10px] font-extrabold uppercase">
                <TrendingUp className="w-3.5 h-3.5" /> Income 🌸
              </div>
              <p className="text-sm font-black text-slate-900">
                {formatRupiah(totalPemasukan)}
              </p>
            </div>

            <div className="p-3.5 bg-rose-50/70 rounded-2xl border border-rose-100/80 space-y-1">
              <div className="flex items-center gap-1.5 text-rose-500 text-[10px] font-extrabold uppercase">
                <TrendingDown className="w-3.5 h-3.5" /> Jajan Day 💸
              </div>
              <p className="text-sm font-black text-slate-900">
                {formatRupiah(totalPengeluaran)}
              </p>
            </div>
          </div>

          <div className="flex justify-between items-center pt-2 border-t border-pink-50 px-1">
            <span className="text-xs font-extrabold text-slate-700 flex items-center gap-1.5">
              <Wallet className="w-4 h-4 text-pink-500" /> Sisa Surplus Bersih
            </span>
            <span
              className={`text-xs font-black ${
                surplusBersih >= 0 ? "text-emerald-600" : "text-rose-500"
              }`}
            >
              {formatRupiah(surplusBersih)}
            </span>
          </div>
        </section>

        {/* CARD 3: PENGELUARAN PER KATEGORI */}
        <section className="bg-white/80 backdrop-blur-2xl p-5 rounded-[2rem] shadow-xs border border-pink-100/80 space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-xs font-black text-slate-800 uppercase tracking-wider">
              Pengeluaran Per Kategori 🛍️
            </h2>
            <PieChart className="w-4 h-4 text-pink-400" />
          </div>

          {kategoriList.length === 0 ? (
            <div className="p-6 text-center text-xs text-pink-400 font-semibold">
              Belum ada pengeluaran tercatat bulan ini. ✨
            </div>
          ) : (
            <div className="space-y-3.5">
              {kategoriList.map((kat, index) => (
                <div key={index} className="space-y-1.5">
                  <div className="flex justify-between text-xs font-extrabold text-slate-800">
                    <span>{kat.nama}</span>
                    <span className="text-pink-400">
                      {formatRupiah(kat.nominal)}{" "}
                      <span className="text-pink-500 font-black">
                        • {kat.persentase}%
                      </span>
                    </span>
                  </div>

                  <div className="w-full bg-pink-50/80 border border-pink-100/50 h-2.5 rounded-full overflow-hidden p-0.5">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        index % 3 === 0
                          ? "bg-rose-400"
                          : index % 3 === 1
                          ? "bg-fuchsia-400"
                          : "bg-pink-500"
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

      <BottomNavigation activePage="analysis" />
    </main>
  );
}