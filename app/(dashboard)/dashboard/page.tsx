// app/dashboard/page.tsx
"use client";

import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  fetchGeneral,
  fetchBranches,
  fetchStaff,
  fetchServices,
  QK,
} from "@/lib/queries";
import type { Branch, Staff, Service } from "@/lib/types";
import TodayBookingsPie from "@/components/dashboard/TodayBookingsPie";
import AllTimeRevenuePie from "@/components/dashboard/AllTimeRevenuePie";
import TodayAppointmentsTable from "@/components/dashboard/TodayAppointmentsTable";
import UpcomingList from "@/components/dashboard/UpcomingList";
import { BookingDrawer } from "@/components/bookings/BookingDrawer";
import { BranchDrawer } from "@/components/settings/BranchDrawer";
import { StaffDrawer } from "@/components/settings/StaffDrawer";
import { ServiceDrawer } from "@/components/services/ServiceDrawer";
import { Plus, MapPin, User, Scissors, AlertTriangle, X } from "lucide-react";

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

const SETUP_ITEMS = {
  branch: { label: "Branch", desc: "Add a branch location for your salon", Icon: MapPin },
  staff: { label: "Staff", desc: "Add at least one staff member", Icon: User },
  services: { label: "Services", desc: "Add services your salon offers", Icon: Scissors },
} as const;

