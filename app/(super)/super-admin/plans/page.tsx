"use client";

import { useState ,useEffect} from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { fetchPlans } from "@/lib/queries";
import type { Plan } from "@/lib/types";
import { api } from "@/lib/api";
import { toast } from "sonner";
import { Skeleton } from "@/components/ui/Skeleton";
import { EmptyState } from "@/components/ui/EmptyState";
import {
  Plus, Pencil, Trash2, X, MessageCircle, Share2,
  Users, Phone, Power, LayoutGrid, Loader2, Check, Layers,
} from "lucide-react";

const C = {
  bg: "#F4F3EF",
  surface: "#FFFFFF",
  primary: "#0D9488",
  primaryHover: "#0F766E",
  primaryLight: "#CCFBF1",
  primaryGlow: "rgba(13,148,136,0.12)",
  text: "#1A1D23",
  text2: "#5F6577",
  text3: "#9CA3B4",
  border: "#E6E4DF",
  border2: "#F0EEEA",
  success: "#10B981",
  successBg: "#ECFDF5",
  error: "#EF4444",
  errorBg: "#FEF2F2",
  warning: "#F59E0B",
  warningBg: "#FFFBEB",
};

type PlanFormData = {
  name: string;
  description: string;
  price_cents: number;
  billing_cycle: "monthly" | "yearly" | "one-time";
  max_services: number;
  whatsapp_access: boolean;
  instagram_access: boolean;
  facebook_access: boolean;
  ai_calls_access: boolean;
  stripe_price_id: string;
};

const BLANK: PlanFormData = {
  name: "",
  description: "",
  price_cents: 0,
  billing_cycle: "monthly",
  max_services: 10,
  whatsapp_access: false,
  instagram_access: false,
  facebook_access: false,
  ai_calls_access: false,
  stripe_price_id: "",
};

// ── Feature Chip ──────────────────────────────────────────────────────────────
function FeatureChip({ label, active, icon }: { label: string; active: boolean; icon?: React.ReactNode }) {
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: 5,
      padding: "4px 10px", borderRadius: 99, fontSize: 11, fontWeight: 600,
      letterSpacing: "0.01em",
      background: active ? C.primaryLight : C.bg,
      color: active ? C.primary : C.text3,
      border: `1px solid ${active ? "#99F6E4" : C.border2}`,
      opacity: active ? 1 : 0.55,
      transition: "all 0.15s",
    }}>
      {icon}{label}
    </span>
  );
}

