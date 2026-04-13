"use client";

import { useState, useEffect } from "react";
import { useQueryClient, useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { api } from "@/lib/api";
import { QK, fetchBranches } from "@/lib/queries";
import { ModalShell } from "@/components/ui/ModalShell";
import type { Service, Branch } from "@/lib/types";

interface ServiceDrawerProps {
  open: boolean;
  onClose: () => void;
  editing: Service | null;
}

export function ServiceDrawer({ open, onClose, editing }: ServiceDrawerProps) {
  const qc = useQueryClient();
  const [form, setForm] = useState({
    name: "",
    price: "",
    description: "",
    branch: "",
    durationMinutes: 60,
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { data: branches = [] } = useQuery<Branch[]>({
    queryKey: QK.branches(),
    queryFn: fetchBranches,
    enabled: open,
  });

  useEffect(() => {
    if (open) {
      if (editing) {
        setForm({
          name: editing.name || "",
          price: editing.price || "",
          description: editing.description || "",
          branch: editing.branch || "",
          durationMinutes: editing.durationMinutes || 60,
        });
      } else {
        setForm({
          name: "",
          price: "",
          description: "",
          branch: "",
          durationMinutes: 60,
        });
      }
      setErrors({});
    }
  }, [open, editing]);

  function validate(): boolean {
    const errs: Record<string, string> = {};
    if (!form.name.trim()) errs.name = "Service name is required";
    if (!form.price) errs.price = "Price is required";
    if (!form.branch) errs.branch = "Branch is required";
    if (!form.durationMinutes || form.durationMinutes < 5) errs.durationMinutes = "Duration must be at least 5 minutes";
    setErrors(errs);
    return Object.keys(errs).length === 0;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!validate()) return;

    setIsSubmitting(true);
    try {
      if (editing) {
        await api.put(`/salon-admin/api/services/${editing.id}`, form);
      } else {
        await api.post("/salon-admin/api/services", form);
      }

      toast.success(editing ? "Service updated" : "Service created");
      qc.invalidateQueries({ queryKey: QK.services() });
      onClose();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to save service");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <ModalShell 
      open={open} 
      onClose={onClose} 
      title={editing ? "Edit Service" : "New Service"} 
      width={480}
    >
      <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "18px" }}>
        {/* Service Name */}
        <div>
          <label style={labelStyle}>Service Name *</label>
          <input
            type="text"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            placeholder="e.g., Haircut & Styling"
            style={{
              ...inputStyle,
              borderColor: errors.name ? "#DC2626" : "#E8E3E0",
            }}
            autoFocus
          />
          {errors.name && <span style={errorStyle}>{errors.name}</span>}
        </div>

        {/* Price */}
        <div>
          <label style={labelStyle}>Price *</label>
          <input
            type="text"
            value={form.price}
            onChange={(e) => setForm({ ...form, price: e.target.value })}
            placeholder="e.g., Rs. 1500"
            style={{
              ...inputStyle,
              borderColor: errors.price ? "#DC2626" : "#E8E3E0",
            }}
          />
          {errors.price && <span style={errorStyle}>{errors.price}</span>}
        </div>

        {/* Duration */}
        <div>
          <label style={labelStyle}>Duration (minutes) *</label>
          <input
            type="number"
            value={form.durationMinutes}
            onChange={(e) => setForm({ ...form, durationMinutes: parseInt(e.target.value) || 0 })}
            placeholder="60"
            min="5"
            step="5"
            style={{
              ...inputStyle,
              borderColor: errors.durationMinutes ? "#DC2626" : "#E8E3E0",
            }}
          />
          {errors.durationMinutes && <span style={errorStyle}>{errors.durationMinutes}</span>}
        </div>

        {/* Branch */}
        <div>
          <label style={labelStyle}>Branch *</label>
          <select
            value={form.branch}
            onChange={(e) => setForm({ ...form, branch: e.target.value })}
            style={{
              ...inputStyle,
              borderColor: errors.branch ? "#DC2626" : "#E8E3E0",
              cursor: "pointer",
            }}
          >
            <option value="">Select a branch</option>
            <option value="All Branches">All Branches</option>
            {branches.map((b) => (
              <option key={b.id} value={b.name}>{b.name}</option>
            ))}
          </select>
          {errors.branch && <span style={errorStyle}>{errors.branch}</span>}
        </div>

        {/* Description */}
        <div>
          <label style={labelStyle}>Description (Optional)</label>
          <textarea
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            placeholder="Describe what's included..."
            rows={3}
            style={{ ...inputStyle, fontFamily: "inherit", resize: "vertical" }}
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
            {isSubmitting ? "Saving..." : editing ? "Update Service" : "Create Service"}
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