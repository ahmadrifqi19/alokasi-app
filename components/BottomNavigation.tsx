"use client";

import Link from "next/link";
import { BarChart3, Camera, Home, Loader2, Plus, User } from "lucide-react";

type NavigationPage = "home" | "analytics" | "account";

interface BottomNavigationProps {
  activePage: NavigationPage;
  isScanning?: boolean;
  onScan?: () => void;
  onAddTransaction?: () => void;
}

const getItemClassName = (isActive: boolean) =>
  `flex min-w-0 flex-col items-center gap-1 transition-colors ${
    isActive ? "text-blue-600" : "text-slate-400 hover:text-slate-700"
  }`;

export default function BottomNavigation({
  activePage,
  isScanning = false,
  onScan,
  onAddTransaction,
}: BottomNavigationProps) {
  return (
    <nav
      aria-label="Navigasi utama"
      className="pointer-events-none fixed inset-x-0 bottom-0 z-40 px-5 pb-[env(safe-area-inset-bottom)]"
    >
      <div className="pointer-events-auto mx-auto mb-4 grid w-full max-w-md grid-cols-5 items-center rounded-full border border-slate-200/80 bg-white/90 px-4 py-3 shadow-lg shadow-slate-900/5 backdrop-blur-2xl">
        <Link
          href="/"
          aria-current={activePage === "home" ? "page" : undefined}
          className={getItemClassName(activePage === "home")}
        >
          <Home className={`h-5 w-5 ${activePage === "home" ? "stroke-[2.5]" : "stroke-[2]"}`} aria-hidden="true" />
          <span className="text-[9px] font-semibold">Beranda</span>
        </Link>

        {onScan ? (
          <button
            type="button"
            onClick={onScan}
            disabled={isScanning}
            aria-label={isScanning ? "Sedang membaca struk" : "Scan struk"}
            className={`${getItemClassName(false)} disabled:opacity-50`}
          >
            {isScanning ? (
              <Loader2 className="h-5 w-5 animate-spin stroke-[2]" aria-hidden="true" />
            ) : (
              <Camera className="h-5 w-5 stroke-[2]" aria-hidden="true" />
            )}
            <span className="text-[9px] font-semibold">
              {isScanning ? "Membaca..." : "Scan"}
            </span>
          </button>
        ) : (
          <Link href="/" aria-label="Kembali ke beranda untuk scan struk" className={getItemClassName(false)}>
            <Camera className="h-5 w-5 stroke-[2]" aria-hidden="true" />
            <span className="text-[9px] font-semibold">Scan</span>
          </Link>
        )}

        {onAddTransaction ? (
          <button
            type="button"
            onClick={onAddTransaction}
            aria-label="Tambah transaksi"
            className="-mt-5 flex h-14 w-14 items-center justify-center justify-self-center rounded-full border-4 border-white bg-blue-600 text-white shadow-md shadow-slate-900/10 transition-transform active:scale-95"
          >
            <Plus className="h-5 w-5 stroke-[2.5]" aria-hidden="true" />
          </button>
        ) : (
          <Link
            href="/"
            aria-label="Buka beranda untuk menambah transaksi"
            className="-mt-5 flex h-14 w-14 items-center justify-center justify-self-center rounded-full border-4 border-white bg-blue-600 text-white shadow-md shadow-slate-900/10 transition-transform active:scale-95"
          >
            <Plus className="h-5 w-5 stroke-[2.5]" aria-hidden="true" />
          </Link>
        )}

        <Link
          href="/analisis"
          aria-current={activePage === "analytics" ? "page" : undefined}
          className={getItemClassName(activePage === "analytics")}
        >
          <BarChart3 className={`h-5 w-5 ${activePage === "analytics" ? "stroke-[2.5]" : "stroke-[2]"}`} aria-hidden="true" />
          <span className="text-[9px] font-semibold">Analisis</span>
        </Link>

        <Link
          href="/akun"
          aria-current={activePage === "account" ? "page" : undefined}
          className={getItemClassName(activePage === "account")}
        >
          <User className={`h-5 w-5 ${activePage === "account" ? "stroke-[2.5]" : "stroke-[2]"}`} aria-hidden="true" />
          <span className="text-[9px] font-semibold">Akun</span>
        </Link>
      </div>
    </nav>
  );
}