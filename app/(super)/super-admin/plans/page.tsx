"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { fetchPlans } from "@/lib/queries";
import type { Plan } from "@/lib/types";
import { api } from "@/lib/api";
import { toast } from "sonner";
import { Badge } from "@/components/ui/Badge";
import { Skeleton } from "@/components/ui/Skeleton";
import { EmptyState } from "@/components/ui/EmptyState";
import { Plus, Pencil, Trash2, X, MessageCircle, Share2, Users, Phone, Power } from "lucide-react";

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
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 4,
        padding: "2px 8px",
        borderRadius: 100,
        fontSize: 11,
        fontWeight: 600,
        background: active ? "#ede9fe" : "#f1f5f9",
        color: active ? "#7c3aed" : "#94a3b8",
        textDecoration: active ? "none" : "line-through",
      }}
    >
      {icon}
      {label}
    </span>
  );
}

function PlanCard({ plan, onEdit, onToggle, onHardDelete }: { plan: Plan; onEdit: (p: Plan) => void; onToggle: (p: Plan) => void; onHardDelete: (id: number) => void }) {
  const price = (plan.price_cents / 100).toFixed(2);
  const cycle = plan.billing_cycle === "monthly" ? "/mo" : plan.billing_cycle === "yearly" ? "/yr" : "";

  return (
    <div style={{ background: "#fff", borderRadius: 12, border: `1px solid ${plan.is_active ? "#e2e8f0" : "#fecaca"}`, boxShadow: "0 1px 4px rgba(0,0,0,0.05)", padding: 20, display: "flex", flexDirection: "column", gap: 16, opacity: plan.is_active ? 1 : 0.75 }}>
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 2 }}>
            <span style={{ fontWeight: 600, fontSize: 15, color: "#0f172a" }}>{plan.name}</span>
            <Badge status={plan.is_active ? "active" : "inactive"} />
          </div>
          {plan.description && <p style={{ fontSize: 13, color: "#64748b", margin: 0 }}>{plan.description}</p>}
        </div>
        <div style={{ display: "flex", gap: 4 }}>
          <button onClick={() => onEdit(plan)} style={{ padding: "6px", background: "none", border: "none", cursor: "pointer", color: "#94a3b8", borderRadius: 6 }} title="Edit">
            <Pencil size={14} />
          </button>
          <button
            onClick={() => onToggle(plan)}
            style={{ padding: "6px", background: "none", border: "none", cursor: "pointer", color: plan.is_active ? "#f59e0b" : "#10b981", borderRadius: 6 }}
            title={plan.is_active ? "Deactivate" : "Activate"}
          >
            <Power size={14} />
          </button>
          <button onClick={() => onHardDelete(plan.id)} style={{ padding: "6px", background: "none", border: "none", cursor: "pointer", color: "#ef4444", borderRadius: 6 }} title="Delete permanently">
            <Trash2 size={14} />
          </button>
        </div>
      </div>

      <div style={{ fontSize: 24, fontWeight: 700, color: "#0f172a" }}>
        ${price}<span style={{ fontSize: 13, fontWeight: 400, color: "#94a3b8", marginLeft: 2 }}>{cycle}</span>
      </div>

      <div style={{ fontSize: 13, color: "#475569" }}>
        <strong>{plan.max_services}</strong> max services
      </div>

      <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
        <FeatureChip label="WhatsApp" active={!!plan.whatsapp_access} icon={<MessageCircle size={10} />} />
        <FeatureChip label="Instagram" active={!!plan.instagram_access} icon={<Share2 size={10} />} />
        <FeatureChip label="Facebook" active={!!plan.facebook_access} icon={<Users size={10} />} />
        <FeatureChip label="AI Calls" active={!!plan.ai_calls_access} icon={<Phone size={10} />} />
      </div>
    </div>
  );
}

