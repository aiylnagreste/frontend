// components/bookings/InvoiceModal.tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { ModalShell } from "@/components/ui/ModalShell";
import { api } from "@/lib/api";
import { fetchDeals, fetchServices, QK } from "@/lib/queries";
import type { Booking, CreateInvoicePayload, Deal, Invoice, PaymentType, Service } from "@/lib/types";
import { toast } from "sonner";

interface InvoiceModalProps {
  open: boolean;
  booking: Booking | null;
  onClose: () => void;
  onSuccess: () => void;
}

type FormState = {
  extraServices: string;
  tips: string;
  selectedDealIds: number[];
  paymentType: PaymentType;
};

const EMPTY_FORM: FormState = {
  extraServices: "0",
  tips: "0",
  selectedDealIds: [],
  paymentType: "cash",
};

export function InvoiceModal({ open, booking, onClose, onSuccess }: InvoiceModalProps) {
  // Form state — single object so useEffect can reset atomically
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Fetch dropdown data (only when modal is open; TanStack handles dedup)
  const { data: services = [] } = useQuery<Service[]>({
    queryKey: QK.services(),
    queryFn: fetchServices,
    staleTime: 10 * 60_000,
    enabled: open,
  });

  const { data: deals = [] } = useQuery<Deal[]>({
    queryKey: QK.deals(),
    queryFn: fetchDeals,
    staleTime: 10 * 60_000,
    enabled: open,
  });

  // Reset form when modal opens/closes or booking changes
  useEffect(() => {
    if (open) {
      setForm(EMPTY_FORM);
      setErrors({});
    }
  }, [open, booking?.id]);

  // Resolve service price from services list (TEXT → number)
  const servicePrice = useMemo(() => {
    if (!booking) return 0;
    const svc = services.find((s) => s.name === booking.service);
    const raw = String(svc?.price ?? "0").replace(/[^0-9.]/g, "");
    return parseFloat(raw) || 0;
  }, [booking, services]);

  // Only show active deals
  const activeDeals = useMemo(() => deals.filter((d) => d.active === 1), [deals]);

  // Additive discount stacking — cap at 100%
  const totalDealOffPct = useMemo(() => {
    const sum = activeDeals
      .filter((d) => form.selectedDealIds.includes(d.id))
      .reduce((acc, d) => acc + (Number(d.off) || 0), 0);
    return Math.min(100, sum);
  }, [activeDeals, form.selectedDealIds]);

  const discountAmount = useMemo(
    () => servicePrice * (totalDealOffPct / 100),
    [servicePrice, totalDealOffPct]
  );

  const extrasNum = Number(form.extraServices) || 0;
  const tipsNum = Number(form.tips) || 0;
  const total = useMemo(
    () => Math.max(0, (servicePrice - discountAmount) + extrasNum + tipsNum),
    [servicePrice, discountAmount, extrasNum, tipsNum]
  );

  const createMutation = useMutation<Invoice, Error, CreateInvoicePayload>({
    mutationFn: (payload) => api.post<Invoice>("/salon-admin/api/invoices", payload),
    onSuccess: () => {
      toast.success("Invoice generated — booking completed");
      onSuccess();
      onClose();
    },
    onError: (e) => toast.error(e.message),
  });

  function validate(): boolean {
    const next: Record<string, string> = {};
    if (!booking) next._form = "No booking selected";
    if (extrasNum < 0 || !Number.isFinite(extrasNum)) next.extraServices = "Must be a non-negative number";
    if (tipsNum < 0 || !Number.isFinite(tipsNum)) next.tips = "Must be a non-negative number";
    if (!["cash", "card", "bank_to_bank"].includes(form.paymentType)) next.paymentType = "Select a payment type";
    setErrors(next);
    return Object.keys(next).length === 0;
  }

  function handleSubmit() {
    if (!booking || !validate()) return;
    createMutation.mutate({
      booking_id: booking.id,
      extra_services_price: extrasNum,
      tips: tipsNum,
      deal_ids: form.selectedDealIds,
      payment_type: form.paymentType,
    });
  }

  if (!booking) return null;

  return (
    <ModalShell open={open} onClose={onClose} title="Generate Invoice" width={560}>
      <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>

        {/* Read-only pre-fill block */}
        <div style={{ background: "#F8F7F6", border: "1px solid #E8E3E0", borderRadius: "10px", padding: "12px 14px" }}>
          <ReadOnlyRow label="Client" value={`${booking.customer_name} · ${booking.phone}`} />
          <ReadOnlyRow label="Service" value={booking.service} />
          <ReadOnlyRow label="Time" value={`${booking.time}${booking.endTime ? " → " + booking.endTime : ""}`} />
          <ReadOnlyRow label="Staff" value={booking.staff_name || "—"} />
        </div>

        {/* Extra services */}
        <Field label="Extra services price" error={errors.extraServices}>
          <input
            type="number"
            min="0"
            step="0.01"
            value={form.extraServices}
            onChange={(e) => setForm((prev) => ({ ...prev, extraServices: e.target.value }))}
            style={inputStyle}
          />
        </Field>

        {/* Deals multi-select */}
        <div>
          <label style={labelStyle}>Deals (stackable)</label>
          {activeDeals.length === 0 ? (
            <div style={{ fontSize: "13px", color: "var(--color-sub)", marginTop: "6px" }}>No active deals</div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "6px", marginTop: "6px" }}>
              {activeDeals.map((d) => {
                const checked = form.selectedDealIds.includes(d.id);
                return (
                  <label
                    key={d.id}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "8px",
                      cursor: "pointer",
                      padding: "6px 10px",
                      border: "1px solid #E8E3E0",
                      borderRadius: "8px",
                      background: checked ? "#FEF3C7" : "#fff",
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={(e) => {
                        setForm((prev) => ({
                          ...prev,
                          selectedDealIds: e.target.checked
                            ? [...prev.selectedDealIds, d.id]
                            : prev.selectedDealIds.filter((id) => id !== d.id),
                        }));
                      }}
                    />
                    <span style={{ fontSize: "13px", fontWeight: 600 }}>{d.title}</span>
                    <span style={{ fontSize: "12px", color: "#92400E", marginLeft: "auto", fontWeight: 700 }}>{d.off}% OFF</span>
                  </label>
                );
              })}
              {totalDealOffPct > 0 && (
                <div style={{ fontSize: "12px", color: "var(--color-sub)", marginTop: "4px" }}>
                  Combined discount: <strong>{totalDealOffPct}%</strong>
                  {totalDealOffPct === 100 && " (capped at 100%)"}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Tips */}
        <Field label="Tips (for staff)" error={errors.tips}>
          <input
            type="number"
            min="0"
            step="0.01"
            value={form.tips}
            onChange={(e) => setForm((prev) => ({ ...prev, tips: e.target.value }))}
            style={inputStyle}
          />
        </Field>

        {/* Payment type radios */}
        <div>
          <label style={labelStyle}>Payment type</label>
          <div style={{ display: "flex", gap: "8px", marginTop: "6px", flexWrap: "wrap" }}>
            {(
              [
                { v: "cash", label: "Cash" },
                { v: "card", label: "By Card" },
                { v: "bank_to_bank", label: "Bank to Bank" },
              ] as const
            ).map((opt) => (
              <label
                key={opt.v}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                  padding: "8px 14px",
                  border: "1px solid #E8E3E0",
                  borderRadius: "8px",
                  cursor: "pointer",
                  background: form.paymentType === opt.v ? "#FEF3C7" : "#fff",
                }}
              >
                <input
                  type="radio"
                  name="paymentType"
                  value={opt.v}
                  checked={form.paymentType === opt.v}
                  onChange={() => setForm((prev) => ({ ...prev, paymentType: opt.v }))}
                />
                <span style={{ fontSize: "13px", fontWeight: 600 }}>{opt.label}</span>
              </label>
            ))}
          </div>
          {errors.paymentType && <div style={errorTextStyle}>{errors.paymentType}</div>}
        </div>

        {/* Live totals */}
        <div style={{ borderTop: "1px solid #E8E3E0", paddingTop: "12px", display: "flex", flexDirection: "column", gap: "4px" }}>
          <TotalsRow label="Service price" value={servicePrice} />
          {totalDealOffPct > 0 && <TotalsRow label={`Discount (−${totalDealOffPct}%)`} value={-discountAmount} muted />}
          {extrasNum > 0 && <TotalsRow label="Extra services" value={extrasNum} />}
          {tipsNum > 0 && <TotalsRow label="Tips" value={tipsNum} />}
          <TotalsRow label="Total" value={total} bold />
        </div>

        {/* Actions */}
        <div style={{ display: "flex", gap: "8px", justifyContent: "flex-end", marginTop: "8px" }}>
          <button onClick={onClose} style={secondaryBtnStyle} disabled={createMutation.isPending}>
            Cancel
          </button>
          <button onClick={handleSubmit} style={primaryBtnStyle} disabled={createMutation.isPending}>
            {createMutation.isPending ? "Generating…" : "Generate Invoice"}
          </button>
        </div>
      </div>
    </ModalShell>
  );
}

