// components/bookings/BookingDrawer.tsx
"use client";

import { useState, useEffect } from "react";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { api } from "@/lib/api";
import { QK, fetchBranches, fetchStaff, fetchServices, fetchTimings, fetchBookings } from "@/lib/queries";
import { ModalShell } from "@/components/ui/ModalShell";
import type { Booking, Branch, Staff, Service, SalonTimings } from "@/lib/types";

interface BookingDrawerProps {
    open: boolean;
    onClose: () => void;
    editing: Booking | null;
    prefillBranch?: string;
    editMode?: 'full' | 'limited';
}

export function BookingDrawer({ open, onClose, editing, prefillBranch, editMode = 'full' }: BookingDrawerProps) {
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

    // Fetch data for dropdowns
    const { data: branches = [] } = useQuery<Branch[]>({
        queryKey: QK.branches(),
        queryFn: fetchBranches,
        enabled: open,
    });

    const { data: staff = [] } = useQuery<Staff[]>({
        queryKey: QK.staff(),
        queryFn: fetchStaff,
        enabled: open,
    });

    const { data: services = [] } = useQuery<Service[]>({
        queryKey: QK.services(),
        queryFn: fetchServices,
        enabled: open,
    });

    const { data: timings } = useQuery<SalonTimings>({
        queryKey: QK.timings(),
        queryFn: fetchTimings,
        enabled: open,
    });

    const { data: allBookings = [] } = useQuery<Booking[]>({
        queryKey: QK.bookings({}),
        queryFn: () => fetchBookings(),
        enabled: open,
    });

    // Filter staff by selected branch
    const filteredStaff = staff.filter((s) =>
        !form.branch || s.branch_id === null || s.branch_name === form.branch
    );

    // Reset form when modal opens
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

    // Calculate available slots
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

        const dateBookings = allBookings.filter(b =>
            b.date === date &&
            b.status === 'confirmed' &&
            b.branch === form.branch &&
            (!editing || b.id !== editing.id) // Exclude current booking when editing
        );

        const serviceProviderRoles = ['stylist', 'beautician', 'therapist', 'makeup artist', 'hair stylist', 'nail technician', 'spa therapist'];
        const availableStaff = staff.filter(s =>
            s.status === 'active' &&
            serviceProviderRoles.includes((s.role || '').toLowerCase()) &&
            (s.branch_name === form.branch || s.branch_id === null)
        );

        if (availableStaff.length === 0) return slots;

        let currentSlot = openMinutes;

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

    // Fetch slots when branch, date, and service are selected (only in full mode)
    useEffect(() => {
        if (isLimitedEdit) {
            setAvailableSlots([]);
            return;
        }

        if (!form.branch || !form.date || !form.service || !timings || !allBookings.length) {
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
    }, [form.branch, form.date, form.service, timings, allBookings, isLimitedEdit]);

    function validate(): boolean {
        const errs: Record<string, string> = {};
        if (!form.customer_name.trim()) errs.customer_name = "Customer name is required";
        if (!form.phone.trim()) errs.phone = "Phone number is required";
        if (!form.service) errs.service = "Service is required";
        if (!form.branch) errs.branch = "Branch is required";
        if (!form.date) errs.date = "Date is required";
        if (!form.time) errs.time = "Time is required";
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
            onClose();
        } catch (e) {
            toast.error(e instanceof Error ? e.message : "Failed to save appointment");
        } finally {
            setIsSubmitting(false);
        }
    }

    const today = new Date().toISOString().slice(0, 10);

    return (
        <ModalShell
            open={open}
            onClose={onClose}
            title={editing ? "Edit Appointment" : "New Appointment"}
            width={520}
        >
            <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                {/* Customer Name */}
                <div>
                    <label style={labelStyle}>Client Name *</label>
                    <input
                        type="text"
                        value={form.customer_name}
                        onChange={(e) => setForm({ ...form, customer_name: e.target.value })}
                        placeholder="e.g., John Doe"
                        disabled={isLimitedEdit}
                        style={{
                            ...inputStyle,
                            borderColor: errors.customer_name ? "#DC2626" : "#E8E3E0",
                            backgroundColor: isLimitedEdit ? "#F3F4F6" : "#FFFFFF",
                            cursor: isLimitedEdit ? "not-allowed" : "text",
                        }}
                        autoFocus={!isLimitedEdit}
                    />
                    {errors.customer_name && <span style={errorStyle}>{errors.customer_name}</span>}
                </div>

                {/* Phone */}
                <div>
                    <label style={labelStyle}>Phone *</label>
                    <input
                        type="tel"
                        value={form.phone}
                        onChange={(e) => setForm({ ...form, phone: e.target.value })}
                        placeholder="+92 300 1234567"
                        disabled={isLimitedEdit}
                        style={{
                            ...inputStyle,
                            borderColor: errors.phone ? "#DC2626" : "#E8E3E0",
                            backgroundColor: isLimitedEdit ? "#F3F4F6" : "#FFFFFF",
                            cursor: isLimitedEdit ? "not-allowed" : "text",
                        }}
                    />
                    {errors.phone && <span style={errorStyle}>{errors.phone}</span>}
                </div>

                {/* Service - Always editable */}
                <div>
                    <label style={labelStyle}>Service *</label>
                    <select
                        value={form.service}
                        onChange={(e) => setForm({ ...form, service: e.target.value, time: "" })}
                        style={{
                            ...inputStyle,
                            borderColor: errors.service ? "#DC2626" : "#E8E3E0",
                            cursor: "pointer",
                        }}
                    >
                        <option value="">Select a service</option>
                        {services.map((s) => (
                            <option key={s.id} value={s.name}>{s.name} - {s.price}</option>
                        ))}
                    </select>
                    {errors.service && <span style={errorStyle}>{errors.service}</span>}
                </div>

                {/* Branch - Always editable */}
                <div>
                    <label style={labelStyle}>Branch *</label>
                    <select
                        value={form.branch}
                        onChange={(e) => setForm({ ...form, branch: e.target.value, time: "" })}
                        style={{
                            ...inputStyle,
                            borderColor: errors.branch ? "#DC2626" : "#E8E3E0",
                            cursor: "pointer",
                        }}
                    >
                        <option value="">Select a branch</option>
                        {branches.map((b) => (
                            <option key={b.id} value={b.name}>{b.name}</option>
                        ))}
                    </select>
                    {errors.branch && <span style={errorStyle}>{errors.branch}</span>}
                </div>

                {/* Date and Time - Side by side */}
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                    {/* Date */}
                    <div>
                        <label style={labelStyle}>Date *</label>
                        <input
                            type="date"
                            value={form.date}
                            min={today}
                            onChange={(e) => setForm({ ...form, date: e.target.value, time: "" })}
                            disabled={isLimitedEdit}
                            style={{
                                ...inputStyle,
                                borderColor: errors.date ? "#DC2626" : "#E8E3E0",
                                backgroundColor: isLimitedEdit ? "#F3F4F6" : "#FFFFFF",
                                cursor: isLimitedEdit ? "not-allowed" : "pointer",
                            }}
                        />
                        {errors.date && <span style={errorStyle}>{errors.date}</span>}
                    </div>

                    {/* Time */}
                    <div>
                        <label style={labelStyle}>Time *</label>
                        {isLimitedEdit ? (
                            <input
                                type="text"
                                value={form.time}
                                disabled
                                style={{
                                    ...inputStyle,
                                    backgroundColor: "#F3F4F6",
                                    cursor: "not-allowed",
                                }}
                            />
                        ) : slotsLoading ? (
                            <div style={{ padding: "10px 14px", color: "#6B7280", fontSize: "14px" }}>
                                Loading...
                            </div>
                        ) : availableSlots.length > 0 ? (
                            <select
                                value={form.time}
                                onChange={(e) => setForm({ ...form, time: e.target.value })}
                                style={{
                                    ...inputStyle,
                                    borderColor: errors.time ? "#DC2626" : "#E8E3E0",
                                    cursor: "pointer",
                                }}
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
                        ) : form.branch && form.date && form.service ? (
                            <div style={{
                                padding: "10px 14px",
                                color: "#DC2626",
                                fontSize: "14px",
                                backgroundColor: "#FEE2E2",
                                borderRadius: "8px",
                            }}>
                                No slots available
                            </div>
                        ) : (
                            <div style={{ padding: "10px 14px", color: "#9CA3AF", fontSize: "14px" }}>
                                Select date & service
                            </div>
                        )}
                        {errors.time && <span style={errorStyle}>{errors.time}</span>}
                    </div>
                </div>

                {/* Staff (Optional) */}
                <div>
                    <label style={labelStyle}>Preferred Staff (Optional)</label>
                    <select
                        value={form.staff_name}
                        onChange={(e) => setForm({ ...form, staff_name: e.target.value })}
                        disabled={isLimitedEdit}
                        style={{
                            ...inputStyle,
                            cursor: isLimitedEdit ? "not-allowed" : "pointer",
                            backgroundColor: isLimitedEdit ? "#F3F4F6" : "#FFFFFF",
                        }}
                    >
                        <option value="">No preference</option>
                        {filteredStaff.map((s) => (
                            <option key={s.id} value={s.name}>{s.name} - {s.role}</option>
                        ))}
                    </select>
                </div>

                {/* Status - Always editable */}
                <div>
                    <label style={labelStyle}>Status</label>
                    <select
                        value={form.status}
                        onChange={(e) => setForm({ ...form, status: e.target.value as Booking["status"] })}
                        style={{ ...inputStyle, cursor: "pointer" }}
                    >
                        <option value="confirmed">Confirmed</option>
                        <option value="completed">Completed</option>
                        <option value="canceled">Canceled</option>
                        <option value="no_show">No Show</option>
                    </select>
                </div>

                {/* Notes */}
                <div>
                    <label style={labelStyle}>Notes (Optional)</label>
                    <textarea
                        value={form.notes}
                        onChange={(e) => setForm({ ...form, notes: e.target.value })}
                        placeholder="Any special requests..."
                        rows={3}
                        disabled={isLimitedEdit}
                        style={{
                            ...inputStyle,
                            fontFamily: "inherit",
                            resize: "vertical",
                            backgroundColor: isLimitedEdit ? "#F3F4F6" : "#FFFFFF",
                            cursor: isLimitedEdit ? "not-allowed" : "text",
                        }}
                    />
                </div>

                {/* Actions */}
                <div style={{
                    display: "flex",
                    gap: "12px",
                    justifyContent: "flex-end",
                    borderTop: "1px solid #E8E3E0",
                    paddingTop: "20px",
                    marginTop: "8px"
                }}>
                    <button type="button" onClick={onClose} style={secondaryBtn}>
                        Cancel
                    </button>
                    <button type="submit" disabled={isSubmitting} style={primaryBtn}>
                        {isSubmitting ? "Saving..." : editing ? "Update Appointment" : "Create Appointment"}
                    </button>
                </div>
            </form>
        </ModalShell>
    );
}

const labelStyle: React.CSSProperties = {
    display: "block",
    fontSize: "13px",
    fontWeight: 500,
    color: "#1A1A2E",
    marginBottom: "6px",
};

const inputStyle: React.CSSProperties = {
    width: "100%",
    padding: "10px 14px",
    border: "1.5px solid #E8E3E0",
    borderRadius: "8px",
    fontSize: "14px",
    outline: "none",
    backgroundColor: "#FFFFFF",
    color: "#1A1A2E",
};

const errorStyle: React.CSSProperties = {
    display: "block",
    fontSize: "12px",
    color: "#DC2626",
    marginTop: "4px",
};

const primaryBtn: React.CSSProperties = {
    padding: "10px 24px",
    backgroundColor: "#B5484B",
    color: "#FFFFFF",
    border: "none",
    borderRadius: "8px",
    fontSize: "13px",
    fontWeight: 600,
    cursor: "pointer",
};

const secondaryBtn: React.CSSProperties = {
    padding: "10px 20px",
    backgroundColor: "transparent",
    border: "1px solid #E8E3E0",
    borderRadius: "8px",
    fontSize: "13px",
    fontWeight: 500,
    color: "#6B7280",
    cursor: "pointer",
};