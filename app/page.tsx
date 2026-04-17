// app/page.tsx
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Check, ChevronDown, ChevronUp } from "lucide-react";
import type { PublicPlan } from "@/lib/types";

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

// ── Navbar ────────────────────────────────────────────────────────────────────
function Navbar() {
  return (
    <nav style={{
      position: "sticky", top: 0, zIndex: 50,
      background: "rgba(255,255,255,0.92)", backdropFilter: "blur(12px)",
      borderBottom: `1px solid ${T.border}`,
    }}>
      <div style={{ maxWidth: 1200, margin: "0 auto", padding: "0 24px", height: 60, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{
            width: 32, height: 32, borderRadius: 9,
            background: `linear-gradient(135deg, ${T.primary}, ${T.accent})`,
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 15, color: "#fff", fontWeight: 700,
            boxShadow: `0 4px 12px rgba(13,148,136,0.25)`,
          }}>G</div>
          <span style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 16, fontWeight: 700, color: T.text, letterSpacing: "-0.02em" }}>GlowDesk</span>
        </div>

        <div className="hidden md:flex" style={{ gap: 28 }}>
          {["Features", "How it Works", "Pricing", "FAQ"].map((label, i) => (
            <a key={label} href={`#${["features","how-it-works","pricing","faq"][i]}`}
              style={{ fontSize: 13, fontWeight: 500, color: T.text2, textDecoration: "none", transition: "color 0.2s" }}
              onMouseEnter={e => (e.currentTarget.style.color = T.text)}
              onMouseLeave={e => (e.currentTarget.style.color = T.text2)}
            >{label}</a>
          ))}
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <Link href="/login" style={{ fontSize: 13, fontWeight: 500, color: T.text2, textDecoration: "none" }}>Login</Link>
          <Link href="/register" style={{
            fontSize: 13, fontWeight: 600, color: "#fff",
            padding: "8px 18px", borderRadius: 99,
            background: `linear-gradient(135deg, ${T.primary}, ${T.accent})`,
            textDecoration: "none",
            boxShadow: `0 4px 12px rgba(13,148,136,0.2)`,
          }}>Start Free</Link>
        </div>
      </div>
    </nav>
  );
}

// ── Hero ──────────────────────────────────────────────────────────────────────
function HeroSection() {
  return (
    <section style={{
      position: "relative", overflow: "hidden",
      background: `radial-gradient(ellipse at 20% 0%, rgba(13,148,136,0.08) 0%, transparent 60%),
                   radial-gradient(ellipse at 80% 100%, rgba(232,145,58,0.06) 0%, transparent 60%),
                   ${T.bg}`,
      padding: "100px 24px",
      textAlign: "center",
    }}>
      <div style={{ maxWidth: 720, margin: "0 auto" }}>
        <div className="animate-fade-in-up" style={{
          display: "inline-block",
          background: T.primaryLight, color: T.primary,
          fontSize: 11, fontWeight: 700, padding: "5px 14px", borderRadius: 99,
          letterSpacing: "0.06em", textTransform: "uppercase",
          marginBottom: 24, border: `1px solid rgba(13,148,136,0.2)`,
        }}>Built for beauty businesses</div>

        <h1 className="animate-fade-in-up anim-delay-1" style={{
          fontFamily: "'Space Grotesk', sans-serif",
          fontSize: "clamp(36px, 6vw, 52px)", fontWeight: 700,
          color: T.text, letterSpacing: "-0.03em",
          lineHeight: 1.15, marginBottom: 20,
        }}>
          Your salon,{" "}
          <span style={{ background: `linear-gradient(135deg, ${T.primary}, ${T.accent})`, WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
            beautifully managed
          </span>
        </h1>

        <p className="animate-fade-in-up anim-delay-2" style={{
          fontFamily: "'DM Sans', sans-serif",
          fontSize: 17, color: T.text2, lineHeight: 1.7,
          maxWidth: 520, margin: "0 auto 36px",
        }}>
          Bookings, WhatsApp, AI calls, staff, clients & analytics — all in one platform built for modern salons.
        </p>

        <div className="animate-fade-in-up anim-delay-3" style={{ display: "flex", flexWrap: "wrap", gap: 12, justifyContent: "center" }}>
          <Link href="/register" style={{
            fontSize: 14, fontWeight: 600, color: "#fff",
            padding: "13px 28px", borderRadius: 99,
            background: `linear-gradient(135deg, ${T.primary}, ${T.accent})`,
            textDecoration: "none",
            boxShadow: `0 8px 24px rgba(13,148,136,0.25)`,
          }}>Start Free Trial →</Link>
          <button style={{
            fontSize: 14, fontWeight: 500, color: T.text,
            padding: "13px 28px", borderRadius: 99,
            background: T.surface, border: `1.5px solid ${T.border}`,
            cursor: "pointer",
          }}>▶ Watch 2-min demo</button>
        </div>
      </div>
    </section>
  );
}

// ── Stats Bar ─────────────────────────────────────────────────────────────────
function StatsBar() {
  const stats = [
    { num: "200+", label: "Active Salons" },
    { num: "50k+", label: "Bookings / mo" },
    { num: "4.9★", label: "Avg Rating" },
    { num: "98%",  label: "Uptime" },
  ];
  return (
    <section style={{ background: T.surface, borderBottom: `1px solid ${T.border2}` }}>
      <div style={{
        maxWidth: 900, margin: "0 auto", padding: "28px 24px",
        display: "flex", flexWrap: "wrap", justifyContent: "center", gap: 48,
      }}>
        {stats.map(s => (
          <div key={s.label} style={{ textAlign: "center" }}>
            <div style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 26, fontWeight: 700, color: T.text }}>{s.num}</div>
            <div style={{ fontSize: 10, color: T.text3, textTransform: "uppercase", letterSpacing: "0.1em", marginTop: 3 }}>{s.label}</div>
          </div>
        ))}
      </div>
    </section>
  );
}

