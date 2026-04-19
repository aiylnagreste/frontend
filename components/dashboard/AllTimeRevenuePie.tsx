// components/dashboard/AllTimeRevenuePie.tsx
"use client";

import { useQuery } from "@tanstack/react-query";
import { fetchAnalytics, fetchGeneral, QK } from "@/lib/queries";
import type { AnalyticsResponse } from "@/lib/types";
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { Card, CardHeader, CardContent } from "@/components/ui/Card";
import { Skeleton } from "@/components/ui/Skeleton";
import { EmptyState } from "@/components/ui/EmptyState";
import { CHART_COLORS, formatCurrency } from "@/lib/utils";
import { DollarSign } from "lucide-react";

export default function AllTimeRevenuePie() {
  const { data: general } = useQuery({
    queryKey: QK.general(),
    queryFn: fetchGeneral,
    staleTime: 10 * 60_000,
  });
  const currency = general?.currency ?? "Rs.";
  const tz = general?.timezone ?? Intl.DateTimeFormat().resolvedOptions().timeZone;

  const { data, isLoading } = useQuery<AnalyticsResponse>({
    queryKey: QK.analytics({ period: "day", status: "completed", tz }),
    queryFn: () => fetchAnalytics({ period: "day", status: "completed", tz }),
    staleTime: 0,
    refetchInterval: 60_000,
  });

  const revenueByBranch = data?.revenueByBranch ?? {};
  const total = data?.totalRevenue ?? 0;

  const chartData = Object.entries(revenueByBranch)
    .filter(([, v]) => v > 0)
    .sort((a, b) => b[1] - a[1])
    .map(([name, value]) => ({
      name,
      value,
      percent: total > 0 ? (value / total) * 100 : 0,
    }));

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
            <DollarSign size={16} color="#b5484b" strokeWidth={2} />
          </div>
          <div>
            <span style={{
              fontWeight: 700,
              fontSize: "14px",
              color: "#1A1D23",
              fontFamily: "'Space Grotesk', sans-serif",
              letterSpacing: "-0.01em",
            }}>
              Today&apos;s Revenue
            </span>
            <span style={{ fontSize: "11px", color: "#9CA3B4", display: "block", marginTop: "1px" }}>
              Completed bookings only
            </span>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <Skeleton style={{ height: "220px" }} />
        ) : chartData.length === 0 ? (
          <EmptyState
            icon="💰"
            title="No revenue today"
            description="Revenue will appear once bookings are completed."
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
                  formatter={(v: unknown, name: unknown) => [formatCurrency(v as number, currency), name as string]}
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
                Revenue by Branch
              </div>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "12px" }}>
                <thead>
                  <tr>
                    {["Branch", "Revenue", "%"].map((h, i) => (
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
                        {formatCurrency(row.value, currency)}
                      </td>
                      <td style={{
                        padding: "7px 0",
                        textAlign: "right",
                        color: "#9CA3B4",
                        fontFamily: "'Space Grotesk', sans-serif",
                      }}>
                        {row.percent.toFixed(1)}%
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
                      {formatCurrency(total, currency)}
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