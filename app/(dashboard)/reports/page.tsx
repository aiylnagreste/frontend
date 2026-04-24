"use client";

import { useState, useRef, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  fetchAnalytics,
  fetchBranches,
  fetchGeneral,
  fetchAnalyticsClients,
  fetchInvoiceById,
  QK,
} from "@/lib/queries";
import type {
  AnalyticsResponse,
  Branch,
  AnalyticsClientsResponse,
  Invoice,
} from "@/lib/types";
import {
  Tooltip,
  ResponsiveContainer,
  Cell,
  PieChart,
  Pie,
  Legend,
} from "recharts";
import { Card, CardHeader, CardContent } from "@/components/ui/Card";
import { Skeleton } from "@/components/ui/Skeleton";
import { EmptyState } from "@/components/ui/EmptyState";
import { ModalShell } from "@/components/ui/ModalShell";
import { InvoiceModal } from "@/components/bookings/InvoiceModal";
import { toast } from "sonner";
import { CHART_COLORS, formatCurrency } from "@/lib/utils";
import {
  BarChart3,
  PieChart as PieChartIcon,
  ClipboardList,
  Users,
  SlidersHorizontal,
  X,
  ChevronRight,
  ChevronLeft,
  UserPlus,
  RotateCcw,
  TrendingUp,
  Search,
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

const CLIENTS_PAGE_SIZE = 10;

export default function ReportsPage() {
  const [period, setPeriod] = useState<Period>("month");
  const [branch, setBranch] = useState("");
  const today = new Date().toISOString().slice(0, 10);
  const [showCustomRange, setShowCustomRange] = useState(false);
  const [customFrom, setCustomFrom] = useState(today);
  const [customTo, setCustomTo] = useState(today);
  const rangeDropdownRef = useRef<HTMLDivElement>(null);

  // Modal states
  const [showTopServicesModal, setShowTopServicesModal] = useState(false);
  const [showRevenueModal, setShowRevenueModal] = useState(false);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [showClientsModal, setShowClientsModal] = useState(false);
  const [selectedClient, setSelectedClient] = useState<AnalyticsClientsResponse["clients"][number] | null>(null);
  const [showClientDetailModal, setShowClientDetailModal] = useState(false);

  // Invoice view modal
  const [invoiceToView, setInvoiceToView] = useState<Invoice | null>(null);
  const [invoiceModalOpen, setInvoiceModalOpen] = useState(false);

  // Clients table filter + pagination
  const [clientServiceFilter, setClientServiceFilter] = useState("");
  const [clientsPage, setClientsPage] = useState(1);

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

  // Reset page when filter changes
  useEffect(() => { setClientsPage(1); }, [clientServiceFilter]);

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

  const clientsQueryParams = { ...queryParams, source: "invoices" };
  const { data: clientsData, isLoading: clientsLoading } = useQuery<AnalyticsClientsResponse>({
    queryKey: QK.analyticsClients(clientsQueryParams),
    queryFn: () => fetchAnalyticsClients(clientsQueryParams),
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
  const totalBookings = topServices.reduce((sum, s) => sum + s.count, 0);
  const totalRevenue = revenueByService.reduce((sum, s) => sum + s.revenue, 0);

  const clients = clientsData?.clients ?? [];

  // Collect unique service names for filter dropdown
  const allServiceNames = Array.from(
    new Set(clients.flatMap((c) => c.services.map((s) => s.name)))
  ).sort();

  // Filter clients by selected service
  const filteredClients = clientServiceFilter
    ? clients.filter((c) => c.services.some((s) => s.name === clientServiceFilter))
    : clients;

  // Pagination
  const totalClientPages = Math.max(1, Math.ceil(filteredClients.length / CLIENTS_PAGE_SIZE));
  const pagedClients = filteredClients.slice(
    (clientsPage - 1) * CLIENTS_PAGE_SIZE,
    clientsPage * CLIENTS_PAGE_SIZE
  );

  function selectPeriod(p: Period) {
    setPeriod(p);
    setShowCustomRange(false);
  }

  function openClientDetail(client: AnalyticsClientsResponse["clients"][number]) {
    setSelectedClient(client);
    setShowClientDetailModal(true);
  }

  async function openLatestInvoice(client: AnalyticsClientsResponse["clients"][number]) {
    const latest = client.bookings.find((bk) => bk.invoice_id);
    if (!latest?.invoice_id) {
      openClientDetail(client);
      return;
    }
    try {
      const inv = await fetchInvoiceById(latest.invoice_id);
      setInvoiceToView(inv);
      setInvoiceModalOpen(true);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to load invoice");
    }
  }

  function formatDate(dateStr: string) {
    if (!dateStr) return "—";
    try {
      const d = new Date(dateStr + "T00:00:00");
      return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
    } catch { return dateStr; }
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", flexWrap: "wrap", gap: "16px" }}>
        <div>
          <h3 style={{ fontSize: "20px", fontWeight: 700, margin: 0, fontFamily: "'Space Grotesk', sans-serif", color: "#1A1D23", letterSpacing: "-0.02em" }}>
            Reports
          </h3>
          <p style={{ fontSize: "13px", color: "#5F6577", margin: "4px 0 0" }}>
            Analyze your salon&apos;s performance and revenue
          </p>
        </div>
      </div>

      {/* Filters row */}
      <div style={{ display: "flex", gap: "10px", alignItems: "center", flexWrap: "wrap" }}>
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
          onFocus={(e) => { e.target.style.borderColor = "#b5484b"; e.target.style.boxShadow = "0 0 0 3px rgba(181,72,75,0.1)"; }}
          onBlur={(e) => { e.target.style.borderColor = "#E6E4DF"; e.target.style.boxShadow = "none"; }}
        >
          <option value="">All Branches</option>
          {branches.map((b) => <option key={b.id} value={b.name}>{b.name}</option>)}
        </select>

        <div style={{ display: "flex", gap: "6px", alignItems: "center" }}>
          <div style={{ display: "inline-flex", background: "#F8F8F6", borderRadius: "8px", padding: "3px", border: "1px solid #E6E4DF" }}>
            {PERIODS.map((p) => {
              const isActive = !showCustomRange && period === p.id;
              return (
                <button
                  key={p.id}
                  onClick={() => selectPeriod(p.id)}
                  style={{
                    padding: "6px 14px", fontSize: "12px", fontWeight: isActive ? 600 : 500,
                    borderRadius: "6px", border: "none",
                    background: isActive ? "#fff" : "transparent",
                    color: isActive ? "#1A1D23" : "#5F6577",
                    cursor: "pointer", fontFamily: "'DM Sans', sans-serif",
                    boxShadow: isActive ? "0 1px 3px rgba(0,0,0,0.06)" : "none",
                    transition: "all 0.15s",
                  }}
                >
                  {p.label}
                </button>
              );
            })}
          </div>

          <div ref={rangeDropdownRef} style={{ position: "relative" }}>
            <button
              onClick={() => setShowCustomRange((v) => !v)}
              style={{
                padding: "6px 10px", borderRadius: "6px", fontSize: "12px", fontWeight: 500,
                border: showCustomRange ? "1.5px solid #b5484b" : "1px solid #E6E4DF",
                background: showCustomRange ? "rgba(181,72,75,0.08)" : "#fff",
                color: showCustomRange ? "#b5484b" : "#5F6577",
                cursor: "pointer", display: "flex", alignItems: "center", gap: "5px",
                fontFamily: "'DM Sans', sans-serif", transition: "all 0.15s",
              }}
            >
              <SlidersHorizontal size={13} strokeWidth={1.8} />
              {showCustomRange && "Custom"}
            </button>
            {showCustomRange && (
              <div style={customRangeStyle}>
                <input type="date" value={customFrom} onChange={(e) => setCustomFrom(e.target.value)} style={dateInputStyle} />
                <span style={{ fontSize: "12px", color: "#9CA3B4" }}>→</span>
                <input type="date" value={customTo} onChange={(e) => setCustomTo(e.target.value)} style={dateInputStyle} />
                <button onClick={() => setShowCustomRange(false)} style={closeRangeBtn}
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

      {/* Charts Grid */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
        {/* Most Booked Services */}
        <Card>
          <CardHeader>
            <div style={chartHeaderStyle}><BarChart3 size={14} color="#5F6577" /><span>Most Booked Services</span></div>
          </CardHeader>
          <CardContent>
            {isLoading ? <Skeleton style={{ height: "200px" }} /> : topServices.length === 0 ? (
              <EmptyState icon="📊" title="No data for this period" />
            ) : (
              <div onClick={() => setShowTopServicesModal(true)} style={{ cursor: "pointer", position: "relative" }}>
                <ResponsiveContainer width="100%" height={280}>
                  <PieChart>
                    <Pie data={topServices} dataKey="count" nameKey="name" cx="50%" cy="45%" innerRadius={45} outerRadius={95} paddingAngle={2} labelLine={false}>
                      {topServices.map((_, i) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}
                    </Pie>
                    <Tooltip
                      formatter={(v: unknown, _: unknown, props: any) => [`${String(v ?? 0)} Bookings`, props?.name ?? ""]}
                      contentStyle={tooltipStyle}
                    />
                    <Legend verticalAlign="bottom" iconSize={10} wrapperStyle={{ fontSize: 11, color: "#5F6577" }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Revenue by Service */}
        <Card>
          <CardHeader>
            <div style={chartHeaderStyle}><PieChartIcon size={14} color="#5F6577" /><span>Revenue by Service</span></div>
          </CardHeader>
          <CardContent>
            {isLoading ? <Skeleton style={{ height: "200px" }} /> : revenueByService.length === 0 ? (
              <EmptyState icon="💰" title="No revenue data" />
            ) : (
              <div onClick={() => setShowRevenueModal(true)} style={{ cursor: "pointer", position: "relative" }}>
                <ResponsiveContainer width="100%" height={240}>
                  <PieChart>
                    <Pie data={revenueByService} dataKey="revenue" nameKey="name" cx="50%" cy="45%" innerRadius={50} outerRadius={80} paddingAngle={3} strokeWidth={0}>
                      {revenueByService.map((_, i) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}
                    </Pie>
                    <Tooltip formatter={(v: unknown, name: unknown) => [formatCurrency(v as number, currency), name as string]} contentStyle={tooltipStyle} />
                    <Legend iconType="circle" iconSize={7} wrapperStyle={{ fontSize: "11px", fontFamily: "'DM Sans', sans-serif" }}
                      formatter={(v) => <span style={{ fontSize: "11px", color: "#5F6577" }}>{v}</span>}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Bookings by Status */}
        <Card>
          <CardHeader>
            <div style={chartHeaderStyle}><ClipboardList size={14} color="#5F6577" /><span>Bookings by Status</span></div>
          </CardHeader>
          <CardContent>
            {isLoading ? <Skeleton style={{ height: "220px" }} /> : statusData.length === 0 ? (
              <EmptyState icon="📋" title="No booking data for this period" />
            ) : (
              <div onClick={() => setShowStatusModal(true)} style={{ cursor: "pointer" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "24px" }}>
                  <ResponsiveContainer width={180} height={180}>
                    <PieChart>
                      <Pie data={statusData} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={45} outerRadius={70} paddingAngle={3} strokeWidth={0}>
                        {statusData.map((s, i) => <Cell key={i} fill={s.color} />)}
                      </Pie>
                      <Tooltip formatter={(v: unknown, name: unknown) => [String(v), name as string]} contentStyle={tooltipStyle} />
                    </PieChart>
                  </ResponsiveContainer>
                  <div style={{ display: "flex", flexDirection: "column", gap: "10px", flex: 1 }}>
                    {statusData.map((s) => {
                      const pct = statusTotal > 0 ? Math.round((s.value / statusTotal) * 100) : 0;
                      return (
                        <div key={s.name} style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                          <div style={{ width: "8px", height: "8px", borderRadius: "50%", background: s.color, flexShrink: 0 }} />
                          <span style={{ fontSize: "12px", color: "#1A1D23", fontWeight: 500, minWidth: "70px", fontFamily: "'DM Sans', sans-serif" }}>{s.name}</span>
                          <span style={{ fontSize: "13px", color: "#1A1D23", fontWeight: 700, minWidth: "32px", textAlign: "right", fontFamily: "'Space Grotesk', sans-serif" }}>{s.value}</span>
                          <div style={{ flex: 1, maxWidth: "60px" }}>
                            <div style={pctBarOuter}><div style={{ ...pctBarInner, width: `${pct}%`, background: s.color }} /></div>
                          </div>
                          <span style={{ fontSize: "10px", color: "#9CA3B4", fontWeight: 600, minWidth: "28px", textAlign: "right", fontFamily: "'Space Grotesk', sans-serif" }}>{pct}%</span>
                        </div>
                      );
                    })}
                    <div style={{ borderTop: "1px solid #E6E4DF", marginTop: "2px", paddingTop: "8px", display: "flex", justifyContent: "space-between" }}>
                      <span style={{ fontSize: "12px", fontWeight: 600, color: "#1A1D23" }}>Total</span>
                      <span style={{ fontSize: "13px", fontWeight: 700, color: "#1A1D23", fontFamily: "'Space Grotesk', sans-serif" }}>{statusTotal}</span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Client Overview */}
        <Card>
          <CardHeader>
            <div style={chartHeaderStyle}><Users size={14} color="#5F6577" /><span>Client Overview</span></div>
          </CardHeader>
          <CardContent>
            {clientsLoading ? (
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                {[...Array(4)].map((_, i) => <Skeleton key={i} style={{ height: "80px" }} />)}
              </div>
            ) : (
              <>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                  <div style={clientKpiStyle}>
                    <div style={clientKpiLabel}>Total Clients</div>
                    <div style={clientKpiValue}>{clientsData?.totalClients ?? 0}</div>
                  </div>
                  <div style={clientKpiStyle}>
                    <div style={clientKpiLabel}>Total Revenue</div>
                    <div style={{ ...clientKpiValue, color: "#b5484b" }}>{formatCurrency(clientsData?.totalRevenue ?? 0, currency)}</div>
                  </div>
                  <div style={clientKpiStyle}>
                    <div style={{ ...clientKpiLabel, display: "flex", alignItems: "center", gap: "4px" }}><UserPlus size={11} />New Clients</div>
                    <div style={clientKpiValue}>{clientsData?.newClients ?? 0}</div>
                  </div>
                  <div style={clientKpiStyle}>
                    <div style={{ ...clientKpiLabel, display: "flex", alignItems: "center", gap: "4px" }}><RotateCcw size={11} />Returning</div>
                    <div style={clientKpiValue}>{clientsData?.returningClients ?? 0}</div>
                  </div>
                </div>
                <div style={{ marginTop: "16px", padding: "12px 14px", background: "linear-gradient(135deg, rgba(181,72,75,0.08), rgba(181,72,75,0.03))", borderRadius: "8px", borderLeft: "3px solid #b5484b", display: "flex", alignItems: "center", gap: "8px" }}>
                  <TrendingUp size={16} color="#b5484b" strokeWidth={2} />
                  <span style={{ fontSize: "12px", color: "#5F6577" }}>
                    <strong style={{ color: "#1A1D23" }}>+12%</strong> new clients vs last month
                  </span>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Clients Table - Full Width */}
      <Card>
        <CardHeader>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "12px", flexWrap: "wrap" }}>
            <div style={chartHeaderStyle}>
              <Users size={14} color="#5F6577" />
              <span>Clients by Services Booked</span>
              {filteredClients.length > 0 && (
                <span style={{ fontSize: "11px", color: "#9CA3B4", fontWeight: 500 }}>
                  ({filteredClients.length} client{filteredClients.length !== 1 ? "s" : ""})
                </span>
              )}
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              {/* Service filter */}
              {allServiceNames.length > 0 && (
                <div style={{ position: "relative" }}>
                  <Search size={13} color="#9CA3B4" style={{ position: "absolute", left: "10px", top: "50%", transform: "translateY(-50%)", pointerEvents: "none" }} />
                  <select
                    value={clientServiceFilter}
                    onChange={(e) => setClientServiceFilter(e.target.value)}
                    style={{
                      paddingLeft: "30px", paddingRight: "28px", paddingTop: "6px", paddingBottom: "6px",
                      border: clientServiceFilter ? "1.5px solid #b5484b" : "1px solid #E6E4DF",
                      borderRadius: "6px", fontSize: "12px", background: clientServiceFilter ? "rgba(181,72,75,0.04)" : "#fff",
                      color: clientServiceFilter ? "#b5484b" : "#5F6577",
                      cursor: "pointer", fontFamily: "'DM Sans', sans-serif", outline: "none",
                      appearance: "none",
                      backgroundImage: `url("data:image/svg+xml,%3Csvg width='10' height='6' viewBox='0 0 10 6' fill='none' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M1 1L5 5L9 1' stroke='%235F6577' stroke-width='1.5' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E")`,
                      backgroundRepeat: "no-repeat",
                      backgroundPosition: "right 8px center",
                      maxWidth: "200px",
                    }}
                  >
                    <option value="">All Services</option>
                    {allServiceNames.map((name) => <option key={name} value={name}>{name}</option>)}
                  </select>
                </div>
              )}
              {clientServiceFilter && (
                <button
                  onClick={() => setClientServiceFilter("")}
                  style={{ display: "flex", alignItems: "center", gap: "4px", padding: "6px 10px", border: "1px solid #E6E4DF", borderRadius: "6px", fontSize: "11px", background: "transparent", cursor: "pointer", color: "#5F6577", fontFamily: "'DM Sans', sans-serif" }}
                >
                  <X size={11} /> Clear
                </button>
              )}
              {clients.length > 0 && (
                <button
                  onClick={() => setShowClientsModal(true)}
                  style={{ padding: "5px 12px", borderRadius: "6px", fontSize: "11px", fontWeight: 600, border: "1px solid #E6E4DF", background: "#fff", color: "#5F6577", cursor: "pointer", fontFamily: "'DM Sans', sans-serif", display: "flex", alignItems: "center", gap: "4px" }}
                >
                  View All ({clients.length})
                </button>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {clientsLoading ? (
            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              {[...Array(5)].map((_, i) => <Skeleton key={i} style={{ height: "48px" }} />)}
            </div>
          ) : filteredClients.length === 0 ? (
            <EmptyState icon="👥" title={clientServiceFilter ? "No clients found for this service" : "No client data for this period"} />
          ) : (
            <>
              <div style={{ overflowX: "auto" }}>
                <table style={clientTableStyle}>
                  <colgroup>
                    <col style={{ width: "180px" }} />
                    <col style={{ width: "auto" }} />
                    <col style={{ width: "90px" }} />
                    <col style={{ width: "130px" }} />
                    <col style={{ width: "120px" }} />
                    <col style={{ width: "32px" }} />
                  </colgroup>
                  <thead>
                    <tr>
                      <th style={clientThStyle}>Client</th>
                      <th style={clientThStyle}>Services</th>
                      <th style={{ ...clientThStyle, textAlign: "right" }}>Bookings</th>
                      <th style={{ ...clientThStyle, textAlign: "right" }}>Spent</th>
                      <th style={{ ...clientThStyle, textAlign: "right" }}>Last Visit</th>
                      <th style={clientThStyle}></th>
                    </tr>
                  </thead>
                  <tbody>
                    {pagedClients.map((client, i) => (
                      <tr
                        key={`${client.phone}-${i}`}
                        style={{ borderBottom: "1px solid #F0EEED", cursor: "pointer" }}
                        onClick={() => openLatestInvoice(client)}
                        onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = "#FAFAF8"; }}
                        onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = "transparent"; }}
                      >
                        <td style={clientTdStyle}>
                          <div style={clientNameStyle}>{client.customer_name}</div>
                          {client.phone && <div style={clientPhoneStyle}>{client.phone}</div>}
                        </td>
                        <td style={{ ...clientTdStyle, whiteSpace: "normal" }}>
                          <div style={{ display: "flex", flexWrap: "wrap", gap: "4px" }}>
                            {client.services.slice(0, 3).map((svc, si) => (
                              <span key={si} style={{
                                padding: "2px 8px", borderRadius: "4px", fontSize: "11px",
                                background: `${CHART_COLORS[si % CHART_COLORS.length]}15`,
                                color: CHART_COLORS[si % CHART_COLORS.length],
                                fontWeight: 500, fontFamily: "'DM Sans', sans-serif",
                                whiteSpace: "nowrap",
                              }}>
                                {svc.name}{svc.count > 1 && <span style={{ opacity: 0.7 }}>×{svc.count}</span>}
                              </span>
                            ))}
                            {client.services.length > 3 && (
                              <span style={{ padding: "2px 8px", borderRadius: "4px", fontSize: "11px", background: "#F0EEED", color: "#5F6577", fontWeight: 500 }}>
                                +{client.services.length - 3} more
                              </span>
                            )}
                          </div>
                        </td>
                        <td style={{ ...clientTdStyle, textAlign: "right", fontFamily: "'Space Grotesk', sans-serif", fontWeight: 600 }}>
                          {client.totalBookings}
                        </td>
                        <td style={{ ...clientTdStyle, textAlign: "right", fontFamily: "'Space Grotesk', sans-serif", fontWeight: 600 }}>
                          {formatCurrency(client.totalSpent, currency)}
                        </td>
                        <td style={{ ...clientTdStyle, textAlign: "right", fontSize: "12px", color: "#5F6577" }}>
                          {formatDate(client.lastVisit)}
                        </td>
                        <td style={clientTdStyle}>
                          <ChevronRight size={14} color="#9CA3B4" />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {totalClientPages > 1 && (
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: "16px", paddingTop: "12px", borderTop: "1px solid #E6E4DF", flexWrap: "wrap", gap: "8px" }}>
                  <span style={{ fontSize: "12px", color: "#5F6577", fontWeight: 500 }}>
                    {(clientsPage - 1) * CLIENTS_PAGE_SIZE + 1}–{Math.min(clientsPage * CLIENTS_PAGE_SIZE, filteredClients.length)} of {filteredClients.length}
                  </span>
                  <div style={{ display: "flex", gap: "6px", alignItems: "center" }}>
                    <button
                      onClick={() => setClientsPage((p) => Math.max(1, p - 1))}
                      disabled={clientsPage === 1}
                      style={{ ...paginationBtnStyle, opacity: clientsPage === 1 ? 0.4 : 1, cursor: clientsPage === 1 ? "not-allowed" : "pointer" }}
                    >
                      <ChevronLeft size={13} />
                      <span style={{ fontSize: "12px" }}>Prev</span>
                    </button>
                    <span style={{ fontSize: "12px", color: "#5F6577", padding: "0 8px" }}>
                      {clientsPage} / {totalClientPages}
                    </span>
                    <button
                      onClick={() => setClientsPage((p) => Math.min(totalClientPages, p + 1))}
                      disabled={clientsPage === totalClientPages}
                      style={{ ...paginationBtnStyle, opacity: clientsPage === totalClientPages ? 0.4 : 1, cursor: clientsPage === totalClientPages ? "not-allowed" : "pointer" }}
                    >
                      <span style={{ fontSize: "12px" }}>Next</span>
                      <ChevronRight size={13} />
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Top Services Modal */}
      <ModalShell open={showTopServicesModal} onClose={() => setShowTopServicesModal(false)} title="Most Booked Services" width={560}>
        <div style={{ padding: "4px 0" }}>
          <div style={modalSummaryStyle}>
            <div><div style={modalSummaryLabel}>Total Bookings</div><div style={modalSummaryValue}>{totalBookings}</div></div>
            <div><div style={modalSummaryLabel}>Total Services</div><div style={modalSummaryValue}>{topServices.length}</div></div>
          </div>
          <div style={{ maxHeight: "400px", overflowY: "auto" }}>
            <table style={modalTableStyle}>
              <thead>
                <tr>
                  <th style={modalThLeft}>Service</th>
                  <th style={modalThRight}>Bookings</th>
                  <th style={modalThRight}>%</th>
                </tr>
              </thead>
              <tbody>
                {topServices.map((row, i) => (
                  <tr key={i} style={{ borderTop: "1px solid #F0EEED" }}>
                    <td style={modalTdLeft}>
                      <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                        <span style={modalColorDot(CHART_COLORS[i % CHART_COLORS.length])} />
                        <span style={modalServiceName}>{row.name}</span>
                      </div>
                    </td>
                    <td style={modalTdRight}>{row.count}</td>
                    <td style={modalTdRight}>{((row.count / totalBookings) * 100).toFixed(1)}%</td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr style={{ borderTop: "2px solid #E6E4DF" }}>
                  <td style={modalTfootLeft}>Total</td>
                  <td style={modalTfootRight}>{totalBookings}</td>
                  <td style={{ padding: "14px 0 0 0" }} />
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      </ModalShell>

      {/* Revenue Modal */}
      <ModalShell open={showRevenueModal} onClose={() => setShowRevenueModal(false)} title="Revenue by Service" width={560}>
        <div style={{ padding: "4px 0" }}>
          <div style={modalSummaryStyle}>
            <div><div style={modalSummaryLabel}>Total Revenue</div><div style={modalSummaryValue}>{formatCurrency(totalRevenue, currency)}</div></div>
            <div><div style={modalSummaryLabel}>Total Services</div><div style={modalSummaryValue}>{revenueByService.length}</div></div>
          </div>
          <div style={{ maxHeight: "400px", overflowY: "auto" }}>
            <table style={modalTableStyle}>
              <thead>
                <tr>
                  <th style={modalThLeft}>Service</th>
                  <th style={modalThRight}>Revenue</th>
                  <th style={modalThRight}>%</th>
                </tr>
              </thead>
              <tbody>
                {revenueByService.map((row, i) => (
                  <tr key={i} style={{ borderTop: "1px solid #F0EEED" }}>
                    <td style={modalTdLeft}>
                      <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                        <span style={modalColorDot(CHART_COLORS[i % CHART_COLORS.length])} />
                        <span style={modalServiceName}>{row.name}</span>
                      </div>
                    </td>
                    <td style={modalTdRight}>{formatCurrency(row.revenue, currency)}</td>
                    <td style={modalTdRight}>{row.percent}%</td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr style={{ borderTop: "2px solid #E6E4DF" }}>
                  <td style={modalTfootLeft}>Total</td>
                  <td style={modalTfootRight}>{formatCurrency(totalRevenue, currency)}</td>
                  <td style={{ padding: "14px 0 0 0" }} />
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      </ModalShell>

      {/* Status Modal */}
      <ModalShell open={showStatusModal} onClose={() => setShowStatusModal(false)} title="Bookings by Status" width={500}>
        <div style={{ padding: "4px 0" }}>
          <div style={modalSummaryStyle}>
            <div><div style={modalSummaryLabel}>Total Bookings</div><div style={modalSummaryValue}>{statusTotal}</div></div>
            <div><div style={modalSummaryLabel}>Status Types</div><div style={modalSummaryValue}>{statusData.length}</div></div>
          </div>
          <div style={{ maxHeight: "400px", overflowY: "auto" }}>
            <table style={modalTableStyle}>
              <thead>
                <tr>
                  <th style={modalThLeft}>Status</th>
                  <th style={modalThRight}>Count</th>
                  <th style={modalThRight}>%</th>
                </tr>
              </thead>
              <tbody>
                {statusData.map((row, i) => (
                  <tr key={i} style={{ borderTop: "1px solid #F0EEED" }}>
                    <td style={modalTdLeft}>
                      <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                        <span style={modalColorDot(row.color)} />
                        <span style={modalServiceName}>{row.name}</span>
                      </div>
                    </td>
                    <td style={modalTdRight}>{row.value}</td>
                    <td style={modalTdRight}>{((row.value / statusTotal) * 100).toFixed(1)}%</td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr style={{ borderTop: "2px solid #E6E4DF" }}>
                  <td style={modalTfootLeft}>Total</td>
                  <td style={modalTfootRight}>{statusTotal}</td>
                  <td style={{ padding: "14px 0 0 0" }} />
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      </ModalShell>

      {/* Clients Modal - Full List */}
      <ModalShell open={showClientsModal} onClose={() => setShowClientsModal(false)} title="All Clients" width={800}>
        <div style={{ padding: "4px 0" }}>
          <div style={modalSummaryStyle}>
            <div><div style={modalSummaryLabel}>Total Clients</div><div style={modalSummaryValue}>{clientsData?.totalClients ?? 0}</div></div>
            <div><div style={modalSummaryLabel}>Total Revenue</div><div style={modalSummaryValue}>{formatCurrency(clientsData?.totalRevenue ?? 0, currency)}</div></div>
            <div><div style={modalSummaryLabel}>Avg. Spend</div><div style={modalSummaryValue}>{formatCurrency(clientsData?.avgSpendPerClient ?? 0, currency)}</div></div>
          </div>
          <div style={{ maxHeight: "500px", overflowY: "auto" }}>
            <table style={modalTableStyle}>
              <colgroup>
                <col style={{ width: "200px" }} />
                <col style={{ width: "auto" }} />
                <col style={{ width: "80px" }} />
                <col style={{ width: "120px" }} />
              </colgroup>
              <thead>
                <tr>
                  <th style={modalThLeft}>Client</th>
                  <th style={modalThLeft}>Services</th>
                  <th style={modalThRight}>Bookings</th>
                  <th style={modalThRight}>Spent</th>
                </tr>
              </thead>
              <tbody>
                {clients.map((client, i) => (
                  <tr
                    key={`${client.phone}-${i}`}
                    style={{ borderTop: "1px solid #F0EEED", cursor: "pointer" }}
                    onClick={() => { setShowClientsModal(false); setTimeout(() => openLatestInvoice(client), 200); }}
                    onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = "#FAFAF8"; }}
                    onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = "transparent"; }}
                  >
                    <td style={modalTdLeft}>
                      <div style={{ fontWeight: 600, fontSize: "13px" }}>{client.customer_name}</div>
                      {client.phone && <div style={{ fontSize: "11px", color: "#9CA3B4", marginTop: "2px" }}>{client.phone}</div>}
                    </td>
                    <td style={{ ...modalTdLeft, whiteSpace: "normal" }}>
                      <div style={{ display: "flex", flexWrap: "wrap", gap: "4px" }}>
                        {client.services.slice(0, 2).map((svc, si) => (
                          <span key={si} style={{ padding: "2px 6px", borderRadius: "3px", fontSize: "10px", background: "#F0EEED", color: "#5F6577", whiteSpace: "nowrap" }}>
                            {svc.name} ×{svc.count}
                          </span>
                        ))}
                        {client.services.length > 2 && (
                          <span style={{ fontSize: "10px", color: "#9CA3B4" }}>+{client.services.length - 2}</span>
                        )}
                      </div>
                    </td>
                    <td style={modalTdRight}>{client.totalBookings}</td>
                    <td style={modalTdRight}>{formatCurrency(client.totalSpent, currency)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </ModalShell>

      {/* Invoice Modal */}
      <InvoiceModal
        open={invoiceModalOpen}
        booking={null}
        existingInvoice={invoiceToView}
        onClose={() => { setInvoiceModalOpen(false); setInvoiceToView(null); }}
        onSuccess={() => {}}
      />

      {/* Client Detail Modal */}
      <ModalShell
        open={showClientDetailModal}
        onClose={() => { setShowClientDetailModal(false); setSelectedClient(null); }}
        title={selectedClient?.customer_name ?? "Client Details"}
        width={650}
      >
        {selectedClient && (
          <div style={{ padding: "4px 0" }}>
            <div style={clientDetailHeaderStyle}>
              <div>
                <div style={clientDetailNameStyle}>{selectedClient.customer_name}</div>
                {selectedClient.phone && <div style={{ color: "#5F6577", fontSize: "13px", marginTop: "4px" }}>{selectedClient.phone}</div>}
                {selectedClient.branches.length > 0 && <div style={{ color: "#9CA3B4", fontSize: "12px", marginTop: "4px" }}>Branches: {selectedClient.branches.join(", ")}</div>}
              </div>
              <div style={{ display: "flex", gap: "24px" }}>
                <div style={{ textAlign: "right" }}>
                  <div style={{ fontSize: "11px", color: "#5F6577" }}>Total Spent</div>
                  <div style={{ fontSize: "18px", fontWeight: 700, color: "#b5484b", fontFamily: "'Space Grotesk', sans-serif" }}>{formatCurrency(selectedClient.totalSpent, currency)}</div>
                </div>
                <div style={{ textAlign: "right" }}>
                  <div style={{ fontSize: "11px", color: "#5F6577" }}>Bookings</div>
                  <div style={{ fontSize: "18px", fontWeight: 700, color: "#1A1D23", fontFamily: "'Space Grotesk', sans-serif" }}>{selectedClient.totalBookings}</div>
                </div>
              </div>
            </div>

            <div style={{ marginBottom: "20px" }}>
              <div style={{ fontSize: "12px", fontWeight: 600, color: "#5F6577", marginBottom: "10px", textTransform: "uppercase", letterSpacing: "0.05em" }}>Services Summary</div>
              <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                {selectedClient.services.sort((a, b) => b.count - a.count).map((svc, i) => (
                  <div key={i} style={{ display: "flex", alignItems: "center", gap: "12px", padding: "10px 14px", background: "#F8F8F6", borderRadius: "8px" }}>
                    <div style={{ width: "8px", height: "8px", borderRadius: "50%", background: CHART_COLORS[i % CHART_COLORS.length], flexShrink: 0 }} />
                    <div style={{ flex: 1, fontSize: "13px", fontWeight: 500, color: "#1A1D23" }}>{svc.name}</div>
                    <div style={{ fontSize: "13px", fontWeight: 600, color: "#1A1D23", fontFamily: "'Space Grotesk', sans-serif" }}>{svc.count}×</div>
                    <div style={{ fontSize: "13px", fontWeight: 600, color: "#b5484b", fontFamily: "'Space Grotesk', sans-serif", minWidth: "80px", textAlign: "right" }}>{formatCurrency(svc.revenue, currency)}</div>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <div style={{ fontSize: "12px", fontWeight: 600, color: "#5F6577", marginBottom: "10px", textTransform: "uppercase", letterSpacing: "0.05em", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span>Booking History</span>
                <span style={{ fontSize: "11px", color: "#9CA3B4", fontWeight: 500, textTransform: "none", letterSpacing: "normal" }}>
                  {formatDate(selectedClient.firstVisit)} → {formatDate(selectedClient.lastVisit)}
                </span>
              </div>
              <div style={{ maxHeight: "250px", overflowY: "auto", border: "1px solid #E6E4DF", borderRadius: "8px" }}>
                <table style={{ width: "100%", borderCollapse: "collapse" }}>
                  <thead>
                    <tr style={{ background: "#F8F8F6" }}>
                      {["Date", "Time", "Service", "Branch"].map((h) => (
                        <th key={h} style={{ padding: "10px 12px", fontSize: "11px", fontWeight: 600, color: "#5F6577", textAlign: "left", borderBottom: "1px solid #E6E4DF" }}>{h}</th>
                      ))}
                      <th style={{ padding: "10px 12px", fontSize: "11px", fontWeight: 600, color: "#5F6577", textAlign: "right", borderBottom: "1px solid #E6E4DF" }}>Price</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedClient.bookings.map((booking, i) => (
                      <tr key={i} style={{ borderBottom: "1px solid #F0EEED" }}>
                        <td style={{ padding: "10px 12px", fontSize: "12px", color: "#1A1D23" }}>{formatDate(booking.date)}</td>
                        <td style={{ padding: "10px 12px", fontSize: "12px", color: "#5F6577", fontFamily: "'Space Grotesk', sans-serif" }}>{booking.time}</td>
                        <td style={{ padding: "10px 12px", fontSize: "12px", color: "#1A1D23", fontWeight: 500 }}>{booking.service}</td>
                        <td style={{ padding: "10px 12px", fontSize: "12px", color: "#5F6577" }}>{booking.branch}</td>
                        <td style={{ padding: "10px 12px", fontSize: "12px", color: "#1A1D23", fontWeight: 600, textAlign: "right", fontFamily: "'Space Grotesk', sans-serif" }}>{formatCurrency(booking.price, currency)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </ModalShell>
    </div>
  );
}

/* ── Styles ── */

const filterInputStyle: React.CSSProperties = {
  padding: "8px 14px", border: "1px solid #E6E4DF", borderRadius: "8px",
  fontSize: "13px", background: "#fff", color: "#1A1D23", outline: "none",
  fontFamily: "'DM Sans', sans-serif", transition: "border-color 0.2s, box-shadow 0.2s", boxSizing: "border-box",
};
const customRangeStyle: React.CSSProperties = {
  position: "absolute", top: "calc(100% + 6px)", right: 0, background: "#fff",
  border: "1px solid #E6E4DF", borderRadius: "10px", padding: "10px 14px",
  boxShadow: "0 8px 24px rgba(0,0,0,0.12)", display: "flex", alignItems: "center",
  gap: "8px", zIndex: 50, whiteSpace: "nowrap",
};
const dateInputStyle: React.CSSProperties = {
  padding: "6px 10px", border: "1px solid #E6E4DF", borderRadius: "6px",
  fontSize: "12px", background: "#fff", color: "#1A1D23", outline: "none",
  fontFamily: "'DM Sans', sans-serif",
};
const closeRangeBtn: React.CSSProperties = {
  padding: "5px", borderRadius: "5px", border: "none", background: "transparent",
  cursor: "pointer", color: "#9CA3B4", display: "flex", alignItems: "center",
};
const chartHeaderStyle: React.CSSProperties = {
  display: "flex", alignItems: "center", gap: "7px", fontSize: "12px",
  fontWeight: 600, color: "#5F6577", fontFamily: "'DM Sans', sans-serif",
};
const tooltipStyle: React.CSSProperties = {
  fontSize: "12px", borderRadius: "8px", border: "1px solid #E6E4DF",
  boxShadow: "0 4px 12px rgba(0,0,0,0.08)", fontFamily: "'DM Sans', sans-serif",
};
const pctBarOuter: React.CSSProperties = { height: "4px", borderRadius: "2px", background: "#E6E4DF", overflow: "hidden" };
const pctBarInner: React.CSSProperties = { height: "100%", borderRadius: "2px", transition: "width 0.4s ease" };
const modalSummaryStyle: React.CSSProperties = {
  display: "flex", justifyContent: "space-between", alignItems: "center",
  padding: "16px 20px", background: "#F8F8F6", borderRadius: "10px", marginBottom: "20px",
};
const modalSummaryLabel: React.CSSProperties = { fontSize: "11px", color: "#5F6577", marginBottom: "4px", fontWeight: 500 };
const modalSummaryValue: React.CSSProperties = { fontSize: "22px", fontWeight: 700, color: "#b5484b", fontFamily: "'Space Grotesk', sans-serif" };
const modalTableStyle: React.CSSProperties = { width: "100%", borderCollapse: "collapse" };
const modalThLeft: React.CSSProperties = {
  textAlign: "left", padding: "12px 16px 8px 0", color: "#9CA3B4",
  fontWeight: 600, fontSize: "11px", fontFamily: "'DM Sans', sans-serif", borderBottom: "1px solid #E6E4DF",
};
const modalThRight: React.CSSProperties = {
  textAlign: "right", padding: "12px 0 8px 16px", color: "#9CA3B4",
  fontWeight: 600, fontSize: "11px", fontFamily: "'DM Sans', sans-serif", borderBottom: "1px solid #E6E4DF",
};
const modalTdLeft: React.CSSProperties = {
  padding: "12px 16px 12px 0", fontSize: "13px",
  fontFamily: "'DM Sans', sans-serif", verticalAlign: "middle",
};
const modalTdRight: React.CSSProperties = {
  padding: "12px 0 12px 16px", textAlign: "right", fontWeight: 600,
  color: "#1A1D23", fontFamily: "'Space Grotesk', sans-serif", fontSize: "13px", verticalAlign: "middle",
};
const modalTfootLeft: React.CSSProperties = { padding: "14px 16px 0 0", fontWeight: 700, color: "#1A1D23", fontFamily: "'Space Grotesk', sans-serif", fontSize: "13px" };
const modalTfootRight: React.CSSProperties = { padding: "14px 0 0 16px", textAlign: "right", fontWeight: 700, color: "#b5484b", fontFamily: "'Space Grotesk', sans-serif", fontSize: "14px" };
const modalColorDot = (color: string): React.CSSProperties => ({ width: "10px", height: "10px", borderRadius: "50%", background: color, flexShrink: 0, display: "inline-block" });
const modalServiceName: React.CSSProperties = { color: "#1A1D23", fontWeight: 500 };
const clientTableStyle: React.CSSProperties = { width: "100%", borderCollapse: "collapse" };
const clientThStyle: React.CSSProperties = {
  padding: "10px 12px", fontSize: "11px", fontWeight: 600, color: "#9CA3B4",
  textTransform: "uppercase", letterSpacing: "0.05em", borderBottom: "1px solid #E6E4DF",
  fontFamily: "'DM Sans', sans-serif", whiteSpace: "nowrap", textAlign: "left",
};
const clientTdStyle: React.CSSProperties = {
  padding: "12px", fontSize: "13px", color: "#1A1D23",
  fontFamily: "'DM Sans', sans-serif", verticalAlign: "middle", whiteSpace: "nowrap",
};
const clientNameStyle: React.CSSProperties = { fontWeight: 600, fontSize: "13px", color: "#1A1D23" };
const clientPhoneStyle: React.CSSProperties = { fontSize: "11px", color: "#9CA3B4", marginTop: "2px" };
const clientKpiStyle: React.CSSProperties = { background: "#F8F8F6", border: "1px solid #E6E4DF", borderRadius: "8px", padding: "14px 16px" };
const clientKpiLabel: React.CSSProperties = { fontSize: "11px", fontWeight: 500, color: "#5F6577", marginBottom: "6px", fontFamily: "'DM Sans', sans-serif" };
const clientKpiValue: React.CSSProperties = { fontSize: "18px", fontWeight: 700, color: "#1A1D23", fontFamily: "'Space Grotesk', sans-serif", letterSpacing: "-0.01em" };
const clientDetailHeaderStyle: React.CSSProperties = { display: "flex", justifyContent: "space-between", alignItems: "flex-start", padding: "16px 20px", background: "#F8F8F6", borderRadius: "10px", marginBottom: "20px" };
const clientDetailNameStyle: React.CSSProperties = { fontSize: "18px", fontWeight: 700, color: "#1A1D23", fontFamily: "'Space Grotesk', sans-serif" };
const paginationBtnStyle: React.CSSProperties = {
  display: "inline-flex", alignItems: "center", gap: "4px", padding: "5px 12px",
  border: "1px solid #E6E4DF", borderRadius: "6px", background: "#fff",
  color: "#5F6577", fontFamily: "'DM Sans', sans-serif", transition: "all 0.15s",
};