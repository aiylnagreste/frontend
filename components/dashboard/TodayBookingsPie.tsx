// components/dashboard/TodayBookingsPie.tsx
"use client";

import { useQuery } from "@tanstack/react-query";
import { fetchBookings, QK } from "@/lib/queries";
import type { Booking } from "@/lib/types";
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { Card, CardHeader, CardContent } from "@/components/ui/Card";
import { Skeleton } from "@/components/ui/Skeleton";
import { EmptyState } from "@/components/ui/EmptyState";
import { CHART_COLORS } from "@/lib/utils";
import { PieChart as PieChartIcon } from "lucide-react";

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

  const byBranch = bookings
    .filter(b => b.status === "confirmed" || b.status === "completed")
    .reduce<Record<string, number>>((acc, b) => {
      acc[b.branch] = (acc[b.branch] ?? 0) + 1;
      return acc;
    }, {});

  const chartData = Object.entries(byBranch)
    .sort((a, b) => b[1] - a[1])
    .map(([name, value]) => ({ name, value }));

  const total = bookings.filter(b => b.status === "confirmed" || b.status === "completed").length;

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
            <PieChartIcon size={16} color="#b5484b" strokeWidth={2} />
          </div>
          <div>
            <span style={{
              fontWeight: 700,
              fontSize: "14px",
              color: "#1A1D23",
              fontFamily: "'Space Grotesk', sans-serif",
              letterSpacing: "-0.01em",
            }}>
              Today&apos;s Bookings
            </span>
            <span style={{ fontSize: "11px", color: "#9CA3B4", display: "block", marginTop: "1px" }}>
              Confirmed + Completed
            </span>
          </div>
        </div>
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
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie
                  data={chartData}
                  cx="50%"
                  cy="50%"
                  innerRadius={45}
                  outerRadius={70}
                  paddingAngle={3}
                  dataKey="value"
                  strokeWidth={0}
                >
                  {chartData.map((_, i) => (
                    <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(value: unknown, name: unknown) => [String(value ?? 0), name as string]}
                  contentStyle={{
                    fontSize: "12px",
                    borderRadius: "8px",
                    border: "1px solid #E6E4DF",
                    boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
                    fontFamily: "'DM Sans', sans-serif",
                  }}
                />
                <Legend
                  iconType="circle"
                  iconSize={7}
                  wrapperStyle={{ fontSize: "11px", fontFamily: "'DM Sans', sans-serif" }}
                  formatter={(v) => (
                    <span style={{ fontSize: "11px", color: "#5F6577" }}>{v}</span>
                  )}
                />
              </PieChart>
            </ResponsiveContainer>

            <div style={{ marginTop: "20px" }}>
              <div style={{
                fontSize: "11px",
                fontWeight: 600,
                color: "#5F6577",
                textTransform: "uppercase",
                letterSpacing: "0.06em",
                marginBottom: "10px",
                fontFamily: "'DM Sans', sans-serif",
              }}>
                Bookings by Branch
              </div>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "12px" }}>
                <thead>
                  <tr>
                    {["Branch", "Bookings", "%"].map((h, i) => (
                      <th
                        key={h}
                        style={{
                          textAlign: i === 0 ? "left" : "right",
                          padding: "4px 0",
                          color: "#9CA3B4",
                          fontWeight: 500,
                          fontSize: "11px",
                          fontFamily: "'DM Sans', sans-serif",
                        }}
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {chartData.map((row, i) => (
                    <tr key={i} style={{ borderTop: "1px solid #F0EEED" }}>
                      <td style={{
                        padding: "7px 0",
                        display: "flex",
                        alignItems: "center",
                        gap: "8px",
                        color: "#1A1D23",
                        fontWeight: 500,
                      }}>
                        <span style={{
                          width: "8px",
                          height: "8px",
                          borderRadius: "50%",
                          background: CHART_COLORS[i % CHART_COLORS.length],
                          flexShrink: 0,
                        }} />
                        {row.name}
                      </td>
                      <td style={{
                        padding: "7px 0",
                        textAlign: "right",
                        fontWeight: 600,
                        color: "#1A1D23",
                        fontFamily: "'Space Grotesk', sans-serif",
                      }}>
                        {row.value}
                      </td>
                      <td style={{
                        padding: "7px 0",
                        textAlign: "right",
                        color: "#9CA3B4",
                        fontFamily: "'Space Grotesk', sans-serif",
                      }}>
                        {total > 0 ? ((row.value / total) * 100).toFixed(1) : "0.0"}%
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr style={{ borderTop: "2px solid #E6E4DF" }}>
                    <td style={{
                      padding: "10px 0 0",
                      fontWeight: 700,
                      color: "#1A1D23",
                      fontFamily: "'Space Grotesk', sans-serif",
                    }}>
                      Total
                    </td>
                    <td style={{
                      padding: "10px 0 0",
                      textAlign: "right",
                      fontWeight: 700,
                      color: "#b5484b",
                      fontFamily: "'Space Grotesk', sans-serif",
                    }}>
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