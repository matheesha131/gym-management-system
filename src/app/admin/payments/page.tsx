"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

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
    <div className="min-h-screen p-8 max-w-7xl mx-auto bg-[#090A0F] text-[#F3F4F6]">
      {/* Top Admin Navigation Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 pb-6 mb-6 border-b border-[#222634]">
        <div>
          <h1 className="text-3xl font-bold text-[#10B981]">
            Counter Payments & Receipts
          </h1>
          <p className="text-[#9CA3AF] text-sm mt-1">
            Log manual counter payments and view financial audit history
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
              className="px-3.5 py-1.5 text-xs font-semibold rounded-lg text-[#9CA3AF] hover:text-[#F3F4F6] transition-colors"
            >
              Members
            </Link>
            <Link
              href="/admin/payments"
              className="px-3.5 py-1.5 text-xs font-semibold rounded-lg bg-[#10B981] text-white shadow-sm"
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
            onClick={openLogModal}
            className="bg-[#10B981] hover:bg-[#059669] text-white px-4 py-2 rounded-lg font-medium shadow-md transition-colors flex items-center gap-2"
          >
            <span>+ Log Counter Payment</span>
          </button>
        </div>
      </div>

      {/* Search & Filter Bar */}
      <div className="bg-[#12141C] border border-[#222634] rounded-xl p-4 mb-6">
        <div className="relative">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search payments by receipt ref (e.g. REC-20260728-1001), member name, or code..."
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

      {/* Audit Log Table */}
      {loading ? (
        <div className="text-[#9CA3AF] py-16 text-center">Loading payment history...</div>
      ) : payments.length === 0 ? (
        <div className="bg-[#12141C] border border-[#222634] rounded-xl p-12 text-center text-[#9CA3AF]">
          {searchQuery
            ? `No payments matching "${searchQuery}".`
            : "No counter payments logged yet. Click '+ Log Counter Payment' to record a transaction."}
        </div>
      ) : (
        <div className="bg-[#12141C] border border-[#222634] rounded-xl overflow-hidden shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="bg-[#1A1D29] border-b border-[#222634] text-[#9CA3AF] font-semibold">
                  <th className="py-3.5 px-6">Receipt Ref</th>
                  <th className="py-3.5 px-6">Member</th>
                  <th className="py-3.5 px-6">Plan Activated</th>
                  <th className="py-3.5 px-6">Amount</th>
                  <th className="py-3.5 px-6">Payment Method</th>
                  <th className="py-3.5 px-6">Date & Time</th>
                  <th className="py-3.5 px-6">Logged By</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#222634]">
                {payments.map((p) => (
                  <tr
                    key={p.id}
                    className="hover:bg-[#1A1D29]/50 transition-colors"
                  >
                    <td className="py-4 px-6 font-mono text-[#10B981] font-semibold">
                      {p.receiptRef}
                    </td>
                    <td className="py-4 px-6">
                      <div className="font-semibold text-[#F3F4F6]">
                        {p.member.name}
                      </div>
                      <div className="text-xs font-mono text-[#9CA3AF]">
                        {p.member.memberCode || p.member.email}
                      </div>
                    </td>
                    <td className="py-4 px-6 text-[#F3F4F6]">
                      {p.plan ? p.plan.name : "N/A"}
                    </td>
                    <td className="py-4 px-6 font-mono text-[#F3F4F6] font-bold text-base">
                      ${p.amount}
                    </td>
                    <td className="py-4 px-6">
                      <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold font-mono bg-[#1A1D29] text-[#F3F4F6] border border-[#222634]">
                        {formatPaymentMethod(p.paymentMethod)}
                      </span>
                    </td>
                    <td className="py-4 px-6 text-[#9CA3AF] font-mono text-xs">
                      {formatDate(p.paidAt)}
                    </td>
                    <td className="py-4 px-6 text-[#9CA3AF] text-xs">
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
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50 backdrop-blur-sm">
          <div className="bg-[#12141C] border border-[#222634] w-full max-w-md rounded-xl p-6 shadow-2xl">
            <h2 className="text-2xl font-bold text-[#F3F4F6] mb-1">
              Log Counter Payment
            </h2>
            <p className="text-xs text-[#9CA3AF] mb-4">
              Recording payment auto-activates member's subscription and generates receipt.
            </p>

            {formError && (
              <div className="bg-[#EF4444]/10 border border-[#EF4444] text-[#EF4444] text-sm p-3 rounded-lg mb-4">
                {formError}
              </div>
            )}

            <form onSubmit={handleLogPaymentSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-[#9CA3AF] mb-1">
                  Select Member *
                </label>
                <select
                  value={selectedMemberId}
                  onChange={(e) => setSelectedMemberId(e.target.value)}
                  className="w-full bg-[#090A0F] border border-[#222634] rounded-lg p-2.5 text-[#F3F4F6] text-sm focus:outline-none focus:border-[#10B981]"
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
                <label className="block text-xs font-semibold text-[#9CA3AF] mb-1">
                  Select Membership Plan *
                </label>
                <select
                  value={selectedPlanId}
                  onChange={(e) => handlePlanChange(e.target.value)}
                  className="w-full bg-[#090A0F] border border-[#222634] rounded-lg p-2.5 text-[#F3F4F6] text-sm focus:outline-none focus:border-[#10B981]"
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
                  <label className="block text-xs font-semibold text-[#9CA3AF] mb-1">
                    Payment Method *
                  </label>
                  <select
                    value={paymentMethod}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                    className="w-full bg-[#090A0F] border border-[#222634] rounded-lg p-2.5 text-[#F3F4F6] text-sm focus:outline-none focus:border-[#10B981]"
                    required
                  >
                    <option value="cash">Cash</option>
                    <option value="card_counter">Card Terminal</option>
                    <option value="bank_transfer">Bank Transfer</option>
                    <option value="stripe">Stripe</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#9CA3AF] mb-1">
                    Amount ($) *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="49.99"
                    className="w-full bg-[#090A0F] border border-[#222634] rounded-lg p-2.5 text-[#F3F4F6] text-sm focus:outline-none focus:border-[#10B981] font-mono"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#9CA3AF] mb-1">
                  Notes (Optional)
                </label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="e.g. Counter cash payment receipt issued..."
                  rows={2}
                  className="w-full bg-[#090A0F] border border-[#222634] rounded-lg p-2.5 text-[#F3F4F6] text-sm focus:outline-none focus:border-[#10B981]"
                />
              </div>

              <div className="flex gap-3 pt-4 border-t border-[#222634] mt-6">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 bg-[#1A1D29] hover:bg-[#222634] text-[#F3F4F6] py-2 rounded-lg text-sm font-medium transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 bg-[#10B981] hover:bg-[#059669] text-white py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
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
