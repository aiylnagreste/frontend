"use client";

import { usePathname } from "next/navigation";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { fetchBranches, QK } from "@/lib/queries";
import type { Branch } from "@/lib/types";
import { cn } from "@/lib/utils";

const s = {
  sidebar: {
    width: "var(--sidebar-width)",
    minHeight: "100vh",
    background: "#1a1a2e",
    display: "flex" as const,
    flexDirection: "column" as const,
    position: "fixed" as const,
    top: 0,
    left: 0,
    bottom: 0,
    zIndex: 40,
    overflowY: "auto" as const,
  },
  brand: {
    padding: "20px 20px 12px",
    borderBottom: "1px solid rgba(255,255,255,0.08)",
  },
  brandTitle: {
    fontSize: "16px",
    fontWeight: 700,
    color: "#fff",
    display: "flex",
    alignItems: "center",
    gap: "8px",
  },
  brandSub: {
    fontSize: "11px",
    color: "rgba(255,255,255,0.4)",
    marginTop: "2px",
    paddingLeft: "28px",
    textTransform: "uppercase" as const,
    letterSpacing: "0.08em",
  },
  nav: { flex: 1, padding: "12px 8px" },
  sectionLabel: {
    fontSize: "10px",
    fontWeight: 600,
    color: "rgba(255,255,255,0.3)",
    textTransform: "uppercase" as const,
    letterSpacing: "0.1em",
    padding: "12px 12px 4px",
  },
  navItem: (active: boolean) => ({
    display: "flex",
    alignItems: "center",
    gap: "10px",
    padding: "9px 12px",
    borderRadius: "8px",
    fontSize: "13.5px",
    fontWeight: 500,
    cursor: "pointer",
    color: active ? "#fff" : "rgba(255,255,255,0.6)",
    background: active ? "rgba(181,72,75,0.25)" : "transparent",
    border: "none",
    width: "100%",
    textAlign: "left" as const,
    transition: "all 0.15s",
    marginBottom: "1px",
  }),
  subItem: (active: boolean) => ({
    display: "flex",
    alignItems: "center",
    gap: "8px",
    padding: "7px 12px 7px 32px",
    borderRadius: "6px",
    fontSize: "12.5px",
    cursor: "pointer",
    color: active ? "#fff" : "rgba(255,255,255,0.5)",
    background: active ? "rgba(181,72,75,0.2)" : "transparent",
    border: "none",
    width: "100%",
    textAlign: "left" as const,
    transition: "all 0.15s",
    marginBottom: "1px",
  }),
  footer: {
    padding: "12px 8px",
    borderTop: "1px solid rgba(255,255,255,0.08)",
  },
};

interface NavItem {
  label: string;
  icon: string;
  href: string;
}

const MAIN_NAV: NavItem[] = [
  { label: "Dashboard", icon: "⊞", href: "/dashboard" },
 // { label: "Clients", icon: "👥", href: "/clients" },
  { label: "Staff", icon: "💼", href: "/staff" },
];

const CATALOGUE_NAV: NavItem[] = [
  { label: "Packages & Prices", icon: "✨", href: "/packages" },
  { label: "Deals & Offers", icon: "🎁", href: "/deals" },
];

const SYSTEM_NAV: NavItem[] = [
  { label: "Reports", icon: "📊", href: "/reports" },
  { label: "Settings", icon: "⚙️", href: "/settings" },
];

export default function Sidebar() {
  const pathname = usePathname();
  const [bookingsOpen, setBookingsOpen] = useState(
    pathname.startsWith("/bookings"),
  );

  const { data: branches = [] } = useQuery<Branch[]>({
    queryKey: QK.branches(),
    queryFn: fetchBranches,
    staleTime: 10 * 60 * 1000,
  });

  const isActive = (href: string) => pathname === href || pathname.startsWith(href + "/");

  function navigate(href: string) {
    window.location.href = href;
  }

  return (
    <aside style={s.sidebar}>
      {/* Brand */}
      <div style={s.brand}>
        <div style={s.brandTitle}>
          <span>💅</span>
          <span>
            <span style={{ color: "#ec8fa3" }}>Salon</span> Admin
          </span>
        </div>
        <div style={s.brandSub}>Management Portal</div>
      </div>

      {/* Nav */}
      <nav style={s.nav}>
        <div style={s.sectionLabel}>Main</div>

        <button
          style={s.navItem(isActive("/dashboard"))}
          onClick={() => navigate("/dashboard")}
        >
          <span>⊞</span> Dashboard
        </button>

        {/* Bookings with branch sub-menu */}
        <button
          style={s.navItem(isActive("/bookings"))}
          onClick={() => setBookingsOpen((o) => !o)}
        >
          <span>📅</span>
          <span style={{ flex: 1 }}>Bookings</span>
          <span style={{ fontSize: "11px", opacity: 0.5 }}>
            {bookingsOpen ? "▾" : "›"}
          </span>
        </button>

        {bookingsOpen && (
          <div>
            {/* <button
              style={s.subItem(pathname === "/bookings")}
              onClick={() => navigate("/bookings")}
            >
              <span style={{ opacity: 0.4 }}>◈</span> All Branches
            </button> */}
            {branches.map((b) => (
              <button
                key={b.id}
                style={s.subItem(pathname === `/bookings/${b.id}`)}
                onClick={() => navigate(`/bookings/${b.id}`)}
              >
                <span style={{ opacity: 0.4 }}>◈</span> {b.name}
              </button>
            ))}
          </div>
        )}

        {/* <button
          style={s.navItem(isActive("/clients"))}
          onClick={() => navigate("/clients")}
        >
          <span>👥</span> Clients
        </button> */}

        <button
          style={s.navItem(isActive("/staff"))}
          onClick={() => navigate("/staff")}
        >
          <span>💼</span> Staff
        </button>

        <div style={s.sectionLabel}>Catalogue</div>

        {CATALOGUE_NAV.map((item) => (
          <button
            key={item.href}
            style={s.navItem(isActive(item.href))}
            onClick={() => navigate(item.href)}
          >
            <span>{item.icon}</span> {item.label}
          </button>
        ))}

        <div style={s.sectionLabel}>System</div>

        {SYSTEM_NAV.map((item) => (
          <button
            key={item.href}
            style={s.navItem(isActive(item.href))}
            onClick={() => navigate(item.href)}
          >
            <span>{item.icon}</span> {item.label}
          </button>
        ))}
      </nav>

      {/* Footer */}
      <div style={s.footer}>
        <a
          href="/salon-admin/logout"
          style={{
            display: "flex",
            alignItems: "center",
            gap: "10px",
            padding: "9px 12px",
            borderRadius: "8px",
            fontSize: "13px",
            color: "rgba(255,255,255,0.5)",
            textDecoration: "none",
            transition: "all 0.15s",
          }}
        >
          <span>↩</span> Logout
        </a>
      </div>
    </aside>
  );
}
