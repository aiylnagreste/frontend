"use client";

import { useQuery } from "@tanstack/react-query";
import { fetchBookings, fetchStaff, fetchBranches, QK } from "@/lib/queries";
import type { Booking, Branch } from "@/lib/types";
import { useState } from "react";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
} from "recharts";
import { Card, CardHeader, CardContent } from "@/components/ui/Card";
import { Skeleton } from "@/components/ui/Skeleton";
import { EmptyState } from "@/components/ui/EmptyState";
import { CHART_COLORS } from "@/lib/utils";

type Period = "today" | "week" | "month";

function getPeriodDates(period: Period): { dateFrom: string; dateTo: string } {
  const now = new Date();
  const to = now.toISOString().slice(0, 10);
  if (period === "today") return { dateFrom: to, dateTo: to };
  const from = new Date(now);
  if (period === "week") {
    from.setDate(from.getDate() - 6);
  } else {
    from.setDate(1);
  }
  return { dateFrom: from.toISOString().slice(0, 10), dateTo: to };
}

const PERIOD_LABELS: Record<Period, string> = {
  today: "Today",
  week: "Week",
  month: "Month",
};

export default function StaffPage() {
  const [branchFilter, setBranchFilter] = useState("");
  const [period, setPeriod] = useState<Period>("today");

  const { data: branches = [] } = useQuery<Branch[]>({
    queryKey: QK.branches(),
    queryFn: fetchBranches,
    staleTime: 10 * 60_000,
  });

  const { data: bookings = [], isLoading } = useQuery<Booking[]>({
    queryKey: QK.bookings({}),
    queryFn: () => fetchBookings(),
    staleTime: 0,
  });

  const filteredBranches = branchFilter
    ? branches.filter((b) => b.name === branchFilter)
    : branches;

  const { dateFrom, dateTo } = getPeriodDates(period);

  // Confirmed + completed bookings in period with a staff member assigned
  const periodBookings = bookings.filter(
    (b) =>
      b.staff_name &&
      b.date >= dateFrom &&
      b.date <= dateTo &&
      (b.status === "confirmed" || b.status === "completed"),
  );

  // Completed only — for the completed bookings bar chart
  const completedInRange = periodBookings.filter(
    (b) => b.status === "completed",
  );

  // Explicitly requested only — staffRequested is stored as 1 in DB when customer chose the staff
  const requestedInRange = periodBookings.filter((b) => b.staffRequested);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
      {/* Header row */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "12px" }}>
        <h3 style={{ fontSize: "18px", fontWeight: 700, margin: 0 }}>
          Staff Management & Availability
        </h3>
        <div style={{ display: "flex", gap: "6px" }}>
          {(["today", "week", "month"] as Period[]).map((p) => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              style={{
                padding: "6px 16px",
                borderRadius: "8px",
                fontSize: "13px",
                fontWeight: 500,
                border: period === p ? "1.5px solid var(--color-rose)" : "1.5px solid var(--color-border)",
                background: period === p ? "var(--color-rose-dim)" : "var(--color-surface)",
                color: period === p ? "var(--color-rose)" : "var(--color-sub)",
                cursor: "pointer",
              }}
            >
              {PERIOD_LABELS[p]}
            </button>
          ))}
        </div>
      </div>

      {/* Branch filter */}
      <div>
        <select
          value={branchFilter}
          onChange={(e) => setBranchFilter(e.target.value)}
          style={{
            padding: "8px 12px",
            border: "1px solid var(--color-border)",
            borderRadius: "8px",
            fontSize: "13px",
            background: "var(--color-surface)",
          }}
        >
          <option value="">All Branches</option>
          {branches.map((b) => (
            <option key={b.id} value={b.name}>{b.name}</option>
          ))}
        </select>
      </div>

      {/* 2-column grid of branch cards */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px" }}>
        {filteredBranches.map((branch, branchIndex) => {
          const branchCompleted = completedInRange.filter(
            (b) => b.branch === branch.name,
          );
          const branchPeriod = periodBookings.filter(
            (b) => b.branch === branch.name,
          );
          const branchRequested = requestedInRange.filter(
            (b) => b.branch === branch.name,
          );

          // Group completed bookings by staff for completed chart
          const completedByStaff = branchCompleted.reduce<Record<string, number>>(
            (acc, b) => {
              const key = b.staff_name!;
              acc[key] = (acc[key] ?? 0) + 1;
              return acc;
            },
            {},
          );

          const chartData = Object.entries(completedByStaff)
            .sort((a, b) => b[1] - a[1])
            .map(([name, count]) => ({ name, count }));

          // Group explicitly requested bookings by staff for requested chart
          const requestedByStaff = branchRequested.reduce<Record<string, number>>(
            (acc, b) => {
              const key = b.staff_name!;
              acc[key] = (acc[key] ?? 0) + 1;
              return acc;
            },
            {},
          );

          const requestedChartData = Object.entries(requestedByStaff)
            .sort((a, b) => b[1] - a[1])
            .map(([name, count]) => ({ name, count }));

          // Group all period bookings by staff for detail list
          const allByStaff = branchPeriod.reduce<Record<string, Booking[]>>(
            (acc, b) => {
              const key = b.staff_name!;
              if (!acc[key]) acc[key] = [];
              acc[key].push(b);
              return acc;
            },
            {},
          );

          const staffEntries = Object.entries(allByStaff).sort(
            (a, b) => b[1].filter((x) => x.status === "completed").length
                    - a[1].filter((x) => x.status === "completed").length,
          );

          const showDate = dateFrom !== dateTo;

          return (
            <Card key={branch.id}>
              <CardHeader>
                <span style={{ fontWeight: 600, fontSize: "14px" }}>
                  🏪 {branch.name}
                </span>
                <span style={{ fontSize: "11px", color: "var(--color-sub)" }}>
                  {PERIOD_LABELS[period]} · completed &amp; scheduled
                </span>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <Skeleton style={{ height: "200px" }} />
                ) : staffEntries.length === 0 ? (
                  <EmptyState icon="📊" title="No bookings in this period" />
                ) : (
                  <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                    {/* Bar chart — completed count per staff */}
                    {chartData.length > 0 && (
                      <div>
                        <div style={{ fontSize: "11px", fontWeight: 600, color: "var(--color-sub)", marginBottom: "6px", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                          Completed Bookings
                        </div>
                        <ResponsiveContainer
                          width="100%"
                          height={Math.max(80, chartData.length * 30)}
                        >
                          <BarChart
                            data={chartData}
                            layout="vertical"
                            margin={{ left: 0, right: 16, top: 0, bottom: 0 }}
                          >
                            <XAxis type="number" tick={{ fontSize: 11 }} allowDecimals={false} />
                            <YAxis
                              type="category"
                              dataKey="name"
                              width={110}
                              tick={{ fontSize: 11 }}
                            />
                            <Tooltip
                              formatter={(v: unknown) => [String(v ?? 0), "Completed"]}
                              contentStyle={{ fontSize: "12px", borderRadius: "8px" }}
                            />
                            <Bar
                              dataKey="count"
                              fill={CHART_COLORS[branchIndex % CHART_COLORS.length]}
                              radius={[0, 4, 4, 0]}
                            />
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                    )}

                    {/* Bar chart — most requested staff */}
                    {requestedChartData.length > 0 && (
                      <div>
                        <div style={{ fontSize: "11px", fontWeight: 600, color: "var(--color-sub)", marginBottom: "6px", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                          Most Requested
                        </div>
                        <ResponsiveContainer
                          width="100%"
                          height={Math.max(80, requestedChartData.length * 30)}
                        >
                          <BarChart
                            data={requestedChartData}
                            layout="vertical"
                            margin={{ left: 0, right: 16, top: 0, bottom: 0 }}
                          >
                            <XAxis type="number" tick={{ fontSize: 11 }} allowDecimals={false} />
                            <YAxis
                              type="category"
                              dataKey="name"
                              width={110}
                              tick={{ fontSize: 11 }}
                            />
                            <Tooltip
                              formatter={(v: unknown) => [String(v ?? 0), "Requests"]}
                              contentStyle={{ fontSize: "12px", borderRadius: "8px" }}
                            />
                            <Bar
                              dataKey="count"
                              fill={CHART_COLORS[(branchIndex + 2) % CHART_COLORS.length]}
                              radius={[0, 4, 4, 0]}
                            />
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                    )}

                    {/* Booking detail list per staff */}
                    <div style={{ borderTop: "1px solid var(--color-border)", paddingTop: "12px", display: "flex", flexDirection: "column", gap: "10px" }}>
                      {staffEntries.map(([staffName, bks]) => {
                        const completedCount = bks.filter((b) => b.status === "completed").length;
                        return (
                          <div
                            key={staffName}
                            style={{
                              border: "1px solid var(--color-border)",
                              borderRadius: "8px",
                              padding: "10px 14px",
                              background: "var(--color-canvas)",
                            }}
                          >
                            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "6px" }}>
                              <span style={{ fontWeight: 600, fontSize: "13px" }}>{staffName}</span>
                              {completedCount > 0 && (
                                <span style={{ fontSize: "11px", color: "var(--color-sub)", background: "var(--color-surface)", border: "1px solid var(--color-border)", borderRadius: "12px", padding: "2px 8px" }}>
                                  {completedCount} completed
                                </span>
                              )}
                            </div>
                            {[...bks]
                              .sort((a, b) => {
                                if (a.date !== b.date) return a.date.localeCompare(b.date);
                                return a.time.localeCompare(b.time);
                              })
                              .map((b) => (
                                <div
                                  key={b.id}
                                  style={{
                                    fontSize: "12px",
                                    color: b.status === "completed" ? "var(--color-rose)" : "var(--color-sub)",
                                    marginBottom: "2px",
                                    display: "flex",
                                    gap: "4px",
                                    alignItems: "baseline",
                                  }}
                                >
                                  {showDate && (
                                    <span style={{ color: "var(--color-muted)", fontSize: "11px", flexShrink: 0 }}>
                                      {b.date} ·
                                    </span>
                                  )}
                                  <span>
                                    {b.time} – {b.endTime ?? "?"} · {b.service} · {b.customer_name}
                                  </span>
                                </div>
                              ))}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
