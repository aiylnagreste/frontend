// components/Sidebar.tsx
"use client";

import { usePathname } from "next/navigation";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { fetchBranches, fetchStaff, QK } from "@/lib/queries";
import type { Branch, Staff } from "@/lib/types";
import { BranchDrawer } from "@/components/settings/BranchDrawer";
import { StaffDrawer } from "@/components/settings/StaffDrawer";

export default function Sidebar() {
  const pathname = usePathname();
  const [bookingsOpen, setBookingsOpen] = useState(pathname.startsWith("/bookings"));
  const [showBranchDrawer, setShowBranchDrawer] = useState(false);
  const [showStaffDrawer, setShowStaffDrawer] = useState(false);

  const { data: branches = [] } = useQuery<Branch[]>({
    queryKey: QK.branches(),
    queryFn: fetchBranches,
    staleTime: 10 * 60 * 1000,
  });

  const { data: staff = [] } = useQuery<Staff[]>({
    queryKey: QK.staff(),
    queryFn: fetchStaff,
    staleTime: 10 * 60 * 1000,
  });

  const isActive = (href: string) => pathname === href || pathname.startsWith(href + "/");

  function navigate(href: string) {
    window.location.href = href;
  }

  function handleBookingsClick() {
    if (branches.length === 0) {
      setShowBranchDrawer(true);
    } else {
      setBookingsOpen((o) => !o);
    }
  }

  function handleBranchSaved() {
    if (staff.length === 0) {
      setShowStaffDrawer(true);
    }
  }

  return (
    <aside style={styles.sidebar}>
      {/* Background glow */}
      <div style={styles.glow1} />
      <div style={styles.glow2} />

      {/* Brand */}
      <div style={styles.brand}>
        <div style={styles.brandIcon}>
          ✨
        </div>
        <div>
          <div style={styles.brandTitle}>
            <span style={{ color: "#ec8fa3" }}>Salon</span> Admin
          </div>
          <div style={styles.brandSub}>Management Portal</div>
        </div>
      </div>

      {/* Navigation */}
      <nav style={styles.nav}>
        <div style={styles.sectionLabel}>Main</div>

        <NavItem
          icon="⊞"
          label="Dashboard"
          active={isActive("/dashboard")}
          onClick={() => navigate("/dashboard")}
        />

        {/* Bookings with sub-menu */}
        <div>
          <NavItem
            icon="📅"
            label="Bookings"
            active={isActive("/bookings")}
            onClick={handleBookingsClick}
            suffix={
              <span style={{ fontSize: "10px", opacity: 0.4, transition: "transform 0.2s", transform: bookingsOpen ? "rotate(0deg)" : "rotate(-90deg)" }}>
                ▾
              </span>
            }
          />

          {bookingsOpen && (
            <div style={{ overflow: "hidden" }}>
              {branches.map((b) => (
                <SubItem
                  key={b.id}
                  label={b.name}
                  active={pathname === `/bookings/${b.id}`}
                  onClick={() => navigate(`/bookings/${b.id}`)}
                />
              ))}
            </div>
          )}
        </div>

        <NavItem
          icon="💼"
          label="Staff"
          active={isActive("/staff")}
          onClick={() => navigate("/staff")}
        />

        <div style={styles.sectionLabel}>Catalogue</div>

        <NavItem
          icon="✨"
          label="Packages & Prices"
          active={isActive("/packages")}
          onClick={() => navigate("/packages")}
        />
        <NavItem
          icon="🎁"
          label="Deals & Offers"
          active={isActive("/deals")}
          onClick={() => navigate("/deals")}
        />

        <div style={styles.sectionLabel}>System</div>

        <NavItem
          icon="📊"
          label="Reports"
          active={isActive("/reports")}
          onClick={() => navigate("/reports")}
        />
        <NavItem
          icon="⚙️"
          label="Settings"
          active={isActive("/settings")}
          onClick={() => navigate("/settings")}
        />
      </nav>

      {/* Setup Drawers */}
      <BranchDrawer
        open={showBranchDrawer}
        onClose={() => setShowBranchDrawer(false)}
        editing={null}
        onSaved={handleBranchSaved}
      />
      <StaffDrawer
        open={showStaffDrawer}
        onClose={() => setShowStaffDrawer(false)}
        editing={null}
      />

      {/* Footer */}
      <div style={styles.footer}>
        <button
          onClick={async () => {
            await fetch("/salon-admin/logout", { credentials: "include" }).catch(() => {});
            window.location.href = "/login";
          }}
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
          <span style={{ fontSize: "14px" }}>↩</span>
          <span>Logout</span>
        </button>
      </div>
    </aside>
  );
}

/* ── NavItem ── */
function NavItem({
  icon,
  label,
  active,
  onClick,
  suffix,
}: {
  icon: string;
  label: string;
  active: boolean;
  onClick: () => void;
  suffix?: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
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
      <span style={{ fontSize: "15px", width: "20px", textAlign: "center", flexShrink: 0 }}>{icon}</span>
      <span style={{ flex: 1, textAlign: "left" }}>{label}</span>
      {suffix}
    </button>
  );
}

/* ── SubItem ── */
function SubItem({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      style={{
        ...styles.subItem,
        color: active ? "#fff" : "rgba(255,255,255,0.4)",
        background: active ? "rgba(181,72,75,0.15)" : "transparent",
        fontWeight: active ? 500 : 400,
      }}
      onMouseEnter={(e) => {
        if (!active) {
          e.currentTarget.style.background = "rgba(255,255,255,0.04)";
          e.currentTarget.style.color = "rgba(255,255,255,0.7)";
        }
      }}
      onMouseLeave={(e) => {
        if (!active) {
          e.currentTarget.style.background = "transparent";
          e.currentTarget.style.color = "rgba(255,255,255,0.4)";
        }
      }}
    >
      <span style={{ fontSize: "15px", opacity: 0.35, width: "20px", textAlign: "center", flexShrink: 0 }}>◈</span>
      <span style={{ textAlign: "left" }}>{label}</span>
    </button>
  );
}

/* ── Styles ── */
const styles: Record<string, React.CSSProperties> = {
  sidebar: {
    width: "var(--sidebar-width)",
    minHeight: "100vh",
    background: "#111318",
    display: "flex",
    flexDirection: "column",
    position: "fixed",
    top: 0,
    left: 0,
    bottom: 0,
    zIndex: 40,
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
    borderRadius: "8px",
    fontSize: "13px",
    cursor: "pointer",
    border: "none",
    width: "100%",
    transition: "all 0.15s",
    fontFamily: "'DM Sans', sans-serif",
  },
  subItem: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    padding: "7px 12px 7px 28px",
    borderRadius: "6px",
    fontSize: "12px",
    cursor: "pointer",
    border: "none",
    width: "100%",
    transition: "all 0.15s",
    fontFamily: "'DM Sans', sans-serif",
  },
  footer: {
    padding: "12px 8px 16px",
    borderTop: "1px solid rgba(255,255,255,0.06)",
    position: "relative",
  },
  logoutBtn: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
    padding: "9px 12px",
    borderRadius: "8px",
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