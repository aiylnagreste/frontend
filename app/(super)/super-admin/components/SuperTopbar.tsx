"use client";

import { usePathname } from "next/navigation";
import { Bell, Plus, ChevronRight } from "lucide-react";

const PAGE_META: Record<string, { title: string; crumb: string }> = {
  "/super-admin/dashboard": { title: "Dashboard", crumb: "Overview" },
  "/super-admin/salons": { title: "Salons", crumb: "Manage Salons" },
  "/super-admin/plans": { title: "Plans", crumb: "Subscription Plans" },
  "/super-admin/payments": { title: "Payments", crumb: "Payment History" },
  "/super-admin/change-password": { title: "Change Password", crumb: "Security" },
};

const C = {
  bg: "#F4F3EF",
  surface: "#FFFFFF",
  primary: "#0D9488",
  primaryHover: "#0F766E",
  primaryGlow: "rgba(13,148,136,0.12)",
  text: "#1A1D23",
  text2: "#5F6577",
  text3: "#9CA3B4",
  border: "#E6E4DF",
  border2: "#F0EEEA",
};

export function SuperTopbar() {
  const pathname = usePathname();
  const meta = PAGE_META[pathname] ?? { title: "Super Admin", crumb: "Dashboard" };
  const isDashboard = pathname === "/super-admin/dashboard";

  function handleNewSalon() {
    window.dispatchEvent(new CustomEvent("open-new-salon"));
  }

  return (
    <div style={{
      height: 64,
      marginLeft: 252,
      background: C.surface,
      borderBottom: `1px solid ${C.border2}`,
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      padding: "0 36px",
      position: "sticky",
      top: 0,
      zIndex: 90,
      fontFamily: "'DM Sans', sans-serif",
      /* Very subtle depth */
      boxShadow: "0 1px 2px rgba(26,29,35,0.03)",
    }}>
      {/* Left — Title & Breadcrumb */}
      <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
        <h1 style={{
          fontFamily: "'Space Grotesk', sans-serif",
          fontSize: 18,
          fontWeight: 700,
          color: C.text,
          letterSpacing: "-0.02em",
          lineHeight: 1.2,
        }}>{meta.title}</h1>

        <div style={{
          display: "flex",
          alignItems: "center",
          gap: 4,
          fontSize: 11.5,
          color: C.text3,
        }}>
          <span style={{ color: C.text3 }}>Super Admin</span>
          <ChevronRight size={11} style={{ color: C.border, flexShrink: 0 }} />
          <span style={{ color: C.text2, fontWeight: 500 }}>{meta.crumb}</span>
        </div>
      </div>

      {/* Right — Actions */}
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        {/* Notification bell */}
        <button
          style={{
            width: 38,
            height: 38,
            borderRadius: 10,
            border: `1.5px solid ${C.border}`,
            background: C.surface,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            cursor: "pointer",
            color: C.text2,
            position: "relative",
            transition: "all 0.18s ease",
          }}
          onMouseEnter={e => {
            e.currentTarget.style.background = C.bg;
            e.currentTarget.style.borderColor = C.text3;
            e.currentTarget.style.color = C.text;
          }}
          onMouseLeave={e => {
            e.currentTarget.style.background = C.surface;
            e.currentTarget.style.borderColor = C.border;
            e.currentTarget.style.color = C.text2;
          }}
        >
          <Bell size={16} />
          {/* Unread dot */}
          <span style={{
            position: "absolute",
            top: 7,
            right: 8,
            width: 7,
            height: 7,
            borderRadius: "50%",
            background: "#EF4444",
            border: `1.5px solid ${C.surface}`,
          }} />
        </button>

        {/* New Salon CTA */}
        {isDashboard && (
          <button
            onClick={handleNewSalon}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
              padding: "9px 18px",
              background: `linear-gradient(135deg, ${C.primary} 0%, ${C.primaryHover} 100%)`,
              border: "none",
              borderRadius: 10,
              fontSize: 13,
              fontWeight: 650,
              color: "#fff",
              cursor: "pointer",
              fontFamily: "'DM Sans', sans-serif",
              boxShadow: `0 2px 8px ${C.primaryGlow}`,
              transition: "all 0.18s ease",
            }}
            onMouseEnter={e => {
              e.currentTarget.style.boxShadow = "0 4px 16px rgba(13,148,136,0.25)";
              e.currentTarget.style.transform = "translateY(-1px)";
            }}
            onMouseLeave={e => {
              e.currentTarget.style.boxShadow = `0 2px 8px ${C.primaryGlow}`;
              e.currentTarget.style.transform = "translateY(0)";
            }}
          >
            <Plus size={15} strokeWidth={2.5} />
            New Salon
          </button>
        )}
      </div>
    </div>
  );
}