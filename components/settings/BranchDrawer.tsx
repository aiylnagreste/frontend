// components/settings/BranchDrawer.tsx
"use client";

import { useState, useEffect } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { api } from "@/lib/api";
import { QK } from "@/lib/queries";
import { ModalShell } from "@/components/ui/ModalShell";
import type { Branch } from "@/lib/types";

interface BranchDrawerProps {
  open: boolean;
  onClose: () => void;
  editing: Branch | null;
}

export function BranchDrawer({ open, onClose, editing }: BranchDrawerProps) {
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

  // Reset form when modal opens/closes
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
    if (!form.name.trim()) errs.name = "Branch name is required";
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
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to save branch");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <ModalShell 
      open={open} 
      onClose={onClose} 
      title={editing ? "Edit Branch" : "New Branch"} 
      width={480}
    >
      <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "18px" }}>
        {/* Branch Number */}
        {/* <div>
          <label style={labelStyle}>
            Branch Number
          </label>
          <input
            type="number"
            value={form.number}
            onChange={(e) => setForm({ ...form, number: e.target.value })}
            placeholder="e.g., 1"
            style={inputStyle}
            onFocus={(e) => e.target.style.borderColor = "#B5484B"}
            onBlur={(e) => e.target.style.borderColor = "#E8E3E0"}
          />
        </div> */}

        {/* Branch Name */}
        <div>
          <label style={labelStyle}>
            Branch Name *
          </label>
          <input
            type="text"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            placeholder="e.g., Main Branch"
            style={{
              ...inputStyle,
              borderColor: errors.name ? "#DC2626" : "#E8E3E0",
            }}
            onFocus={(e) => e.target.style.borderColor = errors.name ? "#DC2626" : "#B5484B"}
            onBlur={(e) => e.target.style.borderColor = errors.name ? "#DC2626" : "#E8E3E0"}
            autoFocus
          />
          {errors.name && <span style={errorStyle}>{errors.name}</span>}
        </div>

        {/* Address */}
        <div>
          <label style={labelStyle}>
            Address
          </label>
          <textarea
            value={form.address}
            onChange={(e) => setForm({ ...form, address: e.target.value })}
            placeholder="Full address"
            rows={3}
            style={{ ...inputStyle, fontFamily: "inherit", resize: "vertical" }}
            onFocus={(e) => e.target.style.borderColor = "#B5484B"}
            onBlur={(e) => e.target.style.borderColor = "#E8E3E0"}
          />
        </div>

        {/* Map Link */}
        <div>
          <label style={labelStyle}>
            Map Link (Google Maps URL)
          </label>
          <input
            type="url"
            value={form.map_link}
            onChange={(e) => setForm({ ...form, map_link: e.target.value })}
            placeholder="https://maps.google.com/..."
            style={inputStyle}
            onFocus={(e) => e.target.style.borderColor = "#B5484B"}
            onBlur={(e) => e.target.style.borderColor = "#E8E3E0"}
          />
        </div>

        {/* Phone */}
        <div>
          <label style={labelStyle}>
            Phone
          </label>
          <input
            type="tel"
            value={form.phone}
            onChange={(e) => setForm({ ...form, phone: e.target.value })}
            placeholder="+92 300 1234567"
            style={inputStyle}
            onFocus={(e) => e.target.style.borderColor = "#B5484B"}
            onBlur={(e) => e.target.style.borderColor = "#E8E3E0"}
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
            {isSubmitting ? "Saving..." : editing ? "Update Branch" : "Create Branch"}
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