function Toggle({ label, checked, onChange }: { label: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <label style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "8px 0", cursor: "pointer", userSelect: "none" }}>
      <span style={{ fontSize: 14, color: "#374151" }}>{label}</span>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        style={{
          width: 36, height: 20, borderRadius: 100, border: "none", cursor: "pointer",
          background: checked ? "#7c3aed" : "#e2e8f0",
          position: "relative", transition: "background 0.15s", padding: 0,
          flexShrink: 0,
        }}
      >
        <span style={{
          display: "block", width: 16, height: 16, borderRadius: "50%", background: "#fff",
          position: "absolute", top: 2,
          left: checked ? 18 : 2,
          transition: "left 0.15s",
          boxShadow: "0 1px 3px rgba(0,0,0,0.2)",
        }} />
      </button>
    </label>
  );
}

function PlanForm({ initial, onClose, onSaved }: { initial: PlanFormData & { id?: number }; onClose: () => void; onSaved: () => void }) {
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
    width: "100%", padding: "9px 12px", border: "1.5px solid #e2e8f0", borderRadius: 8,
    fontSize: 14, color: "#0f172a", outline: "none", boxSizing: "border-box",
    background: "#fff",
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px 20px", borderBottom: "1px solid #f1f5f9" }}>
        <h2 style={{ margin: 0, fontSize: 16, fontWeight: 600, color: "#0f172a" }}>{initial.id ? "Edit Plan" : "New Plan"}</h2>
        <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", color: "#94a3b8", padding: 4 }} aria-label="Close"><X size={16} /></button>
      </div>

      <div style={{ flex: 1, overflowY: "auto", padding: 20, display: "flex", flexDirection: "column", gap: 16 }}>
        {error && <div role="alert" style={{ background: "#fee2e2", color: "#dc2626", padding: "10px 14px", borderRadius: 8, fontSize: 13 }}>{error}</div>}

        <div>
          <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "#374151", marginBottom: 4 }}>Plan Name <span style={{ color: "#ef4444" }}>*</span></label>
          <input style={inputStyle} value={form.name} onChange={e => set("name", e.target.value)} placeholder="e.g. Starter, Pro" />
        </div>

        <div>
          <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "#374151", marginBottom: 4 }}>Description</label>
          <textarea style={{ ...inputStyle, resize: "none" }} rows={2} value={form.description} onChange={e => set("description", e.target.value)} placeholder="Short plan description" />
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          <div>
            <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "#374151", marginBottom: 4 }}>Price (cents) <span style={{ color: "#ef4444" }}>*</span></label>
            <input type="number" min={0} style={inputStyle} value={form.price_cents} onChange={e => set("price_cents", parseInt(e.target.value || "0", 10))} />
            <p style={{ fontSize: 11, color: "#94a3b8", margin: "4px 0 0" }}>${(form.price_cents / 100).toFixed(2)}</p>
          </div>
          <div>
            <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "#374151", marginBottom: 4 }}>Billing Cycle</label>
            <select style={inputStyle} value={form.billing_cycle} onChange={e => set("billing_cycle", e.target.value as PlanFormData["billing_cycle"])}>
              <option value="monthly">Monthly</option>
              <option value="yearly">Yearly</option>
              <option value="one-time">One-time</option>
            </select>
          </div>
        </div>

        <div>
          <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "#374151", marginBottom: 4 }}>Max Services</label>
          <input type="number" min={1} style={inputStyle} value={form.max_services} onChange={e => set("max_services", parseInt(e.target.value || "1", 10))} />
        </div>

        <div>
          <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "#374151", marginBottom: 4 }}>Stripe Price ID</label>
          <input style={inputStyle} value={form.stripe_price_id} onChange={e => set("stripe_price_id", e.target.value)} placeholder="price_..." />
          <p style={{ fontSize: 11, color: "#94a3b8", margin: "4px 0 0" }}>Leave blank for free plans.</p>
        </div>

        <div style={{ border: "1px solid #f1f5f9", borderRadius: 8, padding: "4px 16px" }}>
          <p style={{ fontSize: 11, fontWeight: 600, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 4, marginTop: 12 }}>Features</p>
          <Toggle label="WhatsApp Chat" checked={form.whatsapp_access} onChange={v => set("whatsapp_access", v)} />
          <Toggle label="Instagram Chat" checked={form.instagram_access} onChange={v => set("instagram_access", v)} />
          <Toggle label="Facebook Chat" checked={form.facebook_access} onChange={v => set("facebook_access", v)} />
          <Toggle label="AI Voice Calls" checked={form.ai_calls_access} onChange={v => set("ai_calls_access", v)} />
        </div>
      </div>

      <div style={{ padding: "16px 20px", borderTop: "1px solid #f1f5f9", display: "flex", gap: 8, justifyContent: "flex-end" }}>
        <button onClick={onClose} style={{ padding: "8px 16px", fontSize: 14, borderRadius: 8, border: "none", background: "#f1f5f9", color: "#475569", cursor: "pointer" }}>Cancel</button>
        <button onClick={handleSave} disabled={saving} style={{ padding: "8px 16px", fontSize: 14, borderRadius: 8, border: "none", background: saving ? "#a78bfa" : "#7c3aed", color: "#fff", fontWeight: 600, cursor: saving ? "not-allowed" : "pointer" }}>
          {saving ? "Saving…" : initial.id ? "Update Plan" : "Create Plan"}
        </button>
      </div>
    </div>
  );
}

