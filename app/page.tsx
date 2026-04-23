"use client";

import { useEffect, useState, useRef } from "react";
import Link from "next/link";
import { Check, X, ChevronDown, ChevronUp, MessageCircle, Share2, Users, Phone, Moon, Sun } from "lucide-react";
import type { PublicPlan } from "@/lib/types";
import { validatePhoneRequired } from "@/lib/validation";

// ── Design tokens (light/dark theme) ─────────────────────────────────────────
const lightTheme = {
  bg:           "#F8F9FA",
  bgAlt:        "#FFFFFF",
  surface:      "#FFFFFF",
  surfaceHigh:  "#F1F3F5",
  border:       "rgba(0,0,0,0.08)",
  borderFocus:  "#B5484B",
  text:         "#1A1D23",
  text2:        "#5A626E",
  text3:        "#9AA0AC",
  rose:         "#B5484B",
  roseDark:     "#8B3A3D",
  roseLight:    "rgba(181,72,75,0.08)",
  roseBorder:   "rgba(181,72,75,0.25)",
  gold:         "#B8860B",
  green:        "#2E7D32",
  white:        "#FFFFFF",
  cardShadow:   "0 4px 14px rgba(0,0,0,0.05)",
  modalBg:      "#FFFFFF",
  inputBg:      "#F8F9FA",
  inputBorder:  "#E9ECEF",
};

const darkTheme = {
  bg:           "#0F1115",
  bgAlt:        "#131620",
  surface:      "#191D26",
  surfaceHigh:  "#1E2330",
  border:       "rgba(255,255,255,0.07)",
  borderFocus:  "#B5484B",
  text:         "#EDE8E3",
  text2:        "#8E8A86",
  text3:        "#4E4A46",
  rose:         "#B5484B",
  roseDark:     "#6B3057",
  roseLight:    "rgba(181,72,75,0.12)",
  roseBorder:   "rgba(181,72,75,0.3)",
  gold:         "#C9A070",
  green:        "#7B9A70",
  white:        "#FFFFFF",
  cardShadow:   "none",
  modalBg:      "#1A1E28",
  inputBg:      "#0F1115",
  inputBorder:  "rgba(255,255,255,0.08)",
};

// ── Theme Context ─────────────────────────────────────────────────────────────
function useTheme() {
  const [theme, setTheme] = useState<"light" | "dark">("dark");
  
  useEffect(() => {
    const saved = localStorage.getItem("salonbot-theme") as "light" | "dark" | null;
    if (saved) setTheme(saved);
    else if (window.matchMedia("(prefers-color-scheme: light)").matches) setTheme("light");
  }, []);
  
  const toggleTheme = () => {
    const newTheme = theme === "light" ? "dark" : "light";
    setTheme(newTheme);
    localStorage.setItem("salonbot-theme", newTheme);
  };
  
  const T = theme === "light" ? lightTheme : darkTheme;
  return { theme, T, toggleTheme };
}

