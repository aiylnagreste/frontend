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
import styles from "./AllTimeRevenuePie.module.css";

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
        <div className={styles.cardHeaderInner}>
          <div className={styles.iconWrap}>
            <DollarSign size={16} color="#b5484b" strokeWidth={2} />
          </div>
          <div>
            <span className={styles.cardTitle}>
              Today&apos;s Revenue
            </span>
            <span className={styles.cardSubtitle}>
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
                    <span className={styles.legendSpan}>{v}</span>
                  )}
                />
              </PieChart>
            </ResponsiveContainer>

            <div className={styles.tableSection}>
              <div className={styles.tableSectionLabel}>
                Revenue by Branch
              </div>
              <table className={styles.table}>
                <thead>
                  <tr>
                    {["Branch", "Revenue", "%"].map((h, i) => (
                      <th
                        key={h}
                        className={i === 0 ? styles["th--left"] : styles["th--right"]}
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {chartData.map((row, i) => (
                    <tr key={i} className={styles.tr}>
                      <td className={styles["td--name"]}>
                        <span
                          className={styles.colorDot}
                          style={{ background: CHART_COLORS[i % CHART_COLORS.length] }}
                        />
                        {row.name}
                      </td>
                      <td className={styles["td--value"]}>
                        {formatCurrency(row.value, currency)}
                      </td>
                      <td className={styles["td--pct"]}>
                        {row.percent.toFixed(1)}%
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className={styles.tfootTr}>
                    <td className={styles["tfoot--label"]}>
                      Total
                    </td>
                    <td className={styles["tfoot--total"]}>
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
