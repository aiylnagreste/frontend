"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { fetchBranches, QK } from "@/lib/queries";
import type { Branch } from "@/lib/types";
import CrmAnalyticsBar from "@/components/bookings/CrmAnalyticsBar";
import BookingsTable from "@/components/bookings/BookingsTable";
import { BookingDrawer } from "@/components/bookings/BookingDrawer";

export default function BranchBookingsPage() {
  const { branchId } = useParams<{ branchId: string }>();
  const id = Number(branchId);
  const [bookingDrawerOpen, setBookingDrawerOpen] = useState(false);

  const { data: branches = [] } = useQuery<Branch[]>({
    queryKey: QK.branches(),
    queryFn: fetchBranches,
    staleTime: 10 * 60_000,
  });

  const branch = branches.find((b) => b.id === id);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div>
          <h3 style={{ fontSize: "18px", fontWeight: 700, margin: 0 }}>
            {branch?.name ?? "Branch"}
          </h3>
          <span style={{ fontSize: "12px", color: "var(--color-sub)" }}>
            Showing bookings for {branch?.name ?? "this branch"}
          </span>
        </div>
        <button
          onClick={() => setBookingDrawerOpen(true)}
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

      <CrmAnalyticsBar branchId={id} branchName={branch?.name} />
      <BookingsTable branchId={id} branchName={branch?.name} />
      
      <BookingDrawer 
        open={bookingDrawerOpen} 
        onClose={() => setBookingDrawerOpen(false)} 
        editing={null}
        prefillBranch={branch?.name}
      />
    </div>
  );
}