"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { AdminNav } from "../components/AdminNav";

interface Trainer {
  id: string;
  name: string;
  email: string;
  role: string;
}

interface GymClassTemplate {
  id: string;
  name: string;
  description: string | null;
  trainerId: string | null;
  trainerName?: string | null;
  capacity: number;
  createdAt: string;
}

interface ClassScheduleItem {
  id: string;
  classId: string;
  className: string;
  classCapacity: number;
  trainerId: string | null;
  trainerName: string | null;
  startTime: string;
  endTime: string;
  currentBookings: number;
}

export default function AdminClassesPage() {
  const [classes, setClasses] = useState<GymClassTemplate[]>([]);
  const [trainers, setTrainers] = useState<Trainer[]>([]);
  const [schedules, setSchedules] = useState<ClassScheduleItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Modal 1: Create Class Template State
  const [isClassModalOpen, setIsClassModalOpen] = useState(false);
  const [className, setClassName] = useState("");
  const [classDescription, setClassDescription] = useState("");
  const [classTrainerId, setClassTrainerId] = useState("");
  const [classCapacity, setClassCapacity] = useState(20);
  const [classSubmitting, setClassSubmitting] = useState(false);
  const [classFormError, setClassFormError] = useState<string | null>(null);

  // Modal 2: Schedule Session State
  const [isScheduleModalOpen, setIsScheduleModalOpen] = useState(false);
  const [selectedClassId, setSelectedClassId] = useState("");
  const [scheduleTrainerId, setScheduleTrainerId] = useState("");
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [scheduleSubmitting, setScheduleSubmitting] = useState(false);
  const [scheduleFormError, setScheduleFormError] = useState<string | null>(null);

  const fetchClassesAndSchedules = async () => {
    try {
      setLoading(true);
      setError(null);

      const [classesRes, schedulesRes] = await Promise.all([
        fetch("/api/admin/classes"),
        fetch("/api/admin/classes/schedules"),
      ]);

      if (!classesRes.ok) throw new Error("Failed to fetch gym classes");
      if (!schedulesRes.ok) throw new Error("Failed to fetch class schedules");

      const classesData = await classesRes.json();
      const schedulesData = await schedulesRes.json();

      setClasses(classesData.classes || []);
      setTrainers(classesData.trainers || []);
      setSchedules(schedulesData || []);
    } catch (err: any) {
      setError(err.message || "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchClassesAndSchedules();
  }, []);

  const openCreateClassModal = () => {
    setClassName("");
    setClassDescription("");
    setClassTrainerId("");
    setClassCapacity(20);
    setClassFormError(null);
    setIsClassModalOpen(true);
  };

  const openScheduleModal = (preselectedClassId?: string) => {
    setSelectedClassId(preselectedClassId || (classes[0]?.id ?? ""));
    setScheduleTrainerId("");
    setStartTime("");
    setEndTime("");
    setScheduleFormError(null);
    setIsScheduleModalOpen(true);
  };

  const handleCreateClassSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setClassFormError(null);

    if (!className.trim()) {
      setClassFormError("Class name is required");
      return;
    }

    try {
      setClassSubmitting(true);
      const res = await fetch("/api/admin/classes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: className.trim(),
          description: classDescription.trim() || null,
          trainerId: classTrainerId || null,
          capacity: Number(classCapacity),
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to create class template");

      setIsClassModalOpen(false);
      fetchClassesAndSchedules();
    } catch (err: any) {
      setClassFormError(err.message || "Failed to create class template");
    } finally {
      setClassSubmitting(false);
    }
  };

  const handleScheduleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setScheduleFormError(null);

    if (!selectedClassId) {
      setScheduleFormError("Please select a gym class");
      return;
    }

    if (!startTime || !endTime) {
      setScheduleFormError("Start and end times are required");
      return;
    }

    if (new Date(startTime) >= new Date(endTime)) {
      setScheduleFormError("End time must be after start time");
      return;
    }

    try {
      setScheduleSubmitting(true);
      const res = await fetch("/api/admin/classes/schedules", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          classId: selectedClassId,
          trainerId: scheduleTrainerId || null,
          startTime: new Date(startTime).toISOString(),
          endTime: new Date(endTime).toISOString(),
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to schedule class session");

      setIsScheduleModalOpen(false);
      fetchClassesAndSchedules();
    } catch (err: any) {
      setScheduleFormError(err.message || "Failed to schedule class session");
    } finally {
      setScheduleSubmitting(false);
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
      {/* Top Admin Navigation Header */}
      <AdminNav
        title="Class Scheduling & Operations"
        subtitle="Create class templates, assign trainers, set capacities, and manage session schedules"
        badgeText="Class Manager"
      />

      {/* Global Error Banner */}
      {error && (
        <div className="bg-rose-500/10 border border-rose-500/30 text-rose-300 p-4 rounded-2xl mb-8 text-xs flex items-center gap-2">
          <span>⚠️ {error}</span>
        </div>
      )}

      {/* Action Buttons Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
        <h2 className="text-lg font-black text-white tracking-tight flex items-center gap-2">
          <svg className="w-5 h-5 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          Classes & Operational Timetable
        </h2>
        <div className="flex items-center gap-3">
          <button
            onClick={openCreateClassModal}
            className="bg-white/5 hover:bg-white/10 text-slate-200 border border-white/10 px-4 py-2.5 rounded-xl text-xs font-bold transition-all active:scale-[0.98]"
          >
            + Create Class Template
          </button>
          <button
            onClick={() => openScheduleModal()}
            className="bg-emerald-500 hover:bg-emerald-400 text-black px-4 py-2.5 rounded-xl text-xs font-black shadow-[0_0_15px_rgba(16,185,129,0.25)] transition-all active:scale-[0.98] flex items-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
            </svg>
            <span>Schedule New Session</span>
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-24 text-slate-400 gap-3">
          <div className="w-5 h-5 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
          <span className="text-sm font-medium">Loading classes and schedules...</span>
        </div>
      ) : (
        <div className="space-y-12">
          {/* Section 1: Scheduled Sessions Stream */}
          <div>
            <h3 className="text-sm font-black text-slate-300 uppercase tracking-wider mb-4">
              Upcoming Scheduled Class Sessions ({schedules.length})
            </h3>

            {schedules.length === 0 ? (
              <div className="glass-panel rounded-3xl p-8 text-center text-slate-400 text-xs border border-white/10">
                No class sessions scheduled yet. Click "Schedule New Session" to create one.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 items-stretch">
                {schedules.map((item) => {
                  const availableSlots = Math.max(0, item.classCapacity - item.currentBookings);
                  const isFull = availableSlots === 0;

                  return (
                    <div
                      key={item.id}
                      className="glass-card rounded-3xl p-6 flex flex-col justify-between shadow-xl relative border border-white/10"
                    >
                      <div>
                        <div className="flex justify-between items-start mb-3 gap-2">
                          <h4 className="text-lg font-black text-white tracking-tight">{item.className}</h4>
                          <span
                            className={`text-[10px] px-2.5 py-0.5 rounded-full font-black uppercase tracking-wider shrink-0 ${
                              isFull
                                ? "bg-rose-500/20 text-rose-400 border border-rose-500/30"
                                : "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                            }`}
                          >
                            {isFull ? "FULL" : `${availableSlots} Slots Left`}
                          </span>
                        </div>

                        <div className="space-y-2 text-xs text-slate-300 mb-6 bg-[#0B0D14] border border-white/10 rounded-2xl p-3.5 font-mono tabular-nums">
                          <div className="flex justify-between items-center">
                            <span className="text-slate-400 font-sans text-[11px] font-bold uppercase">Date</span>
                            <span className="text-white font-semibold">{formatDate(item.startTime)}</span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-slate-400 font-sans text-[11px] font-bold uppercase">Time</span>
                            <span className="text-emerald-400 font-bold">
                              {formatTime(item.startTime)} – {formatTime(item.endTime)}
                            </span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-slate-400 font-sans text-[11px] font-bold uppercase">Trainer</span>
                            <span className="text-white font-semibold">{item.trainerName || "Staff Trainer"}</span>
                          </div>
                        </div>
                      </div>

                      <div className="pt-4 border-t border-white/10 flex justify-between items-center text-xs">
                        <span className="text-slate-400 font-medium">Booked / Capacity</span>
                        <span className="font-mono font-bold text-white text-sm tabular-nums">
                          {item.currentBookings} / {item.classCapacity}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Section 2: Gym Class Templates List */}
          <div>
            <h3 className="text-sm font-black text-slate-300 uppercase tracking-wider mb-4">
              Gym Class Templates ({classes.length})
            </h3>

            {classes.length === 0 ? (
              <div className="glass-panel rounded-3xl p-8 text-center text-slate-400 text-xs border border-white/10">
                No class templates created yet. Click "+ Create Class Template" to get started.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 items-stretch">
                {classes.map((cls) => (
                  <div
                    key={cls.id}
                    className="glass-card rounded-3xl p-6 flex flex-col justify-between shadow-xl border border-white/10"
                  >
                    <div>
                      <div className="flex justify-between items-start mb-2 gap-2">
                        <h4 className="text-lg font-black text-white tracking-tight">{cls.name}</h4>
                        <span className="text-[10px] bg-white/5 text-slate-300 border border-white/10 px-2.5 py-0.5 rounded-full font-mono tabular-nums font-bold">
                          Cap: {cls.capacity}
                        </span>
                      </div>
                      <p className="text-xs text-slate-400 mb-4 min-h-[36px] leading-relaxed">
                        {cls.description || "No description provided."}
                      </p>
                      {cls.trainerName && (
                        <p className="text-xs text-slate-400">
                          Default Trainer: <strong className="text-white font-semibold">{cls.trainerName}</strong>
                        </p>
                      )}
                    </div>

                    <div className="mt-6 pt-4 border-t border-white/10">
                      <button
                        onClick={() => openScheduleModal(cls.id)}
                        className="w-full bg-white/5 hover:bg-emerald-500/15 text-emerald-400 hover:text-emerald-300 border border-white/10 hover:border-emerald-500/30 font-bold py-2.5 rounded-xl text-xs transition-all active:scale-[0.98]"
                      >
                        + Schedule Session
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Modal 1: Create Class Template Modal */}
      {isClassModalOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="glass-panel border border-white/10 rounded-3xl max-w-md w-full p-6 shadow-2xl">
            <div className="flex justify-between items-center mb-4 pb-3 border-b border-white/10">
              <h3 className="text-lg font-black text-white">Create Class Template</h3>
              <button onClick={() => setIsClassModalOpen(false)} className="text-slate-400 hover:text-white text-sm font-bold p-1">
                ✕
              </button>
            </div>

            {classFormError && (
              <div className="bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs p-3.5 rounded-2xl mb-4">
                {classFormError}
              </div>
            )}

            <form onSubmit={handleCreateClassSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1.5 uppercase tracking-wider">
                  Class Name *
                </label>
                <input
                  type="text"
                  value={className}
                  onChange={(e) => setClassName(e.target.value)}
                  placeholder="e.g. HIIT Power Hour, Yoga Flow, Spin Master"
                  className="w-full bg-[#0B0D14] border border-white/10 focus:border-emerald-500 rounded-xl p-3 text-xs text-white outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1.5 uppercase tracking-wider">
                  Description
                </label>
                <textarea
                  rows={2}
                  value={classDescription}
                  onChange={(e) => setClassDescription(e.target.value)}
                  placeholder="Brief summary of class goals and intensity..."
                  className="w-full bg-[#0B0D14] border border-white/10 focus:border-emerald-500 rounded-xl p-3 text-xs text-white outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1.5 uppercase tracking-wider">
                    Max Capacity *
                  </label>
                  <input
                    type="number"
                    min={1}
                    value={classCapacity}
                    onChange={(e) => setClassCapacity(Number(e.target.value))}
                    className="w-full bg-[#0B0D14] border border-white/10 focus:border-emerald-500 rounded-xl p-3 text-xs text-white font-mono tabular-nums outline-none"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1.5 uppercase tracking-wider">
                    Default Trainer
                  </label>
                  <select
                    value={classTrainerId}
                    onChange={(e) => setClassTrainerId(e.target.value)}
                    className="w-full bg-[#0B0D14] border border-white/10 focus:border-emerald-500 rounded-xl p-3 text-xs text-white outline-none"
                  >
                    <option value="">Select Trainer (Optional)</option>
                    {trainers.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.name} ({t.role})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-white/10 mt-6">
                <button
                  type="button"
                  onClick={() => setIsClassModalOpen(false)}
                  className="bg-white/5 hover:bg-white/10 text-slate-300 px-4 py-2.5 rounded-xl text-xs font-bold transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={classSubmitting}
                  className="bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-black px-5 py-2.5 rounded-xl text-xs font-black shadow-lg transition-all"
                >
                  {classSubmitting ? "Creating..." : "Save Class Template"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal 2: Schedule Class Session Modal */}
      {isScheduleModalOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="glass-panel border border-white/10 rounded-3xl max-w-md w-full p-6 shadow-2xl">
            <div className="flex justify-between items-center mb-4 pb-3 border-b border-white/10">
              <h3 className="text-lg font-black text-white">Schedule Class Session</h3>
              <button onClick={() => setIsScheduleModalOpen(false)} className="text-slate-400 hover:text-white text-sm font-bold p-1">
                ✕
              </button>
            </div>

            {scheduleFormError && (
              <div className="bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs p-3.5 rounded-2xl mb-4">
                {scheduleFormError}
              </div>
            )}

            <form onSubmit={handleScheduleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1.5 uppercase tracking-wider">
                  Select Gym Class *
                </label>
                <select
                  value={selectedClassId}
                  onChange={(e) => setSelectedClassId(e.target.value)}
                  className="w-full bg-[#0B0D14] border border-white/10 focus:border-emerald-500 rounded-xl p-3 text-xs text-white outline-none"
                  required
                >
                  <option value="">-- Choose Class --</option>
                  {classes.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} (Cap: {c.capacity})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1.5 uppercase tracking-wider">
                  Session Trainer
                </label>
                <select
                  value={scheduleTrainerId}
                  onChange={(e) => setScheduleTrainerId(e.target.value)}
                  className="w-full bg-[#0B0D14] border border-white/10 focus:border-emerald-500 rounded-xl p-3 text-xs text-white outline-none"
                >
                  <option value="">Use Default Class Trainer</option>
                  {trainers.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name} ({t.role})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1.5 uppercase tracking-wider">
                  Start Time *
                </label>
                <input
                  type="datetime-local"
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                  className="w-full bg-[#0B0D14] border border-white/10 focus:border-emerald-500 rounded-xl p-3 text-xs text-white outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1.5 uppercase tracking-wider">
                  End Time *
                </label>
                <input
                  type="datetime-local"
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                  className="w-full bg-[#0B0D14] border border-white/10 focus:border-emerald-500 rounded-xl p-3 text-xs text-white outline-none"
                  required
                />
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-white/10 mt-6">
                <button
                  type="button"
                  onClick={() => setIsScheduleModalOpen(false)}
                  className="bg-white/5 hover:bg-white/10 text-slate-300 px-4 py-2.5 rounded-xl text-xs font-bold transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={scheduleSubmitting}
                  className="bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-black px-5 py-2.5 rounded-xl text-xs font-black shadow-lg transition-all"
                >
                  {scheduleSubmitting ? "Scheduling..." : "Publish Session"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
