"use client";

import React, { useState, useRef, useEffect } from "react";
import {
  Plus,
  ArrowUpRight,
  ArrowDownLeft,
  ArrowRightLeft,
  TrendingUp,
  TrendingDown,
  ArrowDownToLine,
  ArrowUpFromLine,
  Loader2,
  LogOut,
  Wallet,
  CreditCard,
  Sparkles,
  X,
  PiggyBank,
  ShoppingBag,
} from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";

// Import Auth & Firestore Context
import { useAuth } from "@/context/AuthContext";
import {
  subscribeFirebaseTransactions,
  saveFirebaseTransaction,
  subscribeFirebaseWallets,
  saveFirebaseWallet,
  saveFirebaseWallets,
  deleteFirebaseWallet,
  subscribeFirebaseBudgets,
  saveFirebaseBudget,
  subscribeFirebaseGoals,
  subscribeFirebaseUserStreak,
  subscribeFirebaseArchivedCategories,
  saveFirebaseCategory,
  archiveFirebaseCategory,
  saveFirebaseGoal,
  setorKeTargetTabungan,
  DashboardTransaction,
  TargetTabungan,
} from "@/lib/firestore-sync";

// Import Komponen Modal
import FormCatatTransaksi from "@/components/FormCatatTransaksi";
import BottomNavigation from "@/components/BottomNavigation";
import ModalKelolaDompet from "@/components/ModalKelolaDompet";
import ModalTambahTarget from "@/components/ModalTambahTarget";
import CardTargetTabungan from "@/components/CardTargetTabungan";
import SectionBudgeting from "@/components/SectionBudgeting";
import ModalExportLaporan from "@/components/ModalExportLaporan";
import ModalAturLimit from "@/components/ModalAturLimit";
import {
  CUSTOM_CATEGORY_PREFIX,
  DEFAULT_CATEGORY_OPTIONS,
  getCategoryName,
} from "@/lib/category-options";

// Import OCR Helper Gemini AI
import { analyzeReceiptImage } from "@/lib/gemini";
import { COPY, formatTanggalIndonesia } from "@/lib/copy";

// Import Types
import { Dompet, AnggaranKategori, UserStreak, TipeTransaksi } from "@/types";

interface ReceiptDraft {
  nominal: number;
  catatan: string;
  kategoriId: string;
}

