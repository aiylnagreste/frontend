// components/dashboard/UpcomingList.tsx
"use client";

import { useQuery } from "@tanstack/react-query";
import { fetchBookings, QK } from "@/lib/queries";
import type { Booking } from "@/lib/types";
import { Card, CardHeader, CardContent } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Skeleton } from "@/components/ui/Skeleton";
import { EmptyState } from "@/components/ui/EmptyState";
import { formatDate, formatTime } from "@/lib/utils";
import { CalendarRange, MapPin, Clock, Scissors } from "lucide-react";

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

function isTomorrow(dateStr: string) {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  return dateStr === tomorrow.toISOString().slice(0, 10);
}

export default function UpcomingList() {
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
            <CalendarRange size={16} color="#b5484b" strokeWidth={2} />
          </div>
          <div>
            <span style={{
              fontWeight: 700,
              fontSize: "14px",
              color: "#1A1D23",
              fontFamily: "'Space Grotesk', sans-serif",
              letterSpacing: "-0.01em",
            }}>
              Upcoming
            </span>
            <span style={{ fontSize: "11px", color: "#9CA3B4", display: "block", marginTop: "1px" }}>
              Next 7 days
            </span>
          </div>
        </div>
      </CardHeader>
      <CardContent style={{ padding: 0 }}>
        {isLoading ? (
          <div style={{ padding: "16px", display: "flex", flexDirection: "column", gap: "8px" }}>
            {[1, 2, 3].map((i) => <Skeleton key={i} style={{ height: "56px" }} />)}
          </div>
        ) : upcoming.length === 0 ? (
          <div style={{ padding: "32px 24px" }}>
            <EmptyState icon="📆" title="No upcoming bookings" />
          </div>
        ) : (
          <div style={{ maxHeight: "400px", overflowY: "auto" }}>
            {upcoming.map((b, idx) => (
              <div
                key={b.id}
                style={{
                  padding: "14px 20px",
                  borderBottom: idx < upcoming.length - 1 ? "1px solid #F0EEED" : "none",
                  display: "flex",
                  gap: "14px",
                  transition: "background 0.15s",
                  cursor: "default",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = "#FDFCFC";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = "transparent";
                }}
              >
                {/* Date column */}
                <div style={{
                  width: "48px",
                  height: "48px",
                  borderRadius: "10px",
                  background: isTomorrow(b.date) ? "linear-gradient(135deg, rgba(181,72,75,0.12), rgba(107,48,87,0.08))" : "#F8F8F6",
                  border: isTomorrow(b.date) ? "1px solid rgba(181,72,75,0.2)" : "1px solid #E6E4DF",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                }}>
                  <span style={{
                    fontSize: "10px",
                    fontWeight: 600,
                    color: isTomorrow(b.date) ? "#b5484b" : "#9CA3B4",
                    textTransform: "uppercase",
                    letterSpacing: "0.04em",
                    lineHeight: 1,
                  }}>
                    {new Date(b.date + "T00:00:00").toLocaleDateString("en-US", { weekday: "short" })}
                  </span>
                  <span style={{
                    fontSize: "16px",
                    fontWeight: 700,
                    color: "#1A1D23",
                    fontFamily: "'Space Grotesk', sans-serif",
                    lineHeight: 1.2,
                    marginTop: "2px",
                  }}>
                    {new Date(b.date + "T00:00:00").getDate()}
                  </span>
                </div>

                {/* Content */}
                <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", gap: "4px" }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "8px" }}>
                    <span style={{
                      fontWeight: 600,
                      fontSize: "13px",
                      color: "#1A1D23",
                      whiteSpace: "nowrap",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                    }}>
                      {b.customer_name}
                    </span>
                    <Badge status={b.status} />
                  </div>

                  <div style={{
                    fontSize: "12px",
                    color: "#5F6577",
                    display: "flex",
                    alignItems: "center",
                    gap: "4px",
                    whiteSpace: "nowrap",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                  }}>
                    <Scissors size={11} color="#9CA3B4" strokeWidth={1.8} style={{ flexShrink: 0 }} />
                    <span style={{ overflow: "hidden", textOverflow: "ellipsis" }}>{b.service}</span>
                  </div>

                  <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                    <span style={{
                      fontSize: "11px",
                      color: "#9CA3B4",
                      display: "flex",
                      alignItems: "center",
                      gap: "4px",
                    }}>
                      <Clock size={10} color="#9CA3B4" strokeWidth={1.8} />
                      {formatTime(b.time)}
                    </span>
                    {b.branch && (
                      <span style={{
                        fontSize: "11px",
                        color: "#9CA3B4",
                        display: "flex",
                        alignItems: "center",
                        gap: "4px",
                      }}>
                        <MapPin size={10} color="#9CA3B4" strokeWidth={1.8} />
                        {b.branch}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}