// ── Plan Card ─────────────────────────────────────────────────────────────────
function PlanCard({ plan, onEdit, onToggle, onHardDelete }: {
  plan: Plan;
  onEdit: (p: Plan) => void;
  onToggle: (p: Plan) => void;
  onHardDelete: (id: number) => void;
}) {
  const price = (plan.price_cents / 100).toFixed(2);
  const cycle = plan.billing_cycle === "monthly" ? "/mo" : plan.billing_cycle === "yearly" ? "/yr" : "";
  const active = plan.is_active;

  return (
    <div style={{
      background: C.surface,
      borderRadius: 14,
      border: `1px solid ${active ? C.border2 : "#FECACA"}`,
      overflow: "hidden",
      opacity: active ? 1 : 0.65,
      display: "flex", flexDirection: "column",
      boxShadow: "0 1px 3px rgba(26,29,35,0.04)",
      transition: "box-shadow 0.2s, transform 0.2s, opacity 0.2s",
    }}
      onMouseEnter={e => {
        if (active) {
          e.currentTarget.style.boxShadow = "0 6px 20px rgba(26,29,35,0.08)";
          e.currentTarget.style.transform = "translateY(-3px)";
        }
      }}
      onMouseLeave={e => {
        e.currentTarget.style.boxShadow = "0 1px 3px rgba(26,29,35,0.04)";
        e.currentTarget.style.transform = "translateY(0)";
      }}
    >
      {/* Card header */}
      <div style={{
        padding: "18px 20px 14px",
        borderBottom: `1px solid ${C.border2}`,
        display: "flex", alignItems: "flex-start", justifyContent: "space-between",
        background: active
          ? "linear-gradient(180deg, rgba(13,148,136,0.04), transparent)"
          : "linear-gradient(180deg, rgba(239,68,68,0.04), transparent)",
      }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
            <span style={{
              fontFamily: "'Space Grotesk', sans-serif",
              fontWeight: 700, fontSize: 15, color: C.text,
              letterSpacing: "-0.01em",
            }}>{plan.name}</span>
            <span style={{
              display: "inline-flex", alignItems: "center", gap: 4,
              fontSize: 10.5, fontWeight: 600, padding: "2px 9px", borderRadius: 99,
              background: active ? C.successBg : C.errorBg,
              color: active ? "#059669" : "#DC2626",
            }}>
              <span style={{
                width: 5, height: 5, borderRadius: "50%",
                background: active ? "#059669" : "#DC2626",
                boxShadow: active ? "0 0 0 2px rgba(5,150,105,0.2)" : "0 0 0 2px rgba(220,38,38,0.2)",
              }} />
              {active ? "Active" : "Inactive"}
            </span>
          </div>
          {plan.description && <p style={{ fontSize: 12, color: C.text3, margin: 0, lineHeight: 1.4 }}>{plan.description}</p>}
        </div>

        {/* Actions */}
        <div style={{ display: "flex", gap: 2, flexShrink: 0 }}>
          <button
            onClick={() => onEdit(plan)}
            title="Edit"
            style={{
              width: 30, height: 30, display: "flex", alignItems: "center", justifyContent: "center",
              background: "transparent", border: "1.5px solid transparent", borderRadius: 7,
              cursor: "pointer", color: C.text3, transition: "all 0.15s",
            }}
            onMouseEnter={e => { e.currentTarget.style.background = C.bg; e.currentTarget.style.borderColor = C.border; e.currentTarget.style.color = C.text2; }}
            onMouseLeave={e => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.borderColor = "transparent"; e.currentTarget.style.color = C.text3; }}
          >
            <Pencil size={12.5} />
          </button>
          <button
            onClick={() => onToggle(plan)}
            title={active ? "Deactivate" : "Activate"}
            style={{
              width: 30, height: 30, display: "flex", alignItems: "center", justifyContent: "center",
              background: "transparent", border: "1.5px solid transparent", borderRadius: 7,
              cursor: "pointer", color: active ? C.warning : C.primary, transition: "all 0.15s",
            }}
            onMouseEnter={e => {
              e.currentTarget.style.background = active ? C.warningBg : C.primaryLight;
              e.currentTarget.style.borderColor = active ? "rgba(245,158,11,0.2)" : "rgba(13,148,136,0.2)";
            }}
            onMouseLeave={e => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.borderColor = "transparent"; }}
          >
            <Power size={12.5} />
          </button>
          <button
            onClick={() => onHardDelete(plan.id)}
            title="Delete permanently"
            style={{
              width: 30, height: 30, display: "flex", alignItems: "center", justifyContent: "center",
              background: "transparent", border: "1.5px solid transparent", borderRadius: 7,
              cursor: "pointer", color: C.error, transition: "all 0.15s",
            }}
            onMouseEnter={e => { e.currentTarget.style.background = C.errorBg; e.currentTarget.style.borderColor = "rgba(239,68,68,0.2)"; }}
            onMouseLeave={e => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.borderColor = "transparent"; }}
          >
            <Trash2 size={12.5} />
          </button>
        </div>
      </div>

      {/* Card body */}
      <div style={{ padding: "18px 20px 20px", display: "flex", flexDirection: "column", gap: 14, flex: 1 }}>
        <div>
          <span style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 28, fontWeight: 700, color: C.text, letterSpacing: "-0.03em" }}>${price}</span>
          <span style={{ fontSize: 13, color: C.text3, marginLeft: 3 }}>{cycle}</span>
        </div>

        <div style={{ fontSize: 12.5, color: C.text2 }}>
          <span style={{ fontWeight: 700, color: C.text, fontFamily: "'Space Grotesk', sans-serif" }}>{plan.max_services}</span> max services
        </div>

        <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: "auto" }}>
          <FeatureChip label="WhatsApp" active={!!plan.whatsapp_access} icon={<MessageCircle size={10} />} />
          <FeatureChip label="Instagram" active={!!plan.instagram_access} icon={<Share2 size={10} />} />
          <FeatureChip label="Facebook" active={!!plan.facebook_access} icon={<Users size={10} />} />
          <FeatureChip label="Widget" active={!!plan.ai_calls_access} icon={<Phone size={10} />} />
        </div>
      </div>
    </div>
  );
}

