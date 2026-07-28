"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { signOut } from "@/lib/auth-client";

interface AdminNavProps {
  title: string;
  subtitle: string;
  badgeText?: string;
  actionButton?: React.ReactNode;
}

export function AdminNav({
  title,
  subtitle,
  badgeText,
  actionButton,
}: AdminNavProps) {
  const pathname = usePathname();
  const router = useRouter();

  const handleSignOut = async () => {
    try {
      await signOut();
    } catch (err) {
      console.error("Logout error", err);
    } finally {
      window.location.href = "/login";
    }
  };

  const navItems = [
    { label: "Terminal", href: "/admin/terminal" },
    { label: "Members", href: "/admin/members" },
    { label: "Payments", href: "/admin/payments" },
    { label: "Plans", href: "/admin/plans" },
    { label: "Classes", href: "/admin/classes" },
  ];

  return (
    <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 pb-6 mb-8 border-b border-[#222634]">
      <div>
        <div className="flex items-center gap-3 mb-1">
          {badgeText && (
            <span className="bg-[#10B981]/15 text-[#10B981] border border-[#10B981]/30 text-xs px-2.5 py-0.5 rounded-full font-semibold uppercase tracking-wider">
              {badgeText}
            </span>
          )}
          <h1 className="text-2xl lg:text-3xl font-extrabold tracking-tight text-[#F3F4F6]">
            {title}
          </h1>
        </div>
        <p className="text-[#9CA3AF] text-sm">{subtitle}</p>
      </div>

      <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto justify-between lg:justify-end">
        {/* Navigation Tabs */}
        <div className="flex items-center gap-1 bg-[#12141C] p-1.5 rounded-xl border border-[#222634]">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
                  isActive
                    ? "bg-[#10B981] text-white shadow-sm"
                    : "text-[#9CA3AF] hover:text-[#F3F4F6]"
                }`}
              >
                {item.label}
              </Link>
            );
          })}
        </div>

        {/* Action Button (e.g. + Register Member, + Create Plan) */}
        {actionButton}

        {/* Logout / Sign Out Button */}
        <button
          onClick={handleSignOut}
          className="bg-[#1A1D29] hover:bg-[#EF4444]/20 text-[#9CA3AF] hover:text-[#F87171] border border-[#222634] hover:border-[#EF4444]/40 px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5"
          title="Sign out of Admin Portal"
        >
          <span>Logout</span>
          <span>↳</span>
        </button>
      </div>
    </div>
  );
}