// ── Register Modal (Direct to details with selected plan) ─────────────────────
function RegisterModal({ 
  plans, 
  onClose, 
  theme, 
  preselectedPlan 
}: { 
  plans: PublicPlan[]; 
  onClose: () => void; 
  theme: "light" | "dark";
  preselectedPlan: PublicPlan | null;
}) {
  const [selectedPlan, setSelectedPlan] = useState<PublicPlan | null>(preselectedPlan);
  const [form, setForm] = useState({ owner_name: "", salon_name: "", email: "", phone: "" });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [showPlanSelector, setShowPlanSelector] = useState(!preselectedPlan);
  const overlayRef = useRef<HTMLDivElement>(null);
  
  const T = theme === "light" ? lightTheme : darkTheme;

  function handleOverlayClick(e: React.MouseEvent) {
    if (e.target === overlayRef.current) onClose();
  }

  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = ""; };
  }, []);

  function validate() {
    const e: Record<string, string> = {};
    if (!form.owner_name.trim()) e.owner_name = "Required";
    else if (!/^[A-Za-z\s]+$/.test(form.owner_name.trim())) e.owner_name = "Letters only";
    if (!form.salon_name.trim()) e.salon_name = "Required";
    if (!form.email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) e.email = "Valid email required";
    const phoneErr = validatePhoneRequired(form.phone);
    if (phoneErr) e.phone = phoneErr;
    return e;
  }

  async function handleSubmit() {
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }
    if (!selectedPlan) { setSubmitError("Please select a plan"); return; }
    setErrors({});
    setSubmitting(true);
    setSubmitError("");
    try {
      const res  = await fetch("/api/register", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ ...form, plan_id: selectedPlan.id }),
      });
      const data = await res.json();
      if (!res.ok) { setSubmitError(data.error || "Registration failed."); setSubmitting(false); return; }
      if (data.checkout_url) window.location.href = data.checkout_url;
      else if (data.redirect) window.location.href = data.redirect;
    } catch {
      setSubmitError("Network error. Please try again.");
      setSubmitting(false);
    }
  }

  const isFree = (p: PublicPlan) => p.price_cents === 0;
  const cycleLabel = (p: PublicPlan) => p.billing_cycle === "monthly" ? "/mo" : p.billing_cycle === "yearly" ? "/yr" : "";

  const modalBgColor = theme === "light" ? "#FFFFFF" : "#1E2330";
  const textColor = theme === "light" ? "#1A1D23" : "#EDE8E3";
  const textMuted = theme === "light" ? "#5A626E" : "#8E8A86";
  const borderColor = theme === "light" ? "#E9ECEF" : "rgba(255,255,255,0.08)";
  const inputBgColor = theme === "light" ? "#F8F9FA" : "#0F1115";

  return (
    <div
      ref={overlayRef}
      onClick={handleOverlayClick}
      style={{
        position: "fixed", inset: 0, zIndex: 200,
        background: "rgba(0,0,0,0.85)",
        backdropFilter: "blur(8px)",
        display: "flex", alignItems: "center", justifyContent: "center",
        padding: 20,
      }}
    >
      <div style={{
        background: modalBgColor,
        borderRadius: 24,
        width: "100%",
        maxWidth: showPlanSelector ? 860 : 480,
        maxHeight: "90vh",
        overflowY: "auto",
        boxShadow: "0 24px 80px rgba(0,0,0,0.5)",
        fontFamily: "'DM Sans', sans-serif",
        transition: "max-width 0.3s ease",
      }}>
        {/* Modal header */}
        <div style={{
          display: "flex", alignItems: "center", justifyContent: "space-between",
          padding: "20px 24px",
          borderBottom: `1px solid ${borderColor}`,
          position: "sticky", top: 0, background: modalBgColor, zIndex: 10, borderRadius: "24px 24px 0 0",
        }}>
          <div>
            <h2 style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 18, fontWeight: 700, color: textColor, margin: 0 }}>
              {showPlanSelector ? "Choose your plan" : "Complete registration"}
            </h2>
            <p style={{ fontSize: 13, color: textMuted, margin: "4px 0 0" }}>
              {showPlanSelector 
                ? "All plans include core booking features" 
                : `Selected: ${selectedPlan?.name}`}
            </p>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
            <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", color: textMuted, padding: 4, display: "flex", borderRadius: 8 }}>
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Plan Selector Step */}
        {showPlanSelector && (
          <div style={{ padding: 28 }}>
            {plans.length === 0 ? (
              <div style={{ textAlign: "center", color: textMuted, padding: "48px 0", fontSize: 14 }}>Loading plans…</div>
            ) : (
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 16 }}>
                {plans.map((p) => {
                  const isSelected = selectedPlan?.id === p.id;
                  const channelFeatures = [
                    { label: "WhatsApp", active: !!p.whatsapp_access,  icon: <MessageCircle size={12} /> },
                    { label: "Instagram", active: !!p.instagram_access, icon: <Share2 size={12} /> },
                    { label: "Facebook", active: !!p.facebook_access,   icon: <Users size={12} /> },
                    { label: "AI Calls", active: !!p.ai_calls_access,   icon: <Phone size={12} /> },
                  ];
                  return (
                    <div
                      key={p.id}
                      onClick={() => setSelectedPlan(p)}
                      style={{
                        position:  "relative",
                        cursor:    "pointer",
                        borderRadius: 16,
                        padding:   "20px 18px",
                        background: theme === "light" ? "#FFFFFF" : "#262B37",
                        border:    isSelected ? `2px solid #B5484B` : `1px solid ${borderColor}`,
                        boxShadow: isSelected ? "0 8px 20px rgba(181,72,75,0.15)" : "none",
                        transition:"all 0.2s",
                      }}
                    >
                      {isSelected && (
                        <div style={{
                          position: "absolute", top: 12, right: 12,
                          width: 22, height: 22, borderRadius: "50%",
                          background: "linear-gradient(135deg, #B5484B, #8B3A3D)",
                          display: "flex", alignItems: "center", justifyContent: "center",
                        }}>
                          <Check size={12} color="#fff" strokeWidth={3} />
                        </div>
                      )}
                      <div style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 16, fontWeight: 700, color: textColor, marginBottom: 6 }}>{p.name}</div>
                      {p.description && <div style={{ fontSize: 12, color: textMuted, marginBottom: 14, lineHeight: 1.5 }}>{p.description}</div>}
                      <div style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 28, fontWeight: 700, color: textColor, marginBottom: 16, lineHeight: 1 }}>
                        {isFree(p) ? "Free" : `$${(p.price_cents / 100).toFixed(0)}`}
                        {!isFree(p) && <span style={{ fontSize: 13, fontWeight: 400, color: textMuted, marginLeft: 6 }}>{cycleLabel(p)}</span>}
                      </div>
                      <ul style={{ listStyle: "none", display: "flex", flexDirection: "column", gap: 8, margin: 0, padding: 0 }}>
                        <li style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12, color: textMuted }}>
                          <Check size={12} color="#2E7D32" strokeWidth={3} />
                          Up to {p.max_services} services
                        </li>
                        {channelFeatures.map(f => (
                          <li key={f.label} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12, color: f.active ? textMuted : (theme === "light" ? "#C0C4CC" : "#4A4F5A") }}>
                            <span style={{ color: f.active ? "#B5484B" : (theme === "light" ? "#D1D5DB" : "#3A3F4A"), flexShrink: 0 }}>
                              {f.active ? f.icon : <span style={{ display: "inline-block", width: 12 }} />}
                            </span>
                            <span style={{ textDecoration: f.active ? "none" : "line-through" }}>{f.label}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  );
                })}
              </div>
            )}
            <div style={{ marginTop: 28, display: "flex", justifyContent: "flex-end" }}>
              <button
                disabled={!selectedPlan}
                onClick={() => selectedPlan && setShowPlanSelector(false)}
                style={{
                  background: "linear-gradient(135deg, #B5484B, #8B3A3D)",
                  color: "#fff",
                  border: "none",
                  padding: "12px 28px",
                  borderRadius: 40,
                  fontSize: 14,
                  fontWeight: 600,
                  cursor: selectedPlan ? "pointer" : "not-allowed",
                  opacity: selectedPlan ? 1 : 0.5,
                  fontFamily: "inherit",
                  transition: "all 0.2s",
                }}
              >
                Continue with {selectedPlan?.name || "a plan"} →
              </button>
            </div>
          </div>
        )}

        {/* Registration Details Step */}
        {!showPlanSelector && selectedPlan && (
          <div style={{ padding: "28px 32px 32px" }}>
            <div style={{
              background: theme === "light" ? "#F1F3F5" : "#262B37",
              borderRadius: 12,
              padding: "12px 16px",
              marginBottom: 24,
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}>
              <div>
                <div style={{ fontSize: 13, fontWeight: 600, color: textColor }}>{selectedPlan.name}</div>
                <div style={{ fontSize: 12, color: textMuted }}>
                  {isFree(selectedPlan) ? "Free forever" : `$${(selectedPlan.price_cents / 100).toFixed(0)}${cycleLabel(selectedPlan)}`}
                </div>
              </div>
              <button
                onClick={() => setShowPlanSelector(true)}
                style={{
                  background: "none",
                  border: `1px solid ${borderColor}`,
                  borderRadius: 40,
                  padding: "6px 14px",
                  fontSize: 11,
                  fontWeight: 500,
                  color: textMuted,
                  cursor: "pointer",
                  fontFamily: "inherit",
                }}
              >
                Change plan
              </button>
            </div>

            {submitError && (
              <div style={{
                fontSize: 13, color: "#DC2626", background: "#FEF2F2",
                border: "1px solid #FECACA", borderRadius: 12,
                padding: "12px 16px", marginBottom: 20,
              }}>
                {submitError}
              </div>
            )}
            <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
              {([
                { key: "owner_name", label: "Your Name",     placeholder: "Jane Smith" },
                { key: "salon_name", label: "Salon Name",    placeholder: "Luxe Hair Studio" },
                { key: "email",      label: "Email Address", placeholder: "jane@example.com", type: "email" },
                { key: "phone",      label: "Phone Number",  placeholder: "+1 555 000 0000",   type: "tel" },
              ] as const).map(f => (
                <div key={f.key}>
                  <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: textMuted, marginBottom: 6, letterSpacing: "0.03em" }}>
                    {f.label} <span style={{ color: "#EF4444" }}>*</span>
                  </label>
                  <input
                    type={"type" in f ? f.type : "text"}
                    inputMode={f.key === "phone" ? "tel" : undefined}
                    maxLength={f.key === "phone" ? 20 : undefined}
                    style={{
                      width: "100%",
                      padding: "12px 16px",
                      background: inputBgColor,
                      border: `1.5px solid ${errors[f.key] ? "#F87171" : borderColor}`,
                      borderRadius: 12,
                      fontSize: 14,
                      color: textColor,
                      outline: "none",
                      fontFamily: "inherit",
                      transition: "all 0.2s",
                    }}
                    placeholder={f.placeholder}
                    value={form[f.key]}
                    onChange={e => setForm(p => ({ ...p, [f.key]: e.target.value }))}
                    onFocus={e => { e.currentTarget.style.borderColor = "#B5484B"; e.currentTarget.style.boxShadow = "0 0 0 3px rgba(181,72,75,0.1)"; }}
                    onBlur={e => {
                      if (f.key === "phone") {
                        const err = validatePhoneRequired(form.phone);
                        setErrors(prev => ({ ...prev, phone: err || "" }));
                        e.currentTarget.style.borderColor = err ? "#F87171" : borderColor;
                      } else {
                        e.currentTarget.style.borderColor = errors[f.key] ? "#F87171" : borderColor;
                      }
                      e.currentTarget.style.boxShadow = "none";
                    }}
                  />
                  {errors[f.key] && <p style={{ fontSize: 11, color: "#EF4444", marginTop: 4 }}>{errors[f.key]}</p>}
                </div>
              ))}
            </div>
            <div style={{ marginTop: 28 }}>
              <button
                onClick={handleSubmit}
                disabled={submitting}
                style={{
                  width: "100%",
                  background: "linear-gradient(135deg, #B5484B, #8B3A3D)",
                  color: "#fff",
                  border: "none",
                  padding: "14px 0",
                  borderRadius: 40,
                  fontSize: 15,
                  fontWeight: 600,
                  cursor: submitting ? "not-allowed" : "pointer",
                  opacity: submitting ? 0.6 : 1,
                  fontFamily: "inherit",
                }}
              >
                {submitting
                  ? "Redirecting…"
                  : selectedPlan.price_cents === 0
                  ? "Create Free Account"
                  : `Pay $${(selectedPlan.price_cents / 100).toFixed(0)} & Register`}
              </button>
            </div>
            <p style={{ textAlign: "center", fontSize: 11, color: textMuted, marginTop: 18 }}>
              By registering you agree to our Terms & Privacy Policy
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Navbar ─────────────────────────────────────────────────────────────────────
function Navbar({ onRegister, theme, toggleTheme }: { onRegister: () => void; theme: "light" | "dark"; toggleTheme: () => void }) {
  const [scrolled, setScrolled] = useState(false);
  const T = theme === "light" ? lightTheme : darkTheme;
  
  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 40);
    window.addEventListener("scroll", fn, { passive: true });
    return () => window.removeEventListener("scroll", fn);
  }, []);

  return (
    <nav style={{
      position:      "fixed", top: 0, left: 0, right: 0, zIndex: 100,
      height:        64,
      display:       "flex", alignItems: "center", justifyContent: "space-between",
      padding:       "0 5%",
      background:    scrolled ? (theme === "light" ? "rgba(248,249,250,0.95)" : "rgba(15,17,21,0.95)") : "transparent",
      backdropFilter: scrolled ? "blur(16px)" : "none",
      borderBottom:  scrolled ? `1px solid ${T.border}` : "none",
      transition:    "all 0.3s ease",
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <div style={{ width: 32, height: 32, borderRadius: 8, background: "linear-gradient(135deg, #B5484B, #8B3A3D)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14 }}>✨</div>
        <span style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 18, fontWeight: 700, color: T.text, letterSpacing: "-0.02em" }}>Salon</span>
      </div>

      <div style={{ display: "flex", gap: 32, alignItems: "center" }}>
        {[["Features","#features"],["Booking","#booking"],["Pricing","#pricing"],["FAQ","#faq"]].map(([label, href]) => (
          <a key={label} href={href} style={{ fontSize: 13, fontWeight: 500, color: T.text2, textDecoration: "none", transition: "color 0.2s" }}
            onMouseEnter={e => (e.currentTarget.style.color = T.text)}
            onMouseLeave={e => (e.currentTarget.style.color = T.text2)}
          >{label}</a>
        ))}
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <button
          onClick={toggleTheme}
          style={{
            background: T.surface,
            border: `1px solid ${T.border}`,
            borderRadius: 40,
            padding: "8px 12px",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            gap: 6,
            fontSize: 13,
            fontWeight: 500,
            color: T.text2,
            fontFamily: "inherit",
          }}
        >
          {theme === "light" ? <Moon size={14} /> : <Sun size={14} />}
          {theme === "light" ? "Dark" : "Light"}
        </button>
        <Link href="/login" style={{ fontSize: 13, fontWeight: 500, color: T.text2, textDecoration: "none" }}>Login</Link>
        <button onClick={onRegister} style={{
          background: "linear-gradient(135deg, #B5484B, #8B3A3D)",
          color: "#fff",
          border: "none",
          padding: "9px 22px",
          borderRadius: 40,
          fontSize: 13,
          fontWeight: 600,
          cursor: "pointer",
          fontFamily: "inherit",
        }}>
          Get Started
        </button>
      </div>
    </nav>
  );
}

// ── Hero Section ──────────────────────────────────────────────────────────────
function HeroSection({ onRegister, theme }: { onRegister: () => void; theme: "light" | "dark" }) {
  const T = theme === "light" ? lightTheme : darkTheme;
  return (
    <section style={{
      position:   "relative",
      minHeight:  "100vh",
      display:    "flex",
      alignItems: "center",
      padding:    "100px 5% 80px",
      background: theme === "light" 
        ? "linear-gradient(160deg, #F8F9FA 0%, #FFFFFF 40%, #F1F3F5 70%, #F8F9FA 100%)"
        : "linear-gradient(160deg, #0F1115 0%, #131820 40%, #161A24 70%, #0F1115 100%)",
      overflow:   "hidden",
    }}>
      <div style={{ position: "absolute", top: "20%", left: "5%", width: 500, height: 500, background: `radial-gradient(ellipse, ${theme === "light" ? "rgba(181,72,75,0.04)" : "rgba(181,72,75,0.07)"} 0%, transparent 70%)`, pointerEvents: "none" }} />
      
      <div style={{ maxWidth: 1200, margin: "0 auto", width: "100%", display: "grid", gridTemplateColumns: "1fr 1fr", gap: 80, alignItems: "center", position: "relative", zIndex: 1 }}>
        <div>
          <div style={{ marginBottom: 20 }}>
            <span style={{ fontSize: 11, letterSpacing: "0.15em", textTransform: "uppercase", color: T.rose, fontWeight: 600, background: T.roseLight, border: `1px solid ${T.roseBorder}`, padding: "5px 14px", borderRadius: 100 }}>
              Salon Management Platform
            </span>
          </div>
          <h1 style={{
            fontFamily:   "'Cormorant Garamond', serif",
            fontSize:     "clamp(48px, 6vw, 76px)",
            fontWeight:   500,
            lineHeight:   1.05,
            marginBottom: 22,
            color:        T.text,
            letterSpacing:"-0.01em",
          }}>
            Your Salon.<br />
            <span style={{ background: "linear-gradient(135deg, #E8D5C8, #C9A090, #B87E6A)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>
              Your System.
            </span>
          </h1>
          <p style={{ fontSize: 17, color: T.text2, lineHeight: 1.7, maxWidth: 480, marginBottom: 38, fontWeight: 300 }}>
            Manage bookings, staff, branches, and clients from one powerful platform. Built for modern salon owners who demand precision and calm.
          </p>
          <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
            <button onClick={onRegister} style={{
              background: "linear-gradient(135deg, #B5484B, #8B3A3D)",
              color: "#fff",
              border: "none",
              padding: "14px 32px",
              borderRadius: 40,
              fontSize: 15,
              fontWeight: 600,
              cursor: "pointer",
              fontFamily: "inherit",
              boxShadow: `0 4px 14px ${theme === "light" ? "rgba(181,72,75,0.25)" : "rgba(181,72,75,0.3)"}`,
            }}>
              Access Your Salon Software
            </button>
            <a href="#pricing" style={{
              background: "transparent",
              color: T.text2,
              border: `1px solid ${T.border}`,
              padding: "14px 32px",
              borderRadius: 40,
              fontSize: 15,
              fontWeight: 500,
              cursor: "pointer",
              textDecoration: "none",
              display: "inline-block",
              fontFamily: "inherit",
            }}>
              View Plans
            </a>
          </div>
          <div style={{ marginTop: 48, display: "flex", gap: 40, borderTop: `1px solid ${T.border}`, paddingTop: 32 }}>
            {[["1,200+","Salons worldwide"],["4.8M+","Bookings processed"],["99.9%","Uptime SLA"]].map(([val, label]) => (
              <div key={label}>
                <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 28, fontWeight: 600, color: T.gold, lineHeight: 1 }}>{val}</div>
                <div style={{ fontSize: 11, color: T.text3, marginTop: 4 }}>{label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Dashboard mock */}
        <div style={{ position: "relative" }}>
          <div style={{
            background: theme === "light" ? "#FFFFFF" : "linear-gradient(145deg, #1C2128, #161A20)",
            border: `1px solid ${T.border}`,
            borderRadius: 20,
            overflow: "hidden",
            boxShadow: theme === "light" ? "0 20px 40px rgba(0,0,0,0.08)" : "0 40px 100px rgba(0,0,0,0.7)",
            transform: "perspective(1200px) rotateY(-4deg) rotateX(2deg)",
          }}>
            <div style={{ background: theme === "light" ? "#E9ECEF" : "#12161B", borderBottom: `1px solid ${T.border}`, padding: "10px 16px", display: "flex", alignItems: "center", gap: 6 }}>
              {["#FF5F56","#FFBD2E","#27C93F"].map(c => <div key={c} style={{ width: 9, height: 9, borderRadius: "50%", background: c }} />)}
              <div style={{ marginLeft: 10, fontSize: 11, color: "#4A5060", fontWeight: 500 }}>SalonBot — Admin Dashboard</div>
            </div>
            <div style={{ padding: 18 }}>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 8, marginBottom: 14 }}>
                {[["Today","24","+3"],["Revenue","£3,240","+12%"],["Staff In","8/10",""],["Waitlist","6","active"]].map(([label, value, sub]) => (
                  <div key={label} style={{ background: theme === "light" ? "#F1F3F5" : "#1E2530", border: `1px solid ${T.border}`, borderRadius: 10, padding: "10px 12px" }}>
                    <div style={{ fontSize: 9, color: "#4A5060", marginBottom: 4, textTransform: "uppercase", letterSpacing: "0.1em" }}>{label}</div>
                    <div style={{ fontSize: 15, fontWeight: 600, color: T.text }}>{value}</div>
                    {sub && <div style={{ fontSize: 9, color: T.green, marginTop: 2 }}>{sub}</div>}
                  </div>
                ))}
              </div>
              <div style={{ background: theme === "light" ? "#F8F9FA" : "#12161B", border: `1px solid ${T.border}`, borderRadius: 12, padding: 12, marginBottom: 12 }}>
                <div style={{ fontSize: 9, color: "#4A5060", marginBottom: 8, fontWeight: 500, letterSpacing: "0.08em", textTransform: "uppercase" }}>Today's Schedule</div>
                {[["09:00","Hair Colour — Aisha K.","#9B4E4E"],["10:30","Blowout — Mena R.","#6B7E9B"],["11:00","Cut & Style — Zara M.",T.green],["12:15","Bridal Updo — Sara T.","#9B7B50"]].map(([time, name, color]) => (
                  <div key={time} style={{ display: "flex", alignItems: "center", gap: 8, padding: "5px 0", borderBottom: `1px solid ${T.border}` }}>
                    <div style={{ width: 3, height: 24, background: color as string, borderRadius: 2, flexShrink: 0 }} />
                    <div style={{ fontSize: 9, color: "#5A6070", width: 32, fontWeight: 500 }}>{time}</div>
                    <div style={{ fontSize: 10, color: T.text2 }}>{name}</div>
                  </div>
                ))}
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                {[["Branch A — London","12 appts",T.green],["Branch B — Dubai","8 appts","#9B7B50"]].map(([name, sub, dot]) => (
                  <div key={name} style={{ background: theme === "light" ? "#F1F3F5" : "#1E2530", border: `1px solid ${T.border}`, borderRadius: 10, padding: "10px 12px", display: "flex", alignItems: "center", gap: 8 }}>
                    <div style={{ width: 5, height: 5, borderRadius: "50%", background: dot as string, flexShrink: 0 }} />
                    <div>
                      <div style={{ fontSize: 9, color: T.text2, fontWeight: 500 }}>{name}</div>
                      <div style={{ fontSize: 8, color: "#4A5060" }}>{sub}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

// ── Stats Bar ─────────────────────────────────────────────────────────────────
function StatsBar({ theme }: { theme: "light" | "dark" }) {
  const T = theme === "light" ? lightTheme : darkTheme;
  return (
    <div style={{ background: T.bgAlt, borderTop: `1px solid ${T.border}`, borderBottom: `1px solid ${T.border}` }}>
      <div style={{ maxWidth: 900, margin: "0 auto", padding: "24px", display: "flex", flexWrap: "wrap", justifyContent: "center", gap: 48 }}>
        {[["1,200+","Active Salons"],["4.8M+","Bookings / mo"],["4.9★","Avg Rating"],["99.9%","Uptime"]].map(([num, label]) => (
          <div key={label} style={{ textAlign: "center" }}>
            <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 26, fontWeight: 600, color: T.gold, lineHeight: 1 }}>{num}</div>
            <div style={{ fontSize: 10, color: T.text3, textTransform: "uppercase", letterSpacing: "0.1em", marginTop: 3 }}>{label}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── How It Works ──────────────────────────────────────────────────────────────
function HowItWorksSection({ theme }: { theme: "light" | "dark" }) {
  const T = theme === "light" ? lightTheme : darkTheme;
  return (
    <section style={{ padding: "88px 5%", background: T.bg }}>
      <div style={{ maxWidth: 1000, margin: "0 auto", textAlign: "center" }}>
        <div style={{ fontSize: 10, fontWeight: 700, color: T.rose, textTransform: "uppercase", letterSpacing: "0.12em", marginBottom: 10 }}>Simple Setup</div>
        <h2 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: "clamp(28px, 4vw, 42px)", fontWeight: 500, color: T.text, marginBottom: 10 }}>Up and running in minutes</h2>
        <p style={{ fontSize: 15, color: T.text2, marginBottom: 60, fontWeight: 300 }}>No technical setup. No lengthy onboarding. Immediate access to your admin panel.</p>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16 }}>
          {[
            { n: "01", icon: "◈", title: "Choose Your Plan", desc: "Select Solo, Multi-Branch, or Enterprise. Every plan comes with a 14-day trial, no card required." },
            { n: "02", icon: "◉", title: "Pay Securely",     desc: "Stripe-powered checkout. PCI-compliant billing manageable from your account at any time." },
            { n: "03", icon: "◎", title: "Access Your Panel",desc: "Your salon admin panel is live immediately. Configure branches, staff, and start accepting bookings." },
          ].map((item, i) => (
            <div key={item.n} style={{
              padding: "32px 28px",
              background: i === 1 ? T.surface : "transparent",
              border: i === 1 ? `1px solid ${T.roseBorder}` : `1px solid ${T.border}`,
              borderRadius: 16, position: "relative", textAlign: "left",
            }}>
              <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 52, fontWeight: 400, color: "rgba(181,72,75,0.1)", position: "absolute", top: 20, right: 22 }}>{item.n}</div>
              <div style={{ fontSize: 26, marginBottom: 14 }}>{item.icon}</div>
              <h3 style={{ fontSize: 18, fontWeight: 600, color: T.text, marginBottom: 10 }}>{item.title}</h3>
              <p style={{ fontSize: 13.5, color: T.text2, lineHeight: 1.65, fontWeight: 300 }}>{item.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ── Pricing ───────────────────────────────────────────────────────────────────
function PricingSection({ plans, onRegister, theme }: { plans: PublicPlan[]; onRegister: (plan?: PublicPlan) => void; theme: "light" | "dark" }) {
  const T = theme === "light" ? lightTheme : darkTheme;
  const isFree = (p: PublicPlan) => p.price_cents === 0;
  const cycleLabel = (p: PublicPlan) => p.billing_cycle === "monthly" ? "/mo" : p.billing_cycle === "yearly" ? "/yr" : "";

  return (
    <section id="pricing" style={{ padding: "88px 5%", background: T.bgAlt }}>
      <div style={{ maxWidth: 1100, margin: "0 auto" }}>
        <div style={{ textAlign: "center", marginBottom: 52 }}>
          <div style={{ fontSize: 10, fontWeight: 700, color: T.rose, textTransform: "uppercase", letterSpacing: "0.12em", marginBottom: 10 }}>Pricing</div>
          <h2 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: "clamp(28px, 4vw, 44px)", fontWeight: 500, color: T.text, marginBottom: 10 }}>Plans built for every stage</h2>
          <p style={{ fontSize: 14, color: T.text2, fontWeight: 300 }}>No hidden fees. Cancel any time.</p>
        </div>
        
        {plans.length === 0 ? (
          <div style={{ textAlign: "center", color: T.text3, padding: "48px 0", fontSize: 14 }}>Loading plans…</div>
        ) : (
          <>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 20 }}>
              {plans.map((p, i) => {
                const isPopular =p.highlight === true;
                const channelFeatures = [
                  { label: `Up to ${p.max_services} services`, active: true },
                  { label: "WhatsApp Chat",   active: !!p.whatsapp_access },
                  { label: "Instagram Chat",  active: !!p.instagram_access },
                  { label: "Facebook Chat",   active: !!p.facebook_access },
                  { label: "AI Voice Calls",  active: !!p.ai_calls_access },
                ];
                return (
                  <div key={p.id} style={{
                    borderRadius: 20,
                    padding: isPopular ? "32px 28px" : "28px 24px",
                    background: T.surface,
                    border: isPopular ? `2px solid ${T.rose}` : `1px solid ${T.border}`,
                    boxShadow: isPopular ? `0 8px 24px rgba(181,72,75,0.15)` : T.cardShadow,
                    transition: "transform 0.2s",
                    cursor: "pointer",
                  }}
                    onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.transform = "translateY(-4px)"; }}
                    onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.transform = "translateY(0)"; }}
                    onClick={() => onRegister(p)}
                  >
                    {isPopular && (
                      <div style={{ marginBottom: 12, display: "inline-block", background: T.rose, color: "#fff", fontSize: 10, fontWeight: 700, padding: "4px 14px", borderRadius: 40 }}>
                        Most Popular
                      </div>
                    )}
                    <div style={{ fontSize: 18, fontWeight: 600, color: T.text, marginBottom: 4 }}>{p.name}</div>
                    {p.description && <div style={{ fontSize: 12, color: T.text2, marginBottom: 16, fontWeight: 300 }}>{p.description}</div>}
                    <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 42, fontWeight: 500, color: T.text, lineHeight: 1, marginBottom: 8 }}>
                      {isFree(p) ? "Free" : `$${(p.price_cents / 100).toFixed(0)}`}
                      {!isFree(p) && <span style={{ fontSize: 14, fontWeight: 400, color: T.text3, marginLeft: 6 }}>{cycleLabel(p)}</span>}
                    </div>
                    <div style={{ height: 1, background: T.border, margin: "20px 0" }} />
                    <ul style={{ listStyle: "none", margin: "0 0 24px", padding: 0, display: "flex", flexDirection: "column", gap: 10 }}>
                      {channelFeatures.map(f => (
                        <li key={f.label} style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 13, color: f.active ? T.text2 : T.text3 }}>
                          <span style={{ color: f.active ? T.rose : T.text3, fontSize: 12, flexShrink: 0 }}>{f.active ? "✓" : "—"}</span>
                          <span style={{ textDecoration: f.active ? "none" : "line-through" }}>{f.label}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                );
              })}
            </div>
            
            {/* Centered Choose a Plan button below all cards */}
            <div style={{ display: "flex", justifyContent: "center", marginTop: 40 }}>
              <button
                onClick={() => onRegister()}
                style={{
                  background: "linear-gradient(135deg, #B5484B, #8B3A3D)",
                  color: "#fff",
                  border: "none",
                  padding: "14px 48px",
                  borderRadius: 40,
                  fontSize: 15,
                  fontWeight: 600,
                  cursor: "pointer",
                  fontFamily: "inherit",
                  transition: "all 0.2s",
                  boxShadow: `0 4px 14px ${theme === "light" ? "rgba(181,72,75,0.3)" : "rgba(181,72,75,0.4)"}`,
                }}
                onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-2px)"; }}
                onMouseLeave={e => { e.currentTarget.style.transform = "translateY(0)"; }}
              >
                Choose a plan
              </button>
            </div>
          </>
        )}
      </div>
    </section>
  );
}

