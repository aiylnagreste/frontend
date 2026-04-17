"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { fetchTenants } from "@/lib/queries";
import { api } from "@/lib/api";

interface ResetRequest { tenantId: string }

const NAV = [
  {
    section: "Overview",
    items: [
      { href: "/super-admin/dashboard", icon: "🏠", label: "Dashboard" },
      { href: "/super-admin/salons", icon: "🏪", label: "Salons", badge: "salons" },
    ],
  },
  {
    section: "Billing",
    items: [
      { href: "/super-admin/plans", icon: "📋", label: "Plans" },
      { href: "/super-admin/payments", icon: "💳", label: "Payments" },
    ],
  },
  {
    section: "System",
    items: [
      { href: "/super-admin/dashboard#resets", icon: "🔔", label: "Reset Requests", badge: "resets" },
      { href: "/super-admin/change-password", icon: "🔑", label: "Change Password" },
    ],
  },
];

export function SuperSidebar() {
  const pathname = usePathname();

  const { data: resetRequests = [] } = useQuery<ResetRequest[]>({
    queryKey: ["resetRequests"],
    queryFn: () => api.get<ResetRequest[]>("/super-admin/api/reset-requests"),
    staleTime: 30_000,
  });

  const { data: tenants = [] } = useQuery({
    queryKey: ["tenants"],
    queryFn: fetchTenants,
    staleTime: 30_000,
  });

  function getBadge(key: string): number | null {
    if (key === "resets") return resetRequests.length > 0 ? resetRequests.length : null;
    if (key === "salons") return tenants.length > 0 ? tenants.length : null;
    return null;
  }

  function isActive(href: string) {
    const base = href.split("#")[0];
    if (base === "/super-admin/dashboard") return pathname === base;
    return pathname.startsWith(base);
  }

  return (
    <aside className="flex flex-col w-[200px] min-h-screen bg-slate-900 flex-shrink-0">
      {/* Logo */}
      <div className="flex items-center gap-3 px-4 py-5 border-b border-white/[0.07]">
        <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-purple-400 to-indigo-400 flex items-center justify-center text-sm flex-shrink-0">
          ⚡
        </div>
        <div>
          <div className="text-sm font-bold text-white leading-tight">GlowDesk</div>
          <div className="text-[10px] text-white/30 mt-0.5">Super Admin</div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-2 py-3 flex flex-col gap-0.5">
        {NAV.map((group) => (
          <div key={group.section}>
            <div className="text-[9px] font-bold text-white/25 uppercase tracking-widest px-2 py-2 mt-2 first:mt-0">
              {group.section}
            </div>
            {group.items.map((item) => {
              const active = isActive(item.href);
              const badge = "badge" in item ? getBadge(item.badge as string) : null;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-xs transition-colors ${
                    active
                      ? "bg-purple-500/25 text-purple-300 font-semibold"
                      : "text-white/50 hover:bg-white/[0.06] hover:text-white/80"
                  }`}
                >
                  <span className="w-4 text-center text-sm flex-shrink-0">{item.icon}</span>
                  <span className="flex-1">{item.label}</span>
                  {badge !== null && (
                    <span className={`text-[9px] font-bold rounded-full px-1.5 py-0.5 ${
                      item.badge === "resets" ? "bg-red-500 text-white" : "bg-white/10 text-white/50"
                    }`}>
                      {badge}
                    </span>
                  )}
                </Link>
              );
            })}
          </div>
        ))}
      </nav>

      {/* Bottom: user + logout */}
      <div className="border-t border-white/[0.07] px-2 py-3 flex flex-col gap-0.5">
        <div className="flex items-center gap-2.5 px-2.5 py-2">
          <div className="w-7 h-7 rounded-full bg-gradient-to-br from-purple-400 to-indigo-400 flex items-center justify-center text-[11px] font-bold text-white flex-shrink-0">
            SA
          </div>
          <div className="min-w-0">
            <div className="text-[11px] font-semibold text-white/80 truncate">Super Admin</div>
          </div>
        </div>
        <a
          href="/super-admin/logout"
          className="flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-xs text-red-400/70 hover:bg-red-500/10 hover:text-red-400 transition-colors"
        >
          <span className="w-4 text-center text-sm">🚪</span>
          <span>Logout</span>
        </a>
      </div>
    </aside>
  );
}
