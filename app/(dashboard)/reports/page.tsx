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
import {
  BarChart3,
  PieChart as PieChartIcon,
  ClipboardList,
  TrendingUp,
  SlidersHorizontal,
  X,
} from "lucide-react";

type Period = "day" | "week" | "month" | "year";

const PERIODS: { id: Period; label: string }[] = [
  { id: "day", label: "Today" },
  { id: "week", label: "This Week" },
  { id: "month", label: "This Month" },
  { id: "year", label: "This Year" },
];

const STATUS_META: Record<string, { label: string; color: string }> = {
  completed: { label: "Completed", color: "#22c55e" },
  confirmed: { label: "Confirmed", color: "#3b82f6" },
  canceled: { label: "Canceled", color: "#ef4444" },
  no_show: { label: "Missed", color: "#f97316" },
};

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
  const revenueByService = (analytics?.revenueByService ?? [])
    .filter((s) => s.name && s.revenue > 0)
    .slice(0, 8);

  const statusData = Object.entries(analytics?.bookingsByStatus ?? {})
    .map(([status, count]) => ({
      name: STATUS_META[status]?.label ?? status,
      value: count,
      color: STATUS_META[status]?.color ?? "#94a3b8",
    }))
    .filter((s) => s.value > 0)
    .sort((a, b) => b.value - a.value);

  const statusTotal = statusData.reduce((t, x) => t + x.value, 0);

  function selectPeriod(p: Period) {
    setPeriod(p);
    setShowCustomRange(false);
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", flexWrap: "wrap", gap: "16px" }}>
        <div>
          <h3
            style={{
              fontSize: "20px",
              fontWeight: 700,
              margin: 0,
              fontFamily: "'Space Grotesk', sans-serif",
              color: "#1A1D23",
              letterSpacing: "-0.02em",
            }}
          >
            Reports
          </h3>
          <p style={{ fontSize: "13px", color: "#5F6577", margin: "4px 0 0" }}>
            Analyze your salon&apos;s performance and revenue
          </p>
        </div>
      </div>

      {/* Filters row */}
      <div style={{ display: "flex", gap: "10px", alignItems: "center", flexWrap: "wrap" }}>
        {/* Branch select */}
        <select
          value={branch}
          onChange={(e) => setBranch(e.target.value)}
          style={{
            ...filterInputStyle,
            paddingRight: "36px",
            cursor: "pointer",
            appearance: "none",
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='10' height='6' viewBox='0 0 10 6' fill='none' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M1 1L5 5L9 1' stroke='%235F6577' stroke-width='1.5' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E")`,
            backgroundRepeat: "no-repeat",
            backgroundPosition: "right 12px center",
          }}
          onFocus={(e) => {
            e.target.style.borderColor = "#b5484b";
            e.target.style.boxShadow = "0 0 0 3px rgba(181,72,75,0.1)";
          }}
          onBlur={(e) => {
            e.target.style.borderColor = "#E6E4DF";
            e.target.style.boxShadow = "none";
          }}
        >
          <option value="">All Branches</option>
          {branches.map((b) => (
            <option key={b.id} value={b.name}>
              {b.name}
            </option>
          ))}
        </select>

        {/* Period tabs + custom range */}
        <div style={{ display: "flex", gap: "6px", alignItems: "center" }}>
          <div
            style={{
              display: "inline-flex",
              background: "#F8F8F6",
              borderRadius: "8px",
              padding: "3px",
              border: "1px solid #E6E4DF",
            }}
          >
            {PERIODS.map((p) => {
              const isActive = !showCustomRange && period === p.id;
              return (
                <button
                  key={p.id}
                  onClick={() => selectPeriod(p.id)}
                  style={{
                    padding: "6px 14px",
                    fontSize: "12px",
                    fontWeight: isActive ? 600 : 500,
                    borderRadius: "6px",
                    border: "none",
                    background: isActive ? "#fff" : "transparent",
                    color: isActive ? "#1A1D23" : "#5F6577",
                    cursor: "pointer",
                    fontFamily: "'DM Sans', sans-serif",
                    boxShadow: isActive ? "0 1px 3px rgba(0,0,0,0.06)" : "none",
                    transition: "all 0.15s",
                  }}
                >
                  {p.label}
                </button>
              );
            })}
          </div>

          {/* Custom range toggle */}
          <div ref={rangeDropdownRef} style={{ position: "relative" }}>
            <button
              onClick={() => setShowCustomRange((v) => !v)}
              title="Custom date range"
              style={{
                padding: "6px 10px",
                borderRadius: "6px",
                fontSize: "12px",
                fontWeight: 500,
                border: showCustomRange ? "1.5px solid #b5484b" : "1px solid #E6E4DF",
                background: showCustomRange ? "rgba(181,72,75,0.08)" : "#fff",
                color: showCustomRange ? "#b5484b" : "#5F6577",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: "5px",
                fontFamily: "'DM Sans', sans-serif",
                transition: "all 0.15s",
              }}
            >
              <SlidersHorizontal size={13} strokeWidth={1.8} />
              {showCustomRange && "Custom"}
            </button>
            {showCustomRange && (
              <div style={customRangeStyle}>
                <input
                  type="date"
                  value={customFrom}
                  onChange={(e) => setCustomFrom(e.target.value)}
                  style={dateInputStyle}
                />
                <span style={{ fontSize: "12px", color: "#9CA3B4" }}>→</span>
                <input
                  type="date"
                  value={customTo}
                  onChange={(e) => setCustomTo(e.target.value)}
                  style={dateInputStyle}
                />
                <button
                  onClick={() => setShowCustomRange(false)}
                  style={closeRangeBtn}
                  onMouseEnter={(e) => { e.currentTarget.style.background = "#F0EEED"; }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }}
                >
                  <X size={12} />
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Summary KPIs */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "14px" }}>
        <KpiTile
          label="Revenue"
          sublabel="Completed bookings"
          value={formatCurrency(analytics?.totalRevenue ?? 0, currency)}
          accent
          loading={isLoading}
        />
        <KpiTile
          label="Bookings"
          sublabel="Completed"
          value={String(analytics?.bookingCount ?? 0)}
          loading={isLoading}
        />
        <KpiTile
          label="Top Service"
          sublabel="By bookings"
          value={analytics?.topServices?.[0]?.name ?? "—"}
          small
          loading={isLoading}
        />
      </div>

      {/* Charts grid */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
        {/* Top Services Bar */}
        <Card>
          <CardHeader>
            <div style={chartHeaderStyle}>
              <BarChart3 size={14} color="#5F6577" />
              <span>Most Booked Services</span>
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton style={{ height: "200px" }} />
            ) : topServices.length === 0 ? (
              <EmptyState icon="📊" title="No data for this period" />
            ) : (
              <ResponsiveContainer width="100%" height={Math.max(160, topServices.length * 30)}>
                <BarChart data={topServices} layout="vertical" margin={{ left: 0, right: 16, top: 0, bottom: 0 }}>
                  <XAxis type="number" tick={{ fontSize: 11, fill: "#5F6577" }} axisLine={false} tickLine={false} />
                  <YAxis type="category" dataKey="name" width={130} tick={{ fontSize: 11, fill: "#1A1D23" }} axisLine={false} tickLine={false} />
                  <Tooltip
                    formatter={(v: unknown) => [String(v ?? 0), "Bookings"]}
                    contentStyle={tooltipStyle}
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
          </CardContent>
        </Card>

        {/* Revenue Pie */}
        <Card>
          <CardHeader>
            <div style={chartHeaderStyle}>
              <PieChartIcon size={14} color="#5F6577" />
              <span>Revenue by Service</span>
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton style={{ height: "200px" }} />
            ) : revenueByService.length === 0 ? (
              <EmptyState icon="💰" title="No revenue data" />
            ) : (
              <ResponsiveContainer width="100%" height={240}>
                <PieChart>
                  <Pie
                    data={revenueByService}
                    dataKey="revenue"
                    nameKey="name"
                    cx="50%"
                    cy="45%"
                    innerRadius={50}
                    outerRadius={80}
                    paddingAngle={3}
                    strokeWidth={0}
                  >
                    {revenueByService.map((_, i) => (
                      <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(v: unknown, name: unknown) => [formatCurrency(v as number, currency), name as string]}
                    contentStyle={tooltipStyle}
                  />
                  <Legend
                    iconType="circle"
                    iconSize={7}
                    wrapperStyle={{ fontSize: "11px", fontFamily: "'DM Sans', sans-serif" }}
                    formatter={(v) => <span style={{ fontSize: "11px", color: "#5F6577" }}>{v}</span>}
                  />
                </PieChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* Booking Status */}
        <Card style={{ gridColumn: "1 / -1" }}>
          <CardHeader>
            <div style={chartHeaderStyle}>
              <ClipboardList size={14} color="#5F6577" />
              <span>Bookings by Status</span>
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton style={{ height: "220px" }} />
            ) : statusData.length === 0 ? (
              <EmptyState icon="📋" title="No booking data for this period" />
            ) : (
              <div style={{ display: "flex", alignItems: "center", gap: "40px", flexWrap: "wrap" }}>
                <ResponsiveContainer width={240} height={220}>
                  <PieChart>
                    <Pie
                      data={statusData}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      innerRadius={55}
                      outerRadius={90}
                      paddingAngle={3}
                      strokeWidth={0}
                    >
                      {statusData.map((s, i) => (
                        <Cell key={i} fill={s.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(v: unknown, name: unknown) => [String(v), name as string]}
                      contentStyle={tooltipStyle}
                    />
                  </PieChart>
                </ResponsiveContainer>
                <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                  {statusData.map((s) => {
                    const pct = statusTotal > 0 ? Math.round((s.value / statusTotal) * 100) : 0;
                    return (
                      <div key={s.name} style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                        <div style={{
                          width: "10px",
                          height: "10px",
                          borderRadius: "50%",
                          background: s.color,
                          flexShrink: 0,
                        }} />
                        <span style={{
                          fontSize: "13px",
                          color: "#1A1D23",
                          fontWeight: 500,
                          minWidth: "90px",
                          fontFamily: "'DM Sans', sans-serif",
                        }}>
                          {s.name}
                        </span>
                        <span style={{
                          fontSize: "14px",
                          color: "#1A1D23",
                          fontWeight: 700,
                          fontFamily: "'Space Grotesk', sans-serif",
                          minWidth: "40px",
                          textAlign: "right",
                        }}>
                          {s.value}
                        </span>
                        <div style={{ flex: 1, maxWidth: "80px" }}>
                          <div style={pctBarOuter}>
                            <div style={{ ...pctBarInner, width: `${pct}%`, background: s.color }} />
                          </div>
                        </div>
                        <span style={{
                          fontSize: "11px",
                          color: "#9CA3B4",
                          fontWeight: 600,
                          minWidth: "36px",
                          textAlign: "right",
                          fontFamily: "'Space Grotesk', sans-serif",
                        }}>
                          {pct}%
                        </span>
                      </div>
                    );
                  })}
                  <div style={{
                    borderTop: "1px solid #E6E4DF",
                    marginTop: "4px",
                    paddingTop: "10px",
                    display: "flex",
                    justifyContent: "space-between",
                  }}>
                    <span style={{ fontSize: "13px", fontWeight: 600, color: "#1A1D23" }}>Total</span>
                    <span style={{
                      fontSize: "14px",
                      fontWeight: 700,
                      color: "#1A1D23",
                      fontFamily: "'Space Grotesk', sans-serif",
                    }}>
                      {statusTotal}
                    </span>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

/* ── KPI Tile ── */

function KpiTile({
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
    <div style={kpiStyle}>
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
        <Skeleton style={{ height: small ? "18px" : "26px", width: "70%" }} />
      ) : (
        <div style={{
          fontSize: small ? "14px" : "24px",
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

/* ── Styles ── */

const filterInputStyle: React.CSSProperties = {
  padding: "8px 14px",
  border: "1px solid #E6E4DF",
  borderRadius: "8px",
  fontSize: "13px",
  background: "#fff",
  color: "#1A1D23",
  outline: "none",
  fontFamily: "'DM Sans', sans-serif",
  transition: "border-color 0.2s, box-shadow 0.2s",
  boxSizing: "border-box",
};

const customRangeStyle: React.CSSProperties = {
  position: "absolute",
  top: "calc(100% + 6px)",
  right: 0,
  background: "#fff",
  border: "1px solid #E6E4DF",
  borderRadius: "10px",
  padding: "10px 14px",
  boxShadow: "0 8px 24px rgba(0,0,0,0.12)",
  display: "flex",
  alignItems: "center",
  gap: "8px",
  zIndex: 50,
  whiteSpace: "nowrap",
};

const dateInputStyle: React.CSSProperties = {
  padding: "6px 10px",
  border: "1px solid #E6E4DF",
  borderRadius: "6px",
  fontSize: "12px",
  background: "#fff",
  color: "#1A1D23",
  outline: "none",
  fontFamily: "'DM Sans', sans-serif",
  transition: "border-color 0.15s",
};

const closeRangeBtn: React.CSSProperties = {
  padding: "5px",
  borderRadius: "5px",
  border: "none",
  background: "transparent",
  cursor: "pointer",
  color: "#9CA3B4",
  display: "flex",
  alignItems: "center",
  transition: "background 0.15s",
};

const chartHeaderStyle: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: "7px",
  fontSize: "12px",
  fontWeight: 600,
  color: "#5F6577",
  fontFamily: "'DM Sans', sans-serif",
};

const tooltipStyle: React.CSSProperties = {
  fontSize: "12px",
  borderRadius: "8px",
  border: "1px solid #E6E4DF",
  boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
  fontFamily: "'DM Sans', sans-serif",
};

const kpiStyle: React.CSSProperties = {
  background: "#F8F8F6",
  border: "1px solid #E6E4DF",
  borderRadius: "10px",
  padding: "18px 20px",
};

const pctBarOuter: React.CSSProperties = {
  height: "4px",
  borderRadius: "2px",
  background: "#E6E4DF",
  overflow: "hidden",
};

const pctBarInner: React.CSSProperties = {
  height: "100%",
  borderRadius: "2px",
  transition: "width 0.4s ease",
};