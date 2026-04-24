// components/dashboard/TodayAppointmentsTable.tsx
"use client";

import { useEffect, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { fetchBookings, QK } from "@/lib/queries";
import type { Booking } from "@/lib/types";
import { Badge } from "@/components/ui/Badge";
import { Skeleton } from "@/components/ui/Skeleton";
import { EmptyState } from "@/components/ui/EmptyState";
import { api } from "@/lib/api";
import { toast } from "sonner";
import { formatTime } from "@/lib/utils";
import { fetchInvoiceByBookingId } from "@/lib/queries";
import type { Invoice } from "@/lib/types";
import { Printer } from "lucide-react";
import {
  CalendarCheck,
  Archive,
  UserMinus,
  UserCheck,
  Receipt,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { InvoiceModal } from "@/components/bookings/InvoiceModal";

function getTodayStr() {
  return new Date().toISOString().slice(0, 10);
}

const PAGE_SIZES = [5, 10, 20, 50];

export default function TodayAppointmentsTable() {
  const today = getTodayStr();
  const qc = useQueryClient();

  const { data: bookings = [], isLoading } = useQuery<Booking[]>({
    queryKey: QK.bookings({ date: today }),
    queryFn: () => fetchBookings({ date: today }),
    staleTime: 0,
    refetchInterval: 30_000,
  });

  const [invoiceBooking, setInvoiceBooking] = useState<Booking | null>(null);
  const [invoiceOpen, setInvoiceOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [viewInvoice, setViewInvoice] = useState<Invoice | null>(null);
const [viewInvoiceOpen, setViewInvoiceOpen] = useState(false);

  function invalidateAfterMutation() {
    qc.invalidateQueries({ queryKey: ["bookings"] });
    qc.invalidateQueries({ queryKey: ["stats"] });
    qc.invalidateQueries({ queryKey: ["analytics"] });
    qc.invalidateQueries({ queryKey: ["invoices"] });
    qc.invalidateQueries({ queryKey: ["staffIncome"] });
  }

  const arriveMutation = useMutation({
    mutationFn: (id: number) =>
      api.patch(`/salon-admin/api/bookings/${id}/status`, { status: "arrived" }),
    onSuccess: () => { toast.success("Marked as arrived"); invalidateAfterMutation(); },
    onError: (e: Error) => toast.error(e.message),
  });

  const noShowMutation = useMutation({
    mutationFn: (id: number) =>
      api.patch(`/salon-admin/api/bookings/${id}/status`, { status: "no_show" }),
    onSuccess: () => { toast.success("Marked as Missed"); invalidateAfterMutation(); },
    onError: (e: Error) => toast.error(e.message),
  });

  const archiveMutation = useMutation({
    mutationFn: (id: number) => api.delete(`/salon-admin/api/bookings/${id}`),
    onSuccess: () => { toast.success("Booking archived"); invalidateAfterMutation(); },
    onError: (e: Error) => toast.error(e.message),
  });

  const active = bookings.filter((b) => b.status !== "archived");
  const totalItems = active.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const startIndex = (currentPage - 1) * pageSize;
  const endIndex = startIndex + pageSize;
  const paginatedBookings = active.slice(startIndex, endIndex);

  useEffect(() => {
    if (currentPage > totalPages) setCurrentPage(1);
  }, [totalPages, currentPage]);

  const byBranch = paginatedBookings.reduce<Record<string, Booking[]>>((acc, b) => {
    (acc[b.branch] ??= []).push(b);
    return acc;
  }, {});

  const branchEntries = Object.entries(byBranch);

  return (
    <div style={{
      background: "#fff",
      border: "1px solid #E6E4DF",
      borderRadius: "10px",
      boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
      overflow: "hidden",
    }}>
      {/* Header */}
      <div style={{
        padding: "16px 20px",
        borderBottom: "1px solid #E6E4DF",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
      }}>
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
            <CalendarCheck size={16} color="#b5484b" strokeWidth={2} />
          </div>
          <div>
            <h3 style={{
              fontSize: "14px",
              fontWeight: 700,
              margin: 0,
              fontFamily: "'Space Grotesk', sans-serif",
              color: "#1A1D23",
              letterSpacing: "-0.01em",
            }}>
              Today&apos;s Appointments
            </h3>
            <span style={{ fontSize: "11px", color: "#9CA3B4" }}>
              {totalItems} scheduled
            </span>
          </div>
        </div>
      </div>

      {/* Body */}
      {isLoading ? (
        <div style={{ padding: "20px", display: "flex", flexDirection: "column", gap: "8px" }}>
          {[1, 2, 3].map((i) => <Skeleton key={i} style={{ height: "48px" }} />)}
        </div>
      ) : branchEntries.length === 0 ? (
        <EmptyState
          icon="📅"
          title="No appointments today"
          description="Today's bookings will appear here as they are confirmed."
        />
      ) : (
        <>
          {/* Single table wrapping all branches — fixes column alignment */}
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px" }}>
            <thead>
              <tr>
                {["Client", "Service", "Time", "Status", "Actions"].map((h) => (
                  <th key={h} style={tableHeaderStyle}>{h}</th>
                ))}
              </tr>
            </thead>

            {branchEntries.map(([branch, rows]) => (
              <>
                {/* Branch separator */}
                <tbody key={`sep-${branch}`}>
                  <tr>
                    <td colSpan={5} style={{
                      padding: "8px 20px",
                      background: "#F8F8F6",
                      borderTop: "1px solid #E6E4DF",
                      borderBottom: "1px solid #E6E4DF",
                    }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <span style={{
                          fontSize: "12px",
                          fontWeight: 600,
                          color: "#b5484b",
                          fontFamily: "'Space Grotesk', sans-serif",
                        }}>
                          {branch}
                        </span>
                        <span style={{ fontSize: "11px", color: "#9CA3B4", fontWeight: 500 }}>
                          {rows.length} booking{rows.length !== 1 ? "s" : ""}
                        </span>
                      </div>
                    </td>
                  </tr>
                </tbody>

                {/* Branch rows */}
                <tbody key={`rows-${branch}`}>
                  {rows.map((b) => (
                    <tr
                      key={b.id}
                      style={{
                        borderBottom: "1px solid #F0EEED",
                        background:
                          b.status === "completed" ? "#F8FDF8"
                          : b.status === "no_show" ? "#FFF8F8"
                          : b.status === "arrived" ? "#F0F9FF"
                          : "transparent",
                        transition: "background 0.15s",
                      }}
                      onMouseEnter={(e) => {
                        if (b.status === "confirmed") e.currentTarget.style.background = "#FDFCFC";
                      }}
                      onMouseLeave={(e) => {
                        if (b.status === "completed") e.currentTarget.style.background = "#F8FDF8";
                        else if (b.status === "no_show") e.currentTarget.style.background = "#FFF8F8";
                        else if (b.status === "arrived") e.currentTarget.style.background = "#F0F9FF";
                        else e.currentTarget.style.background = "transparent";
                      }}
                    >
                      <td style={cellStyle}>
                        <div style={{ fontWeight: 600, color: "#1A1D23", fontSize: "13px" }}>
                          {b.customer_name}
                        </div>
                        <div style={{ fontSize: "11px", color: "#9CA3B4", marginTop: "1px" }}>
                          {b.phone || "—"}
                        </div>
                      </td>
                      <td style={{ ...cellStyle, color: "#5F6577", fontSize: "13px" }}>
                        {b.service}
                      </td>
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
                        <Badge status={b.status === "no_show" ? "Missed" : b.status} />
                      </td>
                      <td style={cellStyle}>
                        <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
                          {b.status === "confirmed" && (
                            <>
                              <TableAction
                                icon={<UserCheck size={11} strokeWidth={2.5} />}
                                label="Arrived"
                                bg="#DBEAFE"
                                color="#1D4ED8"
                                hoverBg="#BFDBFE"
                                onClick={() => arriveMutation.mutate(b.id)}
                                disabled={arriveMutation.isPending}
                              />
                              <TableAction
                                icon={<UserMinus size={11} strokeWidth={2} />}
                                label="Missed"
                                bg="#FEF3C7"
                                color="#92400E"
                                hoverBg="#FDE68A"
                                onClick={() => noShowMutation.mutate(b.id)}
                                disabled={noShowMutation.isPending}
                              />
                            </>
                          )}
                          {b.status === "arrived" && (
                            <TableAction
                              icon={<Receipt size={11} strokeWidth={2.5} />}
                              label="Generate Invoice"
                              
                              bg="#DCFCE7"
                                color="#15803D"
                                hoverBg="#BBF7D0"
                              onClick={() => {
                                setInvoiceBooking(b);
                                setInvoiceOpen(true);
                              }}
                            />
                          )}
                          {b.status === "completed" && (
                              <TableAction
                                icon={<Printer size={11} strokeWidth={2} />}
                                label="Print Invoice"
                                bg="#EDE9FE"
                              color="#6D28D9"
                              
                              hoverBg="#DDD6FE"
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
                                    toast.error(err instanceof Error ? err.message : "Failed to load invoice");
                                  }
                                }}
                              />
                            )}
                          {(b.status === "no_show" ||
                            b.status === "confirmed" ||
                            b.status === "arrived" ||
                            b.status === "completed") && (
                            <TableAction
                              icon={<Archive size={11} strokeWidth={2} />}
                              label="Archive"
                              bg="#FEF2F2"
                              color="#DC2626"
                              hoverBg="#FEE2E2"
                              onClick={() => archiveMutation.mutate(b.id)}
                              disabled={archiveMutation.isPending}
                            />
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </>
            ))}
          </table>

          {/* Pagination footer */}
          {totalItems > 0 && (
            <div style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              padding: "10px 20px",
              borderTop: "1px solid #E6E4DF",
              background: "#F8F8F6",
              flexWrap: "wrap",
              gap: "8px",
            }}>
              <div style={{ fontSize: "12px", color: "#5F6577", fontWeight: 500 }}>
                {startIndex + 1}–{Math.min(endIndex, totalItems)} of {totalItems}
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                  <span style={{ fontSize: "11px", color: "#5F6577" }}>Show</span>
                  <select
                    value={pageSize}
                    onChange={(e) => { setPageSize(Number(e.target.value)); setCurrentPage(1); }}
                    style={{
                      padding: "4px 22px 4px 8px",
                      border: "1px solid #E6E4DF",
                      borderRadius: "6px",
                      fontSize: "11px",
                      background: "#fff",
                      color: "#1A1D23",
                      cursor: "pointer",
                      fontFamily: "'DM Sans', sans-serif",
                      outline: "none",
                      appearance: "none",
                      backgroundImage: `url("data:image/svg+xml,%3Csvg width='10' height='6' viewBox='0 0 10 6' fill='none' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M1 1L5 5L9 1' stroke='%235F6577' stroke-width='1.5' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E")`,
                      backgroundRepeat: "no-repeat",
                      backgroundPosition: "right 6px center",
                    }}
                  >
                    {PAGE_SIZES.map((n) => (
                      <option key={n} value={n}>{n}</option>
                    ))}
                  </select>
                </div>
                <div style={{ display: "flex", gap: "4px" }}>
                  <button
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    style={{
                      ...navBtnStyle,
                      cursor: currentPage === 1 ? "not-allowed" : "pointer",
                      opacity: currentPage === 1 ? 0.5 : 1,
                    }}
                  >
                    <ChevronLeft size={12} />
                    <span style={{ fontSize: "11px" }}>Prev</span>
                  </button>
                  <div style={{
                    fontSize: "11px",
                    color: "#5F6577",
                    padding: "4px 10px",
                    display: "flex",
                    alignItems: "center",
                  }}>
                    {currentPage} / {totalPages}
                  </div>
                  <button
                    onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages || totalPages === 0}
                    style={{
                      ...navBtnStyle,
                      cursor: currentPage === totalPages ? "not-allowed" : "pointer",
                      opacity: currentPage === totalPages ? 0.5 : 1,
                    }}
                  >
                    <span style={{ fontSize: "11px" }}>Next</span>
                    <ChevronRight size={12} />
                  </button>
                </div>
              </div>
            </div>
          )}
        </>
      )}
      <InvoiceModal
        open={viewInvoiceOpen}
        booking={null}
        existingInvoice={viewInvoice}
        onClose={() => { setViewInvoiceOpen(false); setViewInvoice(null); }}
        onSuccess={() => {}}
      />
      <InvoiceModal
        open={invoiceOpen}
        booking={invoiceBooking}
        onClose={() => { setInvoiceOpen(false); setInvoiceBooking(null); }}
        onSuccess={invalidateAfterMutation}
      />
    </div>
  );
}

function TableAction({
  icon, label, bg, color, hoverBg, onClick, disabled,
}: {
  icon: React.ReactNode;
  label: string;
  bg: string;
  color: string;
  hoverBg: string;
  onClick: () => void;
  disabled?: boolean;
}) {
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

const tableHeaderStyle: React.CSSProperties = {
  padding: "10px 16px",
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
  padding: "12px 16px",
  verticalAlign: "middle",
};

const navBtnStyle: React.CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  gap: "3px",
  padding: "4px 10px",
  border: "1px solid #E6E4DF",
  borderRadius: "6px",
  background: "#fff",
  color: "#5F6577",
  fontFamily: "'DM Sans', sans-serif",
  transition: "all 0.15s",
};