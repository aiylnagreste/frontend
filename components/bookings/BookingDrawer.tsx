// components/bookings/BookingDrawer.tsx
"use client";

import { useState, useEffect } from "react";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { api } from "@/lib/api";
import { QK, fetchBranches, fetchStaff, fetchServices, fetchTimings, fetchBookings } from "@/lib/queries";
import { ModalShell } from "@/components/ui/ModalShell";
import type { Booking, Branch, Staff, Service, SalonTimings } from "@/lib/types";
import { validateName, validatePhoneRequired } from "@/lib/validation";
import { User, Phone, Scissors, MapPin, Calendar, Clock, Users, FileText } from "lucide-react";

const EMPTY_BOOKINGS: Booking[] = [];

interface BookingDrawerProps {
  open: boolean;
  onClose: () => void;
  editing: Booking | null;
  prefillBranch?: string;
  editMode?: 'full' | 'limited';
  onSuccess?: () => void; // Add this line
}

export function BookingDrawer({ open, onClose, editing, prefillBranch, editMode = 'full' , onSuccess }: BookingDrawerProps) {
  const qc = useQueryClient();
  const [form, setForm] = useState({
    customer_name: "",
    phone: "",
    service: "",
    branch: "",
    date: "",
    time: "",
    staff_name: "",
    status: "confirmed" as Booking["status"],
    notes: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [availableSlots, setAvailableSlots] = useState<string[]>([]);
  const [slotsLoading, setSlotsLoading] = useState(false);

  const isLimitedEdit = editMode === 'limited' && editing !== null;

  const { data: branches = [], isSuccess: branchesReady } = useQuery<Branch[]>({
    queryKey: QK.branches(),
    queryFn: fetchBranches,
    enabled: open,
  });

  const { data: staff = [], isSuccess: staffReady } = useQuery<Staff[]>({
    queryKey: QK.staff(),
    queryFn: fetchStaff,
    enabled: open,
  });

  const { data: services = [], isSuccess: servicesReady } = useQuery<Service[]>({
    queryKey: QK.services(),
    queryFn: fetchServices,
    enabled: open,
  });

  const { data: timings } = useQuery<SalonTimings>({
    queryKey: QK.timings(),
    queryFn: fetchTimings,
    enabled: open,
  });

  const { data: allBookings = EMPTY_BOOKINGS } = useQuery<Booking[]>({
    queryKey: QK.bookings({}),
    queryFn: () => fetchBookings(),
    enabled: open,
  });

  const filteredStaff = staff.filter((s) =>
    !form.branch || s.branch_id === null || s.branch_name === form.branch
  );

  useEffect(() => {
    if (open) {
      if (editing) {
        setForm({
          customer_name: editing.customer_name || "",
          phone: editing.phone || "",
          service: editing.service || "",
          branch: editing.branch || "",
          date: editing.date || "",
          time: editing.time || "",
          staff_name: editing.staff_name || "",
          status: editing.status || "confirmed",
          notes: editing.notes || "",
        });
      } else {
        const today = new Date().toISOString().slice(0, 10);
        setForm({
          customer_name: "",
          phone: "",
          service: "",
          branch: prefillBranch || "",
          date: today,
          time: "",
          staff_name: "",
          status: "confirmed",
          notes: "",
        });
      }
      setErrors({});
      setAvailableSlots([]);
    }
  }, [open, editing, prefillBranch]);

  function calculateAvailableSlots(date: string, durationMinutes: number): string[] {
    const slots: string[] = [];

    const selectedBranch = branches.find(b => b.name === form.branch);
    if (!selectedBranch) return slots;

    const dayOfWeek = new Date(date).getDay();
    const dayType = (dayOfWeek === 0 || dayOfWeek === 6) ? 'weekend' : 'workday';

    const timing = timings?.[dayType as keyof SalonTimings];
    if (!timing) return slots;

    const [openH, openM] = timing.open_time.split(':').map(Number);
    const [closeH, closeM] = timing.close_time.split(':').map(Number);
    const openMinutes = openH * 60 + openM;
    const closeMinutes = closeH * 60 + closeM;

    const todayStr = new Date().toISOString().slice(0, 10);
    const isToday = date === todayStr;
    const nowMinutes = isToday
      ? new Date().getHours() * 60 + new Date().getMinutes()
      : -1;

    const dateBookings = allBookings.filter(b =>
      b.date === date &&
      b.status === 'confirmed' &&
      b.branch === form.branch &&
      (!editing || b.id !== editing.id)
    );

    const nonServiceRoles = ['admin', 'manager', 'receptionist'];
    const availableStaff = staff.filter(s =>
      s.status === 'active' &&
      !nonServiceRoles.includes((s.role || '').toLowerCase()) &&
      (s.branch_name === form.branch || s.branch_id === null)
    );

    if (availableStaff.length === 0) return slots;

    let currentSlot = isToday
      ? Math.max(openMinutes, Math.ceil((nowMinutes + 1) / 30) * 30)
      : openMinutes;

    while (currentSlot + durationMinutes <= closeMinutes) {
      const hours = Math.floor(currentSlot / 60);
      const minutes = currentSlot % 60;
      const slotStartStr = `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
      const slotEnd = currentSlot + durationMinutes;

      const anyStaffFree = availableStaff.some(staffMember => {
        const staffBookings = dateBookings.filter(b => b.staff_id === staffMember.id);
        if (staffBookings.length === 0) return true;

        return !staffBookings.some(booking => {
          const [bH, bM] = (booking.time || '').split(':').map(Number);
          let bookingEnd;
          if (booking.endTime) {
            const [eH, eM] = booking.endTime.split(':').map(Number);
            bookingEnd = eH * 60 + eM;
          } else {
            const bookingService = services.find(s => s.name === booking.service);
            const bookingDuration = bookingService?.durationMinutes || 60;
            bookingEnd = (bH * 60 + bM) + bookingDuration;
          }
          const bookingStart = bH * 60 + bM;
          return currentSlot < bookingEnd && slotEnd > bookingStart;
        });
      });

      if (anyStaffFree) {
        slots.push(slotStartStr);
      }

      currentSlot += 30;
    }

    return slots;
  }

  useEffect(() => {
    if (isLimitedEdit) {
      setAvailableSlots([]);
      return;
    }

    if (!form.branch || !form.date || !form.service || !timings) {
      setAvailableSlots([]);
      return;
    }

    setSlotsLoading(true);
    try {
      const selectedService = services.find(s => s.name === form.service);
      const duration = selectedService?.durationMinutes || 60;
      const slots = calculateAvailableSlots(form.date, duration);
      setAvailableSlots(slots);

      if (slots.length > 0 && !form.time) {
        setForm(prev => ({ ...prev, time: slots[0] }));
      }
    } catch (e) {
      console.error("Failed to calculate slots:", e);
      setAvailableSlots([]);
    } finally {
      setSlotsLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form.branch, form.date, form.service, timings, allBookings, staffReady, branchesReady, servicesReady, isLimitedEdit]);

  function validate(): boolean {
    const errs: Record<string, string> = {};
    const nameErr = validateName(form.customer_name);
    if (nameErr) errs.customer_name = nameErr === "This field is required" ? "Customer name is required" : nameErr;
    const phoneErr = validatePhoneRequired(form.phone);
    if (phoneErr) errs.phone = phoneErr;
    if (!form.service) errs.service = "Service is required";
    if (!form.branch) errs.branch = "Branch is required";
    if (!form.date) errs.date = "Date is required";
    if (!form.time) {
      errs.time = "Time is required";
    } else {
      const todayStr = new Date().toISOString().slice(0, 10);
      if (form.date === todayStr) {
        const now = new Date();
        const nowMins = now.getHours() * 60 + now.getMinutes();
        const [th, tm] = form.time.split(':').map(Number);
        if (th * 60 + tm <= nowMins) {
          errs.time = "Past time cannot be selected";
        }
      }
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  }

  async function handleSubmit(e: React.FormEvent) {
  e.preventDefault();
  if (!validate()) return;

  setIsSubmitting(true);
  try {
    const payload = {
      ...form,
      staff_name: form.staff_name || null,
      notes: form.notes || null,
    };

    if (editing) {
      await api.put(`/salon-admin/api/bookings/${editing.id}`, payload);
      toast.success("Appointment updated");
    } else {
      await api.post("/salon-admin/api/bookings", payload);
      toast.success("Appointment created");
    }

    qc.invalidateQueries({ queryKey: QK.bookings() });
    qc.invalidateQueries({ queryKey: ["stats"] });
    
    // ADD THIS: Invalidate analytics queries
    qc.invalidateQueries({ queryKey: ["analytics"] });
    
    // Also invalidate specific timeframe queries to be thorough
    const timeframes = ["day", "week", "month", "year"];
    timeframes.forEach(timeframe => {
      // Invalidate for all branches (no branch filter)
      qc.invalidateQueries({ 
        queryKey: QK.analytics({ period: timeframe, status: "completed" }) 
      });
      qc.invalidateQueries({ 
        queryKey: QK.analytics({ period: timeframe, status: "confirmed,completed" }) 
      });
      
      // If you have branch-specific analytics, invalidate those too
      // You might need to get the current branch from props or context
      if (prefillBranch) {
        qc.invalidateQueries({ 
          queryKey: QK.analytics({ period: timeframe, branch: prefillBranch, status: "completed" }) 
        });
        qc.invalidateQueries({ 
          queryKey: QK.analytics({ period: timeframe, branch: prefillBranch, status: "confirmed,completed" }) 
        });
      }
    });

    // Call onSuccess before closing to refresh analytics
    onSuccess?.();

    onClose();
  } catch (e) {
    toast.error(e instanceof Error ? e.message : "Failed to save appointment");
  } finally {
    setIsSubmitting(false);
  }
}

  const today = new Date().toISOString().slice(0, 10);

  const hasError = (field: string) => !!errors[field];

  const errorInputStyle = (field: string): React.CSSProperties => ({
    borderColor: hasError(field) ? "#DC2626" : undefined,
    boxShadow: hasError(field) ? "0 0 0 3px rgba(220,38,38,0.1)" : undefined,
  });

  const disabledInputStyle: React.CSSProperties = {
    backgroundColor: "#F8F8F6",
    cursor: "not-allowed",
    color: "#64748B",
  };

  return (
    <ModalShell
      open={open}
      onClose={onClose}
      title={editing ? "Edit Appointment" : "New Appointment"}
      width={520}
    >
      <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "18px" }}>

        {/* Client Name & Phone row */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
          <div>
            <label style={labelStyle}>Client Name <span style={{ color: "#b5484b" }}>*</span></label>
            <div style={{ position: "relative" }}>
              <div style={iconBox}>
                <User size={15} color="#9CA3B4" strokeWidth={1.8} />
              </div>
              <input
                type="text"
                value={form.customer_name}
                onChange={(e) => setForm({ ...form, customer_name: e.target.value })}
                placeholder="John Doe"
                disabled={isLimitedEdit}
                style={{
                  ...inputStyle,
                  paddingLeft: "40px",
                  ...errorInputStyle("customer_name"),
                  ...(isLimitedEdit ? disabledInputStyle : {}),
                }}
                onFocus={(e) => { if (!hasError("customer_name") && !isLimitedEdit) { e.target.style.borderColor = "#b5484b"; e.target.style.boxShadow = "0 0 0 3px rgba(181,72,75,0.1)"; }}}
                onBlur={(e) => { if (!hasError("customer_name") && !isLimitedEdit) { e.target.style.borderColor = "#E6E4DF"; e.target.style.boxShadow = "none"; }}}
                autoFocus={!isLimitedEdit}
              />
            </div>
            {errors.customer_name && <span style={errorStyle}>{errors.customer_name}</span>}
          </div>

          <div>
            <label style={labelStyle}>Phone <span style={{ color: "#b5484b" }}>*</span></label>
            <div style={{ position: "relative" }}>
              <div style={iconBox}>
                <Phone size={15} color="#9CA3B4" strokeWidth={1.8} />
              </div>
              <input
                type="tel"
                inputMode="tel"
                maxLength={20}
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                placeholder="+92 300 1234567"
                disabled={isLimitedEdit}
                style={{
                  ...inputStyle,
                  paddingLeft: "40px",
                  ...errorInputStyle("phone"),
                  ...(isLimitedEdit ? disabledInputStyle : {}),
                }}
                onFocus={(e) => { if (!hasError("phone") && !isLimitedEdit) { e.target.style.borderColor = "#b5484b"; e.target.style.boxShadow = "0 0 0 3px rgba(181,72,75,0.1)"; }}}
                onBlur={(e) => {
                  if (isLimitedEdit) return;
                  const err = validatePhoneRequired(form.phone);
                  setErrors(prev => ({ ...prev, phone: err || "" }));
                  if (!err) { e.target.style.borderColor = "#E6E4DF"; e.target.style.boxShadow = "none"; }
                }}
              />
            </div>
            {errors.phone && <span style={errorStyle}>{errors.phone}</span>}
          </div>
        </div>

        {/* Service & Branch row */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
          <div>
            <label style={labelStyle}>Service <span style={{ color: "#b5484b" }}>*</span></label>
            <div style={{ position: "relative" }}>
              <div style={iconBox}>
                <Scissors size={15} color="#9CA3B4" strokeWidth={1.8} />
              </div>
              <select
                value={form.service}
                onChange={(e) => setForm({ ...form, service: e.target.value, time: "" })}
                style={{
                  ...selectStyle,
                  paddingLeft: "40px",
                  ...errorInputStyle("service"),
                }}
                onFocus={(e) => { if (!hasError("service")) { e.target.style.borderColor = "#b5484b"; e.target.style.boxShadow = "0 0 0 3px rgba(181,72,75,0.1)"; }}}
                onBlur={(e) => { if (!hasError("service")) { e.target.style.borderColor = "#E6E4DF"; e.target.style.boxShadow = "none"; }}}
              >
                <option value="">Select a service</option>
                {services.map((s) => (
                  <option key={s.id} value={s.name}>{s.name} — {s.price}</option>
                ))}
              </select>
            </div>
            {errors.service && <span style={errorStyle}>{errors.service}</span>}
          </div>

          <div>
            <label style={labelStyle}>Branch <span style={{ color: "#b5484b" }}>*</span></label>
            <div style={{ position: "relative" }}>
              <div style={iconBox}>
                <MapPin size={15} color="#9CA3B4" strokeWidth={1.8} />
              </div>
              <select
                value={form.branch}
                onChange={(e) => setForm({ ...form, branch: e.target.value, time: "" })}
                style={{
                  ...selectStyle,
                  paddingLeft: "40px",
                  ...errorInputStyle("branch"),
                }}
                onFocus={(e) => { if (!hasError("branch")) { e.target.style.borderColor = "#b5484b"; e.target.style.boxShadow = "0 0 0 3px rgba(181,72,75,0.1)"; }}}
                onBlur={(e) => { if (!hasError("branch")) { e.target.style.borderColor = "#E6E4DF"; e.target.style.boxShadow = "none"; }}}
              >
                <option value="">Select a branch</option>
                {branches.map((b) => (
                  <option key={b.id} value={b.name}>{b.name}</option>
                ))}
              </select>
            </div>
            {errors.branch && <span style={errorStyle}>{errors.branch}</span>}
          </div>
        </div>

        {/* Date and Time */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
          <div>
            <label style={labelStyle}>Date <span style={{ color: "#b5484b" }}>*</span></label>
            <div style={{ position: "relative" }}>
              <div style={iconBox}>
                <Calendar size={15} color="#9CA3B4" strokeWidth={1.8} />
              </div>
              <input
                type="date"
                value={form.date}
                min={today}
                onChange={(e) => setForm({ ...form, date: e.target.value, time: "" })}
                disabled={isLimitedEdit}
                style={{
                  ...inputStyle,
                  paddingLeft: "40px",
                  paddingRight: "14px",
                  ...errorInputStyle("date"),
                  ...(isLimitedEdit ? disabledInputStyle : {}),
                }}
                onFocus={(e) => { if (!hasError("date") && !isLimitedEdit) { e.target.style.borderColor = "#b5484b"; e.target.style.boxShadow = "0 0 0 3px rgba(181,72,75,0.1)"; }}}
                onBlur={(e) => { if (!hasError("date") && !isLimitedEdit) { e.target.style.borderColor = "#E6E4DF"; e.target.style.boxShadow = "none"; }}}
              />
            </div>
            {errors.date && <span style={errorStyle}>{errors.date}</span>}
          </div>

          <div>
            <label style={labelStyle}>Time <span style={{ color: "#b5484b" }}>*</span></label>
            {isLimitedEdit ? (
              <div style={{ position: "relative" }}>
                <div style={iconBox}>
                  <Clock size={15} color="#D1D5DB" strokeWidth={1.8} />
                </div>
                <input
                  type="text"
                  value={form.time}
                  disabled
                  style={{ ...inputStyle, paddingLeft: "40px", ...disabledInputStyle }}
                />
              </div>
            ) : slotsLoading ? (
              <div style={{ ...slotPlaceholder, color: "#5F6577" }}>
                <div style={shimmerDot} />
                <span>Finding slots…</span>
              </div>
            ) : availableSlots.length > 0 ? (
              <div style={{ position: "relative" }}>
                <div style={iconBox}>
                  <Clock size={15} color="#9CA3B4" strokeWidth={1.8} />
                </div>
                <select
                  value={form.time}
                  onChange={(e) => setForm({ ...form, time: e.target.value })}
                  style={{
                    ...selectStyle,
                    paddingLeft: "40px",
                    ...errorInputStyle("time"),
                  }}
                  onFocus={(e) => { if (!hasError("time")) { e.target.style.borderColor = "#b5484b"; e.target.style.boxShadow = "0 0 0 3px rgba(181,72,75,0.1)"; }}}
                  onBlur={(e) => { if (!hasError("time")) { e.target.style.borderColor = "#E6E4DF"; e.target.style.boxShadow = "none"; }}}
                >
                  <option value="">Select a time</option>
                  {availableSlots.map((slot) => {
                    const [hours, minutes] = slot.split(':').map(Number);
                    const period = hours >= 12 ? 'PM' : 'AM';
                    const displayHours = hours % 12 || 12;
                    const displayTime = `${displayHours}:${minutes.toString().padStart(2, '0')} ${period}`;
                    return (
                      <option key={slot} value={slot}>{displayTime}</option>
                    );
                  })}
                </select>
              </div>
            ) : form.branch && form.date && form.service ? (
              <div style={noSlotsBox}>
                No slots available
              </div>
            ) : (
              <div style={slotPlaceholder}>
                Select date & service
              </div>
            )}
            {errors.time && <span style={errorStyle}>{errors.time}</span>}
          </div>
        </div>

        {/* Staff & Status row */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
          <div>
            <label style={labelStyle}>Preferred Staff</label>
            <div style={{ position: "relative" }}>
              <div style={iconBox}>
                <Users size={15} color="#9CA3B4" strokeWidth={1.8} />
              </div>
              <select
                value={form.staff_name}
                onChange={(e) => setForm({ ...form, staff_name: e.target.value })}
                disabled={isLimitedEdit}
                style={{
                  ...selectStyle,
                  paddingLeft: "40px",
                  ...(isLimitedEdit ? disabledInputStyle : {}),
                }}
                onFocus={(e) => { if (!isLimitedEdit) { e.target.style.borderColor = "#b5484b"; e.target.style.boxShadow = "0 0 0 3px rgba(181,72,75,0.1)"; }}}
                onBlur={(e) => { if (!isLimitedEdit) { e.target.style.borderColor = "#E6E4DF"; e.target.style.boxShadow = "none"; }}}
              >
                <option value="">No preference</option>
                {filteredStaff.map((s) => (
                  <option key={s.id} value={s.name}>{s.name}</option>
                ))}
              </select>
            </div>
            <span style={{ fontSize: "11px", color: "#9CA3B4", marginTop: "4px", display: "block" }}>
              Leave empty for any available staff
            </span>
          </div>

          <div>
            <label style={labelStyle}>Status</label>
            <select
              value={form.status}
              onChange={(e) => setForm({ ...form, status: e.target.value as Booking["status"] })}
              style={selectStyle}
              onFocus={(e) => { e.target.style.borderColor = "#b5484b"; e.target.style.boxShadow = "0 0 0 3px rgba(181,72,75,0.1)"; }}
              onBlur={(e) => { e.target.style.borderColor = "#E6E4DF"; e.target.style.boxShadow = "none"; }}
            >
              <option value="confirmed">Confirmed</option>
              <option value="completed">Completed</option>
              <option value="canceled">Canceled</option>
              <option value="no_show">Missed</option>
            </select>
          </div>
        </div>

        {/* Notes */}
        <div>
          <label style={labelStyle}>Notes</label>
          <div style={{ position: "relative" }}>
            <div style={{ ...iconBox, top: "14px" }}>
              <FileText size={15} color="#9CA3B4" strokeWidth={1.8} />
            </div>
            <textarea
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
              placeholder="Any special requests or notes…"
              rows={3}
              disabled={isLimitedEdit}
              style={{
                ...inputStyle,
                paddingLeft: "40px",
                fontFamily: "'DM Sans', sans-serif",
                resize: "vertical",
                lineHeight: 1.6,
                ...(isLimitedEdit ? disabledInputStyle : {}),
              }}
              onFocus={(e) => { if (!isLimitedEdit) { e.target.style.borderColor = "#b5484b"; e.target.style.boxShadow = "0 0 0 3px rgba(181,72,75,0.1)"; }}}
              onBlur={(e) => { if (!isLimitedEdit) { e.target.style.borderColor = "#E6E4DF"; e.target.style.boxShadow = "none"; }}}
            />
          </div>
        </div>

        {/* Actions */}
        <div style={{
          display: "flex",
          gap: "10px",
          justifyContent: "flex-end",
          borderTop: "1px solid #E6E4DF",
          paddingTop: "20px",
          marginTop: "4px",
        }}>
          <button
            type="button"
            onClick={onClose}
            style={{
              ...secondaryBtn,
              transition: "background 0.15s, color 0.15s",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = "#F8F8F6";
              e.currentTarget.style.color = "#1A1D23";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "transparent";
              e.currentTarget.style.color = "#5F6577";
            }}
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            style={{
              ...primaryBtn,
              opacity: isSubmitting ? 0.7 : 1,
              cursor: isSubmitting ? "not-allowed" : "pointer",
              transition: "opacity 0.2s",
            }}
          >
            {isSubmitting ? "Saving…" : editing ? "Update Appointment" : "Create Appointment"}
          </button>
        </div>
      </form>
    </ModalShell>
  );
}

const labelStyle: React.CSSProperties = {
  display: "block",
  fontSize: "12px",
  fontWeight: 600,
  color: "#5F6577",
  textTransform: "uppercase",
  letterSpacing: "0.05em",
  marginBottom: "8px",
  fontFamily: "'DM Sans', sans-serif",
};

const inputStyle: React.CSSProperties = {
  width: "100%",
  padding: "10px 14px",
  border: "1.5px solid #E6E4DF",
  borderRadius: "8px",
  fontSize: "14px",
  outline: "none",
  backgroundColor: "#fff",
  color: "#1A1D23",
  fontFamily: "'DM Sans', sans-serif",
  transition: "border-color 0.2s, box-shadow 0.2s",
  boxSizing: "border-box",
};

const selectStyle: React.CSSProperties = {
  ...inputStyle,
  cursor: "pointer",
  appearance: "none",
  backgroundImage: `url("data:image/svg+xml,%3Csvg width='10' height='6' viewBox='0 0 10 6' fill='none' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M1 1L5 5L9 1' stroke='%235F6577' stroke-width='1.5' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E")`,
  backgroundRepeat: "no-repeat",
  backgroundPosition: "right 14px center",
  paddingRight: "36px",
};

const errorStyle: React.CSSProperties = {
  display: "block",
  fontSize: "12px",
  color: "#DC2626",
  marginTop: "5px",
  fontWeight: 500,
};

const primaryBtn: React.CSSProperties = {
  padding: "10px 24px",
  background: "linear-gradient(135deg, #b5484b, #6b3057)",
  color: "#fff",
  border: "none",
  borderRadius: "8px",
  fontSize: "13px",
  fontWeight: 600,
  fontFamily: "'DM Sans', sans-serif",
};

const secondaryBtn: React.CSSProperties = {
  padding: "10px 20px",
  backgroundColor: "transparent",
  border: "1px solid #E6E4DF",
  borderRadius: "8px",
  fontSize: "13px",
  fontWeight: 500,
  color: "#5F6577",
  cursor: "pointer",
  fontFamily: "'DM Sans', sans-serif",
};

const iconBox: React.CSSProperties = {
  position: "absolute",
  left: "12px",
  top: "50%",
  transform: "translateY(-50%)",
  width: "20px",
  height: "20px",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  pointerEvents: "none",
};

const slotPlaceholder: React.CSSProperties = {
  padding: "10px 14px",
  color: "#9CA3B4",
  fontSize: "14px",
  backgroundColor: "#F8F8F6",
  borderRadius: "8px",
  border: "1px solid #E6E4DF",
  display: "flex",
  alignItems: "center",
  gap: "8px",
  fontFamily: "'DM Sans', sans-serif",
  height: "40px",
  boxSizing: "border-box",
};

const shimmerDot: React.CSSProperties = {
  width: 12,
  height: 12,
  borderRadius: "50%",
  border: "2px solid #D1D5DB",
  borderTopColor: "transparent",
  animation: "spin 0.8s linear infinite",
};

const noSlotsBox: React.CSSProperties = {
  padding: "10px 14px",
  color: "#DC2626",
  fontSize: "13px",
  backgroundColor: "#FEF2F2",
  borderRadius: "8px",
  border: "1px solid #FECDD3",
  fontWeight: 500,
  fontFamily: "'DM Sans', sans-serif",
  height: "40px",
  boxSizing: "border-box",
  display: "flex",
  alignItems: "center",
};