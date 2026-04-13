"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { fetchGeneral, QK } from "@/lib/queries";
import TodayBookingsPie from "@/components/dashboard/TodayBookingsPie";
import AllTimeRevenuePie from "@/components/dashboard/AllTimeRevenuePie";
import KpiCards from "@/components/dashboard/KpiCards";
import TodayAppointmentsTable from "@/components/dashboard/TodayAppointmentsTable";
import UpcomingList from "@/components/dashboard/UpcomingList";

import { BookingDrawer } from "@/components/bookings/BookingDrawer";




function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
}

function getFormattedDate() {
  return new Date().toLocaleDateString("en-GB", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

export default function DashboardPage() {
    const [bookingDrawerOpen, setBookingDrawerOpen] = useState(false);
  const { data: general } = useQuery({
    queryKey: QK.general(),
    queryFn: fetchGeneral,
    staleTime: 10 * 60_000,
  });

  const ownerName = general?.owner_name;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
      {/* Greeting */}
      <div
        style={{
          display: "flex",
          alignItems: "flex-end",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: "12px",
        }}
      >
        <div>
          <h2 style={{ fontSize: "24px", fontWeight: 700, margin: 0 }}>
            {getGreeting()}{ownerName ? `, ${ownerName.toUpperCase()}` : ""}
          </h2>
          <p style={{ fontSize: "13px", color: "var(--color-sub)", marginTop: "2px" }}>
            {getFormattedDate()}
          </p>
        </div>
        <button
          onClick={() => setBookingDrawerOpen(true)}
          style={{
            padding: "9px 18px",
            background: "var(--color-rose)",
            color: "#fff",
            borderRadius: "8px",
            fontSize: "13px",
            fontWeight: 600,
            border: "none",
            cursor: "pointer",
          }}
        >
          + New Appointment
        </button>
      </div>

      {/* Pie charts */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px" }}>
        <TodayBookingsPie />
        <AllTimeRevenuePie />
      </div>

      {/* KPI stat cards 
      <KpiCards />
*/}
      {/* Today appointments + upcoming */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 320px", gap: "20px" }}>
        <TodayAppointmentsTable />
        <UpcomingList />
      </div>
       <BookingDrawer 
        open={bookingDrawerOpen} 
        onClose={() => setBookingDrawerOpen(false)} 
        editing={null} 
      />
    </div>
  );
}