// --- local helpers (not exported) ---
function Field({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) {
  return (
    <div>
      <label style={labelStyle}>{label}</label>
      <div style={{ marginTop: "4px" }}>{children}</div>
      {error && <div style={errorTextStyle}>{error}</div>}
    </div>
  );
}

function ReadOnlyRow({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", fontSize: "13px", padding: "3px 0" }}>
      <span style={{ color: "var(--color-sub)" }}>{label}</span>
      <span style={{ color: "var(--color-ink)", fontWeight: 600 }}>{value}</span>
    </div>
  );
}

function TotalsRow({ label, value, bold, muted }: { label: string; value: number; bold?: boolean; muted?: boolean }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", fontSize: bold ? "15px" : "13px", fontWeight: bold ? 700 : 500 }}>
      <span style={{ color: muted ? "var(--color-sub)" : "var(--color-ink)" }}>{label}</span>
      <span style={{ color: muted ? "#92400E" : "var(--color-ink)" }}>{value.toFixed(2)}</span>
    </div>
  );
}

const labelStyle: React.CSSProperties = {
  fontSize: "12px",
  fontWeight: 600,
  color: "var(--color-sub)",
  textTransform: "uppercase",
  letterSpacing: "0.04em",
};
const inputStyle: React.CSSProperties = {
  width: "100%",
  padding: "9px 12px",
  border: "1px solid #E8E3E0",
  borderRadius: "8px",
  fontSize: "14px",
  outline: "none",
  fontFamily: "'DM Sans', sans-serif",
  boxSizing: "border-box",
};
const errorTextStyle: React.CSSProperties = { fontSize: "12px", color: "#DC2626", marginTop: "4px" };
const primaryBtnStyle: React.CSSProperties = {
  padding: "9px 18px",
  background: "linear-gradient(135deg, #b5484b, #6b3057)",
  color: "#fff",
  border: "none",
  borderRadius: "8px",
  fontSize: "13px",
  fontWeight: 600,
  cursor: "pointer",
};
const secondaryBtnStyle: React.CSSProperties = {
  padding: "9px 18px",
  background: "#fff",
  color: "#5F6577",
  border: "1px solid #E8E3E0",
  borderRadius: "8px",
  fontSize: "13px",
  fontWeight: 500,
  cursor: "pointer",
};