// ── Features ──────────────────────────────────────────────────────────────────
function FeaturesSection() {
  const features = [
    { icon: "📅", title: "Smart Bookings",   desc: "Online booking with branch & staff selection, real-time availability." },
    { icon: "💬", title: "WhatsApp Chat",    desc: "Respond to clients directly from your dashboard via WhatsApp." },
    { icon: "🤖", title: "AI Voice Calls",   desc: "AI handles incoming calls, books appointments, answers queries 24/7." },
    { icon: "📊", title: "Analytics",        desc: "Revenue charts, top services, peak hours — know your numbers." },
    { icon: "👥", title: "Staff & Branches", desc: "Manage multiple branches, staff roles, timings, and services." },
    { icon: "🎁", title: "Deals & Packages", desc: "Create offers and bundles to boost repeat business." },
  ];
  return (
    <section id="features" style={{ padding: "88px 24px", background: T.bg }}>
      <div style={{ maxWidth: 1100, margin: "0 auto" }}>
        <div style={{ textAlign: "center", marginBottom: 52 }}>
          <div style={{ fontSize: 10, fontWeight: 700, color: T.primary, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 10 }}>Everything you need</div>
          <h2 style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 32, fontWeight: 700, color: T.text, letterSpacing: "-0.02em", marginBottom: 10 }}>One platform. Every tool.</h2>
          <p style={{ fontSize: 14, color: T.text2 }}>No more juggling 5 apps. GlowDesk brings it all together.</p>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 16 }}>
          {features.map(f => (
            <div key={f.title} className="feature-card" style={{
              background: T.surface, border: `1px solid ${T.border2}`,
              borderRadius: 16, padding: "24px 28px",
            }}>
              <div style={{ fontSize: 28, marginBottom: 14 }}>{f.icon}</div>
              <h3 style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 15, fontWeight: 600, color: T.text, marginBottom: 8 }}>{f.title}</h3>
              <p style={{ fontSize: 13, color: T.text2, lineHeight: 1.65 }}>{f.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ── How It Works ──────────────────────────────────────────────────────────────
function HowItWorksSection() {
  const steps = [
    { num: 1, title: "Pick a Plan",       desc: "Choose what fits your salon size and budget." },
    { num: 2, title: "Set Up Your Salon", desc: "Add branches, staff, services and timings." },
    { num: 3, title: "Go Live",           desc: "Share your booking link. Clients book instantly." },
  ];
  return (
    <section id="how-it-works" style={{ padding: "88px 24px", background: T.surface }}>
      <div style={{ maxWidth: 900, margin: "0 auto" }}>
        <div style={{ textAlign: "center", marginBottom: 52 }}>
          <div style={{ fontSize: 10, fontWeight: 700, color: T.primary, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 10 }}>Simple setup</div>
          <h2 style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 32, fontWeight: 700, color: T.text, letterSpacing: "-0.02em" }}>Up and running in minutes</h2>
        </div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 24, justifyContent: "center" }}>
          {steps.map(s => (
            <div key={s.num} style={{ flex: "1 1 220px", textAlign: "center", maxWidth: 280 }}>
              <div style={{
                width: 52, height: 52, borderRadius: 16,
                background: `linear-gradient(135deg, ${T.primary}, ${T.accent})`,
                display: "flex", alignItems: "center", justifyContent: "center",
                margin: "0 auto 16px",
                fontFamily: "'Space Grotesk', sans-serif", fontSize: 20, fontWeight: 700, color: "#fff",
                boxShadow: `0 8px 20px rgba(13,148,136,0.25)`,
              }}>{s.num}</div>
              <h3 style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 15, fontWeight: 600, color: T.text, marginBottom: 8 }}>{s.title}</h3>
              <p style={{ fontSize: 13, color: T.text2 }}>{s.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ── Pricing ───────────────────────────────────────────────────────────────────
function PlanFeature({ label, active }: { label: string; active: boolean }) {
  return (
    <li style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, color: active ? T.text2 : T.text3 }}>
      <span style={{ color: active ? T.primary : T.text3, flexShrink: 0 }}>
        {active ? <Check size={13} strokeWidth={3} /> : <span style={{ display: "inline-block", width: 13 }} />}
      </span>
      <span style={{ textDecoration: active ? "none" : "line-through" }}>{label}</span>
    </li>
  );
}

