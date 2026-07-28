"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { signOut } from "@/lib/auth-client";
import { formatCheckInStatus } from "@/lib/portal";

interface UserProfile {
  id: string;
  name: string;
  email: string;
  memberCode: string | null;
  role: string;
}

interface ActiveSubscription {
  id: string;
  planName: string;
  startDate: string;
  endDate: string;
  status: string;
  daysRemaining: number;
}

interface CheckInEntry {
  id: string;
  status: string;
  checkedInAt: string;
  scannedCode: string | null;
  isOverride: boolean;
  overrideNotes: string | null;
}

interface DashboardData {
  user: UserProfile;
  activeSubscription: ActiveSubscription | null;
  hasExpiredOrNoSubscription: boolean;
  checkIns: CheckInEntry[];
}

export default function MemberPortalPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/portal/dashboard");
      if (!res.ok) {
        if (res.status === 401) {
          window.location.href = "/login";
          return;
        }
        throw new Error("Failed to load portal dashboard");
      }
      const dashboardData = await res.json();
      setData(dashboardData);
    } catch (err: any) {
      setError(err.message || "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const handleSignOut = async () => {
    try {
      await signOut();
      window.location.href = "/login";
    } catch (err) {
      window.location.href = "/login";
    }
  };

  const formatDate = (dateStr?: string | Date) => {
    if (!dateStr) return "-";
    return new Date(dateStr).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const formatTimestamp = (dateStr?: string | Date) => {
    if (!dateStr) return "-";
    const d = new Date(dateStr);
    return (
      d.toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
      }) +
      " " +
      d.toLocaleTimeString("en-US", {
        hour: "2-digit",
        minute: "2-digit",
      })
    );
  };

  return (
    <div className="min-h-screen p-6 md:p-10 max-w-5xl mx-auto bg-[#08090C] text-[#F8FAFC] font-sans">
      {/* Top Header Navigation */}
      <header className="sticky top-0 z-40 bg-[#08090C]/80 backdrop-blur-xl border-b border-white/[0.08] pb-6 mb-8 pt-4">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">Member Portal</h1>
            {data?.user && (
              <div className="flex items-center gap-2 mt-1">
                <span className="text-slate-300 text-sm font-semibold">{data.user.name}</span>
                <span className="text-slate-600">•</span>
                <span className="font-mono text-xs text-emerald-400 font-bold bg-emerald-500/10 px-2.5 py-0.5 rounded-full border border-emerald-500/20 tabular-nums">
                  {data.user.memberCode || "GYM-MEMBER"}
                </span>
              </div>
            )}
          </div>

          <div className="flex items-center gap-3">
            <nav aria-label="Portal Navigation" className="flex items-center gap-1 bg-[#121624] p-1.5 rounded-2xl border border-white/10 shadow-inner">
              <Link
                href="/portal"
                className="px-4 py-2 text-xs font-black rounded-xl bg-emerald-500 text-black shadow-[0_0_15px_rgba(16,185,129,0.3)] transition-all"
              >
                Dashboard
              </Link>
              <Link
                href="/portal/classes"
                className="px-4 py-2 text-xs font-bold rounded-xl text-slate-400 hover:text-white hover:bg-white/5 transition-all"
              >
                Classes & Booking
              </Link>
            </nav>

            <button
              onClick={handleSignOut}
              className="bg-white/5 hover:bg-rose-500/15 text-slate-400 hover:text-rose-400 border border-white/10 hover:border-rose-500/30 px-3.5 py-2 rounded-xl text-xs font-bold transition-all active:scale-[0.98]"
            >
              Sign Out
            </button>
          </div>
        </div>
      </header>

      {error && (
        <div className="bg-rose-500/10 border border-rose-500/30 text-rose-300 p-4 rounded-2xl mb-6 text-xs flex items-center gap-2">
          <span>⚠️ {error}</span>
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-24 text-slate-400 gap-3">
          <div className="w-5 h-5 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
          <span className="text-sm font-medium">Loading dashboard data...</span>
        </div>
      ) : data ? (
        <div className="space-y-10">
          {/* Section 1: Active Subscription Details or Renewal Notice */}
          <div>
            <h2 className="text-lg font-black text-white mb-4 tracking-tight flex items-center gap-2">
              <svg className="w-5 h-5 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z" />
              </svg>
              Membership Status
            </h2>

            {data.hasExpiredOrNoSubscription || !data.activeSubscription ? (
              /* Renewal Alert Banner */
              <div className="bg-amber-950/30 border border-amber-500/30 rounded-3xl p-6 relative overflow-hidden shadow-xl">
                <div className="flex items-start gap-4">
                  <div className="bg-amber-500/20 text-amber-400 p-3 rounded-2xl shrink-0">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-base font-extrabold text-amber-400">
                      Subscription Expired or Inactive
                    </h3>
                    <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                      You currently do not have an active membership plan. Please visit the gym front desk to select a plan and renew your entry pass.
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              /* Active Subscription Details Card */
              <div className="glass-panel rounded-3xl p-8 shadow-2xl relative border border-white/10">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6 mb-6">
                  <div>
                    <div className="flex items-center gap-3">
                      <h3 className="text-2xl font-black text-white tracking-tight">
                        {data.activeSubscription.planName}
                      </h3>
                      <span className="px-3 py-1 rounded-full text-xs font-black bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 uppercase tracking-wider">
                        Active Pass
                      </span>
                    </div>
                    <p className="text-xs text-slate-400 mt-1 font-mono tabular-nums">
                      Subscription ID: {data.activeSubscription.id}
                    </p>
                  </div>

                  {/* Days Remaining Countdown Pill */}
                  <div className="bg-[#0B0D14] border border-white/10 px-6 py-3.5 rounded-2xl text-center shadow-inner">
                    <span className="text-3xl font-black font-mono text-emerald-400 block leading-none tabular-nums">
                      {data.activeSubscription.daysRemaining}
                    </span>
                    <span className="text-[10px] uppercase tracking-wider text-slate-400 font-extrabold mt-1 block">
                      Days Remaining
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-6 border-t border-white/10">
                  <div>
                    <span className="text-xs font-bold text-slate-400 block mb-1 uppercase tracking-wider">
                      Start Date
                    </span>
                    <span className="text-sm font-mono text-white tabular-nums">
                      {formatDate(data.activeSubscription.startDate)}
                    </span>
                  </div>
                  <div>
                    <span className="text-xs font-bold text-slate-400 block mb-1 uppercase tracking-wider">
                      Expiration Date
                    </span>
                    <span className="text-sm font-mono text-white tabular-nums">
                      {formatDate(data.activeSubscription.endDate)}
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Section 2: Personal Attendance History Log */}
          <div>
            <h2 className="text-lg font-black text-white mb-4 tracking-tight flex items-center gap-2">
              <svg className="w-5 h-5 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Attendance History
            </h2>

            {!data.checkIns || data.checkIns.length === 0 ? (
              <div className="glass-panel rounded-3xl p-10 text-center text-slate-400 text-xs border border-white/10">
                No check-in history logged yet. Scan your member badge at the entry kiosk to record attendance.
              </div>
            ) : (
              <div className="glass-panel rounded-3xl overflow-hidden shadow-2xl border border-white/10">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="bg-[#0B0D14] border-b border-white/10 text-slate-400 font-bold uppercase tracking-wider text-[11px]">
                        <th className="py-4 px-6">Check-In Timestamp</th>
                        <th className="py-4 px-6">Entry Status</th>
                        <th className="py-4 px-6">Notes / Override</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      {data.checkIns.map((ci) => (
                        <tr
                          key={ci.id}
                          className="hover:bg-white/5 transition-colors"
                        >
                          <td className="py-4 px-6 font-mono text-white tabular-nums">
                            {formatTimestamp(ci.checkedInAt)}
                          </td>
                          <td className="py-4 px-6">
                            <span
                              className={`inline-flex items-center px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${
                                ci.status === "granted"
                                  ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                                  : ci.status === "denied_expired"
                                  ? "bg-rose-500/20 text-rose-400 border border-rose-500/30"
                                  : "bg-amber-500/20 text-amber-400 border border-amber-500/30"
                              }`}
                            >
                              {formatCheckInStatus(ci.status)}
                            </span>
                          </td>
                          <td className="py-4 px-6 text-xs text-slate-400">
                            {ci.isOverride ? (
                              <span className="text-amber-400 font-medium">
                                Manual Override: {ci.overrideNotes || "Granted by staff"}
                              </span>
                            ) : (
                              "-"
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        </div>
      ) : null}
    </div>
  );
}
