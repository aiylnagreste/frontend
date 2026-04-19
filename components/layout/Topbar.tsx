"use client";

import { usePathname } from "next/navigation";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { fetchBranches, fetchStaff, fetchServices, QK } from "@/lib/queries";
import type { Branch, Staff, Service } from "@/lib/types";
import { BranchDrawer } from "@/components/settings/BranchDrawer";
import { StaffDrawer } from "@/components/settings/StaffDrawer";
import { ServiceDrawer } from "@/components/services/ServiceDrawer";
import { AlertTriangle, Bot } from "lucide-react";

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
  const [showBranchDrawer, setShowBranchDrawer] = useState(false);
  const [showStaffDrawer, setShowStaffDrawer] = useState(false);
  const [showServiceDrawer, setShowServiceDrawer] = useState(false);

  const { data: branches = [] } = useQuery<Branch[]>({
    queryKey: QK.branches(),
    queryFn: fetchBranches,
    staleTime: 10 * 60_000,
  });

  const { data: staff = [] } = useQuery<Staff[]>({
    queryKey: QK.staff(),
    queryFn: fetchStaff,
    staleTime: 10 * 60_000,
  });

  const { data: services = [] } = useQuery<Service[]>({
    queryKey: QK.services(),
    queryFn: fetchServices,
    staleTime: 10 * 60_000,
  });

  const title =
    Object.entries(PAGE_TITLES).find(([k]) => pathname === k || pathname.startsWith(k + "/"))?.[1] ??
    "Dashboard";

  const warnings: { label: string; onClick: () => void }[] = [
    ...(branches.length === 0 ? [{ label: "No Branch", onClick: () => setShowBranchDrawer(true) }] : []),
    ...(staff.length === 0 ? [{ label: "No Staff", onClick: () => setShowStaffDrawer(true) }] : []),
    ...(services.length === 0 ? [{ label: "No Services", onClick: () => setShowServiceDrawer(true) }] : []),
  ];

  return (
    <>
      <header style={styles.header}>
        <h2 style={styles.title}>{title}</h2>

        <div style={styles.actions}>
          {warnings.map((w) => (
            <button
              key={w.label}
              onClick={w.onClick}
              title={`Click to add ${w.label.replace("No ", "").toLowerCase()}`}
              style={styles.warningBtn}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = "#FFE4E6";
                e.currentTarget.style.borderColor = "#FDA4AF";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = "#FFF1F2";
                e.currentTarget.style.borderColor = "#FECDD3";
              }}
            >
              <AlertTriangle size={12} strokeWidth={2.5} />
              <span>{w.label}</span>
            </button>
          ))}

          <div style={styles.livePill}>
            <span style={styles.liveDot} />
            <span>Live</span>
          </div>

          <div style={styles.aiPill}>
            <Bot size={12} strokeWidth={2} />
            <span>AI Active</span>
          </div>
        </div>
      </header>

      <style>{`
        @keyframes pulse-live {
          0%, 100% { box-shadow: 0 0 0 0 rgba(34, 197, 94, 0.4); }
          50% { box-shadow: 0 0 0 4px rgba(34, 197, 94, 0); }
        }
      `}</style>

      <BranchDrawer
        open={showBranchDrawer}
        onClose={() => setShowBranchDrawer(false)}
        editing={null}
      />
      <StaffDrawer
        open={showStaffDrawer}
        onClose={() => setShowStaffDrawer(false)}
        editing={null}
      />
      <ServiceDrawer
        open={showServiceDrawer}
        onClose={() => setShowServiceDrawer(false)}
        editing={null}
      />
    </>
  );
}

const styles: Record<string, React.CSSProperties> = {
  header: {
    height: "var(--topbar-height)",
    background: "#fff",
    borderBottom: "1px solid #E6E4DF",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "0 28px",
    position: "sticky",
    top: 0,
    zIndex: 30,
  },
  title: {
    fontSize: "16px",
    fontWeight: 700,
    color: "#1A1D23",
    margin: 0,
    fontFamily: "'Space Grotesk', sans-serif",
    letterSpacing: "-0.01em",
  },
  actions: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
  },
  warningBtn: {
    display: "inline-flex",
    alignItems: "center",
    gap: "5px",
    background: "#FFF1F2",
    color: "#E11D48",
    border: "1px solid #FECDD3",
    fontSize: "11px",
    fontWeight: 600,
    padding: "4px 12px",
    borderRadius: "100px",
    cursor: "pointer",
    fontFamily: "'DM Sans', sans-serif",
    transition: "all 0.15s",
    lineHeight: 1,
  },
  livePill: {
    display: "inline-flex",
    alignItems: "center",
    gap: "6px",
    background: "#F0FDF4",
    color: "#15803d",
    fontSize: "11px",
    fontWeight: 600,
    padding: "4px 12px",
    borderRadius: "100px",
    fontFamily: "'DM Sans', sans-serif",
    lineHeight: 1,
  },
  liveDot: {
    width: 6,
    height: 6,
    borderRadius: "50%",
    background: "#22c55e",
    animation: "pulse-live 2s ease-in-out infinite",
  },
  aiPill: {
    display: "inline-flex",
    alignItems: "center",
    gap: "6px",
    background: "#111318",
    color: "rgba(255,255,255,0.9)",
    fontSize: "11px",
    fontWeight: 500,
    padding: "5px 14px",
    borderRadius: "100px",
    fontFamily: "'DM Sans', sans-serif",
    lineHeight: 1,
  },
};