type SetupKey = keyof typeof SETUP_ITEMS;

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

  useEffect(() => {
    if (!branchesLoaded || !staffLoaded || !servicesLoaded) return;
    const t = setTimeout(() => setSetupReady(true), 2000);
    return () => clearTimeout(t);
  }, [branchesLoaded, staffLoaded, servicesLoaded]);

  const missingItems: Array<{
    key: SetupKey;
    label: string;
    desc: string;
    Icon: typeof MapPin;
    onClick: () => void;
  }> = [
    ...(branches.length === 0
      ? [
          {
            key: "branch" as SetupKey,
            ...SETUP_ITEMS.branch,
            onClick: () => setShowBranchDrawer(true),
          },
        ]
      : []),
    ...(staff.length === 0
      ? [
          {
            key: "staff" as SetupKey,
            ...SETUP_ITEMS.staff,
            onClick: () => setShowStaffDrawer(true),
          },
        ]
      : []),
    ...(services.length === 0
      ? [
          {
            key: "services" as SetupKey,
            ...SETUP_ITEMS.services,
            onClick: () => setShowServiceDrawer(true),
          },
        ]
      : []),
  ];

  const showSetupModal =
    setupReady && missingItems.length > 0 && !setupDismissed;

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
          <h2
            style={{
              fontSize: "24px",
              fontWeight: 700,
              margin: 0,
              fontFamily: "'Space Grotesk', sans-serif",
              color: "#1A1D23",
              letterSpacing: "-0.02em",
            }}
          >
            {getGreeting()}
            {ownerName ? `, ${ownerName}` : ""}
          </h2>
          <p
            style={{
              fontSize: "13px",
              color: "#5F6577",
              marginTop: "4px",
            }}
          >
            {getFormattedDate()}
          </p>
        </div>
        <button
          onClick={() => setBookingDrawerOpen(true)}
          style={{
            padding: "9px 18px",
            background: "linear-gradient(135deg, #b5484b, #6b3057)",
            color: "#fff",
            borderRadius: "8px",
            fontSize: "13px",
            fontWeight: 600,
            border: "none",
            cursor: "pointer",
            fontFamily: "'DM Sans', sans-serif",
            display: "flex",
            alignItems: "center",
            gap: "7px",
            transition: "opacity 0.2s",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.opacity = "0.9";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.opacity = "1";
          }}
        >
          <Plus size={14} strokeWidth={2.5} />
          New Appointment
        </button>
      </div>

      {/* Pie charts */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: "16px",
        }}
      >
        <TodayBookingsPie />
        <AllTimeRevenuePie />
      </div>

      {/* Today appointments + upcoming */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 320px",
          gap: "16px",
        }}
      >
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
        <>
          {/* Backdrop */}
          <div
            style={{
              position: "fixed",
              inset: 0,
              background: "rgba(17, 19, 24, 0.6)",
              zIndex: 200,
              backdropFilter: "blur(4px)",
            }}
          />

          {/* Modal */}
          <div
            style={{
              position: "fixed",
              inset: 0,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              zIndex: 201,
              padding: "20px",
            }}
          >
            <div
              style={{
                background: "#fff",
                borderRadius: "16px",
                width: "100%",
                maxWidth: "480px",
                boxShadow: "0 24px 64px rgba(0,0,0,0.25)",
                overflow: "hidden",
                border: "1px solid #E6E4DF",
              }}
            >
              {/* Header */}
              <div
                style={{
                  background: "linear-gradient(135deg, #b5484b 0%, #6b3057 100%)",
                  padding: "28px 28px 24px",
                  color: "#fff",
                  position: "relative",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "12px",
                    }}
                  >
                    <div
                      style={{
                        width: "40px",
                        height: "40px",
                        borderRadius: "10px",
                        background: "rgba(255,255,255,0.15)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      <AlertTriangle size={20} strokeWidth={2} />
                    </div>
                    <div>
                      <h3
                        style={{
                          margin: 0,
                          fontSize: "18px",
                          fontWeight: 700,
                          fontFamily: "'Space Grotesk', sans-serif",
                          letterSpacing: "-0.01em",
                        }}
                      >
                        Setup Incomplete
                      </h3>
                      <p
                        style={{
                          margin: "3px 0 0",
                          fontSize: "12px",
                          opacity: 0.8,
                          lineHeight: 1.5,
                        }}
                      >
                        {missingItems.length} item
                        {missingItems.length > 1 ? "s" : ""} need
                        {missingItems.length > 1 ? "" : "s"} attention
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => setSetupDismissed(true)}
                    style={{
                      background: "rgba(255,255,255,0.15)",
                      border: "none",
                      cursor: "pointer",
                      padding: "6px",
                      borderRadius: "6px",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      color: "#fff",
                      transition: "background 0.15s",
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = "rgba(255,255,255,0.25)";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = "rgba(255,255,255,0.15)";
                    }}
                    aria-label="Dismiss"
                  >
                    <X size={16} strokeWidth={2} />
                  </button>
                </div>
              </div>

              {/* Missing items list */}
              <div
                style={{
                  padding: "24px 28px",
                  display: "flex",
                  flexDirection: "column",
                  gap: "10px",
                }}
              >
                {missingItems.map((item) => {
                  const { Icon } = item;
                  return (
                    <div
                      key={item.key}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "14px",
                        padding: "14px 16px",
                        background: "#FFF8F8",
                        border: "1px solid #FECDD3",
                        borderRadius: "10px",
                        transition: "box-shadow 0.15s",
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.boxShadow =
                          "0 2px 8px rgba(181,72,75,0.08)";
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.boxShadow = "none";
                      }}
                    >
                      <div
                        style={{
                          width: "38px",
                          height: "38px",
                          borderRadius: "8px",
                          background: "linear-gradient(135deg, rgba(181,72,75,0.12), rgba(107,48,87,0.08))",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          flexShrink: 0,
                        }}
                      >
                        <Icon size={16} color="#b5484b" strokeWidth={1.8} />
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <p
                          style={{
                            margin: 0,
                            fontSize: "13px",
                            fontWeight: 600,
                            color: "#1A1D23",
                            fontFamily: "'Space Grotesk', sans-serif",
                          }}
                        >
                          {item.label} missing
                        </p>
                        <p
                          style={{
                            margin: "2px 0 0",
                            fontSize: "12px",
                            color: "#5F6577",
                          }}
                        >
                          {item.desc}
                        </p>
                      </div>
                      <button
                        onClick={item.onClick}
                        style={{
                          padding: "7px 16px",
                          background: "linear-gradient(135deg, #b5484b, #6b3057)",
                          color: "#fff",
                          border: "none",
                          borderRadius: "7px",
                          fontSize: "12px",
                          fontWeight: 600,
                          cursor: "pointer",
                          whiteSpace: "nowrap",
                          flexShrink: 0,
                          fontFamily: "'DM Sans', sans-serif",
                          transition: "opacity 0.15s",
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.opacity = "0.9";
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.opacity = "1";
                        }}
                      >
                        Add {item.label}
                      </button>
                    </div>
                  );
                })}
              </div>

              {/* Footer */}
              <div
                style={{
                  padding: "0 28px 24px",
                  display: "flex",
                  justifyContent: "flex-end",
                }}
              >
                <button
                  onClick={() => setSetupDismissed(true)}
                  style={{
                    padding: "8px 18px",
                    background: "transparent",
                    border: "1px solid #E6E4DF",
                    borderRadius: "8px",
                    fontSize: "13px",
                    color: "#5F6577",
                    cursor: "pointer",
                    fontWeight: 500,
                    fontFamily: "'DM Sans', sans-serif",
                    transition: "all 0.15s",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = "#F8F8F6";
                    e.currentTarget.style.borderColor = "#D1D5DB";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = "transparent";
                    e.currentTarget.style.borderColor = "#E6E4DF";
                  }}
                >
                  Dismiss for now
                </button>
              </div>
            </div>
          </div>
        </>
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