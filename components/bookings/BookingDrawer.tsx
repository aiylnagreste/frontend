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
import s from "./BookingDrawer.module.css";

const EMPTY_BOOKINGS: Booking[] = [];

interface BookingDrawerProps {
  open: boolean;
  onClose: () => void;
  editing: Booking | null;
  prefillBranch?: string;
  editMode?: "full" | "limited";
  onSuccess?: () => void;
}

export function BookingDrawer({ open, onClose, editing, prefillBranch, editMode = "full", onSuccess }: BookingDrawerProps) {
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

  const isLimitedEdit = editMode === "limited" && editing !== null;

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

  const { data: allServices = [], isSuccess: servicesReady } = useQuery<Service[]>({
    queryKey: QK.services(),
    queryFn: fetchServices,
    enabled: open,
  });
  const services = allServices.filter((service) => service.frozen === 0);

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

  const filteredStaff = staff.filter(
    (s) => !form.branch || s.branch_id === null || s.branch_name === form.branch
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

    const selectedBranch = branches.find((b) => b.name === form.branch);
    if (!selectedBranch) return slots;

    const dayOfWeek = new Date(date).getDay();
    const dayType = dayOfWeek === 0 || dayOfWeek === 6 ? "weekend" : "workday";

    const timing = timings?.[dayType as keyof SalonTimings];
    if (!timing) return slots;

    const [openH, openM] = timing.open_time.split(":").map(Number);
    const [closeH, closeM] = timing.close_time.split(":").map(Number);
    const openMinutes = openH * 60 + openM;
    const closeMinutes = closeH * 60 + closeM;

    const todayStr = new Date().toISOString().slice(0, 10);
    const isToday = date === todayStr;
    const nowMinutes = isToday ? new Date().getHours() * 60 + new Date().getMinutes() : -1;

    const dateBookings = allBookings.filter(
      (b) =>
        b.date === date &&
        b.status === "confirmed" &&
        b.branch === form.branch &&
        (!editing || b.id !== editing.id)
    );

    const nonServiceRoles = ["admin", "manager", "receptionist"];
    const availableStaff = staff.filter(
      (s) =>
        s.status === "active" &&
        !nonServiceRoles.includes((s.role || "").toLowerCase()) &&
        (s.branch_name === form.branch || s.branch_id === null)
    );

    if (availableStaff.length === 0) return slots;

    let currentSlot = isToday
      ? Math.max(openMinutes, Math.ceil((nowMinutes + 1) / 30) * 30)
      : openMinutes;

    while (currentSlot + durationMinutes <= closeMinutes) {
      const hours = Math.floor(currentSlot / 60);
      const minutes = currentSlot % 60;
      const slotStartStr = `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`;
      const slotEnd = currentSlot + durationMinutes;

      const anyStaffFree = availableStaff.some((staffMember) => {
        const staffBookings = dateBookings.filter((b) => b.staff_id === staffMember.id);
        if (staffBookings.length === 0) return true;

        return !staffBookings.some((booking) => {
          const [bH, bM] = (booking.time || "").split(":").map(Number);
          let bookingEnd;
          if (booking.endTime) {
            const [eH, eM] = booking.endTime.split(":").map(Number);
            bookingEnd = eH * 60 + eM;
          } else {
            const bookingService = services.find((s) => s.name === booking.service);
            const bookingDuration = bookingService?.durationMinutes || 60;
            bookingEnd = bH * 60 + bM + bookingDuration;
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
      const selectedService = services.find((s) => s.name === form.service);
      const duration = selectedService?.durationMinutes || 60;
      const slots = calculateAvailableSlots(form.date, duration);
      setAvailableSlots(slots);

      if (slots.length > 0 && !form.time) {
        setForm((prev) => ({ ...prev, time: slots[0] }));
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
        const [th, tm] = form.time.split(":").map(Number);
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
      qc.invalidateQueries({ queryKey: ["analytics"] });

      const timeframes = ["day", "week", "month", "year"];
      timeframes.forEach((timeframe) => {
        qc.invalidateQueries({ queryKey: QK.analytics({ period: timeframe, status: "completed" }) });
        qc.invalidateQueries({ queryKey: QK.analytics({ period: timeframe, status: "confirmed,completed" }) });
        if (prefillBranch) {
          qc.invalidateQueries({ queryKey: QK.analytics({ period: timeframe, branch: prefillBranch, status: "completed" }) });
          qc.invalidateQueries({ queryKey: QK.analytics({ period: timeframe, branch: prefillBranch, status: "confirmed,completed" }) });
        }
      });

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

  return (
    <ModalShell
      open={open}
      onClose={onClose}
      title={editing ? "Edit Appointment" : "New Appointment"}
      width={520}
    >
      <form onSubmit={handleSubmit} className={s.form}>
        {/* Client Name & Phone row */}
        <div className={s.row2}>
          <div>
            <label className={s.label}>
              Client Name <span className={s.required}>*</span>
            </label>
            <div className={s.inputWrap}>
              <div className={s.inputIcon}>
                <User size={15} color="#9CA3B4" strokeWidth={1.8} />
              </div>
              <input
                type="text"
                value={form.customer_name}
                onChange={(e) => setForm({ ...form, customer_name: e.target.value })}
                placeholder="John Doe"
                disabled={isLimitedEdit}
                className={`${s.input} ${s["input--padded"]} ${hasError("customer_name") ? s["input--error"] : ""} ${isLimitedEdit ? s["input--disabled"] : ""}`}
                autoFocus={!isLimitedEdit}
              />
            </div>
            {errors.customer_name && <span className={s.errorMsg}>{errors.customer_name}</span>}
          </div>

          <div>
            <label className={s.label}>
              Phone <span className={s.required}>*</span>
            </label>
            <div className={s.inputWrap}>
              <div className={s.inputIcon}>
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
                className={`${s.input} ${s["input--padded"]} ${hasError("phone") ? s["input--error"] : ""} ${isLimitedEdit ? s["input--disabled"] : ""}`}
                onBlur={() => {
                  if (isLimitedEdit) return;
                  const err = validatePhoneRequired(form.phone);
                  setErrors((prev) => ({ ...prev, phone: err || "" }));
                }}
              />
            </div>
            {errors.phone && <span className={s.errorMsg}>{errors.phone}</span>}
          </div>
        </div>

        {/* Service & Branch row */}
        <div className={s.row2}>
          <div>
            <label className={s.label}>
              Service <span className={s.required}>*</span>
            </label>
            <div className={s.inputWrap}>
              <div className={s.inputIcon}>
                <Scissors size={15} color="#9CA3B4" strokeWidth={1.8} />
              </div>
              <select
                value={form.service}
                onChange={(e) => setForm({ ...form, service: e.target.value, time: "" })}
                className={`${s.select} ${s["select--padded"]} ${hasError("service") ? s["select--error"] : ""}`}
              >
                <option value="">Select a service</option>
                {services.map((svc) => (
                  <option key={svc.id} value={svc.name}>{svc.name} — {svc.price}</option>
                ))}
              </select>
            </div>
            {errors.service && <span className={s.errorMsg}>{errors.service}</span>}
          </div>

          <div>
            <label className={s.label}>
              Branch <span className={s.required}>*</span>
            </label>
            <div className={s.inputWrap}>
              <div className={s.inputIcon}>
                <MapPin size={15} color="#9CA3B4" strokeWidth={1.8} />
              </div>
              <select
                value={form.branch}
                onChange={(e) => setForm({ ...form, branch: e.target.value, time: "" })}
                className={`${s.select} ${s["select--padded"]} ${hasError("branch") ? s["select--error"] : ""}`}
              >
                <option value="">Select a branch</option>
                {branches.map((b) => (
                  <option key={b.id} value={b.name}>{b.name}</option>
                ))}
              </select>
            </div>
            {errors.branch && <span className={s.errorMsg}>{errors.branch}</span>}
          </div>
        </div>

        {/* Date and Time */}
        <div className={s.row2}>
          <div>
            <label className={s.label}>
              Date <span className={s.required}>*</span>
            </label>
            <div className={s.inputWrap}>
              <div className={s.inputIcon}>
                <Calendar size={15} color="#9CA3B4" strokeWidth={1.8} />
              </div>
              <input
                type="date"
                value={form.date}
                min={today}
                onChange={(e) => setForm({ ...form, date: e.target.value, time: "" })}
                disabled={isLimitedEdit}
                className={`${s.input} ${s["input--padded"]} ${hasError("date") ? s["input--error"] : ""} ${isLimitedEdit ? s["input--disabled"] : ""}`}
              />
            </div>
            {errors.date && <span className={s.errorMsg}>{errors.date}</span>}
          </div>

          <div>
            <label className={s.label}>
              Time <span className={s.required}>*</span>
            </label>
            {isLimitedEdit ? (
              <div className={s.inputWrap}>
                <div className={s.inputIcon}>
                  <Clock size={15} color="#D1D5DB" strokeWidth={1.8} />
                </div>
                <input
                  type="text"
                  value={form.time}
                  disabled
                  className={`${s.input} ${s["input--padded"]} ${s["input--disabled"]}`}
                />
              </div>
            ) : slotsLoading ? (
              <div className={`${s.slotPlaceholder} ${s.slotLoading}`}>
                <div className={s.shimmerDot} />
                <span>Finding slots…</span>
              </div>
            ) : availableSlots.length > 0 ? (
              <div className={s.inputWrap}>
                <div className={s.inputIcon}>
                  <Clock size={15} color="#9CA3B4" strokeWidth={1.8} />
                </div>
                <select
                  value={form.time}
                  onChange={(e) => setForm({ ...form, time: e.target.value })}
                  className={`${s.select} ${s["select--padded"]} ${hasError("time") ? s["select--error"] : ""}`}
                >
                  <option value="">Select a time</option>
                  {availableSlots.map((slot) => {
                    const [hours, minutes] = slot.split(":").map(Number);
                    const period = hours >= 12 ? "PM" : "AM";
                    const displayHours = hours % 12 || 12;
                    const displayTime = `${displayHours}:${minutes.toString().padStart(2, "0")} ${period}`;
                    return (
                      <option key={slot} value={slot}>{displayTime}</option>
                    );
                  })}
                </select>
              </div>
            ) : form.branch && form.date && form.service ? (
              <div className={s.noSlotsBox}>No slots available</div>
            ) : (
              <div className={s.slotPlaceholder}>Select date & service</div>
            )}
            {errors.time && <span className={s.errorMsg}>{errors.time}</span>}
          </div>
        </div>

        {/* Staff & Status row */}
        <div className={s.row2}>
          <div>
            <label className={s.label}>Preferred Staff</label>
            <div className={s.inputWrap}>
              <div className={s.inputIcon}>
                <Users size={15} color="#9CA3B4" strokeWidth={1.8} />
              </div>
              <select
                value={form.staff_name}
                onChange={(e) => setForm({ ...form, staff_name: e.target.value })}
                disabled={isLimitedEdit}
                className={`${s.select} ${s["select--padded"]} ${isLimitedEdit ? s["select--disabled"] : ""}`}
              >
                <option value="">No preference</option>
                {filteredStaff.map((st) => (
                  <option key={st.id} value={st.name}>{st.name}</option>
                ))}
              </select>
            </div>
            <span className={s.helpText}>Leave empty for any available staff</span>
          </div>

          <div>
            <label className={s.label}>Status</label>
            <select
              value={form.status}
              onChange={(e) => setForm({ ...form, status: e.target.value as Booking["status"] })}
              className={s.select}
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
          <label className={s.label}>Notes</label>
          <div className={s.inputWrap}>
            <div className={`${s.inputIcon} ${s["inputIcon--top"]}`}>
              <FileText size={15} color="#9CA3B4" strokeWidth={1.8} />
            </div>
            <textarea
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
              placeholder="Any special requests or notes…"
              rows={3}
              disabled={isLimitedEdit}
              className={`${s.textarea} ${isLimitedEdit ? s["textarea--disabled"] : ""}`}
            />
          </div>
        </div>

        {/* Actions */}
        <div className={s.actions}>
          <button type="button" onClick={onClose} className={s.secondaryBtn}>
            Cancel
          </button>
          <button type="submit" disabled={isSubmitting} className={s.primaryBtn}>
            {isSubmitting ? "Saving…" : editing ? "Update Appointment" : "Create Appointment"}
          </button>
        </div>
      </form>
    </ModalShell>
  );
}
