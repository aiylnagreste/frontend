"use client";

import { useEffect, useState } from "react";
import type { PublicPlan } from "@/lib/types";
import { Check, MessageCircle, Share2, Users, Phone } from "lucide-react";

function PlanCard({ plan, selected, onSelect }: { plan: PublicPlan; selected: boolean; onSelect: () => void }) {
  const price = (plan.price_cents / 100).toFixed(2);
  const isFree = plan.price_cents === 0;
  const cycleLabel = plan.billing_cycle === "monthly" ? "/month" : plan.billing_cycle === "yearly" ? "/year" : "";

  const features = [
    { label: "WhatsApp Chat", active: !!plan.whatsapp_access, icon: <MessageCircle size={14} /> },
    { label: "Instagram Chat", active: !!plan.instagram_access, icon: <Share2 size={14} /> },
    { label: "Facebook Chat", active: !!plan.facebook_access, icon: <Users size={14} /> },
    { label: "AI Voice Calls", active: !!plan.ai_calls_access, icon: <Phone size={14} /> },
    { label: `Up to ${plan.max_services} services`, active: true, icon: <Check size={14} /> },
  ];

  return (
    <div
      onClick={onSelect}
      className={`relative cursor-pointer rounded-xl border-2 p-5 transition-all ${
        selected
          ? "border-violet-500 bg-violet-50 shadow-md"
          : "border-slate-200 bg-white hover:border-violet-300 hover:shadow-sm"
      }`}
    >
      {selected && (
        <div className="absolute top-3 right-3 w-5 h-5 rounded-full bg-violet-600 flex items-center justify-center">
          <Check size={11} color="white" strokeWidth={3} />
        </div>
      )}
      <h3 className="font-semibold text-slate-900 text-base">{plan.name}</h3>
      {plan.description && <p className="text-sm text-slate-500 mt-0.5">{plan.description}</p>}
      <div className="mt-3 text-2xl font-bold text-slate-900">
        {isFree ? "Free" : `$${price}`}
        {!isFree && <span className="text-sm font-normal text-slate-400 ml-1">{cycleLabel}</span>}
      </div>
      <ul className="mt-4 space-y-1.5">
        {features.map(f => (
          <li key={f.label} className={`flex items-center gap-2 text-sm ${f.active ? "text-slate-700" : "text-slate-300 line-through"}`}>
            <span className={f.active ? "text-violet-500" : "text-slate-300"}>{f.icon}</span>
            {f.label}
          </li>
        ))}
      </ul>
    </div>
  );
}

type Step = "plan" | "details" | "processing";

