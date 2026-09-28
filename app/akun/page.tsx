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
} from "lucide-react";
import { subscribeFirebaseTransactions, subscribeFirebaseWallets } from "@/lib/firestore-sync";

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

export default function ProfilePage() {
  const { user, loading, logout, updateUserProfile, updateUserPassword } = useAuth();
  const router = useRouter();

  const [walletCount, setWalletCount] = useState(0);
  const [txCount, setTxCount] = useState(0);

  // States Modal
  const [isEditProfileOpen, setIsEditProfileOpen] = useState(false);
  const [isSecurityOpen, setIsSecurityOpen] = useState(false);
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);

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
      alert("Gagal membaca file gambar. Silakan coba file lain.");
    }
  };

  // Handler Simpan Profil
  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingProfile(true);
    setProfileMsg({ text: "", type: "" });

    try {
      await updateUserProfile(newName, previewPhoto);
      setProfileMsg({ text: "Profil berhasil diperbarui!", type: "success" });
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
      setSecurityMsg({ text: "Konfirmasi password tidak cocok.", type: "error" });
      return;
    }
    if (newPassword.length < 6) {
      setSecurityMsg({ text: "Password minimal 6 karakter.", type: "error" });
      return;
    }

    setIsSavingPassword(true);
    try {
      await updateUserPassword(newPassword);
      setSecurityMsg({ text: "Password berhasil diperbarui!", type: "success" });
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

  const handleLogout = async () => {
    if (confirm("Apakah Anda yakin ingin keluar dari akun?")) {
      await logout();
      router.push("/login");
    }
  };

  if (loading || !user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-900 text-sky-400">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-sky-500" />
          <p className="text-xs font-semibold text-slate-400">Memuat profil akun...</p>
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
    : "Pengguna Baru";

  return (
    <main className="min-h-screen bg-[#F8FAFC] pb-36 text-slate-800 font-sans antialiased">
      {/* HIDDEN INPUT UPLOAD */}
      <input
        type="file"
        ref={avatarInputRef}
        accept="image/*"
        onChange={handlePhotoSelect}
        className="hidden"
      />

      {/* TOP HEADER */}
      <header className="px-6 pt-8 pb-4">
        <h1 className="text-xl font-black text-slate-900 tracking-tight">Akun Saya</h1>
        <p className="text-xs font-medium text-slate-400">Kelola informasi data diri dan kustomisasi profil Anda</p>
      </header>

      <div className="px-6 space-y-6 mt-2">
        {/* CARD PROFIL UTAMA */}
        <div className="relative flex flex-col items-center space-y-4 rounded-2xl border border-slate-200 bg-white p-6 text-center shadow-sm">
          <div className="relative">
            {userAvatar ? (
              <Image
                src={userAvatar}
                alt={user.displayName || "Avatar"}
                width={80}
                height={80}
                unoptimized
                className="w-20 h-20 rounded-full object-cover ring-4 ring-blue-500/20 shadow-md"
              />
            ) : (
              <div className="flex h-20 w-20 items-center justify-center rounded-full bg-blue-600 text-2xl font-bold text-white">
                {user.displayName ? user.displayName.charAt(0).toUpperCase() : "A"}
              </div>
            )}
            <button
              onClick={openEditProfile}
              className="absolute bottom-0 right-0 p-2 bg-blue-600 text-white rounded-full ring-2 ring-white hover:bg-blue-700 transition-colors"
              title="Ubah Foto Profil"
            >
              <Edit3 className="w-3.5 h-3.5" />
            </button>
          </div>

          <div>
            <h2 className="text-lg font-black text-slate-900 leading-tight">
              {user.displayName || "Pengguna Alokasi"}
            </h2>
            <p className="text-xs font-semibold text-slate-400 mt-1 flex items-center justify-center gap-1">
              <Mail className="w-3.5 h-3.5" /> {user.email}
            </p>
            <div className="inline-flex items-center gap-1.5 bg-blue-50 text-blue-600 border border-blue-100 px-3 py-1 rounded-full text-[10px] font-bold mt-3">
              <Calendar className="w-3 h-3" /> Member Sejak {createdAtFormatted}
            </div>
          </div>
        </div>

        {/* STATISTIK AKUN */}
        <div className="grid grid-cols-2 gap-3">
          <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="p-2.5 bg-blue-50 text-blue-600 rounded-2xl border border-blue-100">
              <Wallet className="w-4 h-4" />
            </div>
            <div>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Total Dompet</p>
              <p className="text-sm font-extrabold text-slate-800 mt-0.5">{walletCount} Aktif</p>
            </div>
          </div>

          <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="p-2.5 bg-sky-50 text-sky-600 rounded-2xl border border-sky-100">
              <BarChart3 className="w-4 h-4" />
            </div>
            <div>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Total Transaksi</p>
              <p className="text-sm font-extrabold text-slate-800 mt-0.5">{txCount} Record</p>
            </div>
          </div>
        </div>

        {/* MENU PENGATURAN KUSTOM */}
        <section className="divide-y divide-slate-100 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          {/* Ubah Profil */}
          <div
            onClick={openEditProfile}
            className="p-4 flex items-center justify-between hover:bg-slate-50/80 cursor-pointer transition-colors"
          >
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-slate-100 text-slate-600 rounded-xl">
                <User className="w-4 h-4" />
              </div>
              <div>
                <p className="text-xs font-bold text-slate-800">Ubah Profil</p>
                <p className="text-[10px] text-slate-400">Nama lengkap & upload foto avatar</p>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-slate-400" />
          </div>

          {/* Notifikasi */}
          <div
            onClick={() => setIsNotificationOpen(!isNotificationOpen)}
            className="p-4 flex items-center justify-between hover:bg-slate-50/80 cursor-pointer transition-colors"
          >
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-slate-100 text-slate-600 rounded-xl">
                <Bell className="w-4 h-4" />
              </div>
              <div>
                <p className="text-xs font-bold text-slate-800">Notifikasi & Pengingat</p>
                <p className="text-[10px] text-slate-400">Atur pengingat pencatatan & budget limit</p>
              </div>
            </div>
            <ChevronRight className={`w-4 h-4 text-slate-400 transition-transform ${isNotificationOpen ? "rotate-90" : ""}`} />
          </div>

          {/* Sub-menu Notifikasi */}
          {isNotificationOpen && (
            <div className="p-4 bg-slate-50/50 space-y-3 border-t border-slate-100">
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-700 font-medium">Pengingat Catat Harian</span>
                <input
                  type="checkbox"
                  checked={notifyDaily}
                  onChange={(e) => setNotifyDaily(e.target.checked)}
                  className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                />
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-700 font-medium">Peringatan Budget Melebihi Batas</span>
                <input
                  type="checkbox"
                  checked={notifyOverbudget}
                  onChange={(e) => setNotifyOverbudget(e.target.checked)}
                  className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                />
              </div>
            </div>
          )}

          {/* Keamanan */}
          <div
            onClick={() => setIsSecurityOpen(true)}
            className="p-4 flex items-center justify-between hover:bg-slate-50/80 cursor-pointer transition-colors"
          >
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-slate-100 text-slate-600 rounded-xl">
                <Lock className="w-4 h-4" />
              </div>
              <div>
                <p className="text-xs font-bold text-slate-800">Keamanan & Password</p>
                <p className="text-[10px] text-slate-400">Atur kata sandi akun Anda</p>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-slate-400" />
          </div>
        </section>

        {/* LOGOUT */}
        <button
          onClick={handleLogout}
          className="w-full bg-rose-50 hover:bg-rose-100 border border-rose-200/80 text-rose-600 font-bold py-3.5 rounded-2xl flex items-center justify-center gap-2 text-xs transition-colors shadow-sm"
        >
          <LogOut className="w-4 h-4" /> Keluar dari Akun
        </button>
      </div>

      {/* MODAL EDIT PROFIL */}
      {isEditProfileOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 px-4">
          <div className="w-full max-w-md space-y-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex justify-between items-center">
              <h3 className="text-base font-bold text-slate-900">Ubah Profil Saya</h3>
              <button onClick={() => setIsEditProfileOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            {profileMsg.text && (
              <div
                className={`p-3 rounded-xl text-xs text-center font-medium ${
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
                      className="w-20 h-20 rounded-full object-cover ring-4 ring-blue-500/20 shadow-md"
                    />
                  ) : (
                    <div className="w-20 h-20 rounded-full bg-blue-100 flex items-center justify-center font-black text-blue-600 text-2xl">
                      {newName ? newName.charAt(0).toUpperCase() : "A"}
                    </div>
                  )}
                  <button
                    type="button"
                    onClick={() => avatarInputRef.current?.click()}
                    className="absolute bottom-0 right-0 p-2 bg-blue-600 text-white rounded-full ring-2 ring-white hover:bg-blue-700 transition-colors shadow"
                  >
                    <Upload className="w-3.5 h-3.5" />
                  </button>
                </div>

                <button
                  type="button"
                  onClick={() => avatarInputRef.current?.click()}
                  className="text-xs font-semibold text-blue-600 hover:text-blue-700 mt-1"
                >
                  Pilih Gambar dari Perangkat
                </button>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Nama Lengkap</label>
                <input
                  type="text"
                  required
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="Nama Lengkap"
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-xs text-slate-800 focus:border-blue-500 focus:outline-none"
                />
              </div>

              <button
                type="submit"
                disabled={isSavingProfile}
                className="w-full rounded-xl bg-blue-600 py-3 text-xs font-bold text-white hover:bg-blue-700 transition-colors disabled:opacity-50 mt-2"
              >
                {isSavingProfile ? "Menyimpan..." : "Simpan Perubahan"}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* MODAL KEAMANAN PASSWORD */}
      {isSecurityOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 px-4">
          <div className="w-full max-w-md space-y-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex justify-between items-center">
              <h3 className="text-base font-bold text-slate-900">Ubah Kata Sandi</h3>
              <button onClick={() => setIsSecurityOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            {securityMsg.text && (
              <div
                className={`p-3 rounded-xl text-xs text-center font-medium ${
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
                <label className="block text-xs font-semibold text-slate-600 mb-1">Password Baru</label>
                <input
                  type="password"
                  required
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-xs text-slate-800 focus:border-blue-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Konfirmasi Password Baru</label>
                <input
                  type="password"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-xs text-slate-800 focus:border-blue-500 focus:outline-none"
                />
              </div>

              <button
                type="submit"
                disabled={isSavingPassword}
                className="w-full rounded-xl bg-blue-600 py-3 text-xs font-bold text-white hover:bg-blue-700 transition-colors disabled:opacity-50 mt-2"
              >
                {isSavingPassword ? "Memproses..." : "Perbarui Password"}
              </button>
            </form>
          </div>
        </div>
      )}

      <BottomNavigation activePage="account" />
    </main>
  );
}