// ── Features ──────────────────────────────────────────────────────────────────
function FeaturesSection({ theme }: { theme: "light" | "dark" }) {
  const T = theme === "light" ? lightTheme : darkTheme;
  const features = [
    { icon: "🏢", title: "Branch Management",   desc: "Control every location from a single unified dashboard. Per-branch hours, staff, and services." },
    { icon: "👥", title: "Staff & Role Control", desc: "Assign roles, track performance, manage schedules and set granular permissions across your team." },
    { icon: "✂️", title: "Services & Pricing",   desc: "Build your full service menu with durations, pricing tiers, and staff-specific rates. Sync everywhere." },
    { icon: "🕐", title: "Working Hours",        desc: "Per-staff availability, break times and override schedules. Smart conflict detection prevents double-booking." },
    { icon: "💰", title: "Commissions Engine",   desc: "Automate stylist commission calculations. Rules-based, service or product linked. Payroll-ready exports." },
    { icon: "📅", title: "Central Calendar",     desc: "One calendar for all branches. Filter by location, staff or service. Drag-and-drop rescheduling built in." },
  ];
  return (
    <section id="features" style={{ padding: "88px 5%", background: T.bg }}>
      <div style={{ maxWidth: 1200, margin: "0 auto" }}>
        <div style={{ textAlign: "center", marginBottom: 52 }}>
          <div style={{ fontSize: 10, fontWeight: 700, color: T.rose, textTransform: "uppercase", letterSpacing: "0.12em", marginBottom: 10 }}>Core Features</div>
          <h2 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: "clamp(28px, 4vw, 44px)", fontWeight: 500, color: T.text, marginBottom: 10 }}>Everything your salon needs</h2>
          <p style={{ fontSize: 14, color: T.text2, fontWeight: 300 }}>Precision tools for the salon environment — not adapted from generic software.</p>
        </div>
        {/* Changed from auto-fit to 3 columns, 2 rows */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 20 }}>
          {features.map(f => (
            <div key={f.title}
              style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 16, padding: "24px 26px", transition: "border-color 0.2s" }}
              onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.borderColor = T.roseBorder; }}
              onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.borderColor = T.border; }}
            >
              <div style={{ fontSize: 32, marginBottom: 14 }}>{f.icon}</div>
              <h3 style={{ fontSize: 18, fontWeight: 600, color: T.text, marginBottom: 10 }}>{f.title}</h3>
              <p style={{ fontSize: 13.5, color: T.text2, lineHeight: 1.65, fontWeight: 300 }}>{f.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ── Booking Channels ──────────────────────────────────────────────────────────
function BookingSection({ theme }: { theme: "light" | "dark" }) {
  const T = theme === "light" ? lightTheme : darkTheme;
  const channels = [
    { icon: "💬", name: "WhatsApp",    desc: "Clients book in WhatsApp. Automated replies handle availability, confirmations and reminders.", color: "#25D366" },
    { icon: "📸", name: "Instagram",   desc: "Turn DMs into bookings. The system reads messages and captures appointment requests automatically.", color: "#E1306C" },
    { icon: "👍", name: "Facebook",    desc: "Book via Messenger or your Facebook page. No third-party plugins needed.", color: "#1877F2" },
    { icon: "🌐", name: "Web Widget",  desc: "Embed a branded booking widget on any website in under 5 minutes. Mobile-optimised by default.", color: "#8B6FE8" },
    { icon: "💻", name: "Live Chat",   desc: "Real-time chat widget with AI-assisted booking flow. Visitors book without leaving your site.", color: "#F59E0B" },
    { icon: "📞", name: "AI Phone",    desc: "AI voice assistant answers calls 24/7, checks availability and confirms bookings — no receptionist.", color: "#C9856A" },
  ];
  return (
    <section id="booking" style={{ padding: "88px 5%", background: T.bgAlt }}>
      <div style={{ maxWidth: 1200, margin: "0 auto" }}>
        <div style={{ textAlign: "center", marginBottom: 52 }}>
          <div style={{ fontSize: 10, fontWeight: 700, color: T.rose, textTransform: "uppercase", letterSpacing: "0.12em", marginBottom: 10 }}>Omnichannel Booking</div>
          <h2 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: "clamp(28px, 4vw, 44px)", fontWeight: 500, color: T.text, marginBottom: 10 }}>Never miss a booking again</h2>
          <p style={{ fontSize: 14, color: T.text2, maxWidth: 500, margin: "0 auto", fontWeight: 300 }}>Every channel feeds into one unified calendar — no double-booking, no gaps.</p>
        </div>
        {/* Changed from auto-fit to 3 columns, 2 rows */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 20 }}>
          {channels.map(ch => (
            <div key={ch.name}
              style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 16, padding: "24px", transition: "transform 0.2s" }}
              onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.transform = "translateY(-3px)"; }}
              onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.transform = "translateY(0)"; }}
            >
              <div style={{ width: 48, height: 48, borderRadius: 14, background: `${ch.color}18`, border: `1px solid ${ch.color}30`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 24, marginBottom: 16 }}>{ch.icon}</div>
              <h3 style={{ fontSize: 18, fontWeight: 600, color: T.text, marginBottom: 10 }}>{ch.name}</h3>
              <p style={{ fontSize: 13.5, color: T.text2, lineHeight: 1.6, fontWeight: 300 }}>{ch.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ── Testimonials ──────────────────────────────────────────────────────────────
function TestimonialsSection({ theme }: { theme: "light" | "dark" }) {
  const T = theme === "light" ? lightTheme : darkTheme;
  const testimonials = [
    { stars: 5, quote: "SalonBot transformed how we manage bookings. The AI calls feature alone saves us 2 hours a day.", name: "Ayesha Khan",   role: "Owner, Royal Glam Studio · Lahore",  metric: "+340%",  metricLabel: "online bookings" },
    { stars: 5, quote: "Finally a system that actually understands the salon business. Setup took 20 minutes, not days.",  name: "Sara Mahmood", role: "Owner, Luxe Hair Lounge · Karachi", metric: "18 hrs", metricLabel: "saved weekly" },
    { stars: 5, quote: "The WhatsApp integration is seamless. Clients love booking through a simple chat.",               name: "Nadia Rauf",   role: "Owner, Bloom Beauty Bar · Islamabad", metric: "92%",   metricLabel: "no-show reduction" },
  ];
  return (
    <section style={{ padding: "88px 5%", background: T.bg }}>
      <div style={{ maxWidth: 1100, margin: "0 auto" }}>
        <div style={{ textAlign: "center", marginBottom: 52 }}>
          <div style={{ fontSize: 10, fontWeight: 700, color: T.rose, textTransform: "uppercase", letterSpacing: "0.12em", marginBottom: 10 }}>Success Stories</div>
          <h2 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: "clamp(28px, 4vw, 44px)", fontWeight: 500, color: T.text }}>Real salons. Real growth.</h2>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: 20 }}>
          {testimonials.map(t => (
            <div key={t.name} style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 20, padding: 28 }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 18 }}>
                <div style={{ color: T.gold, fontSize: 13, letterSpacing: 2 }}>{"★".repeat(t.stars)}</div>
                <div style={{ textAlign: "right" }}>
                  <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 24, fontWeight: 600, color: T.gold, lineHeight: 1 }}>{t.metric}</div>
                  <div style={{ fontSize: 9, color: T.text3, marginTop: 2 }}>{t.metricLabel}</div>
                </div>
              </div>
              <p style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 15, color: T.text2, lineHeight: 1.7, fontStyle: "italic", marginBottom: 20 }}>"{t.quote}"</p>
              <div style={{ fontSize: 14, fontWeight: 600, color: T.text }}>{t.name}</div>
              <div style={{ fontSize: 11, color: T.text3, marginTop: 2 }}>{t.role}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ── FAQ ───────────────────────────────────────────────────────────────────────