function PricingSection({ plans }: { plans: PublicPlan[] }) {
  const isFree = (p: PublicPlan) => p.price_cents === 0;
  const cycleLabel = (p: PublicPlan) => p.billing_cycle === "monthly" ? "/mo" : p.billing_cycle === "yearly" ? "/yr" : "";
  const popularIndex = plans.length === 3 ? 1 : -1;

  return (
    <section id="pricing" style={{ padding: "88px 24px", background: T.bg }}>
      <div style={{ maxWidth: 1100, margin: "0 auto" }}>
        <div style={{ textAlign: "center", marginBottom: 52 }}>
          <div style={{ fontSize: 10, fontWeight: 700, color: T.primary, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 10 }}>Transparent pricing</div>
          <h2 style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 32, fontWeight: 700, color: T.text, letterSpacing: "-0.02em", marginBottom: 10 }}>Plans for every salon</h2>
          <p style={{ fontSize: 14, color: T.text2 }}>All plans include core booking features. Upgrade for AI & chat channels.</p>
        </div>

        {plans.length === 0 ? (
          <div style={{ textAlign: "center", color: T.text3, padding: "48px 0", fontSize: 14 }}>Loading plans…</div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 20 }}>
            {plans.map((p, i) => {
              const popular = i === popularIndex;
              return (
                <div key={p.id} style={{
                  position: "relative",
                  background: T.surface,
                  borderRadius: 20,
                  padding: popular ? "32px 28px" : "28px 24px",
                  border: popular ? `2px solid ${T.primary}` : `1px solid ${T.border}`,
                  boxShadow: popular ? `0 12px 40px rgba(13,148,136,0.12)` : "none",
                }}>
                  {popular && (
                    <div style={{
                      position: "absolute", top: -13, left: "50%", transform: "translateX(-50%)",
                      background: `linear-gradient(135deg, ${T.primary}, ${T.accent})`,
                      color: "#fff", fontSize: 10, fontWeight: 700,
                      padding: "4px 14px", borderRadius: 99, whiteSpace: "nowrap",
                    }}>⭐ Most Popular</div>
                  )}
                  <h3 style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 15, fontWeight: 600, color: T.text, marginBottom: 6 }}>{p.name}</h3>
                  <div style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 32, fontWeight: 700, color: T.text, marginBottom: 6 }}>
                    {isFree(p) ? "Free" : `$${(p.price_cents / 100).toFixed(0)}`}
                    {!isFree(p) && <span style={{ fontSize: 13, fontWeight: 400, color: T.text3, marginLeft: 4 }}>{cycleLabel(p)}</span>}
                  </div>
                  {p.description && <p style={{ fontSize: 12, color: T.text2, marginBottom: 20 }}>{p.description}</p>}
                  <ul style={{ listStyle: "none", display: "flex", flexDirection: "column", gap: 8, marginBottom: 24 }}>
                    <PlanFeature label={`Up to ${p.max_services} services`} active={true} />
                    <PlanFeature label="WhatsApp Chat" active={!!p.whatsapp_access} />
                    <PlanFeature label="Instagram Chat" active={!!p.instagram_access} />
                    <PlanFeature label="Facebook Chat"  active={!!p.facebook_access} />
                    <PlanFeature label="AI Voice Calls" active={!!p.ai_calls_access} />
                  </ul>
                  <Link href={`/register?plan_id=${p.id}`} style={{
                    display: "block", width: "100%", textAlign: "center",
                    fontSize: 13, fontWeight: 600, padding: "11px 0", borderRadius: 10,
                    textDecoration: "none",
                    background: popular ? `linear-gradient(135deg, ${T.primary}, ${T.accent})` : T.bg,
                    color: popular ? "#fff" : T.text2,
                    border: popular ? "none" : `1.5px solid ${T.border}`,
                  }}>{isFree(p) ? "Get Started Free" : "Start Free Trial"}</Link>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}

