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
import fd from "@/components/ui/FormDrawer.module.css";

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

  return (
    <ModalShell open={open} onClose={onClose} title={editing ? "Edit Staff Member" : "New Staff Member"} width={480}>
      <form onSubmit={handleSubmit} className={fd["form--gap20"]}>
        {/* Name & Phone row */}
        <div className={fd.row2}>
          <div>
            <label className={fd.label}>
              Full Name <span className={fd.required}>*</span>
            </label>
            <input
              type="text"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="John Doe"
              className={`${fd.input} ${hasError("name") ? fd["input--error"] : ""}`}
              autoFocus
            />
            {errors.name && <span className={fd.errorMsg}>{errors.name}</span>}
          </div>
          <div>
            <label className={fd.label}>Phone</label>
            <input
              type="tel"
              inputMode="tel"
              maxLength={20}
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
              placeholder="+92 300 1234567"
              className={`${fd.input} ${hasError("phone") ? fd["input--error"] : ""}`}
              onBlur={() => {
                const err = validatePhone(form.phone);
                setErrors(prev => ({ ...prev, phone: err || "" }));
              }}
            />
            {errors.phone && <span className={fd.errorMsg}>{errors.phone}</span>}
          </div>
        </div>

        {/* Role & Branch row */}
        <div className={fd.row2}>
          <div>
            <label className={fd.label}>
              Role <span className={fd.required}>*</span>
            </label>
            <select
              value={form.role}
              onChange={(e) => setForm({ ...form, role: e.target.value })}
              className={`${fd.select} ${hasError("role") ? fd["select--error"] : ""}`}
            >
              <option value="">Select role</option>
              {roles.map((r) => (
                <option key={r.id} value={r.name}>{r.name}</option>
              ))}
            </select>
            {errors.role && <span className={fd.errorMsg}>{errors.role}</span>}
          </div>
          <div>
            <label className={fd.label}>
              Branch <span className={fd.required}>*</span>
            </label>
            <select
              value={form.branch_id}
              onChange={(e) => setForm({ ...form, branch_id: e.target.value })}
              className={`${fd.select} ${hasError("branch_id") ? fd["select--error"] : ""}`}
            >
              <option value="">Select branch</option>
              {branches.map((b) => (
                <option key={b.id} value={b.id}>{b.name}</option>
              ))}
            </select>
            {errors.branch_id && <span className={fd.errorMsg}>{errors.branch_id}</span>}
          </div>
        </div>

        {/* Status */}
        <div>
          <label className={fd.label}>Status</label>
          <div className={fd.statusToggle}>
            <button
              type="button"
              onClick={() => setForm({ ...form, status: "active" })}
              className={`${fd.statusBtn} ${form.status === "active" ? fd["statusBtn--active"] : ""}`}
            >
              <span className={`${fd.statusDot} ${form.status === "active" ? fd["statusDot--active"] : ""}`} />
              Active
            </button>
            <button
              type="button"
              onClick={() => setForm({ ...form, status: "inactive" })}
              className={`${fd.statusBtn} ${form.status === "inactive" ? fd["statusBtn--inactive"] : ""}`}
            >
              <span className={`${fd.statusDot} ${form.status === "inactive" ? fd["statusDot--inactive"] : ""}`} />
              Inactive
            </button>
          </div>
        </div>

        {/* Actions */}
        <div className={fd.actions}>
          <button type="button" onClick={onClose} className={fd.secondaryBtn}>
            Cancel
          </button>
          <button type="submit" disabled={isSubmitting} className={fd.primaryBtn}>
            {isSubmitting ? "Saving…" : editing ? "Update Staff" : "Add Staff"}
          </button>
        </div>
      </form>
    </ModalShell>
  );
}
