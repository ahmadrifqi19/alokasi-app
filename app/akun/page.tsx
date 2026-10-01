"use client";

import React, { useState, useEffect, useRef } from "react";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import Image from "next/image";
import BottomNavigation from "@/components/BottomNavigation";
import {
  User,
  Mail,
  Calendar,
  LogOut,
  ChevronRight,
  BarChart3,
  Wallet,
  Bell,
  Lock,
  Loader2,
  X,
  Edit3,
  Upload,
  RotateCcw,
  AlertTriangle,
  Heart,
  Sparkles,
} from "lucide-react";
import {
  subscribeFirebaseTransactions,
  subscribeFirebaseWallets,
} from "@/lib/firestore-sync";
import { db } from "@/lib/firebase";
import { collection, getDocs, deleteDoc, doc } from "firebase/firestore";

// Helper Kompresi Gambar ke Avatar Small Base64 (Max 150px agar sangat ringan)
async function compressImageFile(file: File, maxWidth = 150, quality = 0.6): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new window.Image();
      img.src = event.target?.result as string;
      img.onload = () => {
        const canvas = document.createElement("canvas");
        let width = img.width;
        let height = img.height;

        if (width > maxWidth) {
          height = Math.round((height * maxWidth) / width);
          width = maxWidth;
        }

        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext("2d");
        ctx?.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL("image/jpeg", quality));
      };
      img.onerror = () => reject(new Error("Gagal membaca gambar avatar."));
    };
    reader.onerror = (err) => reject(err);
  });
}

// Helper Fungsi Reset Data User di Firestore
async function resetUserDataToZero(userId: string) {
  const collectionsToReset = ["transactions", "budgets", "goals", "wallets"];

  for (const colName of collectionsToReset) {
    const colRef = collection(db, "users", userId, colName);
    const snapshot = await getDocs(colRef);
    const deletePromises = snapshot.docs.map((d) =>
      deleteDoc(doc(db, "users", userId, colName, d.id))
    );
    await Promise.all(deletePromises);
  }
}

