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
      <div className="min-h-screen bg-[#090A0F] text-[#F3F4F6] flex items-center justify-center font-sans">
        <div className="text-[#9CA3AF] text-sm animate-pulse">Loading Gym Management System...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#090A0F] text-[#F3F4F6] font-sans flex flex-col justify-between p-6 md:p-12 max-w-7xl mx-auto">
      {/* Top Header */}
      <header className="flex justify-between items-center pb-8 border-b border-[#222634]">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#10B981] text-white flex items-center justify-center font-black text-xl shadow-lg">
            🏋️
          </div>
          <div>
            <h1 className="text-2xl font-black tracking-tight text-white">Gym Management System</h1>
            <p className="text-xs text-[#9CA3AF]">Entry Verification, Counter Payments, & Class Booking</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/login"
            className="bg-[#222634] hover:bg-[#2D3346] text-[#F3F4F6] px-5 py-2.5 rounded-xl text-sm font-semibold transition-colors"
          >
            Sign In
          </Link>
          <Link
            href="/register"
            className="bg-[#10B981] hover:bg-[#059669] text-white px-5 py-2.5 rounded-xl text-sm font-extrabold shadow-lg transition-colors"
          >
            Register
          </Link>
        </div>
      </header>

      {/* Hero & Credentials Section */}
      <main className="my-12 space-y-12">
        <div className="text-center max-w-3xl mx-auto space-y-4">
          <span className="bg-[#10B981]/15 text-[#10B981] border border-[#10B981]/30 text-xs px-3 py-1 rounded-full font-bold uppercase tracking-wider">
            Ready to Explore
          </span>
          <h2 className="text-4xl md:text-5xl font-black text-white tracking-tight leading-tight">
            Comprehensive Management & Member Portal
          </h2>
          <p className="text-[#9CA3AF] text-base md:text-lg">
            Select a role below to log in instantly using pre-configured demo credentials.
          </p>
        </div>

        {/* Default Role Credentials Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Admin Role Card */}
          <div className="bg-[#12141C] border-2 border-[#10B981]/40 hover:border-[#10B981] rounded-3xl p-8 flex flex-col justify-between shadow-2xl transition-all">
            <div>
              <div className="flex justify-between items-center mb-4">
                <span className="w-12 h-12 rounded-2xl bg-[#10B981]/20 text-[#10B981] flex items-center justify-center text-2xl font-bold">
                  🛡️
                </span>
                <span className="bg-[#10B981] text-white text-[10px] font-black px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                  ROLE: ADMIN
                </span>
              </div>
              <h3 className="text-xl font-bold text-white mb-2">Administrator</h3>
              <p className="text-xs text-[#9CA3AF] mb-6 min-h-[36px]">
                Full management access to membership plans, member directory, and kiosk terminals.
              </p>

              <div className="bg-[#090A0F] border border-[#222634] rounded-xl p-3.5 space-y-2 text-xs mb-6 font-mono">
                <div className="flex justify-between">
                  <span className="text-[#9CA3AF]">Email:</span>
                  <span className="text-white font-bold">admin@gym.com</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#9CA3AF]">Password:</span>
                  <span className="text-white font-bold">Password123!</span>
                </div>
              </div>
            </div>

            <button
              onClick={() => handleQuickLogin("admin@gym.com", "Admin")}
              disabled={loggingInRole !== null}
              className="w-full bg-[#10B981] hover:bg-[#059669] disabled:opacity-50 text-white font-extrabold py-3.5 rounded-xl text-sm shadow-lg transition-all"
            >
              {loggingInRole === "Admin" ? "Logging in..." : "⚡ Log In as Admin"}
            </button>
          </div>

          {/* Staff Role Card */}
          <div className="bg-[#12141C] border-2 border-[#3B82F6]/40 hover:border-[#3B82F6] rounded-3xl p-8 flex flex-col justify-between shadow-2xl transition-all">
            <div>
              <div className="flex justify-between items-center mb-4">
                <span className="w-12 h-12 rounded-2xl bg-[#3B82F6]/20 text-[#3B82F6] flex items-center justify-center text-2xl font-bold">
                  📋
                </span>
                <span className="bg-[#3B82F6] text-white text-[10px] font-black px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                  ROLE: STAFF
                </span>
              </div>
              <h3 className="text-xl font-bold text-white mb-2">Staff / Trainer</h3>
              <p className="text-xs text-[#9CA3AF] mb-6 min-h-[36px]">
                Log counter payments, trigger terminal manual entry overrides, and instruct classes.
              </p>

              <div className="bg-[#090A0F] border border-[#222634] rounded-xl p-3.5 space-y-2 text-xs mb-6 font-mono">
                <div className="flex justify-between">
                  <span className="text-[#9CA3AF]">Email:</span>
                  <span className="text-white font-bold">staff@gym.com</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#9CA3AF]">Password:</span>
                  <span className="text-white font-bold">Password123!</span>
                </div>
              </div>
            </div>

            <button
              onClick={() => handleQuickLogin("staff@gym.com", "Staff")}
              disabled={loggingInRole !== null}
              className="w-full bg-[#3B82F6] hover:bg-[#2563EB] disabled:opacity-50 text-white font-extrabold py-3.5 rounded-xl text-sm shadow-lg transition-all"
            >
              {loggingInRole === "Staff" ? "Logging in..." : "⚡ Log In as Staff"}
            </button>
          </div>

          {/* Member Role Card */}
          <div className="bg-[#12141C] border-2 border-[#F59E0B]/40 hover:border-[#F59E0B] rounded-3xl p-8 flex flex-col justify-between shadow-2xl transition-all">
            <div>
              <div className="flex justify-between items-center mb-4">
                <span className="w-12 h-12 rounded-2xl bg-[#F59E0B]/20 text-[#F59E0B] flex items-center justify-center text-2xl font-bold">
                  🎫
                </span>
                <span className="bg-[#F59E0B] text-black text-[10px] font-black px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                  ROLE: MEMBER
                </span>
              </div>
              <h3 className="text-xl font-bold text-white mb-2">Gym Member</h3>
              <p className="text-xs text-[#9CA3AF] mb-6 min-h-[36px]">
                Self-service portal to view subscription status, check-in history, and book class slots.
              </p>

              <div className="bg-[#090A0F] border border-[#222634] rounded-xl p-3.5 space-y-2 text-xs mb-6 font-mono">
                <div className="flex justify-between">
                  <span className="text-[#9CA3AF]">Email:</span>
                  <span className="text-white font-bold">member@gym.com</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#9CA3AF]">Password:</span>
                  <span className="text-white font-bold">Password123!</span>
                </div>
                <div className="flex justify-between text-[#10B981]">
                  <span>Member Code:</span>
                  <span className="font-bold">GYM-1001</span>
                </div>
              </div>
            </div>

            <button
              onClick={() => handleQuickLogin("member@gym.com", "Member")}
              disabled={loggingInRole !== null}
              className="w-full bg-[#F59E0B] hover:bg-[#D97706] disabled:opacity-50 text-black font-extrabold py-3.5 rounded-xl text-sm shadow-lg transition-all"
            >
              {loggingInRole === "Member" ? "Logging in..." : "⚡ Log In as Member"}
            </button>
          </div>
        </div>

        {/* Feature Matrix Cards */}
        <div>
          <h3 className="text-xl font-bold text-white mb-6 text-center">
            System Modules & Capabilities
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-[#12141C] border border-[#222634] rounded-2xl p-5 text-sm">
              <div className="text-2xl mb-2">📲</div>
              <h4 className="font-bold text-white mb-1">Check-in Kiosk Terminal</h4>
              <p className="text-xs text-[#9CA3AF]">
                Scans member QR codes for real-time eligibility evaluation with green/red visual results.
              </p>
            </div>

            <div className="bg-[#12141C] border border-[#222634] rounded-2xl p-5 text-sm">
              <div className="text-2xl mb-2">💳</div>
              <h4 className="font-bold text-white mb-1">Counter Payments</h4>
              <p className="text-xs text-[#9CA3AF]">
                Logs manual counter payments and automatically activates subscriptions in a single transaction.
              </p>
            </div>

            <div className="bg-[#12141C] border border-[#222634] rounded-2xl p-5 text-sm">
              <div className="text-2xl mb-2">👤</div>
              <h4 className="font-bold text-white mb-1">Member Directory</h4>
              <p className="text-xs text-[#9CA3AF]">
                Registers members with auto-generated codes (`GYM-1001`) and tracks attendance logs.
              </p>
            </div>

            <div className="bg-[#12141C] border border-[#222634] rounded-2xl p-5 text-sm">
              <div className="text-2xl mb-2">📅</div>
              <h4 className="font-bold text-white mb-1">Class Booking</h4>
              <p className="text-xs text-[#9CA3AF]">
                Schedule fitness classes and allow members to reserve slots with real-time capacity guards.
              </p>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="pt-8 border-t border-[#222634] text-center text-xs text-[#9CA3AF]">
        Gym Management System &copy; 2026. Built with Next.js 16, Drizzle ORM, & Better Auth.
      </footer>
    </div>
  );
}
