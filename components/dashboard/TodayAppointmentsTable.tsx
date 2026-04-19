// components/dashboard/TodayAppointmentsTable.tsx
"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { fetchBookings, QK } from "@/lib/queries";
import type { Booking } from "@/lib/types";
import { Badge } from "@/components/ui/Badge";
import { Skeleton } from "@/components/ui/Skeleton";
import { EmptyState } from "@/components/ui/EmptyState";
import { api } from "@/lib/api";
import { toast } from "sonner";
import { formatTime } from "@/lib/utils";
import { CalendarCheck, UserX, Archive, Check, UserMinus } from "lucide-react";

function getTodayStr() {
  return new Date().toISOString().slice(0, 10);
}

export default function TodayAppointmentsTable() {
  const today = getTodayStr();
  const qc = useQueryClient();

  const { data: bookings = [], isLoading } = useQuery<Booking[]>({
    queryKey: QK.bookings({ date: today }),
    queryFn: () => fetchBookings({ date: today }),
    staleTime: 0,
    refetchInterval: 30_000,
  });

  function invalidateAfterMutation() {
    qc.invalidateQueries({ queryKey: ["bookings"] });
    qc.invalidateQueries({ queryKey: ["stats"] });
    qc.invalidateQueries({ queryKey: ["analytics"] });
  }

  const completeMutation = useMutation({
    mutationFn: (id: number) =>
      api.patch(`/salon-admin/api/bookings/${id}/status`, { status: "completed" }),
    onSuccess: () => {
      toast.success("Booking marked as completed");
      invalidateAfterMutation();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const noShowMutation = useMutation({
    mutationFn: (id: number) =>
      api.patch(`/salon-admin/api/bookings/${id}/status`, { status: "no_show" }),
    onSuccess: () => {
      toast.success("Marked as no-show");
      invalidateAfterMutation();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const archiveMutation = useMutation({
    mutationFn: (id: number) =>
      api.delete(`/salon-admin/api/bookings/${id}`),
    onSuccess: () => {
      toast.success("Booking archived");
      invalidateAfterMutation();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const byBranch = bookings
    .filter((b) => b.status !== "archived")
    .reduce<Record<string, Booking[]>>((acc, b) => {
      (acc[b.branch] ??= []).push(b);
      return acc;
    }, {});

  const branchEntries = Object.entries(byBranch);

  return (
    <div style={{
      background: "#fff",
      border: "1px solid #E6E4DF",
      borderRadius: "10px",
      boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
      overflow: "hidden",
    }}>
      <div style={{
        padding: "16px 20px",
        borderBottom: "1px solid #E6E4DF",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <div style={{
            width: "32px",
            height: "32px",
            borderRadius: "8px",
            background: "linear-gradient(135deg, rgba(181,72,75,0.12), rgba(107,48,87,0.08))",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}>
            <CalendarCheck size={16} color="#b5484b" strokeWidth={2} />
          </div>
          <div>
            <h3 style={{
              fontSize: "14px",
              fontWeight: 700,
              margin: 0,
              fontFamily: "'Space Grotesk', sans-serif",
              color: "#1A1D23",
              letterSpacing: "-0.01em",
            }}>
              Today&apos;s Appointments
            </h3>
            <span style={{ fontSize: "11px", color: "#9CA3B4" }}>
              {bookings.filter(b => b.status !== "archived").length} scheduled
            </span>
          </div>
        </div>
      </div>

      {isLoading ? (
        <div style={{ padding: "20px", display: "flex", flexDirection: "column", gap: "8px" }}>
          {[1, 2, 3].map((i) => <Skeleton key={i} style={{ height: "48px" }} />)}
        </div>
      ) : branchEntries.length === 0 ? (
        <EmptyState
          icon="📅"
          title="No appointments today"
          description="Today's bookings will appear here as they are confirmed."
        />
      ) : (
        branchEntries.map(([branch, rows]) => (
          <div key={branch}>
            <div style={{
              padding: "8px 20px",
              background: "#F8F8F6",
              borderTop: "1px solid #E6E4DF",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
            }}>
              <span style={{
                fontSize: "12px",
                fontWeight: 600,
                color: "#b5484b",
                fontFamily: "'Space Grotesk', sans-serif",
              }}>
                {branch}
              </span>
              <span style={{
                fontSize: "11px",
                color: "#9CA3B4",
                fontWeight: 500,
              }}>
                {rows.length} booking{rows.length !== 1 ? "s" : ""}
              </span>
            </div>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px" }}>
              <thead>
                <tr>
                  {["Client", "Service", "Time", "Status", "Actions"].map((h) => (
                    <th key={h} style={tableHeaderStyle}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.map((b) => (
                  <tr
                    key={b.id}
                    style={{
                      borderBottom: "1px solid #F0EEED",
                      background:
                        b.status === "completed"
                          ? "#F8FDF8"
                          : b.status === "no_show"
                          ? "#FFF8F8"
                          : "transparent",
                      transition: "background 0.15s",
                    }}
                    onMouseEnter={(e) => {
                      if (b.status === "confirmed") {
                        e.currentTarget.style.background = "#FDFCFC";
                      }
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = "transparent";
                    }}
                  >
                    <td style={cellStyle}>
                      <div style={{ fontWeight: 600, color: "#1A1D23", fontSize: "13px" }}>
                        {b.customer_name}
                      </div>
                      <div style={{ fontSize: "11px", color: "#9CA3B4", marginTop: "1px" }}>
                        {b.phone || "—"}
                      </div>
                    </td>
                    <td style={{ ...cellStyle, color: "#5F6577", fontSize: "13px" }}>
                      {b.service}
                    </td>
                    <td style={cellStyle}>
                      <span style={{
                        fontFamily: "'Space Grotesk', monospace",
                        fontSize: "12px",
                        fontWeight: 600,
                        color: "#1A1D23",
                        background: "#F8F8F6",
                        padding: "3px 8px",
                        borderRadius: "5px",
                        whiteSpace: "nowrap",
                      }}>
                        {formatTime(b.time)}
                      </span>
                      {b.endTime && (
                        <span style={{
                          fontFamily: "'Space Grotesk', monospace",
                          fontSize: "11px",
                          color: "#9CA3B4",
                          marginLeft: "4px",
                        }}>
                          → {formatTime(b.endTime)}
                        </span>
                      )}
                    </td>
                    <td style={cellStyle}>
                      <Badge status={b.status} />
                    </td>
                    <td style={cellStyle}>
                      <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
                        {b.status === "confirmed" && (
                          <>
                            <TableAction
                              icon={<Check size={11} strokeWidth={2.5} />}
                              label="Done"
                              bg="#DCFCE7"
                              color="#15803D"
                              hoverBg="#BBF7D0"
                              onClick={() => completeMutation.mutate(b.id)}
                              disabled={completeMutation.isPending}
                            />
                            <TableAction
                              icon={<UserMinus size={11} strokeWidth={2} />}
                              label="No-Show"
                              bg="#FEF3C7"
                              color="#92400E"
                              hoverBg="#FDE68A"
                              onClick={() => noShowMutation.mutate(b.id)}
                              disabled={noShowMutation.isPending}
                            />
                          </>
                        )}
                        {(b.status === "confirmed" || b.status === "completed") && (
                          <TableAction
                            icon={<Archive size={11} strokeWidth={2} />}
                            label="Archive"
                            bg="#FEF2F2"
                            color="#DC2626"
                            hoverBg="#FEE2E2"
                            onClick={() => archiveMutation.mutate(b.id)}
                            disabled={archiveMutation.isPending}
                          />
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ))
      )}
    </div>
  );
}

function TableAction({
  icon,
  label,
  bg,
  color,
  hoverBg,
  onClick,
  disabled,
}: {
  icon: React.ReactNode;
  label: string;
  bg: string;
  color: string;
  hoverBg: string;
  onClick: () => void;
  disabled?: boolean;
}) {
  const [hovered, setHovered] = useState(false);
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: "4px",
        background: disabled ? bg : hovered ? hoverBg : bg,
        color: color,
        border: "none",
        borderRadius: "6px",
        padding: "5px 10px",
        fontSize: "11px",
        fontWeight: 600,
        cursor: disabled ? "not-allowed" : "pointer",
        opacity: disabled ? 0.5 : 1,
        whiteSpace: "nowrap",
        fontFamily: "'DM Sans', sans-serif",
        transition: "background 0.15s",
      }}
    >
      {icon}
      {label}
    </button>
  );
}

const tableHeaderStyle: React.CSSProperties = {
  padding: "10px 16px",
  textAlign: "left",
  fontSize: "11px",
  fontWeight: 600,
  color: "#5F6577",
  textTransform: "uppercase",
  letterSpacing: "0.05em",
  background: "#F8F8F6",
  borderBottom: "1px solid #E6E4DF",
  whiteSpace: "nowrap",
  fontFamily: "'DM Sans', sans-serif",
};

const cellStyle: React.CSSProperties = {
  padding: "12px 16px",
  verticalAlign: "middle",
};