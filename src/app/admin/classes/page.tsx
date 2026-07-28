"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

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
    <div className="min-h-screen p-8 max-w-7xl mx-auto bg-[#090A0F] text-[#F3F4F6] font-sans">
      {/* Top Admin Navigation Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 pb-6 mb-8 border-b border-[#222634]">
        <div>
          <h1 className="text-3xl font-extrabold text-[#10B981] tracking-tight">
            Gym Class Scheduling & Operations
          </h1>
          <p className="text-[#9CA3AF] text-sm mt-1">
            Create class templates, assign trainers, set capacities, and manage session schedules
          </p>
        </div>

        {/* Admin Navigation Tabs */}
        <div className="flex items-center gap-2 bg-[#12141C] p-1.5 rounded-xl border border-[#222634]">
          <Link
            href="/admin/terminal"
            className="px-3.5 py-1.5 text-xs font-semibold rounded-lg text-[#9CA3AF] hover:text-[#F3F4F6] transition-colors"
          >
            Terminal
          </Link>
          <Link
            href="/admin/members"
            className="px-3.5 py-1.5 text-xs font-semibold rounded-lg text-[#9CA3AF] hover:text-[#F3F4F6] transition-colors"
          >
            Members
          </Link>
          <Link
            href="/admin/payments"
            className="px-3.5 py-1.5 text-xs font-semibold rounded-lg text-[#9CA3AF] hover:text-[#F3F4F6] transition-colors"
          >
            Payments
          </Link>
          <Link
            href="/admin/plans"
            className="px-3.5 py-1.5 text-xs font-semibold rounded-lg text-[#9CA3AF] hover:text-[#F3F4F6] transition-colors"
          >
            Plans
          </Link>
          <Link
            href="/admin/classes"
            className="px-3.5 py-1.5 text-xs font-semibold rounded-lg bg-[#10B981] text-white shadow-sm"
          >
            Classes
          </Link>
        </div>
      </div>

      {/* Global Error Banner */}
      {error && (
        <div className="bg-[#EF4444]/15 border border-[#EF4444] text-[#F87171] p-4 rounded-xl mb-8">
          {error}
        </div>
      )}

      {/* Action Buttons Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
        <h2 className="text-xl font-bold text-white flex items-center gap-2">
          <span>🏋️‍♂️</span> Class Templates & Schedules
        </h2>
        <div className="flex items-center gap-3">
          <button
            onClick={openCreateClassModal}
            className="bg-[#222634] hover:bg-[#2D3346] text-white px-4 py-2.5 rounded-xl font-semibold text-sm transition-colors border border-[#222634]"
          >
            + Create Class Template
          </button>
          <button
            onClick={() => openScheduleModal()}
            className="bg-[#10B981] hover:bg-[#059669] text-white px-4 py-2.5 rounded-xl font-semibold text-sm shadow-md transition-colors flex items-center gap-2"
          >
            <span>📅 Schedule New Session</span>
          </button>
        </div>
      </div>

      {loading ? (
        <div className="text-[#9CA3AF] py-12 text-center">Loading gym classes and schedules...</div>
      ) : (
        <div className="space-y-10">
          {/* Section 1: Scheduled Sessions Stream */}
          <div>
            <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
              <span>🗓️</span> Upcoming Scheduled Class Sessions
            </h3>

            {schedules.length === 0 ? (
              <div className="bg-[#12141C] border border-[#222634] rounded-2xl p-8 text-center text-[#9CA3AF]">
                No class sessions scheduled yet. Click "📅 Schedule New Session" to create one.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {schedules.map((item) => {
                  const availableSlots = Math.max(0, item.classCapacity - item.currentBookings);
                  const isFull = availableSlots === 0;

                  return (
                    <div
                      key={item.id}
                      className="bg-[#12141C] border border-[#222634] rounded-2xl p-6 flex flex-col justify-between shadow-lg relative overflow-hidden"
                    >
                      <div>
                        <div className="flex justify-between items-start mb-3">
                          <h4 className="text-lg font-bold text-white">{item.className}</h4>
                          <span
                            className={`text-xs px-2.5 py-1 rounded-full font-bold uppercase ${
                              isFull
                                ? "bg-[#EF4444]/20 text-[#EF4444] border border-[#EF4444]/30"
                                : "bg-[#10B981]/20 text-[#10B981] border border-[#10B981]/30"
                            }`}
                          >
                            {isFull ? "FULL" : `${availableSlots} Slots Left`}
                          </span>
                        </div>

                        <div className="space-y-2 text-sm text-[#9CA3AF] mb-4">
                          <div className="flex items-center gap-2">
                            <span>📅</span>
                            <span className="text-white font-medium">{formatDate(item.startTime)}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span>⏰</span>
                            <span className="font-mono text-white">
                              {formatTime(item.startTime)} – {formatTime(item.endTime)}
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span>👤</span>
                            <span>Trainer: <strong className="text-white">{item.trainerName || "Unassigned"}</strong></span>
                          </div>
                        </div>
                      </div>

                      <div className="pt-4 border-t border-[#222634] flex justify-between items-center text-xs">
                        <span className="text-[#9CA3AF]">Booked / Capacity</span>
                        <span className="font-mono font-bold text-white text-sm">
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
            <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
              <span>🏋️</span> Gym Class Templates ({classes.length})
            </h3>

            {classes.length === 0 ? (
              <div className="bg-[#12141C] border border-[#222634] rounded-2xl p-8 text-center text-[#9CA3AF]">
                No class templates created yet. Click "+ Create Class Template" to get started.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {classes.map((cls) => (
                  <div
                    key={cls.id}
                    className="bg-[#12141C] border border-[#222634] rounded-2xl p-6 flex flex-col justify-between shadow-lg"
                  >
                    <div>
                      <div className="flex justify-between items-start mb-2">
                        <h4 className="text-lg font-bold text-white">{cls.name}</h4>
                        <span className="text-xs bg-[#222634] text-[#9CA3AF] px-2.5 py-1 rounded-full font-mono">
                          Cap: {cls.capacity}
                        </span>
                      </div>
                      <p className="text-[#9CA3AF] text-sm mb-4 min-h-[40px]">
                        {cls.description || "No description provided."}
                      </p>
                      {cls.trainerName && (
                        <p className="text-xs text-[#9CA3AF]">
                          Default Trainer: <strong className="text-white">{cls.trainerName}</strong>
                        </p>
                      )}
                    </div>

                    <div className="mt-4 pt-4 border-t border-[#222634]">
                      <button
                        onClick={() => openScheduleModal(cls.id)}
                        className="w-full bg-[#222634] hover:bg-[#2D3346] text-[#10B981] font-semibold py-2 rounded-xl text-xs transition-colors"
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
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#12141C] border border-[#222634] rounded-2xl max-w-md w-full p-6 shadow-2xl">
            <div className="flex justify-between items-center mb-4 pb-3 border-b border-[#222634]">
              <h3 className="text-lg font-bold text-white">Create Gym Class Template</h3>
              <button onClick={() => setIsClassModalOpen(false)} className="text-[#9CA3AF] hover:text-white text-lg font-bold">
                ✕
              </button>
            </div>

            {classFormError && (
              <div className="bg-[#EF4444]/15 border border-[#EF4444] text-[#F87171] text-xs p-3 rounded-lg mb-4">
                {classFormError}
              </div>
            )}

            <form onSubmit={handleCreateClassSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-[#9CA3AF] mb-1 uppercase">
                  Class Name *
                </label>
                <input
                  type="text"
                  value={className}
                  onChange={(e) => setClassName(e.target.value)}
                  placeholder="e.g. HIIT Power Hour, Yoga Flow, Spin Master"
                  className="w-full bg-[#090A0F] border border-[#222634] focus:border-[#10B981] rounded-xl p-3 text-sm text-white outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#9CA3AF] mb-1 uppercase">
                  Description
                </label>
                <textarea
                  rows={2}
                  value={classDescription}
                  onChange={(e) => setClassDescription(e.target.value)}
                  placeholder="Brief summary of class goals and intensity..."
                  className="w-full bg-[#090A0F] border border-[#222634] focus:border-[#10B981] rounded-xl p-3 text-sm text-white outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-[#9CA3AF] mb-1 uppercase">
                    Max Capacity *
                  </label>
                  <input
                    type="number"
                    min={1}
                    value={classCapacity}
                    onChange={(e) => setClassCapacity(Number(e.target.value))}
                    className="w-full bg-[#090A0F] border border-[#222634] focus:border-[#10B981] rounded-xl p-3 text-sm text-white font-mono outline-none"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#9CA3AF] mb-1 uppercase">
                    Default Trainer
                  </label>
                  <select
                    value={classTrainerId}
                    onChange={(e) => setClassTrainerId(e.target.value)}
                    className="w-full bg-[#090A0F] border border-[#222634] focus:border-[#10B981] rounded-xl p-3 text-sm text-white outline-none"
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

              <div className="flex justify-end gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setIsClassModalOpen(false)}
                  className="bg-[#222634] hover:bg-[#2D3346] text-[#F3F4F6] px-4 py-2 rounded-xl text-sm font-semibold transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={classSubmitting}
                  className="bg-[#10B981] hover:bg-[#059669] disabled:opacity-50 text-white px-5 py-2 rounded-xl text-sm font-bold shadow-lg transition-colors"
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
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#12141C] border border-[#222634] rounded-2xl max-w-md w-full p-6 shadow-2xl">
            <div className="flex justify-between items-center mb-4 pb-3 border-b border-[#222634]">
              <h3 className="text-lg font-bold text-white">Schedule Class Session</h3>
              <button onClick={() => setIsScheduleModalOpen(false)} className="text-[#9CA3AF] hover:text-white text-lg font-bold">
                ✕
              </button>
            </div>

            {scheduleFormError && (
              <div className="bg-[#EF4444]/15 border border-[#EF4444] text-[#F87171] text-xs p-3 rounded-lg mb-4">
                {scheduleFormError}
              </div>
            )}

            <form onSubmit={handleScheduleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-[#9CA3AF] mb-1 uppercase">
                  Select Gym Class *
                </label>
                <select
                  value={selectedClassId}
                  onChange={(e) => setSelectedClassId(e.target.value)}
                  className="w-full bg-[#090A0F] border border-[#222634] focus:border-[#10B981] rounded-xl p-3 text-sm text-white outline-none"
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
                <label className="block text-xs font-semibold text-[#9CA3AF] mb-1 uppercase">
                  Session Trainer
                </label>
                <select
                  value={scheduleTrainerId}
                  onChange={(e) => setScheduleTrainerId(e.target.value)}
                  className="w-full bg-[#090A0F] border border-[#222634] focus:border-[#10B981] rounded-xl p-3 text-sm text-white outline-none"
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
                <label className="block text-xs font-semibold text-[#9CA3AF] mb-1 uppercase">
                  Start Time *
                </label>
                <input
                  type="datetime-local"
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                  className="w-full bg-[#090A0F] border border-[#222634] focus:border-[#10B981] rounded-xl p-3 text-sm text-white outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#9CA3AF] mb-1 uppercase">
                  End Time *
                </label>
                <input
                  type="datetime-local"
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                  className="w-full bg-[#090A0F] border border-[#222634] focus:border-[#10B981] rounded-xl p-3 text-sm text-white outline-none"
                  required
                />
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setIsScheduleModalOpen(false)}
                  className="bg-[#222634] hover:bg-[#2D3346] text-[#F3F4F6] px-4 py-2 rounded-xl text-sm font-semibold transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={scheduleSubmitting}
                  className="bg-[#10B981] hover:bg-[#059669] disabled:opacity-50 text-white px-5 py-2 rounded-xl text-sm font-bold shadow-lg transition-colors"
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
