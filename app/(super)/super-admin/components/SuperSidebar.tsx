"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import {
  LayoutDashboard, Layers, CreditCard,
  ShieldHalf, LogOut,
} from "lucide-react";

const NAV = [
  {
    section: "Overview",
    items: [
      { href: "/super-admin/dashboard", icon: LayoutDashboard, label: "Dashboard" },
    //  { href: "/super-admin/salons",    icon: Store,           label: "Salons", badge: "salons" },
    ],
  },
  {
    section: "Billing",
    items: [
      { href: "/super-admin/plans",    icon: Layers,     label: "Plans" },
      { href: "/super-admin/payments", icon: CreditCard, label: "Payments" },
    ],
  },
  {
    section: "System",
    items: [
     // { href: "/super-admin/dashboard#resets", icon: Key,        label: "Reset Requests", badge: "resets" },
      { href: "/super-admin/change-password",  icon: ShieldHalf, label: "Change Password" },
    ],
  },
];

export function SuperSidebar() {
  const pathname = usePathname();

  function getBadge(_key: string): number | null {
    return null;
  }

  function isActive(href: string) {
    const base = href.split("#")[0];
    if (base === "/super-admin/dashboard") return pathname === base;
    return pathname.startsWith(base);
  }

  return (
    <aside style={{
      width: 240, minHeight: "100vh",
      background: "#111318",
      display: "flex", flexDirection: "column",
      position: "fixed", top: 0, left: 0, bottom: 0,
      zIndex: 100,
      borderRight: "1px solid rgba(255,255,255,0.06)",
      fontFamily: "'DM Sans', sans-serif",
    }}>
      {/* Brand */}
      <div style={{
        padding: "20px 20px",
        borderBottom: "1px solid rgba(255,255,255,0.06)",
        display: "flex", alignItems: "center", gap: 12,
      }}>
        <div style={{
          width: 36, height: 36, borderRadius: 10,
          background: "linear-gradient(135deg, #0D9488, #2DD4BF)",
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: 16, fontWeight: 700, color: "#fff", flexShrink: 0,
          fontFamily: "'Space Grotesk', sans-serif",
        }}>G</div>
        <div>
          <div style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 15, fontWeight: 700, color: "#fff" }}>GlowDesk</div>
          <div style={{ fontSize: 10, color: "rgba(255,255,255,0.35)", textTransform: "uppercase", letterSpacing: "0.1em", marginTop: 1 }}>Super Admin</div>
        </div>
      </div>

      {/* Nav */}
      <nav style={{ flex: 1, padding: "12px", overflowY: "auto" }}>
        {NAV.map(group => (
          <div key={group.section}>
            <div style={{
              fontSize: 10, fontWeight: 600,
              color: "rgba(255,255,255,0.3)",
              textTransform: "uppercase", letterSpacing: "0.1em",
              padding: "16px 12px 8px",
            }}>{group.section}</div>

            {group.items.map(item => {
              const active = isActive(item.href);
              const badge = "badge" in item ? getBadge(item.badge as string) : null;
              const Icon = item.icon;
              return (
                <Link key={item.href} href={item.href}
                  style={{
                    display: "flex", alignItems: "center", gap: 10,
                    padding: "9px 12px", borderRadius: 8,
                    fontSize: 13, fontWeight: active ? 600 : 500,
                    color: active ? "#5EEAD4" : "rgba(255,255,255,0.45)",
                    background: active ? "rgba(13,148,136,0.12)" : "transparent",
                    textDecoration: "none",
                    marginBottom: 2,
                    transition: "all 0.15s ease",
                  }}
                  onMouseEnter={e => { if (!active) { e.currentTarget.style.background = "#22262F"; e.currentTarget.style.color = "rgba(255,255,255,0.7)"; } }}
                  onMouseLeave={e => { if (!active) { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "rgba(255,255,255,0.45)"; } }}
                >
                  <Icon size={15} style={{ flexShrink: 0 }} />
                  <span style={{ flex: 1 }}>{item.label}</span>
                  {badge !== null && (
                    <span style={{
                      fontSize: 10, fontWeight: 700,
                      padding: "2px 7px", borderRadius: 99, lineHeight: 1.4,
                      background: "badge" in item && item.badge === "resets" ? "#EF4444" : "rgba(255,255,255,0.08)",
                      color: "badge" in item && item.badge === "resets" ? "#fff" : "rgba(255,255,255,0.45)",
                    }}>{badge}</span>
                  )}
                </Link>
              );
            })}
          </div>
        ))}
      </nav>

      {/* Footer */}
      <div style={{ borderTop: "1px solid rgba(255,255,255,0.06)", padding: "12px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 12px" }}>
          <div style={{
            width: 32, height: 32, borderRadius: "50%",
            background: "linear-gradient(135deg, #0D9488, #E8913A)",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 11, fontWeight: 700, color: "#fff", flexShrink: 0,
          }}>SA</div>
          <div>
            <div style={{ fontSize: 12, fontWeight: 600, color: "rgba(255,255,255,0.8)" }}>Super Admin</div>
          </div>
        </div>
        <a href="/super-admin/logout" style={{
          display: "flex", alignItems: "center", gap: 10,
          padding: "9px 12px", borderRadius: 8,
          fontSize: 13, fontWeight: 500,
          color: "rgba(239,68,68,0.6)",
          textDecoration: "none",
          transition: "all 0.15s ease",
          marginTop: 4,
        }}
          onMouseEnter={e => { e.currentTarget.style.background = "rgba(239,68,68,0.1)"; e.currentTarget.style.color = "rgba(239,68,68,0.9)"; }}
          onMouseLeave={e => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "rgba(239,68,68,0.6)"; }}
        >
          <LogOut size={14} style={{ flexShrink: 0 }} />
          <span>Logout</span>
        </a>
      </div>
    </aside>
  );
}