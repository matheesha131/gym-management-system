"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { AdminNav } from "../components/AdminNav";

interface ActiveSubscription {
  id: string;
  planName: string;
  startDate: string;
  endDate: string;
  status: string;
}

interface Member {
  id: string;
  name: string;
  email: string;
  phoneNumber: string | null;
  memberCode: string | null;
  role: string;
  createdAt: string;
  updatedAt?: string;
  activeSubscription?: ActiveSubscription | null;
}

interface SubscriptionHistory {
  id: string;
  planId: string;
  planName: string;
  startDate: string;
  endDate: string;
  status: string;
  createdAt: string;
}

interface CheckInHistory {
  id: string;
  status: string;
  scannedCode: string | null;
  isOverride: boolean;
  overrideNotes: string | null;
  checkedInAt: string;
}

interface MemberProfile extends Member {
  subscriptions?: SubscriptionHistory[];
  checkIns?: CheckInHistory[];
}

export default function AdminMembersPage() {
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  // Register Modal state
  const [isRegisterModalOpen, setIsRegisterModalOpen] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [registerSubmitting, setRegisterSubmitting] = useState(false);
  const [registerError, setRegisterError] = useState<string | null>(null);

  // Profile View Modal state
  const [selectedMemberId, setSelectedMemberId] = useState<string | null>(null);
  const [profileData, setProfileData] = useState<MemberProfile | null>(null);
  const [profileLoading, setProfileLoading] = useState(false);
  const [profileError, setProfileError] = useState<string | null>(null);

  const fetchMembers = async (query = "") => {
    try {
      setLoading(true);
      const url = query
        ? `/api/admin/members?q=${encodeURIComponent(query)}`
        : "/api/admin/members";
      const res = await fetch(url);
      if (!res.ok) throw new Error("Failed to fetch members directory");
      const data = await res.json();
      setMembers(data);
    } catch (err: any) {
      setError(err.message || "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchMembers(searchQuery);
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  const openRegisterModal = () => {
    setName("");
    setEmail("");
    setPhoneNumber("");
    setRegisterError(null);
    setIsRegisterModalOpen(true);
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setRegisterError(null);

    if (!name.trim()) {
      setRegisterError("Full name is required");
      return;
    }

    if (!email.trim()) {
      setRegisterError("Email address is required");
      return;
    }

    try {
      setRegisterSubmitting(true);
      const payload = {
        name: name.trim(),
        email: email.trim(),
        phoneNumber: phoneNumber.trim() || null,
      };

      const res = await fetch("/api/admin/members", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to register member");
      }

      setIsRegisterModalOpen(false);
      fetchMembers(searchQuery);
    } catch (err: any) {
      setRegisterError(err.message || "Failed to register member");
    } finally {
      setRegisterSubmitting(false);
    }
  };

  const openProfileModal = async (memberId: string) => {
    setSelectedMemberId(memberId);
    setProfileData(null);
    setProfileError(null);

    try {
      setProfileLoading(true);
      const res = await fetch(`/api/admin/members/${memberId}`);
      if (!res.ok) throw new Error("Failed to load member profile details");
      const data = await res.json();
      setProfileData(data);
    } catch (err: any) {
      setProfileError(err.message || "An error occurred");
    } finally {
      setProfileLoading(false);
    }
  };

  const closeProfileModal = () => {
    setSelectedMemberId(null);
    setProfileData(null);
  };

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return "-";
    return new Date(dateStr).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  return (
    <div className="min-h-screen p-6 md:p-10 max-w-7xl mx-auto bg-[#08090C] text-[#F8FAFC] font-sans">
      {/* Top Admin Navigation Header */}
      <AdminNav
        title="Member Directory"
        subtitle="Register new members, view profiles, and monitor subscription status"
        badgeText="Member Hub"
        actionButton={
          <button
            onClick={openRegisterModal}
            className="bg-emerald-500 hover:bg-emerald-400 text-black px-4 py-2.5 rounded-xl text-xs font-black shadow-[0_0_15px_rgba(16,185,129,0.25)] transition-all active:scale-[0.98] flex items-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
            </svg>
            <span>Register New Member</span>
          </button>
        }
      />

      {/* Search Bar */}
      <div className="glass-panel rounded-2xl p-3.5 mb-6 border border-white/10">
        <div className="relative">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search members by name, email, or member code (e.g. GYM-1001)..."
            className="w-full bg-[#0B0D14] border border-white/10 rounded-xl px-4 py-3 pl-11 text-slate-100 text-sm outline-none focus:border-emerald-500 transition-all font-sans"
          />
          <svg
            className="w-5 h-5 absolute left-3.5 top-3 text-slate-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
        </div>
      </div>

      {error && (
        <div className="bg-rose-500/10 border border-rose-500/30 text-rose-300 p-4 rounded-2xl mb-6 text-xs flex items-center gap-2">
          <span>⚠️ {error}</span>
        </div>
      )}

      {/* Members Directory Table */}
      {loading ? (
        <div className="flex items-center justify-center py-24 text-slate-400 gap-3">
          <div className="w-5 h-5 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
          <span className="text-sm font-medium">Loading member directory...</span>
        </div>
      ) : members.length === 0 ? (
        <div className="glass-panel rounded-3xl p-12 text-center text-slate-400 text-xs border border-white/10">
          {searchQuery
            ? `No members matching "${searchQuery}".`
            : "No registered members found. Click '+ Register New Member' to get started."}
        </div>
      ) : (
        <div className="glass-panel rounded-3xl overflow-hidden shadow-2xl border border-white/10">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-[#0B0D14] border-b border-white/10 text-slate-400 font-bold uppercase tracking-wider text-[11px]">
                  <th className="py-4 px-6">Member Code</th>
                  <th className="py-4 px-6">Full Name</th>
                  <th className="py-4 px-6">Email Address</th>
                  <th className="py-4 px-6">Phone Number</th>
                  <th className="py-4 px-6">Subscription Status</th>
                  <th className="py-4 px-6">Joined Date</th>
                  <th className="py-4 px-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {members.map((member) => (
                  <tr
                    key={member.id}
                    className="hover:bg-white/5 transition-colors"
                  >
                    <td className="py-4 px-6 font-mono text-emerald-400 font-bold tabular-nums">
                      {member.memberCode || "N/A"}
                    </td>
                    <td className="py-4 px-6 font-extrabold text-white">
                      {member.name}
                    </td>
                    <td className="py-4 px-6 text-slate-300">{member.email}</td>
                    <td className="py-4 px-6 text-slate-400 font-mono tabular-nums">
                      {member.phoneNumber || "-"}
                    </td>
                    <td className="py-4 px-6">
                      {member.activeSubscription ? (
                        <span className="inline-flex items-center px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                          Active: {member.activeSubscription.planName}
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-white/5 text-slate-400 border border-white/10">
                          No Active Plan
                        </span>
                      )}
                    </td>
                    <td className="py-4 px-6 text-slate-400 font-mono tabular-nums">
                      {formatDate(member.createdAt)}
                    </td>
                    <td className="py-4 px-6 text-right">
                      <button
                        onClick={() => openProfileModal(member.id)}
                        className="bg-white/5 hover:bg-white/10 text-slate-200 border border-white/10 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all active:scale-[0.98]"
                      >
                        View Profile
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Register New Member Modal */}
      {isRegisterModalOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 z-50">
          <div className="glass-panel border border-white/10 w-full max-w-md rounded-3xl p-6 shadow-2xl">
            <h2 className="text-xl font-black text-white mb-1">Register New Member</h2>
            <p className="text-xs text-slate-400 mb-6">
              System will automatically generate a unique member code (<code className="font-mono text-emerald-400">GYM-1001</code>).
            </p>

            {registerError && (
              <div className="bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs p-3.5 rounded-2xl mb-4">
                {registerError}
              </div>
            )}

            <form onSubmit={handleRegisterSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1.5 uppercase tracking-wider">
                  Full Name *
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Alex Morgan"
                  className="w-full bg-[#0B0D14] border border-white/10 focus:border-emerald-500 rounded-xl p-3 text-slate-100 text-sm outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1.5 uppercase tracking-wider">
                  Email Address *
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="alex.morgan@example.com"
                  className="w-full bg-[#0B0D14] border border-white/10 focus:border-emerald-500 rounded-xl p-3 text-slate-100 text-sm outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1.5 uppercase tracking-wider">
                  Phone Number
                </label>
                <input
                  type="tel"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  placeholder="+1 (555) 019-2834"
                  className="w-full bg-[#0B0D14] border border-white/10 focus:border-emerald-500 rounded-xl p-3 text-slate-100 text-sm outline-none font-mono tabular-nums"
                />
              </div>

              <div className="flex gap-3 pt-4 border-t border-white/10 mt-6">
                <button
                  type="button"
                  onClick={() => setIsRegisterModalOpen(false)}
                  className="flex-1 bg-white/5 hover:bg-white/10 text-slate-300 py-2.5 rounded-xl text-xs font-bold transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={registerSubmitting}
                  className="flex-1 bg-emerald-500 hover:bg-emerald-400 text-black py-2.5 rounded-xl text-xs font-black shadow-lg transition-all disabled:opacity-50"
                >
                  {registerSubmitting ? "Registering..." : "Register Member"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Member Profile Modal */}
      {selectedMemberId && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 z-50">
          <div className="glass-panel border border-white/10 w-full max-w-2xl rounded-3xl p-6 shadow-2xl relative max-h-[90vh] overflow-y-auto">
            <button
              onClick={closeProfileModal}
              className="absolute top-4 right-4 text-slate-400 hover:text-white text-base font-bold p-1"
            >
              ✕
            </button>

            {profileLoading ? (
              <div className="flex items-center justify-center py-16 text-slate-400 gap-3">
                <div className="w-5 h-5 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
                <span className="text-xs font-medium">Loading member profile...</span>
              </div>
            ) : profileError ? (
              <div className="bg-rose-500/10 border border-rose-500/30 text-rose-300 p-4 rounded-2xl my-4 text-xs">
                {profileError}
              </div>
            ) : profileData ? (
              <div>
                {/* Profile Header */}
                <div className="flex justify-between items-start mb-6 pb-4 border-b border-white/10">
                  <div>
                    <h2 className="text-2xl font-black text-white tracking-tight">{profileData.name}</h2>
                    <p className="text-slate-400 text-xs mt-0.5">{profileData.email}</p>
                  </div>
                  <div className="text-right">
                    <span className="font-mono text-lg font-black text-emerald-400 block tabular-nums">
                      {profileData.memberCode || "N/A"}
                    </span>
                    <span className="text-[11px] text-slate-400 font-mono">
                      Joined {formatDate(profileData.createdAt)}
                    </span>
                  </div>
                </div>

                {/* Contact & Status Overview */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                  <div className="bg-[#0B0D14] border border-white/10 rounded-2xl p-4">
                    <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-wider mb-2">
                      Contact Information
                    </h3>
                    <p className="text-xs text-white">
                      <span className="text-slate-400">Phone:</span>{" "}
                      <span className="font-mono tabular-nums">{profileData.phoneNumber || "Not provided"}</span>
                    </p>
                    <p className="text-xs text-white mt-1">
                      <span className="text-slate-400">Role:</span>{" "}
                      <span className="capitalize font-bold">{profileData.role}</span>
                    </p>
                  </div>

                  <div className="bg-[#0B0D14] border border-white/10 rounded-2xl p-4">
                    <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-wider mb-2">
                      Active Subscription Status
                    </h3>
                    {profileData.activeSubscription ? (
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-sm font-extrabold text-white">
                            {profileData.activeSubscription.planName}
                          </span>
                          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                            Active
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-400 font-mono tabular-nums">
                          Expires: {formatDate(profileData.activeSubscription.endDate)}
                        </p>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <span className="px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-rose-500/20 text-rose-400 border border-rose-500/30">
                          No Active Subscription
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Subscriptions History */}
                <div className="mb-6">
                  <h3 className="text-xs font-bold text-white uppercase tracking-wider mb-3">Subscription History</h3>
                  {!profileData.subscriptions || profileData.subscriptions.length === 0 ? (
                    <p className="text-xs text-slate-400 bg-[#0B0D14] border border-white/10 rounded-2xl p-3.5">
                      No subscription history recorded.
                    </p>
                  ) : (
                    <div className="space-y-2">
                      {profileData.subscriptions.map((sub) => (
                        <div
                          key={sub.id}
                          className="bg-[#0B0D14] border border-white/10 rounded-2xl p-3.5 flex justify-between items-center text-xs"
                        >
                          <div>
                            <span className="font-extrabold text-white">{sub.planName}</span>
                            <div className="text-slate-400 font-mono text-[11px] mt-0.5 tabular-nums">
                              {formatDate(sub.startDate)} - {formatDate(sub.endDate)}
                            </div>
                          </div>
                          <span
                            className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
                              sub.status === "active"
                                ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                                : sub.status === "expired"
                                ? "bg-rose-500/20 text-rose-400 border border-rose-500/30"
                                : "bg-white/5 text-slate-400"
                            }`}
                          >
                            {sub.status}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Check-ins History */}
                <div>
                  <h3 className="text-xs font-bold text-white uppercase tracking-wider mb-3">Recent Check-Ins</h3>
                  {!profileData.checkIns || profileData.checkIns.length === 0 ? (
                    <p className="text-xs text-slate-400 bg-[#0B0D14] border border-white/10 rounded-2xl p-3.5">
                      No check-in history recorded.
                    </p>
                  ) : (
                    <div className="space-y-2">
                      {profileData.checkIns.map((ci) => (
                        <div
                          key={ci.id}
                          className="bg-[#0B0D14] border border-white/10 rounded-2xl p-3.5 flex justify-between items-center text-xs"
                        >
                          <div>
                            <span className="font-mono text-white tabular-nums">
                              {formatDate(ci.checkedInAt)}
                            </span>
                            {ci.overrideNotes && (
                              <p className="text-purple-300 text-[11px] mt-0.5">
                                Note: {ci.overrideNotes}
                              </p>
                            )}
                          </div>
                          <span
                            className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
                              ci.status === "granted"
                                ? "bg-emerald-500/20 text-emerald-400"
                                : "bg-rose-500/20 text-rose-400"
                            }`}
                          >
                            {ci.status}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ) : null}
          </div>
        </div>
      )}
    </div>
  );
}
