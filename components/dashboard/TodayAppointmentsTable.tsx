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
import styles from "./TodayAppointmentsTable.module.css";

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

  function getRowClass(status: string) {
    if (status === "completed") return `${styles.row} ${styles["row--completed"]}`;
    if (status === "no_show") return `${styles.row} ${styles["row--noShow"]}`;
    if (status === "arrived") return `${styles.row} ${styles["row--arrived"]}`;
    return styles.row;
  }

  return (
    <div className={styles.container}>
      {/* Header */}
      <div className={styles.header}>
        <div className={styles.headerLeft}>
          <div className={styles.iconWrap}>
            <CalendarCheck size={16} color="#b5484b" strokeWidth={2} />
          </div>
          <div>
            <h3 className={styles.heading}>
              Today&apos;s Appointments
            </h3>
            <span className={styles.subheading}>
              {totalItems} scheduled
            </span>
          </div>
        </div>
      </div>

      {/* Body */}
      {isLoading ? (
        <div className={styles.skeletonWrap}>
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
          <table className={styles.table}>
            <thead>
              <tr>
                {["Client", "Service", "Time", "Status", "Actions"].map((h) => (
                  <th key={h} className={styles.th}>{h}</th>
                ))}
              </tr>
            </thead>

            {branchEntries.map(([branch, rows]) => (
              <>
                {/* Branch separator */}
                <tbody key={`sep-${branch}`}>
                  <tr>
                    <td colSpan={5} className={styles.branchSepCell}>
                      <div className={styles.branchSepInner}>
                        <span className={styles.branchName}>
                          {branch}
                        </span>
                        <span className={styles.branchCount}>
                          {rows.length} booking{rows.length !== 1 ? "s" : ""}
                        </span>
                      </div>
                    </td>
                  </tr>
                </tbody>

                {/* Branch rows */}
                <tbody key={`rows-${branch}`}>
                  {rows.map((b) => (
                    <tr key={b.id} className={getRowClass(b.status)}>
                      <td className={styles.td}>
                        <div className={styles.clientName}>
                          {b.customer_name}
                        </div>
                        <div className={styles.clientPhone}>
                          {b.phone || "—"}
                        </div>
                      </td>
                      <td className={`${styles.td} ${styles.serviceText}`}>
                        {b.service}
                      </td>
                      <td className={styles.td}>
                        <span className={styles.timeTag}>
                          {formatTime(b.time)}
                        </span>
                        {b.endTime && (
                          <span className={styles.timeEnd}>
                            → {formatTime(b.endTime)}
                          </span>
                        )}
                      </td>
                      <td className={styles.td}>
                        <Badge status={b.status === "no_show" ? "Missed" : b.status} />
                      </td>
                      <td className={styles.td}>
                        <div className={styles.actionsWrap}>
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
            <div className={styles.pagination}>
              <div className={styles.paginationInfo}>
                {startIndex + 1}–{Math.min(endIndex, totalItems)} of {totalItems}
              </div>
              <div className={styles.paginationControls}>
                <div className={styles.pageSizeWrap}>
                  <span className={styles.pageSizeLabel}>Show</span>
                  <select
                    value={pageSize}
                    onChange={(e) => { setPageSize(Number(e.target.value)); setCurrentPage(1); }}
                    className={styles.pageSizeSelect}
                  >
                    {PAGE_SIZES.map((n) => (
                      <option key={n} value={n}>{n}</option>
                    ))}
                  </select>
                </div>
                <div className={styles.navBtns}>
                  <button
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    className={styles.navBtn}
                  >
                    <ChevronLeft size={12} />
                    <span className={styles.navBtnText}>Prev</span>
                  </button>
                  <div className={styles.pageIndicator}>
                    {currentPage} / {totalPages}
                  </div>
                  <button
                    onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages || totalPages === 0}
                    className={styles.navBtn}
                  >
                    <span className={styles.navBtnText}>Next</span>
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
  // CSS variable bridge for dynamic colors
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      style={{
        "--_btn-bg": bg,
        "--_btn-hover-bg": hoverBg,
        "--_btn-color": color,
      } as React.CSSProperties}
      className={styles.tableAction}
    >
      {icon}
      {label}
    </button>
  );
}
