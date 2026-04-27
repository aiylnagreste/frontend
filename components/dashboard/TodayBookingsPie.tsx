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
import styles from "./TodayBookingsPie.module.css";

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
        <div className={styles.cardHeaderInner}>
          <div className={styles.iconWrap}>
            <PieChartIcon size={16} color="#b5484b" strokeWidth={2} />
          </div>
          <div>
            <span className={styles.cardTitle}>
              Today&apos;s Bookings
            </span>
            <span className={styles.cardSubtitle}>
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
                    <span className={styles.legendSpan}>{v}</span>
                  )}
                />
              </PieChart>
            </ResponsiveContainer>

            <div className={styles.tableSection}>
              <div className={styles.tableSectionLabel}>
                Bookings by Branch
              </div>
              <table className={styles.table}>
                <thead>
                  <tr>
                    {["Branch", "Bookings", "%"].map((h, i) => (
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
                        {row.value}
                      </td>
                      <td className={styles["td--pct"]}>
                        {total > 0 ? ((row.value / total) * 100).toFixed(1) : "0.0"}%
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
