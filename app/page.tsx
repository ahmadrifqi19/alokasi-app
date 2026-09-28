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
  DashboardTransaction,
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

// Import OCR Helper Gemini AI
import { analyzeReceiptImage } from "@/lib/gemini";

// Import Types
import { Dompet, TargetTabungan, AnggaranKategori, UserStreak, TipeTransaksi } from "@/types";

interface ReceiptDraft {
  nominal: number;
  catatan: string;
  kategoriId: string;
}

export default function DashboardAlokasi() {
  const { user, loading, logout } = useAuth();
  const router = useRouter();

  // Redirect ke /login jika belum terautentikasi
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

  const [daftarTarget, setDaftarTarget] = useState<TargetTabungan[]>([
    { id: "g1", nama: "Beli Laptop M1", targetNominal: 12000000, terkumpul: 0 },
    { id: "g2", nama: "Dana Darurat", targetNominal: 10000000, terkumpul: 0 },
  ]);

  const [userStreak] = useState<UserStreak>({
    currentStreak: 1,
    longestStreak: 1,
    poin: 50,
    badgeLevel: "Bronze",
  });

  const [daftarAnggaran, setDaftarAnggaran] = useState<AnggaranKategori[]>([
    { id: "b1", kategoriId: "k1", namaKategori: "Makanan & Kopi", limitBulanan: 1500000, terpakai: 0 },
    { id: "b2", kategoriId: "k2", namaKategori: "Hiburan & Nonton", limitBulanan: 500000, terpakai: 0 },
  ]);

  // Sinkronisasi Data Firestore secara Real-time
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

    return () => {
      unsubTrans();
      unsubWallets();
      unsubBudgets();
    };
  }, [user]);

  // ----------------------------------------------------
  // 3. KALKULASI DINAMIS & REAKTIF SALDO
  // ----------------------------------------------------
  const totalPemasukanBulanIni = daftarTransaksi
    .filter((t) => t.tipe === "income")
    .reduce((acc, t) => acc + (t.nominal || 0), 0);

  // Total Saldo Keuangan otomatis disesuaikan secara reaktif
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
    return daftarDompet.find((d) => d.id === id)?.nama || "Dompet";
  };

  // ----------------------------------------------------
  // 4. HANDLERS TRANSAKSI SINKRONISASI
  // ----------------------------------------------------
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
          else reject(new Error("Gagal membaca file gambar."));
        };
        reader.onerror = () =>
          reject(reader.error ?? new Error("Gagal membaca file gambar."));
        reader.readAsDataURL(file);
      });
      const [, base64] = dataUrl.split(",", 2);
      if (!base64) throw new Error("File gambar tidak valid.");

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
      alert(error instanceof Error ? error.message : String(error));
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

    // A. Mutasi Saldo Dompet (Pemasukan bertambah, Pengeluaran berkurang)
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

    // B. Mutasi Anggaran Kategori
    if (data.tipe === "expense" && data.kategoriId) {
      const updatedAnggaran = daftarAnggaran.map((ang) => {
        if (ang.kategoriId === data.kategoriId) {
          const newTerpakai = ang.terpakai + data.nominal;
          const updatedItem = { ...ang, terpakai: newTerpakai };
          saveFirebaseBudget(user.uid, updatedItem);
          return updatedItem;
        }
        return ang;
      });
      setDaftarAnggaran(updatedAnggaran);
    }

    // C. Simpan Transaksi Baru
    const jamMenit = new Date().toLocaleTimeString("id-ID", {
      hour: "2-digit",
      minute: "2-digit",
    });

    const transaksiBaru: DashboardTransaction = {
      id: `t-${Date.now()}`,
      dompetId: data.dompetId,
      dompetTujuanId: data.dompetTujuanId || "",
      kategoriId: data.kategoriId || "",
      nominal: data.nominal,
      tipe: data.tipe,
      catatan: data.catatan || "",
      tanggalObj: data.tanggal,
      tanggalStr: `Hari Ini, ${jamMenit}`,
    };

    await saveFirebaseTransaction(user.uid, transaksiBaru);
  };

  const handleTambahLimit = async (data: {
    kategoriId: string;
    namaKategori: string;
    limitBulanan: number;
  }) => {
    if (!user) return;

    let targetItem: AnggaranKategori | undefined;

    const updatedList = daftarAnggaran.map((ang) => {
      if (ang.kategoriId === data.kategoriId) {
        targetItem = { ...ang, limitBulanan: data.limitBulanan };
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
        terpakai: 0,
      };
      updatedList.push(targetItem);
    }

    setDaftarAnggaran(updatedList);
    await saveFirebaseBudget(user.uid, targetItem);
  };

  const handleLogout = async () => {
    await logout();
    router.push("/login");
  };

  if (loading || !user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#F8FAFC] text-blue-600">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-9 w-9 animate-spin text-blue-600" />
          <p className="text-xs font-semibold text-slate-400">Memuat Alokasi...</p>
        </div>
      </div>
    );
  }

  const userAvatar = user.customPhotoURL || user.photoURL;

  return (
    <main className="relative mx-auto min-h-screen w-full max-w-md overflow-hidden bg-[#F8FAFC] pb-36 text-slate-800 font-sans antialiased">
      {/* BACKGROUND AMBIENT GLOW VARIASI WARNA */}
      <div className="fixed top-[-10%] left-[-15%] w-[130%] h-[400px] bg-gradient-to-br from-blue-200/50 via-sky-100/40 to-indigo-100/50 blur-[110px] pointer-events-none rounded-full" />
      <div className="fixed top-[40%] right-[-10%] w-[300px] h-[300px] bg-cyan-100/40 blur-[90px] pointer-events-none rounded-full" />

      {/* HIDDEN INPUT KAMERA */}
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
                className="w-11 h-11 rounded-2xl object-cover border-2 border-white shadow-xs"
              />
            ) : (
              <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-blue-600 to-sky-400 flex items-center justify-center font-bold text-white text-base shadow-xs ring-2 ring-white">
                {user.displayName ? user.displayName.charAt(0).toUpperCase() : "A"}
              </div>
            )}
            <div>
              <p className="text-[11px] font-semibold text-slate-400">Selamat Datang,</p>
              <h1 className="text-base font-bold text-slate-800 leading-tight">
                {user.displayName || "Pengguna Alokasi"}
              </h1>
            </div>
          </div>

          <button
            onClick={handleLogout}
            className="p-2.5 bg-white/80 hover:bg-rose-50 border border-slate-200/60 hover:border-rose-200 rounded-full text-slate-400 hover:text-rose-500 transition-colors shadow-xs"
            title="Keluar"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>

        {/* SALDO UTAMA - CARD DENGAN GRADIEN APPLE STYLED */}
        <div className="relative overflow-hidden bg-gradient-to-br from-blue-600 via-sky-500 to-indigo-600 p-6 rounded-[2rem] shadow-xl shadow-blue-500/20 text-white space-y-4 border border-white/20">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] font-bold uppercase tracking-wider text-blue-100">Total Saldo Keuangan</span>
                <span className="bg-white/20 px-2 py-0.5 rounded-full text-[9px] font-bold text-white backdrop-blur-md flex items-center gap-1">
                  <Sparkles className="w-2.5 h-2.5 text-amber-300" /> Real-time
                </span>
              </div>
              <p className="mt-1.5 break-words text-3xl font-black tabular-nums tracking-tight text-white drop-shadow-xs">
                {formatRupiah(totalSaldo)}
              </p>
            </div>
            <div className="p-2.5 bg-white/10 backdrop-blur-md rounded-2xl border border-white/20">
              <CreditCard className="h-6 w-6 text-white" aria-hidden="true" />
            </div>
          </div>
          <p className="text-[11px] text-blue-100/90 font-medium pt-1 border-t border-white/10">Akumulasi saldo terhubung dari seluruh dompet aktif</p>
        </div>

        {/* FEATURED ACTION BUTTONS DENGAN AKSEN WARNA VARIAN */}
        <div className="grid grid-cols-3 gap-3 mt-4">
          <button
            onClick={() => setIsModalTransaksiOpen(true)}
            className="bg-white/80 backdrop-blur-xl p-3.5 rounded-2xl flex flex-col items-center justify-center shadow-xs hover:bg-white transition-all active:scale-95 border border-slate-200/80"
          >
            <div className="p-2.5 bg-blue-50 text-blue-600 border border-blue-100/60 rounded-xl mb-1.5">
              <Plus className="w-4 h-4 stroke-[2.5]" />
            </div>
            <span className="text-[11px] font-bold text-slate-700">Catat</span>
          </button>

          <button
            onClick={() => setIsModalDompetOpen(true)}
            className="bg-white/80 backdrop-blur-xl p-3.5 rounded-2xl flex flex-col items-center justify-center shadow-xs hover:bg-white transition-all active:scale-95 border border-slate-200/80"
          >
            <div className="p-2.5 bg-sky-50 text-sky-600 border border-sky-100/60 rounded-xl mb-1.5">
              <ArrowDownToLine className="w-4 h-4 stroke-[2.5]" />
            </div>
            <span className="text-[11px] font-bold text-slate-700">Dompet</span>
          </button>

          <button
            onClick={() => setIsModalExportOpen(true)}
            className="bg-white/80 backdrop-blur-xl p-3.5 rounded-2xl flex flex-col items-center justify-center shadow-xs hover:bg-white transition-all active:scale-95 border border-slate-200/80"
          >
            <div className="p-2.5 bg-indigo-50 text-indigo-600 border border-indigo-100/60 rounded-xl mb-1.5">
              <ArrowUpFromLine className="w-4 h-4 stroke-[2.5]" />
            </div>
            <span className="text-[11px] font-bold text-slate-700">Ekspor</span>
          </button>
        </div>
      </header>

      {/* MAIN CONTENT */}
      <div className="px-6 space-y-6 mt-2 relative z-10">
        {/* STATISTIK RINGKASAN */}
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-white/80 backdrop-blur-2xl p-4 rounded-2xl shadow-xs border border-slate-200/80 flex items-center gap-3">
            <div className="p-2.5 bg-rose-50 text-rose-500 border border-rose-100/80 rounded-xl">
              <TrendingDown className="w-4 h-4 stroke-[2.5]" />
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Pengeluaran</p>
              <p className="text-xs font-black text-slate-800 mt-0.5">{formatRupiah(pengeluaranHariIni)}</p>
            </div>
          </div>

          <div className="bg-white/80 backdrop-blur-2xl p-4 rounded-2xl shadow-xs border border-slate-200/80 flex items-center gap-3">
            <div className="p-2.5 bg-emerald-50 text-emerald-500 border border-emerald-100/80 rounded-xl">
              <TrendingUp className="w-4 h-4 stroke-[2.5]" />
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Pemasukan</p>
              <p className="text-xs font-black text-slate-800 mt-0.5">{formatRupiah(totalPemasukanBulanIni)}</p>
            </div>
          </div>
        </div>

        {/* DOMPET & REKENING */}
        <section className="bg-white/80 backdrop-blur-2xl p-5 rounded-[2rem] shadow-xs border border-slate-200/80 space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-xs font-black text-slate-800 uppercase tracking-wider flex items-center gap-2">
              <Wallet className="w-4 h-4 text-blue-600" /> Dompet Saya
            </h2>
            <button onClick={() => setIsModalDompetOpen(true)} className="text-xs font-bold text-blue-600 hover:text-blue-700">
              Kelola
            </button>
          </div>

          <div className="space-y-3">
            {isLoadingWallets ? (
              <p className="py-4 text-center text-xs text-slate-500">Memuat dompet...</p>
            ) : daftarDompet.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-4 py-6 text-center">
                <p className="text-xs font-semibold text-slate-700">
                  Belum ada dompet. Tambahkan dompet pertama Anda.
                </p>
                <button
                  type="button"
                  onClick={() => setIsModalDompetOpen(true)}
                  className="mt-3 rounded-xl bg-blue-600 px-4 py-2 text-xs font-semibold text-white transition-colors hover:bg-blue-700"
                >
                  Tambah dompet
                </button>
              </div>
            ) : daftarDompet.map((dompet, idx) => {
              // Aksen warna dinamis untuk setiap ikon dompet
              const badgeColors = [
                "bg-slate-100 text-slate-700 border-slate-200",
                "bg-blue-50 text-blue-600 border-blue-100",
                "bg-sky-50 text-sky-600 border-sky-100",
              ];
              const colorClass = badgeColors[idx % badgeColors.length];

              return (
                <div key={dompet.id} className="flex items-center justify-between p-3.5 bg-slate-50/70 rounded-2xl border border-slate-100/80">
                  <div className="flex items-center gap-3">
                    <div className={`w-9 h-9 rounded-xl border flex items-center justify-center font-black text-xs ${colorClass}`}>
                      {dompet.nama.substring(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-800">{dompet.nama}</p>
                      <p className="text-[10px] text-slate-400 uppercase font-semibold">{dompet.tipe}</p>
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
          daftarAnggaran={daftarAnggaran}
          onOpenModalLimit={() => setIsModalLimitOpen(true)}
        />

        {/* TARGET TABUNGAN */}
        <section>
          <div className="flex justify-between items-center mb-3 px-1">
            <h2 className="text-xs font-black text-slate-400 uppercase tracking-widest">Target Tabungan</h2>
            <button onClick={() => setIsModalTargetOpen(true)} className="text-xs font-bold text-blue-600 hover:text-blue-700">
              + Baru
            </button>
          </div>

          <div className="space-y-3">
            {daftarTarget.map((target) => (
              <CardTargetTabungan key={target.id} target={target} />
            ))}
          </div>
        </section>

        {/* TRANSAKSI TERAKHIR */}
        <section>
          <div className="flex justify-between items-center mb-3 px-1">
            <h2 className="text-xs font-black text-slate-400 uppercase tracking-widest">Aktivitas Terakhir</h2>
          </div>

          <div className="bg-white/80 backdrop-blur-2xl rounded-[2rem] shadow-xs border border-slate-200/80 divide-y divide-slate-100 overflow-hidden">
            {daftarTransaksi.length === 0 ? (
              <div className="p-6 text-center text-xs text-slate-400 font-semibold">
                Belum ada transaksi tercatat.
              </div>
            ) : (
              daftarTransaksi.map((item) => (
                <div key={item.id} className="p-3.5 flex items-center justify-between hover:bg-slate-50/50 transition-colors">
                  <div className="flex items-center gap-3.5">
                    <div
                      className={`p-2.5 rounded-xl border ${
                        item.tipe === "expense"
                          ? "bg-rose-50 text-rose-500 border-rose-100/60"
                          : item.tipe === "income"
                          ? "bg-emerald-50 text-emerald-500 border-emerald-100/60"
                          : "bg-blue-50 text-blue-500 border-blue-100/60"
                      }`}
                    >
                      {item.tipe === "expense" && <ArrowUpRight className="w-4 h-4 stroke-[2.5]" />}
                      {item.tipe === "income" && <ArrowDownLeft className="w-4 h-4 stroke-[2.5]" />}
                      {item.tipe === "transfer" && <ArrowRightLeft className="w-4 h-4 stroke-[2.5]" />}
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-800">
                        {item.catatan || (item.tipe === "transfer" ? "Transfer Saldo" : "Transaksi")}
                      </p>
                      <p className="text-[10px] text-slate-400 font-semibold mt-0.5">
                        {getNamaDompet(item.dompetId)} • {item.tanggalStr}
                      </p>
                    </div>
                  </div>

                  <p
                    className={`text-xs font-black ${
                      item.tipe === "expense"
                        ? "text-rose-600"
                        : item.tipe === "income"
                        ? "text-emerald-600"
                        : "text-blue-600"
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

      {/* MODALS */}
      <FormCatatTransaksi
        key={receiptDraft ? `${receiptDraft.nominal}:${receiptDraft.kategoriId}:${receiptDraft.catatan}` : "manual"}
        isOpen={isModalTransaksiOpen}
        initialData={receiptDraft}
        daftarDompet={daftarDompet}
        walletsLoaded={!isLoadingWallets}
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
        onTambahTarget={(t) => setDaftarTarget((prev) => [t, ...prev])}
      />
      <ModalExportLaporan
        isOpen={isModalExportOpen}
        onClose={() => setIsModalExportOpen(false)}
        daftarTransaksi={daftarTransaksi}
        daftarDompet={daftarDompet}
      />
      <ModalAturLimit
        isOpen={isModalLimitOpen}
        onClose={() => setIsModalLimitOpen(false)}
        onTambahLimit={handleTambahLimit}
      />
    </main>
  );
}