"use client";

import React from "react";
import Link from "next/link";
import { Home, Camera, Plus, BarChart3, User, Loader2 } from "lucide-react";
import { COPY } from "@/lib/copy";

interface BottomNavigationProps {
  activePage: "home" | "analysis" | "account";
  isScanning?: boolean;
  onScan?: () => void;
  onAddTransaction?: () => void;
}

export default function BottomNavigation({
  activePage,
  isScanning = false,
  onScan,
  onAddTransaction,
}: BottomNavigationProps) {
  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 flex justify-center pointer-events-none pb-[calc(0.75rem+env(safe-area-inset-bottom))]">
      <nav className="pointer-events-auto flex items-center justify-between w-[92%] max-w-md bg-white/90 backdrop-blur-2xl border border-pink-100/80 px-6 py-3 rounded-3xl shadow-xl shadow-pink-500/10">
        {/* BERANDA */}
        <Link
          href="/"
          className={`flex flex-col items-center gap-1 transition-all ${
            activePage === "home" ? "text-pink-500 scale-105" : "text-pink-300 hover:text-pink-400"
          }`}
        >
          <Home className="w-5 h-5 stroke-[2.2]" />
          <span className="text-[10px] font-extrabold">{COPY.common.home}</span>
        </Link>

        {/* SCAN STRUK OCR */}
        <button
          type="button"
          onClick={onScan}
          disabled={isScanning}
          className="flex flex-col items-center gap-1 text-pink-300 hover:text-pink-400 transition-all disabled:opacity-50"
        >
          {isScanning ? (
            <Loader2 className="w-5 h-5 animate-spin text-pink-500" />
          ) : (
            <Camera className="w-5 h-5 stroke-[2.2]" />
          )}
          <span className="text-[10px] font-extrabold">{isScanning ? COPY.receipt.reading : COPY.receipt.title}</span>
        </button>

        {/* TOMBOL UTAMA CATAT JAJAN */}
        <button
          type="button"
          onClick={onAddTransaction}
          className="flex items-center justify-center w-12 h-12 rounded-2xl bg-gradient-to-tr from-pink-500 via-rose-400 to-fuchsia-400 text-white shadow-lg shadow-pink-500/30 hover:scale-110 active:scale-95 transition-all -mt-5 ring-4 ring-white"
          aria-label={COPY.dashboard.recordTransaction}
        >
          <Plus className="w-6 h-6 stroke-[3]" />
        </button>

        {/* ANALISIS / SPENDING REPORT */}
        <Link
          href="/analisis"
          className={`flex flex-col items-center gap-1 transition-all ${
            activePage === "analysis" ? "text-pink-500 scale-105" : "text-pink-300 hover:text-pink-400"
          }`}
        >
          <BarChart3 className="w-5 h-5 stroke-[2.2]" />
          <span className="text-[10px] font-extrabold">{COPY.common.analysis}</span>
        </Link>

        {/* AKUN / PROFIL */}
        <Link
          href="/akun"
          className={`flex flex-col items-center gap-1 transition-all ${
            activePage === "account" ? "text-pink-500 scale-105" : "text-pink-300 hover:text-pink-400"
          }`}
        >
          <User className="w-5 h-5 stroke-[2.2]" />
          <span className="text-[10px] font-extrabold">{COPY.common.profile}</span>
        </Link>
      </nav>
    </div>
  );
}