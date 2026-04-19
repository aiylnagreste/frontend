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
    <ModalShell open={open} onClose={onClose} title={editing ? "Edit Branch" : "New Branch"} width={480}>
      <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
        <div>
          <label style={labelStyle}>
            Branch Name <span style={{ color: "#b5484b" }}>*</span>
          </label>
          <input
            type="text"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            placeholder="e.g., Main Branch"
            style={{ ...inputStyle, ...errorInputStyle("name") }}
            onFocus={(e) => focusInput(e, "name")}
            onBlur={(e) => blurInput(e, "name")}
            autoFocus
          />
          {errors.name && <span style={errorStyle}>{errors.name}</span>}
        </div>

        <div>
          <label style={labelStyle}>Address</label>
          <textarea
            value={form.address}
            onChange={(e) => setForm({ ...form, address: e.target.value })}
            placeholder="Full street address"
            rows={3}
            style={{ ...inputStyle, fontFamily: "'DM Sans', sans-serif", resize: "vertical", lineHeight: 1.6, ...errorInputStyle("address") }}
            onFocus={(e) => focusInput(e, "address")}
            onBlur={(e) => blurInput(e, "address")}
          />
          {errors.address && <span style={errorStyle}>{errors.address}</span>}
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

        <div>
          <label style={labelStyle}>Map Link</label>
          <input
            type="text"
            value={form.map_link}
            onChange={(e) => setForm({ ...form, map_link: e.target.value })}
            placeholder="https://maps.google.com/..."
            style={{ ...inputStyle, ...errorInputStyle("map_link") }}
            onFocus={(e) => focusInput(e, "map_link")}
            onBlur={(e) => blurInput(e, "map_link")}
          />
          {errors.map_link && <span style={errorStyle}>{errors.map_link}</span>}
          <span style={{ fontSize: "11px", color: "#9CA3B4", marginTop: "4px", display: "block" }}>
            Paste a Google Maps URL for branch location
          </span>
        </div>

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
            {isSubmitting ? "Saving…" : editing ? "Update Branch" : "Create Branch"}
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