export default function ProfilePage() {
  const { user, loading, logout, updateUserProfile, updateUserPassword } = useAuth();
  const router = useRouter();

  const [walletCount, setWalletCount] = useState(0);
  const [txCount, setTxCount] = useState(0);

  // States Modal
  const [isEditProfileOpen, setIsEditProfileOpen] = useState(false);
  const [isSecurityOpen, setIsSecurityOpen] = useState(false);
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);
  const [isResetModalOpen, setIsResetModalOpen] = useState(false);

  // Form Edit Profil State
  const [newName, setNewName] = useState("");
  const [previewPhoto, setPreviewPhoto] = useState<string>("");
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [profileMsg, setProfileMsg] = useState({ text: "", type: "" });

  const avatarInputRef = useRef<HTMLInputElement>(null);

  const openEditProfile = () => {
    setNewName(user?.displayName ?? "");
    setPreviewPhoto(user?.customPhotoURL || user?.photoURL || "");
    setProfileMsg({ text: "", type: "" });
    setIsEditProfileOpen(true);
  };

  // Form Keamanan State
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isSavingPassword, setIsSavingPassword] = useState(false);
  const [securityMsg, setSecurityMsg] = useState({ text: "", type: "" });

  // Reset Data State
  const [isResetting, setIsResetting] = useState(false);
  const [resetMsg, setResetMsg] = useState({ text: "", type: "" });

  // Settings Toggles State
  const [notifyDaily, setNotifyDaily] = useState(true);
  const [notifyOverbudget, setNotifyOverbudget] = useState(true);

  useEffect(() => {
    if (!loading && !user) {
      router.push("/login");
    }
  }, [user, loading, router]);

  useEffect(() => {
    if (!user) return;

    const unsubWallets = subscribeFirebaseWallets(user.uid, (wallets) => {
      setWalletCount(wallets.length);
    });

    const unsubTrans = subscribeFirebaseTransactions(user.uid, (transactions) => {
      setTxCount(transactions.length);
    });

    return () => {
      unsubWallets();
      unsubTrans();
    };
  }, [user]);

  // Handle Pilih & Kompres Gambar Foto Profil
  const handlePhotoSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const compressedBase64 = await compressImageFile(file);
      setPreviewPhoto(compressedBase64);
    } catch (error) {
      console.error("Gagal memproses gambar:", error);
      alert("Gagal membaca file gambar. Silakan coba file lain ya, Babe!");
    }
  };

  // Handler Simpan Profil
  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingProfile(true);
    setProfileMsg({ text: "", type: "" });

    try {
      await updateUserProfile(newName, previewPhoto);
      setProfileMsg({ text: "Profil cantik kamu berhasil disimpan! ✨", type: "success" });
      setTimeout(() => setIsEditProfileOpen(false), 1200);
    } catch (error: unknown) {
      setProfileMsg({
        text: error instanceof Error ? error.message : "Gagal memperbarui profil.",
        type: "error",
      });
    } finally {
      setIsSavingProfile(false);
    }
  };

  // Handler Simpan Password
  const handleSavePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setSecurityMsg({ text: "", type: "" });

    if (newPassword !== confirmPassword) {
      setSecurityMsg({ text: "Konfirmasi password tidak cocok nih, Babe.", type: "error" });
      return;
    }
    if (newPassword.length < 6) {
      setSecurityMsg({ text: "Password minimal 6 karakter ya.", type: "error" });
      return;
    }

    setIsSavingPassword(true);
    try {
      await updateUserPassword(newPassword);
      setSecurityMsg({ text: "Password berhasil diperbarui! ✨", type: "success" });
      setNewPassword("");
      setConfirmPassword("");
      setTimeout(() => setIsSecurityOpen(false), 1200);
    } catch {
      setSecurityMsg({
        text: "Gagal memperbarui password. Coba login ulang terlebih dahulu.",
        type: "error",
      });
    } finally {
      setIsSavingPassword(false);
    }
  };

  // Handler Reset Data Ke Nol
  const handleResetData = async () => {
    if (!user) return;
    setIsResetting(true);
    setResetMsg({ text: "", type: "" });

    try {
      await resetUserDataToZero(user.uid);
      setResetMsg({ text: "Semua data berhasil direset ke nol! ✨", type: "success" });
      setTimeout(() => {
        setIsResetModalOpen(false);
        setResetMsg({ text: "", type: "" });
      }, 1500);
    } catch (error) {
      console.error("Gagal reset data:", error);
      setResetMsg({ text: "Gagal mereset data. Silakan coba lagi.", type: "error" });
    } finally {
      setIsResetting(false);
    }
  };

  const handleLogout = async () => {
    if (confirm("Apakah kamu yakin ingin keluar dari akun, Babe? 💕")) {
      await logout();
      router.push("/login");
    }
  };

  if (loading || !user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#FFF0F5] text-pink-500">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-pink-500" />
          <p className="text-xs font-semibold text-pink-400">Memuat Profil Cantik Kamu...</p>
        </div>
      </div>
    );
  }

  const userAvatar = previewPhoto || user.customPhotoURL || user.photoURL;

  const createdAtFormatted = user.metadata.creationTime
    ? new Date(user.metadata.creationTime).toLocaleDateString("id-ID", {
        day: "numeric",
        month: "long",
        year: "numeric",
      })
    : "Member Cantik";

  return (
    <main className="relative mx-auto min-h-screen w-full max-w-md bg-[#FFF0F5] pb-36 text-slate-800 font-sans antialiased overflow-hidden">
      {/* BACKGROUND AMBIENT GLOW PINK & ROSE */}
      <div className="fixed top-[-10%] left-[-15%] w-[130%] h-[400px] bg-gradient-to-br from-pink-300/60 via-rose-200/50 to-fuchsia-200/60 blur-[110px] pointer-events-none rounded-full" />
      <div className="fixed top-[40%] right-[-10%] w-[300px] h-[300px] bg-pink-200/50 blur-[90px] pointer-events-none rounded-full" />

      {/* HIDDEN INPUT UPLOAD */}
      <input
        type="file"
        ref={avatarInputRef}
        accept="image/*"
        onChange={handlePhotoSelect}
        className="hidden"
      />

      {/* TOP HEADER */}
      <header className="px-6 pt-8 pb-4 relative z-10">
        <h1 className="text-xl font-black text-slate-900 tracking-tight flex items-center gap-2">
          Profilku <Heart className="w-5 h-5 fill-pink-500 text-pink-500" />
        </h1>
        <p className="text-xs font-semibold text-pink-400">Kelola profil & kustomisasi akun cantik kamu</p>
      </header>

      <div className="px-6 space-y-6 relative z-10 mt-2">
        {/* CARD PROFIL UTAMA */}
        <div className="relative flex flex-col items-center space-y-4 rounded-[2rem] border border-pink-100/80 bg-white/80 backdrop-blur-2xl p-6 text-center shadow-xs">
          <div className="relative">
            {userAvatar ? (
              <Image
                src={userAvatar}
                alt={user.displayName || "Avatar"}
                width={80}
                height={80}
                unoptimized
                className="w-20 h-20 rounded-full object-cover ring-4 ring-pink-300/40 shadow-md"
              />
            ) : (
              <div className="flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-tr from-pink-500 to-rose-400 text-2xl font-black text-white shadow-md">
                {user.displayName ? user.displayName.charAt(0).toUpperCase() : "🌸"}
              </div>
            )}
            <button
              type="button"
              onClick={openEditProfile}
              className="absolute bottom-0 right-0 p-2 bg-pink-500 text-white rounded-full ring-2 ring-white hover:bg-pink-600 transition-colors shadow-xs"
              title="Ubah Foto Profil"
            >
              <Edit3 className="w-3.5 h-3.5" />
            </button>
          </div>

          <div>
            <h2 className="text-lg font-extrabold text-slate-900 leading-tight">
              {user.displayName || "Girlboss Alokasi"}
            </h2>
            <p className="text-xs font-semibold text-pink-400 mt-1 flex items-center justify-center gap-1">
              <Mail className="w-3.5 h-3.5 text-pink-400" /> {user.email}
            </p>
            <div className="inline-flex items-center gap-1.5 bg-pink-50 text-pink-500 border border-pink-100 px-3 py-1 rounded-full text-[10px] font-extrabold mt-3 shadow-2xs">
              <Calendar className="w-3 h-3 text-pink-400" /> Member Sejak {createdAtFormatted}
            </div>
          </div>
        </div>

        {/* STATISTIK AKUN */}
        <div className="grid grid-cols-2 gap-3">
          <div className="flex items-center gap-3 rounded-2xl border border-pink-100/80 bg-white/80 backdrop-blur-2xl p-4 shadow-xs">
            <div className="p-2.5 bg-pink-50 text-pink-500 rounded-2xl border border-pink-100/80">
              <Wallet className="w-4 h-4" />
            </div>
            <div>
              <p className="text-[10px] text-pink-400 font-extrabold uppercase tracking-wider">Total Dompet</p>
              <p className="text-sm font-black text-slate-800 mt-0.5">{walletCount} Aktif ✨</p>
            </div>
          </div>

          <div className="flex items-center gap-3 rounded-2xl border border-pink-100/80 bg-white/80 backdrop-blur-2xl p-4 shadow-xs">
            <div className="p-2.5 bg-rose-50 text-rose-500 rounded-2xl border border-rose-100/80">
              <BarChart3 className="w-4 h-4" />
            </div>
            <div>
              <p className="text-[10px] text-pink-400 font-extrabold uppercase tracking-wider">Total Jajan</p>
              <p className="text-sm font-black text-slate-800 mt-0.5">{txCount} Record 🛍️</p>
            </div>
          </div>
        </div>

        {/* MENU PENGATURAN KUSTOM */}
        <section className="divide-y divide-pink-50 overflow-hidden rounded-[2rem] border border-pink-100/80 bg-white/80 backdrop-blur-2xl shadow-xs">
          {/* Ubah Profil */}
          <div
            onClick={openEditProfile}
            className="p-4 flex items-center justify-between hover:bg-pink-50/30 cursor-pointer transition-colors"
          >
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-pink-50 text-pink-500 rounded-xl">
                <User className="w-4 h-4" />
              </div>
              <div>
                <p className="text-xs font-extrabold text-slate-800">Ubah Profil</p>
                <p className="text-[10px] font-semibold text-pink-400">Nama lengkap & foto avatar kamu</p>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-pink-300" />
          </div>

          {/* Notifikasi */}
          <div
            onClick={() => setIsNotificationOpen(!isNotificationOpen)}
            className="p-4 flex items-center justify-between hover:bg-pink-50/30 cursor-pointer transition-colors"
          >
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-pink-50 text-pink-500 rounded-xl">
                <Bell className="w-4 h-4" />
              </div>
              <div>
                <p className="text-xs font-extrabold text-slate-800">Notifikasi & Pengingat 🔔</p>
                <p className="text-[10px] font-semibold text-pink-400">Pengingat jajan harian & budget limit</p>
              </div>
            </div>
            <ChevronRight className={`w-4 h-4 text-pink-300 transition-transform ${isNotificationOpen ? "rotate-90" : ""}`} />
          </div>

          {/* Sub-menu Notifikasi */}
          {isNotificationOpen && (
            <div className="p-4 bg-pink-50/20 space-y-3 border-t border-pink-50">
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-700 font-bold">Pengingat Catat Jajan Harian</span>
                <input
                  type="checkbox"
                  checked={notifyDaily}
                  onChange={(e) => setNotifyDaily(e.target.checked)}
                  className="h-4 w-4 rounded border-pink-300 text-pink-500 focus:ring-pink-400 accent-pink-500"
                />
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-700 font-bold">Peringatan Overbudget Limit</span>
                <input
                  type="checkbox"
                  checked={notifyOverbudget}
                  onChange={(e) => setNotifyOverbudget(e.target.checked)}
                  className="h-4 w-4 rounded border-pink-300 text-pink-500 focus:ring-pink-400 accent-pink-500"
                />
              </div>
            </div>
          )}

          {/* Keamanan */}
          <div
            onClick={() => setIsSecurityOpen(true)}
            className="p-4 flex items-center justify-between hover:bg-pink-50/30 cursor-pointer transition-colors"
          >
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-pink-50 text-pink-500 rounded-xl">
                <Lock className="w-4 h-4" />
              </div>
              <div>
                <p className="text-xs font-extrabold text-slate-800">Keamanan & Password 🔒</p>
                <p className="text-[10px] font-semibold text-pink-400">Atur kata sandi akun kamu</p>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-pink-300" />
          </div>

          {/* Fitur Reset Data ke Nol */}
          <div
            onClick={() => {
              setResetMsg({ text: "", type: "" });
              setIsResetModalOpen(true);
            }}
            className="p-4 flex items-center justify-between hover:bg-rose-50/50 cursor-pointer transition-colors"
          >
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-rose-50 text-rose-500 rounded-xl">
                <RotateCcw className="w-4 h-4" />
              </div>
              <div>
                <p className="text-xs font-extrabold text-rose-600">Reset Data ke Nol</p>
                <p className="text-[10px] font-semibold text-rose-400">Kosongkan semua riwayat jajan & dompet</p>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-rose-300" />
          </div>
        </section>

        {/* LOGOUT */}
        <button
          type="button"
          onClick={handleLogout}
          className="w-full bg-rose-50 hover:bg-rose-100 border border-rose-200/80 text-rose-600 font-extrabold py-3.5 rounded-2xl flex items-center justify-center gap-2 text-xs transition-colors shadow-xs"
        >
          <LogOut className="w-4 h-4" /> Keluar dari Akun
        </button>
      </div>

      {/* MODAL EDIT PROFIL */}
      {isEditProfileOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm px-4">
          <div className="relative max-h-[85vh] w-full max-w-md space-y-4 overflow-y-auto overscroll-contain rounded-[2rem] border border-pink-100 bg-white p-6 shadow-2xl">
            <div className="flex justify-between items-center">
              <h3 className="text-base font-extrabold text-slate-900">Ubah Profil Cantik ✨</h3>
              <button
                type="button"
                onClick={() => setIsEditProfileOpen(false)}
                className="rounded-full p-1 text-slate-400 hover:bg-pink-50 hover:text-pink-500 transition-colors"
                aria-label="Tutup"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {profileMsg.text && (
              <div
                className={`p-3 rounded-xl text-xs text-center font-bold ${
                  profileMsg.type === "success"
                    ? "bg-emerald-50 text-emerald-600 border border-emerald-200"
                    : "bg-rose-50 text-rose-600 border border-rose-200"
                }`}
              >
                {profileMsg.text}
              </div>
            )}

            <form onSubmit={handleSaveProfile} className="space-y-4">
              <div className="flex flex-col items-center gap-2">
                <div className="relative">
                  {userAvatar ? (
                    <Image
                      src={userAvatar}
                      alt="Preview Avatar"
                      width={80}
                      height={80}
                      unoptimized
                      className="w-20 h-20 rounded-full object-cover ring-4 ring-pink-300/40 shadow-md"
                    />
                  ) : (
                    <div className="w-20 h-20 rounded-full bg-pink-100 flex items-center justify-center font-black text-pink-500 text-2xl">
                      {newName ? newName.charAt(0).toUpperCase() : "🌸"}
                    </div>
                  )}
                  <button
                    type="button"
                    onClick={() => avatarInputRef.current?.click()}
                    className="absolute bottom-0 right-0 p-2 bg-pink-500 text-white rounded-full ring-2 ring-white hover:bg-pink-600 transition-colors shadow"
                  >
                    <Upload className="w-3.5 h-3.5" />
                  </button>
                </div>

                <button
                  type="button"
                  onClick={() => avatarInputRef.current?.click()}
                  className="text-xs font-extrabold text-pink-500 hover:text-pink-600 mt-1"
                >
                  Pilih Gambar Avatar Baru ✨
                </button>
              </div>

              <div>
                <label className="block text-xs font-extrabold text-pink-500 mb-1">Nama Lengkap</label>
                <input
                  type="text"
                  required
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="Nama Lengkap"
                  className="w-full rounded-2xl border border-pink-200 bg-pink-50/30 px-4 py-2.5 text-xs font-bold text-slate-800 focus:border-pink-500 focus:outline-none"
                />
              </div>

              <button
                type="submit"
                disabled={isSavingProfile}
                className="w-full rounded-2xl bg-gradient-to-r from-pink-500 via-rose-400 to-fuchsia-400 py-3.5 text-xs font-extrabold text-white hover:opacity-95 transition-opacity disabled:opacity-50 mt-2 flex items-center justify-center gap-2 shadow-lg shadow-pink-500/25"
              >
                {isSavingProfile ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" /> Menyimpan...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 text-pink-100" /> Simpan Perubahan ✨
                  </>
                )}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* MODAL KEAMANAN PASSWORD */}
      {isSecurityOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm px-4">
          <div className="relative max-h-[85vh] w-full max-w-md space-y-4 overflow-y-auto overscroll-contain rounded-[2rem] border border-pink-100 bg-white p-6 shadow-2xl">
            <div className="flex justify-between items-center">
              <h3 className="text-base font-extrabold text-slate-900">Ubah Kata Sandi 🔒</h3>
              <button
                type="button"
                onClick={() => setIsSecurityOpen(false)}
                className="rounded-full p-1 text-slate-400 hover:bg-pink-50 hover:text-pink-500 transition-colors"
                aria-label="Tutup"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {securityMsg.text && (
              <div
                className={`p-3 rounded-xl text-xs text-center font-bold ${
                  securityMsg.type === "success"
                    ? "bg-emerald-50 text-emerald-600 border border-emerald-200"
                    : "bg-rose-50 text-rose-600 border border-rose-200"
                }`}
              >
                {securityMsg.text}
              </div>
            )}

            <form onSubmit={handleSavePassword} className="space-y-3">
              <div>
                <label className="block text-xs font-extrabold text-pink-500 mb-1">Password Baru</label>
                <input
                  type="password"
                  required
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full rounded-2xl border border-pink-200 bg-pink-50/30 px-4 py-2.5 text-xs font-bold text-slate-800 focus:border-pink-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-extrabold text-pink-500 mb-1">Konfirmasi Password Baru</label>
                <input
                  type="password"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full rounded-2xl border border-pink-200 bg-pink-50/30 px-4 py-2.5 text-xs font-bold text-slate-800 focus:border-pink-500 focus:outline-none"
                />
              </div>

              <button
                type="submit"
                disabled={isSavingPassword}
                className="w-full rounded-2xl bg-gradient-to-r from-pink-500 via-rose-400 to-fuchsia-400 py-3.5 text-xs font-extrabold text-white hover:opacity-95 transition-opacity disabled:opacity-50 mt-2 flex items-center justify-center gap-2 shadow-lg shadow-pink-500/25"
              >
                {isSavingPassword ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" /> Memproses...
                  </>
                ) : (
                  "Perbarui Password ✨"
                )}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* MODAL KONFIRMASI RESET DATA */}
      {isResetModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm px-4">
          <div className="relative max-h-[85vh] w-full max-w-md space-y-4 overflow-y-auto overscroll-contain rounded-[2rem] border border-pink-100 bg-white p-6 shadow-2xl">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-2 text-rose-500">
                <AlertTriangle className="w-5 h-5" />
                <h3 className="text-base font-extrabold text-slate-900">Konfirmasi Reset Data</h3>
              </div>
              <button
                type="button"
                onClick={() => setIsResetModalOpen(false)}
                className="rounded-full p-1 text-slate-400 hover:bg-pink-50 hover:text-pink-500 transition-colors"
                aria-label="Tutup"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs font-medium text-slate-600 leading-relaxed">
              Tindakan ini akan menghapus **semua riwayat jajan, daftar dompet, limit anggaran, dan wishlist** kamu secara permanen dari basis data.
            </p>

            {resetMsg.text && (
              <div
                className={`p-3 rounded-xl text-xs text-center font-bold ${
                  resetMsg.type === "success"
                    ? "bg-emerald-50 text-emerald-600 border border-emerald-200"
                    : "bg-rose-50 text-rose-600 border border-rose-200"
                }`}
              >
                {resetMsg.text}
              </div>
            )}

            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={() => setIsResetModalOpen(false)}
                disabled={isResetting}
                className="w-1/2 rounded-2xl border border-pink-100 bg-pink-50 py-3 text-xs font-extrabold text-pink-500 hover:bg-pink-100 transition-colors disabled:opacity-50"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleResetData}
                disabled={isResetting}
                className="w-1/2 rounded-2xl bg-rose-500 py-3 text-xs font-extrabold text-white hover:bg-rose-600 transition-colors disabled:opacity-50 flex items-center justify-center gap-1.5 shadow-md shadow-rose-500/20"
              >
                {isResetting ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    Memproses...
                  </>
                ) : (
                  "Ya, Reset Semua"
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      <BottomNavigation activePage="account" />
    </main>
  );
}