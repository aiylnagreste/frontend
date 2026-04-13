"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { fetchBookings, QK } from "@/lib/queries";
import type { Booking } from "@/lib/types";
import { Badge } from "@/components/ui/Badge";
import { Skeleton } from "@/components/ui/Skeleton";
import { EmptyState } from "@/components/ui/EmptyState";
import { api } from "@/lib/api";
import { toast } from "sonner";
import { formatTime } from "@/lib/utils";

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

  // Group by branch
  const byBranch = bookings
    .filter((b) => b.status !== "archived")
    .reduce<Record<string, Booking[]>>((acc, b) => {
      (acc[b.branch] ??= []).push(b);
      return acc;
    }, {});

  const branchEntries = Object.entries(byBranch);

  return (
    <div
      style={{
        background: "var(--color-surface)",
        border: "1px solid var(--color-border)",
        borderRadius: "var(--radius-md)",
        boxShadow: "var(--shadow-sm)",
      }}
    >
      <div
        style={{
          padding: "16px 20px",
          borderBottom: "1px solid var(--color-border)",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <h3 style={{ fontSize: "14px", fontWeight: 600, margin: 0 }}>
          Today's Appointments
        </h3>
      </div>

      {isLoading ? (
        <div style={{ padding: "20px", display: "flex", flexDirection: "column", gap: "8px" }}>
          {[1, 2, 3].map((i) => <Skeleton key={i} style={{ height: "40px" }} />)}
        </div>
      ) : branchEntries.length === 0 ? (
        <EmptyState
          icon="📅"
          title="No appointments today"
          description="Today's bookings will appear here."
        />
      ) : (
        branchEntries.map(([branch, rows]) => (
          <div key={branch}>
            <div
              style={{
                padding: "8px 20px",
                background: "#f8f7f6",
                borderTop: "1px solid var(--color-border)",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
              }}
            >
              <span style={{ fontSize: "12px", fontWeight: 600, color: "var(--color-rose)" }}>
                🏪 {branch}
              </span>
              <span style={{ fontSize: "11px", color: "var(--color-sub)" }}>
                {rows.length} booking{rows.length !== 1 ? "s" : ""}
              </span>
            </div>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px" }}>
              <thead>
                <tr>
                  {["Client", "Service", "Time", "Status", "Actions"].map((h) => (
                    <th
                      key={h}
                      style={{
                        padding: "10px 16px",
                        textAlign: "left",
                        fontSize: "11px",
                        fontWeight: 600,
                        color: "var(--color-sub)",
                        textTransform: "uppercase",
                        letterSpacing: "0.04em",
                        background: "#fafafa",
                        borderBottom: "1px solid var(--color-border)",
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
                      background: b.status === "completed" ? "#f0fdf4" : "transparent",
                    }}
                  >
                    <td style={{ padding: "10px 16px", fontWeight: 500 }}>
                      {b.customer_name}
                    </td>
                    <td style={{ padding: "10px 16px", color: "var(--color-sub)" }}>
                      {b.service}
                    </td>
                    <td style={{ padding: "10px 16px", fontFamily: "monospace", fontSize: "12px" }}>
                      {formatTime(b.time)}
                      {b.endTime ? ` → ${formatTime(b.endTime)}` : ""}
                    </td>
                    <td style={{ padding: "10px 16px" }}>
                      <Badge status={b.status} />
                    </td>
                    <td style={{ padding: "10px 16px" }}>
                      <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
                        {b.status === "confirmed" && (
                          <>
                            <ActionBtn
                              label="✓ Done"
                              color="#dbeafe"
                              textColor="#1d4ed8"
                              onClick={() => completeMutation.mutate(b.id)}
                              disabled={completeMutation.isPending}
                            />
                            <ActionBtn
                              label="No-Show"
                              color="#fef3c7"
                              textColor="#d97706"
                              onClick={() => noShowMutation.mutate(b.id)}
                              disabled={noShowMutation.isPending}
                            />
                          </>
                        )}
                        {(b.status === "confirmed" || b.status === "completed") && (
                          <ActionBtn
                            label="Archive"
                            color="#fee2e2"
                            textColor="#dc2626"
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

function ActionBtn({
  label,
  color,
  textColor,
  onClick,
  disabled,
}: {
  label: string;
  color: string;
  textColor: string;
  onClick: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      style={{
        background: color,
        color: textColor,
        border: "none",
        borderRadius: "6px",
        padding: "4px 10px",
        fontSize: "11px",
        fontWeight: 600,
        cursor: disabled ? "not-allowed" : "pointer",
        opacity: disabled ? 0.6 : 1,
        whiteSpace: "nowrap",
      }}
    >
      {label}
    </button>
  );
}