// ── Testimonials ──────────────────────────────────────────────────────────────
function TestimonialsSection() {
  const testimonials = [
    { stars: 5, quote: "GlowDesk transformed how we manage bookings. The AI calls feature alone saves us 2 hours a day.", name: "Ayesha Khan", role: "Owner, Royal Glam Studio · Lahore" },
    { stars: 5, quote: "Finally a system that actually understands the salon business. Setup took 20 minutes, not days.", name: "Sara Mahmood", role: "Owner, Luxe Hair Lounge · Karachi" },
    { stars: 5, quote: "The WhatsApp integration is seamless. Clients love being able to book through a simple chat.", name: "Nadia Rauf", role: "Owner, Bloom Beauty Bar · Islamabad" },
  ];
  return (
    <section style={{ padding: "88px 24px", background: T.surface }}>
      <div style={{ maxWidth: 1100, margin: "0 auto" }}>
        <div style={{ textAlign: "center", marginBottom: 52 }}>
          <div style={{ fontSize: 10, fontWeight: 700, color: T.primary, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 10 }}>Loved by salon owners</div>
          <h2 style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 32, fontWeight: 700, color: T.text, letterSpacing: "-0.02em" }}>Real results, real salons</h2>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 16 }}>
          {testimonials.map(t => (
            <div key={t.name} className="testimonial-card" style={{
              background: T.bg, borderRadius: 16, padding: 24,
              border: `1px solid ${T.border2}`,
            }}>
              <div style={{ color: T.accent, fontSize: 14, marginBottom: 12, letterSpacing: 2 }}>{"★".repeat(t.stars)}</div>
              <p style={{ fontSize: 13, color: T.text2, lineHeight: 1.7, fontStyle: "italic", marginBottom: 16 }}>"{t.quote}"</p>
              <div style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 13, fontWeight: 600, color: T.text }}>{t.name}</div>
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
  { q: "What's included in the free plan?", a: "The Starter plan includes online booking, up to 10 services, 1 branch, and basic analytics — completely free, forever." },
  { q: "Can I cancel anytime?", a: "Yes. No contracts, no lock-in. Cancel from your dashboard anytime and you keep access until the end of your billing period." },
  { q: "How does the AI voice calls feature work?", a: "Our AI answers incoming calls to your salon, books appointments, and handles common queries — 24/7, in natural language." },
  { q: "Do I need technical skills to set up?", a: "None at all. Setup takes under 30 minutes. Add your services, staff, and branch details — we handle the rest." },
];