const FAQ_ITEMS = [
  { 
    q: "How does the AI voice calls feature work?", 
    a: "Our AI answers incoming calls to your salon, books appointments, and handles common queries — 24/7, in natural language." 
  },
  { 
    q: "Can I manage multiple salon branches from one account?", 
    a: "Yes. The Multi-Branch and Enterprise plans let you control all locations from a single dashboard — separate hours, staff, services, and analytics per branch." 
  },
  { 
    q: "What booking channels are supported?", 
    a: "WhatsApp, Instagram, Facebook, website widget, live chat, and AI phone calls. All channels sync to one central calendar — no double-booking." 
  },
  { 
    q: "Can I cancel my subscription anytime?", 
    a: "Absolutely. No contracts, no lock-in. Cancel from your dashboard and you keep access until the end of your billing period." 
  },
  { 
    q: "Do I need technical skills to set up?", 
    a: "None. Setup takes under 30 minutes — add your services, staff, branch details, and embed the booking widget. We handle the rest." 
  },
];

function FaqSection({ theme }: { theme: "light" | "dark" }) {
  const T = theme === "light" ? lightTheme : darkTheme;
  const [open, setOpen] = useState<number | null>(null);
  return (
    <section id="faq" style={{ padding: "88px 5%", background: T.bgAlt }}>
      <div style={{ maxWidth: 680, margin: "0 auto" }}>
        <div style={{ textAlign: "center", marginBottom: 48 }}>
          <div style={{ fontSize: 10, fontWeight: 700, color: T.rose, textTransform: "uppercase", letterSpacing: "0.12em", marginBottom: 10 }}>FAQ</div>
          <h2 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: "clamp(28px, 4vw, 42px)", fontWeight: 500, color: T.text }}>Frequently Asked</h2>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {FAQ_ITEMS.map((item, i) => (
            <div key={i} style={{ background: T.surface, borderRadius: 14, border: `1px solid ${T.border}`, overflow: "hidden" }}>
              <button onClick={() => setOpen(open === i ? null : i)} style={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px 20px", background: "none", border: "none", cursor: "pointer", textAlign: "left", fontFamily: "inherit" }}>
                <span style={{ fontSize: 14, fontWeight: 600, color: T.text }}>{item.q}</span>
                {open === i ? <ChevronUp size={16} style={{ color: T.text3, flexShrink: 0 }} /> : <ChevronDown size={16} style={{ color: T.text3, flexShrink: 0 }} />}
              </button>
              {open === i && <div style={{ padding: "0 20px 18px", fontSize: 13, color: T.text2, lineHeight: 1.65, borderTop: `1px solid ${T.border}`, paddingTop: 14, fontWeight: 300 }}>{item.a}</div>}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ── Bottom CTA ────────────────────────────────────────────────────────────────
function BottomCta({ onRegister, theme }: { onRegister: () => void; theme: "light" | "dark" }) {
  const T = theme === "light" ? lightTheme : darkTheme;
  return (
    <section style={{ padding: "100px 5%", textAlign: "center", background: T.bg, position: "relative", overflow: "hidden" }}>
      <div style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%, -50%)", width: 600, height: 400, background: `radial-gradient(ellipse, ${theme === "light" ? "rgba(181,72,75,0.04)" : "rgba(181,72,75,0.06)"} 0%, transparent 70%)`, pointerEvents: "none" }} />
      <div style={{ position: "relative", zIndex: 1, maxWidth: 640, margin: "0 auto" }}>
        <div style={{ fontSize: 10, fontWeight: 700, color: T.rose, textTransform: "uppercase", letterSpacing: "0.12em", marginBottom: 14 }}>Ready When You Are</div>
        <h2 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: "clamp(36px, 6vw, 64px)", fontWeight: 500, color: T.text, marginBottom: 18, lineHeight: 1.05 }}>
          Log in. Take Control.{" "}
          <span style={{ background: "linear-gradient(135deg, #E8D5C8, #C9A090, #B87E6A)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>Grow.</span>
        </h2>
        <p style={{ fontSize: 16, color: T.text2, lineHeight: 1.7, marginBottom: 40, fontWeight: 300 }}>
          Your salon deserves a system that matches your standards. Start today — no commitment, no complexity.
        </p>
        <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
          <button onClick={onRegister} style={{
            background: "linear-gradient(135deg, #B5484B, #8B3A3D)",
            color: "#fff",
            border: "none",
            padding: "15px 36px",
            borderRadius: 40,
            fontSize: 15,
            fontWeight: 600,
            cursor: "pointer",
            fontFamily: "inherit",
          }}>
            Access Your Salon Software
          </button>
          <a href="#pricing" style={{
            background: "transparent",
            color: T.text2,
            border: `1px solid ${T.border}`,
            padding: "15px 36px",
            borderRadius: 40,
            fontSize: 15,
            fontWeight: 500,
            textDecoration: "none",
            display: "inline-block",
            fontFamily: "inherit",
          }}>
            View Plans
          </a>
        </div>
        <p style={{ marginTop: 20, fontSize: 12, color: T.text3 }}>14-day free trial · No credit card required · Cancel any time</p>
      </div>
    </section>
  );
}

// ── Footer ────────────────────────────────────────────────────────────────────
function Footer({ theme }: { theme: "light" | "dark" }) {
  const T = theme === "light" ? lightTheme : darkTheme;
  return (
    <footer style={{ background: theme === "light" ? "#E9ECEF" : "#0A0C10", padding: "32px 5%" }}>
      <div style={{ maxWidth: 1200, margin: "0 auto", display: "flex", flexWrap: "wrap", alignItems: "center", justifyContent: "space-between", gap: 16 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <div style={{ width: 26, height: 26, borderRadius: 6, background: "linear-gradient(135deg, #B5484B, #8B3A3D)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12 }}>✨</div>
          <span style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 14, fontWeight: 700, color: T.text3 }}>Salon</span>
        </div>
        <div style={{ display: "flex", gap: 28 }}>
          {[["Login","/login"],["Privacy","#"],["Terms","#"],["Support","#"]].map(([label, href]) => (
            <a key={label} href={href} style={{ fontSize: 11, color: T.text3, textDecoration: "none" }}>{label}</a>
          ))}
        </div>
        <div style={{ fontSize: 11, color: T.text3 }}>© 2025 Salon. All rights reserved.</div>
      </div>
    </footer>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function LandingPage() {
  const [plans, setPlans] = useState<PublicPlan[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [selectedPlanForModal, setSelectedPlanForModal] = useState<PublicPlan | null>(null);
  const { theme, T, toggleTheme } = useTheme();

  useEffect(() => {
    fetch("/api/public/plans")
      .then(r => r.json())
      .then((data: PublicPlan[]) => setPlans(data))
      .catch(() => {});
  }, []);

  const openModal = (plan?: PublicPlan) => {
    setSelectedPlanForModal(plan || null);
    setShowModal(true);
  };
  
  const closeModal = () => {
    setShowModal(false);
    setSelectedPlanForModal(null);
  };

  // Apply theme class to body for global styles
  useEffect(() => {
    document.body.style.backgroundColor = T.bg;
  }, [T.bg]);

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@400;500;600&family=Space+Grotesk:wght@400;500;600;700&family=DM+Sans:wght@300;400;500;600&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        ::-webkit-scrollbar { width: 5px; }
        ::-webkit-scrollbar-track { background: ${T.bg}; }
        ::-webkit-scrollbar-thumb { background: ${T.rose}; border-radius: 3px; }
        html { scroll-behavior: smooth; }
      `}</style>

      <div style={{ minHeight: "100vh", fontFamily: "'DM Sans', sans-serif", background: T.bg, color: T.text }}>
        <Navbar onRegister={() => openModal()} theme={theme} toggleTheme={toggleTheme} />
        <HeroSection onRegister={() => openModal()} theme={theme} />
        <StatsBar theme={theme} />
        <HowItWorksSection theme={theme} />
        <PricingSection plans={plans} onRegister={openModal} theme={theme} />
        <FeaturesSection theme={theme} />
        <BookingSection theme={theme} />
        <TestimonialsSection theme={theme} />
        <FaqSection theme={theme} />
        <BottomCta onRegister={() => openModal()} theme={theme} />
        <Footer theme={theme} />
      </div>

      {showModal && (
        <RegisterModal 
          plans={plans} 
          onClose={closeModal} 
          theme={theme} 
          preselectedPlan={selectedPlanForModal}
        />
      )}
    </>
  );
}