// ── Toggle ────────────────────────────────────────────────────────────────────
function Toggle({ label, checked, onChange }: { label: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <label style={{
      display: "flex", alignItems: "center", justifyContent: "space-between",
      padding: "9px 0", cursor: "pointer", userSelect: "none",
      borderBottom: `1px solid ${C.border2}`,
    }}>
      <span style={{ fontSize: 13.5, color: checked ? C.text : C.text3, transition: "color 0.15s" }}>{label}</span>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        style={{
          width: 38, height: 21, borderRadius: 99, border: "none", cursor: "pointer",
          background: checked ? `linear-gradient(135deg, ${C.primary}, ${C.primaryHover})` : C.border,
          position: "relative", transition: "background 0.2s", padding: 0, flexShrink: 0,
          boxShadow: checked ? `0 1px 4px ${C.primaryGlow}` : "none",
        }}
      >
        <span style={{
          display: "block", width: 17, height: 17, borderRadius: "50%", background: "#fff",
          position: "absolute", top: 2, left: checked ? 19 : 2,
          transition: "left 0.2s cubic-bezier(0.4, 0, 0.2, 1)",
          boxShadow: "0 1px 3px rgba(0,0,0,0.18)",
        }} />
      </button>
    </label>
  );
}

// ── Modal Shell ───────────────────────────────────────────────────────────────
function ModalShell({ children, maxWidth }: { children: React.ReactNode; maxWidth?: number }) {
  return (
    <div
      style={{
        position: "fixed", inset: 0,
        background: "rgba(14,16,21,0.55)",
        backdropFilter: "blur(6px)",
        WebkitBackdropFilter: "blur(6px)",
        display: "flex", alignItems: "center", justifyContent: "center",
        zIndex: 1000,
      }}
      onClick={() => window.dispatchEvent(new CustomEvent("close-modal"))}
    >
      <div style={{
        background: C.surface, borderRadius: 18,
        width: "92%", maxWidth: maxWidth || 520, maxHeight: "90vh",
        display: "flex", flexDirection: "column",
        boxShadow: "0 24px 60px rgba(14,16,21,0.18), 0 0 0 1px rgba(255,255,255,0.05)",
        overflow: "hidden",
        animation: "modalIn 0.2s ease-out",
      }}
        onClick={e => e.stopPropagation()}
      >
        {children}
      </div>
      <style>{`
        @keyframes modalIn {
          from { opacity: 0; transform: translateY(12px) scale(0.97); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
      `}</style>
    </div>
  );
}

function ModalHeader({ icon, iconBg, iconColor, title, subtitle, onClose }: {
  icon: React.ReactNode; iconBg: string; iconColor: string;
  title: string; subtitle?: string; onClose: () => void;
}) {
  return (
    <div style={{
      display: "flex", alignItems: "center", gap: 12,
      padding: "22px 26px 18px",
      borderBottom: `1px solid ${C.border2}`,
      background: "linear-gradient(180deg, rgba(13,148,136,0.04), transparent)",
    }}>
      <div style={{
        width: 36, height: 36, borderRadius: 10,
        background: iconBg, display: "flex", alignItems: "center", justifyContent: "center",
        flexShrink: 0,
      }}>
        <span style={{ color: iconColor }}>{icon}</span>
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <h3 style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 16, fontWeight: 600, color: C.text, letterSpacing: "-0.01em" }}>{title}</h3>
        {subtitle && <p style={{ fontSize: 12.5, color: C.text3, marginTop: 2 }}>{subtitle}</p>}
      </div>
      <button
        onClick={onClose}
        style={{
          width: 32, height: 32, display: "flex", alignItems: "center", justifyContent: "center",
          background: C.bg, border: `1px solid ${C.border}`,
          cursor: "pointer", color: C.text3, borderRadius: 8,
          transition: "all 0.15s",
        }}
        onMouseEnter={e => { e.currentTarget.style.color = C.text; e.currentTarget.style.borderColor = C.text3; }}
        onMouseLeave={e => { e.currentTarget.style.color = C.text3; e.currentTarget.style.borderColor = C.border; }}
      >
        <X size={14} />
      </button>
    </div>
  );
}