function FaqSection() {
  const [open, setOpen] = useState<number | null>(null);
  return (
    <section id="faq" style={{ padding: "88px 24px", background: T.bg }}>
      <div style={{ maxWidth: 680, margin: "0 auto" }}>
        <div style={{ textAlign: "center", marginBottom: 52 }}>
          <div style={{ fontSize: 10, fontWeight: 700, color: T.primary, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 10 }}>Common questions</div>
          <h2 style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 32, fontWeight: 700, color: T.text, letterSpacing: "-0.02em" }}>Frequently Asked</h2>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {FAQ_ITEMS.map((item, i) => (
            <div key={i} style={{ background: T.surface, borderRadius: 12, border: `1px solid ${T.border2}`, overflow: "hidden" }}>
              <button
                onClick={() => setOpen(open === i ? null : i)}
                style={{
                  width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between",
                  padding: "16px 20px", background: "none", border: "none", cursor: "pointer", textAlign: "left",
                }}
              >
                <span style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 13, fontWeight: 600, color: T.text }}>{item.q}</span>
                {open === i
                  ? <ChevronUp size={15} style={{ color: T.text3, flexShrink: 0 }} />
                  : <ChevronDown size={15} style={{ color: T.text3, flexShrink: 0 }} />
                }
              </button>
              {open === i && (
                <div style={{ padding: "0 20px 16px", fontSize: 13, color: T.text2, lineHeight: 1.65, borderTop: `1px solid ${T.border2}`, paddingTop: 12 }}>
                  {item.a}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ── Bottom CTA ────────────────────────────────────────────────────────────────
function BottomCta() {
  return (
    <section style={{
      padding: "88px 24px", textAlign: "center",
      background: T.dark,
      position: "relative", overflow: "hidden",
    }}>
      <div style={{ position: "absolute", width: 500, height: 500, borderRadius: "50%", background: "radial-gradient(circle, rgba(13,148,136,0.15) 0%, transparent 70%)", top: -100, left: -100, pointerEvents: "none" }} />
      <div style={{ position: "absolute", width: 400, height: 400, borderRadius: "50%", background: "radial-gradient(circle, rgba(232,145,58,0.10) 0%, transparent 70%)", bottom: -80, right: -80, pointerEvents: "none" }} />
      <div style={{ position: "relative" }}>
        <h2 style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 36, fontWeight: 700, color: "#fff", letterSpacing: "-0.02em", marginBottom: 12 }}>Ready to grow your salon?</h2>
        <p style={{ fontSize: 15, color: "rgba(255,255,255,0.5)", marginBottom: 36, maxWidth: 400, margin: "0 auto 36px" }}>
          Join 200+ salons already using GlowDesk. Start free, upgrade anytime.
        </p>
        <Link href="/register" style={{
          display: "inline-block", fontSize: 14, fontWeight: 600, color: "#fff",
          padding: "14px 32px", borderRadius: 99,
          background: `linear-gradient(135deg, ${T.primary}, ${T.accent})`,
          textDecoration: "none",
          boxShadow: `0 8px 24px rgba(13,148,136,0.3)`,
        }}>Start Free Trial →</Link>
      </div>
    </section>
  );
}

// ── Footer ────────────────────────────────────────────────────────────────────
function Footer() {
  return (
    <footer style={{ background: "#0A0C10", padding: "28px 24px" }}>
      <div style={{ maxWidth: 1200, margin: "0 auto", display: "flex", flexWrap: "wrap", alignItems: "center", justifyContent: "space-between", gap: 16 }}>
        <div style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 14, fontWeight: 700, color: "rgba(255,255,255,0.4)" }}>GlowDesk</div>
        <div style={{ display: "flex", gap: 24 }}>
          {["Login", "Privacy Policy", "Terms", "Contact"].map((label, i) => (
            <a key={label}
              href={i === 0 ? "/login" : "#"}
              style={{ fontSize: 11, color: "rgba(255,255,255,0.25)", textDecoration: "none" }}
            >{label}</a>
          ))}
        </div>
        <div style={{ fontSize: 11, color: "rgba(255,255,255,0.15)" }}>© 2025 GlowDesk</div>
      </div>
    </footer>
  );
}

function SectionDivider() {
  return <div style={{ height: 1, background: `linear-gradient(to right, transparent, ${T.border}, transparent)` }} />;
}

// ── Page ──────────────────────────────────────────────────────────────────────
export default function LandingPage() {
  const [plans, setPlans] = useState<PublicPlan[]>([]);

  useEffect(() => {
    fetch("/api/public/plans")
      .then(r => r.json())
      .then((data: PublicPlan[]) => setPlans(data))
      .catch(() => {});
  }, []);

  return (
    <div style={{ minHeight: "100vh", fontFamily: "'DM Sans', sans-serif" }}>
      <Navbar />
      <HeroSection />
      <StatsBar />
      <SectionDivider />
      <FeaturesSection />
      <SectionDivider />
      <HowItWorksSection />
      <SectionDivider />
      <PricingSection plans={plans} />
      <SectionDivider />
      <TestimonialsSection />
      <SectionDivider />
      <FaqSection />
      <BottomCta />
      <Footer />
    </div>
  );
}