export default function PlansPage() {
  const qc = useQueryClient();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editing, setEditing] = useState<(PlanFormData & { id?: number }) | null>(null);

  const { data: plans, isLoading } = useQuery<Plan[]>({
    queryKey: ["superPlans"],
    queryFn: fetchPlans,
    staleTime: 0,
  });

  const toggleMutation = useMutation({
    mutationFn: (plan: Plan) => api.put(`/super-admin/api/plans/${plan.id}`, {
      name: plan.name,
      description: plan.description,
      price_cents: plan.price_cents,
      billing_cycle: plan.billing_cycle,
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
    setDrawerOpen(true);
  }

  function handleNew() { setEditing({ ...BLANK }); setDrawerOpen(true); }

  function handleToggle(plan: Plan) {
    const action = plan.is_active ? "Deactivate" : "Activate";
    if (!confirm(`${action} "${plan.name}"?`)) return;
    toggleMutation.mutate(plan);
  }

  function handleHardDelete(id: number) {
    if (!confirm("Permanently delete this plan? This cannot be undone.")) return;
    hardDeleteMutation.mutate(id);
  }

  return (
    <div className="p-5 bg-slate-50 min-h-full">
      <div className="flex items-center justify-between mb-4">
        <p className="text-[12px] text-slate-400">Manage subscription plans and feature access</p>
        <button
          onClick={handleNew}
          className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-[11px] font-semibold rounded-lg bg-violet-600 text-white hover:bg-violet-700 transition-colors"
        >
          <Plus size={13} /> New Plan
        </button>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map(i => <Skeleton key={i} style={{ height: 208, borderRadius: 12 }} />)}
        </div>
      ) : !plans?.length ? (
        <EmptyState title="No plans yet" description="Create your first subscription plan to allow salon admins to register." action={{ label: "Create Plan", onClick: handleNew }} />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {plans.map(p => <PlanCard key={p.id} plan={p} onEdit={handleEdit} onToggle={handleToggle} onHardDelete={handleHardDelete} />)}
        </div>
      )}

      {drawerOpen && editing && (
        <>
          <div onClick={() => setDrawerOpen(false)} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.3)", zIndex: 40 }} />
          <div style={{ position: "fixed", right: 0, top: 0, height: "100%", width: "100%", maxWidth: 420, background: "#fff", boxShadow: "0 0 40px rgba(0,0,0,0.15)", zIndex: 50, display: "flex", flexDirection: "column" }}>
            <PlanForm
              initial={editing}
              onClose={() => setDrawerOpen(false)}
              onSaved={() => qc.invalidateQueries({ queryKey: ["superPlans"] })}
            />
          </div>
        </>
      )}
    </div>
  );
}
