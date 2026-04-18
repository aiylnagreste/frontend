"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { fetchPlans } from "@/lib/queries";
import type { Plan } from "@/lib/types";
import { api } from "@/lib/api";
import { toast } from "sonner";
import { Skeleton } from "@/components/ui/Skeleton";
import { EmptyState } from "@/components/ui/EmptyState";
import { Plus, Pencil, Trash2, X, MessageCircle, Share2, Users, Phone, Power, LayoutGrid } from "lucide-react";

const C = {
  bg: "#F4F3EF", surface: "#FFFFFF",
  primary: "#0D9488", primaryLight: "#CCFBF1",
  text: "#1A1D23", text2: "#5F6577", text3: "#9CA3B4",
  border: "#E6E4DF", border2: "#F0EEEA",
  success: "#10B981", successBg: "#ECFDF5",
  error: "#EF4444", errorBg: "#FEF2F2",
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

function FeatureChip({ label, active, icon }: { label: string; active: boolean; icon?: React.ReactNode }) {
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: 4,
      padding: "3px 10px", borderRadius: 99, fontSize: 11, fontWeight: 600,
      background: active ? C.primaryLight : C.bg,
      color: active ? C.primary : C.text3,
      textDecoration: active ? "none" : "line-through",
      border: `1px solid ${active ? "#99F6E4" : C.border2}`,
    }}>
      {icon}{label}
    </span>
  );
}

function PlanCard({ plan, onEdit, onToggle, onHardDelete }: {
  plan: Plan;
  onEdit: (p: Plan) => void;
  onToggle: (p: Plan) => void;
  onHardDelete: (id: number) => void;
}) {
  const price = (plan.price_cents / 100).toFixed(2);
  const cycle = plan.billing_cycle === "monthly" ? "/mo" : plan.billing_cycle === "yearly" ? "/yr" : "";

  return (
    <div style={{
      background: C.surface, borderRadius: 12,
      border: `1px solid ${plan.is_active ? C.border2 : "#FECACA"}`,
      overflow: "hidden", opacity: plan.is_active ? 1 : 0.72,
      display: "flex", flexDirection: "column",
    }}>
      <div style={{ padding: "16px 20px", borderBottom: `1px solid ${C.border2}`, display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 2 }}>
            <span style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fontSize: 15, color: C.text }}>{plan.name}</span>
            <span style={{
              fontSize: 11, fontWeight: 600, padding: "2px 8px", borderRadius: 99,
              background: plan.is_active ? C.successBg : C.errorBg,
              color: plan.is_active ? "#059669" : "#DC2626",
            }}>
              {plan.is_active ? "Active" : "Inactive"}
            </span>
          </div>
          {plan.description && <p style={{ fontSize: 12, color: C.text3, margin: 0 }}>{plan.description}</p>}
        </div>
        <div style={{ display: "flex", gap: 2 }}>
          <button onClick={() => onEdit(plan)} style={{ padding: 6, background: "none", border: "none", cursor: "pointer", color: C.text3, borderRadius: 6 }} title="Edit">
            <Pencil size={13} />
          </button>
          <button onClick={() => onToggle(plan)} style={{ padding: 6, background: "none", border: "none", cursor: "pointer", color: plan.is_active ? "#F59E0B" : C.primary, borderRadius: 6 }} title={plan.is_active ? "Deactivate" : "Activate"}>
            <Power size={13} />
          </button>
          <button onClick={() => onHardDelete(plan.id)} style={{ padding: 6, background: "none", border: "none", cursor: "pointer", color: C.error, borderRadius: 6 }} title="Delete permanently">
            <Trash2 size={13} />
          </button>
        </div>
      </div>

      <div style={{ padding: "16px 20px", display: "flex", flexDirection: "column", gap: 14 }}>
        <div>
          <span style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 26, fontWeight: 700, color: C.text }}>${price}</span>
          <span style={{ fontSize: 13, color: C.text3, marginLeft: 3 }}>{cycle}</span>
        </div>

        <div style={{ fontSize: 12, color: C.text2 }}>
          <span style={{ fontWeight: 600, color: C.text }}>{plan.max_services}</span> max services
        </div>

        <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
          <FeatureChip label="WhatsApp" active={!!plan.whatsapp_access} icon={<MessageCircle size={10} />} />
          <FeatureChip label="Instagram" active={!!plan.instagram_access} icon={<Share2 size={10} />} />
          <FeatureChip label="Facebook" active={!!plan.facebook_access} icon={<Users size={10} />} />
          <FeatureChip label="AI Calls" active={!!plan.ai_calls_access} icon={<Phone size={10} />} />
        </div>
      </div>
    </div>
  );
}

