"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

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
    setProfileLoading(true);

    try {
      const res = await fetch(`/api/admin/members/${memberId}`);
      if (!res.ok) throw new Error("Failed to load member profile");
      const data = await res.json();
      setProfileData(data);
    } catch (err: any) {
      setProfileError(err.message || "Failed to load profile");
    } finally {
      setProfileLoading(false);
    }
  };

  const closeProfileModal = () => {
    setSelectedMemberId(null);
    setProfileData(null);
  };

  const formatDate = (dateStr?: string | Date) => {
    if (!dateStr) return "-";
    return new Date(dateStr).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  return (
    <div className="min-h-screen p-8 max-w-7xl mx-auto bg-[#090A0F] text-[#F3F4F6]">
      {/* Top Admin Navigation Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 pb-6 mb-6 border-b border-[#222634]">
        <div>
          <h1 className="text-3xl font-bold text-[#10B981]">Member Directory</h1>
          <p className="text-[#9CA3AF] text-sm mt-1">
            Register new members, view profiles, and monitor subscription status
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 bg-[#12141C] p-1.5 rounded-xl border border-[#222634]">
            <Link
              href="/admin/terminal"
              className="px-3.5 py-1.5 text-xs font-semibold rounded-lg text-[#9CA3AF] hover:text-[#F3F4F6] transition-colors"
            >
              Terminal
            </Link>
            <Link
              href="/admin/members"
              className="px-3.5 py-1.5 text-xs font-semibold rounded-lg bg-[#10B981] text-white shadow-sm"
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
          </div>
          <button
            onClick={openRegisterModal}
            className="bg-[#10B981] hover:bg-[#059669] text-white px-4 py-2 rounded-lg font-medium shadow-md transition-colors flex items-center gap-2"
          >
            <span>+ Register New Member</span>
          </button>
        </div>
      </div>

      {/* Search & Filters */}
      <div className="bg-[#12141C] border border-[#222634] rounded-xl p-4 mb-6">
        <div className="relative">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search members by name, email, or member code (e.g. GYM-1001)..."
            className="w-full bg-[#090A0F] border border-[#222634] rounded-lg px-4 py-3 pl-10 text-[#F3F4F6] text-sm focus:outline-none focus:border-[#10B981]"
          />
          <svg
            className="w-5 h-5 absolute left-3 top-3.5 text-[#9CA3AF]"
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
        <div className="bg-[#EF4444]/10 border border-[#EF4444] text-[#EF4444] p-4 rounded-lg mb-6 text-sm">
          {error}
        </div>
      )}

      {/* Members Directory Table */}
      {loading ? (
        <div className="text-[#9CA3AF] py-16 text-center">Loading member directory...</div>
      ) : members.length === 0 ? (
        <div className="bg-[#12141C] border border-[#222634] rounded-xl p-12 text-center text-[#9CA3AF]">
          {searchQuery
            ? `No members matching "${searchQuery}".`
            : "No registered members found. Click '+ Register New Member' to get started."}
        </div>
      ) : (
        <div className="bg-[#12141C] border border-[#222634] rounded-xl overflow-hidden shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="bg-[#1A1D29] border-b border-[#222634] text-[#9CA3AF] font-semibold">
                  <th className="py-3.5 px-6">Member Code</th>
                  <th className="py-3.5 px-6">Full Name</th>
                  <th className="py-3.5 px-6">Email Address</th>
                  <th className="py-3.5 px-6">Phone Number</th>
                  <th className="py-3.5 px-6">Subscription Status</th>
                  <th className="py-3.5 px-6">Joined Date</th>
                  <th className="py-3.5 px-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#222634]">
                {members.map((member) => (
                  <tr
                    key={member.id}
                    className="hover:bg-[#1A1D29]/50 transition-colors"
                  >
                    <td className="py-4 px-6 font-mono text-[#10B981] font-medium">
                      {member.memberCode || "N/A"}
                    </td>
                    <td className="py-4 px-6 font-semibold text-[#F3F4F6]">
                      {member.name}
                    </td>
                    <td className="py-4 px-6 text-[#9CA3AF]">{member.email}</td>
                    <td className="py-4 px-6 text-[#9CA3AF] font-mono">
                      {member.phoneNumber || "-"}
                    </td>
                    <td className="py-4 px-6">
                      {member.activeSubscription ? (
                        <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold font-mono bg-[#10B981]/15 text-[#10B981] border border-[#10B981]/30">
                          Active: {member.activeSubscription.planName}
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold font-mono bg-[#222634] text-[#9CA3AF] border border-[#222634]">
                          No Active Plan
                        </span>
                      )}
                    </td>
                    <td className="py-4 px-6 text-[#9CA3AF] font-mono">
                      {formatDate(member.createdAt)}
                    </td>
                    <td className="py-4 px-6 text-right">
                      <button
                        onClick={() => openProfileModal(member.id)}
                        className="bg-[#1A1D29] hover:bg-[#222634] text-[#F3F4F6] px-3 py-1.5 rounded-lg text-xs font-medium border border-[#222634] transition-colors"
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
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50 backdrop-blur-sm">
          <div className="bg-[#12141C] border border-[#222634] w-full max-w-md rounded-xl p-6 shadow-2xl">
            <h2 className="text-2xl font-bold text-[#F3F4F6] mb-2">Register New Member</h2>
            <p className="text-xs text-[#9CA3AF] mb-4">
              System will automatically generate a unique member code (e.g. GYM-1001).
            </p>

            {registerError && (
              <div className="bg-[#EF4444]/10 border border-[#EF4444] text-[#EF4444] text-sm p-3 rounded-lg mb-4">
                {registerError}
              </div>
            )}

            <form onSubmit={handleRegisterSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-[#9CA3AF] mb-1">
                  Full Name *
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Alex Morgan"
                  className="w-full bg-[#090A0F] border border-[#222634] rounded-lg p-2.5 text-[#F3F4F6] text-sm focus:outline-none focus:border-[#10B981]"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#9CA3AF] mb-1">
                  Email Address *
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="alex.morgan@example.com"
                  className="w-full bg-[#090A0F] border border-[#222634] rounded-lg p-2.5 text-[#F3F4F6] text-sm focus:outline-none focus:border-[#10B981]"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#9CA3AF] mb-1">
                  Phone Number
                </label>
                <input
                  type="tel"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  placeholder="+1 (555) 019-2834"
                  className="w-full bg-[#090A0F] border border-[#222634] rounded-lg p-2.5 text-[#F3F4F6] text-sm focus:outline-none focus:border-[#10B981] font-mono"
                />
              </div>

              <div className="flex gap-3 pt-4 border-t border-[#222634] mt-6">
                <button
                  type="button"
                  onClick={() => setIsRegisterModalOpen(false)}
                  className="flex-1 bg-[#1A1D29] hover:bg-[#222634] text-[#F3F4F6] py-2 rounded-lg text-sm font-medium transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={registerSubmitting}
                  className="flex-1 bg-[#10B981] hover:bg-[#059669] text-white py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
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
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50 backdrop-blur-sm">
          <div className="bg-[#12141C] border border-[#222634] w-full max-w-2xl rounded-xl p-6 shadow-2xl relative max-h-[90vh] overflow-y-auto">
            <button
              onClick={closeProfileModal}
              className="absolute top-4 right-4 text-[#9CA3AF] hover:text-[#F3F4F6] text-lg font-bold"
            >
              ✕
            </button>

            {profileLoading ? (
              <div className="text-[#9CA3AF] py-12 text-center">Loading member profile...</div>
            ) : profileError ? (
              <div className="bg-[#EF4444]/10 border border-[#EF4444] text-[#EF4444] p-4 rounded-lg my-4 text-sm">
                {profileError}
              </div>
            ) : profileData ? (
              <div>
                {/* Profile Header */}
                <div className="flex justify-between items-start mb-6 pb-4 border-b border-[#222634]">
                  <div>
                    <h2 className="text-2xl font-bold text-[#F3F4F6]">{profileData.name}</h2>
                    <p className="text-[#9CA3AF] text-sm mt-0.5">{profileData.email}</p>
                  </div>
                  <div className="text-right">
                    <span className="font-mono text-lg font-bold text-[#10B981] block">
                      {profileData.memberCode || "N/A"}
                    </span>
                    <span className="text-xs text-[#9CA3AF]">
                      Joined {formatDate(profileData.createdAt)}
                    </span>
                  </div>
                </div>

                {/* Contact & Status Overview */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                  <div className="bg-[#090A0F] border border-[#222634] rounded-lg p-4">
                    <h3 className="text-xs font-semibold text-[#9CA3AF] uppercase tracking-wider mb-2">
                      Contact Information
                    </h3>
                    <p className="text-sm text-[#F3F4F6]">
                      <span className="text-[#9CA3AF]">Phone:</span>{" "}
                      <span className="font-mono">{profileData.phoneNumber || "Not provided"}</span>
                    </p>
                    <p className="text-sm text-[#F3F4F6] mt-1">
                      <span className="text-[#9CA3AF]">Role:</span>{" "}
                      <span className="capitalize">{profileData.role}</span>
                    </p>
                  </div>

                  <div className="bg-[#090A0F] border border-[#222634] rounded-lg p-4">
                    <h3 className="text-xs font-semibold text-[#9CA3AF] uppercase tracking-wider mb-2">
                      Active Subscription Status
                    </h3>
                    {profileData.activeSubscription ? (
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-base font-bold text-[#F3F4F6]">
                            {profileData.activeSubscription.planName}
                          </span>
                          <span className="px-2 py-0.5 rounded-full text-xs font-semibold font-mono bg-[#10B981]/15 text-[#10B981] border border-[#10B981]/30">
                            Active
                          </span>
                        </div>
                        <p className="text-xs text-[#9CA3AF] font-mono">
                          Expires: {formatDate(profileData.activeSubscription.endDate)}
                        </p>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <span className="px-2.5 py-1 rounded-full text-xs font-semibold font-mono bg-[#EF4444]/15 text-[#EF4444] border border-[#EF4444]/30">
                          No Active Subscription
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Subscriptions History */}
                <div className="mb-6">
                  <h3 className="text-sm font-semibold text-[#F3F4F6] mb-3">Subscription History</h3>
                  {!profileData.subscriptions || profileData.subscriptions.length === 0 ? (
                    <p className="text-xs text-[#9CA3AF] bg-[#090A0F] border border-[#222634] rounded-lg p-3">
                      No subscription history recorded.
                    </p>
                  ) : (
                    <div className="space-y-2">
                      {profileData.subscriptions.map((sub) => (
                        <div
                          key={sub.id}
                          className="bg-[#090A0F] border border-[#222634] rounded-lg p-3 flex justify-between items-center text-xs"
                        >
                          <div>
                            <span className="font-semibold text-[#F3F4F6]">{sub.planName}</span>
                            <div className="text-[#9CA3AF] font-mono text-[11px] mt-0.5">
                              {formatDate(sub.startDate)} - {formatDate(sub.endDate)}
                            </div>
                          </div>
                          <span
                            className={`px-2 py-0.5 rounded-full text-[11px] font-semibold font-mono ${
                              sub.status === "active"
                                ? "bg-[#10B981]/15 text-[#10B981] border border-[#10B981]/30"
                                : sub.status === "expired"
                                ? "bg-[#EF4444]/15 text-[#EF4444] border border-[#EF4444]/30"
                                : "bg-[#222634] text-[#9CA3AF]"
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
                  <h3 className="text-sm font-semibold text-[#F3F4F6] mb-3">Recent Check-Ins</h3>
                  {!profileData.checkIns || profileData.checkIns.length === 0 ? (
                    <p className="text-xs text-[#9CA3AF] bg-[#090A0F] border border-[#222634] rounded-lg p-3">
                      No check-in history recorded.
                    </p>
                  ) : (
                    <div className="space-y-2">
                      {profileData.checkIns.map((ci) => (
                        <div
                          key={ci.id}
                          className="bg-[#090A0F] border border-[#222634] rounded-lg p-3 flex justify-between items-center text-xs"
                        >
                          <div>
                            <span className="font-mono text-[#F3F4F6]">
                              {formatDate(ci.checkedInAt)}
                            </span>
                            {ci.overrideNotes && (
                              <p className="text-[#9CA3AF] text-[11px] mt-0.5">
                                Note: {ci.overrideNotes}
                              </p>
                            )}
                          </div>
                          <span
                            className={`px-2 py-0.5 rounded-full text-[11px] font-semibold font-mono ${
                              ci.status === "granted"
                                ? "bg-[#10B981]/15 text-[#10B981]"
                                : "bg-[#EF4444]/15 text-[#EF4444]"
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
