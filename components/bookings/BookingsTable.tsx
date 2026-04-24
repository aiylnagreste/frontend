// components/bookings/BookingsTable.tsx
"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { fetchBookings, fetchInvoiceByBookingId, QK } from "@/lib/queries";
import type { Booking, Invoice } from "@/lib/types";
import { Badge } from "@/components/ui/Badge";
import { Skeleton } from "@/components/ui/Skeleton";
import { EmptyState } from "@/components/ui/EmptyState";
import { api } from "@/lib/api";
import { toast } from "sonner";
import { formatDate, formatTime } from "@/lib/utils";
import { BookingDrawer } from "@/components/bookings/BookingDrawer";
import { Pencil, Check, Archive, X, Calendar, Filter, ChevronLeft, ChevronRight, Receipt, Printer } from "lucide-react";
import { InvoiceModal } from "@/components/bookings/InvoiceModal";

interface Props {
  branchId?: number;
  branchName?: string;
  /** Optional override — when provided, skip the internal fetch and render these rows instead.
   * Used by /bookings/upcoming to pre-filter to next-7-days. */
  bookings?: Booking[];
}

// Uncontrolled page input — syncs DOM directly to avoid re-render blur issues
function PageInput({
  currentPage,
  totalPages,
  onGoToPage,
  inputStyle,
}: {
  currentPage: number;
  totalPages: number;
  onGoToPage: (page: number) => void;
  inputStyle: React.CSSProperties;
}) {
  const ref = useRef<HTMLInputElement>(null);

  // Keep DOM value in sync when currentPage changes externally (prev/next buttons, filter reset)
  useEffect(() => {
    if (ref.current && document.activeElement !== ref.current) {
      ref.current.value = String(currentPage);
    }
  }, [currentPage]);

  const commit = useCallback(() => {
    if (!ref.current) return;
    const trimmed = ref.current.value.trim();
    if (trimmed === "") {
      ref.current.value = String(currentPage);
      return;
    }
    const n = parseInt(trimmed, 10);
    if (!isNaN(n) && n >= 1 && n <= totalPages) {
      onGoToPage(n);
    } else {
      ref.current.value = String(currentPage);
    }
  }, [currentPage, totalPages, onGoToPage]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      commit();
    }
  };

  // Only allow digits; silently drop characters that would push value above totalPages
  const handleInput = (e: React.FormEvent<HTMLInputElement>) => {
    const input = e.currentTarget;
    const raw = input.value.replace(/[^\d]/g, "");
    if (raw === "") {
      input.value = "";
      return;
    }
    const n = parseInt(raw, 10);
    if (n > totalPages) {
      // Revert to last valid value — don't allow typing beyond max
      input.value = raw.slice(0, -1) || String(currentPage);
      return;
    }
    input.value = raw;
  };

  return (
    <input
      ref={ref}
      type="text"
      inputMode="numeric"
      defaultValue={currentPage}
      onInput={handleInput}
      onKeyDown={handleKeyDown}
      onBlur={commit}
      style={inputStyle}
    />
  );
}

