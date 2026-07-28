"use client";

import { useState } from "react";
import { signIn } from "@/lib/auth-client";
import { useRouter } from "next/navigation";

export default function LoginPage() {
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
      const res = await signIn.email({
        email,
        password,
      });

      if (res.error) {
        setError(res.error.message || "Invalid credentials");
      } else {
        // Force full page reload or push to root so proxy middleware evaluates auth redirect
        window.location.href = "/";
      }
    } catch (err: any) {
      setError(err.message || "Failed to sign in");
    } finally {
      setLoading(false);
    }
  };

  const quickFill = (demoEmail: string, demoPass: string) => {
    setEmail(demoEmail);
    setPassword(demoPass);
  };

  return (
    <div className="min-h-screen bg-[#090A0F] text-[#F3F4F6] flex items-center justify-center p-4 font-sans">
      <div className="bg-[#12141C] border border-[#222634] w-full max-w-md rounded-2xl p-8 shadow-2xl">
        <h1 className="text-2xl font-black text-[#10B981] mb-1">Gym Management System</h1>
        <p className="text-sm text-[#9CA3AF] mb-6">Sign in to your account</p>

        {error && (
          <div className="bg-[#EF4444]/15 border border-[#EF4444] text-[#F87171] text-xs p-3.5 rounded-xl mb-4">
            {error}
          </div>
        )}

        {/* Demo Quick Fill Buttons */}
        <div className="mb-6 bg-[#090A0F] border border-[#222634] rounded-xl p-3">
          <span className="text-[11px] font-bold text-[#9CA3AF] uppercase block mb-2">
            ⚡ Demo Credentials Quick Fill
          </span>
          <div className="grid grid-cols-3 gap-2">
            <button
              type="button"
              onClick={() => quickFill("admin@gym.com", "Password123!")}
              className="bg-[#222634] hover:bg-[#2D3346] text-[#10B981] text-xs font-semibold py-1.5 px-2 rounded-lg transition-colors border border-[#10B981]/30"
            >
              Admin
            </button>
            <button
              type="button"
              onClick={() => quickFill("staff@gym.com", "Password123!")}
              className="bg-[#222634] hover:bg-[#2D3346] text-[#3B82F6] text-xs font-semibold py-1.5 px-2 rounded-lg transition-colors border border-[#3B82F6]/30"
            >
              Staff
            </button>
            <button
              type="button"
              onClick={() => quickFill("member@gym.com", "Password123!")}
              className="bg-[#222634] hover:bg-[#2D3346] text-[#F59E0B] text-xs font-semibold py-1.5 px-2 rounded-lg transition-colors border border-[#F59E0B]/30"
            >
              Member
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-[#9CA3AF] mb-1 uppercase">
              Email Address
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="user@example.com"
              className="w-full bg-[#090A0F] border border-[#222634] focus:border-[#10B981] rounded-xl p-3 text-[#F3F4F6] text-sm outline-none"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#9CA3AF] mb-1 uppercase">
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full bg-[#090A0F] border border-[#222634] focus:border-[#10B981] rounded-xl p-3 text-[#F3F4F6] text-sm outline-none"
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[#10B981] hover:bg-[#059669] text-white py-3 rounded-xl text-sm font-extrabold transition-all shadow-lg disabled:opacity-50 mt-2"
          >
            {loading ? "Signing in..." : "Sign In"}
          </button>
        </form>

        <p className="text-xs text-center text-[#9CA3AF] mt-6">
          Don't have an account?{" "}
          <a href="/register" className="text-[#10B981] hover:underline font-bold">
            Register
          </a>
        </p>
      </div>
    </div>
  );
}
