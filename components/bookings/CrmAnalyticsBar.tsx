// components/dashboard/CrmAnalyticsBar.tsx
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
import { BarChart3, PieChart as PieChartIcon, TrendingUp } from "lucide-react";

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

  const { data: revenueData, isLoading: revLoading } = useQuery<AnalyticsResponse>({
    queryKey: QK.analytics({ period: timeframe, branch: branchName ?? "", status: "completed" }),
    queryFn: () =>
      fetchAnalytics({ period: timeframe, branch: branchName ?? "", status: "completed" }),
    staleTime: 60_000,
  });

  const { data: countData, isLoading: countLoading } = useQuery<AnalyticsResponse>({
    queryKey: QK.analytics({ period: timeframe, branch: branchName ?? "", status: "confirmed,completed" }),
    queryFn: () =>
      fetchAnalytics({ period: timeframe, branch: branchName ?? "", status: "confirmed,completed" }),
    staleTime: 60_000,
  });

  const topServices = (countData?.topServices ?? []).slice(0, 10);
  const revenueByService = (revenueData?.revenueByService ?? [])
    .filter((s) => s.name && s.revenue > 0)
    .slice(0, 8);

  return (
    <Card>
      {/* Header with timeframe tabs */}
      <div style={cardHeaderStyle}>
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
            <TrendingUp size={16} color="#b5484b" strokeWidth={2} />
          </div>
          <div>
            <span style={{
              fontWeight: 700,
              fontSize: "14px",
              color: "#1A1D23",
              fontFamily: "'Space Grotesk', sans-serif",
              letterSpacing: "-0.01em",
            }}>
              Revenue & Service Analytics
            </span>
            <span style={{ fontSize: "11px", color: "#9CA3B4", display: "block", marginTop: "1px" }}>
              {TIMEFRAME_LABELS[timeframe].toLowerCase()} overview
            </span>
          </div>
        </div>

        <div style={{
          display: "flex",
          background: "#F8F8F6",
          borderRadius: "8px",
          padding: "3px",
          border: "1px solid #E6E4DF",
        }}>
          {(Object.keys(TIMEFRAME_LABELS) as Timeframe[]).map((tf) => (
            <button
              key={tf}
              onClick={() => setTimeframe(tf)}
              style={{
                padding: "5px 14px",
                borderRadius: "6px",
                fontSize: "12px",
                fontWeight: timeframe === tf ? 600 : 500,
                border: "none",
                background: timeframe === tf ? "#fff" : "transparent",
                color: timeframe === tf ? "#1A1D23" : "#5F6577",
                cursor: "pointer",
                fontFamily: "'DM Sans', sans-serif",
                boxShadow: timeframe === tf ? "0 1px 3px rgba(0,0,0,0.06)" : "none",
                transition: "all 0.15s",
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
          <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
            <StatTile
              label="Revenue"
              sublabel="Completed only"
              value={formatCurrency(revenueData?.totalRevenue ?? 0, currency)}
              accent
              loading={revLoading}
            />
            <StatTile
              label="Bookings"
              sublabel="Confirmed + Completed"
              value={String(countData?.bookingCount ?? 0)}
              loading={countLoading}
            />
            <StatTile
              label="Top Service"
              sublabel="By bookings"
              value={countData?.topServices?.[0]?.name ?? "—"}
              small
              loading={countLoading}
            />
            <StatTile
              label="Top Revenue"
              sublabel="By service"
              value={formatCurrency(revenueData?.revenueByService?.[0]?.revenue ?? 0, currency)}
              loading={revLoading}
            />
          </div>

          {/* Most Booked Services — Horizontal Bar */}
          <div>
            <div style={chartLabelStyle}>
              <BarChart3 size={13} color="#5F6577" />
              <span>Most Booked Services</span>
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
                  <XAxis type="number" tick={{ fontSize: 11, fill: "#5F6577" }} axisLine={false} tickLine={false} />
                  <YAxis
                    type="category"
                    dataKey="name"
                    width={130}
                    tick={{ fontSize: 11, fill: "#1A1D23" }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <Tooltip
                    formatter={(v: unknown) => [String(v ?? 0), "Bookings"]}
                    contentStyle={{
                      fontSize: "12px",
                      borderRadius: "8px",
                      border: "1px solid #E6E4DF",
                      boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
                      fontFamily: "'DM Sans', sans-serif",
                    }}
                    cursor={{ fill: "rgba(181,72,75,0.04)" }}
                  />
                  <Bar dataKey="count" radius={[0, 4, 4, 0]} barSize={18}>
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
            <div style={chartLabelStyle}>
              <PieChartIcon size={13} color="#5F6577" />
              <span>Revenue by Service</span>
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
                    strokeWidth={0}
                  >
                    {revenueByService.map((_, i) => (
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
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function StatTile({
  label,
  sublabel,
  value,
  accent,
  small,
  loading,
}: {
  label: string;
  sublabel?: string;
  value: string;
  accent?: boolean;
  small?: boolean;
  loading?: boolean;
}) {
  return (
    <div style={statTileStyle}>
      <div style={{ marginBottom: "6px" }}>
        <div style={{
          fontSize: "10px",
          fontWeight: 600,
          color: "#5F6577",
          textTransform: "uppercase",
          letterSpacing: "0.06em",
          fontFamily: "'DM Sans', sans-serif",
        }}>
          {label}
        </div>
        {sublabel && (
          <div style={{ fontSize: "10px", color: "#9CA3B4", marginTop: "1px" }}>
            {sublabel}
          </div>
        )}
      </div>
      {loading ? (
        <Skeleton style={{ height: small ? "16px" : "22px", width: "75%" }} />
      ) : (
        <div style={{
          fontSize: small ? "13px" : "18px",
          fontWeight: 700,
          color: accent ? "#b5484b" : "#1A1D23",
          lineHeight: 1.2,
          fontFamily: "'Space Grotesk', sans-serif",
          letterSpacing: "-0.01em",
        }}>
          {value}
        </div>
      )}
    </div>
  );
}

const cardHeaderStyle: React.CSSProperties = {
  padding: "16px 20px",
  borderBottom: "1px solid #E6E4DF",
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  flexWrap: "wrap",
  gap: "12px",
};

const chartLabelStyle: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: "6px",
  fontSize: "12px",
  fontWeight: 600,
  color: "#5F6577",
  marginBottom: "12px",
  fontFamily: "'DM Sans', sans-serif",
};

const statTileStyle: React.CSSProperties = {
  background: "#F8F8F6",
  border: "1px solid #E6E4DF",
  borderRadius: "8px",
  padding: "12px 14px",
};