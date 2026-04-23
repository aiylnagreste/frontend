"use client";

import { usePathname } from "next/navigation";
import {
  LayoutDashboard, Layers, CreditCard,
  ShieldHalf, LogOut, ChevronRight, Settings
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
    section: "Integrations",
    items: [
      { href: "/super-admin/integrations", icon: Settings, label: "Salon Integrations" },
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
    <aside style={styles.sidebar}>
      <div style={styles.glow1} />
      <div style={styles.glow2} />

      <div style={styles.brand}>
        <div style={styles.brandIcon}>
          <span style={{ fontSize: "18px" }}>✨</span>
        </div>
        <div>
          <div style={styles.brandTitle}>Salon</div>
          <div style={styles.brandSub}>Super Admin</div>
        </div>
      </div>

      <nav style={styles.nav}>
        {NAV.map((group) => (
          <div key={group.section}>
            <div style={styles.sectionLabel}>{group.section}</div>

            {group.items.map((item) => {
              const active = isActive(item.href);
              const Icon = item.icon;

              return (
                <a
                  key={item.href}
                  href={item.href}
                  style={{ textDecoration: "none", width: "100%" }}
                >
                  <div
                    style={{
                      ...styles.navItem,
                      color: active ? "#fff" : "rgba(255,255,255,0.55)",
                      background: active ? "rgba(181,72,75,0.2)" : "transparent",
                      fontWeight: active ? 600 : 400,
                    }}
                    onMouseEnter={(e) => {
                      if (!active) {
                        e.currentTarget.style.background = "rgba(255,255,255,0.05)";
                        e.currentTarget.style.color = "rgba(255,255,255,0.85)";
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!active) {
                        e.currentTarget.style.background = "transparent";
                        e.currentTarget.style.color = "rgba(255,255,255,0.55)";
                      }
                    }}
                  >
                    <span style={styles.iconSlot}>
                      <Icon size={16} style={{ width: "100%", height: "100%" }} />
                    </span>
                    <span style={{ flex: 1, textAlign: "left" }}>{item.label}</span>
                    {active && (
                      <ChevronRight size={13} style={{ color: "rgba(255,255,255,0.4)", flexShrink: 0 }} />
                    )}
                  </div>
                </a>
              );
            })}
          </div>
        ))}
      </nav>

      <div style={styles.footer}>
        <div style={styles.userPill}>
          <div style={styles.userAvatar}>SA</div>
          <div style={{ minWidth: 0, flex: 1 }}>
            <div style={styles.userName}>Super Admin</div>
            <div style={styles.userEmail}>admin@glowdesk.com</div>
          </div>
        </div>

        <a href="/super-admin/logout" style={{ textDecoration: "none", width: "100%" }}>
          <button
            style={styles.logoutBtn}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = "rgba(255,255,255,0.06)";
              e.currentTarget.style.color = "rgba(255,255,255,0.8)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "transparent";
              e.currentTarget.style.color = "rgba(255,255,255,0.4)";
            }}
          >
            <LogOut size={14} style={{ flexShrink: 0 }} />
            <span>Logout</span>
          </button>
        </a>
      </div>
    </aside>
  );
}

/* ── Styles remain the same ── */
const styles: Record<string, React.CSSProperties> = {
  sidebar: {
    width: "252px",
    minHeight: "100vh",
    background: "#111318",
    display: "flex",
    flexDirection: "column",
    position: "fixed",
    top: 0,
    left: 0,
    bottom: 0,
    zIndex: 100,
    fontFamily: "'DM Sans', sans-serif",
    borderRight: "1px solid rgba(255,255,255,0.06)",
    overflowY: "auto",
    overflowX: "hidden",
  },
  glow1: {
    position: "absolute",
    width: 300,
    height: 300,
    borderRadius: "50%",
    background: "radial-gradient(circle, rgba(181,72,75,0.1) 0%, transparent 70%)",
    top: -80,
    left: -80,
    pointerEvents: "none",
  },
  glow2: {
    position: "absolute",
    width: 250,
    height: 250,
    borderRadius: "50%",
    background: "radial-gradient(circle, rgba(107,48,87,0.08) 0%, transparent 70%)",
    bottom: 40,
    right: -60,
    pointerEvents: "none",
  },
  brand: {
    padding: "24px 20px 20px",
    borderBottom: "1px solid rgba(255,255,255,0.06)",
    display: "flex",
    alignItems: "center",
    gap: "12px",
    position: "relative",
  },
  brandIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    background: "linear-gradient(135deg, #b5484b, #6b3057)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: 16,
    flexShrink: 0,
    boxShadow: "0 4px 16px rgba(181,72,75,0.3)",
    color: "#fff",
    fontWeight: 700,
    fontFamily: "'Space Grotesk', sans-serif",
  },
  brandTitle: {
    fontSize: "15px",
    fontWeight: 700,
    color: "#fff",
    fontFamily: "'Space Grotesk', sans-serif",
    letterSpacing: "-0.01em",
    lineHeight: 1.2,
  },
  brandSub: {
    fontSize: "10px",
    color: "rgba(255,255,255,0.35)",
    marginTop: "2px",
    textTransform: "uppercase",
    letterSpacing: "0.08em",
    fontWeight: 500,
  },
  nav: {
    flex: 1,
    padding: "12px 8px",
    display: "flex",
    flexDirection: "column",
    gap: "2px",
    position: "relative",
  },
  sectionLabel: {
    fontSize: "10px",
    fontWeight: 600,
    color: "rgba(255,255,255,0.25)",
    textTransform: "uppercase",
    letterSpacing: "0.1em",
    padding: "16px 12px 6px",
  },
  navItem: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
    padding: "9px 12px",
    borderRadius: 8,
    fontSize: "13px",
    cursor: "pointer",
    border: "none",
    width: "100%",
    transition: "all 0.15s",
    fontFamily: "'DM Sans', sans-serif",
  },
  iconSlot: {
    fontSize: "15px",
    width: "20px",
    textAlign: "center",
    flexShrink: 0,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  footer: {
    padding: "12px 8px 16px",
    borderTop: "1px solid rgba(255,255,255,0.06)",
    position: "relative",
  },
  userPill: {
    display: "flex",
    alignItems: "center",
    gap: 10,
    padding: "10px 12px",
    borderRadius: 8,
    marginBottom: 6,
    background: "rgba(255,255,255,0.03)",
  },
  userAvatar: {
    width: 32,
    height: 32,
    borderRadius: "50%",
    background: "linear-gradient(135deg, #b5484b, #6b3057)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "10.5px",
    fontWeight: 700,
    color: "#fff",
    flexShrink: 0,
  },
  userName: {
    fontSize: 12,
    fontWeight: 600,
    color: "rgba(255,255,255,0.8)",
    whiteSpace: "nowrap",
    overflow: "hidden",
    textOverflow: "ellipsis",
  },
  userEmail: {
    fontSize: 10,
    color: "rgba(255,255,255,0.25)",
    marginTop: 1,
  },
  logoutBtn: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
    padding: "9px 12px",
    borderRadius: 8,
    fontSize: "13px",
    color: "rgba(255,255,255,0.4)",
    background: "transparent",
    border: "none",
    width: "100%",
    cursor: "pointer",
    transition: "all 0.15s",
    fontFamily: "'DM Sans', sans-serif",
  },
};