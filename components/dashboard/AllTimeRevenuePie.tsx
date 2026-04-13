"use client";

import { useQuery } from "@tanstack/react-query";
import { fetchAnalytics, fetchGeneral, QK } from "@/lib/queries";
import type { AnalyticsResponse } from "@/lib/types";
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { Card, CardHeader, CardContent } from "@/components/ui/Card";
import { Skeleton } from "@/components/ui/Skeleton";
import { EmptyState } from "@/components/ui/EmptyState";
import { CHART_COLORS, formatCurrency } from "@/lib/utils";

export default function AllTimeRevenuePie() {
  const { data: general } = useQuery({
    queryKey: QK.general(),
    queryFn: fetchGeneral,
    staleTime: 10 * 60_000,
  });
  const currency = general?.currency ?? "Rs.";
  const tz = general?.timezone ?? Intl.DateTimeFormat().resolvedOptions().timeZone;

  const { data, isLoading } = useQuery<AnalyticsResponse>({
    queryKey: QK.analytics({ period: "day", status: "confirmed,completed", tz }),
    queryFn: () => fetchAnalytics({ period: "day", status: "confirmed,completed", tz }),
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
        <span style={{ fontWeight: 600, fontSize: "14px" }}>💰 Today's Revenue</span>
        <span style={{ fontSize: "12px", color: "var(--color-sub)" }}>
          Confirmed + Completed · by branch
        </span>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <Skeleton style={{ height: "220px" }} />
        ) : chartData.length === 0 ? (
          <EmptyState
            icon="💰"
            title="No revenue today"
            description="Revenue will appear once bookings are confirmed or completed."
          />
        ) : (
          <>
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie
                  data={chartData}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={80}
                  paddingAngle={3}
                  dataKey="value"
                >
                  {chartData.map((_, i) => (
                    <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(v: unknown, name: unknown) => [formatCurrency(v as number, currency), name as string]}
                  contentStyle={{ fontSize: "12px", borderRadius: "8px" }}
                />
                <Legend
                  iconType="circle"
                  iconSize={10}
                  formatter={(v) => (
                    <span style={{ fontSize: "11px", color: "var(--color-ink)" }}>{v}</span>
                  )}
                />
              </PieChart>
            </ResponsiveContainer>

            {/* Revenue breakdown table by branch */}
            <div style={{ marginTop: "16px" }}>
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
                Revenue by Branch
              </div>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "12px" }}>
                <thead>
                  <tr>
                    <th style={{ textAlign: "left", padding: "4px 0", color: "var(--color-sub)", fontWeight: 500 }}>Branch</th>
                    <th style={{ textAlign: "right", padding: "4px 0", color: "var(--color-sub)", fontWeight: 500 }}>Revenue</th>
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
                        {formatCurrency(row.value, currency)}
                      </td>
                      <td style={{ padding: "6px 0", textAlign: "right", color: "var(--color-sub)" }}>
                        {row.percent.toFixed(1)}%
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr style={{ borderTop: "2px solid var(--color-border)" }}>
                    <td style={{ padding: "8px 0", fontWeight: 600 }}>Total</td>
                    <td style={{ padding: "8px 0", textAlign: "right", fontWeight: 700, color: "var(--color-rose)" }}>
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