function ModalFooter({ onCancel, onConfirm, confirmLabel, loading }: {
  onCancel: () => void; onConfirm: () => void;
  confirmLabel: string; loading?: boolean;
}) {
  return (
    <div style={{
      display: "flex", justifyContent: "flex-end", gap: 8,
      padding: "16px 26px",
      background: C.bg,
      borderTop: `1px solid ${C.border2}`,
    }}>
      <button
        onClick={onCancel}
        style={{
          padding: "10px 20px", background: C.surface,
          border: `1.5px solid ${C.border}`, borderRadius: 10,
          fontSize: 13, fontWeight: 600, color: C.text2, cursor: "pointer",
          fontFamily: "'DM Sans', sans-serif",
          transition: "all 0.15s",
        }}
        onMouseEnter={e => { e.currentTarget.style.background = C.border2; e.currentTarget.style.borderColor = C.text3; }}
        onMouseLeave={e => { e.currentTarget.style.background = C.surface; e.currentTarget.style.borderColor = C.border; }}
      >Cancel</button>
      <button
        onClick={onConfirm}
        disabled={loading}
        style={{
          display: "inline-flex", alignItems: "center", gap: 7,
          padding: "10px 20px",
          background: loading ? "#9CA3B4" : `linear-gradient(135deg, ${C.primary}, ${C.primaryHover})`,
          border: "none", borderRadius: 10,
          fontSize: 13, fontWeight: 700, color: "#fff",
          cursor: loading ? "not-allowed" : "pointer",
          fontFamily: "'DM Sans', sans-serif",
          boxShadow: loading ? "none" : `0 2px 8px ${C.primaryGlow}`,
          transition: "all 0.18s",
        }}
        onMouseEnter={e => {
          if (!loading) {
            e.currentTarget.style.boxShadow = "0 4px 16px rgba(13,148,136,0.25)";
            e.currentTarget.style.transform = "translateY(-1px)";
          }
        }}
        onMouseLeave={e => {
          if (!loading) {
            e.currentTarget.style.boxShadow = `0 2px 8px ${C.primaryGlow}`;
            e.currentTarget.style.transform = "translateY(0)";
          }
        }}
      >
        {loading && <Loader2 size={13} style={{ animation: "spin 0.8s linear infinite" }} />}
        {confirmLabel}
      </button>
    </div>
  );
}

// ── Focused Input ─────────────────────────────────────────────────────────────
function FormInput({ label, required, children, hint }: {
  label: string; required?: boolean; children: React.ReactNode; hint?: string;
}) {
  return (
    <div style={{ marginBottom: 16 }}>
      <label style={{
        display: "block", fontSize: 11.5, fontWeight: 600,
        color: C.text2, textTransform: "uppercase",
        letterSpacing: "0.06em", marginBottom: 7,
      }}>
        {label} {required && <span style={{ color: C.error }}>*</span>}
      </label>
      {children}
      {hint && <p style={{ fontSize: 11, color: C.text3, margin: "5px 0 0", fontFamily: "'Space Grotesk', monospace" }}>{hint}</p>}
    </div>
  );
}

const inputBase: React.CSSProperties = {
  width: "100%", padding: "11px 14px",
  border: `1.5px solid ${C.border}`, borderRadius: 10,
  fontSize: 14, color: C.text, outline: "none",
  boxSizing: "border-box", background: C.surface,
  fontFamily: "'DM Sans', sans-serif",
  transition: "border-color 0.2s, box-shadow 0.2s",
};

function attachFocusHandlers(el: HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement) {
  el.addEventListener("focus", () => {
    el.style.borderColor = C.primary;
    el.style.boxShadow = `0 0 0 3px ${C.primaryGlow}`;
  });
  el.addEventListener("blur", () => {
    el.style.borderColor = C.border;
    el.style.boxShadow = "none";
  });
}

