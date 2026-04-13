// components/settings/RoleDrawer.tsx
"use client";

import { useState, useEffect } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { api } from "@/lib/api";
import { QK } from "@/lib/queries";
import { ModalShell } from "@/components/ui/ModalShell";

interface RoleDrawerProps {
  open: boolean;
  onClose: () => void;
}

export function RoleDrawer({ open, onClose }: RoleDrawerProps) {
  const qc = useQueryClient();
  const [name, setName] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Reset form when modal opens/closes
  useEffect(() => {
    if (open) {
      setName("");
      setError("");
    }
  }, [open]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    
    if (!name.trim()) {
      setError("Role name is required");
      return;
    }

    setIsSubmitting(true);
    try {
      await api.post("/salon-admin/api/settings/roles", { name: name.trim() });
      toast.success("Role created");
      qc.invalidateQueries({ queryKey: QK.roles() });
      onClose();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to create role");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <ModalShell open={open} onClose={onClose} title="New Role" width={400}>
      <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
        <div>
          <label style={labelStyle}>
            Role Name *
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => {
              setName(e.target.value);
              setError("");
            }}
            placeholder="e.g., Senior Stylist"
            style={{
              ...inputStyle,
              borderColor: error ? "#DC2626" : "#E8E3E0",
            }}
            onFocus={(e) => e.target.style.borderColor = error ? "#DC2626" : "#B5484B"}
            onBlur={(e) => e.target.style.borderColor = error ? "#DC2626" : "#E8E3E0"}
            autoFocus
          />
          {error && <span style={errorStyle}>{error}</span>}
        </div>

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
            {isSubmitting ? "Creating..." : "Create Role"}
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