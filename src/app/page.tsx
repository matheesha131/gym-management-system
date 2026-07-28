"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useSession, signIn } from "@/lib/auth-client";
import { useRouter } from "next/navigation";

export default function Home() {
  const { data: session, isPending } = useSession();
  const router = useRouter();
  const [loggingInRole, setLoggingInRole] = useState<string | null>(null);

  useEffect(() => {
    if (session?.user) {
      const role = (session.user as any).role || "member";
      if (role === "admin" || role === "staff") {
        router.push("/admin/terminal");
      } else {
        router.push("/portal");
      }
    }
  }, [session, router]);

  const handleQuickLogin = async (email: string, roleName: string) => {
    setLoggingInRole(roleName);
    try {
      const res = await signIn.email({
        email,
        password: "Password123!",
      });

      if (!res.error) {
        window.location.href = "/";
      } else {
        alert("Quick login failed: " + res.error.message);
      }
    } catch (err: any) {
      alert("Quick login failed: " + err.message);
    } finally {
      setLoggingInRole(null);
    }
  };

  if (isPending) {
    return (
      <div className="min-h-screen bg-[#08090C] text-[#F8FAFC] flex items-center justify-center font-sans">
        <div className="flex items-center gap-3 glass-panel px-6 py-4 rounded-2xl border border-white/10 shadow-2xl">
          <div className="w-5 h-5 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
          <span className="text-slate-300 text-sm font-medium tracking-wide">Initializing FitPulse System...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#08090C] text-[#F8FAFC] flex flex-col justify-between p-6 md:p-12 max-w-7xl mx-auto">
      {/* Top Header */}
      <header className="flex justify-between items-center pb-6 border-b border-white/[0.08]">
        <div className="flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-emerald-400 to-emerald-600 text-black flex items-center justify-center font-black text-xl shadow-[0_0_20px_rgba(16,185,129,0.3)]">
            <svg className="w-6 h-6 text-black fill-current" viewBox="0 0 24 24">
              <path d="M20.57 14.86L22 13.43L20.57 12L17 15.57L8.43 7L12 3.43L10.57 2L9.14 3.43L7.71 2L6.29 3.43L4.86 2L3.43 3.43L2 2L3.43 3.43L2 4.86L3.43 6.29L2 7.71L3.43 9.14L2 10.57L3.43 12L7 8.43L15.57 17L12 20.57L13.43 22L14.86 20.57L16.29 22L17.71 20.57L19.14 22L20.57 20.57L22 22L20.57 20.57L22 19.14L20.57 17.71L22 16.29L20.57 14.86Z" />
            </svg>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-black tracking-tight text-white">FitPulse</h1>
              <span className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[10px] px-2 py-0.5 rounded-full font-semibold uppercase tracking-wider">v1.0</span>
            </div>
            <p className="text-xs text-slate-400 font-medium">Gym Kiosk Terminal, Payments & Member Portal</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/login"
            className="bg-white/5 hover:bg-white/10 text-slate-200 border border-white/10 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 active:scale-[0.98] focus-visible:outline-2 focus-visible:outline-emerald-500"
          >
            Sign In
          </Link>
          <Link
            href="/register"
            className="bg-emerald-500 hover:bg-emerald-400 text-black px-5 py-2.5 rounded-xl text-sm font-bold shadow-[0_0_20px_rgba(16,185,129,0.3)] transition-all duration-200 active:scale-[0.98] focus-visible:outline-2 focus-visible:outline-emerald-500"
          >
            Register Member
          </Link>
        </div>
      </header>

      {/* Main Content */}
      <main id="main-content" className="my-12 space-y-16">
        {/* Hero Banner */}
        <div className="text-center max-w-3xl mx-auto space-y-5">
          <div className="inline-flex items-center gap-2 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-xs px-3.5 py-1.5 rounded-full font-semibold tracking-wide">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            Demo Credentials & System Gateway
          </div>
          <h2 className="text-4xl md:text-5xl lg:text-6xl font-black text-white tracking-tight leading-[1.1] text-wrap-balance">
            Next-Gen Gym Access & Operations System
          </h2>
          <p className="text-slate-400 text-base md:text-lg max-w-2xl mx-auto leading-relaxed">
            Select a pre-configured role below for instant automated authorization and explore full operational features.
          </p>
        </div>

        {/* Role Quick Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-stretch">
          {/* Admin Role Card */}
          <div className="glass-card rounded-3xl p-8 flex flex-col justify-between relative group overflow-hidden border border-white/10 hover:border-emerald-500/50">
            <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 rounded-full blur-2xl group-hover:bg-emerald-500/20 transition-all pointer-events-none"></div>
            <div>
              <div className="flex justify-between items-center mb-5">
                <div className="w-12 h-12 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 flex items-center justify-center">
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                </div>
                <span className="bg-emerald-500/20 text-emerald-300 text-[11px] font-extrabold px-3 py-1 rounded-full border border-emerald-500/30 tracking-wider">
                  ROLE: ADMIN
                </span>
              </div>
              <h3 className="text-2xl font-black text-white mb-2 tracking-tight">Administrator</h3>
              <p className="text-xs text-slate-400 mb-6 leading-relaxed min-h-[36px]">
                Full management access to membership plans, member directory, and kiosk terminals.
              </p>

              <div className="bg-[#0B0D14] border border-white/10 rounded-2xl p-4 space-y-2.5 text-xs mb-6 font-mono tabular-nums">
                <div className="flex justify-between items-center">
                  <span className="text-slate-400">Email</span>
                  <span className="text-slate-100 font-semibold">admin@gym.com</span>
                </div>
                <div className="flex justify-between items-center pt-2 border-t border-white/5">
                  <span className="text-slate-400">Password</span>
                  <span className="text-slate-100 font-semibold">Password123!</span>
                </div>
              </div>
            </div>

            <button
              onClick={() => handleQuickLogin("admin@gym.com", "Admin")}
              disabled={loggingInRole !== null}
              className="w-full bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-black font-extrabold py-3.5 rounded-xl text-sm shadow-[0_0_20px_rgba(16,185,129,0.2)] transition-all active:scale-[0.98] flex items-center justify-center gap-2"
            >
              {loggingInRole === "Admin" ? (
                <span className="inline-block animate-spin border-2 border-black border-t-transparent rounded-full w-4 h-4"></span>
              ) : (
                <>
                  <span>Log In as Admin</span>
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                  </svg>
                </>
              )}
            </button>
          </div>

          {/* Staff Role Card */}
          <div className="glass-card rounded-3xl p-8 flex flex-col justify-between relative group overflow-hidden border border-white/10 hover:border-blue-500/50">
            <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 rounded-full blur-2xl group-hover:bg-blue-500/20 transition-all pointer-events-none"></div>
            <div>
              <div className="flex justify-between items-center mb-5">
                <div className="w-12 h-12 rounded-2xl bg-blue-500/15 border border-blue-500/30 text-blue-400 flex items-center justify-center">
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                </div>
                <span className="bg-blue-500/20 text-blue-300 text-[11px] font-extrabold px-3 py-1 rounded-full border border-blue-500/30 tracking-wider">
                  ROLE: STAFF
                </span>
              </div>
              <h3 className="text-2xl font-black text-white mb-2 tracking-tight">Staff / Trainer</h3>
              <p className="text-xs text-slate-400 mb-6 leading-relaxed min-h-[36px]">
                Log counter payments, trigger terminal manual entry overrides, and instruct classes.
              </p>

              <div className="bg-[#0B0D14] border border-white/10 rounded-2xl p-4 space-y-2.5 text-xs mb-6 font-mono tabular-nums">
                <div className="flex justify-between items-center">
                  <span className="text-slate-400">Email</span>
                  <span className="text-slate-100 font-semibold">staff@gym.com</span>
                </div>
                <div className="flex justify-between items-center pt-2 border-t border-white/5">
                  <span className="text-slate-400">Password</span>
                  <span className="text-slate-100 font-semibold">Password123!</span>
                </div>
              </div>
            </div>

            <button
              onClick={() => handleQuickLogin("staff@gym.com", "Staff")}
              disabled={loggingInRole !== null}
              className="w-full bg-blue-500 hover:bg-blue-400 disabled:opacity-50 text-white font-extrabold py-3.5 rounded-xl text-sm shadow-[0_0_20px_rgba(59,130,246,0.2)] transition-all active:scale-[0.98] flex items-center justify-center gap-2"
            >
              {loggingInRole === "Staff" ? (
                <span className="inline-block animate-spin border-2 border-white border-t-transparent rounded-full w-4 h-4"></span>
              ) : (
                <>
                  <span>Log In as Staff</span>
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                  </svg>
                </>
              )}
            </button>
          </div>

          {/* Member Role Card */}
          <div className="glass-card rounded-3xl p-8 flex flex-col justify-between relative group overflow-hidden border border-white/10 hover:border-amber-500/50">
            <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/10 rounded-full blur-2xl group-hover:bg-amber-500/20 transition-all pointer-events-none"></div>
            <div>
              <div className="flex justify-between items-center mb-5">
                <div className="w-12 h-12 rounded-2xl bg-amber-500/15 border border-amber-500/30 text-amber-400 flex items-center justify-center">
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z" />
                  </svg>
                </div>
                <span className="bg-amber-500/20 text-amber-300 text-[11px] font-extrabold px-3 py-1 rounded-full border border-amber-500/30 tracking-wider">
                  ROLE: MEMBER
                </span>
              </div>
              <h3 className="text-2xl font-black text-white mb-2 tracking-tight">Gym Member</h3>
              <p className="text-xs text-slate-400 mb-6 leading-relaxed min-h-[36px]">
                Self-service portal to view subscription status, check-in history, and book class slots.
              </p>

              <div className="bg-[#0B0D14] border border-white/10 rounded-2xl p-4 space-y-2 text-xs mb-6 font-mono tabular-nums">
                <div className="flex justify-between items-center">
                  <span className="text-slate-400">Email</span>
                  <span className="text-slate-100 font-semibold">member@gym.com</span>
                </div>
                <div className="flex justify-between items-center pt-1.5 border-t border-white/5">
                  <span className="text-slate-400">Password</span>
                  <span className="text-slate-100 font-semibold">Password123!</span>
                </div>
                <div className="flex justify-between items-center pt-1.5 border-t border-white/5 text-emerald-400">
                  <span>Member Code</span>
                  <span className="font-bold">GYM-1001</span>
                </div>
              </div>
            </div>

            <button
              onClick={() => handleQuickLogin("member@gym.com", "Member")}
              disabled={loggingInRole !== null}
              className="w-full bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-black font-extrabold py-3.5 rounded-xl text-sm shadow-[0_0_20px_rgba(245,158,11,0.2)] transition-all active:scale-[0.98] flex items-center justify-center gap-2"
            >
              {loggingInRole === "Member" ? (
                <span className="inline-block animate-spin border-2 border-black border-t-transparent rounded-full w-4 h-4"></span>
              ) : (
                <>
                  <span>Log In as Member</span>
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                  </svg>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Feature Capabilities Grid */}
        <div className="pt-6">
          <div className="flex items-center justify-center gap-3 mb-8">
            <div className="h-px w-12 bg-emerald-500/30"></div>
            <h3 className="text-lg font-bold text-slate-200 tracking-tight uppercase tracking-wider text-xs">
              Core Capabilities & Architecture
            </h3>
            <div className="h-px w-12 bg-emerald-500/30"></div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="glass-card rounded-2xl p-6 relative group">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center mb-4 border border-emerald-500/20 group-hover:scale-110 transition-transform">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
                </svg>
              </div>
              <h4 className="font-bold text-white mb-1 text-base">Check-in Kiosk</h4>
              <p className="text-xs text-slate-400 leading-relaxed">
                Scans member QR codes for real-time eligibility evaluation with instant visual result.
              </p>
            </div>

            <div className="glass-card rounded-2xl p-6 relative group">
              <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-400 flex items-center justify-center mb-4 border border-blue-500/20 group-hover:scale-110 transition-transform">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              <h4 className="font-bold text-white mb-1 text-base">Counter Payments</h4>
              <p className="text-xs text-slate-400 leading-relaxed">
                Logs manual counter payments and automatically activates subscriptions in a single transaction.
              </p>
            </div>

            <div className="glass-card rounded-2xl p-6 relative group">
              <div className="w-10 h-10 rounded-xl bg-purple-500/10 text-purple-400 flex items-center justify-center mb-4 border border-purple-500/20 group-hover:scale-110 transition-transform">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              <h4 className="font-bold text-white mb-1 text-base">Member Directory</h4>
              <p className="text-xs text-slate-400 leading-relaxed">
                Registers members with auto-generated codes (<code className="font-mono text-emerald-400">GYM-1001</code>) and tracks attendance logs.
              </p>
            </div>

            <div className="glass-card rounded-2xl p-6 relative group">
              <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center mb-4 border border-amber-500/20 group-hover:scale-110 transition-transform">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <h4 className="font-bold text-white mb-1 text-base">Class Booking</h4>
              <p className="text-xs text-slate-400 leading-relaxed">
                Schedule fitness classes and allow members to reserve slots with real-time capacity guards.
              </p>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="pt-8 border-t border-white/[0.08] flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-slate-500">
        <div className="flex items-center gap-2">
          <span className="font-semibold text-slate-400">FitPulse Management</span>
          <span>&copy; 2026. All rights reserved.</span>
        </div>
        <div className="flex items-center gap-6">
          <a href="#" className="hover:text-slate-300 transition-colors">Privacy Policy</a>
          <a href="#" className="hover:text-slate-300 transition-colors">Terms of Service</a>
          <a href="#" className="hover:text-slate-300 transition-colors">System Health</a>
        </div>
      </footer>
    </div>
  );
}
