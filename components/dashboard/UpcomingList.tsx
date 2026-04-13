"use client";

import { useQuery } from "@tanstack/react-query";
import { fetchBookings, QK } from "@/lib/queries";
import type { Booking } from "@/lib/types";
import { Card, CardHeader, CardContent } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Skeleton } from "@/components/ui/Skeleton";
import { EmptyState } from "@/components/ui/EmptyState";
import { formatDate, formatTime } from "@/lib/utils";

function getDateRange() {
  const today = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(today.getDate() + 1);
  const end = new Date(today);
  end.setDate(today.getDate() + 7);

  return {
    tomorrowStr: tomorrow.toISOString().slice(0, 10),
    endStr: end.toISOString().slice(0, 10),
  };
}

export default function UpcomingList() {
  // Fetch next 7 days of bookings
  const { data: all = [], isLoading } = useQuery<Booking[]>({
    queryKey: QK.bookings({}),
    queryFn: () => fetchBookings(),
    staleTime: 60_000,
  });

  const { tomorrowStr, endStr } = getDateRange();
  const upcoming = all
    .filter(
      (b) =>
        b.date >= tomorrowStr &&
        b.date <= endStr &&
        (b.status === "confirmed" || b.status === "completed"),
    )
    .sort((a, b) => a.date.localeCompare(b.date) || a.time.localeCompare(b.time))
    .slice(0, 15);

  return (
    <Card>
      <CardHeader>
        <span style={{ fontWeight: 600, fontSize: "14px" }}>Upcoming (7 days)</span>
      </CardHeader>
      <CardContent style={{ padding: 0 }}>
        {isLoading ? (
          <div style={{ padding: "16px", display: "flex", flexDirection: "column", gap: "8px" }}>
            {[1, 2, 3].map((i) => <Skeleton key={i} style={{ height: "48px" }} />)}
          </div>
        ) : upcoming.length === 0 ? (
          <EmptyState icon="📆" title="No upcoming bookings" />
        ) : (
          <div style={{ maxHeight: "360px", overflowY: "auto" }}>
            {upcoming.map((b) => (
              <div
                key={b.id}
                style={{
                  padding: "12px 16px",
                  borderBottom: "1px solid var(--color-border)",
                  display: "flex",
                  flexDirection: "column",
                  gap: "3px",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    gap: "8px",
                  }}
                >
                  <span style={{ fontWeight: 600, fontSize: "13px" }}>{b.customer_name}</span>
                  <Badge status={b.status} />
                </div>
                <div style={{ fontSize: "12px", color: "var(--color-sub)" }}>
                  {b.service}
                </div>
                <div style={{ fontSize: "11px", color: "var(--color-muted)" }}>
                  {formatDate(b.date)} · {formatTime(b.time)}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
