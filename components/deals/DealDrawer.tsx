"use client";

import { useState, useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { api } from "@/lib/api";
import { QK } from "@/lib/queries";
import { ModalShell } from "@/components/ui/ModalShell";
import type { Deal } from "@/lib/types";

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
        });
      } else {
        setForm({
          title: "",
          description: "",
          active: true,
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

  return (
    <ModalShell 
      open={open} 
      onClose={onClose} 
      title={editing ? "Edit Deal" : "New Deal"} 
      width={480}
    >
      <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "18px" }}>
        {/* Deal Title */}
        <div>
          <label style={labelStyle}>Deal Title *</label>
          <input
            type="text"
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
            placeholder="e.g., Summer Special - 20% Off"
            style={{
              ...inputStyle,
              borderColor: errors.title ? "#DC2626" : "#E8E3E0",
            }}
            autoFocus
          />
          {errors.title && <span style={errorStyle}>{errors.title}</span>}
        </div>

        {/* Description */}
        <div>
          <label style={labelStyle}>Description (Optional)</label>
          <textarea
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            placeholder="Describe the deal details..."
            rows={4}
            style={{ ...inputStyle, fontFamily: "inherit", resize: "vertical" }}
          />
        </div>

        {/* Active Status */}
        <div>
          <label style={labelStyle}>Status</label>
          <div style={{ display: "flex", gap: "12px" }}>
            <button
              type="button"
              onClick={() => setForm({ ...form, active: true })}
              style={{
                padding: "10px 20px",
                borderRadius: "8px",
                border: form.active ? "2px solid #16A34A" : "1.5px solid #E8E3E0",
                backgroundColor: form.active ? "#DCFCE7" : "#FFFFFF",
                color: form.active ? "#16A34A" : "#6B7280",
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
              onClick={() => setForm({ ...form, active: false })}
              style={{
                padding: "10px 20px",
                borderRadius: "8px",
                border: !form.active ? "2px solid #9CA3AF" : "1.5px solid #E8E3E0",
                backgroundColor: !form.active ? "#F3F4F6" : "#FFFFFF",
                color: !form.active ? "#9CA3AF" : "#6B7280",
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
            {isSubmitting ? "Saving..." : editing ? "Update Deal" : "Create Deal"}
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