export default function DashboardAlokasi() {
  const { user, loading, logout } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.push("/login");
    }
  }, [user, loading, router]);

  // ----------------------------------------------------
  // 1. STATE MODAL & LOADING
  // ----------------------------------------------------
  const [isModalTransaksiOpen, setIsModalTransaksiOpen] = useState(false);
  const [isModalDompetOpen, setIsModalDompetOpen] = useState(false);
  const [isModalTargetOpen, setIsModalTargetOpen] = useState(false);
  const [isModalExportOpen, setIsModalExportOpen] = useState(false);
  const [isModalLimitOpen, setIsModalLimitOpen] = useState(false);

  // State Modal Setor Tabungan
  const [isSetorOpen, setIsSetorOpen] = useState(false);
  const [selectedGoal, setSelectedGoal] = useState<TargetTabungan | null>(null);
  const [setorNominal, setSetorNominal] = useState("");
  const [selectedWalletId, setSelectedWalletId] = useState("");
  const [isSubmittingSetor, setIsSubmittingSetor] = useState(false);
  const [setorError, setSetorError] = useState("");

  const [isScanningOCR, setIsScanningOCR] = useState(false);
  const [walletsLoadedByUser, setWalletsLoadedByUser] = useState<Record<string, boolean>>({});
  const [receiptDraft, setReceiptDraft] = useState<ReceiptDraft | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // ----------------------------------------------------
  // 2. STATE DATA REAL-TIME FIREBASE PER AKUN
  // ----------------------------------------------------
  const [walletsByUser, setWalletsByUser] = useState<Record<string, Dompet[]>>({});
  const daftarDompet = user ? walletsByUser[user.uid] ?? [] : [];
  const isLoadingWallets = !user || walletsLoadedByUser[user.uid] !== true;

  const [daftarTransaksi, setDaftarTransaksi] = useState<DashboardTransaction[]>([]);
  const [daftarTarget, setDaftarTarget] = useState<TargetTabungan[]>([]);
  const [archivedCategoryIds, setArchivedCategoryIds] = useState<string[]>([]);
  const [filterRiwayat, setFilterRiwayat] = useState<"all" | "7days" | "30days" | "custom">("all");
  const [tanggalMulaiRiwayat, setTanggalMulaiRiwayat] = useState("");
  const [tanggalAkhirRiwayat, setTanggalAkhirRiwayat] = useState("");

  const [userStreak, setUserStreak] = useState<UserStreak>({
    currentStreak: 0,
    longestStreak: 0,
    poin: 0,
    badgeLevel: "Bronze",
  });

  const [daftarAnggaran, setDaftarAnggaran] = useState<AnggaranKategori[]>([
    { id: "b1", kategoriId: "k1", namaKategori: COPY.categories.food, limitBulanan: 1500000, terpakai: 0 },
    { id: "b2", kategoriId: "k2", namaKategori: COPY.categories.personal, limitBulanan: 500000, terpakai: 0 },
  ]);

  const kategoriManualMap = new Map<string, string>();
  const archivedCategorySet = new Set(archivedCategoryIds);
  daftarTransaksi.forEach((transaksi) => {
    const kategoriId = transaksi.kategoriId || "";
    if (
      kategoriId.startsWith(CUSTOM_CATEGORY_PREFIX) &&
      !archivedCategorySet.has(kategoriId)
    ) {
      kategoriManualMap.set(
        kategoriId,
        kategoriId.slice(CUSTOM_CATEGORY_PREFIX.length),
      );
    }
  });
  daftarAnggaran.forEach((anggaran) => {
    if (
      anggaran.kategoriId.startsWith(CUSTOM_CATEGORY_PREFIX) &&
      !archivedCategorySet.has(anggaran.kategoriId) &&
      !kategoriManualMap.has(anggaran.kategoriId)
    ) {
      kategoriManualMap.set(anggaran.kategoriId, anggaran.namaKategori);
    }
  });
  const kategoriManual = Array.from(kategoriManualMap, ([id, nama]) => ({ id, nama }));
  const daftarAnggaranAktif = daftarAnggaran.filter(
    (anggaran) => !archivedCategorySet.has(anggaran.kategoriId),
  );

  useEffect(() => {
    if (!user) return;

    const unsubTrans = subscribeFirebaseTransactions(user.uid, (data) => {
      setDaftarTransaksi(data);
    });

    const unsubWallets = subscribeFirebaseWallets(user.uid, (wallets) => {
      setWalletsByUser((current) => ({ ...current, [user.uid]: wallets }));
      setWalletsLoadedByUser((current) => ({ ...current, [user.uid]: true }));
    });

    const unsubBudgets = subscribeFirebaseBudgets(user.uid, (budgets) => {
      setDaftarAnggaran(budgets);
    });

    const unsubGoals = subscribeFirebaseGoals(user.uid, (goals) => {
      setDaftarTarget(goals);
    });
    const unsubStreak = subscribeFirebaseUserStreak(user.uid, (streak) => {
      setUserStreak(streak);
    });
    const unsubArchivedCategories = subscribeFirebaseArchivedCategories(
      user.uid,
      setArchivedCategoryIds,
    );

    return () => {
      unsubTrans();
      unsubWallets();
      unsubBudgets();
      unsubGoals();
      unsubStreak();
      unsubArchivedCategories();
    };
  }, [user]);

  // ----------------------------------------------------
  // 3. KALKULASI DINAMIS & REAKTIF SALDO
  // ----------------------------------------------------
  const totalPemasukanBulanIni = daftarTransaksi
    .filter((t) => t.tipe === "income")
    .reduce((acc, t) => acc + (t.nominal || 0), 0);

  const totalSaldo = daftarDompet.reduce((acc, d) => acc + d.saldo, 0);

  const pengeluaranHariIni = daftarTransaksi
    .filter((t) => t.tipe === "expense")
    .reduce((acc, t) => acc + (t.nominal || 0), 0);

  const formatRupiah = (angka: number) => {
    return `Rp ${new Intl.NumberFormat("id-ID", {
      maximumFractionDigits: 0,
    }).format(angka)}`;
  };

  const getNamaDompet = (id: string) => {
    return daftarDompet.find((d) => d.id === id)?.nama || COPY.wallet.title;
  };

  const getPengeluaranKategoriBulanIni = (
    kategoriId: string,
    referenceDate: Date,
  ) =>
    daftarTransaksi
      .filter((transaksi) => {
        const tanggal = transaksi.tanggalObj;
        return (
          transaksi.tipe === "expense" &&
          transaksi.kategoriId === kategoriId &&
          tanggal.getMonth() === referenceDate.getMonth() &&
          tanggal.getFullYear() === referenceDate.getFullYear()
        );
      })
      .reduce((total, transaksi) => total + transaksi.nominal, 0);

  // ----------------------------------------------------
  // 4. HANDLERS TRANSAKSI SINKRONISASI & SETOR TABUNGAN
  // ----------------------------------------------------
  const handleOpenSetor = (goal: TargetTabungan) => {
    setSelectedGoal(goal);
    setSetorNominal("");
    setSetorError("");
    if (daftarDompet.length > 0) {
      setSelectedWalletId(daftarDompet[0].id ?? "");
    }
    setIsSetorOpen(true);
  };

  const handleProcessSetorTabungan = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !selectedGoal) return;

    const nominalNum = Number(setorNominal);
    if (!nominalNum || nominalNum <= 0) {
      setSetorError(COPY.dashboard.depositAmountError);
      return;
    }

    if (!selectedWalletId) {
      setSetorError(COPY.dashboard.chooseWallet);
      return;
    }

    setIsSubmittingSetor(true);
    setSetorError("");

    try {
      await setorKeTargetTabungan({
        userId: user.uid,
        goalId: selectedGoal.id,
        goalNama: selectedGoal.namaGoal,
        walletId: selectedWalletId,
        nominal: nominalNum,
      });
      setIsSetorOpen(false);
      setSelectedGoal(null);
    } catch {
      setSetorError(COPY.dashboard.saveDepositError);
    } finally {
      setIsSubmittingSetor(false);
    }
  };

  const handleTriggerScan = () => {
    fileInputRef.current?.click();
  };

  const handleProcessReceipt = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const input = e.currentTarget;
    const file = e.target.files?.[0];
    input.value = "";
    if (!file) return;

    setIsScanningOCR(true);
    try {
      const dataUrl = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
          if (typeof reader.result === "string") resolve(reader.result);
          else reject(new Error(COPY.dashboard.imageReadFailed));
        };
        reader.onerror = () =>
          reject(reader.error ?? new Error(COPY.dashboard.imageReadFailed));
        reader.readAsDataURL(file);
      });
      const [, base64] = dataUrl.split(",", 2);
      if (!base64) throw new Error(COPY.dashboard.invalidImage);

      const result = await analyzeReceiptImage(base64, file.type || "image/jpeg");
      const category = (result.kategori ?? "").toLocaleLowerCase("id-ID");
      const kategoriId = category.includes("transport")
        ? "k5"
        : category.includes("tagihan") || category.includes("utilitas")
          ? "k6"
          : category.includes("belanja")
            ? "k3"
            : "k1";
      setReceiptDraft({
        nominal: result.total,
        catatan: result.catatan || result.kategori || "",
        kategoriId,
      });
      setIsModalTransaksiOpen(true);
    } catch (error) {
      console.error("Gagal membaca struk:", error);
      alert(COPY.receipt.failed);
    } finally {
      setIsScanningOCR(false);
    }
  };

  const handleTambahTransaksi = async (data: {
    tipe: TipeTransaksi;
    nominal: number;
    dompetId: string;
    dompetTujuanId?: string;
    kategoriId?: string;
    catatan?: string;
    tanggal: Date;
  }) => {
    if (!user) return;
    if (data.kategoriId?.startsWith(CUSTOM_CATEGORY_PREFIX)) {
      setArchivedCategoryIds((current) =>
        current.filter((kategoriId) => kategoriId !== data.kategoriId),
      );
      await saveFirebaseCategory(user.uid, data.kategoriId);
    }

    const updatedDompet = daftarDompet.map((dompet) => {
      if (dompet.id === data.dompetId) {
        if (data.tipe === "expense") {
          return { ...dompet, saldo: dompet.saldo - data.nominal };
        } else if (data.tipe === "income") {
          return { ...dompet, saldo: dompet.saldo + data.nominal };
        } else if (data.tipe === "transfer") {
          return { ...dompet, saldo: dompet.saldo - data.nominal };
        }
      }
      if (data.tipe === "transfer" && dompet.id === data.dompetTujuanId) {
        return { ...dompet, saldo: dompet.saldo + data.nominal };
      }
      return dompet;
    });

    setWalletsByUser((current) => ({ ...current, [user.uid]: updatedDompet }));
    const changedWalletIds = new Set([
      data.dompetId,
      ...(data.tipe === "transfer" && data.dompetTujuanId
        ? [data.dompetTujuanId]
        : []),
    ]);
    await Promise.all(
      updatedDompet
        .filter((dompet) => dompet.id && changedWalletIds.has(dompet.id))
        .map((dompet) => saveFirebaseWallet(user.uid, dompet)),
    );

    if (data.tipe === "expense" && data.kategoriId) {
      const updatedAnggaran = daftarAnggaran.map((ang) => {
        if (ang.kategoriId === data.kategoriId) {
          const newTerpakai =
            getPengeluaranKategoriBulanIni(data.kategoriId, data.tanggal) +
            data.nominal;
          const updatedItem = { ...ang, terpakai: newTerpakai };
          saveFirebaseBudget(user.uid, updatedItem);
          return updatedItem;
        }
        return ang;
      });
      setDaftarAnggaran(updatedAnggaran);
    }

    const transaksiBaru: DashboardTransaction = {
      id: `t-${Date.now()}`,
      dompetId: data.dompetId,
      dompetTujuanId: data.dompetTujuanId || "",
      kategoriId: data.kategoriId || "",
      nominal: data.nominal,
      tipe: data.tipe,
      catatan: data.catatan || "",
      tanggalObj: data.tanggal,
      tanggalStr: formatTanggalIndonesia(data.tanggal),
    };

    await saveFirebaseTransaction(user.uid, transaksiBaru);
  };

  const handleTambahLimit = async (data: {
    kategoriId: string;
    namaKategori: string;
    limitBulanan: number;
  }) => {
    if (!user) return;
    if (data.kategoriId.startsWith(CUSTOM_CATEGORY_PREFIX)) {
      setArchivedCategoryIds((current) =>
        current.filter((kategoriId) => kategoriId !== data.kategoriId),
      );
      await saveFirebaseCategory(user.uid, data.kategoriId);
    }

    const sekarang = new Date();
    const terpakaiBulanIni = getPengeluaranKategoriBulanIni(
      data.kategoriId,
      sekarang,
    );
    let targetItem: AnggaranKategori | undefined;

    const updatedList = daftarAnggaran.map((ang) => {
      if (ang.kategoriId === data.kategoriId) {
        targetItem = {
          ...ang,
          limitBulanan: data.limitBulanan,
          terpakai: terpakaiBulanIni,
        };
        return targetItem;
      }
      return ang;
    });

    if (!targetItem) {
      targetItem = {
        id: `b-${Date.now()}`,
        kategoriId: data.kategoriId,
        namaKategori: data.namaKategori,
        limitBulanan: data.limitBulanan,
        terpakai: terpakaiBulanIni,
      };
      updatedList.push(targetItem);
    }

    setDaftarAnggaran(updatedList);
    await saveFirebaseBudget(user.uid, targetItem);
  };

  const handleHapusKategori = async (kategoriId: string) => {
    const isDefaultCategory = DEFAULT_CATEGORY_OPTIONS.some(
      (kategori) => kategori.id === kategoriId,
    );
    if (!user || (!isDefaultCategory && !kategoriManualMap.has(kategoriId))) return;
    setArchivedCategoryIds((current) =>
      current.includes(kategoriId) ? current : [...current, kategoriId],
    );
    await archiveFirebaseCategory(user.uid, kategoriId);
  };

  const handleLogout = async () => {
    await logout();
    router.push("/login");
  };

  const now = new Date();
  const awalHariIni = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const transaksiTerfilter = daftarTransaksi.filter((transaksi) => {
    if (filterRiwayat === "all") return true;

    if (filterRiwayat === "7days" || filterRiwayat === "30days") {
      const jumlahHari = filterRiwayat === "7days" ? 7 : 30;
      const tanggalMulai = new Date(awalHariIni);
      tanggalMulai.setDate(tanggalMulai.getDate() - jumlahHari + 1);
      return transaksi.tanggalObj >= tanggalMulai;
    }

    const tanggal = transaksi.tanggalObj;
    if (tanggalMulaiRiwayat) {
      const batasMulai = new Date(`${tanggalMulaiRiwayat}T00:00:00`);
      if (tanggal < batasMulai) return false;
    }
    if (tanggalAkhirRiwayat) {
      const batasAkhir = new Date(`${tanggalAkhirRiwayat}T00:00:00`);
      batasAkhir.setDate(batasAkhir.getDate() + 1);
      if (tanggal >= batasAkhir) return false;
    }
    return true;
  });

  if (loading || !user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#FFF0F5] text-pink-500">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-9 w-9 animate-spin text-pink-500" />
            <p className="text-xs font-semibold text-pink-400">{COPY.common.loading}</p>
        </div>
      </div>
    );
  }

  const userAvatar = user.customPhotoURL || user.photoURL;

  return (
    <main className="relative mx-auto min-h-screen w-full max-w-md overflow-hidden bg-[#FFF0F5] pb-36 text-slate-800 font-sans antialiased">
      {/* BACKGROUND AMBIENT GLOW PINK & ROSE */}
      <div className="fixed top-[-10%] left-[-15%] w-[130%] h-[400px] bg-gradient-to-br from-pink-300/60 via-rose-200/50 to-fuchsia-200/60 blur-[110px] pointer-events-none rounded-full" />
      <div className="fixed top-[40%] right-[-10%] w-[300px] h-[300px] bg-pink-200/50 blur-[90px] pointer-events-none rounded-full" />

      <input
        type="file"
        ref={fileInputRef}
        accept="image/*"
        capture="environment"
        onChange={handleProcessReceipt}
        className="hidden"
      />

      {/* TOP HEADER */}
      <header className="px-6 pt-8 pb-4 relative z-10">
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-3">
            {userAvatar ? (
              <Image
                src={userAvatar}
                alt={user.displayName || "Avatar"}
                width={44}
                height={44}
                unoptimized
                className="w-11 h-11 rounded-2xl object-cover border-2 border-white shadow-xs ring-2 ring-pink-200"
              />
            ) : (
              <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-pink-500 to-rose-400 flex items-center justify-center font-bold text-white text-base shadow-xs ring-2 ring-white">
                {user.displayName ? user.displayName.charAt(0).toUpperCase() : "A"}
              </div>
            )}
            <div>
              <p className="text-[11px] font-semibold text-pink-400 flex items-center gap-1">
                {COPY.dashboard.hello}
              </p>
              <h1 className="text-base font-extrabold text-slate-800 leading-tight">
                {user.displayName || COPY.dashboard.defaultName} 💖
              </h1>
            </div>
          </div>

          <button
            onClick={handleLogout}
            className="p-2.5 bg-white/80 hover:bg-rose-50 border border-pink-100 rounded-full text-pink-400 hover:text-rose-500 transition-colors shadow-xs"
            title={COPY.dashboard.logout}
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>

        {/* SALDO UTAMA - PINK CARD ESTETIK */}
        <div className="relative overflow-hidden bg-gradient-to-br from-pink-500 via-rose-400 to-fuchsia-500 p-6 rounded-[2rem] shadow-xl shadow-pink-500/25 text-white space-y-4 border border-white/30">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-pink-100">
                  {COPY.dashboard.totalBalance}
                </span>
                <span className="bg-white/20 px-2 py-0.5 rounded-full text-[9px] font-bold text-white backdrop-blur-md flex items-center gap-1">
                  <Sparkles className="w-2.5 h-2.5 text-pink-200" /> {COPY.dashboard.live}
                </span>
              </div>
              <p className="mt-1.5 break-words text-3xl font-black tabular-nums tracking-tight text-white drop-shadow-xs">
                {formatRupiah(totalSaldo)}
              </p>
            </div>
            <div className="p-2.5 bg-white/20 backdrop-blur-md rounded-2xl border border-white/30">
              <CreditCard className="h-6 w-6 text-white" aria-hidden="true" />
            </div>
          </div>
          <p className="text-[11px] text-pink-100/90 font-medium pt-1 border-t border-white/20">
            {COPY.dashboard.balanceDescription}
          </p>
        </div>

        {/* FEATURED ACTION BUTTONS PINK */}
        <div className="grid grid-cols-3 gap-3 mt-4">
          <button
            onClick={() => setIsModalTransaksiOpen(true)}
            className="bg-white/80 backdrop-blur-xl p-3.5 rounded-2xl flex flex-col items-center justify-center shadow-xs hover:bg-white transition-all active:scale-95 border border-pink-100/80"
          >
            <div className="p-2.5 bg-pink-50 text-pink-500 border border-pink-100/80 rounded-xl mb-1.5">
              <Plus className="w-4 h-4 stroke-[2.5]" />
            </div>
            <span className="text-[11px] font-extrabold text-slate-700">{COPY.dashboard.recordTransaction}</span>
          </button>

          <button
            onClick={() => setIsModalDompetOpen(true)}
            className="bg-white/80 backdrop-blur-xl p-3.5 rounded-2xl flex flex-col items-center justify-center shadow-xs hover:bg-white transition-all active:scale-95 border border-pink-100/80"
          >
            <div className="p-2.5 bg-rose-50 text-rose-500 border border-rose-100/80 rounded-xl mb-1.5">
              <ArrowDownToLine className="w-4 h-4 stroke-[2.5]" />
            </div>
            <span className="text-[11px] font-extrabold text-slate-700">{COPY.dashboard.quickWallet}</span>
          </button>

          <button
            onClick={() => setIsModalExportOpen(true)}
            className="bg-white/80 backdrop-blur-xl p-3.5 rounded-2xl flex flex-col items-center justify-center shadow-xs hover:bg-white transition-all active:scale-95 border border-pink-100/80"
          >
            <div className="p-2.5 bg-fuchsia-50 text-fuchsia-500 border border-fuchsia-100/80 rounded-xl mb-1.5">
              <ArrowUpFromLine className="w-4 h-4 stroke-[2.5]" />
            </div>
            <span className="text-[11px] font-extrabold text-slate-700">{COPY.dashboard.quickReport}</span>
          </button>
        </div>
      </header>

      {/* MAIN CONTENT */}
      <div className="px-6 space-y-6 mt-2 relative z-10">
        {/* STATISTIK RINGKASAN */}
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-white/80 backdrop-blur-2xl p-4 rounded-2xl shadow-xs border border-pink-100/80 flex items-center gap-3">
            <div className="p-2.5 bg-rose-50 text-rose-500 border border-rose-100/80 rounded-xl">
              <TrendingDown className="w-4 h-4 stroke-[2.5]" />
            </div>
            <div>
              <p className="text-[10px] font-extrabold uppercase tracking-wider text-pink-400">{COPY.dashboard.expensesToday}</p>
              <p className="text-xs font-black text-slate-800 mt-0.5">{formatRupiah(pengeluaranHariIni)}</p>
            </div>
          </div>

          <div className="bg-white/80 backdrop-blur-2xl p-4 rounded-2xl shadow-xs border border-pink-100/80 flex items-center gap-3">
            <div className="p-2.5 bg-emerald-50 text-emerald-500 border border-emerald-100/80 rounded-xl">
              <TrendingUp className="w-4 h-4 stroke-[2.5]" />
            </div>
            <div>
              <p className="text-[10px] font-extrabold uppercase tracking-wider text-emerald-500">{COPY.dashboard.incomeToday}</p>
              <p className="text-xs font-black text-slate-800 mt-0.5">{formatRupiah(totalPemasukanBulanIni)}</p>
            </div>
          </div>
        </div>

        {/* DOMPET & REKENING */}
        <section className="bg-white/80 backdrop-blur-2xl p-5 rounded-[2rem] shadow-xs border border-pink-100/80 space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-xs font-black text-slate-800 uppercase tracking-wider flex items-center gap-2">
              <Wallet className="w-4 h-4 text-pink-500" /> {COPY.dashboard.wallets}
            </h2>
            <button onClick={() => setIsModalDompetOpen(true)} className="text-xs font-extrabold text-pink-500 hover:text-pink-600">
              {COPY.dashboard.manage}
            </button>
          </div>

          <div className="space-y-3">
            {isLoadingWallets ? (
              <p className="py-4 text-center text-xs text-pink-400 font-medium">{COPY.dashboard.loadingWallets}</p>
            ) : daftarDompet.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-pink-200 bg-pink-50/50 px-4 py-6 text-center">
                <p className="text-xs font-semibold text-slate-700">
                  {COPY.dashboard.noWallets}
                </p>
                <button
                  type="button"
                  onClick={() => setIsModalDompetOpen(true)}
                  className="mt-3 rounded-xl bg-pink-500 px-4 py-2 text-xs font-bold text-white transition-colors hover:bg-pink-600"
                >
                  + {COPY.dashboard.addWallet}
                </button>
              </div>
            ) : daftarDompet.map((dompet, idx) => {
              const badgeColors = [
                "bg-pink-50 text-pink-600 border-pink-100",
                "bg-rose-50 text-rose-600 border-rose-100",
                "bg-fuchsia-50 text-fuchsia-600 border-fuchsia-100",
              ];
              const colorClass = badgeColors[idx % badgeColors.length];

              return (
                <div key={dompet.id} className="flex items-center justify-between p-3.5 bg-pink-50/30 rounded-2xl border border-pink-100/50">
                  <div className="flex items-center gap-3">
                    <div className={`w-9 h-9 rounded-xl border flex items-center justify-center font-black text-xs ${colorClass}`}>
                      {dompet.nama.substring(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-800">{dompet.nama}</p>
                      <p className="text-[10px] text-pink-400 uppercase font-bold">{dompet.tipe === "ewallet" ? COPY.wallet.ewallet : dompet.tipe === "cash" ? COPY.wallet.cash : COPY.wallet.bank}</p>
                    </div>
                  </div>
                  <p className="text-xs font-black text-slate-800">{formatRupiah(dompet.saldo)}</p>
                </div>
              );
            })}
          </div>
        </section>

        {/* BUDGETING */}
        <SectionBudgeting
          streak={userStreak}
          daftarAnggaran={daftarAnggaranAktif}
          onOpenModalLimit={() => setIsModalLimitOpen(true)}
        />

        {/* TARGET TABUNGAN / WISHLIST */}
        <section>
          <div className="flex justify-between items-center mb-3 px-1">
            <h2 className="text-xs font-black text-pink-400 uppercase tracking-widest flex items-center gap-1.5">
              <ShoppingBag className="w-3.5 h-3.5" /> {COPY.dashboard.savingsGoal}
            </h2>
            <button onClick={() => setIsModalTargetOpen(true)} className="text-xs font-extrabold text-pink-500 hover:text-pink-600">
              + {COPY.dashboard.add}
            </button>
          </div>

          <div className="space-y-3">
            {daftarTarget.length === 0 ? (
              <div className="p-5 text-center text-xs text-pink-400 font-medium bg-white/80 rounded-2xl border border-pink-100/80">
                {COPY.dashboard.noGoals}
              </div>
            ) : (
              daftarTarget.map((target) => (
                <div
                  key={target.id}
                  onClick={() => handleOpenSetor(target)}
                  className="cursor-pointer transition-transform active:scale-[0.99]"
                >
                  <CardTargetTabungan
                    target={{
                      ...target,
                      nama: target.namaGoal ?? (target as unknown as { nama?: string }).nama ?? COPY.goal.title
                    }}
                  />
                </div>
              ))
            )}
          </div>
        </section>

        {/* RIWAYAT TRANSAKSI */}
        <section>
          <div className="flex justify-between items-center mb-3 px-1">
            <h2 className="text-xs font-black text-pink-400 uppercase tracking-widest">{COPY.dashboard.transactionHistory}</h2>
            <span className="text-[10px] font-bold text-pink-400">
              {transaksiTerfilter.length} {COPY.dashboard.transactionCount}
            </span>
          </div>

          <div className="mb-3 grid grid-cols-4 gap-1 rounded-2xl border border-pink-100 bg-white/80 p-1">
            {([
              ["all", COPY.dashboard.all],
              ["7days", COPY.dashboard.sevenDays],
              ["30days", COPY.dashboard.thirtyDays],
              ["custom", COPY.dashboard.date],
            ] as const).map(([value, label]) => (
              <button
                key={value}
                type="button"
                onClick={() => setFilterRiwayat(value)}
                aria-pressed={filterRiwayat === value}
                className={`rounded-xl px-1.5 py-2 text-[10px] font-extrabold transition-colors ${
                  filterRiwayat === value
                    ? "bg-pink-500 text-white shadow-sm"
                    : "text-pink-400 hover:bg-pink-50 hover:text-pink-600"
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          {filterRiwayat === "custom" && (
            <div className="mb-3 grid grid-cols-2 gap-3 rounded-2xl border border-pink-100 bg-white/80 p-3">
              <label className="text-[10px] font-bold text-pink-500">
                {COPY.dashboard.fromDate}
                <input
                  type="date"
                  value={tanggalMulaiRiwayat}
                  onChange={(e) => setTanggalMulaiRiwayat(e.target.value)}
                  aria-label={COPY.dashboard.startDateAria}
                  className="mt-1 w-full min-w-0 rounded-xl border border-pink-200 bg-pink-50/30 px-2 py-2 text-xs text-slate-700 focus:border-pink-500 focus:outline-none"
                />
              </label>
              <label className="text-[10px] font-bold text-pink-500">
                {COPY.dashboard.throughDate}
                <input
                  type="date"
                  value={tanggalAkhirRiwayat}
                  onChange={(e) => setTanggalAkhirRiwayat(e.target.value)}
                  aria-label={COPY.dashboard.endDateAria}
                  className="mt-1 w-full min-w-0 rounded-xl border border-pink-200 bg-pink-50/30 px-2 py-2 text-xs text-slate-700 focus:border-pink-500 focus:outline-none"
                />
              </label>
            </div>
          )}

          <div className="bg-white/80 backdrop-blur-2xl rounded-[2rem] shadow-xs border border-pink-100/80 divide-y divide-pink-50 overflow-hidden">
            {daftarTransaksi.length === 0 ? (
              <div className="p-6 text-center text-xs text-pink-400 font-semibold">
                {COPY.dashboard.noTransactionsToday}
              </div>
            ) : transaksiTerfilter.length === 0 ? (
              <div className="p-6 text-center text-xs text-pink-400 font-semibold">
                {COPY.dashboard.noTransactionsInRange}
              </div>
            ) : (
              transaksiTerfilter.map((item) => (
                <div key={item.id} className="p-3.5 flex items-center justify-between hover:bg-pink-50/30 transition-colors">
                  <div className="flex items-center gap-3.5">
                    <div
                      className={`p-2.5 rounded-xl border ${
                        item.tipe === "expense"
                          ? "bg-rose-50 text-rose-500 border-rose-100/80"
                          : item.tipe === "income"
                          ? "bg-emerald-50 text-emerald-500 border-emerald-100/80"
                          : "bg-pink-50 text-pink-500 border-pink-100/80"
                      }`}
                    >
                      {item.tipe === "expense" && <ArrowUpRight className="w-4 h-4 stroke-[2.5]" />}
                      {item.tipe === "income" && <ArrowDownLeft className="w-4 h-4 stroke-[2.5]" />}
                      {item.tipe === "transfer" && <ArrowRightLeft className="w-4 h-4 stroke-[2.5]" />}
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-800">
                        {item.catatan || (item.tipe === "transfer" ? COPY.dashboard.transfer : COPY.dashboard.transaction)}
                      </p>
                      <p className="text-[10px] text-pink-400 font-semibold mt-0.5">
                        {getNamaDompet(item.dompetId)} • {item.tanggalStr}
                        {item.kategoriId && ` • ${getCategoryName(item.kategoriId, kategoriManual)}`}
                      </p>
                    </div>
                  </div>

                  <p
                    className={`text-xs font-black ${
                      item.tipe === "expense"
                        ? "text-rose-500"
                        : item.tipe === "income"
                        ? "text-emerald-600"
                        : "text-pink-500"
                    }`}
                  >
                    {item.tipe === "expense" ? "-" : item.tipe === "income" ? "+" : ""}
                    {formatRupiah(item.nominal)}
                  </p>
                </div>
              ))
            )}
          </div>
        </section>
      </div>

      <BottomNavigation
        activePage="home"
        isScanning={isScanningOCR}
        onScan={handleTriggerScan}
        onAddTransaction={() => setIsModalTransaksiOpen(true)}
      />

      {/* MODAL SETOR TABUNGAN / WISHLIST */}
      {isSetorOpen && selectedGoal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm px-4">
          <div className="relative w-full max-w-md space-y-4 rounded-2xl border border-pink-100 bg-white p-6 shadow-xl">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-pink-50 text-pink-500 rounded-xl">
                  <PiggyBank className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">{COPY.goal.deposit}</h3>
                  <p className="text-xs text-pink-400 font-bold">{selectedGoal.namaGoal}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsSetorOpen(false)}
                className="rounded-full p-1 text-slate-400 hover:bg-pink-50 hover:text-pink-500 transition-colors"
                aria-label={COPY.common.close}
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {setorError && (
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-600 text-xs font-semibold">
                {setorError}
              </div>
            )}

            <form onSubmit={handleProcessSetorTabungan} className="space-y-4">
              <div>
                <label className="block text-xs font-extrabold text-pink-500 mb-1">
                  {COPY.dashboard.depositAmount}
                </label>
                <input
                  type="number"
                  required
                  min="1"
                  value={setorNominal}
                  onChange={(e) => setSetorNominal(e.target.value)}
                  placeholder="Contoh: 500.000"
                  className="w-full rounded-xl border border-pink-200 bg-pink-50/30 px-4 py-2.5 text-xs font-bold text-slate-800 focus:border-pink-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-extrabold text-pink-500 mb-1">
                  {COPY.dashboard.walletSource}
                </label>
                <select
                  value={selectedWalletId}
                  onChange={(e) => setSelectedWalletId(e.target.value)}
                  className="w-full rounded-xl border border-pink-200 bg-pink-50/30 px-4 py-2.5 text-xs text-slate-800 focus:border-pink-500 focus:outline-none"
                >
                  {daftarDompet.map((w) => (
                    <option key={w.id} value={w.id}>
                      {w.nama} (Saldo: {formatRupiah(w.saldo)})
                    </option>
                  ))}
                </select>
              </div>

              <button
                type="submit"
                disabled={isSubmittingSetor}
                className="w-full rounded-xl bg-gradient-to-r from-pink-500 to-rose-400 py-3 text-xs font-extrabold text-white hover:opacity-95 transition-opacity disabled:opacity-50 mt-2 flex items-center justify-center gap-2 shadow-md shadow-pink-500/20"
              >
                {isSubmittingSetor ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    {COPY.dashboard.processingDeposit}
                  </>
                ) : (
                  COPY.dashboard.confirmDeposit
                )}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* OTHER MODALS */}
      <FormCatatTransaksi
        key={receiptDraft ? `${receiptDraft.nominal}:${receiptDraft.kategoriId}:${receiptDraft.catatan}` : "manual"}
        isOpen={isModalTransaksiOpen}
        initialData={receiptDraft}
        daftarDompet={daftarDompet}
        kategoriManual={kategoriManual}
        kategoriArsip={archivedCategoryIds}
        walletsLoaded={!isLoadingWallets}
        onDeleteCategory={(kategoriId) => void handleHapusKategori(kategoriId)}
        onClose={() => {
          setIsModalTransaksiOpen(false);
          setReceiptDraft(null);
        }}
        onSubmit={handleTambahTransaksi}
      />
      <ModalKelolaDompet
        isOpen={isModalDompetOpen}
        onClose={() => setIsModalDompetOpen(false)}
        daftarDompet={daftarDompet}
        onTambahDompet={(d) => {
          if (!user) return;
          const newWallets = [...daftarDompet, { ...d, id: `d-${Date.now()}` }];
          setWalletsByUser((current) => ({ ...current, [user.uid]: newWallets }));
          void saveFirebaseWallets(user.uid, newWallets);
        }}
        onHapusDompet={(id) => {
          if (!user) return;
          const newWallets = daftarDompet.filter((d) => d.id !== id);
          setWalletsByUser((current) => ({ ...current, [user.uid]: newWallets }));
          void deleteFirebaseWallet(user.uid, id);
        }}
      />
      <ModalTambahTarget
        isOpen={isModalTargetOpen}
        onClose={() => setIsModalTargetOpen(false)}
        onTambahTarget={async (t) => {
          if (!user) return;
          const newGoal: TargetTabungan = {
            id: `g-${Date.now()}`,
            namaGoal: t.nama,
            targetNominal: t.targetNominal,
            terkumpul: 0,
          };
          await saveFirebaseGoal(user.uid, newGoal);
        }}
      />
      <ModalExportLaporan
        isOpen={isModalExportOpen}
        onClose={() => setIsModalExportOpen(false)}
        daftarTransaksi={daftarTransaksi}
        daftarDompet={daftarDompet}
        kategoriManual={kategoriManual}
      />
      <ModalAturLimit
        isOpen={isModalLimitOpen}
        kategoriManual={kategoriManual}
        kategoriArsip={archivedCategoryIds}
        onClose={() => setIsModalLimitOpen(false)}
        onDeleteCategory={(kategoriId) => void handleHapusKategori(kategoriId)}
        onTambahLimit={handleTambahLimit}
      />
    </main>
  );
}