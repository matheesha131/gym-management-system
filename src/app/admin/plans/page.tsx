"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { AdminNav } from "../components/AdminNav";

interface Plan {
  id: string;
  name: string;
  description: string | null;
  durationDays: number;
  price: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export default function AdminPlansPage() {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Form modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPlan, setEditingPlan] = useState<Plan | null>(null);

  // Form fields
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [durationDays, setDurationDays] = useState(30);
  const [price, setPrice] = useState("49.99");
  const [isActive, setIsActive] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const fetchPlans = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/admin/plans");
      if (!res.ok) throw new Error("Failed to fetch membership plans");
      const data = await res.json();
      setPlans(data);
    } catch (err: any) {
      setError(err.message || "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPlans();
  }, []);

  const openCreateModal = () => {
    setEditingPlan(null);
    setName("");
    setDescription("");
    setDurationDays(30);
    setPrice("49.99");
    setIsActive(true);
    setFormError(null);
    setIsModalOpen(true);
  };

  const openEditModal = (plan: Plan) => {
    setEditingPlan(plan);
    setName(plan.name);
    setDescription(plan.description || "");
    setDurationDays(plan.durationDays);
    setPrice(plan.price);
    setIsActive(plan.isActive);
    setFormError(null);
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!name.trim()) {
      setFormError("Name is required");
      return;
    }

    if (durationDays <= 0) {
      setFormError("Duration must be a positive number of days");
      return;
    }

    if (Number(price) < 0) {
      setFormError("Price cannot be negative");
      return;
    }

    try {
      setSubmitting(true);
      const payload = {
        name: name.trim(),
        description: description.trim() || null,
        durationDays: Number(durationDays),
        price: Number(price),
        isActive,
      };

      const url = editingPlan
        ? `/api/admin/plans/${editingPlan.id}`
        : "/api/admin/plans";
      const method = editingPlan ? "PATCH" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || "Failed to save plan");
      }

      setIsModalOpen(false);
      fetchPlans();
    } catch (err: any) {
      setFormError(err.message || "Failed to save plan");
    } finally {
      setSubmitting(false);
    }
  };

  const togglePlanActive = async (plan: Plan) => {
    try {
      const res = await fetch(`/api/admin/plans/${plan.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !plan.isActive }),
      });

      if (!res.ok) throw new Error("Failed to update status");
      fetchPlans();
    } catch (err: any) {
      alert(err.message || "Failed to update status");
    }
  };

  return (
    <div className="min-h-screen p-6 md:p-10 max-w-7xl mx-auto bg-[#08090C] text-[#F8FAFC] font-sans">
      {/* Top Admin Navigation Header */}
      <AdminNav
        title="Membership Plans"
        subtitle="Manage gym membership tiers, pricing, and availability"
        badgeText="Plans Catalog"
        actionButton={
          <button
            onClick={openCreateModal}
            className="bg-emerald-500 hover:bg-emerald-400 text-black px-4 py-2.5 rounded-xl text-xs font-black shadow-[0_0_15px_rgba(16,185,129,0.25)] transition-all active:scale-[0.98] flex items-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
            </svg>
            <span>Create New Plan</span>
          </button>
        }
      />

      {error && (
        <div className="bg-rose-500/10 border border-rose-500/30 text-rose-300 p-4 rounded-2xl mb-6 text-xs flex items-center gap-2">
          <span>⚠️ {error}</span>
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-24 text-slate-400 gap-3">
          <div className="w-5 h-5 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
          <span className="text-sm font-medium">Loading membership plans...</span>
        </div>
      ) : plans.length === 0 ? (
        <div className="glass-panel rounded-3xl p-12 text-center text-slate-400 text-xs border border-white/10">
          No membership plans created yet. Click "+ Create New Plan" to get started.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 items-stretch">
          {plans.map((plan) => (
            <div
              key={plan.id}
              className={`glass-card rounded-3xl p-6 flex flex-col justify-between shadow-xl relative border ${
                plan.isActive ? "border-white/10" : "border-white/5 opacity-65"
              }`}
            >
              <div>
                <div className="flex justify-between items-start mb-3">
                  <h3 className="text-xl font-black text-white tracking-tight">{plan.name}</h3>
                  <span
                    className={`text-[10px] px-2.5 py-0.5 rounded-full font-black uppercase tracking-wider ${
                      plan.isActive
                        ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                        : "bg-white/5 text-slate-400 border border-white/10"
                    }`}
                  >
                    {plan.isActive ? "Active" : "Inactive"}
                  </span>
                </div>
                <p className="text-xs text-slate-400 mb-6 min-h-[40px] leading-relaxed">
                  {plan.description || "No description provided for this plan."}
                </p>
                <div className="flex items-baseline gap-1.5 mb-2 bg-[#0B0D14] border border-white/10 rounded-2xl p-4">
                  <span className="text-3xl font-black font-mono text-emerald-400 tabular-nums">${plan.price}</span>
                  <span className="text-slate-400 text-xs font-mono tabular-nums">/ {plan.durationDays} days</span>
                </div>
              </div>

              <div className="flex gap-2 mt-6 pt-4 border-t border-white/10">
                <button
                  onClick={() => openEditModal(plan)}
                  className="flex-1 bg-white/5 hover:bg-white/10 text-slate-200 py-2.5 rounded-xl text-xs font-bold transition-all active:scale-[0.98]"
                >
                  Edit Plan
                </button>
                <button
                  onClick={() => togglePlanActive(plan)}
                  className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition-all active:scale-[0.98] ${
                    plan.isActive
                      ? "bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/30"
                      : "bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                  }`}
                >
                  {plan.isActive ? "Deactivate" : "Activate"}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create / Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 z-50">
          <div className="glass-panel border border-white/10 w-full max-w-md rounded-3xl p-6 shadow-2xl">
            <h2 className="text-xl font-black text-white mb-4">
              {editingPlan ? "Edit Membership Plan" : "Create Membership Plan"}
            </h2>

            {formError && (
              <div className="bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs p-3.5 rounded-2xl mb-4">
                {formError}
              </div>
            )}

            <form onSubmit={handleSave} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1.5 uppercase tracking-wider">
                  Plan Name *
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Monthly All-Access"
                  className="w-full bg-[#0B0D14] border border-white/10 focus:border-emerald-500 rounded-xl p-3 text-slate-100 text-sm outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1.5 uppercase tracking-wider">
                  Description
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Describe the plan benefits..."
                  rows={3}
                  className="w-full bg-[#0B0D14] border border-white/10 focus:border-emerald-500 rounded-xl p-3 text-slate-100 text-sm outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1.5 uppercase tracking-wider">
                    Duration (Days) *
                  </label>
                  <input
                    type="number"
                    value={durationDays}
                    onChange={(e) => setDurationDays(Number(e.target.value))}
                    min={1}
                    className="w-full bg-[#0B0D14] border border-white/10 focus:border-emerald-500 rounded-xl p-3 text-slate-100 text-sm outline-none font-mono tabular-nums"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1.5 uppercase tracking-wider">
                    Price ($) *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    min={0}
                    className="w-full bg-[#0B0D14] border border-white/10 focus:border-emerald-500 rounded-xl p-3 text-slate-100 text-sm outline-none font-mono tabular-nums"
                    required
                  />
                </div>
              </div>

              <div className="flex items-center gap-2.5 pt-2">
                <input
                  type="checkbox"
                  id="isActive"
                  checked={isActive}
                  onChange={(e) => setIsActive(e.target.checked)}
                  className="w-4 h-4 rounded accent-emerald-500 bg-[#0B0D14] border-white/10"
                />
                <label htmlFor="isActive" className="text-xs font-bold text-slate-200 cursor-pointer">
                  Plan is active for purchase
                </label>
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
                  {submitting ? "Saving..." : editingPlan ? "Update Plan" : "Create Plan"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
