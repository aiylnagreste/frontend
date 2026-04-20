"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import {
  LayoutDashboard, Layers, CreditCard,
  ShieldHalf, LogOut, ChevronRight,
} from "lucide-react";

const NAV = [
  {
    section: "Overview",
    items: [
      { href: "/super-admin/dashboard", icon: LayoutDashboard, label: "Dashboard" },
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
      { href: "/super-admin/change-password", icon: ShieldHalf, label: "Change Password" },
    ],
  },
];

export function SuperSidebar() {
  const pathname = usePathname();

  function isActive(href: string) {
    const base = href.split("#")[0];
    if (base === "/super-admin/dashboard") return pathname === base;
    return pathname.startsWith(base);
  }

  return (
    <aside style={{
      width: 252, minHeight: "100vh",
      background: "#0E1015",
      display: "flex", flexDirection: "column",
      position: "fixed", top: 0, left: 0, bottom: 0,
      zIndex: 100,
      fontFamily: "'DM Sans', sans-serif",
      /* Subtle right edge light */
      borderRight: "1px solid rgba(255,255,255,0.05)",
    }}>
      {/* ── Brand ── */}
      <div style={{
        padding: "22px 20px 18px",
        borderBottom: "1px solid rgba(255,255,255,0.06)",
        display: "flex", alignItems: "center", gap: 12,
      }}>
        <div style={{
          width: 38, height: 38, borderRadius: 11,
          background: "linear-gradient(135deg, #0D9488 0%, #2DD4BF 100%)",
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: 17, fontWeight: 700, color: "#fff", flexShrink: 0,
          fontFamily: "'Space Grotesk', sans-serif",
          boxShadow: "0 2px 10px rgba(13,148,136,0.35)",
        }}>G</div>
        <div>
          <div style={{
            fontFamily: "'Space Grotesk', sans-serif",
            fontSize: 15, fontWeight: 700, color: "#fff",
            letterSpacing: "-0.01em",
          }}>GlowDesk</div>
          <div style={{
            fontSize: 9.5, color: "rgba(255,255,255,0.3)",
            textTransform: "uppercase", letterSpacing: "0.12em",
            marginTop: 2, fontWeight: 500,
          }}>Super Admin</div>
        </div>
      </div>

      {/* ── Navigation ── */}
      <nav style={{
        flex: 1, padding: "8px 10px", overflowY: "auto",
        /* Fade edges on scroll */
        maskImage: "linear-gradient(to bottom, transparent 0%, black 12px, black calc(100% - 12px), transparent 100%)",
        WebkitMaskImage: "linear-gradient(to bottom, transparent 0%, black 12px, black calc(100% - 12px), transparent 100%)",
      }}>
        {NAV.map((group, gIdx) => (
          <div key={group.section}>
            {/* Section label */}
            <div style={{
              fontSize: 9.5, fontWeight: 600,
              color: "rgba(255,255,255,0.25)",
              textTransform: "uppercase", letterSpacing: "0.12em",
              padding: gIdx === 0 ? "14px 12px 8px" : "20px 12px 8px",
            }}>{group.section}</div>

            {group.items.map(item => {
              const active = isActive(item.href);
              const Icon = item.icon;

              return (
                <Link key={item.href} href={item.href}
                  style={{
                    display: "flex", alignItems: "center", gap: 10,
                    padding: "9px 12px", borderRadius: 9,
                    fontSize: 13, fontWeight: active ? 600 : 450,
                    color: active ? "#5EEAD4" : "rgba(255,255,255,0.4)",
                    background: active
                      ? "linear-gradient(135deg, rgba(13,148,136,0.15) 0%, rgba(13,148,136,0.06) 100%)"
                      : "transparent",
                    textDecoration: "none",
                    marginBottom: 2,
                    transition: "all 0.18s ease",
                    position: "relative",
                    /* Active left indicator */
                    borderLeft: active ? "2px solid #0D9488" : "2px solid transparent",
                  }}
                  onMouseEnter={e => {
                    if (!active) {
                      e.currentTarget.style.background = "rgba(255,255,255,0.04)";
                      e.currentTarget.style.color = "rgba(255,255,255,0.7)";
                      e.currentTarget.style.borderLeftColor = "rgba(255,255,255,0.08)";
                    }
                  }}
                  onMouseLeave={e => {
                    if (!active) {
                      e.currentTarget.style.background = "transparent";
                      e.currentTarget.style.color = "rgba(255,255,255,0.4)";
                      e.currentTarget.style.borderLeftColor = "transparent";
                    }
                  }}
                >
                  {/* Icon wrapper with active glow */}
                  <div style={{
                    width: 28, height: 28, borderRadius: 7,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    background: active ? "rgba(13,148,136,0.2)" : "transparent",
                    flexShrink: 0,
                    transition: "background 0.18s ease",
                  }}>
                    <Icon
                      size={14.5}
                      style={{
                        flexShrink: 0,
                        color: active ? "#5EEAD4" : undefined,
                        filter: active ? "drop-shadow(0 0 4px rgba(94,234,212,0.4))" : undefined,
                      }}
                    />
                  </div>

                  <span style={{ flex: 1 }}>{item.label}</span>

                  {/* Active chevron */}
                  {active && (
                    <ChevronRight size={13} style={{
                      color: "rgba(94,234,212,0.5)", flexShrink: 0,
                    }} />
                  )}
                </Link>
              );
            })}
          </div>
        ))}
      </nav>

      {/* ── Footer ── */}
      <div style={{
        borderTop: "1px solid rgba(255,255,255,0.06)",
        padding: "10px 10px 14px",
      }}>
        {/* User pill */}
        <div style={{
          display: "flex", alignItems: "center", gap: 10,
          padding: "10px 12px", borderRadius: 9,
          background: "rgba(255,255,255,0.03)",
          marginBottom: 6,
        }}>
          <div style={{
            width: 32, height: 32, borderRadius: "50%",
            background: "linear-gradient(135deg, #0D9488 0%, #E8913A 100%)",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 10.5, fontWeight: 700, color: "#fff", flexShrink: 0,
            fontFamily: "'Space Grotesk', sans-serif",
            boxShadow: "0 1px 4px rgba(0,0,0,0.3)",
          }}>SA</div>
          <div style={{ minWidth: 0, flex: 1 }}>
            <div style={{
              fontSize: 12, fontWeight: 600, color: "rgba(255,255,255,0.8)",
              whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
            }}>Super Admin</div>
            <div style={{
              fontSize: 10, color: "rgba(255,255,255,0.25)",
              marginTop: 1,
            }}>admin@glowdesk.com</div>
          </div>
        </div>

        {/* Logout */}
        <a href="/super-admin/logout" style={{
          display: "flex", alignItems: "center", gap: 10,
          padding: "9px 12px", borderRadius: 9,
          fontSize: 13, fontWeight: 500,
          color: "rgba(239,68,68,0.5)",
          textDecoration: "none",
          transition: "all 0.18s ease",
        }}
          onMouseEnter={e => {
            e.currentTarget.style.background = "rgba(239,68,68,0.08)";
            e.currentTarget.style.color = "rgba(239,68,68,0.85)";
          }}
          onMouseLeave={e => {
            e.currentTarget.style.background = "transparent";
            e.currentTarget.style.color = "rgba(239,68,68,0.5)";
          }}
        >
          <LogOut size={14} style={{ flexShrink: 0 }} />
          <span>Logout</span>
        </a>
      </div>
    </aside>
  );
}