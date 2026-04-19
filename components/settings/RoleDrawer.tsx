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
            Role Name <span style={{ color: "#b5484b" }}>*</span>
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
              borderColor: error ? "#DC2626" : undefined,
              boxShadow: error ? "0 0 0 3px rgba(220,38,38,0.1)" : undefined,
            }}
            onFocus={(e) => {
              if (!error) {
                e.target.style.borderColor = "#b5484b";
                e.target.style.boxShadow = "0 0 0 3px rgba(181,72,75,0.1)";
              }
            }}
            onBlur={(e) => {
              if (!error) {
                e.target.style.borderColor = "#E6E4DF";
                e.target.style.boxShadow = "none";
              }
            }}
            autoFocus
          />
          {error && <span style={errorStyle}>{error}</span>}
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
            {isSubmitting ? "Creating…" : "Create Role"}
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