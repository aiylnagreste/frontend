"use client";

import { useQuery } from "@tanstack/react-query";
import { fetchBookings, QK } from "@/lib/queries";
import type { Booking } from "@/lib/types";
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { Card, CardHeader, CardContent } from "@/components/ui/Card";
import { Skeleton } from "@/components/ui/Skeleton";
import { EmptyState } from "@/components/ui/EmptyState";
import { CHART_COLORS } from "@/lib/utils";

function getTodayStr() {
  return new Date().toISOString().slice(0, 10);
}

export default function TodayBookingsPie() {
  const today = getTodayStr();

  const { data: bookings = [], isLoading } = useQuery<Booking[]>({
    queryKey: QK.bookings({ date: today }),
    queryFn: () => fetchBookings({ date: today }),
    staleTime: 0,
    refetchInterval: 30_000,
  });

  // Count by branch — all statuses from the API (no client-side status filter)
  const byBranch = bookings.reduce<Record<string, number>>((acc, b) => {
    acc[b.branch] = (acc[b.branch] ?? 0) + 1;
    return acc;
  }, {});

  const chartData = Object.entries(byBranch)
    .sort((a, b) => b[1] - a[1])
    .map(([name, value]) => ({ name, value }));

  const total = bookings.length;

  return (
    <Card>
      <CardHeader>
        <span style={{ fontWeight: 600, fontSize: "14px" }}>📅 Today's Bookings</span>
        <span style={{ fontSize: "12px", color: "var(--color-sub)" }}>
          All bookings · by branch
        </span>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <Skeleton style={{ height: "220px" }} />
        ) : chartData.length === 0 ? (
          <EmptyState
            icon="📅"
            title="No bookings today"
            description="Bookings will appear here as they are confirmed."
          />
        ) : (
          <>
            <ResponsiveContainer width="100%" height={180}>
              <PieChart>
                <Pie
                  data={chartData}
                  cx="50%"
                  cy="50%"
                  innerRadius={45}
                  outerRadius={70}
                  paddingAngle={3}
                  dataKey="value"
                >
                  {chartData.map((_, i) => (
                    <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(value: unknown, name: unknown) => [String(value ?? 0), name as string]}
                  contentStyle={{ fontSize: "12px", borderRadius: "8px" }}
                />
                <Legend
                  iconType="circle"
                  iconSize={10}
                  formatter={(v) => (
                    <span style={{ fontSize: "12px", color: "var(--color-ink)" }}>{v}</span>
                  )}
                />
              </PieChart>
            </ResponsiveContainer>

            {/* Bookings per branch table */}
            <div style={{ marginTop: "12px" }}>
              <div
                style={{
                  fontSize: "11px",
                  fontWeight: 600,
                  color: "var(--color-sub)",
                  textTransform: "uppercase",
                  letterSpacing: "0.05em",
                  marginBottom: "8px",
                }}
              >
                Bookings by Branch
              </div>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "12px" }}>
                <thead>
                  <tr>
                    <th style={{ textAlign: "left", padding: "4px 0", color: "var(--color-sub)", fontWeight: 500 }}>Branch</th>
                    <th style={{ textAlign: "right", padding: "4px 0", color: "var(--color-sub)", fontWeight: 500 }}>Bookings</th>
                    <th style={{ textAlign: "right", padding: "4px 0", color: "var(--color-sub)", fontWeight: 500 }}>%</th>
                  </tr>
                </thead>
                <tbody>
                  {chartData.map((row, i) => (
                    <tr key={i} style={{ borderTop: "1px solid var(--color-border)" }}>
                      <td style={{ padding: "6px 0", display: "flex", alignItems: "center", gap: "6px" }}>
                        <span
                          style={{
                            width: "8px",
                            height: "8px",
                            borderRadius: "50%",
                            background: CHART_COLORS[i % CHART_COLORS.length],
                            flexShrink: 0,
                            display: "inline-block",
                          }}
                        />
                        {row.name}
                      </td>
                      <td style={{ padding: "6px 0", textAlign: "right", fontWeight: 500 }}>
                        {row.value}
                      </td>
                      <td style={{ padding: "6px 0", textAlign: "right", color: "var(--color-sub)" }}>
                        {total > 0 ? ((row.value / total) * 100).toFixed(1) : "0.0"}%
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr style={{ borderTop: "2px solid var(--color-border)" }}>
                    <td style={{ padding: "8px 0", fontWeight: 600 }}>Total</td>
                    <td style={{ padding: "8px 0", textAlign: "right", fontWeight: 700, color: "var(--color-rose)" }}>
                      {total}
                    </td>
                    <td />
                  </tr>
                </tfoot>
              </table>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
