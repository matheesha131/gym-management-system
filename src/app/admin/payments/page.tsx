"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { AdminNav } from "../components/AdminNav";

interface MemberOption {
  id: string;
  name: string;
  email: string;
  memberCode: string | null;
}

interface PlanOption {
  id: string;
  name: string;
  price: string;
  durationDays: number;
  isActive: boolean;
}

interface PaymentLog {
  id: string;
  receiptRef: string;
  amount: string;
  paymentMethod: string;
  status: string;
  notes: string | null;
  paidAt: string;
  member: {
    id: string;
    name: string;
    email: string;
    memberCode: string | null;
  };
  plan?: {
    id: string;
    name: string;
  } | null;
  createdBy?: {
    id: string;
    name: string;
  } | null;
}

export default function AdminPaymentsPage() {
  const [payments, setPayments] = useState<PaymentLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  // Options for Log Modal
  const [members, setMembers] = useState<MemberOption[]>([]);
  const [plans, setPlans] = useState<PlanOption[]>([]);

  // Log Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedMemberId, setSelectedMemberId] = useState("");
  const [selectedPlanId, setSelectedPlanId] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("cash");
  const [amount, setAmount] = useState("");
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const fetchPayments = async (query = "") => {
    try {
      setLoading(true);
      const url = query
        ? `/api/admin/payments?q=${encodeURIComponent(query)}`
        : "/api/admin/payments";
      const res = await fetch(url);
      if (!res.ok) throw new Error("Failed to fetch payment log history");
      const data = await res.json();
      setPayments(data);
    } catch (err: any) {
      setError(err.message || "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  const fetchDropdownOptions = async () => {
    try {
      const [membersRes, plansRes] = await Promise.all([
        fetch("/api/admin/members"),
        fetch("/api/admin/plans"),
      ]);

      if (membersRes.ok) {
        const memberData = await membersRes.json();
        setMembers(memberData);
      }

      if (plansRes.ok) {
        const planData = await plansRes.json();
        setPlans(planData.filter((p: PlanOption) => p.isActive));
      }
    } catch (err) {
      console.error("Failed to load options", err);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchPayments(searchQuery);
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  useEffect(() => {
    fetchDropdownOptions();
  }, []);

  const openLogModal = () => {
    setSelectedMemberId("");
    setSelectedPlanId("");
    setPaymentMethod("cash");
    setAmount("");
    setNotes("");
    setFormError(null);
    setIsModalOpen(true);
  };

  const handlePlanChange = (planId: string) => {
    setSelectedPlanId(planId);
    const selectedPlan = plans.find((p) => p.id === planId);
    if (selectedPlan) {
      setAmount(selectedPlan.price);
    }
  };

  const handleLogPaymentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!selectedMemberId) {
      setFormError("Please select a member");
      return;
    }

    if (!selectedPlanId) {
      setFormError("Please select a membership plan");
      return;
    }

    try {
      setSubmitting(true);
      const payload = {
        memberId: selectedMemberId,
        planId: selectedPlanId,
        paymentMethod,
        amount: amount ? Number(amount) : undefined,
        notes: notes.trim() || null,
      };

      const res = await fetch("/api/admin/payments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to log payment");
      }

      setIsModalOpen(false);
      fetchPayments(searchQuery);
    } catch (err: any) {
      setFormError(err.message || "Failed to log payment");
    } finally {
      setSubmitting(false);
    }
  };

  const formatDate = (dateStr: string) => {
    if (!dateStr) return "-";
    const date = new Date(dateStr);
    return (
      date.toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
      }) +
      " " +
      date.toLocaleTimeString("en-US", {
        hour: "2-digit",
        minute: "2-digit",
      })
    );
  };

  const formatPaymentMethod = (method: string) => {
    switch (method) {
      case "cash":
        return "Cash";
      case "card_counter":
      case "card":
        return "Card Terminal";
      case "bank_transfer":
        return "Bank Transfer";
      case "stripe":
        return "Stripe";
      default:
        return method;
    }
  };

  return (
    <div className="min-h-screen p-6 md:p-10 max-w-7xl mx-auto bg-[#08090C] text-[#F8FAFC] font-sans">
      {/* Top Admin Navigation Header */}
      <AdminNav
        title="Counter Payments & Receipts"
        subtitle="Log manual counter payments and view financial audit history"
        badgeText="Payments"
        actionButton={
          <button
            onClick={openLogModal}
            className="bg-emerald-500 hover:bg-emerald-400 text-black px-4 py-2.5 rounded-xl text-xs font-black shadow-[0_0_15px_rgba(16,185,129,0.25)] transition-all active:scale-[0.98] flex items-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
            </svg>
            <span>Log Counter Payment</span>
          </button>
        }
      />

      {/* Search & Filter Bar */}
      <div className="glass-panel rounded-2xl p-3.5 mb-6 border border-white/10">
        <div className="relative">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search payments by receipt ref (e.g. REC-20260728-1001), member name, or code..."
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

      {/* Audit Log Table */}
      {loading ? (
        <div className="flex items-center justify-center py-24 text-slate-400 gap-3">
          <div className="w-5 h-5 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
          <span className="text-sm font-medium">Loading payment log history...</span>
        </div>
      ) : payments.length === 0 ? (
        <div className="glass-panel rounded-3xl p-12 text-center text-slate-400 text-xs border border-white/10">
          {searchQuery
            ? `No payments matching "${searchQuery}".`
            : "No counter payments logged yet. Click '+ Log Counter Payment' to record a transaction."}
        </div>
      ) : (
        <div className="glass-panel rounded-3xl overflow-hidden shadow-2xl border border-white/10">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-[#0B0D14] border-b border-white/10 text-slate-400 font-bold uppercase tracking-wider text-[11px]">
                  <th className="py-4 px-6">Receipt Ref</th>
                  <th className="py-4 px-6">Member</th>
                  <th className="py-4 px-6">Plan Activated</th>
                  <th className="py-4 px-6">Amount</th>
                  <th className="py-4 px-6">Payment Method</th>
                  <th className="py-4 px-6">Date & Time</th>
                  <th className="py-4 px-6">Logged By</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {payments.map((p) => (
                  <tr
                    key={p.id}
                    className="hover:bg-white/5 transition-colors"
                  >
                    <td className="py-4 px-6 font-mono text-emerald-400 font-bold tabular-nums">
                      {p.receiptRef}
                    </td>
                    <td className="py-4 px-6">
                      <div className="font-extrabold text-white">
                        {p.member.name}
                      </div>
                      <div className="text-[11px] font-mono text-slate-400 tabular-nums">
                        {p.member.memberCode || p.member.email}
                      </div>
                    </td>
                    <td className="py-4 px-6 text-slate-200 font-medium">
                      {p.plan ? p.plan.name : "N/A"}
                    </td>
                    <td className="py-4 px-6 font-mono text-emerald-400 font-black text-base tabular-nums">
                      ${p.amount}
                    </td>
                    <td className="py-4 px-6">
                      <span className="inline-flex items-center px-3 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-white/5 text-slate-300 border border-white/10">
                        {formatPaymentMethod(p.paymentMethod)}
                      </span>
                    </td>
                    <td className="py-4 px-6 text-slate-400 font-mono text-xs tabular-nums">
                      {formatDate(p.paidAt)}
                    </td>
                    <td className="py-4 px-6 text-slate-400 text-xs">
                      {p.createdBy ? p.createdBy.name : "System"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Log Payment Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 z-50">
          <div className="glass-panel border border-white/10 w-full max-w-md rounded-3xl p-6 shadow-2xl">
            <h2 className="text-xl font-black text-white mb-1">
              Log Counter Payment
            </h2>
            <p className="text-xs text-slate-400 mb-6">
              Recording payment auto-activates member subscription and generates receipt reference.
            </p>

            {formError && (
              <div className="bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs p-3.5 rounded-2xl mb-4">
                {formError}
              </div>
            )}

            <form onSubmit={handleLogPaymentSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1.5 uppercase tracking-wider">
                  Select Member *
                </label>
                <select
                  value={selectedMemberId}
                  onChange={(e) => setSelectedMemberId(e.target.value)}
                  className="w-full bg-[#0B0D14] border border-white/10 focus:border-emerald-500 rounded-xl p-3 text-slate-100 text-sm outline-none"
                  required
                >
                  <option value="">-- Choose Member --</option>
                  {members.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.name} ({m.memberCode || m.email})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1.5 uppercase tracking-wider">
                  Select Membership Plan *
                </label>
                <select
                  value={selectedPlanId}
                  onChange={(e) => handlePlanChange(e.target.value)}
                  className="w-full bg-[#0B0D14] border border-white/10 focus:border-emerald-500 rounded-xl p-3 text-slate-100 text-sm outline-none"
                  required
                >
                  <option value="">-- Choose Plan --</option>
                  {plans.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} (${p.price} / {p.durationDays} days)
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1.5 uppercase tracking-wider">
                    Payment Method *
                  </label>
                  <select
                    value={paymentMethod}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                    className="w-full bg-[#0B0D14] border border-white/10 focus:border-emerald-500 rounded-xl p-3 text-slate-100 text-sm outline-none"
                    required
                  >
                    <option value="cash">Cash</option>
                    <option value="card_counter">Card Terminal</option>
                    <option value="bank_transfer">Bank Transfer</option>
                    <option value="stripe">Stripe</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1.5 uppercase tracking-wider">
                    Amount ($) *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="49.99"
                    className="w-full bg-[#0B0D14] border border-white/10 focus:border-emerald-500 rounded-xl p-3 text-slate-100 text-sm outline-none font-mono tabular-nums"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1.5 uppercase tracking-wider">
                  Notes (Optional)
                </label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="e.g. Counter cash payment receipt issued..."
                  rows={2}
                  className="w-full bg-[#0B0D14] border border-white/10 focus:border-emerald-500 rounded-xl p-3 text-slate-100 text-sm outline-none"
                />
              </div>

              <div className="flex gap-3 pt-4 border-t border-white/10 mt-6">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 bg-white/5 hover:bg-white/10 text-slate-300 py-2.5 rounded-xl text-xs font-bold transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 bg-emerald-500 hover:bg-emerald-400 text-black py-2.5 rounded-xl text-xs font-black shadow-lg transition-all disabled:opacity-50"
                >
                  {submitting ? "Processing..." : "Log & Activate"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
