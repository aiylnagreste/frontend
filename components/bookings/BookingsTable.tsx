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

  // Filter client-side by branch if selected
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

  // Group by branch for "All Branches" view
  const grouped = branchName
    ? { [branchName]: active }
    : active.reduce<Record<string, Booking[]>>((acc, b) => {
        (acc[b.branch] ??= []).push(b);
        return acc;
      }, {});

  return (
    <>
      <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
        {/* Filters */}
        <div style={{ display: "flex", gap: "10px", alignItems: "center", flexWrap: "wrap" }}>
          <input
            type="date"
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
            style={{
              padding: "8px 12px",
              border: "1px solid var(--color-border)",
              borderRadius: "8px",
              fontSize: "13px",
              background: "var(--color-surface)",
            }}
          />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            style={{
              padding: "8px 12px",
              border: "1px solid var(--color-border)",
              borderRadius: "8px",
              fontSize: "13px",
              background: "var(--color-surface)",
            }}
          >
            <option value="">All Statuses</option>
            <option value="confirmed">Confirmed</option>
            <option value="completed">Completed</option>
            <option value="canceled">Cancelled</option>
            <option value="no_show">No-Show</option>
          </select>
          {(dateFilter || statusFilter) && (
            <button
              onClick={() => { setDateFilter(""); setStatusFilter(""); }}
              style={{
                padding: "8px 14px",
                border: "1px solid var(--color-border)",
                borderRadius: "8px",
                fontSize: "13px",
                background: "transparent",
                cursor: "pointer",
                color: "var(--color-sub)",
              }}
            >
              Clear
            </button>
          )}
        </div>

        {/* Table(s) */}
        {isLoading ? (
          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            {[1,2,3,4].map(i => <Skeleton key={i} style={{ height: "44px" }} />)}
          </div>
        ) : active.length === 0 ? (
          <EmptyState
            icon="📋"
            title="No bookings found"
            description={dateFilter ? "Try clearing the date filter." : "No bookings match your current filters."}
          />
        ) : (
          Object.entries(grouped).map(([branch, rows]) => (
            <div
              key={branch}
              style={{
                background: "var(--color-surface)",
                border: "1px solid var(--color-border)",
                borderRadius: "var(--radius-md)",
                overflow: "hidden",
              }}
            >
              {!branchName && (
                <div
                  style={{
                    padding: "10px 20px",
                    background: "var(--color-rose)",
                    color: "#fff",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                  }}
                >
                  <span style={{ fontSize: "13px", fontWeight: 600 }}>🏪 {branch}</span>
                  <span style={{ fontSize: "11px", opacity: 0.85 }}>
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
                          style={{
                            padding: "10px 14px",
                            textAlign: "left",
                            fontSize: "11px",
                            fontWeight: 600,
                            color: "var(--color-sub)",
                            textTransform: "uppercase",
                            letterSpacing: "0.04em",
                            background: "#fafafa",
                            borderBottom: "1px solid var(--color-border)",
                            whiteSpace: "nowrap",
                          }}
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
                          borderBottom: "1px solid var(--color-border)",
                          background:
                            b.status === "completed"
                              ? "#f0fdf4"
                              : b.status === "canceled" || b.status === "no_show"
                              ? "#fefce8"
                              : "transparent",
                        }}
                      >
                        <td style={{ padding: "10px 14px", fontFamily: "monospace", fontSize: "12px", whiteSpace: "nowrap" }}>
                          {formatTime(b.time)}{b.endTime ? ` → ${formatTime(b.endTime)}` : ""}
                        </td>
                        <td style={{ padding: "10px 14px", fontWeight: 500 }}>
                          <div>{b.customer_name}</div>
                          <div style={{ fontSize: "11px", color: "var(--color-sub)" }}>{b.phone}</div>
                        </td>
                        <td style={{ padding: "10px 14px", maxWidth: "180px" }}>
                          <div style={{ fontSize: "13px" }}>{b.service}</div>
                        </td>
                        <td style={{ padding: "10px 14px", whiteSpace: "nowrap", fontSize: "12px" }}>
                          {formatDate(b.date)}
                        </td>
                        <td style={{ padding: "10px 14px", fontSize: "12px", color: "var(--color-sub)" }}>
                          {b.staff_name ?? "—"}
                        </td>
                        <td style={{ padding: "10px 14px" }}>
                          <Badge status={b.status} />
                        </td>
                        <td style={{ padding: "10px 14px" }}>
                          <div style={{ display: "flex", gap: "5px", flexWrap: "wrap" }}>
                            {/* Edit button - show for confirmed and pending bookings */}
                            {(b.status === "confirmed" ) && (
                              <ActionBtn
                                label="Edit"
                                color="#e0e7ff"
                                textColor="#4338ca"
                                onClick={() => openEdit(b)}
                              />
                            )}
                            {b.status === "confirmed" && (
                              <ActionBtn
                                label="✓ Done"
                                color="#dbeafe"
                                textColor="#1d4ed8"
                                onClick={() => completeMutation.mutate(b.id)}
                                disabled={completeMutation.isPending}
                              />
                            )}
                            <ActionBtn
                              label="Archive"
                              color="#fee2e2"
                              textColor="#dc2626"
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

      {/* Edit Booking Drawer */}
      <BookingDrawer
        open={drawerOpen}
        onClose={closeDrawer}
        editing={editingBooking}
        editMode="limited"
      />
    </>
  );
}

function ActionBtn({ label, color, textColor, onClick, disabled }: {
  label: string; color: string; textColor: string; onClick: () => void; disabled?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      style={{
        background: color, color: textColor, border: "none", borderRadius: "6px",
        padding: "4px 10px", fontSize: "11px", fontWeight: 600,
        cursor: disabled ? "not-allowed" : "pointer", opacity: disabled ? 0.6 : 1,
        whiteSpace: "nowrap",
      }}
    >
      {label}
    </button>
  );
}