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
    <div className="min-h-screen p-8 max-w-7xl mx-auto bg-[#090A0F] text-[#F3F4F6] font-sans">
      {/* Member Navigation Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 pb-6 mb-8 border-b border-[#222634]">
        <div>
          <h1 className="text-3xl font-extrabold text-[#10B981] tracking-tight">
            Gym Classes & Session Booking
          </h1>
          <p className="text-[#9CA3AF] text-sm mt-1">
            Browse upcoming fitness sessions, reserve your spot, and manage class bookings
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 bg-[#12141C] p-1.5 rounded-xl border border-[#222634]">
            <Link
              href="/portal"
              className="px-4 py-1.5 text-xs font-semibold rounded-lg text-[#9CA3AF] hover:text-[#F3F4F6] transition-colors"
            >
              Dashboard
            </Link>
            <Link
              href="/portal/classes"
              className="px-4 py-1.5 text-xs font-semibold rounded-lg bg-[#10B981] text-white shadow-sm"
            >
              Classes & Booking
            </Link>
          </div>

          <button
            onClick={() => signOut()}
            className="bg-[#222634] hover:bg-[#2D3346] text-[#9CA3AF] hover:text-white px-4 py-2 rounded-xl text-xs font-semibold transition-colors"
          >
            Sign Out
          </button>
        </div>
      </div>

      {/* Global Error Banner */}
      {error && (
        <div className="bg-[#EF4444]/15 border border-[#EF4444] text-[#F87171] p-4 rounded-xl mb-8 flex items-center justify-between">
          <span>{error}</span>
          <button onClick={() => setError(null)} className="text-sm font-bold">✕</button>
        </div>
      )}

      {loading ? (
        <div className="text-[#9CA3AF] py-12 text-center">Loading class schedule...</div>
      ) : (
        <div className="space-y-10">
          {/* Section 1: My Confirmed Bookings */}
          {myBookings.filter((b) => b.status === "confirmed" || b.status === "booked").length > 0 && (
            <div>
              <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                <span>🎫</span> My Booked Sessions
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {myBookings
                  .filter((b) => b.status === "confirmed" || b.status === "booked")
                  .map((b) => (
                    <div
                      key={b.id}
                      className="bg-[#10B981]/10 border-2 border-[#10B981]/40 rounded-2xl p-6 flex flex-col justify-between shadow-xl relative"
                    >
                      <div>
                        <div className="flex justify-between items-start mb-3">
                          <h3 className="text-lg font-extrabold text-white">{b.className}</h3>
                          <span className="bg-[#10B981] text-white text-[10px] font-black px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                            CONFIRMED
                          </span>
                        </div>

                        <div className="space-y-2 text-sm text-[#9CA3AF] mb-4">
                          <div className="flex items-center gap-2">
                            <span>📅</span>
                            <span className="text-white font-semibold">{formatDate(b.startTime)}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span>⏰</span>
                            <span className="font-mono text-white">
                              {formatTime(b.startTime)} – {formatTime(b.endTime)}
                            </span>
                          </div>
                          {b.trainerName && (
                            <div className="flex items-center gap-2">
                              <span>👤</span>
                              <span>Trainer: <strong className="text-white">{b.trainerName}</strong></span>
                            </div>
                          )}
                        </div>
                      </div>

                      <button
                        onClick={() => handleCancelBooking(b.id)}
                        disabled={actionLoadingId === b.id}
                        className="w-full bg-[#EF4444]/20 hover:bg-[#EF4444] text-[#F87171] hover:text-white font-bold py-2.5 rounded-xl text-xs transition-all border border-[#EF4444]/40"
                      >
                        {actionLoadingId === b.id ? "Cancelling..." : "Cancel Booking"}
                      </button>
                    </div>
                  ))}
              </div>
            </div>
          )}

          {/* Section 2: Browse Upcoming Classes Schedule */}
          <div>
            <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
              <span>📅</span> Browse Upcoming Class Schedule
            </h2>

            {schedules.length === 0 ? (
              <div className="bg-[#12141C] border border-[#222634] rounded-2xl p-12 text-center text-[#9CA3AF]">
                No upcoming class sessions available right now. Check back soon!
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {schedules.map((item) => {
                  const isFull = item.availableSlots === 0;

                  return (
                    <div
                      key={item.id}
                      className={`bg-[#12141C] border ${
                        item.isBooked
                          ? "border-[#10B981]/50 bg-[#10B981]/5"
                          : isFull
                          ? "border-[#222634]/60 opacity-80"
                          : "border-[#222634]"
                      } rounded-2xl p-6 flex flex-col justify-between shadow-lg relative`}
                    >
                      <div>
                        <div className="flex justify-between items-start mb-2">
                          <h3 className="text-xl font-bold text-white">{item.className}</h3>
                          <span
                            className={`text-xs px-2.5 py-1 rounded-full font-bold uppercase ${
                              item.isBooked
                                ? "bg-purple-500/20 text-purple-300 border border-purple-500/40"
                                : isFull
                                ? "bg-[#EF4444]/20 text-[#EF4444] border border-[#EF4444]/30"
                                : "bg-[#10B981]/20 text-[#10B981] border border-[#10B981]/30"
                            }`}
                          >
                            {item.isBooked
                              ? "BOOKED"
                              : isFull
                              ? "FULL"
                              : `${item.availableSlots} SLOTS LEFT`}
                          </span>
                        </div>

                        <p className="text-[#9CA3AF] text-sm mb-4 min-h-[40px]">
                          {item.classDescription || "No description available."}
                        </p>

                        <div className="space-y-2 text-sm text-[#9CA3AF] mb-6 bg-[#090A0F] border border-[#222634] rounded-xl p-3">
                          <div className="flex justify-between items-center">
                            <span className="text-xs uppercase font-semibold">Date</span>
                            <span className="text-white font-medium">{formatDate(item.startTime)}</span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-xs uppercase font-semibold">Time</span>
                            <span className="font-mono text-white">
                              {formatTime(item.startTime)} – {formatTime(item.endTime)}
                            </span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-xs uppercase font-semibold">Trainer</span>
                            <span className="text-white font-medium">{item.trainerName || "Unassigned"}</span>
                          </div>
                        </div>
                      </div>

                      {/* Action Button */}
                      <div>
                        {item.isBooked && item.userBookingId ? (
                          <button
                            onClick={() => handleCancelBooking(item.userBookingId!)}
                            disabled={actionLoadingId === item.userBookingId}
                            className="w-full bg-[#EF4444]/20 hover:bg-[#EF4444] text-[#F87171] hover:text-white font-bold py-3 rounded-xl text-xs transition-all border border-[#EF4444]/40"
                          >
                            {actionLoadingId === item.userBookingId ? "Cancelling..." : "Cancel Booking"}
                          </button>
                        ) : isFull ? (
                          <button
                            disabled
                            className="w-full bg-[#222634] text-[#6B7280] font-bold py-3 rounded-xl text-xs cursor-not-allowed uppercase"
                          >
                            Class Full
                          </button>
                        ) : (
                          <button
                            onClick={() => handleBookSlot(item.id)}
                            disabled={actionLoadingId === item.id}
                            className="w-full bg-[#10B981] hover:bg-[#059669] text-white font-bold py-3 rounded-xl text-xs shadow-lg transition-all"
                          >
                            {actionLoadingId === item.id ? "Booking..." : "Book Class Slot"}
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
