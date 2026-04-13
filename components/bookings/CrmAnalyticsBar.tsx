"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { fetchAnalytics, fetchGeneral, QK } from "@/lib/queries";
import type { AnalyticsResponse } from "@/lib/types";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
  PieChart,
  Pie,
  Legend,
} from "recharts";
import { Card, CardContent } from "@/components/ui/Card";
import { Skeleton } from "@/components/ui/Skeleton";
import { EmptyState } from "@/components/ui/EmptyState";
import { CHART_COLORS, formatCurrency } from "@/lib/utils";

type Timeframe = "day" | "week" | "month" | "year";

const TIMEFRAME_LABELS: Record<Timeframe, string> = {
  day: "Today",
  week: "This Week",
  month: "This Month",
  year: "This Year",
};

interface Props {
  branchId?: number;
  branchName?: string;
}

export default function CrmAnalyticsBar({ branchId, branchName }: Props) {
  const [timeframe, setTimeframe] = useState<Timeframe>("week");

  const { data: general } = useQuery({
    queryKey: QK.general(),
    queryFn: fetchGeneral,
    staleTime: 10 * 60_000,
  });
  const currency = general?.currency ?? "Rs.";

  // ✅ FIX: Revenue uses status=completed only — separate from count
  const { data: revenueData, isLoading: revLoading } = useQuery<AnalyticsResponse>({
    queryKey: QK.analytics({ period: timeframe, branch: branchName ?? "", status: "completed" }),
    queryFn: () =>
      fetchAnalytics({ period: timeframe, branch: branchName ?? "", status: "completed" }),
    staleTime: 60_000,
  });

  // ✅ FIX: Booking count uses confirmed+completed — explicitly labeled
  const { data: countData, isLoading: countLoading } = useQuery<AnalyticsResponse>({
    queryKey: QK.analytics({ period: timeframe, branch: branchName ?? "", status: "confirmed,completed" }),
    queryFn: () =>
      fetchAnalytics({ period: timeframe, branch: branchName ?? "", status: "confirmed,completed" }),
    staleTime: 60_000,
  });

  const topServices = (countData?.topServices ?? []).slice(0, 10);

  // ✅ FIX: Service name always mapped from .name (never undefined)
  const revenueByService = (revenueData?.revenueByService ?? [])
    .filter((s) => s.name && s.revenue > 0)
    .slice(0, 8);

  return (
    <Card>
      {/* Header with timeframe tabs */}
      <div
        style={{
          padding: "14px 20px",
          borderBottom: "1px solid var(--color-border)",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: "12px",
        }}
      >
        <span style={{ fontWeight: 600, fontSize: "14px" }}>📊 Revenue & Service Analytics</span>
        <div style={{ display: "flex", gap: "4px" }}>
          {(Object.keys(TIMEFRAME_LABELS) as Timeframe[]).map((tf) => (
            <button
              key={tf}
              onClick={() => setTimeframe(tf)}
              style={{
                padding: "5px 12px",
                borderRadius: "6px",
                fontSize: "12px",
                fontWeight: 500,
                border: timeframe === tf ? "1.5px solid var(--color-rose)" : "1.5px solid var(--color-border)",
                background: timeframe === tf ? "var(--color-rose-dim)" : "transparent",
                color: timeframe === tf ? "var(--color-rose)" : "var(--color-sub)",
                cursor: "pointer",
              }}
            >
              {TIMEFRAME_LABELS[tf]}
            </button>
          ))}
        </div>
      </div>

      <CardContent>
        <div style={{ display: "grid", gridTemplateColumns: "180px 1fr 1fr", gap: "20px", alignItems: "start" }}>
          {/* Stat tiles column */}
          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            <StatTile
              label="Revenue (Completed)"
              value={formatCurrency(revenueData?.totalRevenue ?? 0, currency)}
              color="var(--color-rose)"
              loading={revLoading}
            />
            <StatTile
              label="Bookings (Conf. + Comp.)"
              value={String(countData?.bookingCount ?? 0)}
              loading={countLoading}
            />
            <StatTile
              label="Top Service"
              value={countData?.topServices?.[0]?.name ?? "—"}
              small
              loading={countLoading}
            />
            <StatTile
              label="Top Revenue"
              value={formatCurrency(revenueData?.revenueByService?.[0]?.revenue ?? 0, currency)}
              loading={revLoading}
            />
          </div>

          {/* Most Booked Services — Horizontal Bar */}
          <div>
            <div style={{ fontSize: "12px", fontWeight: 600, color: "var(--color-sub)", marginBottom: "50px" }}>
              📊 Most Booked Services
            </div>
            {countLoading ? (
              <Skeleton style={{ height: "180px" }} />
            ) : topServices.length === 0 ? (
              <EmptyState icon="📊" title="No data" description="No bookings in this period." />
            ) : (
              <ResponsiveContainer width="100%" height={Math.max(160, topServices.length * 30)}>
                <BarChart
                  data={topServices}
                  layout="vertical"
                  margin={{ left: 0, right: 16, top: 0, bottom: 0 }}
                >
                  <XAxis type="number" tick={{ fontSize: 11 }} />
                  <YAxis
                    type="category"
                    dataKey="name"
                    width={130}
                    tick={{ fontSize: 11 }}
                  />
                  <Tooltip
                    formatter={(v: unknown) => [String(v ?? 0), "Bookings"]}
                    contentStyle={{ fontSize: "12px", borderRadius: "8px" }}
                  />
                  <Bar dataKey="count" radius={[0, 4, 4, 0]}>
                    {topServices.map((_, i) => (
                      <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>

          {/* Revenue by Service — Donut */}
          <div>
            <div style={{ fontSize: "12px", fontWeight: 600, color: "var(--color-sub)", marginBottom: "50px" }}>
              💰 Revenue by Service (Completed)
            </div>
            {revLoading ? (
              <Skeleton style={{ height: "180px" }} />
            ) : revenueByService.length === 0 ? (
              <EmptyState icon="💰" title="No revenue" description="Complete some bookings to see revenue." />
            ) : (
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie
                    data={revenueByService}
                    dataKey="revenue"
                    nameKey="name"
                    cx="50%"
                    cy="45%"
                    innerRadius={45}
                    outerRadius={75}
                    paddingAngle={3}
                  >
                    {revenueByService.map((_, i) => (
                      <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(v: unknown, name: unknown) => [formatCurrency(v as number, currency), name as string]}
                    contentStyle={{ fontSize: "12px", borderRadius: "8px" }}
                  />
                  <Legend
                    iconType="circle"
                    iconSize={8}
                    formatter={(v) => (
                      <span style={{ fontSize: "11px" }}>{v}</span>
                    )}
                  />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function StatTile({
  label,
  value,
  color,
  small,
  loading,
}: {
  label: string;
  value: string;
  color?: string;
  small?: boolean;
  loading?: boolean;
}) {
  return (
    <div
      style={{
        background: "var(--color-canvas)",
        border: "1px solid var(--color-border)",
        borderRadius: "8px",
        padding: "10px 14px",
      }}
    >
      <div style={{ fontSize: "10px", fontWeight: 600, color: "var(--color-sub)", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "4px" }}>
        {label}
      </div>
      {loading ? (
        <Skeleton style={{ height: "20px", width: "70%" }} />
      ) : (
        <div
          style={{
            fontSize: small ? "13px" : "18px",
            fontWeight: 700,
            color: color ?? "var(--color-ink)",
            lineHeight: 1.2,
          }}
        >
          {value}
        </div>
      )}
    </div>
  );
}
