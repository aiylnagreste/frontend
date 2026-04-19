// app/bookings/[branchId]/page.tsx
"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { fetchBranches, QK } from "@/lib/queries";
import type { Branch } from "@/lib/types";
import CrmAnalyticsBar from "@/components/bookings/CrmAnalyticsBar";
import BookingsTable from "@/components/bookings/BookingsTable";
import { BookingDrawer } from "@/components/bookings/BookingDrawer";
import { Plus, MapPin } from "lucide-react";

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
    <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", gap: "16px" }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "4px" }}>
            <div style={{
              width: "32px",
              height: "32px",
              borderRadius: "8px",
              background: "linear-gradient(135deg, rgba(181,72,75,0.12), rgba(107,48,87,0.08))",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}>
              <MapPin size={16} color="#b5484b" strokeWidth={1.8} />
            </div>
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
              {branch?.name ?? "Branch"}
            </h3>
          </div>
          <p style={{ fontSize: "13px", color: "#5F6577", margin: 0, paddingLeft: "40px" }}>
            Bookings for this location
          </p>
        </div>
        <button
          onClick={() => setBookingDrawerOpen(true)}
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