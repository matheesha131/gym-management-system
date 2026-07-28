"use client";

import { useState } from "react";
import { signUp } from "@/lib/auth-client";
import { useRouter } from "next/navigation";

export default function RegisterPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await signUp.email({
        name,
        email,
        password,
      });

      if (res.error) {
        setError(res.error.message || "Failed to create account");
      } else {
        router.push("/login");
      }
    } catch (err: any) {
      setError(err.message || "Failed to create account");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#090A0F] text-[#F3F4F6] flex items-center justify-center p-4">
      <div className="bg-[#12141C] border border-[#222634] w-full max-w-md rounded-xl p-8 shadow-2xl">
        <h1 className="text-2xl font-bold text-[#10B981] mb-2">Gym Management System</h1>
        <p className="text-sm text-[#9CA3AF] mb-6">Create a new account</p>

        {error && (
          <div className="bg-[#EF4444]/10 border border-[#EF4444] text-[#EF4444] text-sm p-3 rounded-lg mb-4">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-[#9CA3AF] mb-1">
              Full Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="John Doe"
              className="w-full bg-[#090A0F] border border-[#222634] rounded-lg p-2.5 text-[#F3F4F6] text-sm focus:outline-none focus:border-[#10B981]"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#9CA3AF] mb-1">
              Email Address
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="user@example.com"
              className="w-full bg-[#090A0F] border border-[#222634] rounded-lg p-2.5 text-[#F3F4F6] text-sm focus:outline-none focus:border-[#10B981]"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#9CA3AF] mb-1">
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full bg-[#090A0F] border border-[#222634] rounded-lg p-2.5 text-[#F3F4F6] text-sm focus:outline-none focus:border-[#10B981]"
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[#10B981] hover:bg-[#059669] text-white py-2.5 rounded-lg text-sm font-semibold transition-colors disabled:opacity-50 mt-2"
          >
            {loading ? "Creating Account..." : "Register"}
          </button>
        </form>

        <p className="text-xs text-center text-[#9CA3AF] mt-6">
          Already have an account?{" "}
          <a href="/login" className="text-[#10B981] hover:underline font-medium">
            Sign In
          </a>
        </p>
      </div>
    </div>
  );
}
