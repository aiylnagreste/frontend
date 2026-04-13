"use client";

import { usePathname } from "next/navigation";

const PAGE_TITLES: Record<string, string> = {
  "/dashboard": "Dashboard",
  "/bookings": "Bookings",
  "/clients": "Clients",
  "/staff": "Staff",
  "/packages": "Packages & Prices",
  "/deals": "Deals & Offers",
  "/reports": "Reports",
  "/settings": "Settings",
};

export default function Topbar() {
  const pathname = usePathname();

  const title =
    Object.entries(PAGE_TITLES).find(([k]) => pathname === k || pathname.startsWith(k + "/"))?.[1] ??
    "Dashboard";

  return (
    <header
      style={{
        height: "var(--topbar-height)",
        background: "var(--color-surface)",
        borderBottom: "1px solid var(--color-border)",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "0 28px",
        position: "sticky",
        top: 0,
        zIndex: 30,
      }}
    >
      <h2
        style={{
          fontSize: "16px",
          fontWeight: 600,
          color: "var(--color-ink)",
          margin: 0,
        }}
      >
        {title}
      </h2>

      <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
        <span
          style={{
            background: "#dcfce7",
            color: "#16a34a",
            fontSize: "11px",
            fontWeight: 600,
            padding: "3px 10px",
            borderRadius: "100px",
          }}
        >
          Live
        </span>
        <span
          style={{
            background: "#1a1a2e",
            color: "#fff",
            fontSize: "11px",
            fontWeight: 500,
            padding: "4px 12px",
            borderRadius: "100px",
          }}
        >
          🤖 AI Receptionist Active
        </span>
      </div>
    </header>
  );
}
