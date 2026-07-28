"use client";

import { useState } from "react";
import Link from "next/link";
import { signIn } from "@/lib/auth-client";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await signIn.email({
        email,
        password,
      });

      if (res.error) {
        setError(res.error.message || "Invalid credentials provided");
      } else {
        window.location.href = "/";
      }
    } catch (err: any) {
      setError(err.message || "Failed to sign in. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const quickFill = (demoEmail: string, demoPass: string) => {
    setEmail(demoEmail);
    setPassword(demoPass);
  };

  return (
    <div className="min-h-screen bg-[#08090C] text-[#F8FAFC] flex items-center justify-center p-4 relative overflow-hidden">
      {/* Ambient background glows */}
      <div className="absolute -top-32 -left-32 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute -bottom-32 -right-32 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl pointer-events-none"></div>

      <div className="glass-panel w-full max-w-md rounded-3xl p-8 shadow-2xl relative z-10 border border-white/10">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-emerald-400 to-emerald-600 text-black flex items-center justify-center font-black shadow-lg">
            <svg className="w-5 h-5 text-black fill-current" viewBox="0 0 24 24">
              <path d="M20.57 14.86L22 13.43L20.57 12L17 15.57L8.43 7L12 3.43L10.57 2L9.14 3.43L7.71 2L6.29 3.43L4.86 2L3.43 3.43L2 2L3.43 3.43L2 4.86L3.43 6.29L2 7.71L3.43 9.14L2 10.57L3.43 12L7 8.43L15.57 17L12 20.57L13.43 22L14.86 20.57L16.29 22L17.71 20.57L19.14 22L20.57 20.57L22 22L20.57 20.57L22 19.14L20.57 17.71L22 16.29L20.57 14.86Z" />
            </svg>
          </div>
          <div>
            <h1 className="text-xl font-black text-white tracking-tight">FitPulse Gateway</h1>
            <p className="text-xs text-slate-400 font-medium">Sign in to access your account</p>
          </div>
        </div>

        {error && (
          <div className="bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs p-4 rounded-2xl mb-6 flex items-start gap-2">
            <svg className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>{error}</span>
          </div>
        )}

        {/* Demo Quick Fill Buttons */}
        <div className="mb-6 bg-[#0B0D14] border border-white/10 rounded-2xl p-3.5">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-2.5 flex items-center gap-1.5">
            <svg className="w-3.5 h-3.5 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
            <span>Demo Quick Fill</span>
          </span>
          <div className="grid grid-cols-3 gap-2">
            <button
              type="button"
              onClick={() => quickFill("admin@gym.com", "Password123!")}
              className="bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 text-xs font-bold py-2 px-2.5 rounded-xl transition-all border border-emerald-500/20 active:scale-[0.98]"
            >
              Admin
            </button>
            <button
              type="button"
              onClick={() => quickFill("staff@gym.com", "Password123!")}
              className="bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 text-xs font-bold py-2 px-2.5 rounded-xl transition-all border border-blue-500/20 active:scale-[0.98]"
            >
              Staff
            </button>
            <button
              type="button"
              onClick={() => quickFill("member@gym.com", "Password123!")}
              className="bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 text-xs font-bold py-2 px-2.5 rounded-xl transition-all border border-amber-500/20 active:scale-[0.98]"
            >
              Member
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1.5 uppercase tracking-wider">
              Email Address
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="user@example.com"
              className="w-full bg-[#0B0D14] border border-white/10 focus:border-emerald-500 rounded-xl p-3.5 text-slate-100 text-sm outline-none transition-all focus:ring-2 focus:ring-emerald-500/20"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1.5 uppercase tracking-wider">
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full bg-[#0B0D14] border border-white/10 focus:border-emerald-500 rounded-xl p-3.5 text-slate-100 text-sm outline-none transition-all focus:ring-2 focus:ring-emerald-500/20"
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-black font-extrabold py-3.5 rounded-xl text-sm shadow-[0_0_20px_rgba(16,185,129,0.25)] transition-all active:scale-[0.98] mt-2 flex items-center justify-center gap-2"
          >
            {loading ? (
              <span className="inline-block animate-spin border-2 border-black border-t-transparent rounded-full w-4 h-4"></span>
            ) : (
              <span>Sign In</span>
            )}
          </button>
        </form>

        <p className="text-xs text-center text-slate-400 mt-6">
          Don't have an account?{" "}
          <Link href="/register" className="text-emerald-400 hover:underline font-bold">
            Register Member
          </Link>
        </p>
      </div>
    </div>
  );
}
