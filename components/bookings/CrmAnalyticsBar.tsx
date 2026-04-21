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
} from "recharts";
import { Card, CardContent } from "@/components/ui/Card";
import { Skeleton } from "@/components/ui/Skeleton";
import { EmptyState } from "@/components/ui/EmptyState";
import { ModalShell } from "@/components/ui/ModalShell";
import { CHART_COLORS, formatCurrency } from "@/lib/utils";
import { BarChart3, PieChart as PieChartIcon, TrendingUp, Maximize2 } from "lucide-react";

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
  const [showBookingsModal, setShowBookingsModal] = useState(false);
  const [showRevenueModal, setShowRevenueModal] = useState(false);

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
  
  const totalRevenue = revenueByService.reduce((sum, s) => sum + s.revenue, 0);
  const totalBookings = topServices.reduce((sum, s) => sum + s.count, 0);

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
              sublabel="Confirmed"
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
          </div>

          {/* Most Booked Services — Horizontal Bar with Modal */}
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
              <>
                {/* Clickable Chart */}
                <div 
                  onClick={() => setShowBookingsModal(true)}
                  style={{ cursor: "pointer", position: "relative" }}
                >
                  <div style={{ 
                    height: `${Math.min(180, Math.max(140, topServices.length * 24))}px`
                  }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={topServices}
                        layout="vertical"
                        margin={{ left: 0, right: 16, top: 0, bottom: 0 }}
                      >
                        <XAxis 
                          type="number" 
                          tick={{ fontSize: 10, fill: "#5F6577" }} 
                          axisLine={false} 
                          tickLine={false}
                          tickFormatter={(value) => value === 0 ? '' : Math.round(value).toString()}
                          allowDecimals={false}
                        />
                        <YAxis
                          type="category"
                          dataKey="name"
                          width={110}
                          tick={{ fontSize: 10, fill: "#1A1D23" }}
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
                        <Bar dataKey="count" radius={[0, 4, 4, 0]} barSize={16}>
                          {topServices.map((_, i) => (
                            <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                  
                  {/* Expand icon overlay */}
                  <div style={{
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
                  }}>
                    <Maximize2 size={12} color="#fff" />
                  </div>
                </div>

                {/* Simple Total Display */}
                <div style={{
                  marginTop: "30px",
                  padding: "10px 14px",
                  background: "#F8F8F6",
                  borderRadius: "8px",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}>
                  <span style={{
                    fontSize: "11px",
                    fontWeight: 600,
                    color: "#5F6577",
                    fontFamily: "'DM Sans', sans-serif",
                  }}>
                    Total Bookings
                  </span>
                  <span style={{
                    fontSize: "16px",
                    fontWeight: 700,
                    color: "#b5484b",
                    fontFamily: "'Space Grotesk', sans-serif",
                  }}>
                    {totalBookings}
                  </span>
                </div>

                {/* View Details Link */}
                <div style={{ textAlign: "center", marginTop: "8px" }}>
                  <button
                    onClick={() => setShowBookingsModal(true)}
                    style={{
                      background: "none",
                      border: "none",
                      fontSize: "11px",
                      color: "#b5484b",
                      fontWeight: 500,
                      cursor: "pointer",
                      fontFamily: "'DM Sans', sans-serif",
                      textDecoration: "underline",
                      textUnderlineOffset: "3px",
                    }}
                  >
                    View all {topServices.length} services →
                  </button>
                </div>
              </>
            )}
          </div>

          {/* Revenue by Service — Clickable Donut with Modal */}
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
              <>
                {/* Clickable Chart */}
                <div 
                  onClick={() => setShowRevenueModal(true)}
                  style={{ cursor: "pointer", position: "relative" }}
                >
                  <ResponsiveContainer width="100%" height={160}>
                    <PieChart>
                      <Pie
                        data={revenueByService}
                        dataKey="revenue"
                        nameKey="name"
                        cx="50%"
                        cy="50%"
                        innerRadius={35}
                        outerRadius={55}
                        paddingAngle={2}
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
                    </PieChart>
                  </ResponsiveContainer>
                  
                  {/* Expand icon overlay */}
                  <div style={{
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
                  }}>
                    <Maximize2 size={12} color="#fff" />
                  </div>
                </div>

                {/* Simple Total Display */}
                <div style={{
                  marginTop: "12px",
                  padding: "10px 14px",
                  background: "#F8F8F6",
                  borderRadius: "8px",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}>
                  <span style={{
                    fontSize: "11px",
                    fontWeight: 600,
                    color: "#5F6577",
                    fontFamily: "'DM Sans', sans-serif",
                  }}>
                    Total Revenue
                  </span>
                  <span style={{
                    fontSize: "16px",
                    fontWeight: 700,
                    color: "#b5484b",
                    fontFamily: "'Space Grotesk', sans-serif",
                  }}>
                    {formatCurrency(totalRevenue, currency)}
                  </span>
                </div>

                {/* View Details Link */}
                <div style={{ textAlign: "center", marginTop: "8px" }}>
                  <button
                    onClick={() => setShowRevenueModal(true)}
                    style={{
                      background: "none",
                      border: "none",
                      fontSize: "11px",
                      color: "#b5484b",
                      fontWeight: 500,
                      cursor: "pointer",
                      fontFamily: "'DM Sans', sans-serif",
                      textDecoration: "underline",
                      textUnderlineOffset: "3px",
                    }}
                  >
                    View all {revenueByService.length} services →
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </CardContent>

      {/* Bookings Detail Modal */}
      <ModalShell
        open={showBookingsModal}
        onClose={() => setShowBookingsModal(false)}
        title="Most Booked Services"
        width={560}
      >
        <div style={{ padding: "4px 0" }}>
          {/* Summary Stats */}
          <div style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            padding: "16px 20px",
            background: "#F8F8F6",
            borderRadius: "10px",
            marginBottom: "20px",
          }}>
            <div>
              <div style={{ fontSize: "11px", color: "#5F6577", marginBottom: "4px", fontWeight: 500 }}>
                Total Bookings
              </div>
              <div style={{ fontSize: "22px", fontWeight: 700, color: "#b5484b", fontFamily: "'Space Grotesk', sans-serif" }}>
                {totalBookings}
              </div>
            </div>
            <div>
              <div style={{ fontSize: "11px", color: "#5F6577", marginBottom: "4px", fontWeight: 500 }}>
                Total Services
              </div>
              <div style={{ fontSize: "22px", fontWeight: 700, color: "#1A1D23", fontFamily: "'Space Grotesk', sans-serif" }}>
                {topServices.length}
              </div>
            </div>
          </div>

          {/* Scrollable Table */}
          <div style={{ 
            maxHeight: "400px", 
            overflowY: "auto",
          }}>
            <table style={{ 
  width: "100%", 
  borderCollapse: "collapse",
}}>
  <thead>
    <tr style={{ 
      position: "sticky", 
      top: 0, 
      background: "#fff", 
      zIndex: 1,
    }}>
      <th style={{
        textAlign: "left",
        padding: "10px 0 8px 0",
        color: "#9CA3B4",
        fontWeight: 600,
        fontSize: "11px",
        fontFamily: "'DM Sans', sans-serif",
        borderBottom: "1px solid #E6E4DF",
      }}>
        Service
      </th>
      <th style={{
        textAlign: "right",
        padding: "10px 0 8px 0",
        color: "#9CA3B4",
        fontWeight: 600,
        fontSize: "11px",
        fontFamily: "'DM Sans', sans-serif",
        borderBottom: "1px solid #E6E4DF",
      }}>
        Bookings
      </th>
      <th style={{
        textAlign: "right",
        padding: "10px 0 8px 0",
        color: "#9CA3B4",
        fontWeight: 600,
        fontSize: "11px",
        fontFamily: "'DM Sans', sans-serif",
        borderBottom: "1px solid #E6E4DF",
      }}>
        %
      </th>
    </tr>
  </thead>
  <tbody>
    {topServices.map((row, i) => (
      <tr key={i} style={{ borderBottom: "1px solid #F0EEED" }}>
        <td style={{
          padding: "10px 0",
          display: "flex",
          alignItems: "center",
          gap: "8px",
          fontSize: "13px",
          fontFamily: "'DM Sans', sans-serif",
        }}>
          <span style={{
            width: "8px",
            height: "8px",
            borderRadius: "50%",
            background: CHART_COLORS[i % CHART_COLORS.length],
            flexShrink: 0,
          }} />
          <span style={{ 
            color: "#1A1D23",
            fontWeight: 500,
          }}>
            {row.name}
          </span>
        </td>
        <td style={{
          padding: "10px 0",
          textAlign: "right",
          fontWeight: 600,
          color: "#1A1D23",
          fontFamily: "'Space Grotesk', sans-serif",
          fontSize: "13px",
        }}>
          {row.count}
        </td>
        <td style={{
          padding: "10px 0",
          textAlign: "right",
          color: "#9CA3B4",
          fontFamily: "'Space Grotesk', sans-serif",
          fontSize: "13px",
        }}>
          {((row.count / totalBookings) * 100).toFixed(1)}%
        </td>
      </tr>
    ))}
  </tbody>
  <tfoot>
    <tr style={{ borderTop: "2px solid #E6E4DF" }}>
      <td style={{
        padding: "12px 0 0 0",
        fontWeight: 700,
        color: "#1A1D23",
        fontFamily: "'Space Grotesk', sans-serif",
        fontSize: "13px",
      }}>
        Total
      </td>
      <td style={{
        padding: "12px 0 0 0",
        textAlign: "right",
        fontWeight: 700,
        color: "#b5484b",
        fontFamily: "'Space Grotesk', sans-serif",
        fontSize: "14px",
      }}>
        {totalBookings}
      </td>
      <td style={{ padding: "12px 0 0 0" }} />
    </tr>
  </tfoot>
</table>
          </div>
        </div>
      </ModalShell>

      {/* Revenue Detail Modal */}
      <ModalShell
        open={showRevenueModal}
        onClose={() => setShowRevenueModal(false)}
        title="Revenue by Service"
        width={560}
      >
        <div style={{ padding: "4px 0" }}>
          {/* Summary Stats */}
          <div style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            padding: "16px 20px",
            background: "#F8F8F6",
            borderRadius: "10px",
            marginBottom: "20px",
          }}>
            <div>
              <div style={{ fontSize: "11px", color: "#5F6577", marginBottom: "4px", fontWeight: 500 }}>
                Total Revenue
              </div>
              <div style={{ fontSize: "22px", fontWeight: 700, color: "#b5484b", fontFamily: "'Space Grotesk', sans-serif" }}>
                {formatCurrency(totalRevenue, currency)}
              </div>
            </div>
            <div>
              <div style={{ fontSize: "11px", color: "#5F6577", marginBottom: "4px", fontWeight: 500 }}>
                Total Services
              </div>
              <div style={{ fontSize: "22px", fontWeight: 700, color: "#1A1D23", fontFamily: "'Space Grotesk', sans-serif" }}>
                {revenueByService.length}
              </div>
            </div>
          </div>

          {/* Scrollable Table */}
          <div style={{ 
            maxHeight: "400px", 
            overflowY: "auto",
          }}>
            <table style={{ 
              width: "100%", 
              borderCollapse: "collapse",
            }}>
              <thead>
                <tr style={{ 
                  position: "sticky", 
                  top: 0, 
                  background: "#fff", 
                  zIndex: 1,
                }}>
                  <th style={{
                    textAlign: "left",
                    padding: "12px 16px 8px 0",
                    color: "#9CA3B4",
                    fontWeight: 600,
                    fontSize: "11px",
                    fontFamily: "'DM Sans', sans-serif",
                    borderBottom: "1px solid #E6E4DF",
                  }}>
                    Service
                  </th>
                  <th style={{
                    textAlign: "right",
                    padding: "12px 0 8px 16px",
                    color: "#9CA3B4",
                    fontWeight: 600,
                    fontSize: "11px",
                    fontFamily: "'DM Sans', sans-serif",
                    borderBottom: "1px solid #E6E4DF",
                  }}>
                    Revenue
                  </th>
                  <th style={{
                    textAlign: "right",
                    padding: "12px 0 8px 16px",
                    color: "#9CA3B4",
                    fontWeight: 600,
                    fontSize: "11px",
                    fontFamily: "'DM Sans', sans-serif",
                    borderBottom: "1px solid #E6E4DF",
                  }}>
                    %
                  </th>
                 </tr>
              </thead>
              <tbody>
                {revenueByService.map((row, i) => (
                  <tr key={i} style={{ borderTop: "1px solid #F0EEED" }}>
                    <td style={{
                      padding: "12px 16px 12px 0",
                      display: "flex",
                      alignItems: "center",
                      gap: "10px",
                      fontSize: "13px",
                      fontFamily: "'DM Sans', sans-serif",
                    }}>
                      <span style={{
                        width: "10px",
                        height: "10px",
                        borderRadius: "50%",
                        background: CHART_COLORS[i % CHART_COLORS.length],
                        flexShrink: 0,
                      }} />
                      <span style={{ 
                        color: "#1A1D23",
                        fontWeight: 500,
                      }}>
                        {row.name}
                      </span>
                     </td>
                    <td style={{
                      padding: "12px 0 12px 16px",
                      textAlign: "right",
                      fontWeight: 600,
                      color: "#1A1D23",
                      fontFamily: "'Space Grotesk', sans-serif",
                      fontSize: "13px",
                    }}>
                      {formatCurrency(row.revenue, currency)}
                     </td>
                    <td style={{
                      padding: "12px 0 12px 16px",
                      textAlign: "right",
                      color: "#9CA3B4",
                      fontFamily: "'Space Grotesk', sans-serif",
                      fontSize: "13px",
                    }}>
                      {((row.revenue / totalRevenue) * 100).toFixed(1)}%
                     </td>
                   </tr>
                ))}
              </tbody>
              <tfoot>
                <tr style={{ borderTop: "2px solid #E6E4DF" }}>
                  <td style={{
                    padding: "14px 16px 0 0",
                    fontWeight: 700,
                    color: "#1A1D23",
                    fontFamily: "'Space Grotesk', sans-serif",
                    fontSize: "13px",
                  }}>
                    Total
                   </td>
                  <td style={{
                    padding: "14px 0 0 16px",
                    textAlign: "right",
                    fontWeight: 700,
                    color: "#b5484b",
                    fontFamily: "'Space Grotesk', sans-serif",
                    fontSize: "14px",
                  }}>
                    {formatCurrency(totalRevenue, currency)}
                   </td>
                  <td style={{ padding: "14px 0 0 16px" }} />
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      </ModalShell>
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