export default function RegisterPage() {
  const [plans, setPlans] = useState<PublicPlan[]>([]);
  const [plansLoading, setPlansLoading] = useState(true);
  const [selectedPlan, setSelectedPlan] = useState<PublicPlan | null>(null);
  const [step, setStep] = useState<Step>("plan");
  const [form, setForm] = useState({ owner_name: "", salon_name: "", email: "", phone: "" });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");

  useEffect(() => {
    fetch("/api/public/plans")
      .then(r => r.json())
      .then((data: PublicPlan[]) => { setPlans(data); setPlansLoading(false); })
      .catch(() => setPlansLoading(false));
  }, []);

  function validateDetails() {
    const e: Record<string, string> = {};
    if (!form.owner_name.trim()) e.owner_name = "Owner name is required";
    if (!form.salon_name.trim()) e.salon_name = "Salon name is required";
    if (!form.email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email))
      e.email = "Valid email is required";
    if (!form.phone.trim()) e.phone = "Phone is required";
    return e;
  }

  async function handleSubmit() {
    const errs = validateDetails();
    if (Object.keys(errs).length) { setErrors(errs); return; }
    setErrors({});
    setSubmitting(true);
    setSubmitError("");

    try {
      const res = await fetch("/api/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, plan_id: selectedPlan!.id }),
      });
      const data = await res.json();
      if (!res.ok) { setSubmitError(data.error || "Registration failed"); setSubmitting(false); return; }

      if (data.checkout_url) {
        window.location.href = data.checkout_url;
      } else if (data.redirect) {
        window.location.href = data.redirect;
      }
    } catch {
      setSubmitError("Network error. Please try again.");
      setSubmitting(false);
    }
  }

  const inputClass =
    "w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-violet-400 focus:ring-1 focus:ring-violet-400 transition-colors";

  return (
    <div className="min-h-screen bg-gradient-to-br from-violet-50 to-indigo-50 flex flex-col items-center py-12 px-4">
      {/* Header */}
      <div className="text-center mb-8">
        <div
          style={{
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            width: 52,
            height: 52,
            borderRadius: 14,
            background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
            marginBottom: 12,
          }}
        >
          <span style={{ fontSize: 24 }}>💅</span>
        </div>
        <h1 className="text-2xl font-bold text-slate-900">Create your SalonBot account</h1>
        <p className="text-slate-500 mt-1.5 text-sm">Choose a plan and get started in minutes</p>
      </div>

      {/* Step indicators */}
      <div className="flex items-center gap-2 mb-8">
        {(["plan", "details"] as Step[]).map((s, i) => (
          <div key={s} className="flex items-center gap-2">
            {i > 0 && <div className="w-8 h-px bg-slate-200" />}
            <div
              className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-semibold transition-colors ${
                step === s
                  ? "bg-violet-600 text-white"
                  : step === "details" && s === "plan"
                  ? "bg-violet-100 text-violet-600"
                  : "bg-slate-100 text-slate-400"
              }`}
            >
              {step === "details" && s === "plan" ? <Check size={12} /> : i + 1}
            </div>
            <span className={`text-xs ${step === s ? "text-slate-900 font-medium" : "text-slate-400"}`}>
              {s === "plan" ? "Choose plan" : "Your details"}
            </span>
          </div>
        ))}
      </div>

      <div className="w-full max-w-3xl">
        {/* Step 1: Plan selection */}
        {step === "plan" && (
          <>
            {plansLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {[1, 2, 3].map(i => (
                  <div key={i} className="h-64 rounded-xl bg-white/60 animate-pulse" />
                ))}
              </div>
            ) : !plans.length ? (
              <div className="text-center text-slate-500 py-12">No plans available at this time.</div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {plans.map(p => (
                  <PlanCard
                    key={p.id}
                    plan={p}
                    selected={selectedPlan?.id === p.id}
                    onSelect={() => setSelectedPlan(p)}
                  />
                ))}
              </div>
            )}

            <div className="mt-6 flex justify-end">
              <button
                disabled={!selectedPlan}
                onClick={() => setStep("details")}
                className="px-6 py-2.5 text-sm rounded-lg bg-violet-600 text-white font-medium hover:bg-violet-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                Continue
              </button>
            </div>
          </>
        )}

        {/* Step 2: Details */}
        {step === "details" && (
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 max-w-md mx-auto">
            <h2 className="font-semibold text-slate-900 mb-1">Your details</h2>
            <p className="text-sm text-slate-500 mb-5">
              Selected: <strong>{selectedPlan?.name}</strong>
              {" · "}
              <button
                onClick={() => setStep("plan")}
                className="text-violet-600 hover:underline text-sm"
              >
                Change
              </button>
            </p>

            {submitError && (
              <div className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg mb-4" role="alert">
                {submitError}
              </div>
            )}

            <div className="space-y-4">
              {([
                { key: "owner_name", label: "Your Name", placeholder: "Jane Smith" },
                { key: "salon_name", label: "Salon Name", placeholder: "Luxe Hair Studio" },
                { key: "email", label: "Email Address", placeholder: "jane@example.com", type: "email" },
                { key: "phone", label: "Phone Number", placeholder: "+1 555 000 0000", type: "tel" },
              ] as const).map(f => (
                <div key={f.key}>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    {f.label} <span className="text-red-500">*</span>
                  </label>
                  <input
                    type={f.type || "text"}
                    className={`${inputClass} ${errors[f.key] ? "border-red-400 focus:border-red-400 focus:ring-red-400" : ""}`}
                    placeholder={f.placeholder}
                    value={form[f.key]}
                    onChange={e => setForm(prev => ({ ...prev, [f.key]: e.target.value }))}
                  />
                  {errors[f.key] && (
                    <p className="text-xs text-red-500 mt-1" role="alert">{errors[f.key]}</p>
                  )}
                </div>
              ))}
            </div>

            <div className="mt-6 flex gap-3">
              <button
                onClick={() => setStep("plan")}
                className="px-4 py-2.5 text-sm rounded-lg text-slate-600 hover:bg-slate-100 transition-colors"
              >
                Back
              </button>
              <button
                onClick={handleSubmit}
                disabled={submitting}
                className="flex-1 py-2.5 text-sm rounded-lg bg-violet-600 text-white font-medium hover:bg-violet-700 disabled:opacity-50 transition-colors"
              >
                {submitting
                  ? "Redirecting to payment…"
                  : selectedPlan?.price_cents === 0
                  ? "Create Free Account"
                  : `Pay $${((selectedPlan?.price_cents || 0) / 100).toFixed(2)} & Register`}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
