"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { AdminNav } from "../components/AdminNav";

interface MemberInfo {
  id: string;
  name: string;
  email: string;
  memberCode: string | null;
}

interface SubscriptionInfo {
  id?: string;
  planName?: string;
  endDate?: string;
  status?: string;
}

interface CheckInRecord {
  id: string;
  status: "granted" | "denied_expired" | "denied_no_plan" | string;
  isOverride: boolean;
  overrideNotes: string | null;
  checkedInAt: string;
}

interface ScanResultResponse {
  checkIn: CheckInRecord;
  member: MemberInfo;
  subscription: SubscriptionInfo | null;
}

interface AuditLogEntry {
  id: string;
  status: string;
  scannedCode: string | null;
  isOverride: boolean;
  overrideNotes: string | null;
  checkedInAt: string;
  memberId: string;
  memberName: string;
  memberEmail: string;
  memberCode: string | null;
}

export default function AdminCheckInTerminalPage() {
  const [scanInput, setScanInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [scanResult, setScanResult] = useState<ScanResultResponse | null>(null);
  const [recentLogs, setRecentLogs] = useState<AuditLogEntry[]>([]);

  // Staff Override Modal state
  const [isOverrideModalOpen, setIsOverrideModalOpen] = useState(false);
  const [overrideNotes, setOverrideNotes] = useState("");
  const [overrideSubmitting, setOverrideSubmitting] = useState(false);
  const [overrideError, setOverrideError] = useState<string | null>(null);

  // Auto reset timer state
  const [countdown, setCountdown] = useState<number | null>(null);

  const inputRef = useRef<HTMLInputElement>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Auto-focus scan input on load
  useEffect(() => {
    inputRef.current?.focus();
    fetchRecentLogs();
  }, []);

  // Handle auto-reset timer when scan result is present
  useEffect(() => {
    if (!scanResult) {
      setCountdown(null);
      return;
    }

    setCountdown(8);

    if (timerRef.current) clearInterval(timerRef.current);

    timerRef.current = setInterval(() => {
      setCountdown((prev) => {
        if (prev === null || prev <= 1) {
          if (timerRef.current) clearInterval(timerRef.current);
          setScanResult(null);
          setError(null);
          setTimeout(() => inputRef.current?.focus(), 100);
          return null;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [scanResult]);

  const fetchRecentLogs = async () => {
    try {
      const res = await fetch("/api/check-in?limit=15");
      if (res.ok) {
        const data = await res.json();
        setRecentLogs(data);
      }
    } catch (err) {
      console.error("Failed to load recent check-in logs", err);
    }
  };

  const processScan = async (codeToScan: string) => {
    if (!codeToScan.trim()) return;

    setLoading(true);
    setError(null);
    setScanResult(null);

    try {
      const res = await fetch("/api/check-in", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: codeToScan.trim() }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Check-in request failed");
      }

      setScanResult(data);
      setScanInput("");
      fetchRecentLogs();
    } catch (err: any) {
      setError(err.message || "Failed to process scan code");
    } finally {
      setLoading(false);
    }
  };

  const handleScanSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    processScan(scanInput);
  };

  const handleOverrideSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!scanResult?.member?.id) return;

    setOverrideSubmitting(true);
    setOverrideError(null);

    try {
      const res = await fetch("/api/check-in", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          isOverride: true,
          memberId: scanResult.member.id,
          overrideNotes: overrideNotes.trim() || "Staff manual override",
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to perform staff override");
      }

      setScanResult(data);
      setIsOverrideModalOpen(false);
      setOverrideNotes("");
      fetchRecentLogs();
    } catch (err: any) {
      setOverrideError(err.message || "Override failed");
    } finally {
      setOverrideSubmitting(false);
    }
  };

  const formatDate = (dateStr?: string | null) => {
    if (!dateStr) return "-";
    return new Date(dateStr).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const formatTime = (dateStr?: string | null) => {
    if (!dateStr) return "-";
    return new Date(dateStr).toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
  };

  const clearResult = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    setScanResult(null);
    setError(null);
    setCountdown(null);
    inputRef.current?.focus();
  };

  return (
    <div className="min-h-screen p-6 md:p-10 max-w-7xl mx-auto bg-[#08090C] text-[#F8FAFC] flex flex-col font-sans">
      {/* Top Admin Navigation Header */}
      <AdminNav
        title="Check-in Kiosk Terminal"
        subtitle="Scan member QR codes or ID badges for real-time entry eligibility verification"
        badgeText="Terminal Kiosk"
      />

      {/* Main Kiosk & Scan Section */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 flex-1">
        {/* Left Column: Barcode Reader & Visual Result */}
        <div className="lg:col-span-8 flex flex-col gap-6">
          {/* Scanner Input Box */}
          <div className="glass-panel rounded-3xl p-6 shadow-2xl relative overflow-hidden border border-white/10">
            <div className="flex justify-between items-center mb-4">
              <label htmlFor="scanInput" className="text-xs font-bold tracking-wider text-slate-300 uppercase flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse"></span>
                Scanner Ready (Auto-Focused)
              </label>
              {countdown !== null && (
                <button
                  onClick={clearResult}
                  className="text-xs bg-white/5 hover:bg-white/10 text-slate-400 border border-white/10 px-3 py-1 rounded-xl transition-all flex items-center gap-1.5 active:scale-[0.98]"
                >
                  <span>Reset Screen ({countdown}s)</span>
                  <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              )}
            </div>

            <form onSubmit={handleScanSubmit} className="flex gap-3">
              <div className="relative flex-1">
                <input
                  ref={inputRef}
                  id="scanInput"
                  type="text"
                  value={scanInput}
                  onChange={(e) => setScanInput(e.target.value)}
                  placeholder="Scan QR token, Member Code (e.g. GYM-1001), or Email..."
                  className="w-full bg-[#0B0D14] border border-white/10 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 rounded-2xl px-5 py-4 text-base font-mono text-white placeholder-slate-500 outline-none transition-all tabular-nums"
                  disabled={loading}
                  autoComplete="off"
                />
              </div>
              <button
                type="submit"
                disabled={loading || !scanInput.trim()}
                className="bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-black px-6 py-4 rounded-2xl font-black transition-all shadow-[0_0_20px_rgba(16,185,129,0.2)] active:scale-[0.98] flex items-center gap-2"
              >
                {loading ? (
                  <span className="inline-block animate-spin border-2 border-black border-t-transparent rounded-full w-4 h-4"></span>
                ) : (
                  <>
                    <span>Scan & Verify</span>
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
                    </svg>
                  </>
                )}
              </button>
            </form>
          </div>

          {/* Error Banner */}
          {error && (
            <div className="bg-rose-500/10 border border-rose-500/30 rounded-3xl p-6 text-rose-300 animate-in fade-in slide-in-from-top-4 duration-200">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-rose-500/20 text-rose-400 flex items-center justify-center font-black">!</div>
                <div>
                  <h3 className="text-base font-extrabold text-white">Scan Error</h3>
                  <p className="text-xs text-rose-300/90 mt-0.5">{error}</p>
                </div>
              </div>
            </div>
          )}

          {/* Result Card: ACCESS GRANTED (GREEN) */}
          {scanResult && scanResult.checkIn.status === "granted" && (
            <div className="bg-emerald-950/40 border-2 border-emerald-500 rounded-3xl p-8 shadow-[0_0_50px_rgba(16,185,129,0.2)] relative overflow-hidden animate-in zoom-in-95 duration-200">
              <div className="absolute top-0 right-0 p-6 opacity-10 font-black text-8xl select-none text-emerald-400 tracking-tighter">
                GRANTED
              </div>

              <div className="flex items-start gap-6">
                <div className="w-16 h-16 rounded-2xl bg-emerald-500 text-black flex items-center justify-center text-3xl font-black shadow-lg shrink-0">
                  ✓
                </div>

                <div className="flex-1">
                  <div className="flex flex-wrap items-center gap-2.5 mb-2">
                    <span className="bg-emerald-500 text-black text-xs font-black px-3.5 py-1 rounded-full uppercase tracking-wider">
                      ACCESS GRANTED
                    </span>
                    {scanResult.checkIn.isOverride && (
                      <span className="bg-purple-500/20 text-purple-300 border border-purple-500/40 text-xs font-extrabold px-3.5 py-1 rounded-full uppercase tracking-wider">
                        STAFF OVERRIDE
                      </span>
                    )}
                  </div>

                  <h2 className="text-3xl font-black text-white tracking-tight mb-1">
                    {scanResult.member.name}
                  </h2>
                  <p className="text-slate-400 text-xs font-mono mb-6 tabular-nums">
                    Member Code: <span className="text-emerald-400 font-bold">{scanResult.member.memberCode || scanResult.member.id}</span>
                  </p>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-[#0B0D14]/80 border border-emerald-500/30 rounded-2xl p-4">
                    <div>
                      <span className="text-[11px] text-slate-400 uppercase font-bold tracking-wider">Active Plan</span>
                      <p className="text-base font-extrabold text-emerald-400">
                        {scanResult.subscription?.planName || "Active Membership"}
                      </p>
                    </div>
                    <div>
                      <span className="text-[11px] text-slate-400 uppercase font-bold tracking-wider">Valid Until</span>
                      <p className="text-base font-extrabold text-white font-mono tabular-nums">
                        {scanResult.subscription?.endDate ? formatDate(scanResult.subscription.endDate) : "Ongoing / Authorized"}
                      </p>
                    </div>
                  </div>

                  {scanResult.checkIn.overrideNotes && (
                    <div className="mt-4 bg-purple-950/60 border border-purple-500/30 rounded-xl p-3 text-xs text-purple-200">
                      <strong className="text-purple-400">Override Reason:</strong> {scanResult.checkIn.overrideNotes}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Result Card: ACCESS DENIED - EXPIRED (RED) */}
          {scanResult && scanResult.checkIn.status === "denied_expired" && (
            <div className="bg-rose-950/40 border-2 border-rose-500 rounded-3xl p-8 shadow-[0_0_50px_rgba(244,63,94,0.2)] relative overflow-hidden animate-in zoom-in-95 duration-200">
              <div className="absolute top-0 right-0 p-6 opacity-10 font-black text-8xl select-none text-rose-500 tracking-tighter">
                DENIED
              </div>

              <div className="flex items-start gap-6">
                <div className="w-16 h-16 rounded-2xl bg-rose-500 text-white flex items-center justify-center text-3xl font-black shadow-lg shrink-0">
                  ✕
                </div>

                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <span className="bg-rose-500 text-white text-xs font-black px-3.5 py-1 rounded-full uppercase tracking-wider">
                      DENIED — SUBSCRIPTION EXPIRED
                    </span>
                  </div>

                  <h2 className="text-3xl font-black text-white tracking-tight mb-1">
                    {scanResult.member.name}
                  </h2>
                  <p className="text-slate-400 text-xs font-mono mb-6 tabular-nums">
                    Member Code: <span className="text-slate-200 font-bold">{scanResult.member.memberCode || scanResult.member.id}</span>
                  </p>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-[#0B0D14]/80 border border-rose-500/30 rounded-2xl p-4 mb-6">
                    <div>
                      <span className="text-[11px] text-slate-400 uppercase font-bold tracking-wider">Previous Plan</span>
                      <p className="text-base font-extrabold text-rose-400">
                        {scanResult.subscription?.planName || "Expired Plan"}
                      </p>
                    </div>
                    <div>
                      <span className="text-[11px] text-slate-400 uppercase font-bold tracking-wider">Expired On</span>
                      <p className="text-base font-extrabold text-rose-400 font-mono tabular-nums">
                        {scanResult.subscription?.endDate ? formatDate(scanResult.subscription.endDate) : "Past Date"}
                      </p>
                    </div>
                  </div>

                  <button
                    onClick={() => setIsOverrideModalOpen(true)}
                    className="w-full bg-rose-500 hover:bg-rose-400 text-white font-black px-6 py-3.5 rounded-2xl transition-all shadow-[0_0_20px_rgba(244,63,94,0.3)] active:scale-[0.98] flex items-center justify-center gap-2"
                  >
                    <span>Trigger Staff Manual Override</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Result Card: ACCESS DENIED - NO ACTIVE PLAN (AMBER) */}
          {scanResult && scanResult.checkIn.status === "denied_no_plan" && (
            <div className="bg-amber-950/40 border-2 border-amber-500 rounded-3xl p-8 shadow-[0_0_50px_rgba(245,158,11,0.2)] relative overflow-hidden animate-in zoom-in-95 duration-200">
              <div className="absolute top-0 right-0 p-6 opacity-10 font-black text-8xl select-none text-amber-500 tracking-tighter">
                NO PLAN
              </div>

              <div className="flex items-start gap-6">
                <div className="w-16 h-16 rounded-2xl bg-amber-500 text-black flex items-center justify-center text-3xl font-black shadow-lg shrink-0">
                  !
                </div>

                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <span className="bg-amber-500 text-black text-xs font-black px-3.5 py-1 rounded-full uppercase tracking-wider">
                      DENIED — NO ACTIVE PLAN
                    </span>
                  </div>

                  <h2 className="text-3xl font-black text-white tracking-tight mb-1">
                    {scanResult.member.name}
                  </h2>
                  <p className="text-slate-400 text-xs font-mono mb-6 tabular-nums">
                    Member Code: <span className="text-slate-200 font-bold">{scanResult.member.memberCode || scanResult.member.id}</span>
                  </p>

                  <div className="bg-[#0B0D14]/80 border border-amber-500/30 rounded-2xl p-4 mb-6">
                    <p className="text-xs text-amber-300">
                      This member currently has no recorded active subscription plan in system directory.
                    </p>
                  </div>

                  <button
                    onClick={() => setIsOverrideModalOpen(true)}
                    className="w-full bg-amber-500 hover:bg-amber-400 text-black font-black px-6 py-3.5 rounded-2xl transition-all shadow-[0_0_20px_rgba(245,158,11,0.3)] active:scale-[0.98] flex items-center justify-center gap-2"
                  >
                    <span>Trigger Staff Manual Override</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Placeholder state when no scan result */}
          {!scanResult && !error && (
            <div className="glass-panel rounded-3xl p-12 text-center text-slate-400 flex flex-col items-center justify-center min-h-[260px] border border-white/10">
              <div className="w-16 h-16 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-emerald-400 mb-4">
                <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
                </svg>
              </div>
              <h3 className="text-lg font-bold text-white mb-1">Awaiting Terminal Input</h3>
              <p className="text-xs text-slate-400 max-w-md">
                Scan barcode/QR token or input member code to immediately evaluate entry access eligibility.
              </p>
            </div>
          )}
        </div>

        {/* Right Column: Real-time Check-In Audit Stream */}
        <div className="lg:col-span-4 flex flex-col">
          <div className="glass-panel rounded-3xl p-6 flex-1 flex flex-col shadow-2xl border border-white/10">
            <div className="flex justify-between items-center mb-4 pb-3 border-b border-white/10">
              <h3 className="text-sm font-extrabold text-white uppercase tracking-wider flex items-center gap-2">
                <svg className="w-4 h-4 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Audit Feed Stream
              </h3>
              <button
                onClick={fetchRecentLogs}
                className="text-xs text-emerald-400 hover:text-emerald-300 font-bold transition-colors"
              >
                Refresh
              </button>
            </div>

            <div className="flex-1 overflow-y-auto space-y-3 max-h-[550px] pr-1">
              {recentLogs.length === 0 ? (
                <p className="text-xs text-slate-500 py-8 text-center font-medium">No check-in audit logs recorded yet.</p>
              ) : (
                recentLogs.map((log) => {
                  const isGranted = log.status === "granted";
                  const isExpired = log.status === "denied_expired";
                  return (
                    <div
                      key={log.id}
                      className="bg-[#0B0D14] border border-white/10 rounded-2xl p-4 text-xs transition-all hover:border-white/20"
                    >
                      <div className="flex justify-between items-start mb-2">
                        <span className="font-extrabold text-white text-sm tracking-tight">{log.memberName}</span>
                        <span
                          className={`px-2.5 py-0.5 rounded-full font-black uppercase text-[9px] tracking-wider ${
                            isGranted
                              ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                              : isExpired
                              ? "bg-rose-500/20 text-rose-400 border border-rose-500/30"
                              : "bg-amber-500/20 text-amber-400 border border-amber-500/30"
                          }`}
                        >
                          {log.status}
                        </span>
                      </div>

                      <div className="flex justify-between items-center text-slate-400 font-mono tabular-nums text-[11px]">
                        <span>{log.memberCode || "No code"}</span>
                        <span>{formatTime(log.checkedInAt)}</span>
                      </div>

                      {log.isOverride && (
                        <div className="mt-2 text-[11px] bg-purple-950/60 text-purple-300 border border-purple-500/30 rounded-xl px-2.5 py-1 font-sans">
                          <strong className="text-purple-400">Override:</strong> {log.overrideNotes || "Granted manually"}
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Staff Manual Override Modal */}
      {isOverrideModalOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="glass-panel border border-white/10 rounded-3xl max-w-md w-full p-6 shadow-2xl">
            <div className="flex justify-between items-center mb-4 pb-3 border-b border-white/10">
              <h3 className="text-base font-extrabold text-white flex items-center gap-2">
                <span className="text-amber-400">⚡</span> Staff Manual Override
              </h3>
              <button
                onClick={() => setIsOverrideModalOpen(false)}
                className="text-slate-400 hover:text-white text-sm font-bold p-1"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-slate-300 mb-4 leading-relaxed">
              Manually authorizing entry for <strong className="text-white font-bold">{scanResult?.member?.name}</strong>. Provide audit notes below for record keeping.
            </p>

            {overrideError && (
              <div className="bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs p-3.5 rounded-2xl mb-4">
                {overrideError}
              </div>
            )}

            <form onSubmit={handleOverrideSubmit}>
              <div className="mb-5">
                <label className="block text-xs font-bold text-slate-300 mb-1.5 uppercase tracking-wider">
                  Override Audit Reason *
                </label>
                <textarea
                  rows={3}
                  value={overrideNotes}
                  onChange={(e) => setOverrideNotes(e.target.value)}
                  placeholder="e.g. Counter payment verified, Day pass issued, Keycard forgotten"
                  className="w-full bg-[#0B0D14] border border-white/10 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 rounded-2xl p-3.5 text-xs text-white placeholder-slate-500 outline-none transition-all"
                  required
                />
              </div>

              <div className="flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsOverrideModalOpen(false)}
                  className="bg-white/5 hover:bg-white/10 text-slate-300 border border-white/10 px-4 py-2.5 rounded-xl text-xs font-bold transition-all active:scale-[0.98]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={overrideSubmitting}
                  className="bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-black px-5 py-2.5 rounded-xl text-xs font-black shadow-lg transition-all active:scale-[0.98] flex items-center gap-2"
                >
                  {overrideSubmitting ? "Authorizing..." : "Grant Entry (Override)"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
