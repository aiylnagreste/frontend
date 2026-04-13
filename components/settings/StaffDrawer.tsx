"use client";

import { useState, useEffect } from "react";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { api } from "@/lib/api";
import { QK, fetchBranches, fetchRoles } from "@/lib/queries";
import { ModalShell } from "@/components/ui/ModalShell";
import type { Staff, Branch, Role } from "@/lib/types";

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
    if (!form.name.trim()) errs.name = "Full name is required";
    if (!form.role) errs.role = "Role is required";
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

  return (
    <ModalShell 
      open={open} 
      onClose={onClose} 
      title={editing ? "Edit Staff Member" : "New Staff Member"} 
      width={480}
    >
      <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "18px" }}>
        {/* Full Name */}
        <div>
          <label style={labelStyle}>Full Name *</label>
          <input
            type="text"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            placeholder="e.g., John Doe"
            style={{
              ...inputStyle,
              borderColor: errors.name ? "#DC2626" : "#E8E3E0",
            }}
            autoFocus
          />
          {errors.name && <span style={errorStyle}>{errors.name}</span>}
        </div>

        {/* Phone */}
        <div>
          <label style={labelStyle}>Phone</label>
          <input
            type="tel"
            value={form.phone}
            onChange={(e) => setForm({ ...form, phone: e.target.value })}
            placeholder="+92 300 1234567"
            style={inputStyle}
          />
        </div>

        {/* Role */}
        <div>
          <label style={labelStyle}>Role *</label>
          <select
            value={form.role}
            onChange={(e) => setForm({ ...form, role: e.target.value })}
            style={{
              ...inputStyle,
              borderColor: errors.role ? "#DC2626" : "#E8E3E0",
              cursor: "pointer",
            }}
          >
            <option value="">Select a role</option>
            {roles.map((r) => (
              <option key={r.id} value={r.name}>{r.name}</option>
            ))}
          </select>
          {errors.role && <span style={errorStyle}>{errors.role}</span>}
        </div>

        {/* Branch */}
        <div>
          <label style={labelStyle}>Branch (Optional - leave empty for all branches)</label>
          <select
            value={form.branch_id}
            onChange={(e) => setForm({ ...form, branch_id: e.target.value })}
            style={{ ...inputStyle, cursor: "pointer" }}
          >
            <option value="">All Branches</option>
            {branches.map((b) => (
              <option key={b.id} value={b.id}>{b.name}</option>
            ))}
          </select>
        </div>

        {/* Status */}
        <div>
          <label style={labelStyle}>Status</label>
          <div style={{ display: "flex", gap: "12px" }}>
            <button
              type="button"
              onClick={() => setForm({ ...form, status: "active" })}
              style={{
                padding: "10px 20px",
                borderRadius: "8px",
                border: form.status === "active" ? "2px solid #16A34A" : "1.5px solid #E8E3E0",
                backgroundColor: form.status === "active" ? "#DCFCE7" : "#FFFFFF",
                color: form.status === "active" ? "#16A34A" : "#6B7280",
                fontWeight: 500,
                fontSize: "13px",
                cursor: "pointer",
                flex: 1,
              }}
            >
              ✓ Active
            </button>
            <button
              type="button"
              onClick={() => setForm({ ...form, status: "inactive" })}
              style={{
                padding: "10px 20px",
                borderRadius: "8px",
                border: form.status === "inactive" ? "2px solid #9CA3AF" : "1.5px solid #E8E3E0",
                backgroundColor: form.status === "inactive" ? "#F3F4F6" : "#FFFFFF",
                color: form.status === "inactive" ? "#9CA3AF" : "#6B7280",
                fontWeight: 500,
                fontSize: "13px",
                cursor: "pointer",
                flex: 1,
              }}
            >
              ○ Inactive
            </button>
          </div>
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
            {isSubmitting ? "Saving..." : editing ? "Save Staff" : "Add Staff"}
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