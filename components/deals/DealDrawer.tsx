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

  const focusInput = (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>, field: string) => {
    if (!hasError(field)) {
      e.target.style.borderColor = "#b5484b";
      e.target.style.boxShadow = "0 0 0 3px rgba(181,72,75,0.1)";
    }
  };

  const blurInput = (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>, field: string) => {
    if (!hasError(field)) {
      e.target.style.borderColor = "#E6E4DF";
      e.target.style.boxShadow = "none";
    }
  };

  const errorInputStyle = (field: string): React.CSSProperties => ({
    borderColor: hasError(field) ? "#DC2626" : undefined,
    boxShadow: hasError(field) ? "0 0 0 3px rgba(220,38,38,0.1)" : undefined,
  });

  return (
    <ModalShell open={open} onClose={onClose} title={editing ? "Edit Deal" : "New Deal"} width={480}>
      <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "22px" }}>
        {/* Deal Title */}
        <div>
          <label style={labelStyle}>
            Deal Title <span style={{ color: "#b5484b" }}>*</span>
          </label>
          <div style={{ position: "relative" }}>
            <div style={iconBox}>
              <Tag size={15} color="#9CA3B4" strokeWidth={1.8} />
            </div>
            <input
              type="text"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              placeholder="e.g., Summer Special - 20% Off"
              style={{ ...inputStyle, paddingLeft: "40px", ...errorInputStyle("title") }}
              onFocus={(e) => focusInput(e, "title")}
              onBlur={(e) => blurInput(e, "title")}
              autoFocus
            />
          </div>
          {errors.title && <span style={errorStyle}>{errors.title}</span>}
        </div>

        {/* Description */}
        <div>
          <label style={labelStyle}>Description</label>
          <div style={{ position: "relative" }}>
            <div style={{ ...iconBox, top: "14px" }}>
              <FileText size={15} color="#9CA3B4" strokeWidth={1.8} />
            </div>
            <textarea
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              placeholder="Describe the deal details, terms & conditions..."
              rows={4}
              style={{ ...inputStyle, paddingLeft: "40px", fontFamily: "'DM Sans', sans-serif", resize: "vertical", lineHeight: 1.6 }}
              onFocus={(e) => focusInput(e, "description")}
              onBlur={(e) => blurInput(e, "description")}
            />
          </div>
          <span style={{ fontSize: "11px", color: "#9CA3B4", marginTop: "4px", display: "block" }}>
            This will be shown to customers on the booking page
          </span>
        </div>

        {/* Discount % */}
        <div>
          <label style={labelStyle}>
            Discount %
          </label>
          <div style={{ position: "relative" }}>
            <div style={iconBox}>
              <Percent size={15} color="#9CA3B4" strokeWidth={1.8} />
            </div>
            <input
              type="number"
              min={0}
              max={100}
              value={form.off}
              onChange={(e) => setForm({ ...form, off: Math.min(100, Math.max(0, Number(e.target.value) || 0)) })}
              placeholder="0"
              style={{ ...inputStyle, paddingLeft: "40px" }}
              onFocus={(e) => { e.target.style.borderColor = "#b5484b"; e.target.style.boxShadow = "0 0 0 3px rgba(181,72,75,0.1)"; }}
              onBlur={(e) => { e.target.style.borderColor = "#E6E4DF"; e.target.style.boxShadow = "none"; }}
            />
          </div>
          <span style={{ fontSize: "11px", color: "#9CA3B4", marginTop: "4px", display: "block" }}>
            Enter 0 for no discount
          </span>
        </div>

        {/* Active Status */}
        <div>
          <label style={labelStyle}>Status</label>
          <div style={{ display: "flex", gap: "10px" }}>
            <button
              type="button"
              onClick={() => setForm({ ...form, active: true })}
              style={{
                flex: 1,
                padding: "9px 16px",
                borderRadius: "8px",
                border: form.active ? "1.5px solid #22c55e" : "1.5px solid #E6E4DF",
                backgroundColor: form.active ? "#F0FDF4" : "#fff",
                color: form.active ? "#15803d" : "#5F6577",
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
                background: form.active ? "#22c55e" : "#D1D5DB",
              }} />
              Active
            </button>
            <button
              type="button"
              onClick={() => setForm({ ...form, active: false })}
              style={{
                flex: 1,
                padding: "9px 16px",
                borderRadius: "8px",
                border: !form.active ? "1.5px solid #9CA3B4" : "1.5px solid #E6E4DF",
                backgroundColor: !form.active ? "#F8F8F6" : "#fff",
                color: !form.active ? "#475569" : "#5F6577",
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
                background: !form.active ? "#9CA3B4" : "#D1D5DB",
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
            {isSubmitting ? "Saving…" : editing ? "Update Deal" : "Create Deal"}
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