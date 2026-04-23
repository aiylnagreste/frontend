"use client";

import { useEffect, useState } from "react";
import type { PublicPlan } from "@/lib/types";
import { Check, MessageCircle, Share2, Users, Phone, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { validatePhoneRequired } from "@/lib/validation";

const T = {
  primary: "#0D9488",
  primaryDark: "#0F766E",
  primaryLight: "#CCFBF1",
  accent: "#E8913A",
  accentLight: "#FEF3C7",
  bg: "#F4F3EF",
  surface: "#FFFFFF",
  text: "#1A1D23",
  text2: "#5F6577",
  text3: "#9CA3B4",
  border: "#E6E4DF",
  border2: "#F0EEEA",
  dark: "#111318",
};

function PlanCard({ plan, selected, onSelect }: { plan: PublicPlan; selected: boolean; onSelect: () => void }) {
  const price = (plan.price_cents / 100).toFixed(2);
  const isFree = plan.price_cents === 0;
  const cycleLabel = plan.billing_cycle === "monthly" ? "/month" : plan.billing_cycle === "yearly" ? "/year" : "";

  const features = [
    { label: `Up to ${plan.max_services} services`, active: true, icon: <Check size={13} strokeWidth={3} /> },
    { label: "WhatsApp Chat", active: !!plan.whatsapp_access, icon: <MessageCircle size={13} /> },
    { label: "Instagram Chat", active: !!plan.instagram_access, icon: <Share2 size={13} /> },
    { label: "Facebook Chat", active: !!plan.facebook_access, icon: <Users size={13} /> },
    { label: "AI Voice Calls", active: !!plan.ai_calls_access, icon: <Phone size={13} /> },
  ];

  return (
    <div
      onClick={onSelect}
      style={{
        position: "relative",
        cursor: "pointer",
        borderRadius: 16,
        padding: selected ? "24px 22px" : "20px 22px",
        background: T.surface,
        border: selected ? `2px solid ${T.primary}` : `1.5px solid ${T.border}`,
        boxShadow: selected ? `0 8px 28px rgba(13,148,136,0.12)` : "none",
        transition: "all 0.2s",
      }}
    >
      {selected && (
        <div style={{
          position: "absolute", top: 12, right: 12,
          width: 20, height: 20, borderRadius: "50%",
          background: `linear-gradient(135deg, ${T.primary}, ${T.accent})`,
          display: "flex", alignItems: "center", justifyContent: "center",
        }}>
          <Check size={10} color="#fff" strokeWidth={3} />
        </div>
      )}
      <h3 style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 15, fontWeight: 600, color: T.text, marginBottom: 4 }}>{plan.name}</h3>
      {plan.description && <p style={{ fontSize: 12, color: T.text2, marginBottom: 12 }}>{plan.description}</p>}
      <div style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 28, fontWeight: 700, color: T.text, marginBottom: 16 }}>
        {isFree ? "Free" : `$${price}`}
        {!isFree && <span style={{ fontSize: 12, fontWeight: 400, color: T.text3, marginLeft: 4 }}>{cycleLabel}</span>}
      </div>
      <ul style={{ listStyle: "none", display: "flex", flexDirection: "column", gap: 8 }}>
        {features.map(f => (
          <li key={f.label} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, color: f.active ? T.text2 : T.text3 }}>
            <span style={{ color: f.active ? T.primary : T.text3, flexShrink: 0 }}>
              {f.active ? f.icon : <span style={{ display: "inline-block", width: 13 }} />}
            </span>
            <span style={{ textDecoration: f.active ? "none" : "line-through" }}>{f.label}</span>
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
  
  // Owner name validation: only letters and spaces
  const ownerNameRegex = /^[A-Za-z\s]+$/;
  if (!form.owner_name.trim()) {
    e.owner_name = "Owner name is required";
  } else if (!ownerNameRegex.test(form.owner_name.trim())) {
    e.owner_name = "Owner name cannot contain numbers or special characters";
  }
  
  // Salon name validation: only letters, spaces, and basic punctuation
  const salonNameRegex = /^[A-Za-z\s&']+$/;
  if (!form.salon_name.trim()) {
    e.salon_name = "Salon name is required";
  } else if (!salonNameRegex.test(form.salon_name.trim())) {
    e.salon_name = "Salon name cannot contain numbers";
  }
  
  // Email validation
  if (!form.email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
    e.email = "Valid email is required";
  }
  
  // Phone validation: shared E.164-compatible helper (8–15 digits, optional leading '+')
  const phoneErr = validatePhoneRequired(form.phone);
  if (phoneErr) e.phone = phoneErr;
  
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

  const inputStyle: React.CSSProperties = {
    width: "100%", borderRadius: 10,
    border: `1px solid ${T.border}`,
    padding: "10px 14px",
    fontSize: 13, color: T.text,
    background: T.surface,
    outline: "none",
    fontFamily: "'DM Sans', sans-serif",
    boxSizing: "border-box",
    transition: "border-color 0.2s",
  };

  const inputErrorStyle: React.CSSProperties = {
    ...inputStyle,
    border: `1px solid #F87171`,
  };

  return (
    <div style={{ minHeight: "100vh", background: T.bg, fontFamily: "'DM Sans', sans-serif" }}>
      {/* Nav */}
      <nav style={{
        position: "sticky", top: 0, zIndex: 50,
        background: "rgba(255,255,255,0.92)", backdropFilter: "blur(12px)",
        borderBottom: `1px solid ${T.border}`,
      }}>
        <div style={{ maxWidth: 1200, margin: "0 auto", padding: "0 24px", height: 60, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <Link href="/" style={{ display: "flex", alignItems: "center", gap: 8, textDecoration: "none", color: T.text2, fontSize: 13, fontWeight: 500 }}>
            <ArrowLeft size={16} />
            Back to Home
          </Link>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{
              width: 28, height: 28, borderRadius: 8,
              background: `linear-gradient(135deg, ${T.primary}, ${T.accent})`,
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 13, color: "#fff", fontWeight: 700,
              boxShadow: `0 4px 12px rgba(13,148,136,0.25)`,
            }}>G</div>
            <span style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 15, fontWeight: 700, color: T.text, letterSpacing: "-0.02em" }}>GlowDesk</span>
          </div>
        </div>
      </nav>

      <div style={{ maxWidth: 1100, margin: "0 auto", padding: "64px 24px" }}>
        {/* Header */}
        <div style={{ textAlign: "center", marginBottom: 40 }}>
          {/* <div style={{
            display: "inline-flex", alignItems: "center", justifyContent: "center",
            width: 56, height: 56, borderRadius: 16,
            background: T.surface, border: `1px solid ${T.border2}`,
            fontSize: 26, marginBottom: 16,
            boxShadow: `0 4px 12px rgba(0,0,0,0.06)`,
          }}>💅</div> */}
          <h1 style={{
            fontFamily: "'Space Grotesk', sans-serif",
            fontSize: "clamp(28px, 5vw, 40px)", fontWeight: 700,
            color: T.text, letterSpacing: "-0.03em",
            lineHeight: 1.2, marginBottom: 12,
          }}>
            Start your{" "}
            <span style={{ background: `linear-gradient(135deg, ${T.primary}, ${T.accent})`, WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
              AI-powered
            </span>{" "}
            journey
          </h1>
          <p style={{ fontSize: 15, color: T.text2, maxWidth: 480, margin: "0 auto", lineHeight: 1.6 }}>
            Choose a plan that fits your salon. Get started in minutes, no credit card required for free plan.
          </p>
        </div>

        {/* Step indicators */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, marginBottom: 40 }}>
          {(["plan", "details"] as Step[]).map((s, i) => (
            <div key={s} style={{ display: "flex", alignItems: "center", gap: 8 }}>
              {i > 0 && <div style={{ width: 32, height: 1, background: T.border }} />}
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
                <div style={{
                  width: 28, height: 28, borderRadius: "50%",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 11, fontWeight: 600,
                  background: step === s
                    ? `linear-gradient(135deg, ${T.primary}, ${T.accent})`
                    : (step === "details" && s === "plan") ? T.primaryLight : T.border2,
                  color: step === s ? "#fff" : (step === "details" && s === "plan") ? T.primary : T.text3,
                  transition: "all 0.2s",
                }}>
                  {step === "details" && s === "plan" ? <Check size={12} /> : i + 1}
                </div>
                <span style={{
                  fontSize: 11, fontWeight: step === s ? 600 : 400,
                  color: step === s ? T.text : T.text3,
                }}>
                  {s === "plan" ? "Select Plan" : "Your Details"}
                </span>
              </div>
            </div>
          ))}
        </div>

        {/* Trust badges */}
        <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "center", gap: 24, marginBottom: 40 }}>
          {[
            { icon: "M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z", label: "Secure payment" },
            { icon: "M13 2L3 14h8l-2 8 10-12h-8l2-8z", label: "Instant setup" },
            { icon: "M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2 M9 7a4 4 0 1 0 0-8 4 4 0 0 0 0 8z", label: "24/7 support" },
          ].map(b => (
            <div key={b.label} style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 11, color: T.text3 }}>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d={b.icon} />
              </svg>
              {b.label}
            </div>
          ))}
        </div>

        <div style={{ maxWidth: 900, margin: "0 auto" }}>
          {/* Step 1: Plan selection */}
          {step === "plan" && (
            <>
              {plansLoading ? (
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 16 }}>
                  {[1, 2, 3].map(i => (
                    <div key={i} style={{ height: 260, borderRadius: 16, background: "rgba(255,255,255,0.6)", animation: "pulse 1.5s infinite" }} />
                  ))}
                </div>
              ) : !plans.length ? (
                <div style={{ textAlign: "center", color: T.text3, padding: "48px 0", fontSize: 14 }}>No plans available at this time.</div>
              ) : (
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 16 }}>
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

              <div style={{ marginTop: 24, display: "flex", justifyContent: "flex-end" }}>
                <button
                  disabled={!selectedPlan}
                  onClick={() => setStep("details")}
                  style={{
                    padding: "11px 24px", borderRadius: 99,
                    fontSize: 13, fontWeight: 600, color: "#fff",
                    background: selectedPlan ? `linear-gradient(135deg, ${T.primary}, ${T.accent})` : T.border,
                    border: "none", cursor: selectedPlan ? "pointer" : "not-allowed",
                    opacity: selectedPlan ? 1 : 0.5,
                    boxShadow: selectedPlan ? `0 6px 18px rgba(13,148,136,0.2)` : "none",
                    transition: "all 0.2s",
                  }}
                >
                  Continue with {selectedPlan?.name || "selected plan"}
                </button>
              </div>
            </>
          )}

          {/* Step 2: Details */}
          {step === "details" && (
            <div style={{
              background: T.surface, borderRadius: 20,
              border: `1px solid ${T.border2}`,
              padding: 28, maxWidth: 440, margin: "0 auto",
              boxShadow: `0 4px 20px rgba(0,0,0,0.05)`,
            }}>
              <div style={{ textAlign: "center", marginBottom: 20 }}>
                <h2 style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 17, fontWeight: 600, color: T.text, marginBottom: 4 }}>
                  Complete your registration
                </h2>
                <p style={{ fontSize: 13, color: T.text2 }}>Fill in your details to get started</p>
              </div>

              <div style={{ marginBottom: 16, paddingBottom: 14, borderBottom: `1px solid ${T.border2}`, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontSize: 13, color: T.text2 }}>Selected plan:</span>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <span style={{ fontSize: 13, fontWeight: 600, color: T.text }}>{selectedPlan?.name}</span>
                  <button
                    onClick={() => setStep("plan")}
                    style={{ fontSize: 11, color: T.primary, background: "none", border: "none", cursor: "pointer", fontWeight: 500 }}
                  >
                    Change
                  </button>
                </div>
              </div>

              {submitError && (
                <div style={{
                  fontSize: 13, color: "#DC2626", background: "#FEF2F2",
                  border: "1px solid #FECACA", borderRadius: 10,
                  padding: "10px 14px", marginBottom: 16,
                }} role="alert">
                  {submitError}
                </div>
              )}

              <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                {([
                  { key: "owner_name", label: "Your Name", placeholder: "Jane Smith" },
                  { key: "salon_name", label: "Salon Name", placeholder: "Luxe Hair Studio" },
                  { key: "email", label: "Email Address", placeholder: "jane@example.com", type: "email" },
                  { key: "phone", label: "Phone Number", placeholder: "+1 555 000 0000", type: "tel" },
                ] as const).map(f => (
                  <div key={f.key}>
                    <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: T.text2, marginBottom: 6 }}>
                      {f.label} <span style={{ color: "#EF4444" }}>*</span>
                    </label>
                    <input
                      type={"type" in f ? f.type : "text"}
                      inputMode={f.key === "phone" ? "tel" : undefined}
                      maxLength={f.key === "phone" ? 20 : undefined}
                      style={errors[f.key] ? inputErrorStyle : inputStyle}
                      placeholder={f.placeholder}
                      value={form[f.key]}
                      onChange={e => setForm(prev => ({ ...prev, [f.key]: e.target.value }))}
                      onFocus={e => { e.currentTarget.style.borderColor = errors[f.key] ? "#F87171" : T.primary; }}
                      onBlur={e => {
                        if (f.key === "phone") {
                          const err = validatePhoneRequired(form.phone);
                          setErrors(prev => ({ ...prev, phone: err || "" }));
                          e.currentTarget.style.borderColor = err ? "#F87171" : T.border;
                        } else {
                          e.currentTarget.style.borderColor = errors[f.key] ? "#F87171" : T.border;
                        }
                      }}
                    />
                    {errors[f.key] && (
                      <p style={{ fontSize: 11, color: "#EF4444", marginTop: 4 }} role="alert">{errors[f.key]}</p>
                    )}
                  </div>
                ))}
              </div>

              <div style={{ marginTop: 24, display: "flex", gap: 10 }}>
                <button
                  onClick={() => setStep("plan")}
                  style={{
                    padding: "10px 18px", borderRadius: 10,
                    fontSize: 13, fontWeight: 500, color: T.text2,
                    background: T.bg, border: `1.5px solid ${T.border}`,
                    cursor: "pointer",
                  }}
                >
                  Back
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={submitting}
                  style={{
                    flex: 1, padding: "10px 0", borderRadius: 10,
                    fontSize: 13, fontWeight: 600, color: "#fff",
                    background: `linear-gradient(135deg, ${T.primary}, ${T.accent})`,
                    border: "none", cursor: submitting ? "not-allowed" : "pointer",
                    opacity: submitting ? 0.6 : 1,
                    boxShadow: `0 6px 18px rgba(13,148,136,0.2)`,
                    transition: "opacity 0.2s",
                  }}
                >
                  {submitting
                    ? "Redirecting to payment..."
                    : selectedPlan?.price_cents === 0
                    ? "Create Free Account"
                    : `Pay $${((selectedPlan?.price_cents || 0) / 100).toFixed(2)} & Register`}
                </button>
              </div>

              <p style={{ fontSize: 11, textAlign: "center", color: T.text3, marginTop: 16 }}>
                By registering, you agree to our Terms of Service and Privacy Policy.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Footer */}
      <footer style={{ background: "#0A0C10", padding: "24px" }}>
        <div style={{ maxWidth: 1200, margin: "0 auto", display: "flex", flexWrap: "wrap", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
          <div style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 13, fontWeight: 700, color: "rgba(255,255,255,0.4)" }}>GlowDesk</div>
          <div style={{ fontSize: 11, color: "rgba(255,255,255,0.15)" }}>© 2025 GlowDesk. All rights reserved.</div>
        </div>
      </footer>
    </div>
  );
}
