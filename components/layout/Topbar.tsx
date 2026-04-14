"use client";

import { usePathname } from "next/navigation";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { fetchBranches, fetchStaff, fetchServices, QK } from "@/lib/queries";
import type { Branch, Staff, Service } from "@/lib/types";
import { BranchDrawer } from "@/components/settings/BranchDrawer";
import { StaffDrawer } from "@/components/settings/StaffDrawer";
import { ServiceDrawer } from "@/components/services/ServiceDrawer";

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
          {warnings.map((w) => (
            <button
              key={w.label}
              onClick={w.onClick}
              title={`Click to add ${w.label.replace("No ", "").toLowerCase()}`}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "5px",
                background: "#fef3c7",
                color: "#92400e",
                border: "1px solid #fcd34d",
                fontSize: "11px",
                fontWeight: 600,
                padding: "3px 10px",
                borderRadius: "100px",
                cursor: "pointer",
              }}
            >
              <span>⚠</span> {w.label}
            </button>
          ))}

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
            AI Receptionist Active
          </span>
        </div>
      </header>

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