// ── Plan Form ─────────────────────────────────────────────────────────────────
function PlanForm({ initial, onClose, onSaved }: {
  initial: PlanFormData & { id?: number };
  onClose: () => void;
  onSaved: () => void;
}) {
  const [form, setForm] = useState<PlanFormData>({ ...initial });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const isEdit = !!initial.id;

  useEffect(() => {
    const handler = () => onClose();
    window.addEventListener("close-modal", handler);
    return () => window.removeEventListener("close-modal", handler);
  }, [onClose]);

  // Attach focus handlers to inputs after mount
  useEffect(() => {
    const timeout = setTimeout(() => {
      document.querySelectorAll<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>(
        "#plan-form input, #plan-form select, #plan-form textarea"
      ).forEach(attachFocusHandlers);
    }, 50);
    return () => clearTimeout(timeout);
  }, []);

  const set = <K extends keyof PlanFormData>(key: K, value: PlanFormData[K]) =>
    setForm(f => ({ ...f, [key]: value }));

  async function handleSave() {
    if (!form.name.trim()) { setError("Plan name is required"); return; }
    if (form.price_cents < 0) { setError("Price cannot be negative"); return; }
    setError("");
    setSaving(true);
    try {
      const payload = {
        ...form,
        price_cents: Number(form.price_cents),
        max_services: Number(form.max_services),
        whatsapp_access: form.whatsapp_access ? 1 : 0,
        instagram_access: form.instagram_access ? 1 : 0,
        facebook_access: form.facebook_access ? 1 : 0,
        ai_calls_access: form.ai_calls_access ? 1 : 0,
      };
      if (initial.id) {
        await api.put(`/super-admin/api/plans/${initial.id}`, payload);
        toast.success("Plan updated");
      } else {
        await api.post("/super-admin/api/plans", payload);
        toast.success("Plan created");
      }
      onSaved();
      onClose();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Save failed");
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <ModalHeader
        icon={isEdit ? <Pencil size={15} /> : <Plus size={15} />}
        iconBg={C.primaryLight}
        iconColor={C.primary}
        title={isEdit ? "Edit Plan" : "New Plan"}
        subtitle={isEdit ? `Editing "${initial.name}"` : "Create a subscription plan"}
        onClose={onClose}
      />

      <div id="plan-form" style={{ flex: 1, overflowY: "auto", padding: "22px 26px", display: "flex", flexDirection: "column", gap: 4 }}>
        {error && (
          <div role="alert" style={{
            background: C.errorBg, color: C.error, padding: "10px 14px",
            borderRadius: 10, fontSize: 13, fontWeight: 500,
            display: "flex", alignItems: "center", gap: 6,
            border: `1px solid rgba(239,68,68,0.15)`,
            marginBottom: 8,
          }}>
            <X size={13} /> {error}
          </div>
        )}

        <FormInput label="Plan Name" required>
          <input style={inputBase} value={form.name} onChange={e => set("name", e.target.value)} placeholder="e.g. Starter, Pro" />
        </FormInput>

        <FormInput label="Description">
          <textarea
            style={{ ...inputBase, resize: "none", lineHeight: 1.5 }}
            rows={2} value={form.description}
            onChange={e => set("description", e.target.value)}
            placeholder="Short plan description"
          />
        </FormInput>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          <FormInput label="Price (cents)" required hint={`= $${(form.price_cents / 100).toFixed(2)}`}>
            <input type="number" min={0} style={inputBase} value={form.price_cents} onChange={e => set("price_cents", parseInt(e.target.value || "0", 10))} />
          </FormInput>
          <FormInput label="Billing Cycle">
            <select style={inputBase} value={form.billing_cycle} onChange={e => set("billing_cycle", e.target.value as PlanFormData["billing_cycle"])}>
              <option value="monthly">Monthly</option>
              <option value="yearly">Yearly</option>
              <option value="one-time">One-time</option>
            </select>
          </FormInput>
        </div>

        <FormInput label="Max Services">
          <input type="number" min={1} style={inputBase} value={form.max_services} onChange={e => set("max_services", parseInt(e.target.value || "1", 10))} />
        </FormInput>

        <FormInput label="Stripe Price ID" hint="Leave blank for free plans">
          <input style={inputBase} value={form.stripe_price_id} onChange={e => set("stripe_price_id", e.target.value)} placeholder="price_..." />
        </FormInput>

        {/* Features section */}
        <div style={{
          border: `1px solid ${C.border2}`, borderRadius: 12,
          padding: "4px 16px 4px", marginTop: 4,
          background: `linear-gradient(180deg, rgba(13,148,136,0.02), transparent)`,
        }}>
          <p style={{
            fontSize: 10.5, fontWeight: 600, color: C.text3,
            textTransform: "uppercase", letterSpacing: "0.08em",
            margin: "12px 0 0",
            display: "flex", alignItems: "center", gap: 6,
          }}>
            <Layers size={11} /> Feature Access
          </p>
          <Toggle label="WhatsApp Chat" checked={form.whatsapp_access} onChange={v => set("whatsapp_access", v)} />
          <Toggle label="Instagram Chat" checked={form.instagram_access} onChange={v => set("instagram_access", v)} />
          <Toggle label="Facebook Chat" checked={form.facebook_access} onChange={v => set("facebook_access", v)} />
          <Toggle label="Widget Call & Chat" checked={form.ai_calls_access} onChange={v => set("ai_calls_access", v)} />
        </div>
      </div>

      <ModalFooter
        onCancel={onClose}
        onConfirm={handleSave}
        confirmLabel={saving ? "Saving…" : isEdit ? "Update Plan" : "Create Plan"}
        loading={saving}
      />
    </>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function PlansPage() {
  const qc = useQueryClient();
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<(PlanFormData & { id?: number }) | null>(null);

  const { data: plans, isLoading } = useQuery<Plan[]>({
    queryKey: ["superPlans"],
    queryFn: fetchPlans,
    staleTime: 0,
  });

  const toggleMutation = useMutation({
    mutationFn: (plan: Plan) => api.put(`/super-admin/api/plans/${plan.id}`, {
      name: plan.name, description: plan.description,
      price_cents: plan.price_cents, billing_cycle: plan.billing_cycle,
      max_services: plan.max_services,
      whatsapp_access: plan.whatsapp_access ? 1 : 0,
      instagram_access: plan.instagram_access ? 1 : 0,
      facebook_access: plan.facebook_access ? 1 : 0,
      ai_calls_access: plan.ai_calls_access ? 1 : 0,
      stripe_price_id: plan.stripe_price_id,
      is_active: plan.is_active ? 0 : 1,
    }),
    onSuccess: (_, plan) => {
      toast.success(plan.is_active ? "Plan deactivated" : "Plan activated");
      qc.invalidateQueries({ queryKey: ["superPlans"] });
    },
    onError: (e: unknown) => toast.error(e instanceof Error ? e.message : "Failed"),
  });

  const hardDeleteMutation = useMutation({
    mutationFn: (id: number) => api.delete<{ ok: boolean }>(`/super-admin/api/plans/${id}/permanent`),
    onSuccess: () => { toast.success("Plan permanently deleted"); qc.invalidateQueries({ queryKey: ["superPlans"] }); },
    onError: (e: unknown) => toast.error(e instanceof Error ? e.message : "Delete failed"),
  });

  function handleEdit(plan: Plan) {
    setEditing({
      id: plan.id, name: plan.name, description: plan.description || "",
      price_cents: plan.price_cents, billing_cycle: plan.billing_cycle as PlanFormData["billing_cycle"],
      max_services: plan.max_services, whatsapp_access: !!plan.whatsapp_access,
      instagram_access: !!plan.instagram_access, facebook_access: !!plan.facebook_access,
      ai_calls_access: !!plan.ai_calls_access, stripe_price_id: plan.stripe_price_id || "",
    });
    setModalOpen(true);
  }

  function handleNew() { setEditing({ ...BLANK }); setModalOpen(true); }

  function handleToggle(plan: Plan) {
    if (!confirm(`${plan.is_active ? "Deactivate" : "Activate"} "${plan.name}"?`)) return;
    toggleMutation.mutate(plan);
  }

  function handleHardDelete(id: number) {
    if (!confirm("Permanently delete this plan? This cannot be undone.")) return;
    hardDeleteMutation.mutate(id);
  }

  return (
    <div style={{ padding: "28px 36px", background: C.bg, minHeight: "100vh", fontFamily: "'DM Sans', sans-serif" }}>

      {/* Page Header */}
      <div style={{ marginBottom: 28 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <div style={{
            width: 48, height: 48, borderRadius: 14,
            background: `linear-gradient(135deg, ${C.primary}, #0F766E)`,
            display: "flex", alignItems: "center", justifyContent: "center",
            boxShadow: `0 4px 14px ${C.primaryGlow}`,
          }}>
            <Layers size={22} style={{ color: "#fff" }} />
          </div>
          <div>
            <h1 style={{
              fontFamily: "'Space Grotesk', sans-serif",
              fontSize: 24, fontWeight: 700, color: C.text,
              letterSpacing: "-0.025em", lineHeight: 1.2,
            }}>Plans</h1>
            <p style={{ fontSize: 14, color: C.text2, marginTop: 2 }}>
              Manage subscription plans and feature access
            </p>
          </div>
        </div>
      </div>

      {/* Plans Grid */}
      <div style={{
        background: C.surface,
        border: `1px solid ${C.border2}`,
        borderRadius: 14,
        overflow: "hidden",
        boxShadow: "0 1px 3px rgba(26,29,35,0.04)",
      }}>
        {/* Section header */}
        <div style={{
          display: "flex", alignItems: "center", justifyContent: "space-between",
          padding: "18px 22px",
          borderBottom: `1px solid ${C.border2}`,
          background: "linear-gradient(180deg, rgba(13,148,136,0.04), transparent)",
          flexWrap: "wrap", gap: 12,
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{
              width: 32, height: 32, borderRadius: 9,
              background: C.primaryLight, display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              <LayoutGrid size={14} style={{ color: C.primary }} />
            </div>
            <div>
              <h3 style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 14.5, fontWeight: 600, color: C.text, margin: 0 }}>
                Subscription Plans
              </h3>
              {plans && (
                <p style={{ fontSize: 11.5, color: C.text3, marginTop: 1 }}>
                  {plans.filter(p => p.is_active).length} active · {plans.length} total
                </p>
              )}
            </div>
          </div>
          <button
            onClick={handleNew}
            style={{
              display: "inline-flex", alignItems: "center", gap: 6,
              padding: "9px 16px",
              background: `linear-gradient(135deg, ${C.primary}, ${C.primaryHover})`,
              fontSize: 13, fontWeight: 650, borderRadius: 10,
              border: "none", color: "#fff", cursor: "pointer",
              fontFamily: "'DM Sans', sans-serif",
              boxShadow: `0 2px 8px ${C.primaryGlow}`,
              transition: "box-shadow 0.18s, transform 0.15s",
            }}
            onMouseEnter={e => {
              e.currentTarget.style.boxShadow = "0 4px 16px rgba(13,148,136,0.25)";
              e.currentTarget.style.transform = "translateY(-1px)";
            }}
            onMouseLeave={e => {
              e.currentTarget.style.boxShadow = `0 2px 8px ${C.primaryGlow}`;
              e.currentTarget.style.transform = "translateY(0)";
            }}
          >
            <Plus size={15} strokeWidth={2.5} /> New Plan
          </button>
        </div>

        {isLoading ? (
          <div style={{ padding: 24, display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 16 }}>
            {[1, 2, 3].map(i => <Skeleton key={i} style={{ height: 210, borderRadius: 14 }} />)}
          </div>
        ) : !plans?.length ? (
          <EmptyState
            title="No plans yet"
            description="Create your first subscription plan to allow salon admins to register."
            action={{ label: "Create Plan", onClick: handleNew }}
          />
        ) : (
          <div style={{ padding: 24, display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 16 }}>
            {plans.map(p => (
              <PlanCard key={p.id} plan={p} onEdit={handleEdit} onToggle={handleToggle} onHardDelete={handleHardDelete} />
            ))}
          </div>
        )}
      </div>

      {/* Modal */}
      {modalOpen && editing && (
        <ModalShell maxWidth={530}>
          <PlanForm
            initial={editing}
            onClose={() => setModalOpen(false)}
            onSaved={() => qc.invalidateQueries({ queryKey: ["superPlans"] })}
          />
        </ModalShell>
      )}
    </div>
  );
}