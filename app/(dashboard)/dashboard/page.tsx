"use client";

import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { fetchGeneral, fetchBranches, fetchStaff, fetchServices, QK } from "@/lib/queries";
import type { Branch, Staff, Service } from "@/lib/types";
import TodayBookingsPie from "@/components/dashboard/TodayBookingsPie";
import AllTimeRevenuePie from "@/components/dashboard/AllTimeRevenuePie";
import TodayAppointmentsTable from "@/components/dashboard/TodayAppointmentsTable";
import UpcomingList from "@/components/dashboard/UpcomingList";
import { BookingDrawer } from "@/components/bookings/BookingDrawer";
import { BranchDrawer } from "@/components/settings/BranchDrawer";
import { StaffDrawer } from "@/components/settings/StaffDrawer";
import { ServiceDrawer } from "@/components/services/ServiceDrawer";

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
  const [showBranchDrawer, setShowBranchDrawer] = useState(false);
  const [showStaffDrawer, setShowStaffDrawer] = useState(false);
  const [showServiceDrawer, setShowServiceDrawer] = useState(false);
  const [setupDismissed, setSetupDismissed] = useState(false);

  const { data: general } = useQuery({
    queryKey: QK.general(),
    queryFn: fetchGeneral,
    staleTime: 10 * 60_000,
  });

  const [setupReady, setSetupReady] = useState(false);

  const { data: branches = [], isSuccess: branchesLoaded } = useQuery<Branch[]>({
    queryKey: QK.branches(),
    queryFn: fetchBranches,
    staleTime: 30_000,
  });

  const { data: staff = [], isSuccess: staffLoaded } = useQuery<Staff[]>({
    queryKey: QK.staff(),
    queryFn: fetchStaff,
    staleTime: 30_000,
  });

  const { data: services = [], isSuccess: servicesLoaded } = useQuery<Service[]>({
    queryKey: QK.services(),
    queryFn: fetchServices,
    staleTime: 30_000,
  });

  // Wait until all 3 queries resolve, then delay 1.2s before showing modal
  useEffect(() => {
    if (!branchesLoaded || !staffLoaded || !servicesLoaded) return;
    const t = setTimeout(() => setSetupReady(true), 1200);
    return () => clearTimeout(t);
  }, [branchesLoaded, staffLoaded, servicesLoaded]);

  const missingItems = [
    ...(branches.length === 0 ? [{ key: "branch", label: "Branch", desc: "Add a branch location for your salon", icon: "🏪", onClick: () => setShowBranchDrawer(true) }] : []),
    ...(staff.length === 0 ? [{ key: "staff", label: "Staff", desc: "Add at least one staff member", icon: "👤", onClick: () => setShowStaffDrawer(true) }] : []),
    ...(services.length === 0 ? [{ key: "services", label: "Services", desc: "Add services your salon offers", icon: "✂️", onClick: () => setShowServiceDrawer(true) }] : []),
  ];

  const showSetupModal = setupReady && missingItems.length > 0 && !setupDismissed;

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

      {/* Setup incomplete modal */}
      {showSetupModal && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.45)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 200,
            padding: "20px",
          }}
        >
          <div
            style={{
              background: "#fff",
              borderRadius: "20px",
              width: "100%",
              maxWidth: "460px",
              boxShadow: "0 24px 60px rgba(0,0,0,0.2)",
              overflow: "hidden",
            }}
          >
            {/* Header */}
            <div
              style={{
                background: "linear-gradient(135deg, #B5484B 0%, #8b2e31 100%)",
                padding: "24px 28px 20px",
                color: "#fff",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "6px" }}>
                <span style={{ fontSize: "22px" }}>⚠️</span>
                <h3 style={{ margin: 0, fontSize: "18px", fontWeight: 700 }}>Setup Incomplete</h3>
              </div>
              <p style={{ margin: 0, fontSize: "13px", opacity: 0.85 }}>
                Your salon is missing required items. The AI bot cannot take bookings until these are set up.
              </p>
            </div>

            {/* Missing items list */}
            <div style={{ padding: "20px 28px", display: "flex", flexDirection: "column", gap: "12px" }}>
              {missingItems.map((item) => (
                <div
                  key={item.key}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "14px",
                    padding: "14px 16px",
                    background: "#fff8f8",
                    border: "1.5px solid #fecaca",
                    borderRadius: "12px",
                  }}
                >
                  <span style={{ fontSize: "22px", flexShrink: 0 }}>{item.icon}</span>
                  <div style={{ flex: 1 }}>
                    <p style={{ margin: 0, fontSize: "14px", fontWeight: 600, color: "#1A1A2E" }}>
                      {item.label} missing
                    </p>
                    <p style={{ margin: "2px 0 0", fontSize: "12px", color: "#6B7280" }}>
                      {item.desc}
                    </p>
                  </div>
                  <button
                    onClick={item.onClick}
                    style={{
                      padding: "7px 16px",
                      background: "#B5484B",
                      color: "#fff",
                      border: "none",
                      borderRadius: "8px",
                      fontSize: "12px",
                      fontWeight: 600,
                      cursor: "pointer",
                      whiteSpace: "nowrap",
                      flexShrink: 0,
                    }}
                  >
                    Add {item.label}
                  </button>
                </div>
              ))}
            </div>

            {/* Footer */}
            <div
              style={{
                padding: "0 28px 20px",
                display: "flex",
                justifyContent: "flex-end",
              }}
            >
              <button
                onClick={() => setSetupDismissed(true)}
                style={{
                  padding: "8px 20px",
                  background: "transparent",
                  border: "1px solid #E8E3E0",
                  borderRadius: "8px",
                  fontSize: "13px",
                  color: "#6B7280",
                  cursor: "pointer",
                  fontWeight: 500,
                }}
              >
                Dismiss for now
              </button>
            </div>
          </div>
        </div>
      )}

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
    </div>
  );
}
