// app/bookings/page.tsx
"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import CrmAnalyticsBar from "@/components/bookings/CrmAnalyticsBar";
import BookingsTable from "@/components/bookings/BookingsTable";
import { BranchDrawer } from "@/components/settings/BranchDrawer";
import { StaffDrawer } from "@/components/settings/StaffDrawer";
import { fetchBranches, fetchStaff, QK } from "@/lib/queries";
import type { Branch, Staff } from "@/lib/types";
import { Plus, MapPin } from "lucide-react";

export default function BookingsPage() {
  const [showBranchDrawer, setShowBranchDrawer] = useState(false);
  const [showStaffDrawer, setShowStaffDrawer] = useState(false);

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

  function handleNewAppointment() {
    if (branches.length === 0) {
      setShowBranchDrawer(true);
    }
  }

  function handleBranchSaved() {
    if (staff.length === 0) {
      setShowStaffDrawer(true);
    }
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", gap: "16px" }}>
        <div>
          <h3
            style={{
              fontSize: "20px",
              fontWeight: 700,
              margin: 0,
              fontFamily: "'Space Grotesk', sans-serif",
              color: "#1A1D23",
              letterSpacing: "-0.02em",
            }}
          >
            All Branches
          </h3>
          <p style={{ fontSize: "13px", color: "#5F6577", margin: "4px 0 0" }}>
            Showing bookings across all locations
          </p>
        </div>
        <button
          onClick={handleNewAppointment}
          style={{
            padding: "9px 18px",
            background: "linear-gradient(135deg, #b5484b, #6b3057)",
            color: "#fff",
            border: "none",
            borderRadius: "8px",
            fontSize: "13px",
            fontWeight: 600,
            cursor: "pointer",
            fontFamily: "'DM Sans', sans-serif",
            display: "flex",
            alignItems: "center",
            gap: "7px",
            transition: "opacity 0.2s",
            whiteSpace: "nowrap",
            flexShrink: 0,
          }}
          onMouseEnter={(e) => { e.currentTarget.style.opacity = "0.9"; }}
          onMouseLeave={(e) => { e.currentTarget.style.opacity = "1"; }}
        >
          <Plus size={14} strokeWidth={2.5} />
          New Appointment
        </button>
      </div>

      {/* Branch pills */}
      {branches.length > 0 && (
        <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
          {branches.map((b) => (
            <div
              key={b.id}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "6px",
                padding: "6px 14px",
                background: "#F8F8F6",
                border: "1px solid #E6E4DF",
                borderRadius: "100px",
                fontSize: "12px",
                color: "#5F6577",
                fontWeight: 500,
              }}
            >
              <MapPin size={11} color="#9CA3B4" strokeWidth={1.8} />
              {b.name}
            </div>
          ))}
        </div>
      )}

      <CrmAnalyticsBar />
      <BookingsTable />

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
    </div>
  );
}