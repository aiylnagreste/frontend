"use client";

import { useQuery } from "@tanstack/react-query";
import { fetchBookings, fetchBranches, fetchGeneral, fetchStaffIncome, QK } from "@/lib/queries";
import type { Booking, Branch, StaffIncomeResponse } from "@/lib/types";
import { useState } from "react";
import {
  Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend,
} from "recharts";
import { Card, CardHeader, CardContent } from "@/components/ui/Card";
import { Skeleton } from "@/components/ui/Skeleton";
import { EmptyState } from "@/components/ui/EmptyState";
import { ModalShell } from "@/components/ui/ModalShell";
import { CHART_COLORS, formatCurrency } from "@/lib/utils";
import { StaffDrawer } from "@/components/settings/StaffDrawer";
import { Plus, Maximize2 } from "lucide-react";

type Period = "today" | "week" | "month";

function getPeriodDates(period: Period): { dateFrom: string; dateTo: string } {
  const now = new Date();
  const to = now.toISOString().slice(0, 10);
  if (period === "today") return { dateFrom: to, dateTo: to };
  const from = new Date(now);
  if (period === "week") {
    from.setDate(from.getDate() - 6);
  } else {
    from.setDate(1);
  }
  return { dateFrom: from.toISOString().slice(0, 10), dateTo: to };
}

const PERIOD_LABELS: Record<Period, string> = {
  today: "Today",
  week: "This Week",
  month: "This Month",
};

