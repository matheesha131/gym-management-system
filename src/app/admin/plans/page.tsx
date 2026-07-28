"use client";

import { useEffect, useState } from "react";

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
    <div className="min-h-screen p-8 max-w-7xl mx-auto bg-[#090A0F] text-[#F3F4F6]">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-[#10B981]">Membership Plans</h1>
          <p className="text-[#9CA3AF] text-sm mt-1">
            Manage gym membership tiers, pricing, and availability
          </p>
        </div>
        <button
          onClick={openCreateModal}
          className="bg-[#10B981] hover:bg-[#059669] text-white px-4 py-2 rounded-lg font-medium shadow-md transition-colors"
        >
          + Create New Plan
        </button>
      </div>

      {error && (
        <div className="bg-[#EF4444]/10 border border-[#EF4444] text-[#EF4444] p-4 rounded-lg mb-6">
          {error}
        </div>
      )}

      {loading ? (
        <div className="text-[#9CA3AF] py-12 text-center">Loading plans...</div>
      ) : plans.length === 0 ? (
        <div className="bg-[#12141C] border border-[#222634] rounded-xl p-12 text-center text-[#9CA3AF]">
          No membership plans created yet. Click "+ Create New Plan" to get started.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {plans.map((plan) => (
            <div
              key={plan.id}
              className={`bg-[#12141C] border ${
                plan.isActive ? "border-[#222634]" : "border-[#222634]/50 opacity-60"
              } rounded-xl p-6 flex flex-col justify-between shadow-lg relative`}
            >
              <div>
                <div className="flex justify-between items-start mb-2">
                  <h3 className="text-xl font-bold text-[#F3F4F6]">{plan.name}</h3>
                  <span
                    className={`text-xs px-2.5 py-1 rounded-full font-semibold ${
                      plan.isActive
                        ? "bg-[#10B981]/15 text-[#10B981] border border-[#10B981]/30"
                        : "bg-[#222634] text-[#9CA3AF] border border-[#222634]"
                    }`}
                  >
                    {plan.isActive ? "Active" : "Inactive"}
                  </span>
                </div>
                <p className="text-[#9CA3AF] text-sm mb-4 min-h-[40px]">
                  {plan.description || "No description provided."}
                </p>
                <div className="flex items-baseline gap-1 mb-2">
                  <span className="text-3xl font-extrabold text-[#F3F4F6]">${plan.price}</span>
                  <span className="text-[#9CA3AF] text-sm">/ {plan.durationDays} days</span>
                </div>
              </div>

              <div className="flex gap-2 mt-6 pt-4 border-t border-[#222634]">
                <button
                  onClick={() => openEditModal(plan)}
                  className="flex-1 bg-[#1A1D29] hover:bg-[#222634] text-[#F3F4F6] py-2 rounded-lg text-sm font-medium transition-colors"
                >
                  Edit Details
                </button>
                <button
                  onClick={() => togglePlanActive(plan)}
                  className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${
                    plan.isActive
                      ? "bg-[#F59E0B]/10 hover:bg-[#F59E0B]/20 text-[#F59E0B] border border-[#F59E0B]/30"
                      : "bg-[#10B981]/10 hover:bg-[#10B981]/20 text-[#10B981] border border-[#10B981]/30"
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
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50 backdrop-blur-sm">
          <div className="bg-[#12141C] border border-[#222634] w-full max-w-md rounded-xl p-6 shadow-2xl">
            <h2 className="text-2xl font-bold text-[#F3F4F6] mb-4">
              {editingPlan ? "Edit Membership Plan" : "Create Membership Plan"}
            </h2>

            {formError && (
              <div className="bg-[#EF4444]/10 border border-[#EF4444] text-[#EF4444] text-sm p-3 rounded-lg mb-4">
                {formError}
              </div>
            )}

            <form onSubmit={handleSave} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-[#9CA3AF] mb-1">
                  Plan Name *
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Monthly All-Access"
                  className="w-full bg-[#090A0F] border border-[#222634] rounded-lg p-2.5 text-[#F3F4F6] text-sm focus:outline-none focus:border-[#10B981]"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#9CA3AF] mb-1">
                  Description
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Describe the plan benefits..."
                  rows={3}
                  className="w-full bg-[#090A0F] border border-[#222634] rounded-lg p-2.5 text-[#F3F4F6] text-sm focus:outline-none focus:border-[#10B981]"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-[#9CA3AF] mb-1">
                    Duration (Days) *
                  </label>
                  <input
                    type="number"
                    value={durationDays}
                    onChange={(e) => setDurationDays(Number(e.target.value))}
                    min={1}
                    className="w-full bg-[#090A0F] border border-[#222634] rounded-lg p-2.5 text-[#F3F4F6] text-sm focus:outline-none focus:border-[#10B981]"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#9CA3AF] mb-1">
                    Price ($) *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    min={0}
                    className="w-full bg-[#090A0F] border border-[#222634] rounded-lg p-2.5 text-[#F3F4F6] text-sm focus:outline-none focus:border-[#10B981]"
                    required
                  />
                </div>
              </div>

              <div className="flex items-center gap-2 pt-2">
                <input
                  type="checkbox"
                  id="isActive"
                  checked={isActive}
                  onChange={(e) => setIsActive(e.target.checked)}
                  className="w-4 h-4 rounded accent-[#10B981] bg-[#090A0F] border-[#222634]"
                />
                <label htmlFor="isActive" className="text-sm font-medium text-[#F3F4F6] cursor-pointer">
                  Plan is active for purchase
                </label>
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
