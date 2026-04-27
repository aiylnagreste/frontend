// components/settings/BranchDrawer.tsx
"use client";

import { useState, useEffect } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { api } from "@/lib/api";
import { QK } from "@/lib/queries";
import { ModalShell } from "@/components/ui/ModalShell";
import type { Branch } from "@/lib/types";
import { validateName, validatePhone, validateUrl, validateFreeText } from "@/lib/validation";
import fd from "@/components/ui/FormDrawer.module.css";

interface BranchDrawerProps {
  open: boolean;
  onClose: () => void;
  editing: Branch | null;
  onSaved?: () => void;
}

export function BranchDrawer({ open, onClose, editing, onSaved }: BranchDrawerProps) {
  const qc = useQueryClient();
  const [form, setForm] = useState({
    number: "",
    name: "",
    address: "",
    map_link: "",
    phone: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (open) {
      if (editing) {
        setForm({
          number: String(editing.number || ""),
          name: editing.name || "",
          address: editing.address || "",
          map_link: editing.map_link || "",
          phone: editing.phone || "",
        });
      } else {
        setForm({ number: "", name: "", address: "", map_link: "", phone: "" });
      }
      setErrors({});
    }
  }, [open, editing]);

  function validate(): boolean {
    const errs: Record<string, string> = {};
    const nameErr = validateName(form.name);
    if (nameErr) errs.name = nameErr === "This field is required" ? "Branch name is required" : nameErr;
    const phoneErr = validatePhone(form.phone);
    if (phoneErr) errs.phone = phoneErr;
    const urlErr = validateUrl(form.map_link);
    if (urlErr) errs.map_link = urlErr;
    const addrErr = validateFreeText(form.address);
    if (addrErr) errs.address = addrErr;
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
        number: parseInt(form.number) || 0,
      };

      if (editing) {
        await api.put(`/salon-admin/api/settings/branches/${editing.id}`, payload);
        toast.success("Branch updated");
      } else {
        await api.post("/salon-admin/api/settings/branches", payload);
        toast.success("Branch created");
      }

      qc.invalidateQueries({ queryKey: QK.branches() });
      onClose();
      onSaved?.();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to save branch");
    } finally {
      setIsSubmitting(false);
    }
  }

  const hasError = (field: string) => !!errors[field];

  return (
    <ModalShell open={open} onClose={onClose} title={editing ? "Edit Branch" : "New Branch"} width={480}>
      <form onSubmit={handleSubmit} className={fd["form--gap20"]}>
        <div>
          <label className={fd.label}>
            Branch Name <span className={fd.required}>*</span>
          </label>
          <input
            type="text"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            placeholder="e.g., Main Branch"
            className={`${fd.input} ${hasError("name") ? fd["input--error"] : ""}`}
            autoFocus
          />
          {errors.name && <span className={fd.errorMsg}>{errors.name}</span>}
        </div>

        <div>
          <label className={fd.label}>Address</label>
          <textarea
            value={form.address}
            onChange={(e) => setForm({ ...form, address: e.target.value })}
            placeholder="Full street address"
            rows={3}
            className={`${fd.textarea} ${hasError("address") ? fd["textarea--error"] : ""}`}
          />
          {errors.address && <span className={fd.errorMsg}>{errors.address}</span>}
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

        <div>
          <label className={fd.label}>Map Link</label>
          <input
            type="text"
            value={form.map_link}
            onChange={(e) => setForm({ ...form, map_link: e.target.value })}
            placeholder="https://maps.google.com/..."
            className={`${fd.input} ${hasError("map_link") ? fd["input--error"] : ""}`}
          />
          {errors.map_link && <span className={fd.errorMsg}>{errors.map_link}</span>}
          <span className={fd.helpText}>
            Paste a Google Maps URL for branch location
          </span>
        </div>

        <div className={fd.actions}>
          <button type="button" onClick={onClose} className={fd.secondaryBtn}>
            Cancel
          </button>
          <button type="submit" disabled={isSubmitting} className={fd.primaryBtn}>
            {isSubmitting ? "Saving…" : editing ? "Update Branch" : "Create Branch"}
          </button>
        </div>
      </form>
    </ModalShell>
  );
}
