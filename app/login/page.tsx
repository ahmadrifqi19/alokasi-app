"use client";

import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Eye, EyeOff, Loader2, Mail, Lock, User, ArrowRight, Sparkles } from "lucide-react";
import { FirebaseError } from "firebase/app";
import Image from "next/image";
import { COPY } from "@/lib/copy";

export default function LoginPage() {
  const { user, loginWithGoogle, loginWithEmail, registerWithEmail, loading } = useAuth();
  const router = useRouter();

  // Tab State: 'login' atau 'register'
  const [mode, setMode] = useState<"login" | "register">("login");

  // Form States
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  
  // Toggle Lihat Password State
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [errorMsg, setErrorMsg] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (user) {
      router.push("/");
    }
  }, [user, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");

    if (mode === "register") {
      if (!name.trim()) {
        setErrorMsg(COPY.auth.nameRequired);
        return;
      }
      if (password !== confirmPassword) {
        setErrorMsg(COPY.auth.passwordMismatch);
        return;
      }
      if (password.length < 6) {
        setErrorMsg(COPY.auth.shortPassword);
        return;
      }
    }

    setIsSubmitting(true);

    try {
      if (mode === "register") {
        await registerWithEmail(name, email, password);
      } else {
        await loginWithEmail(email, password);
      }
    } catch (error: unknown) {
      console.error("Auth error:", error);
      const code = error instanceof FirebaseError ? error.code : "";
      if (
        code === "auth/invalid-credential" ||
        code === "auth/wrong-password" ||
        code === "auth/user-not-found"
      ) {
        setErrorMsg(COPY.auth.loginFailed);
      } else if (code === "auth/email-already-in-use") {
        setErrorMsg(COPY.auth.emailInUse);
      } else if (code === "auth/invalid-email") {
        setErrorMsg(COPY.auth.invalidEmail);
      } else if (code === "auth/operation-not-allowed") {
        setErrorMsg(COPY.auth.emailMethodUnavailable);
      } else {
        setErrorMsg(COPY.auth.authError);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#FFF0F5] text-pink-500">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-pink-500" />
          <p className="text-xs font-semibold text-pink-400">{COPY.auth.loading}</p>
        </div>
      </div>
    );
  }

  return (
    <main className="relative flex min-h-screen items-center justify-center bg-[#FFF0F5] px-4 py-10 text-slate-800 antialiased overflow-hidden sm:py-12">
      {/* BACKGROUND AMBIENT GLOW PINK & ROSE */}
      <div className="fixed top-[-10%] left-[-15%] w-[130%] h-[400px] bg-gradient-to-br from-pink-300/60 via-rose-200/50 to-fuchsia-200/60 blur-[110px] pointer-events-none rounded-full" />
      <div className="fixed bottom-[-10%] right-[-10%] w-[300px] h-[300px] bg-pink-200/50 blur-[90px] pointer-events-none rounded-full" />

      <div className="relative z-10 w-full max-w-md space-y-6 rounded-[2rem] border border-pink-100/80 bg-white/80 backdrop-blur-2xl p-6 shadow-2xl sm:p-8">
        {/* BRAND HEADER */}
        <div className="text-center space-y-2">
          <div className="mb-1 flex justify-center">
            <Image
              src="/assets/LOGO1.png"
              alt="Logo Alokasi"
              width={100}
              height={40}
              className="h-auto w-30 object-contain"
              priority
            />
          </div>

          <p className="text-xs font-bold text-pink-400 max-w-xs mx-auto flex flex-col items-center justify-center gap-1">
            {mode === "login" ? (
              <>
                <span>{COPY.auth.loginTitle}</span>
                <span>{COPY.auth.loginSubtitle}</span>
              </>
            ) : (
              <>
                <span>{COPY.auth.registerTitle}</span>
                <span>{COPY.auth.registerSubtitle}</span>
              </>
            )}
          </p>
        </div>

        {/* TAB SWITCHER */}
        <div className="grid grid-cols-2 rounded-2xl bg-pink-50/50 p-1.5 border border-pink-100/80">
          <button
            type="button"
            onClick={() => {
              setMode("login");
              setErrorMsg("");
            }}
            className={`rounded-xl py-2.5 text-xs font-extrabold transition-all ${
              mode === "login"
                ? "bg-white text-pink-500 shadow-sm"
                : "text-pink-300 hover:text-pink-400"
            }`}
          >
            {COPY.auth.login}
          </button>
          <button
            type="button"
            onClick={() => {
              setMode("register");
              setErrorMsg("");
            }}
            className={`rounded-xl py-2.5 text-xs font-extrabold transition-all ${
              mode === "register"
                ? "bg-white text-pink-500 shadow-sm"
                : "text-pink-300 hover:text-pink-400"
            }`}
          >
            {COPY.auth.register}
          </button>
        </div>

        {/* ALERT ERROR */}
        {errorMsg && (
          <div className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs font-bold text-rose-600 text-center">
            {errorMsg}
          </div>
        )}

        {/* FORM INPUT */}
        <form onSubmit={handleSubmit} className="space-y-3.5">
          {mode === "register" && (
            <div>
              <label className="block text-xs font-extrabold text-pink-500 mb-1">
                {COPY.auth.name}
              </label>
              <div className="relative">
                <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-pink-300" />
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder={COPY.auth.namePlaceholder}
                  className="w-full rounded-2xl border border-pink-200 bg-pink-50/30 pl-10 pr-4 py-2.5 text-xs font-bold text-slate-800 placeholder-pink-200 focus:border-pink-500 focus:bg-white focus:outline-none transition-all"
                />
              </div>
            </div>
          )}

          <div>
            <label className="block text-xs font-extrabold text-pink-500 mb-1">
              {COPY.auth.email}
            </label>
            <div className="relative">
              <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-pink-300" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder={COPY.auth.emailPlaceholder}
                className="w-full rounded-2xl border border-pink-200 bg-pink-50/30 pl-10 pr-4 py-2.5 text-xs font-bold text-slate-800 placeholder-pink-200 focus:border-pink-500 focus:bg-white focus:outline-none transition-all"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-extrabold text-pink-500 mb-1">
              {COPY.auth.password}
            </label>
            <div className="relative">
              <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-pink-300" />
              <input
                type={showPassword ? "text" : "password"}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full rounded-2xl border border-pink-200 bg-pink-50/30 pl-10 pr-10 py-2.5 text-xs font-bold text-slate-800 placeholder-pink-200 focus:border-pink-500 focus:bg-white focus:outline-none transition-all"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-pink-300 hover:text-pink-500 transition-colors"
                title={showPassword ? COPY.auth.hidePassword : COPY.auth.showPassword}
              >
                {showPassword ? (
                  <EyeOff className="w-4 h-4" />
                ) : (
                  <Eye className="w-4 h-4" />
                )}
              </button>
            </div>
          </div>

          {mode === "register" && (
            <div>
              <label className="block text-xs font-extrabold text-pink-500 mb-1">
                {COPY.auth.confirmPassword}
              </label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-pink-300" />
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full rounded-2xl border border-pink-200 bg-pink-50/30 pl-10 pr-10 py-2.5 text-xs font-bold text-slate-800 placeholder-pink-200 focus:border-pink-500 focus:bg-white focus:outline-none transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-pink-300 hover:text-pink-500 transition-colors"
                  title={
                    showConfirmPassword
                      ? COPY.auth.hidePassword
                      : COPY.auth.showPassword
                  }
                >
                  {showConfirmPassword ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>
          )}

          <button
            type="submit"
            disabled={isSubmitting}
            className="mt-2 flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-pink-500 via-rose-400 to-fuchsia-400 py-3.5 text-xs font-extrabold text-white transition-opacity hover:opacity-95 disabled:opacity-50 shadow-lg shadow-pink-500/25"
          >
            {isSubmitting ? (
              <Loader2 className="w-4 h-4 animate-spin text-white" />
            ) : (
              <>
                <Sparkles className="w-4 h-4 text-pink-100" />
                <span>{mode === "login" ? COPY.auth.login : COPY.auth.register}</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        <div className="relative flex items-center justify-center my-3">
          <div className="w-full border-t border-pink-100"></div>
          <span className="absolute bg-white px-3 text-[10px] font-extrabold text-pink-300 uppercase tracking-wider">
            {COPY.auth.or}
          </span>
        </div>

        {/* GOOGLE SIGN-IN */}
        <button
          type="button"
          onClick={() => loginWithGoogle()}
          className="flex w-full items-center justify-center gap-3 rounded-2xl border border-pink-100 bg-pink-50/30 px-4 py-3 text-xs font-extrabold text-slate-700 hover:bg-pink-50 transition-colors"
        >
          <svg className="h-4 w-4" viewBox="0 0 24 24">
            <path
              fill="#4285F4"
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            />
            <path
              fill="#34A853"
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            />
            <path
              fill="#FBBC05"
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
            />
            <path
              fill="#EA4335"
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
            />
          </svg>
          {COPY.auth.google}
        </button>
      </div>
    </main>
  );
}