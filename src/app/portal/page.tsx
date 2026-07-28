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
    <div className="min-h-screen p-6 md:p-10 max-w-5xl mx-auto bg-[#090A0F] text-[#F3F4F6]">
      {/* Top Header Navigation */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8 pb-6 border-b border-[#222634]">
        <div>
          <h1 className="text-3xl font-bold text-[#F3F4F6]">Member Portal</h1>
          {data?.user && (
            <div className="flex items-center gap-2 mt-1">
              <span className="text-[#9CA3AF] text-sm">{data.user.name}</span>
              <span className="text-[#9CA3AF]">•</span>
              <span className="font-mono text-xs text-[#10B981] font-semibold bg-[#10B981]/10 px-2 py-0.5 rounded border border-[#10B981]/20">
                {data.user.memberCode || "GYM-MEMBER"}
              </span>
            </div>
          )}
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 bg-[#12141C] p-1.5 rounded-xl border border-[#222634]">
            <Link
              href="/portal"
              className="px-4 py-1.5 text-xs font-semibold rounded-lg bg-[#10B981] text-white shadow-sm"
            >
              Dashboard
            </Link>
            <Link
              href="/portal/classes"
              className="px-4 py-1.5 text-xs font-semibold rounded-lg text-[#9CA3AF] hover:text-[#F3F4F6] transition-colors"
            >
              Classes & Booking
            </Link>
          </div>

          <button
            onClick={handleSignOut}
            className="bg-[#1A1D29] hover:bg-[#222634] text-[#9CA3AF] hover:text-[#F3F4F6] px-4 py-2 rounded-lg text-sm font-medium border border-[#222634] transition-colors"
          >
            Sign Out
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-[#EF4444]/10 border border-[#EF4444] text-[#EF4444] p-4 rounded-xl mb-6 text-sm">
          {error}
        </div>
      )}

      {loading ? (
        <div className="text-[#9CA3AF] py-20 text-center">Loading dashboard...</div>
      ) : data ? (
        <div className="space-y-8">
          {/* Section 1: Active Subscription Details or Renewal Notice */}
          <div>
            <h2 className="text-xl font-bold text-[#F3F4F6] mb-4">Membership Status</h2>

            {data.hasExpiredOrNoSubscription || !data.activeSubscription ? (
              /* Renewal Alert Banner */
              <div className="bg-[#F59E0B]/10 border border-[#F59E0B]/40 rounded-xl p-6 relative overflow-hidden shadow-lg">
                <div className="flex items-start gap-4">
                  <div className="bg-[#F59E0B]/20 text-[#F59E0B] p-3 rounded-lg flex-shrink-0">
                    <svg
                      className="w-6 h-6"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                      />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-[#F59E0B]">
                      Subscription Expired or Inactive
                    </h3>
                    <p className="text-sm text-[#F3F4F6]/90 mt-1 leading-relaxed">
                      You currently do not have an active membership plan. Please visit the gym front desk to select a membership plan and renew your access.
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              /* Active Subscription Details Card */
              <div className="bg-[#12141C] border border-[#222634] rounded-xl p-6 shadow-xl relative">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
                  <div>
                    <div className="flex items-center gap-3">
                      <h3 className="text-2xl font-bold text-[#F3F4F6]">
                        {data.activeSubscription.planName}
                      </h3>
                      <span className="px-3 py-1 rounded-full text-xs font-semibold font-mono bg-[#10B981]/15 text-[#10B981] border border-[#10B981]/30">
                        Active
                      </span>
                    </div>
                    <p className="text-xs text-[#9CA3AF] mt-1 font-mono">
                      Plan ID: {data.activeSubscription.id}
                    </p>
                  </div>

                  {/* Days Remaining Countdown Pill */}
                  <div className="bg-[#090A0F] border border-[#222634] px-5 py-3 rounded-xl text-center">
                    <span className="text-2xl font-extrabold font-mono text-[#10B981] block leading-none">
                      {data.activeSubscription.daysRemaining}
                    </span>
                    <span className="text-[11px] uppercase tracking-wider text-[#9CA3AF] font-semibold mt-1 block">
                      Days Remaining
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 border-t border-[#222634]">
                  <div>
                    <span className="text-xs font-semibold text-[#9CA3AF] block mb-1">
                      Start Date
                    </span>
                    <span className="text-sm font-mono text-[#F3F4F6]">
                      {formatDate(data.activeSubscription.startDate)}
                    </span>
                  </div>
                  <div>
                    <span className="text-xs font-semibold text-[#9CA3AF] block mb-1">
                      Expiration Date
                    </span>
                    <span className="text-sm font-mono text-[#F3F4F6]">
                      {formatDate(data.activeSubscription.endDate)}
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Section 2: Personal Attendance History Log */}
          <div>
            <h2 className="text-xl font-bold text-[#F3F4F6] mb-4">Attendance History</h2>

            {!data.checkIns || data.checkIns.length === 0 ? (
              <div className="bg-[#12141C] border border-[#222634] rounded-xl p-10 text-center text-[#9CA3AF] text-sm">
                No check-in history logged yet. Scan your member badge at the entry terminal to record attendance.
              </div>
            ) : (
              <div className="bg-[#12141C] border border-[#222634] rounded-xl overflow-hidden shadow-xl">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-sm">
                    <thead>
                      <tr className="bg-[#1A1D29] border-b border-[#222634] text-[#9CA3AF] font-semibold">
                        <th className="py-3.5 px-6">Check-In Timestamp</th>
                        <th className="py-3.5 px-6">Entry Status</th>
                        <th className="py-3.5 px-6">Notes / Override</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#222634]">
                      {data.checkIns.map((ci) => (
                        <tr
                          key={ci.id}
                          className="hover:bg-[#1A1D29]/50 transition-colors"
                        >
                          <td className="py-4 px-6 font-mono text-[#F3F4F6] text-xs">
                            {formatTimestamp(ci.checkedInAt)}
                          </td>
                          <td className="py-4 px-6">
                            <span
                              className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold font-mono ${
                                ci.status === "granted"
                                  ? "bg-[#10B981]/15 text-[#10B981] border border-[#10B981]/30"
                                  : ci.status === "denied_expired"
                                  ? "bg-[#EF4444]/15 text-[#EF4444] border border-[#EF4444]/30"
                                  : "bg-[#F59E0B]/15 text-[#F59E0B] border border-[#F59E0B]/30"
                              }`}
                            >
                              {formatCheckInStatus(ci.status)}
                            </span>
                          </td>
                          <td className="py-4 px-6 text-xs text-[#9CA3AF]">
                            {ci.isOverride ? (
                              <span className="text-[#F59E0B]">
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
