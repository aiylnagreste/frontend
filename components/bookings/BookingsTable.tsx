// components/bookings/BookingsTable.tsx
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
import { formatDate, formatTime } from "@/lib/utils";
import { BookingDrawer } from "@/components/bookings/BookingDrawer";
import { Pencil, Check, Archive, X, Calendar, Filter } from "lucide-react";

interface Props {
  branchId?: number;
  branchName?: string;
}

export default function BookingsTable({ branchId, branchName }: Props) {
  const [dateFilter, setDateFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [editingBooking, setEditingBooking] = useState<Booking | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const qc = useQueryClient();

  const params: Record<string, string | undefined> = {};
  if (dateFilter) params.date = dateFilter;
  if (statusFilter) params.status = statusFilter;

  const { data: allBookings = [], isLoading } = useQuery<Booking[]>({
    queryKey: QK.bookings(params),
    queryFn: () => fetchBookings(params),
    staleTime: 30_000,
  });

  const bookings = branchName
    ? allBookings.filter((b) => b.branch === branchName)
    : allBookings;

  const active = bookings.filter((b) => b.status !== "archived");

  function invalidate() {
    qc.invalidateQueries({ queryKey: ["bookings"] });
    qc.invalidateQueries({ queryKey: ["stats"] });
    qc.invalidateQueries({ queryKey: ["analytics"] });
  }

  const completeMutation = useMutation({
    mutationFn: (id: number) =>
      api.patch(`/salon-admin/api/bookings/${id}/status`, { status: "completed" }),
    onSuccess: () => { toast.success("Marked as completed"); invalidate(); },
    onError: (e: Error) => toast.error(e.message),
  });

  const archiveMutation = useMutation({
    mutationFn: (id: number) => api.delete(`/salon-admin/api/bookings/${id}`),
    onSuccess: () => { toast.success("Booking archived"); invalidate(); },
    onError: (e: Error) => toast.error(e.message),
  });

  function openEdit(booking: Booking) {
    setEditingBooking(booking);
    setDrawerOpen(true);
  }

  function closeDrawer() {
    setDrawerOpen(false);
    setEditingBooking(null);
  }

  const hasFilters = !!dateFilter || !!statusFilter;

  const grouped = branchName
    ? { [branchName]: active }
    : active.reduce<Record<string, Booking[]>>((acc, b) => {
        (acc[b.branch] ??= []).push(b);
        return acc;
      }, {});

  return (
    <>
      <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
        {/* Filters */}
        <div style={{ display: "flex", gap: "10px", alignItems: "center", flexWrap: "wrap" }}>
          <div style={{ position: "relative" }}>
            <Calendar size={14} color="#9CA3B4" style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)" }} />
            <input
              type="date"
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              style={{
                ...filterInputStyle,
                paddingLeft: "34px",
                paddingRight: "14px",
              }}
              onFocus={(e) => { e.target.style.borderColor = "#b5484b"; e.target.style.boxShadow = "0 0 0 3px rgba(181,72,75,0.1)"; }}
              onBlur={(e) => { e.target.style.borderColor = "#E6E4DF"; e.target.style.boxShadow = "none"; }}
            />
          </div>

          <div style={{ position: "relative" }}>
            <Filter size={14} color="#9CA3B4" style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)" }} />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              style={{
                ...filterInputStyle,
                paddingLeft: "34px",
                paddingRight: "36px",
                cursor: "pointer",
                appearance: "none",
                backgroundImage: `url("data:image/svg+xml,%3Csvg width='10' height='6' viewBox='0 0 10 6' fill='none' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M1 1L5 5L9 1' stroke='%235F6577' stroke-width='1.5' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E")`,
                backgroundRepeat: "no-repeat",
                backgroundPosition: "right 12px center",
              }}
              onFocus={(e) => { e.target.style.borderColor = "#b5484b"; e.target.style.boxShadow = "0 0 0 3px rgba(181,72,75,0.1)"; }}
              onBlur={(e) => { e.target.style.borderColor = "#E6E4DF"; e.target.style.boxShadow = "none"; }}
            >
              <option value="">All Statuses</option>
              <option value="confirmed">Confirmed</option>
              <option value="completed">Completed</option>
              <option value="canceled">Cancelled</option>
              <option value="no_show">Missed</option>
            </select>
          </div>

          {hasFilters && (
            <button
              onClick={() => { setDateFilter(""); setStatusFilter(""); }}
              style={clearBtnStyle}
              onMouseEnter={(e) => { e.currentTarget.style.background = "#F8F8F6"; e.currentTarget.style.borderColor = "#D1D5DB"; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.borderColor = "#E6E4DF"; }}
            >
              <X size={12} />
              Clear
            </button>
          )}

          <div style={{ flex: 1 }} />

          <div style={{
            fontSize: "12px",
            color: "#5F6577",
            fontWeight: 500,
            display: "flex",
            alignItems: "center",
            gap: "6px",
          }}>
            <span style={{
              background: "#F8F8F6",
              border: "1px solid #E6E4DF",
              borderRadius: "6px",
              padding: "3px 10px",
              fontWeight: 600,
              color: "#1A1D23",
              fontFamily: "'Space Grotesk', sans-serif",
            }}>
              {active.length}
            </span>
            booking{active.length !== 1 ? "s" : ""}
          </div>
        </div>

        {/* Table(s) */}
        {isLoading ? (
          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} style={{ height: "52px" }} />
            ))}
          </div>
        ) : active.length === 0 ? (
          <EmptyState
            icon="📋"
            title="No bookings found"
            description={
              hasFilters
                ? "Try clearing your filters to see more results."
                : "No appointments scheduled for this period."
            }
          />
        ) : (
          Object.entries(grouped).map(([branch, rows]) => (
            <div
              key={branch}
              style={{
                background: "#fff",
                border: "1px solid #E6E4DF",
                borderRadius: "10px",
                overflow: "hidden",
                boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
              }}
            >
              {!branchName && (
                <div
                  style={{
                    padding: "10px 20px",
                    background: "linear-gradient(135deg, #b5484b, #6b3057)",
                    color: "#fff",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                  }}
                >
                  <span style={{ fontSize: "13px", fontWeight: 600, fontFamily: "'Space Grotesk', sans-serif" }}>
                    {branch}
                  </span>
                  <span style={{ fontSize: "11px", opacity: 0.8, fontWeight: 500 }}>
                    {rows.length} booking{rows.length !== 1 ? "s" : ""}
                  </span>
                </div>
              )}
              <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px" }}>
                  <thead>
                    <tr>
                      {["Time", "Client", "Service", "Date", "Staff", "Status", "Actions"].map((h) => (
                        <th
                          key={h}
                          style={tableHeaderStyle}
                        >
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
                              : b.status === "canceled"
                              ? "#FFFDF8"
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
                          <div style={{ fontWeight: 600, color: "#1A1D23", fontSize: "13px" }}>{b.customer_name}</div>
                          <div style={{ fontSize: "11px", color: "#9CA3B4", marginTop: "1px" }}>{b.phone}</div>
                        </td>
                        <td style={{ ...cellStyle, maxWidth: "180px" }}>
                          <div style={{ color: "#1A1D23", fontSize: "13px" }}>{b.service}</div>
                        </td>
                        <td style={{ ...cellStyle, whiteSpace: "nowrap" }}>
                          <span style={{ fontSize: "12px", color: "#5F6577" }}>{formatDate(b.date)}</span>
                        </td>
                        <td style={cellStyle}>
                          <span style={{ fontSize: "12px", color: "#5F6577" }}>
                            {b.staff_name || (
                              <span style={{ color: "#D1D5DB" }}>—</span>
                            )}
                          </span>
                        </td>
                        <td style={cellStyle}>
                          <Badge status={b.status} />
                        </td>
                        <td style={cellStyle}>
                          <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
                            {b.status === "confirmed" && (
                              <TableAction
                                icon={<Pencil size={11} strokeWidth={2} />}
                                label="Edit"
                                bg="#EEF2FF"
                                color="#4338CA"
                                hoverBg="#E0E7FF"
                                onClick={() => openEdit(b)}
                              />
                            )}
                            {b.status === "confirmed" && (
                              <TableAction
                                icon={<Check size={11} strokeWidth={2.5} />}
                                label="Done"
                                bg="#DCFCE7"
                                color="#15803D"
                                hoverBg="#BBF7D0"
                                onClick={() => completeMutation.mutate(b.id)}
                                disabled={completeMutation.isPending}
                              />
                            )}
                            <TableAction
                              icon={<Archive size={11} strokeWidth={2} />}
                              label="Archive"
                              bg="#FEF2F2"
                              color="#DC2626"
                              hoverBg="#FEE2E2"
                              onClick={() => archiveMutation.mutate(b.id)}
                              disabled={archiveMutation.isPending}
                            />
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ))
        )}
      </div>

      <BookingDrawer
        open={drawerOpen}
        onClose={closeDrawer}
        editing={editingBooking}
        editMode="limited"
      />
    </>
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

const filterInputStyle: React.CSSProperties = {
  padding: "8px 14px",
  border: "1px solid #E6E4DF",
  borderRadius: "8px",
  fontSize: "13px",
  background: "#fff",
  color: "#1A1D23",
  outline: "none",
  fontFamily: "'DM Sans', sans-serif",
  transition: "border-color 0.2s, box-shadow 0.2s",
  boxSizing: "border-box",
};

const clearBtnStyle: React.CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  gap: "5px",
  padding: "8px 14px",
  border: "1px solid #E6E4DF",
  borderRadius: "8px",
  fontSize: "12px",
  background: "transparent",
  cursor: "pointer",
  color: "#5F6577",
  fontWeight: 500,
  fontFamily: "'DM Sans', sans-serif",
  transition: "all 0.15s",
};

const tableHeaderStyle: React.CSSProperties = {
  padding: "10px 14px",
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
  padding: "12px 14px",
  verticalAlign: "middle",
};