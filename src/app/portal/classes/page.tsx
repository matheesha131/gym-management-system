"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { signOut } from "@/lib/auth-client";

interface ClassScheduleItem {
  id: string;
  classId: string;
  className: string;
  classDescription: string | null;
  capacity: number;
  trainerId: string | null;
  trainerName: string | null;
  startTime: string;
  endTime: string;
  currentBookings: number;
  availableSlots: number;
  isBooked: boolean;
  userBookingId: string | null;
}

interface MyBookingItem {
  id: string;
  scheduleId: string;
  status: string;
  createdAt: string;
  className: string;
  startTime: string;
  endTime: string;
  trainerName: string | null;
}

export default function MemberPortalClassesPage() {
  const [schedules, setSchedules] = useState<ClassScheduleItem[]>([]);
  const [myBookings, setMyBookings] = useState<MyBookingItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);

  const fetchClassesData = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch("/api/portal/classes");
      if (!res.ok) {
        if (res.status === 401) {
          window.location.href = "/login";
          return;
        }
        throw new Error("Failed to load class schedules");
      }
      const data = await res.json();
      setSchedules(data.schedules || []);
      setMyBookings(data.myBookings || []);
    } catch (err: any) {
      setError(err.message || "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchClassesData();
  }, []);

  const handleBookSlot = async (scheduleId: string) => {
    try {
      setActionLoadingId(scheduleId);
      setError(null);

      const res = await fetch("/api/portal/classes/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ scheduleId }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to book class slot");
      }

      fetchClassesData();
    } catch (err: any) {
      setError(err.message || "Failed to book class slot");
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleCancelBooking = async (bookingId: string) => {
    try {
      setActionLoadingId(bookingId);
      setError(null);

      const res = await fetch("/api/portal/classes/bookings/cancel", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bookingId }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to cancel booking");
      }

      fetchClassesData();
    } catch (err: any) {
      setError(err.message || "Failed to cancel booking");
    } finally {
      setActionLoadingId(null);
    }
  };

  const formatDate = (dateStr: string) => {
    if (!dateStr) return "-";
    const date = new Date(dateStr);
    return date.toLocaleDateString("en-US", {
      weekday: "short",
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const formatTime = (dateStr: string) => {
    if (!dateStr) return "-";
    const date = new Date(dateStr);
    return date.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className="min-h-screen p-6 md:p-10 max-w-7xl mx-auto bg-[#08090C] text-[#F8FAFC] font-sans">
      {/* Member Navigation Header */}
      <header className="sticky top-0 z-40 bg-[#08090C]/80 backdrop-blur-xl border-b border-white/[0.08] pb-6 mb-8 pt-4">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-black text-white tracking-tight">
              Class Booking & Schedule
            </h1>
            <p className="text-slate-400 text-xs md:text-sm mt-1">
              Reserve your spot in upcoming fitness sessions and manage confirmed bookings
            </p>
          </div>

          <div className="flex items-center gap-3">
            <nav aria-label="Portal Navigation" className="flex items-center gap-1 bg-[#121624] p-1.5 rounded-2xl border border-white/10 shadow-inner">
              <Link
                href="/portal"
                className="px-4 py-2 text-xs font-bold rounded-xl text-slate-400 hover:text-white hover:bg-white/5 transition-all"
              >
                Dashboard
              </Link>
              <Link
                href="/portal/classes"
                className="px-4 py-2 text-xs font-black rounded-xl bg-emerald-500 text-black shadow-[0_0_15px_rgba(16,185,129,0.3)] transition-all"
              >
                Classes & Booking
              </Link>
            </nav>

            <button
              onClick={() => signOut()}
              className="bg-white/5 hover:bg-rose-500/15 text-slate-400 hover:text-rose-400 border border-white/10 hover:border-rose-500/30 px-3.5 py-2 rounded-xl text-xs font-bold transition-all active:scale-[0.98]"
            >
              Sign Out
            </button>
          </div>
        </div>
      </header>

      {/* Global Error Banner */}
      {error && (
        <div className="bg-rose-500/10 border border-rose-500/30 text-rose-300 p-4 rounded-2xl mb-8 flex items-center justify-between text-xs">
          <span>⚠️ {error}</span>
          <button onClick={() => setError(null)} className="text-sm font-bold p-1">✕</button>
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-24 text-slate-400 gap-3">
          <div className="w-5 h-5 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
          <span className="text-sm font-medium">Loading class schedule...</span>
        </div>
      ) : (
        <div className="space-y-12">
          {/* Section 1: My Confirmed Bookings */}
          {myBookings.filter((b) => b.status === "confirmed" || b.status === "booked").length > 0 && (
            <div>
              <h2 className="text-lg font-black text-white mb-4 tracking-tight flex items-center gap-2">
                <svg className="w-5 h-5 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z" />
                </svg>
                My Reserved Sessions
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 items-stretch">
                {myBookings
                  .filter((b) => b.status === "confirmed" || b.status === "booked")
                  .map((b) => (
                    <div
                      key={b.id}
                      className="glass-panel rounded-3xl p-6 flex flex-col justify-between shadow-2xl relative border-2 border-emerald-500/40 bg-emerald-950/20"
                    >
                      <div>
                        <div className="flex justify-between items-start mb-3">
                          <h3 className="text-lg font-black text-white">{b.className}</h3>
                          <span className="bg-emerald-500 text-black text-[10px] font-black px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                            CONFIRMED
                          </span>
                        </div>

                        <div className="space-y-2 text-xs text-slate-300 mb-6 bg-[#0B0D14] border border-white/10 rounded-2xl p-3.5 font-mono tabular-nums">
                          <div className="flex justify-between">
                            <span className="text-slate-400">Date</span>
                            <span className="text-white font-bold">{formatDate(b.startTime)}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-slate-400">Time</span>
                            <span className="text-emerald-400 font-bold">
                              {formatTime(b.startTime)} – {formatTime(b.endTime)}
                            </span>
                          </div>
                          {b.trainerName && (
                            <div className="flex justify-between">
                              <span className="text-slate-400">Trainer</span>
                              <span className="text-white font-bold">{b.trainerName}</span>
                            </div>
                          )}
                        </div>
                      </div>

                      <button
                        onClick={() => handleCancelBooking(b.id)}
                        disabled={actionLoadingId === b.id}
                        className="w-full bg-rose-500/15 hover:bg-rose-500 text-rose-300 hover:text-white font-extrabold py-3 rounded-xl text-xs transition-all border border-rose-500/30 active:scale-[0.98]"
                      >
                        {actionLoadingId === b.id ? "Cancelling..." : "Cancel Reservation"}
                      </button>
                    </div>
                  ))}
              </div>
            </div>
          )}

          {/* Section 2: Browse Upcoming Classes Schedule */}
          <div>
            <h2 className="text-lg font-black text-white mb-4 tracking-tight flex items-center gap-2">
              <svg className="w-5 h-5 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              Upcoming Classes & Slot Availability
            </h2>

            {schedules.length === 0 ? (
              <div className="glass-panel rounded-3xl p-12 text-center text-slate-400 text-xs border border-white/10">
                No upcoming class sessions scheduled. Please check back later!
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 items-stretch">
                {schedules.map((item) => {
                  const isFull = item.availableSlots === 0;

                  return (
                    <div
                      key={item.id}
                      className={`glass-card rounded-3xl p-6 flex flex-col justify-between shadow-xl relative border ${
                        item.isBooked
                          ? "border-emerald-500/50 bg-emerald-950/10"
                          : isFull
                          ? "border-white/5 opacity-70"
                          : "border-white/10"
                      }`}
                    >
                      <div>
                        <div className="flex justify-between items-start mb-2 gap-2">
                          <h3 className="text-lg font-black text-white tracking-tight">{item.className}</h3>
                          <span
                            className={`text-[10px] px-2.5 py-0.5 rounded-full font-black uppercase tracking-wider shrink-0 ${
                              item.isBooked
                                ? "bg-purple-500/20 text-purple-300 border border-purple-500/40"
                                : isFull
                                ? "bg-rose-500/20 text-rose-400 border border-rose-500/30"
                                : "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                            }`}
                          >
                            {item.isBooked
                              ? "RESERVED"
                              : isFull
                              ? "FULL"
                              : `${item.availableSlots} SLOTS LEFT`}
                          </span>
                        </div>

                        <p className="text-xs text-slate-400 mb-4 min-h-[36px] leading-relaxed">
                          {item.classDescription || "No description available for this session."}
                        </p>

                        <div className="space-y-2 text-xs text-slate-300 mb-6 bg-[#0B0D14] border border-white/10 rounded-2xl p-3.5 font-mono tabular-nums">
                          <div className="flex justify-between items-center">
                            <span className="text-[11px] uppercase tracking-wider text-slate-400 font-bold">Date</span>
                            <span className="text-white font-semibold">{formatDate(item.startTime)}</span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-[11px] uppercase tracking-wider text-slate-400 font-bold">Time</span>
                            <span className="text-emerald-400 font-bold">
                              {formatTime(item.startTime)} – {formatTime(item.endTime)}
                            </span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-[11px] uppercase tracking-wider text-slate-400 font-bold">Trainer</span>
                            <span className="text-white font-semibold">{item.trainerName || "Staff Trainer"}</span>
                          </div>
                        </div>
                      </div>

                      {/* Action Button */}
                      <div>
                        {item.isBooked && item.userBookingId ? (
                          <button
                            onClick={() => handleCancelBooking(item.userBookingId!)}
                            disabled={actionLoadingId === item.userBookingId}
                            className="w-full bg-rose-500/15 hover:bg-rose-500 text-rose-300 hover:text-white font-extrabold py-3 rounded-xl text-xs transition-all border border-rose-500/30 active:scale-[0.98]"
                          >
                            {actionLoadingId === item.userBookingId ? "Cancelling..." : "Cancel Reservation"}
                          </button>
                        ) : isFull ? (
                          <button
                            disabled
                            className="w-full bg-white/5 text-slate-500 font-bold py-3 rounded-xl text-xs cursor-not-allowed uppercase border border-white/5"
                          >
                            Class Capacity Full
                          </button>
                        ) : (
                          <button
                            onClick={() => handleBookSlot(item.id)}
                            disabled={actionLoadingId === item.id}
                            className="w-full bg-emerald-500 hover:bg-emerald-400 text-black font-extrabold py-3 rounded-xl text-xs shadow-[0_0_15px_rgba(16,185,129,0.2)] transition-all active:scale-[0.98]"
                          >
                            {actionLoadingId === item.id ? "Reserving..." : "Reserve Class Slot"}
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
