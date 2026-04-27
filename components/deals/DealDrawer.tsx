// components/deals/DealDrawer.tsx
"use client";

import { useState, useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { api } from "@/lib/api";
import { QK } from "@/lib/queries";
import { ModalShell } from "@/components/ui/ModalShell";
import type { Deal } from "@/lib/types";
import { Tag, FileText, Percent } from "lucide-react";
import fd from "@/components/ui/FormDrawer.module.css";

interface DealDrawerProps {
  open: boolean;
  onClose: () => void;
  editing: Deal | null;
}

export function DealDrawer({ open, onClose, editing }: DealDrawerProps) {
  const qc = useQueryClient();
  const [form, setForm] = useState({
    title: "",
    description: "",
    active: true,
    off: 0,
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (open) {
      if (editing) {
        setForm({
          title: editing.title || "",
          description: editing.description || "",
          active: editing.active === 1,
          off: editing.off ?? 0,
        });
      } else {
        setForm({
          title: "",
          description: "",
          active: true,
          off: 0,
        });
      }
      setErrors({});
    }
  }, [open, editing]);

  function validate(): boolean {
    const errs: Record<string, string> = {};
    if (!form.title.trim()) errs.title = "Deal title is required";
    setErrors(errs);
    return Object.keys(errs).length === 0;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!validate()) return;

    setIsSubmitting(true);
    try {
      const payload = { ...form, active: form.active ? 1 : 0 };

      if (editing) {
        await api.put(`/salon-admin/api/deals/${editing.id}`, payload);
      } else {
        await api.post("/salon-admin/api/deals", payload);
      }

      toast.success(editing ? "Deal updated" : "Deal created");
      qc.invalidateQueries({ queryKey: QK.deals() });
      onClose();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to save deal");
    } finally {
      setIsSubmitting(false);
    }
  }

  const hasError = (field: string) => !!errors[field];

  return (
    <ModalShell open={open} onClose={onClose} title={editing ? "Edit Deal" : "New Deal"} width={480}>
      <form onSubmit={handleSubmit} className={fd.form}>
        {/* Deal Title */}
        <div>
          <label className={fd.label}>
            Deal Title <span className={fd.required}>*</span>
          </label>
          <div className={fd.inputWithIcon}>
            <div className={fd.inputIcon}>
              <Tag size={15} color="#9CA3B4" strokeWidth={1.8} />
            </div>
            <input
              type="text"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              placeholder="e.g., Summer Special - 20% Off"
              className={`${fd.input} ${fd["input--padded"]} ${hasError("title") ? fd["input--error"] : ""}`}
              autoFocus
            />
          </div>
          {errors.title && <span className={fd.errorMsg}>{errors.title}</span>}
        </div>

        {/* Description */}
        <div>
          <label className={fd.label}>Description</label>
          <div className={fd.inputWithIcon}>
            <div className={`${fd.inputIcon} ${fd["inputIcon--top"]}`}>
              <FileText size={15} color="#9CA3B4" strokeWidth={1.8} />
            </div>
            <textarea
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              placeholder="Describe the deal details, terms & conditions..."
              rows={4}
              className={`${fd.textarea} ${fd["input--padded"]}`}
            />
          </div>
          <span className={fd.helpText}>
            This will be shown to customers on the booking page
          </span>
        </div>

        {/* Discount % */}
        <div>
          <label className={fd.label}>
            Discount %
          </label>
          <div className={fd.inputWithIcon}>
            <div className={fd.inputIcon}>
              <Percent size={15} color="#9CA3B4" strokeWidth={1.8} />
            </div>
            <input
              type="number"
              min={0}
              max={100}
              value={form.off}
              onChange={(e) => setForm({ ...form, off: Math.min(100, Math.max(0, Number(e.target.value) || 0)) })}
              placeholder="0"
              className={`${fd.input} ${fd["input--padded"]}`}
            />
          </div>
          <span className={fd.helpText}>
            Enter 0 for no discount
          </span>
        </div>

        {/* Active Status */}
        <div>
          <label className={fd.label}>Status</label>
          <div className={fd.statusToggle}>
            <button
              type="button"
              onClick={() => setForm({ ...form, active: true })}
              className={`${fd.statusBtn} ${form.active ? fd["statusBtn--active"] : ""}`}
            >
              <span className={`${fd.statusDot} ${form.active ? fd["statusDot--active"] : ""}`} />
              Active
            </button>
            <button
              type="button"
              onClick={() => setForm({ ...form, active: false })}
              className={`${fd.statusBtn} ${!form.active ? fd["statusBtn--inactive"] : ""}`}
            >
              <span className={`${fd.statusDot} ${!form.active ? fd["statusDot--inactive"] : ""}`} />
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
            {isSubmitting ? "Saving…" : editing ? "Update Deal" : "Create Deal"}
          </button>
        </div>
      </form>
    </ModalShell>
  );
}
