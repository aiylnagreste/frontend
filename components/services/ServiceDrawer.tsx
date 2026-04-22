"use client";

import { useState, useEffect } from "react";
import { useQueryClient, useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { api } from "@/lib/api";
import { QK, fetchBranches, fetchPlanFeatures } from "@/lib/queries";
import { ModalShell } from "@/components/ui/ModalShell";
import type { Service, Branch } from "@/lib/types";
import { AlertCircle } from "lucide-react";

interface ServiceDrawerProps {
  open: boolean;
  onClose: () => void;
  editing: Service | null;
  currentServiceCount?: number;
  maxServices?: number;
}

const DURATION_PRESETS = [15, 30, 45, 60, 75, 90, 120];

export function ServiceDrawer({ 
  open, 
  onClose, 
  editing, 
  currentServiceCount = 0, 
  maxServices = 15 
}: ServiceDrawerProps) {
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

  const isAddingNew = !editing;
  const hasReachedLimit = isAddingNew && currentServiceCount >= maxServices && maxServices > 0;

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
    if (!form.durationMinutes || form.durationMinutes < 5)
      errs.durationMinutes = "Duration must be at least 5 minutes";
    setErrors(errs);
    return Object.keys(errs).length === 0;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    
    // Check limit for new services
    if (isAddingNew && hasReachedLimit) {
      toast.error(`Maximum ${maxServices} services reached. Please upgrade your plan to add more.`);
      return;
    }
    
    if (!validate()) return;
    setIsSubmitting(true);
    try {
      if (editing) {
        await api.put(`/salon-admin/api/services/${editing.id}`, form);
        toast.success("Service updated");
      } else {
        await api.post("/salon-admin/api/services", form);
        toast.success("Service created");
      }
      qc.invalidateQueries({ queryKey: QK.services() });
      qc.invalidateQueries({ queryKey: ["stats"] });
      onClose();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to save service");
    } finally {
      setIsSubmitting(false);
    }
  }

  function parseDuration(mins: number) {
    const h = Math.floor(mins / 60);
    const m = mins % 60;
    if (h === 0) return `${m}m`;
    return m === 0 ? `${h}h` : `${h}h ${m}m`;
  }

  const hasError = (field: string) => !!errors[field];

  // Show limit reached UI if trying to add new service when at limit
  if (hasReachedLimit) {
    return (
      <ModalShell open={open} onClose={onClose} title="Service Limit Reached" width={480}>
        <div style={{ textAlign: "center", padding: "20px" }}>
          <div
            style={{
              width: "64px",
              height: "64px",
              borderRadius: "50%",
              background: "#FEF2F2",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              margin: "0 auto 20px",
            }}
          >
            <AlertCircle size={32} style={{ color: "#DC2626" }} />
          </div>
          <h4
            style={{
              fontFamily: "'Space Grotesk', sans-serif",
              fontSize: "18px",
              fontWeight: 700,
              color: "#1A1D23",
              marginBottom: "8px",
            }}
          >
            Maximum Services Reached
          </h4>
          <p style={{ fontSize: "13px", color: "#5F6577", marginBottom: "16px" }}>
            Your current plan allows up to <strong>{maxServices}</strong> active services.
            You're currently using <strong>{currentServiceCount}</strong> of {maxServices}.
          </p>
          <p style={{ fontSize: "13px", color: "#5F6577", marginBottom: "24px" }}>
            Upgrade your plan to add more services or freeze some existing ones.
          </p>
          <div style={{ display: "flex", gap: "10px", justifyContent: "center" }}>
            <button
              onClick={onClose}
              style={{
                padding: "10px 20px",
                background: "transparent",
                border: "1.5px solid #E6E4DF",
                borderRadius: "8px",
                fontSize: "13px",
                fontWeight: 500,
                color: "#5F6577",
                cursor: "pointer",
              }}
            >
              Close
            </button>
            <button
              onClick={() => window.location.href = "/settings/plan"}
              style={{
                padding: "10px 24px",
                background: "linear-gradient(135deg, #b5484b, #6b3057)",
                color: "#fff",
                border: "none",
                borderRadius: "8px",
                fontSize: "13px",
                fontWeight: 600,
                cursor: "pointer",
              }}
            >
              Upgrade Plan
            </button>
          </div>
        </div>
      </ModalShell>
    );
  }

  return (
    <ModalShell open={open} onClose={onClose} title={editing ? "Edit Service" : "New Service"} width={480}>
      <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
        {/* Service limit warning (only for new services when near limit) */}
        {isAddingNew && currentServiceCount >= maxServices - 1 && maxServices > 0 && (
          <div
            style={{
              background: "#FFFBEB",
              border: "1px solid #FDE047",
              borderRadius: "8px",
              padding: "10px 14px",
              display: "flex",
              alignItems: "center",
              gap: "8px",
              fontSize: "12px",
              color: "#92400E",
            }}
          >
            <AlertCircle size={14} style={{ color: "#D97706" }} />
            <span>
              You have {currentServiceCount} of {maxServices} services. 
              {currentServiceCount === maxServices - 1 && " You can add 1 more service."}
            </span>
          </div>
        )}

        {/* Service Name */}
        <div>
          <label style={labelStyle}>
            Service Name <span style={{ color: "#b5484b" }}>*</span>
          </label>
          <input
            type="text"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            placeholder="e.g., Haircut & Styling"
            style={{
              ...inputStyle,
              borderColor: hasError("name") ? "#DC2626" : undefined,
              boxShadow: hasError("name") ? "0 0 0 3px rgba(220,38,38,0.1)" : undefined,
            }}
            onFocus={(e) => {
              if (!hasError("name")) {
                e.target.style.borderColor = "#b5484b";
                e.target.style.boxShadow = "0 0 0 3px rgba(181,72,75,0.1)";
              }
            }}
            onBlur={(e) => {
              if (!hasError("name")) {
                e.target.style.borderColor = "#E6E4DF";
                e.target.style.boxShadow = "none";
              }
            }}
            autoFocus
          />
          {errors.name && <span style={errorStyle}>{errors.name}</span>}
        </div>

        {/* Price & Duration row */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
          <div>
            <label style={labelStyle}>
              Price <span style={{ color: "#b5484b" }}>*</span>
            </label>
            <input
              type="text"
              value={form.price}
              onChange={(e) => setForm({ ...form, price: e.target.value })}
              placeholder="e.g., 1500"
              style={{
                ...inputStyle,
                borderColor: hasError("price") ? "#DC2626" : undefined,
                boxShadow: hasError("price") ? "0 0 0 3px rgba(220,38,38,0.1)" : undefined,
              }}
              onFocus={(e) => {
                if (!hasError("price")) {
                  e.target.style.borderColor = "#b5484b";
                  e.target.style.boxShadow = "0 0 0 3px rgba(181,72,75,0.1)";
                }
              }}
              onBlur={(e) => {
                if (!hasError("price")) {
                  e.target.style.borderColor = "#E6E4DF";
                  e.target.style.boxShadow = "none";
                }
              }}
            />
            {errors.price && <span style={errorStyle}>{errors.price}</span>}
          </div>
          <div>
            <label style={labelStyle}>
              Duration <span style={{ color: "#b5484b" }}>*</span>
            </label>
            <input
              type="number"
              value={form.durationMinutes}
              onChange={(e) => setForm({ ...form, durationMinutes: parseInt(e.target.value) || 0 })}
              placeholder="60"
              min="5"
              step="5"
              style={{
                ...inputStyle,
                borderColor: hasError("durationMinutes") ? "#DC2626" : undefined,
                boxShadow: hasError("durationMinutes") ? "0 0 0 3px rgba(220,38,38,0.1)" : undefined,
              }}
              onFocus={(e) => {
                if (!hasError("durationMinutes")) {
                  e.target.style.borderColor = "#b5484b";
                  e.target.style.boxShadow = "0 0 0 3px rgba(181,72,75,0.1)";
                }
              }}
              onBlur={(e) => {
                if (!hasError("durationMinutes")) {
                  e.target.style.borderColor = "#E6E4DF";
                  e.target.style.boxShadow = "none";
                }
              }}
            />
            {errors.durationMinutes && <span style={errorStyle}>{errors.durationMinutes}</span>}
            {/* Quick presets */}
            <div style={{ display: "flex", flexWrap: "wrap", gap: "6px", marginTop: "8px" }}>
              {DURATION_PRESETS.map((d) => {
                const active = form.durationMinutes === d;
                return (
                  <button
                    key={d}
                    type="button"
                    onClick={() => setForm({ ...form, durationMinutes: d })}
                    style={{
                      padding: "3px 10px",
                      fontSize: "11px",
                      fontWeight: 500,
                      borderRadius: "6px",
                      border: active ? "none" : "1px solid #E6E4DF",
                      background: active ? "linear-gradient(135deg, #b5484b, #6b3057)" : "#fff",
                      color: active ? "#fff" : "#5F6577",
                      cursor: "pointer",
                      transition: "all 0.15s",
                    }}
                  >
                    {parseDuration(d)}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Branch */}
        <div>
          <label style={labelStyle}>
            Branch <span style={{ color: "#b5484b" }}>*</span>
          </label>
          <select
            value={form.branch}
            onChange={(e) => setForm({ ...form, branch: e.target.value })}
            style={{
              ...inputStyle,
              borderColor: hasError("branch") ? "#DC2626" : undefined,
              boxShadow: hasError("branch") ? "0 0 0 3px rgba(220,38,38,0.1)" : undefined,
              cursor: "pointer",
              appearance: "none",
              backgroundImage: `url("data:image/svg+xml,%3Csvg width='10' height='6' viewBox='0 0 10 6' fill='none' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M1 1L5 5L9 1' stroke='%235F6577' stroke-width='1.5' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E")`,
              backgroundRepeat: "no-repeat",
              backgroundPosition: "right 14px center",
              paddingRight: "36px",
            }}
            onFocus={(e) => {
              if (!hasError("branch")) {
                e.target.style.borderColor = "#b5484b";
                e.target.style.boxShadow = "0 0 0 3px rgba(181,72,75,0.1)";
              }
            }}
            onBlur={(e) => {
              if (!hasError("branch")) {
                e.target.style.borderColor = "#E6E4DF";
                e.target.style.boxShadow = "none";
              }
            }}
          >
            <option value="">Select a branch</option>
            <option value="All Branches">All Branches</option>
            {branches.map((b) => (
              <option key={b.id} value={b.name}>
                {b.name}
              </option>
            ))}
          </select>
          {errors.branch && <span style={errorStyle}>{errors.branch}</span>}
        </div>

        {/* Description */}
        <div>
          <label style={labelStyle}>Description</label>
          <textarea
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            placeholder="What's included in this service? Use · to separate items"
            rows={3}
            style={{
              ...inputStyle,
              fontFamily: "'DM Sans', sans-serif",
              resize: "vertical",
              lineHeight: 1.6,
            }}
            onFocus={(e) => {
              e.target.style.borderColor = "#b5484b";
              e.target.style.boxShadow = "0 0 0 3px rgba(181,72,75,0.1)";
            }}
            onBlur={(e) => {
              e.target.style.borderColor = "#E6E4DF";
              e.target.style.boxShadow = "none";
            }}
          />
          <span style={{ fontSize: "11px", color: "#9CA3B4", marginTop: "4px", display: "block" }}>
            Separate multiple items with · (e.g., Wash · Cut · Blowdry)
          </span>
        </div>

        {/* Actions */}
        <div
          style={{
            display: "flex",
            gap: "10px",
            justifyContent: "flex-end",
            borderTop: "1px solid #E6E4DF",
            paddingTop: "20px",
            marginTop: "4px",
          }}
        >
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
            {isSubmitting ? "Saving…" : editing ? "Update Service" : "Create Service"}
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