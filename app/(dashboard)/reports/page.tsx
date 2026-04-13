"use client";

import { useState, useRef, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { fetchAnalytics, fetchBranches, fetchGeneral, QK } from "@/lib/queries";
import type { AnalyticsResponse, Branch } from "@/lib/types";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell,
  PieChart, Pie, Legend,
} from "recharts";
import { Card, CardHeader, CardContent } from "@/components/ui/Card";
import { Skeleton } from "@/components/ui/Skeleton";
import { EmptyState } from "@/components/ui/EmptyState";
import { CHART_COLORS, formatCurrency } from "@/lib/utils";
import { SlidersHorizontal } from "lucide-react";

type Period = "day" | "week" | "month" | "year";

const PERIODS: { id: Period; label: string }[] = [
  { id: "day", label: "Today" },
  { id: "week", label: "This Week" },
  { id: "month", label: "This Month" },
  { id: "year", label: "This Year" },
];

export default function ReportsPage() {
  const [period, setPeriod] = useState<Period>("month");
  const [branch, setBranch] = useState("");
  const today = new Date().toISOString().slice(0, 10);
  const [showCustomRange, setShowCustomRange] = useState(false);
  const [customFrom, setCustomFrom] = useState(today);
  const [customTo, setCustomTo] = useState(today);
  const rangeDropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!showCustomRange) return;
    const handler = (e: MouseEvent) => {
      if (rangeDropdownRef.current && !rangeDropdownRef.current.contains(e.target as Node)) {
        setShowCustomRange(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [showCustomRange]);

  const { data: branches = [] } = useQuery<Branch[]>({
    queryKey: QK.branches(),
    queryFn: fetchBranches,
    staleTime: 10 * 60_000,
  });

  const { data: general } = useQuery({
    queryKey: QK.general(),
    queryFn: fetchGeneral,
    staleTime: 10 * 60_000,
  });
  const currency = general?.currency ?? "Rs.";

  const queryParams = showCustomRange
    ? { from: customFrom, to: customTo, branch: branch || undefined, status: "completed" }
    : { period, branch: branch || undefined, status: "completed" };

  const { data: analytics, isLoading } = useQuery<AnalyticsResponse>({
    queryKey: QK.analytics(queryParams),
    queryFn: () => fetchAnalytics(queryParams),
    staleTime: 2 * 60_000,
  });

  const topServices = (analytics?.topServices ?? []).slice(0, 10);
  const revenueByService = (analytics?.revenueByService ?? []).filter(s => s.name && s.revenue > 0).slice(0, 8);

  const STATUS_META: Record<string, { label: string; color: string }> = {
    completed:  { label: "Completed",  color: "#22c55e" },
    confirmed:  { label: "Confirmed",  color: "#3b82f6" },
    canceled:   { label: "Canceled",   color: "#ef4444" },
    no_show:    { label: "No Show",    color: "#f97316" },
  };
  const statusData = Object.entries(analytics?.bookingsByStatus ?? {})
    .map(([status, count]) => ({
      name: STATUS_META[status]?.label ?? status,
      value: count,
      color: STATUS_META[status]?.color ?? "#94a3b8",
    }))
    .filter(s => s.value > 0)
    .sort((a, b) => b.value - a.value);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "12px" }}>
        <h3 style={{ fontSize: "18px", fontWeight: 700, margin: 0 }}>Reports</h3>
        <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
          <select
            value={branch}
            onChange={(e) => setBranch(e.target.value)}
            style={selectStyle}
          >
            <option value="">All Branches</option>
            {branches.map(b => <option key={b.id} value={b.name}>{b.name}</option>)}
          </select>
          <div style={{ display: "flex", gap: "4px", alignItems: "center" }}>
            <div ref={rangeDropdownRef} style={{ position: "relative" }}>
              <button
                onClick={() => setShowCustomRange((v) => !v)}
                title="Custom date range"
                style={{
                  padding: "6px 10px",
                  borderRadius: "7px",
                  fontSize: "12px",
                  border: showCustomRange ? "1.5px solid var(--color-rose)" : "1.5px solid var(--color-border)",
                  background: showCustomRange ? "var(--color-rose-dim)" : "var(--color-surface)",
                  color: showCustomRange ? "var(--color-rose)" : "var(--color-sub)",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                }}
              >
                <SlidersHorizontal size={14} />
              </button>
              {showCustomRange && (
                <div style={{
                  position: "absolute",
                  top: "calc(100% + 6px)",
                  right: 0,
                  background: "var(--color-surface)",
                  border: "1px solid var(--color-border)",
                  borderRadius: "10px",
                  padding: "12px 16px",
                  boxShadow: "0 4px 20px rgba(0,0,0,0.12)",
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  zIndex: 50,
                  whiteSpace: "nowrap",
                }}>
                  <input
                    type="date"
                    value={customFrom}
                    onChange={(e) => setCustomFrom(e.target.value)}
                    style={{ padding: "6px 10px", border: "1px solid var(--color-border)", borderRadius: "7px", fontSize: "12px", background: "var(--color-canvas)" }}
                  />
                  <span style={{ fontSize: "12px", color: "var(--color-sub)" }}>→</span>
                  <input
                    type="date"
                    value={customTo}
                    onChange={(e) => setCustomTo(e.target.value)}
                    style={{ padding: "6px 10px", border: "1px solid var(--color-border)", borderRadius: "7px", fontSize: "12px", background: "var(--color-canvas)" }}
                  />
                </div>
              )}
            </div>
            {PERIODS.map(p => (
              <button
                key={p.id}
                onClick={() => { setPeriod(p.id); setShowCustomRange(false); }}
                style={{
                  padding: "7px 14px",
                  borderRadius: "7px",
                  fontSize: "12px",
                  fontWeight: 500,
                  border: !showCustomRange && period === p.id ? "1.5px solid var(--color-rose)" : "1.5px solid var(--color-border)",
                  background: !showCustomRange && period === p.id ? "var(--color-rose-dim)" : "var(--color-surface)",
                  color: !showCustomRange && period === p.id ? "var(--color-rose)" : "var(--color-sub)",
                  cursor: "pointer",
                }}
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Summary KPIs */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: "16px" }}>
        <KpiTile label="Revenue (Completed)" value={formatCurrency(analytics?.totalRevenue ?? 0, currency)} color="var(--color-rose)" loading={isLoading} />
        <KpiTile label="Bookings (Completed)" value={String(analytics?.bookingCount ?? 0)} loading={isLoading} />
        <KpiTile label="Top Service" value={analytics?.topServices?.[0]?.name ?? "—"} small loading={isLoading} />
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px" }}>
        {/* Top Services Bar */}
        <Card>
          <CardHeader>
            <span style={{ fontWeight: 600, fontSize: "13px" }}>📊 Most Booked Services</span>
          </CardHeader>
          <CardContent>
            {isLoading ? <Skeleton style={{ height: "200px" }} /> :
             topServices.length === 0 ? <EmptyState icon="📊" title="No data for this period" /> :
            <ResponsiveContainer width="100%" height={Math.max(160, topServices.length * 30)}>
              <BarChart data={topServices} layout="vertical" margin={{ left: 0, right: 16 }}>
                <XAxis type="number" tick={{ fontSize: 11 }} />
                <YAxis type="category" dataKey="name" width={130} tick={{ fontSize: 11 }} />
                <Tooltip formatter={(v: unknown) => [String(v ?? 0), "Bookings"]} contentStyle={{ fontSize: "12px", borderRadius: "8px" }} />
                <Bar dataKey="count" radius={[0, 4, 4, 0]}>
                  {topServices.map((_, i) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>}
          </CardContent>
        </Card>

        {/* Revenue Pie */}
        <Card>
          <CardHeader>
            <span style={{ fontWeight: 600, fontSize: "13px" }}>💰 Revenue by Service</span>
          </CardHeader>
          <CardContent>
            {isLoading ? <Skeleton style={{ height: "200px" }} /> :
             revenueByService.length === 0 ? <EmptyState icon="💰" title="No revenue data" /> :
            <ResponsiveContainer width="100%" height={240}>
              <PieChart>
                <Pie data={revenueByService} dataKey="revenue" nameKey="name" cx="50%" cy="45%" innerRadius={50} outerRadius={80} paddingAngle={3}>
                  {revenueByService.map((_, i) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}
                </Pie>
                <Tooltip formatter={(v: unknown, name: unknown) => [formatCurrency(v as number, currency), name as string]} contentStyle={{ fontSize: "12px", borderRadius: "8px" }} />
                <Legend iconType="circle" iconSize={8} formatter={(v) => <span style={{ fontSize: "11px" }}>{v}</span>} />
              </PieChart>
            </ResponsiveContainer>}
          </CardContent>
        </Card>

        {/* Booking Status Pie */}
        <Card style={{ gridColumn: "1 / -1" }}>
          <CardHeader>
            <span style={{ fontWeight: 600, fontSize: "13px" }}>📋 Bookings by Status</span>
          </CardHeader>
          <CardContent>
            {isLoading ? <Skeleton style={{ height: "220px" }} /> :
             statusData.length === 0 ? <EmptyState icon="📋" title="No booking data for this period" /> :
            <div style={{ display: "flex", alignItems: "center", gap: "32px", flexWrap: "wrap" }}>
              <ResponsiveContainer width={260} height={220}>
                <PieChart>
                  <Pie data={statusData} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={55} outerRadius={90} paddingAngle={3}>
                    {statusData.map((s, i) => <Cell key={i} fill={s.color} />)}
                  </Pie>
                  <Tooltip formatter={(v: unknown, name: unknown) => [String(v), name as string]} contentStyle={{ fontSize: "12px", borderRadius: "8px" }} />
                </PieChart>
              </ResponsiveContainer>
              <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                {statusData.map((s) => (
                  <div key={s.name} style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                    <div style={{ width: "12px", height: "12px", borderRadius: "50%", background: s.color, flexShrink: 0 }} />
                    <span style={{ fontSize: "13px", color: "var(--color-ink)", fontWeight: 500, minWidth: "90px" }}>{s.name}</span>
                    <span style={{ fontSize: "13px", color: "var(--color-sub)", fontWeight: 600 }}>{s.value}</span>
                    <span style={{ fontSize: "11px", color: "var(--color-sub)" }}>
                      ({Math.round(s.value / statusData.reduce((t, x) => t + x.value, 0) * 100)}%)
                    </span>
                  </div>
                ))}
              </div>
            </div>}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function KpiTile({ label, value, color, small, loading }: {
  label: string; value: string; color?: string; small?: boolean; loading?: boolean;
}) {
  return (
    <div style={{ background: "var(--color-surface)", border: "1px solid var(--color-border)", borderRadius: "var(--radius-md)", padding: "20px 24px" }}>
      <div style={{ fontSize: "11px", fontWeight: 600, color: "var(--color-sub)", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "6px" }}>{label}</div>
      {loading ? <Skeleton style={{ height: "28px", width: "60%" }} /> :
      <div style={{ fontSize: small ? "14px" : "26px", fontWeight: 700, color: color ?? "var(--color-ink)" }}>{value}</div>}
    </div>
  );
}

const selectStyle: React.CSSProperties = {
  padding: "7px 12px",
  border: "1px solid var(--color-border)",
  borderRadius: "8px",
  fontSize: "13px",
  background: "var(--color-surface)",
};
