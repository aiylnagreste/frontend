"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import CrmAnalyticsBar from "@/components/bookings/CrmAnalyticsBar";
import BookingsTable from "@/components/bookings/BookingsTable";
import { BranchDrawer } from "@/components/settings/BranchDrawer";
import { StaffDrawer } from "@/components/settings/StaffDrawer";
import { fetchBranches, fetchStaff, QK } from "@/lib/queries";
import type { Branch, Staff } from "@/lib/types";

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
    // If branches exist, user navigates to a branch-specific page to book
  }

  function handleBranchSaved() {
    if (staff.length === 0) {
      setShowStaffDrawer(true);
    }
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div>
          <h3 style={{ fontSize: "18px", fontWeight: 700, margin: 0 }}>All Branches</h3>
          <span style={{ fontSize: "12px", color: "var(--color-sub)" }}>Showing all bookings</span>
        </div>
        <button
          onClick={handleNewAppointment}
          style={{
            padding: "9px 18px",
            background: "var(--color-rose)",
            color: "#fff",
            border: "none",
            borderRadius: "8px",
            fontSize: "13px",
            fontWeight: 600,
            cursor: "pointer",
          }}
        >
          + New Appointment
        </button>
      </div>

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