export default function BookingsTable({ branchId, branchName, bookings: bookingsProp }: Props) {
  const [dateFilter, setDateFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [editingBooking, setEditingBooking] = useState<Booking | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [invoiceBooking, setInvoiceBooking] = useState<Booking | null>(null);
  const [invoiceOpen, setInvoiceOpen] = useState(false);
  const [viewInvoice, setViewInvoice] = useState<Invoice | null>(null);
  const [viewInvoiceOpen, setViewInvoiceOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const qc = useQueryClient();

  const params: Record<string, string | undefined> = {};
  if (dateFilter) params.date = dateFilter;
  if (statusFilter) params.status = statusFilter;

  const overrideProvided = bookingsProp !== undefined;

  const { data: queriedBookings = [], isLoading: queryLoading } = useQuery<Booking[]>({
    queryKey: QK.bookings(params),
    queryFn: () => fetchBookings(params),
    staleTime: 30_000,
    enabled: !overrideProvided,
  });

  const allBookings = overrideProvided ? bookingsProp! : queriedBookings;
  const isLoading = overrideProvided ? false : queryLoading;

  const bookings = branchName
    ? allBookings.filter((b) => b.branch === branchName)
    : allBookings;

  const active = bookings.filter((b) => b.status !== "archived");

  // Pagination logic
  const totalItems = active.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const startIndex = (currentPage - 1) * pageSize;
  const endIndex = startIndex + pageSize;
  const paginatedBookings = active.slice(startIndex, endIndex);

  // Reset to page 1 when out of range
  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(1);
    }
  }, [totalPages, currentPage]);

  // Reset to first page when filters change
  const handleFilterChange = (setter: React.Dispatch<React.SetStateAction<string>>, value: string) => {
    setter(value);
    setCurrentPage(1);
  };

  const goToPage = useCallback((page: number) => {
    setCurrentPage(Math.max(1, Math.min(page, totalPages)));
  }, [totalPages]);

  function invalidate() {
    qc.invalidateQueries({ queryKey: ["bookings"] });
    qc.invalidateQueries({ queryKey: ["stats"] });
    qc.invalidateQueries({ queryKey: ["analytics"] });
    qc.invalidateQueries({ queryKey: ["invoices"] });

    const timeframes = ["day", "week", "month", "year"];
    timeframes.forEach(timeframe => {
      if (branchName) {
        qc.invalidateQueries({ queryKey: QK.analytics({ period: timeframe, branch: branchName, status: "completed" }) });
        qc.invalidateQueries({ queryKey: QK.analytics({ period: timeframe, branch: branchName, status: "confirmed,completed" }) });
      } else {
        qc.invalidateQueries({ queryKey: QK.analytics({ period: timeframe, status: "completed" }) });
        qc.invalidateQueries({ queryKey: QK.analytics({ period: timeframe, status: "confirmed,completed" }) });
      }
    });
  }

  const arriveMutation = useMutation({
    mutationFn: (id: number) =>
      api.patch(`/salon-admin/api/bookings/${id}/status`, { status: "arrived" }),
    onSuccess: () => { toast.success("Marked as arrived"); invalidate(); },
    onError: (e: Error) => toast.error(e.message),
  });

  const archiveMutation = useMutation({
    mutationFn: (id: number) => api.delete(`/salon-admin/api/bookings/${id}`),
    onSuccess: () => { toast.success("Booking archived"); invalidate(); },
    onError: (e: Error) => toast.error(e.message),
  });

  function openEdit(booking: Booking) {
    setEditingBooking(booking);
    setDrawerOpen(true);
  }

  function closeDrawer() {
    setDrawerOpen(false);
    setEditingBooking(null);
  }

  const hasFilters = !!dateFilter || !!statusFilter;

  const grouped = branchName
    ? { [branchName]: paginatedBookings }
    : paginatedBookings.reduce<Record<string, Booking[]>>((acc, b) => {
        (acc[b.branch] ??= []).push(b);
        return acc;
      }, {});

  // Shared style for the page input
  const pageInputStyle: React.CSSProperties = {
    width: "50px",
    padding: "5px 8px",
    border: "1px solid #E6E4DF",
    borderRadius: "6px",
    fontSize: "12px",
    textAlign: "center",
    background: "#fff",
    color: "#1A1D23",
    fontFamily: "'DM Sans', sans-serif",
    outline: "none",
  };

  const NavButton = ({
    direction,
    size: btnSize = "md",
  }: {
    direction: "prev" | "next";
    size?: "sm" | "md";
  }) => {
    const disabled = direction === "prev"
      ? currentPage === 1
      : currentPage === totalPages || totalPages === 0;
    const padding = btnSize === "sm" ? "5px 8px" : "6px 10px";

    return (
      <button
        onClick={() => goToPage(direction === "prev" ? currentPage - 1 : currentPage + 1)}
        disabled={disabled}
        style={{
          padding,
          border: "1px solid #E6E4DF",
          borderRadius: "6px",
          background: "#fff",
          cursor: disabled ? "not-allowed" : "pointer",
          opacity: disabled ? 0.5 : 1,
          display: "flex",
          alignItems: "center",
          gap: "4px",
          transition: "all 0.15s",
        }}
        onMouseEnter={(e) => {
          if (!disabled) {
            e.currentTarget.style.background = "#F8F8F6";
            e.currentTarget.style.borderColor = "#D1D5DB";
          }
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.background = "#fff";
          e.currentTarget.style.borderColor = "#E6E4DF";
        }}
      >
        {direction === "prev" && <ChevronLeft size={btnSize === "sm" ? 12 : 14} />}
        {btnSize === "md" && <span style={{ fontSize: "12px" }}>{direction === "prev" ? "Prev" : "Next"}</span>}
        {direction === "next" && <ChevronRight size={btnSize === "sm" ? 12 : 14} />}
      </button>
    );
  };

  const PaginationInfo = () => (
    <div style={{ fontSize: "12px", color: "#5F6577", fontWeight: 500 }}>
      ({startIndex + 1}–{Math.min(endIndex, totalItems)} of {totalItems})
    </div>
  );

  // Bottom pagination (full controls including page size)
  const BottomPaginationControls = () => (
    <div style={{
      display: "flex",
      alignItems: "center",
      justifyContent: "flex-end",
      gap: "12px",
      marginTop: "16px",
      flexWrap: "wrap",
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
        <span style={{ fontSize: "12px", color: "#5F6577" }}>Show:</span>
        <select
          value={pageSize}
          onChange={(e) => {
            setPageSize(Number(e.target.value));
            setCurrentPage(1);
          }}
          style={{
            padding: "5px 24px 5px 8px",
            border: "1px solid #E6E4DF",
            borderRadius: "6px",
            fontSize: "12px",
            background: "#fff",
            color: "#1A1D23",
            cursor: "pointer",
            fontFamily: "'DM Sans', sans-serif",
            outline: "none",
            appearance: "none",
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='10' height='6' viewBox='0 0 10 6' fill='none' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M1 1L5 5L9 1' stroke='%235F6577' stroke-width='1.5' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E")`,
            backgroundRepeat: "no-repeat",
            backgroundPosition: "right 8px center",
          }}
        >
          <option value={5}>5</option>
          <option value={10}>10</option>
          <option value={15}>15</option>
          <option value={20}>20</option>
        </select>
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
        <span style={{ fontSize: "12px", color: "#5F6577" }}>Page</span>
        <PageInput
          currentPage={currentPage}
          totalPages={totalPages}
          onGoToPage={goToPage}
          inputStyle={pageInputStyle}
        />
        <span style={{ fontSize: "12px", color: "#5F6577" }}>of {totalPages}</span>
      </div>

      <PaginationInfo />

      <div style={{ display: "flex", gap: "6px" }}>
        <NavButton direction="prev" size="md" />
        <NavButton direction="next" size="md" />
      </div>
    </div>
  );

  // Top pagination (compact, no page size selector)
  const TopPaginationControls = () => (
    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
      <span style={{ fontSize: "12px", color: "#5F6577" }}>Page</span>
      <PageInput
        currentPage={currentPage}
        totalPages={totalPages}
        onGoToPage={goToPage}
        inputStyle={pageInputStyle}
      />
      <span style={{ fontSize: "12px", color: "#5F6577" }}>of {totalPages}</span>

      <div style={{ display: "flex", gap: "4px", marginLeft: "4px" }}>
        <NavButton direction="prev" size="sm" />
        <NavButton direction="next" size="sm" />
      </div>

      <div style={{ marginLeft: "4px" }}>
        <PaginationInfo />
      </div>
    </div>
  );

  return (
    <>
      <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
        {/* Filters row */}
        <div style={{ display: "flex", gap: "10px", alignItems: "center", flexWrap: "wrap" }}>
          <div style={{ position: "relative" }}>
            <Calendar size={14} color="#9CA3B4" style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)" }} />
            <input
              type="date"
              value={dateFilter}
              onChange={(e) => handleFilterChange(setDateFilter, e.target.value)}
              style={{ ...filterInputStyle, paddingLeft: "34px", paddingRight: "14px" }}
              onFocus={(e) => { e.target.style.borderColor = "#b5484b"; e.target.style.boxShadow = "0 0 0 3px rgba(181,72,75,0.1)"; }}
              onBlur={(e) => { e.target.style.borderColor = "#E6E4DF"; e.target.style.boxShadow = "none"; }}
            />
          </div>

          <div style={{ position: "relative" }}>
            <Filter size={14} color="#9CA3B4" style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)" }} />
            <select
              value={statusFilter}
              onChange={(e) => handleFilterChange(setStatusFilter, e.target.value)}
              style={{
                ...filterInputStyle,
                paddingLeft: "34px",
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
              <option value="">All Statuses</option>
              <option value="confirmed">Confirmed</option>
              <option value="arrived">Arrived</option>
              <option value="completed">Completed</option>
              <option value="canceled">Cancelled</option>
              <option value="no_show">Missed</option>
            </select>
          </div>

          {hasFilters && (
            <button
              onClick={() => { handleFilterChange(setDateFilter, ""); handleFilterChange(setStatusFilter, ""); }}
              style={clearBtnStyle}
              onMouseEnter={(e) => { e.currentTarget.style.background = "#F8F8F6"; e.currentTarget.style.borderColor = "#D1D5DB"; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.borderColor = "#E6E4DF"; }}
            >
              <X size={12} />
              Clear
            </button>
          )}

          <div style={{ flex: 1 }} />

          {/* Total count badge */}
          <div style={{
            fontSize: "12px",
            color: "#5F6577",
            fontWeight: 500,
            display: "flex",
            alignItems: "center",
            gap: "8px",
          }}>
            <span style={{
              background: "#F8F8F6",
              border: "1px solid #E6E4DF",
              borderRadius: "6px",
              padding: "3px 10px",
              fontWeight: 600,
              color: "#1A1D23",
              fontFamily: "'Space Grotesk', sans-serif",
            }}>
              {totalItems}
            </span>
            <span>booking{totalItems !== 1 ? "s" : ""}</span>
          </div>

          {/* Top pagination controls (only when more than one page) */}
          {totalPages > 1 && <TopPaginationControls />}
        </div>

        {/* Table(s) */}
        {isLoading ? (
          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} style={{ height: "52px" }} />
            ))}
          </div>
        ) : active.length === 0 ? (
          <EmptyState
            icon="📋"
            title="No bookings found"
            description={
              hasFilters
                ? "Try clearing your filters to see more results."
                : "No appointments scheduled for this period."
            }
          />
        ) : (
          <>
            {Object.entries(grouped).map(([branch, rows]) => (
              <div
                key={branch}
                style={{
                  background: "#fff",
                  border: "1px solid #E6E4DF",
                  borderRadius: "10px",
                  overflow: "hidden",
                  boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
                }}
              >
                {!branchName && (
                  <div
                    style={{
                      padding: "10px 20px",
                      background: "linear-gradient(135deg, #b5484b, #6b3057)",
                      color: "#fff",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                    }}
                  >
                    <span style={{ fontSize: "13px", fontWeight: 600, fontFamily: "'Space Grotesk', sans-serif" }}>
                      {branch}
                    </span>
                    <span style={{ fontSize: "11px", opacity: 0.8, fontWeight: 500 }}>
                      {rows.length} booking{rows.length !== 1 ? "s" : ""}
                    </span>
                  </div>
                )}
                <div style={{ overflowX: "auto" }}>
                  <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px" }}>
                    <thead>
                      <tr>
                        {["Time", "Client", "Service", "Date", "Staff", "Status", "Actions"].map((h) => (
                          <th key={h} style={tableHeaderStyle}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {rows.map((b) => (
                        <tr
                          key={b.id}
                          style={{
                            borderBottom: "1px solid #F0EEED",
                            background:
                              b.status === "completed" ? "#F8FDF8" :
                              b.status === "arrived"   ? "#FFFBEB" :
                              b.status === "canceled"  ? "#FFFDF8" :
                              b.status === "no_show"   ? "#FFF8F8" : "transparent",
                            transition: "background 0.15s",
                          }}
                          onMouseEnter={(e) => {
                            if (b.status === "confirmed") e.currentTarget.style.background = "#FDFCFC";
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.background = "transparent";
                          }}
                        >
                          <td style={cellStyle}>
                            <span style={{
                              fontFamily: "'Space Grotesk', monospace",
                              fontSize: "12px",
                              fontWeight: 600,
                              color: "#1A1D23",
                              background: "#F8F8F6",
                              padding: "3px 8px",
                              borderRadius: "5px",
                              whiteSpace: "nowrap",
                            }}>
                              {formatTime(b.time)}
                            </span>
                            {b.endTime && (
                              <span style={{
                                fontFamily: "'Space Grotesk', monospace",
                                fontSize: "11px",
                                color: "#9CA3B4",
                                marginLeft: "4px",
                              }}>
                                → {formatTime(b.endTime)}
                              </span>
                            )}
                          </td>
                          <td style={cellStyle}>
                            <div style={{ fontWeight: 600, color: "#1A1D23", fontSize: "13px" }}>{b.customer_name}</div>
                            <div style={{ fontSize: "11px", color: "#9CA3B4", marginTop: "1px" }}>{b.phone}</div>
                          </td>
                          <td style={{ ...cellStyle, maxWidth: "180px" }}>
                            <div style={{ color: "#1A1D23", fontSize: "13px" }}>{b.service}</div>
                          </td>
                          <td style={{ ...cellStyle, whiteSpace: "nowrap" }}>
                            <span style={{ fontSize: "12px", color: "#5F6577" }}>{formatDate(b.date)}</span>
                          </td>
                          <td style={cellStyle}>
                            <span style={{ fontSize: "12px", color: "#5F6577" }}>
                              {b.staff_name || <span style={{ color: "#D1D5DB" }}>—</span>}
                            </span>
                          </td>
                          <td style={cellStyle}>
                            <Badge status={b.status === "no_show" ? "Missed" : b.status} />
                          </td>
                          <td style={cellStyle}>
                            <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
                              {b.status === "confirmed" && (
                                <TableAction
                                  icon={<Pencil size={11} strokeWidth={2} />}
                                  label="Edit"
                                  bg="#EEF2FF"
                                  color="#4338CA"
                                  hoverBg="#E0E7FF"
                                  onClick={() => openEdit(b)}
                                />
                              )}
                              {b.status === "confirmed" && (
                                <TableAction
                                  icon={<Check size={11} strokeWidth={2.5} />}
                                  label="Arrived"
                                  bg="#FEF3C7"
                                  color="#92400E"
                                  hoverBg="#FDE68A"
                                  onClick={() => arriveMutation.mutate(b.id)}
                                  disabled={arriveMutation.isPending}
                                />
                              )}
                              {b.status === "arrived" && (
                                <TableAction
                                  icon={<Receipt size={11} strokeWidth={2} />}
                                  label="Generate Invoice"
                                  bg="#DCFCE7"
                                  color="#15803D"
                                  hoverBg="#BBF7D0"
                                  onClick={() => { setInvoiceBooking(b); setInvoiceOpen(true); }}
                                />
                              )}
                              {b.status === "completed" && (
                                <TableAction
                                  icon={<Printer size={11} strokeWidth={2} />}
                                  label="Print Invoice"
                                  bg="#EEF2FF"
                                  color="#4338CA"
                                  hoverBg="#E0E7FF"
                                  onClick={async () => {
                                    try {
                                      const inv = await fetchInvoiceByBookingId(b.id);
                                      if (!inv) {
                                        toast.error("No invoice found for this booking");
                                        return;
                                      }
                                      setViewInvoice(inv);
                                      setViewInvoiceOpen(true);
                                    } catch (err) {
                                      toast.error(
                                        err instanceof Error ? err.message : "Failed to load invoice"
                                      );
                                    }
                                  }}
                                />
                              )}
                              <TableAction
                                icon={<Archive size={11} strokeWidth={2} />}
                                label="Archive"
                                bg="#FEF2F2"
                                color="#DC2626"
                                hoverBg="#FEE2E2"
                                onClick={() => archiveMutation.mutate(b.id)}
                                disabled={archiveMutation.isPending}
                              />
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ))}

            {/* Bottom pagination controls */}
            {totalPages > 1 && <BottomPaginationControls />}
          </>
        )}
      </div>

      <BookingDrawer
        open={drawerOpen}
        onClose={closeDrawer}
        editing={editingBooking}
        editMode="limited"
        onSuccess={invalidate}
      />

      <InvoiceModal
        open={invoiceOpen}
        booking={invoiceBooking}
        onClose={() => { setInvoiceOpen(false); setInvoiceBooking(null); }}
        onSuccess={invalidate}
      />

      <InvoiceModal
        open={viewInvoiceOpen}
        booking={null}
        existingInvoice={viewInvoice}
        onClose={() => { setViewInvoiceOpen(false); setViewInvoice(null); }}
        onSuccess={() => {}}
      />
    </>
  );
}

function TableAction({ icon, label, bg, color, hoverBg, onClick, disabled }: any) {
  const [hovered, setHovered] = useState(false);
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: "4px",
        background: disabled ? bg : hovered ? hoverBg : bg,
        color,
        border: "none",
        borderRadius: "6px",
        padding: "5px 10px",
        fontSize: "11px",
        fontWeight: 600,
        cursor: disabled ? "not-allowed" : "pointer",
        opacity: disabled ? 0.5 : 1,
        whiteSpace: "nowrap",
        fontFamily: "'DM Sans', sans-serif",
        transition: "background 0.15s",
      }}
    >
      {icon}
      {label}
    </button>
  );
}

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

const clearBtnStyle: React.CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  gap: "5px",
  padding: "8px 14px",
  border: "1px solid #E6E4DF",
  borderRadius: "8px",
  fontSize: "12px",
  background: "transparent",
  cursor: "pointer",
  color: "#5F6577",
  fontWeight: 500,
  fontFamily: "'DM Sans', sans-serif",
  transition: "all 0.15s",
};

const tableHeaderStyle: React.CSSProperties = {
  padding: "10px 14px",
  textAlign: "left",
  fontSize: "11px",
  fontWeight: 600,
  color: "#5F6577",
  textTransform: "uppercase",
  letterSpacing: "0.05em",
  background: "#F8F8F6",
  borderBottom: "1px solid #E6E4DF",
  whiteSpace: "nowrap",
  fontFamily: "'DM Sans', sans-serif",
};

const cellStyle: React.CSSProperties = {
  padding: "12px 14px",
  verticalAlign: "middle",
};