export default function StaffPage() {
  const [branchFilter, setBranchFilter] = useState("");
  const [period, setPeriod] = useState<Period>("today");
  const [drawerOpen, setDrawerOpen] = useState(false);
  
  // Modal states
  const [completedModalData, setCompletedModalData] = useState<{ branchName: string; data: any[]; total: number } | null>(null);
  const [requestedModalData, setRequestedModalData] = useState<{ branchName: string; data: any[]; total: number } | null>(null);

  const { data: branches = [] } = useQuery<Branch[]>({
    queryKey: QK.branches(),
    queryFn: fetchBranches,
    staleTime: 10 * 60_000,
  });

  const { data: bookings = [], isLoading } = useQuery<Booking[]>({
    queryKey: QK.bookings({}),
    queryFn: () => fetchBookings(),
    staleTime: 0,
  });

  const { data: general } = useQuery({
    queryKey: QK.general(),
    queryFn: fetchGeneral,
    staleTime: 10 * 60_000,
  });
  const currency = general?.currency ?? "Rs.";

  const { data: staffIncome } = useQuery<StaffIncomeResponse>({
    queryKey: QK.staffIncome(),
    queryFn: () => fetchStaffIncome(),
    staleTime: 60_000,
  });

  const incomeByStaffName = (staffIncome?.rows ?? []).reduce<Record<string, number>>(
    (acc, r) => {
      acc[r.staff_name] = Number(r.tips_total) || 0;
      return acc;
    },
    {},
  );

  const filteredBranches = branchFilter
    ? branches.filter((b) => b.name === branchFilter)
    : branches;

  const { dateFrom, dateTo } = getPeriodDates(period);

  const periodBookings = bookings.filter(
    (b) =>
      b.staff_name &&
      b.date >= dateFrom &&
      b.date <= dateTo &&
      (b.status === "confirmed" || b.status === "completed"),
  );

  const completedInRange = periodBookings.filter(
    (b) => b.status === "completed",
  );

  const requestedInRange = periodBookings.filter((b) => b.staffRequested);

  // --- Design System Styles ---
  const selectStyle: React.CSSProperties = {
    padding: "0 12px",
    height: "32px",
    border: "1px solid #E6E4DF",
    borderRadius: "8px",
    fontSize: "13px",
    background: "#fff",
    cursor: "pointer",
    color: "#1A1D23",
    fontFamily: "'DM Sans', sans-serif",
    outline: "none",
    transition: "border-color 0.2s, box-shadow 0.2s",
  };

  const tooltipStyle: React.CSSProperties = {
    fontSize: "12px",
    borderRadius: "8px",
    border: "1px solid #E6E4DF",
    boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
    fontFamily: "'DM Sans', sans-serif",
  };

  const expandIconOverlay: React.CSSProperties = {
    position: "absolute",
    bottom: "8px",
    right: "8px",
    background: "rgba(0,0,0,0.6)",
    borderRadius: "6px",
    padding: "4px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    opacity: 0.7,
    transition: "opacity 0.2s",
  };

  const modalSummaryStyle: React.CSSProperties = {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "16px 20px",
    background: "#F8F8F6",
    borderRadius: "10px",
    marginBottom: "20px",
  };

  const modalSummaryLabel: React.CSSProperties = {
    fontSize: "11px",
    color: "#5F6577",
    marginBottom: "4px",
    fontWeight: 500,
  };

  const modalSummaryValue: React.CSSProperties = {
    fontSize: "22px",
    fontWeight: 700,
    color: "#b5484b",
    fontFamily: "'Space Grotesk', sans-serif",
  };

  const modalTableStyle: React.CSSProperties = {
    width: "100%",
    borderCollapse: "collapse",
  };

  const modalThLeft: React.CSSProperties = {
    textAlign: "left",
    padding: "12px 16px 8px 0",
    color: "#9CA3B4",
    fontWeight: 600,
    fontSize: "11px",
    fontFamily: "'DM Sans', sans-serif",
    borderBottom: "1px solid #E6E4DF",
  };

  const modalThRight: React.CSSProperties = {
    textAlign: "right",
    padding: "12px 0 8px 16px",
    color: "#9CA3B4",
    fontWeight: 600,
    fontSize: "11px",
    fontFamily: "'DM Sans', sans-serif",
    borderBottom: "1px solid #E6E4DF",
  };

  const modalTdLeft: React.CSSProperties = {
    padding: "12px 16px 12px 0",
    display: "flex",
    alignItems: "center",
    gap: "10px",
    fontSize: "13px",
    fontFamily: "'DM Sans', sans-serif",
  };

  const modalTdRight: React.CSSProperties = {
    padding: "12px 0 12px 16px",
    textAlign: "right",
    fontWeight: 600,
    color: "#1A1D23",
    fontFamily: "'Space Grotesk', sans-serif",
    fontSize: "13px",
  };

  const modalTfootLeft: React.CSSProperties = {
    padding: "14px 16px 0 0",
    fontWeight: 700,
    color: "#1A1D23",
    fontFamily: "'Space Grotesk', sans-serif",
    fontSize: "13px",
  };

  const modalTfootRight: React.CSSProperties = {
    padding: "14px 0 0 16px",
    textAlign: "right",
    fontWeight: 700,
    color: "#b5484b",
    fontFamily: "'Space Grotesk', sans-serif",
    fontSize: "14px",
  };

  const modalColorDot = (color: string): React.CSSProperties => ({
    width: "10px",
    height: "10px",
    borderRadius: "50%",
    background: color,
    flexShrink: 0,
  });

  const modalServiceName: React.CSSProperties = {
    color: "#1A1D23",
    fontWeight: 500,
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", gap: "16px" }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "4px" }}>
            <div style={{
              width: "32px",
              height: "32px",
              borderRadius: "8px",
              background: "linear-gradient(135deg, rgba(181,72,75,0.12), rgba(107,48,87,0.08))",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "16px",
            }}>
              👥
            </div>
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
              Staff Management
            </h3>
          </div>
          <p style={{ fontSize: "13px", color: "#5F6577", margin: 0, paddingLeft: "40px" }}>
            Track performance, bookings, and availability
          </p>
        </div>
        <button
          onClick={() => setDrawerOpen(true)}
          style={{
            padding: "9px 18px",
            background: "linear-gradient(135deg, #b5484b, #6b3057)",
            color: "#fff",
            border: "none",
            borderRadius: "8px",
            fontSize: "13px",
            fontWeight: 600,
            cursor: "pointer",
            fontFamily: "'DM Sans', sans-serif",
            display: "flex",
            alignItems: "center",
            gap: "7px",
            transition: "opacity 0.2s",
            whiteSpace: "nowrap",
            flexShrink: 0,
          }}
          onMouseEnter={(e) => { e.currentTarget.style.opacity = "0.9"; }}
          onMouseLeave={(e) => { e.currentTarget.style.opacity = "1"; }}
        >
          <Plus size={14} strokeWidth={2.5} />
          Add Staff Member
        </button>
      </div>

      {/* Controls Bar */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: "16px",
          background: "#F9F8F6",
          padding: "14px 18px",
          borderRadius: 12,
          border: "1px solid #E6E4DF",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <label style={{ fontSize: "11px", fontWeight: 600, color: "#5F6577", textTransform: "uppercase", letterSpacing: "0.06em" }}>Branch</label>
          <select
            value={branchFilter}
            onChange={(e) => setBranchFilter(e.target.value)}
            style={selectStyle}
            onFocus={(e) => {
              e.currentTarget.style.borderColor = "#b5484b";
              e.currentTarget.style.boxShadow = "0 0 0 3px rgba(181,72,75,0.1)";
            }}
            onBlur={(e) => {
              e.currentTarget.style.borderColor = "#E6E4DF";
              e.currentTarget.style.boxShadow = "none";
            }}
          >
            <option value="">All Branches</option>
            {branches.map((b) => (
              <option key={b.id} value={b.name}>{b.name}</option>
            ))}
          </select>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <span style={{ fontSize: "11px", fontWeight: 600, color: "#5F6577", textTransform: "uppercase", letterSpacing: "0.06em" }}>Period</span>
          <div style={{ display: "flex", gap: "6px", alignItems: "center" }}>
            {(["today", "week", "month"] as Period[]).map((p) => (
              <button
                key={p}
                onClick={() => setPeriod(p)}
                style={{
                  padding: "0 16px",
                  borderRadius: "8px",
                  fontSize: "13px",
                  fontWeight: period === p ? 600 : 500,
                  height: "32px",
                  border: "none",
                  background: period === p ? "#1A1D23" : "#F4F3F0",
                  color: period === p ? "#fff" : "#5F6577",
                  cursor: "pointer",
                  fontFamily: "'DM Sans', sans-serif",
                  transition: "all 0.2s",
                  boxShadow: period === p ? "0 2px 8px rgba(0,0,0,0.15)" : "none",
                }}
                onMouseEnter={(e) => {
                  if(period !== p) {
                    e.currentTarget.style.background = "#E6E4DF";
                    e.currentTarget.style.color = "#1A1D23";
                  }
                }}
                onMouseLeave={(e) => {
                  if(period !== p) {
                    e.currentTarget.style.background = "#F4F3F0";
                    e.currentTarget.style.color = "#5F6577";
                  }
                }}
              >
                {PERIOD_LABELS[p]}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* 2-column grid of branch cards */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px" }}>
        {filteredBranches.map((branch, branchIndex) => {
          const branchCompleted = completedInRange.filter((b) => b.branch === branch.name);
          const branchPeriod = periodBookings.filter((b) => b.branch === branch.name);
          const branchRequested = requestedInRange.filter((b) => b.branch === branch.name);

          const completedByStaff = branchCompleted.reduce<Record<string, number>>((acc, b) => {
            const key = b.staff_name!;
            acc[key] = (acc[key] ?? 0) + 1;
            return acc;
          }, {});

          const chartData = Object.entries(completedByStaff)
            .sort((a, b) => b[1] - a[1])
            .map(([name, count]) => ({ name, count }));

          const requestedByStaff = branchRequested.reduce<Record<string, number>>((acc, b) => {
            const key = b.staff_name!;
            acc[key] = (acc[key] ?? 0) + 1;
            return acc;
          }, {});

          const requestedChartData = Object.entries(requestedByStaff)
            .sort((a, b) => b[1] - a[1])
            .map(([name, count]) => ({ name, count }));

          const allByStaff = branchPeriod.reduce<Record<string, Booking[]>>((acc, b) => {
            const key = b.staff_name!;
            if (!acc[key]) acc[key] = [];
            acc[key].push(b);
            return acc;
          }, {});

          const staffEntries = Object.entries(allByStaff).sort(
            (a, b) => b[1].filter((x) => x.status === "completed").length - a[1].filter((x) => x.status === "completed").length,
          );

          const totalCompleted = chartData.reduce((sum, d) => sum + d.count, 0);
          const totalRequested = requestedChartData.reduce((sum, d) => sum + d.count, 0);

          return (
            <Card key={branch.id} style={{ background: "#fff", border: "1px solid #E6E4DF", borderRadius: 12, boxShadow: "0 1px 3px rgba(0,0,0,0.04)", overflow: "hidden" }}>
              <CardHeader style={{ borderBottom: "1px solid #E6E4DF", padding: "16px 20px", background: "#F9F8F6" }}>
                <div style={{ 
                  display: "flex", 
                  alignItems: "flex-end", 
                  justifyContent: "space-between",
                  width: "100%"
                }}>
                  <div>
                    <span style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fontSize: "14px", color: "#1A1D23", display: "block", marginBottom: "2px" }}>
                      🏪 {branch.name}
                    </span>
                    <span style={{ fontSize: "11px", color: "#5F6577", fontWeight: 500 }}>
                      {PERIOD_LABELS[period]} · completed & scheduled
                    </span>
                  </div>
                  <div style={{ 
                    fontSize: "11px", 
                    fontWeight: 600, 
                    color: "#fff", 
                    background: "linear-gradient(135deg, #b5484b, #6b3057)", 
                    padding: "4px 10px", 
                    borderRadius: "20px", 
                    boxShadow: "0 2px 8px rgba(181,72,75,0.2)",
                    flexShrink: 0
                  }}>
                    {branchPeriod.length} bookings
                  </div>
                </div>
              </CardHeader>
              
              <CardContent style={{ padding: "20px" }}>
                {isLoading ? (
                  <Skeleton style={{ height: "200px" }} />
                ) : staffEntries.length === 0 ? (
                  <EmptyState icon="📊" title="No bookings in this period" />
                ) : (
                  <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
                    
                    {chartData.length > 0 && (
                      <div>
                        <div
                          style={{
                            background: "#F9F8F6",
                            padding: "12px",
                            borderRadius: 8,
                            border: "1px solid #E6E4DF",
                            cursor: "pointer",
                            position: "relative",
                            width: "100%",
                          }}
                          onClick={() => setCompletedModalData({ branchName: branch.name, data: chartData, total: totalCompleted })}
                        >
                          <ResponsiveContainer width="100%" height={240}>
                            <PieChart>
                              <Pie
                                data={chartData}
                                dataKey="count"
                                nameKey="name"
                                cx="50%"
                                cy="50%"
                                innerRadius={40}
                                outerRadius={80}
                                paddingAngle={2}
                                labelLine={false}
                              >
                                {chartData.map((_, i) => (
                                  <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                                ))}
                              </Pie>
                              <Tooltip
                                formatter={(v: unknown) => [String(v ?? 0), "Completed"]}
                                contentStyle={tooltipStyle}
                              />
                              <Legend
                                verticalAlign="bottom"
                                iconSize={10}
                                wrapperStyle={{ fontSize: 11, color: "#5F6577" }}
                              />
                            </PieChart>
                          </ResponsiveContainer>
                          <div style={expandIconOverlay}>
                            <Maximize2 size={12} color="#fff" />
                          </div>
                        </div>
                      </div>
                    )}

                    {requestedChartData.length > 0 && (
                      <div>
                        <div style={{ fontSize: "10px", fontWeight: 600, color: "#5F6577", marginBottom: "8px", textTransform: "uppercase", letterSpacing: "0.06em" }}>
                          Most Requested
                        </div>
                        <div
                          style={{ background: "#F9F8F6", padding: "12px", borderRadius: 8, border: "1px solid #E6E4DF", cursor: "pointer", position: "relative" }}
                          onClick={() => setRequestedModalData({ branchName: branch.name, data: requestedChartData, total: totalRequested })}
                        >
                          <ResponsiveContainer width="100%" height={220}>
                            <PieChart>
                              <Pie
                                data={requestedChartData}
                                dataKey="count"
                                nameKey="name"
                                cx="50%"
                                cy="50%"
                                innerRadius={35}
                                outerRadius={70}
                                paddingAngle={2}
                                labelLine={false}
                              >
                                {requestedChartData.map((_, i) => (
                                  <Cell key={i} fill={CHART_COLORS[(i + 2) % CHART_COLORS.length]} />
                                ))}
                              </Pie>
                              <Tooltip
                                formatter={(v: unknown) => [String(v ?? 0), "Requests"]}
                                contentStyle={tooltipStyle}
                              />
                              <Legend
                                verticalAlign="bottom"
                                iconSize={10}
                                wrapperStyle={{ fontSize: 11, color: "#5F6577" }}
                              />
                            </PieChart>
                          </ResponsiveContainer>
                          <div style={expandIconOverlay}>
                            <Maximize2 size={12} color="#fff" />
                          </div>
                        </div>
                      </div>
                    )}

                    <div style={{ borderTop: "1px solid #E6E4DF", paddingTop: "16px", display: "flex", flexDirection: "column", gap: "10px" }}>
                      {staffEntries.map(([staffName, bks]) => {
                        const completedCount = bks.filter((b) => b.status === "completed").length;
                        return (
                          <div
                            key={staffName}
                            style={{
                              border: "1px solid #E6E4DF",
                              borderRadius: 10,
                              padding: "12px 16px",
                              background: "#fff",
                              transition: "box-shadow 0.2s",
                            }}
                            onMouseEnter={(e) => e.currentTarget.style.boxShadow = "0 2px 8px rgba(0,0,0,0.04)"}
                            onMouseLeave={(e) => e.currentTarget.style.boxShadow = "none"}
                          >
                            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "8px", gap: "8px", flexWrap: "wrap" }}>
                              <span style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 600, fontSize: "13px", color: "#1A1D23" }}>{staffName}</span>
                              <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                                <span
                                  title="Monthly income from tips"
                                  style={{
                                    fontSize: "11px",
                                    color: "#92400E",
                                    background: "#FEF3C7",
                                    border: "1px solid #FDE68A",
                                    borderRadius: "20px",
                                    padding: "3px 10px",
                                    fontWeight: 600,
                                    fontFamily: "'DM Sans', sans-serif",
                                  }}
                                >
                                  {incomeByStaffName[staffName] != null
                                    ? `${formatCurrency(incomeByStaffName[staffName], currency)} tips`
                                    : "— tips"}
                                </span>
                                {completedCount > 0 && (
                                  <span style={{ fontSize: "11px", color: "#5F6577", background: "#F4F3F0", border: "1px solid #E6E4DF", borderRadius: "20px", padding: "3px 10px", fontWeight: 500 }}>
                                    {completedCount} completed
                                  </span>
                                )}
                              </div>
                            </div>
                            <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                              {[...bks]
                                .sort((a, b) => {
                                  if (a.date !== b.date) return a.date.localeCompare(b.date);
                                  return a.time.localeCompare(b.time);
                                })
                                .map((b) => (
                                  <div
                                    key={b.id}
                                    style={{
                                      fontSize: "12px",
                                      color: b.status === "completed" ? "#6b3057" : "#5F6577",
                                      display: "flex",
                                      gap: "6px",
                                      alignItems: "baseline",
                                      lineHeight: 1.5,
                                    }}
                                  >
                                    {dateFrom !== dateTo && (
                                      <span style={{ color: "#9CA3B4", fontSize: "11px", flexShrink: 0 }}>
                                        {b.date} ·
                                      </span>
                                    )}
                                    <span style={{ fontWeight: 500 }}>
                                      {b.time} – {b.endTime ?? "?"}
                                    </span>
                                    <span style={{ color: "#9CA3B4" }}>·</span>
                                    <span>{b.service}</span>
                                    <span style={{ color: "#9CA3B4" }}>·</span>
                                    <span>{b.customer_name}</span>
                                  </div>
                                ))}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Completed Bookings Modal */}
      {completedModalData && (
        <ModalShell
          open={!!completedModalData}
          onClose={() => setCompletedModalData(null)}
          title={`Completed Bookings - ${completedModalData.branchName}`}
          width={500}
        >
          <div style={{ padding: "4px 0" }}>
            <div style={modalSummaryStyle}>
              <div>
                <div style={modalSummaryLabel}>Total Completed</div>
                <div style={modalSummaryValue}>{completedModalData.total}</div>
              </div>
              <div>
                <div style={modalSummaryLabel}>Staff Members</div>
                <div style={modalSummaryValue}>{completedModalData.data.length}</div>
              </div>
            </div>

            <div style={{ maxHeight: "400px", overflowY: "auto" }}>
              <table style={modalTableStyle}>
                <thead>
                  <tr>
                    <th style={modalThLeft}>Staff Member</th>
                    <th style={modalThRight}>Completed</th>
                    <th style={modalThRight}>%</th>
                  </tr>
                </thead>
                <tbody>
                  {completedModalData.data.map((row, i) => (
                    <tr key={i} style={{ borderTop: "1px solid #F0EEED" }}>
                      <td style={modalTdLeft}>
                        <span style={modalColorDot(CHART_COLORS[i % CHART_COLORS.length])} />
                        <span style={modalServiceName}>{row.name}</span>
                      </td>
                      <td style={modalTdRight}>{row.count}</td>
                      <td style={modalTdRight}>{((row.count / completedModalData.total) * 100).toFixed(1)}%</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr style={{ borderTop: "2px solid #E6E4DF" }}>
                    <td style={modalTfootLeft}>Total</td>
                    <td style={modalTfootRight}>{completedModalData.total}</td>
                    <td style={{ padding: "14px 0 0 0" }} />
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        </ModalShell>
      )}

      {/* Most Requested Modal */}
      {requestedModalData && (
        <ModalShell
          open={!!requestedModalData}
          onClose={() => setRequestedModalData(null)}
          title={`Most Requested Staff - ${requestedModalData.branchName}`}
          width={500}
        >
          <div style={{ padding: "4px 0" }}>
            <div style={modalSummaryStyle}>
              <div>
                <div style={modalSummaryLabel}>Total Requests</div>
                <div style={modalSummaryValue}>{requestedModalData.total}</div>
              </div>
              <div>
                <div style={modalSummaryLabel}>Staff Members</div>
                <div style={modalSummaryValue}>{requestedModalData.data.length}</div>
              </div>
            </div>

            <div style={{ maxHeight: "400px", overflowY: "auto" }}>
              <table style={modalTableStyle}>
                <thead>
                  <tr>
                    <th style={modalThLeft}>Staff Member</th>
                    <th style={modalThRight}>Requests</th>
                    <th style={modalThRight}>%</th>
                  </tr>
                </thead>
                <tbody>
                  {requestedModalData.data.map((row, i) => (
                    <tr key={i} style={{ borderTop: "1px solid #F0EEED" }}>
                      <td style={modalTdLeft}>
                        <span style={modalColorDot(CHART_COLORS[(i + 2) % CHART_COLORS.length])} />
                        <span style={modalServiceName}>{row.name}</span>
                      </td>
                      <td style={modalTdRight}>{row.count}</td>
                      <td style={modalTdRight}>{((row.count / requestedModalData.total) * 100).toFixed(1)}%</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr style={{ borderTop: "2px solid #E6E4DF" }}>
                    <td style={modalTfootLeft}>Total</td>
                    <td style={modalTfootRight}>{requestedModalData.total}</td>
                    <td style={{ padding: "14px 0 0 0" }} />
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        </ModalShell>
      )}

      <StaffDrawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        editing={null}
      />
    </div>
  );
}