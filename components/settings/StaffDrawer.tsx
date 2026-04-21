// components/settings/StaffDrawer.tsx
"use client";

import { useState, useEffect } from "react";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { api } from "@/lib/api";
import { QK, fetchBranches, fetchRoles } from "@/lib/queries";
import { ModalShell } from "@/components/ui/ModalShell";
import type { Staff, Branch, Role } from "@/lib/types";
import { validateName, validatePhone } from "@/lib/validation";

interface StaffDrawerProps {
  open: boolean;
  onClose: () => void;
  editing: Staff | null;
}

export function StaffDrawer({ open, onClose, editing }: StaffDrawerProps) {
  const qc = useQueryClient();
  const [form, setForm] = useState({
    name: "",
    phone: "",
    role: "",
    branch_id: "",
    status: "active" as "active" | "inactive",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { data: branches = [] } = useQuery<Branch[]>({
    queryKey: QK.branches(),
    queryFn: fetchBranches,
    enabled: open,
  });

  const { data: roles = [] } = useQuery<Role[]>({
    queryKey: QK.roles(),
    queryFn: fetchRoles,
    enabled: open,
  });

  useEffect(() => {
    if (open) {
      if (editing) {
        setForm({
          name: editing.name || "",
          phone: editing.phone || "",
          role: editing.role || "",
          branch_id: editing.branch_id ? String(editing.branch_id) : "",
          status: editing.status || "active",
        });
      } else {
        setForm({
          name: "",
          phone: "",
          role: roles[0]?.name || "",
          branch_id: "",
          status: "active",
        });
      }
      setErrors({});
    }
  }, [open, editing, roles]);

  function validate(): boolean {
    const errs: Record<string, string> = {};
    const nameErr = validateName(form.name);
    if (nameErr) errs.name = nameErr === "This field is required" ? "Full name is required" : nameErr;
    if (!form.role) errs.role = "Role is required";
    if (!form.branch_id) errs.branch_id = "Branch is required";
    const phoneErr = validatePhone(form.phone);
    if (phoneErr) errs.phone = phoneErr;
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
        branch_id: form.branch_id ? parseInt(form.branch_id) : null,
      };

      if (editing) {
        await api.put(`/salon-admin/api/settings/staff/${editing.id}`, payload);
        toast.success("Staff member updated");
      } else {
        await api.post("/salon-admin/api/settings/staff", payload);
        toast.success("Staff member added");
      }

      qc.invalidateQueries({ queryKey: QK.staff() });
      onClose();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to save staff member");
    } finally {
      setIsSubmitting(false);
    }
  }

  const hasError = (field: string) => !!errors[field];

  const focusInput = (e: React.FocusEvent<HTMLInputElement | HTMLSelectElement>, field: string) => {
    if (!hasError(field)) {
      e.target.style.borderColor = "#b5484b";
      e.target.style.boxShadow = "0 0 0 3px rgba(181,72,75,0.1)";
    }
  };

  const blurInput = (e: React.FocusEvent<HTMLInputElement | HTMLSelectElement>, field: string) => {
    if (!hasError(field)) {
      e.target.style.borderColor = "#E6E4DF";
      e.target.style.boxShadow = "none";
    }
  };

  const errorInputStyle = (field: string): React.CSSProperties => ({
    borderColor: hasError(field) ? "#DC2626" : undefined,
    boxShadow: hasError(field) ? "0 0 0 3px rgba(220,38,38,0.1)" : undefined,
  });

  const selectStyle = (field: string): React.CSSProperties => ({
    ...inputStyle,
    ...errorInputStyle(field),
    cursor: "pointer",
    appearance: "none",
    backgroundImage: `url("data:image/svg+xml,%3Csvg width='10' height='6' viewBox='0 0 10 6' fill='none' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M1 1L5 5L9 1' stroke='%235F6577' stroke-width='1.5' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E")`,
    backgroundRepeat: "no-repeat",
    backgroundPosition: "right 14px center",
    paddingRight: "36px",
  });

  return (
    <ModalShell open={open} onClose={onClose} title={editing ? "Edit Staff Member" : "New Staff Member"} width={480}>
      <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
        {/* Name & Phone row */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
          <div>
            <label style={labelStyle}>
              Full Name <span style={{ color: "#b5484b" }}>*</span>
            </label>
            <input
              type="text"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="John Doe"
              style={{ ...inputStyle, ...errorInputStyle("name") }}
              onFocus={(e) => focusInput(e, "name")}
              onBlur={(e) => blurInput(e, "name")}
              autoFocus
            />
            {errors.name && <span style={errorStyle}>{errors.name}</span>}
          </div>
          <div>
            <label style={labelStyle}>Phone</label>
            <input
              type="tel"
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
              placeholder="+92 300 1234567"
              style={{ ...inputStyle, ...errorInputStyle("phone") }}
              onFocus={(e) => focusInput(e, "phone")}
              onBlur={(e) => blurInput(e, "phone")}
            />
            {errors.phone && <span style={errorStyle}>{errors.phone}</span>}
          </div>
        </div>

        {/* Role & Branch row */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
          <div>
            <label style={labelStyle}>
              Role <span style={{ color: "#b5484b" }}>*</span>
            </label>
            <select
              value={form.role}
              onChange={(e) => setForm({ ...form, role: e.target.value })}
              style={selectStyle("role")}
              onFocus={(e) => focusInput(e, "role")}
              onBlur={(e) => blurInput(e, "role")}
            >
              <option value="">Select role</option>
              {roles.map((r) => (
                <option key={r.id} value={r.name}>{r.name}</option>
              ))}
            </select>
            {errors.role && <span style={errorStyle}>{errors.role}</span>}
          </div>
          <div>
            <label style={labelStyle}>
              Branch <span style={{ color: "#b5484b" }}>*</span>
            </label>
            <select
              value={form.branch_id}
              onChange={(e) => setForm({ ...form, branch_id: e.target.value })}
              style={selectStyle("branch_id")}
              onFocus={(e) => { e.target.style.borderColor = "#b5484b"; e.target.style.boxShadow = "0 0 0 3px rgba(181,72,75,0.1)"; }}
              onBlur={(e) => { e.target.style.borderColor = "#E6E4DF"; e.target.style.boxShadow = "none"; }}
            >
              <option value="">Select branch</option>
              {branches.map((b) => (
                <option key={b.id} value={b.id}>{b.name}</option>
              ))}
            </select>
            {errors.branch_id && <span style={errorStyle}>{errors.branch_id}</span>}
          </div>
        </div>

        {/* Status */}
        <div>
          <label style={labelStyle}>Status</label>
          <div style={{ display: "flex", gap: "10px" }}>
            <button
              type="button"
              onClick={() => setForm({ ...form, status: "active" })}
              style={{
                flex: 1,
                padding: "9px 16px",
                borderRadius: "8px",
                border: form.status === "active" ? "1.5px solid #22c55e" : "1.5px solid #E6E4DF",
                backgroundColor: form.status === "active" ? "#F0FDF4" : "#fff",
                color: form.status === "active" ? "#15803d" : "#5F6577",
                fontWeight: 600,
                fontSize: "12px",
                cursor: "pointer",
                fontFamily: "'DM Sans', sans-serif",
                transition: "all 0.15s",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "6px",
              }}
            >
              <span style={{
                width: 6,
                height: 6,
                borderRadius: "50%",
                background: form.status === "active" ? "#22c55e" : "#D1D5DB",
              }} />
              Active
            </button>
            <button
              type="button"
              onClick={() => setForm({ ...form, status: "inactive" })}
              style={{
                flex: 1,
                padding: "9px 16px",
                borderRadius: "8px",
                border: form.status === "inactive" ? "1.5px solid #9CA3B4" : "1.5px solid #E6E4DF",
                backgroundColor: form.status === "inactive" ? "#F8F8F6" : "#fff",
                color: form.status === "inactive" ? "#475569" : "#5F6577",
                fontWeight: 600,
                fontSize: "12px",
                cursor: "pointer",
                fontFamily: "'DM Sans', sans-serif",
                transition: "all 0.15s",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "6px",
              }}
            >
              <span style={{
                width: 6,
                height: 6,
                borderRadius: "50%",
                background: form.status === "inactive" ? "#9CA3B4" : "#D1D5DB",
              }} />
              Inactive
            </button>
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
            {isSubmitting ? "Saving…" : editing ? "Update Staff" : "Add Staff"}
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