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
    <div className="min-h-screen p-6 max-w-7xl mx-auto bg-[#090A0F] text-[#F3F4F6] flex flex-col font-sans">
      {/* Top Admin Navigation Header */}
      <AdminNav
        title="Check-in Terminal & Entry Verification"
        subtitle="Scan member QR code or ID badge for real-time eligibility evaluation"
        badgeText="Terminal Mode"
      />

      {/* Main Kiosk & Scan Section */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 flex-1">
        {/* Left Column: Barcode Reader & Visual Result */}
        <div className="lg:col-span-8 flex flex-col gap-6">
          {/* Scanner Input Box */}
          <div className="bg-[#12141C] border border-[#222634] rounded-2xl p-6 shadow-xl relative overflow-hidden">
            <div className="flex justify-between items-center mb-4">
              <label htmlFor="scanInput" className="text-sm font-semibold text-[#9CA3AF] flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-[#10B981] animate-pulse"></span>
                READY TO SCAN (SCANNER AUTO-FOCUSED)
              </label>
              {countdown !== null && (
                <button
                  onClick={clearResult}
                  className="text-xs bg-[#222634] hover:bg-[#2D3346] text-[#9CA3AF] px-3 py-1 rounded-lg transition-colors flex items-center gap-1.5"
                >
                  <span>Reset ({countdown}s)</span>
                  <span>✕</span>
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
                  className="w-full bg-[#090A0F] border border-[#222634] focus:border-[#10B981] focus:ring-2 focus:ring-[#10B981]/20 rounded-xl px-4 py-3.5 text-lg font-mono text-white placeholder-[#4B5563] outline-none transition-all"
                  disabled={loading}
                  autoComplete="off"
                />
              </div>
              <button
                type="submit"
                disabled={loading || !scanInput.trim()}
                className="bg-[#10B981] hover:bg-[#059669] disabled:opacity-50 disabled:cursor-not-allowed text-white px-6 py-3.5 rounded-xl font-bold transition-colors flex items-center gap-2"
              >
                {loading ? "Evaluating..." : "Scan & Verify"}
              </button>
            </form>
          </div>

          {/* Error Banner */}
          {error && (
            <div className="bg-[#EF4444]/15 border-2 border-[#EF4444] rounded-2xl p-6 text-[#F87171] animate-in fade-in slide-in-from-top-4 duration-200">
              <div className="flex items-center gap-3">
                <span className="text-3xl">⚠️</span>
                <div>
                  <h3 className="text-lg font-bold text-white">Scan Error</h3>
                  <p className="text-sm mt-1">{error}</p>
                </div>
              </div>
            </div>
          )}

          {/* Result Card: ACCESS GRANTED (GREEN) */}
          {scanResult && scanResult.checkIn.status === "granted" && (
            <div className="bg-[#059669]/20 border-2 border-[#10B981] rounded-3xl p-8 shadow-2xl relative overflow-hidden animate-in zoom-in-95 duration-200">
              <div className="absolute top-0 right-0 p-6 opacity-10 font-black text-8xl select-none text-[#10B981]">
                GRANTED
              </div>

              <div className="flex items-start gap-5">
                <div className="w-16 h-16 rounded-2xl bg-[#10B981] text-white flex items-center justify-center text-3xl font-bold shadow-lg shrink-0">
                  ✓
                </div>

                <div className="flex-1">
                  <div className="flex flex-wrap items-center gap-3 mb-2">
                    <span className="bg-[#10B981] text-white text-xs font-black px-3 py-1 rounded-full uppercase tracking-wider">
                      ACCESS GRANTED
                    </span>
                    {scanResult.checkIn.isOverride && (
                      <span className="bg-purple-500/20 text-purple-300 border border-purple-500/40 text-xs font-bold px-3 py-1 rounded-full uppercase">
                        ⚡ STAFF OVERRIDE
                      </span>
                    )}
                  </div>

                  <h2 className="text-3xl font-extrabold text-white tracking-tight mb-1">
                    {scanResult.member.name}
                  </h2>
                  <p className="text-[#9CA3AF] text-sm font-mono mb-6">
                    Member Code: <span className="text-white font-bold">{scanResult.member.memberCode || scanResult.member.id}</span>
                  </p>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-[#12141C]/80 border border-[#10B981]/30 rounded-2xl p-4">
                    <div>
                      <span className="text-xs text-[#9CA3AF] uppercase font-semibold">Active Plan</span>
                      <p className="text-lg font-bold text-[#10B981]">
                        {scanResult.subscription?.planName || "Active Membership"}
                      </p>
                    </div>
                    <div>
                      <span className="text-xs text-[#9CA3AF] uppercase font-semibold">Valid Until</span>
                      <p className="text-lg font-bold text-white font-mono">
                        {scanResult.subscription?.endDate ? formatDate(scanResult.subscription.endDate) : "Ongoing / Authorized"}
                      </p>
                    </div>
                  </div>

                  {scanResult.checkIn.overrideNotes && (
                    <div className="mt-4 bg-purple-950/40 border border-purple-500/30 rounded-xl p-3 text-xs text-purple-200">
                      <strong className="text-purple-400">Override Reason:</strong> {scanResult.checkIn.overrideNotes}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Result Card: ACCESS DENIED - EXPIRED (RED) */}
          {scanResult && scanResult.checkIn.status === "denied_expired" && (
            <div className="bg-[#EF4444]/20 border-2 border-[#EF4444] rounded-3xl p-8 shadow-2xl relative overflow-hidden animate-in zoom-in-95 duration-200">
              <div className="absolute top-0 right-0 p-6 opacity-10 font-black text-8xl select-none text-[#EF4444]">
                DENIED
              </div>

              <div className="flex items-start gap-5">
                <div className="w-16 h-16 rounded-2xl bg-[#EF4444] text-white flex items-center justify-center text-3xl font-bold shadow-lg shrink-0">
                  ✕
                </div>

                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <span className="bg-[#EF4444] text-white text-xs font-black px-3 py-1 rounded-full uppercase tracking-wider">
                      ACCESS DENIED — SUBSCRIPTION EXPIRED
                    </span>
                  </div>

                  <h2 className="text-3xl font-extrabold text-white tracking-tight mb-1">
                    {scanResult.member.name}
                  </h2>
                  <p className="text-[#9CA3AF] text-sm font-mono mb-6">
                    Member Code: <span className="text-white font-bold">{scanResult.member.memberCode || scanResult.member.id}</span>
                  </p>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-[#12141C]/80 border border-[#EF4444]/30 rounded-2xl p-4 mb-6">
                    <div>
                      <span className="text-xs text-[#9CA3AF] uppercase font-semibold">Previous Plan</span>
                      <p className="text-lg font-bold text-[#F87171]">
                        {scanResult.subscription?.planName || "Expired Plan"}
                      </p>
                    </div>
                    <div>
                      <span className="text-xs text-[#9CA3AF] uppercase font-semibold">Expired On</span>
                      <p className="text-lg font-bold text-[#F87171] font-mono">
                        {scanResult.subscription?.endDate ? formatDate(scanResult.subscription.endDate) : "Past Date"}
                      </p>
                    </div>
                  </div>

                  {/* Staff Manual Override Button */}
                  <button
                    onClick={() => setIsOverrideModalOpen(true)}
                    className="w-full bg-[#EF4444] hover:bg-[#DC2626] text-white font-bold px-6 py-3.5 rounded-xl transition-all shadow-lg flex items-center justify-center gap-2"
                  >
                    <span>⚡ Trigger Staff Manual Override</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Result Card: ACCESS DENIED - NO ACTIVE PLAN (AMBER) */}
          {scanResult && scanResult.checkIn.status === "denied_no_plan" && (
            <div className="bg-[#F59E0B]/20 border-2 border-[#F59E0B] rounded-3xl p-8 shadow-2xl relative overflow-hidden animate-in zoom-in-95 duration-200">
              <div className="absolute top-0 right-0 p-6 opacity-10 font-black text-8xl select-none text-[#F59E0B]">
                NO PLAN
              </div>

              <div className="flex items-start gap-5">
                <div className="w-16 h-16 rounded-2xl bg-[#F59E0B] text-white flex items-center justify-center text-3xl font-bold shadow-lg shrink-0">
                  !
                </div>

                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <span className="bg-[#F59E0B] text-black text-xs font-black px-3 py-1 rounded-full uppercase tracking-wider">
                      ACCESS DENIED — NO ACTIVE PLAN
                    </span>
                  </div>

                  <h2 className="text-3xl font-extrabold text-white tracking-tight mb-1">
                    {scanResult.member.name}
                  </h2>
                  <p className="text-[#9CA3AF] text-sm font-mono mb-6">
                    Member Code: <span className="text-white font-bold">{scanResult.member.memberCode || scanResult.member.id}</span>
                  </p>

                  <div className="bg-[#12141C]/80 border border-[#F59E0B]/30 rounded-2xl p-4 mb-6">
                    <p className="text-sm text-[#FBBF24]">
                      This member currently has no recorded active subscription plan.
                    </p>
                  </div>

                  {/* Staff Manual Override Button */}
                  <button
                    onClick={() => setIsOverrideModalOpen(true)}
                    className="w-full bg-[#F59E0B] hover:bg-[#D97706] text-black font-extrabold px-6 py-3.5 rounded-xl transition-all shadow-lg flex items-center justify-center gap-2"
                  >
                    <span>⚡ Trigger Staff Manual Override</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Placeholder state when no scan result */}
          {!scanResult && !error && (
            <div className="bg-[#12141C] border border-[#222634] rounded-3xl p-12 text-center text-[#9CA3AF] flex flex-col items-center justify-center min-h-[260px]">
              <div className="w-16 h-16 rounded-full bg-[#222634] flex items-center justify-center text-2xl mb-4 text-[#10B981]">
                📲
              </div>
              <h3 className="text-lg font-bold text-white mb-1">Awaiting Scanner Input</h3>
              <p className="text-sm text-[#9CA3AF] max-w-md">
                Scan barcode/QR token or type member code in the box above to immediately evaluate entry access.
              </p>
            </div>
          )}
        </div>

        {/* Right Column: Real-time Check-In Audit Stream */}
        <div className="lg:col-span-4 flex flex-col">
          <div className="bg-[#12141C] border border-[#222634] rounded-2xl p-6 flex-1 flex flex-col shadow-xl">
            <div className="flex justify-between items-center mb-4 pb-3 border-b border-[#222634]">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <span>📋</span> Recent Audit Feed
              </h3>
              <button
                onClick={fetchRecentLogs}
                className="text-xs text-[#10B981] hover:underline font-medium"
              >
                Refresh
              </button>
            </div>

            <div className="flex-1 overflow-y-auto space-y-3 max-h-[550px] pr-1">
              {recentLogs.length === 0 ? (
                <p className="text-sm text-[#9CA3AF] py-6 text-center">No check-in audit logs yet.</p>
              ) : (
                recentLogs.map((log) => {
                  const isGranted = log.status === "granted";
                  const isExpired = log.status === "denied_expired";
                  return (
                    <div
                      key={log.id}
                      className="bg-[#090A0F] border border-[#222634] rounded-xl p-3.5 text-xs transition-colors hover:border-[#2D3346]"
                    >
                      <div className="flex justify-between items-start mb-1.5">
                        <span className="font-bold text-white text-sm">{log.memberName}</span>
                        <span
                          className={`px-2 py-0.5 rounded-full font-bold uppercase text-[10px] ${
                            isGranted
                              ? "bg-[#10B981]/20 text-[#10B981] border border-[#10B981]/30"
                              : isExpired
                              ? "bg-[#EF4444]/20 text-[#EF4444] border border-[#EF4444]/30"
                              : "bg-[#F59E0B]/20 text-[#F59E0B] border border-[#F59E0B]/30"
                          }`}
                        >
                          {log.status}
                        </span>
                      </div>

                      <div className="flex justify-between items-center text-[#9CA3AF]">
                        <span className="font-mono">{log.memberCode || "No code"}</span>
                        <span>{formatTime(log.checkedInAt)}</span>
                      </div>

                      {log.isOverride && (
                        <div className="mt-2 text-[11px] bg-purple-950/40 text-purple-300 border border-purple-500/30 rounded px-2 py-1">
                          <strong>Override:</strong> {log.overrideNotes || "Granted manually"}
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
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#12141C] border border-[#222634] rounded-2xl max-w-md w-full p-6 shadow-2xl">
            <div className="flex justify-between items-center mb-4 pb-3 border-b border-[#222634]">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <span>⚡</span> Staff Manual Override
              </h3>
              <button
                onClick={() => setIsOverrideModalOpen(false)}
                className="text-[#9CA3AF] hover:text-white text-lg font-bold"
              >
                ✕
              </button>
            </div>

            <p className="text-sm text-[#9CA3AF] mb-4">
              Manually authorizing entry for <strong className="text-white">{scanResult?.member?.name}</strong>. Provide audit notes below for record keeping.
            </p>

            {overrideError && (
              <div className="bg-[#EF4444]/15 border border-[#EF4444] text-[#F87171] text-xs p-3 rounded-lg mb-4">
                {overrideError}
              </div>
            )}

            <form onSubmit={handleOverrideSubmit}>
              <div className="mb-5">
                <label className="block text-xs font-semibold text-[#9CA3AF] mb-1.5 uppercase">
                  Override Audit Notes / Reason *
                </label>
                <textarea
                  rows={3}
                  value={overrideNotes}
                  onChange={(e) => setOverrideNotes(e.target.value)}
                  placeholder="e.g. Counter payment verified, Day pass issued, Keycard forgotten"
                  className="w-full bg-[#090A0F] border border-[#222634] focus:border-[#10B981] focus:ring-1 focus:ring-[#10B981] rounded-xl p-3 text-sm text-white placeholder-[#4B5563] outline-none"
                  required
                />
              </div>

              <div className="flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsOverrideModalOpen(false)}
                  className="bg-[#222634] hover:bg-[#2D3346] text-[#F3F4F6] px-4 py-2 rounded-xl text-sm font-semibold transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={overrideSubmitting}
                  className="bg-[#10B981] hover:bg-[#059669] disabled:opacity-50 text-white px-5 py-2 rounded-xl text-sm font-bold shadow-lg transition-colors flex items-center gap-2"
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