function Toggle({ label, checked, onChange }: { label: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <label style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "8px 0", cursor: "pointer", userSelect: "none" }}>
      <span style={{ fontSize: 14, color: C.text2 }}>{label}</span>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        style={{
          width: 36, height: 20, borderRadius: 99, border: "none", cursor: "pointer",
          background: checked ? C.primary : C.border,
          position: "relative", transition: "background 0.15s", padding: 0, flexShrink: 0,
        }}
      >
        <span style={{
          display: "block", width: 16, height: 16, borderRadius: "50%", background: "#fff",
          position: "absolute", top: 2, left: checked ? 18 : 2,
          transition: "left 0.15s", boxShadow: "0 1px 3px rgba(0,0,0,0.2)",
        }} />
      </button>
    </label>
  );
}

function PlanForm({ initial, onClose, onSaved }: {
  initial: PlanFormData & { id?: number };
  onClose: () => void;
  onSaved: () => void;
}) {
  const [form, setForm] = useState<PlanFormData>({ ...initial });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

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

  const inputStyle: React.CSSProperties = {
    width: "100%", padding: "9px 12px",
    border: `1.5px solid ${C.border}`, borderRadius: 8,
    fontSize: 14, color: C.text, outline: "none",
    boxSizing: "border-box", background: C.surface,
    fontFamily: "'DM Sans', sans-serif",
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "18px 24px", borderBottom: `1px solid ${C.border2}` }}>
        <h2 style={{ margin: 0, fontFamily: "'Space Grotesk', sans-serif", fontSize: 16, fontWeight: 700, color: C.text }}>
          {initial.id ? "Edit Plan" : "New Plan"}
        </h2>
        <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", color: C.text3, padding: 4, borderRadius: 6 }} aria-label="Close">
          <X size={16} />
        </button>
      </div>

      <div style={{ flex: 1, overflowY: "auto", padding: "20px 24px", display: "flex", flexDirection: "column", gap: 16 }}>
        {error && (
          <div role="alert" style={{ background: C.errorBg, color: C.error, padding: "10px 14px", borderRadius: 8, fontSize: 13 }}>
            {error}
          </div>
        )}

        <div>
          <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: C.text2, marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.05em" }}>
            Plan Name <span style={{ color: C.error }}>*</span>
          </label>
          <input style={inputStyle} value={form.name} onChange={e => set("name", e.target.value)} placeholder="e.g. Starter, Pro" />
        </div>

        <div>
          <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: C.text2, marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.05em" }}>Description</label>
          <textarea style={{ ...inputStyle, resize: "none" }} rows={2} value={form.description} onChange={e => set("description", e.target.value)} placeholder="Short plan description" />
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          <div>
            <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: C.text2, marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.05em" }}>
              Price (cents) <span style={{ color: C.error }}>*</span>
            </label>
            <input type="number" min={0} style={inputStyle} value={form.price_cents} onChange={e => set("price_cents", parseInt(e.target.value || "0", 10))} />
            <p style={{ fontSize: 11, color: C.text3, margin: "4px 0 0", fontFamily: "'Space Grotesk', monospace" }}>${(form.price_cents / 100).toFixed(2)}</p>
          </div>
          <div>
            <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: C.text2, marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.05em" }}>Billing Cycle</label>
            <select style={inputStyle} value={form.billing_cycle} onChange={e => set("billing_cycle", e.target.value as PlanFormData["billing_cycle"])}>
              <option value="monthly">Monthly</option>
              <option value="yearly">Yearly</option>
              <option value="one-time">One-time</option>
            </select>
          </div>
        </div>

        <div>
          <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: C.text2, marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.05em" }}>Max Services</label>
          <input type="number" min={1} style={inputStyle} value={form.max_services} onChange={e => set("max_services", parseInt(e.target.value || "1", 10))} />
        </div>

        <div>
          <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: C.text2, marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.05em" }}>Stripe Price ID</label>
          <input style={inputStyle} value={form.stripe_price_id} onChange={e => set("stripe_price_id", e.target.value)} placeholder="price_..." />
          <p style={{ fontSize: 11, color: C.text3, margin: "4px 0 0" }}>Leave blank for free plans.</p>
        </div>

        <div style={{ border: `1px solid ${C.border2}`, borderRadius: 10, padding: "4px 16px 8px" }}>
          <p style={{ fontSize: 11, fontWeight: 600, color: C.text3, textTransform: "uppercase", letterSpacing: "0.06em", margin: "12px 0 4px" }}>Features</p>
          <Toggle label="WhatsApp Chat" checked={form.whatsapp_access} onChange={v => set("whatsapp_access", v)} />
          <Toggle label="Instagram Chat" checked={form.instagram_access} onChange={v => set("instagram_access", v)} />
          <Toggle label="Facebook Chat" checked={form.facebook_access} onChange={v => set("facebook_access", v)} />
          <Toggle label="AI Voice Calls" checked={form.ai_calls_access} onChange={v => set("ai_calls_access", v)} />
        </div>
      </div>

      <div style={{ padding: "16px 24px", borderTop: `1px solid ${C.border2}`, display: "flex", gap: 8, justifyContent: "flex-end" }}>
        <button onClick={onClose} style={{ padding: "8px 16px", fontSize: 13, fontWeight: 600, borderRadius: 8, border: `1px solid ${C.border}`, background: C.surface, color: C.text2, cursor: "pointer", fontFamily: "'DM Sans', sans-serif" }}>
          Cancel
        </button>
        <button onClick={handleSave} disabled={saving} style={{ padding: "8px 18px", fontSize: 13, fontWeight: 700, borderRadius: 8, border: "none", background: saving ? "#5EAAA4" : C.primary, color: "#fff", cursor: saving ? "not-allowed" : "pointer", fontFamily: "'DM Sans', sans-serif" }}>
          {saving ? "Saving…" : initial.id ? "Update Plan" : "Create Plan"}
        </button>
      </div>
    </div>
  );
}

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
    <div style={{ padding: "32px 36px", background: C.bg, minHeight: "100vh", fontFamily: "'DM Sans', sans-serif" }}>
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 26, fontWeight: 700, color: C.text, letterSpacing: "-0.02em" }}>Plans</h1>
        <p style={{ fontSize: 14, color: C.text2, marginTop: 4 }}>Manage subscription plans and feature access</p>
      </div>

      <div style={{ background: C.surface, border: `1px solid ${C.border2}`, borderRadius: 12, overflow: "hidden" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "18px 24px", borderBottom: `1px solid ${C.border2}` }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ width: 32, height: 32, borderRadius: 8, background: C.primaryLight, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <LayoutGrid size={14} style={{ color: C.primary }} />
            </div>
            <h3 style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 15, fontWeight: 600, color: C.text, margin: 0 }}>Subscription Plans</h3>
          </div>
          <button
            onClick={handleNew}
            style={{
              display: "inline-flex", alignItems: "center", gap: 6,
              padding: "8px 16px", fontSize: 13, fontWeight: 700, borderRadius: 8,
              border: "none", background: C.primary, color: "#fff", cursor: "pointer",
              fontFamily: "'DM Sans', sans-serif",
            }}
          >
            <Plus size={13} /> New Plan
          </button>
        </div>

        {isLoading ? (
          <div style={{ padding: 24, display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 16 }}>
            {[1, 2, 3].map(i => <Skeleton key={i} style={{ height: 200, borderRadius: 12 }} />)}
          </div>
        ) : !plans?.length ? (
          <EmptyState title="No plans yet" description="Create your first subscription plan to allow salon admins to register." action={{ label: "Create Plan", onClick: handleNew }} />
        ) : (
          <div style={{ padding: 24, display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 16 }}>
            {plans.map(p => (
              <PlanCard key={p.id} plan={p} onEdit={handleEdit} onToggle={handleToggle} onHardDelete={handleHardDelete} />
            ))}
          </div>
        )}
      </div>

      {modalOpen && editing && (
        <div
          style={{
            position: "fixed", inset: 0, background: "rgba(0,0,0,0.45)",
            zIndex: 40, display: "flex", alignItems: "center", justifyContent: "center",
            backdropFilter: "blur(2px)",
          }}
          onClick={() => setModalOpen(false)}
        >
          <div
            style={{
              background: C.surface, borderRadius: 16,
              width: "100%", maxWidth: 520, maxHeight: "90vh",
              display: "flex", flexDirection: "column",
              boxShadow: "0 24px 48px -12px rgba(0,0,0,0.22)", overflow: "hidden",
            }}
            onClick={e => e.stopPropagation()}
          >
            <PlanForm
              initial={editing}
              onClose={() => setModalOpen(false)}
              onSaved={() => qc.invalidateQueries({ queryKey: ["superPlans"] })}
            />
          </div>
        </div>
      )}
    </div>
  );
}
