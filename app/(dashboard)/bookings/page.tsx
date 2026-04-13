"use client";

import CrmAnalyticsBar from "@/components/bookings/CrmAnalyticsBar";
import BookingsTable from "@/components/bookings/BookingsTable";

export default function BookingsPage() {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div>
          <h3 style={{ fontSize: "18px", fontWeight: 700, margin: 0 }}>All Branches</h3>
          <span style={{ fontSize: "12px", color: "var(--color-sub)" }}>Showing all bookings</span>
        </div>
        <button
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
    </div>
  );
}
