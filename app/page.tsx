// app/page.tsx
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Check, ChevronDown, ChevronUp } from "lucide-react";
import type { PublicPlan } from "@/lib/types";

// ─── Section Divider ──────────────────────────────────────────────────────────

function SectionDivider() {
  return (
    <div className="h-px bg-gradient-to-r from-transparent via-orange-200/50 to-transparent" />
  );
}

// ─── Navbar ──────────────────────────────────────────────────────────────────

function Navbar() {
  return (
    <nav className="sticky top-0 z-50 bg-white/90 backdrop-blur-md border-b border-black/[0.06]">
      <div className="max-w-6xl mx-auto px-6 py-3 flex items-center justify-between">
        <div className="text-[15px] font-extrabold text-indigo-950 flex items-center gap-1.5">
          🌸 GlowDesk
        </div>
        <div className="hidden md:flex items-center gap-6 text-sm text-gray-500">
          <a href="#features" className="hover:text-gray-800 transition-colors">Features</a>
          <a href="#how-it-works" className="hover:text-gray-800 transition-colors">How it Works</a>
          <a href="#pricing" className="hover:text-gray-800 transition-colors">Pricing</a>
          <a href="#faq" className="hover:text-gray-800 transition-colors">FAQ</a>
        </div>
        <div className="flex items-center gap-3">
          <Link href="/login" className="text-sm text-gray-500 hover:text-gray-800 transition-colors">
            Login
          </Link>
          <Link
            href="/register"
            className="text-sm font-bold text-white px-4 py-2 rounded-full bg-gradient-to-r from-orange-500 to-pink-500 hover:opacity-90 transition-opacity"
          >
            Start Free
          </Link>
        </div>
      </div>
    </nav>
  );
}

// ─── Hero ─────────────────────────────────────────────────────────────────────

function HeroSection() {
  return (
    <section className="relative bg-gradient-to-br from-orange-50 via-fuchsia-50 to-blue-50 py-24 px-6 text-center overflow-hidden">
      {/* Decorative blobs */}
      <div className="pointer-events-none absolute -top-20 -left-20 w-72 h-72 rounded-full bg-orange-200/30 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-20 -right-20 w-72 h-72 rounded-full bg-fuchsia-200/30 blur-3xl" />
      <div className="relative max-w-3xl mx-auto">
        <div className="animate-fade-in-up inline-block bg-orange-500/10 text-orange-600 text-xs font-semibold px-4 py-1.5 rounded-full mb-6 ring-1 ring-orange-200">
          ✨ Built for beauty businesses
        </div>
        <h1 className="animate-fade-in-up anim-delay-1 text-4xl md:text-5xl font-black text-indigo-950 leading-tight mb-5">
          Your salon,{" "}
          <span className="bg-gradient-to-r from-orange-500 to-pink-500 bg-clip-text text-transparent">
            beautifully managed
          </span>
        </h1>
        <p className="animate-fade-in-up anim-delay-2 text-lg text-gray-500 mb-8 max-w-xl mx-auto leading-relaxed">
          Bookings, WhatsApp, AI calls, staff, clients & analytics — all in one platform built for modern salons.
        </p>
        <div className="animate-fade-in-up anim-delay-3 flex flex-wrap items-center justify-center gap-3">
          <Link
            href="/register"
            className="text-sm font-bold text-white px-6 py-3 rounded-full bg-gradient-to-r from-orange-500 to-pink-500 hover:opacity-90 hover:scale-105 transition-all shadow-md shadow-orange-200"
          >
            Start Free Trial →
          </Link>
          <button className="text-sm font-semibold text-gray-700 bg-white border border-gray-200 px-6 py-3 rounded-full hover:bg-gray-50 hover:scale-105 transition-all shadow-sm">
            ▶ Watch 2-min demo
          </button>
        </div>
      </div>
    </section>
  );
}

// ─── Social Proof ─────────────────────────────────────────────────────────────

function SocialProofBar() {
  const stats = [
    { num: "200+", label: "Salons" },
    { num: "50k+", label: "Bookings / mo" },
    { num: "4.9★", label: "Avg Rating" },
    { num: "98%",  label: "Uptime" },
  ];
  return (
    <section className="bg-white border-b border-slate-100">
      <div className="max-w-4xl mx-auto px-6 py-8 flex flex-wrap justify-center gap-10">
        {stats.map((s) => (
          <div key={s.label} className="text-center">
            <div className="text-2xl font-black text-indigo-950">{s.num}</div>
            <div className="text-[10px] text-gray-400 uppercase tracking-widest mt-0.5">{s.label}</div>
          </div>
        ))}
      </div>
    </section>
  );
}

// ─── Features ─────────────────────────────────────────────────────────────────

function FeaturesSection() {
  const features = [
    { icon: "📅", title: "Smart Bookings",    desc: "Online booking with branch & staff selection, real-time availability." },
    { icon: "💬", title: "WhatsApp Chat",     desc: "Respond to clients directly from your dashboard via WhatsApp." },
    { icon: "🤖", title: "AI Voice Calls",    desc: "AI handles incoming calls, books appointments, answers queries 24/7." },
    { icon: "📊", title: "Analytics",         desc: "Revenue charts, top services, peak hours — know your numbers." },
    { icon: "👥", title: "Staff & Branches",  desc: "Manage multiple branches, staff roles, timings, and services." },
    { icon: "🎁", title: "Deals & Packages", desc: "Create offers and bundles to boost repeat business." },
  ];
  return (
    <section id="features" className="py-20 px-6">
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-12">
          <div className="text-xs font-bold text-orange-500 uppercase tracking-widest mb-2">Everything you need</div>
          <h2 className="text-3xl font-black text-indigo-950 mb-3">One platform. Every tool.</h2>
          <p className="text-gray-500">No more juggling 5 apps. GlowDesk brings it all together.</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {features.map((f) => (
            <div key={f.title} className="feature-card bg-gradient-to-br from-orange-50 to-fuchsia-50 rounded-xl p-6 border border-orange-100 cursor-default">
              <div className="text-3xl mb-3">{f.icon}</div>
              <h3 className="font-bold text-indigo-950 mb-1.5">{f.title}</h3>
              <p className="text-sm text-gray-500 leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── How It Works ─────────────────────────────────────────────────────────────

function HowItWorksSection() {
  const steps = [
    { num: 1, title: "Pick a Plan",      desc: "Choose what fits your salon size and budget." },
    { num: 2, title: "Set Up Your Salon", desc: "Add branches, staff, services and timings." },
    { num: 3, title: "Go Live",          desc: "Share your booking link. Clients book instantly." },
  ];
  return (
    <section id="how-it-works" className="bg-gradient-to-br from-orange-50 via-fuchsia-50 to-blue-50 py-20 px-6">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-12">
          <div className="text-xs font-bold text-orange-500 uppercase tracking-widest mb-2">Simple setup</div>
          <h2 className="text-3xl font-black text-indigo-950">Up and running in minutes</h2>
        </div>
        <div className="relative flex flex-col md:flex-row justify-center gap-8 md:gap-0">
          <div className="hidden md:block absolute top-6 left-1/4 right-1/4 h-0.5 bg-gradient-to-r from-orange-300 to-pink-300 opacity-50" />
          {steps.map((s) => (
            <div key={s.num} className="flex-1 text-center px-6 relative z-10">
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-orange-500 to-pink-500 text-white text-lg font-black flex items-center justify-center mx-auto mb-4 shadow-md">
                {s.num}
              </div>
              <h3 className="font-bold text-indigo-950 mb-2">{s.title}</h3>
              <p className="text-sm text-gray-500">{s.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── Pricing ──────────────────────────────────────────────────────────────────

function PlanFeature({ label, active }: { label: string; active: boolean }) {
  return (
    <li className={`flex items-center gap-2 text-sm ${active ? "text-gray-700" : "text-gray-300 line-through"}`}>
      <span className={active ? "text-orange-500" : "text-gray-300"}>
        {active ? <Check size={14} strokeWidth={3} /> : <span className="w-3.5 block" />}
      </span>
      {label}
    </li>
  );
}

function PricingSection({ plans }: { plans: PublicPlan[] }) {
  const isFree = (p: PublicPlan) => p.price_cents === 0;
  const cycleLabel = (p: PublicPlan) =>
    p.billing_cycle === "monthly" ? "/mo" : p.billing_cycle === "yearly" ? "/yr" : "";
  // Middle plan (index 1) gets the popular badge
  const popularIndex = plans.length === 3 ? 1 : -1;

  return (
    <section id="pricing" className="py-20 px-6">
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-12">
          <div className="text-xs font-bold text-orange-500 uppercase tracking-widest mb-2">Transparent pricing</div>
          <h2 className="text-3xl font-black text-indigo-950 mb-3">Plans for every salon</h2>
          <p className="text-gray-500">All plans include core booking features. Upgrade for AI & chat channels.</p>
        </div>

        {plans.length === 0 ? (
          <div className="text-center text-gray-400 py-12">Loading plans…</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {plans.map((p, i) => {
              const popular = i === popularIndex;
              return (
                <div
                  key={p.id}
                  className={`relative rounded-2xl p-6 border ${
                    popular
                      ? "border-orange-400 shadow-lg shadow-orange-100 ring-2 ring-orange-200"
                      : "border-slate-200 bg-white"
                  }`}
                >
                  {popular && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-gradient-to-r from-orange-500 to-pink-500 text-white text-[10px] font-bold px-3 py-1 rounded-full whitespace-nowrap">
                      ⭐ Most Popular
                    </div>
                  )}
                  <h3 className="font-bold text-indigo-950 text-base mb-1">{p.name}</h3>
                  <div className="text-3xl font-black text-indigo-950 mb-1">
                    {isFree(p) ? "Free" : `$${(p.price_cents / 100).toFixed(0)}`}
                    {!isFree(p) && <span className="text-sm font-normal text-gray-400 ml-1">{cycleLabel(p)}</span>}
                  </div>
                  {p.description && <p className="text-sm text-gray-500 mb-4">{p.description}</p>}
                  <ul className="space-y-2 mb-6">
                    <PlanFeature label={`Up to ${p.max_services} services`} active={true} />
                    <PlanFeature label="WhatsApp Chat" active={!!p.whatsapp_access} />
                    <PlanFeature label="Instagram Chat" active={!!p.instagram_access} />
                    <PlanFeature label="Facebook Chat"  active={!!p.facebook_access} />
                    <PlanFeature label="AI Voice Calls" active={!!p.ai_calls_access} />
                  </ul>
                  <Link
                    href={`/register?plan_id=${p.id}`}
                    className={`block w-full text-center text-sm font-bold py-2.5 rounded-lg transition-opacity ${
                      popular
                        ? "bg-gradient-to-r from-orange-500 to-pink-500 text-white hover:opacity-90"
                        : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                    }`}
                  >
                    {isFree(p) ? "Get Started Free" : "Start Free Trial"}
                  </Link>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}

// ─── Testimonials ─────────────────────────────────────────────────────────────

function TestimonialsSection() {
  const testimonials = [
    {
      stars: 5,
      quote: "GlowDesk transformed how we manage bookings. The AI calls feature alone saves us 2 hours a day.",
      name: "Ayesha Khan",
      role: "Owner, Royal Glam Studio · Lahore",
    },
    {
      stars: 5,
      quote: "Finally a system that actually understands the salon business. Setup took 20 minutes, not days.",
      name: "Sara Mahmood",
      role: "Owner, Luxe Hair Lounge · Karachi",
    },
    {
      stars: 5,
      quote: "The WhatsApp integration is seamless. Clients love being able to book through a simple chat.",
      name: "Nadia Rauf",
      role: "Owner, Bloom Beauty Bar · Islamabad",
    },
  ];
  return (
    <section className="bg-gradient-to-br from-fuchsia-50 to-blue-50 py-20 px-6">
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-12">
          <div className="text-xs font-bold text-orange-500 uppercase tracking-widest mb-2">Loved by salon owners</div>
          <h2 className="text-3xl font-black text-indigo-950">Real results, real salons</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {testimonials.map((t) => (
            <div key={t.name} className="testimonial-card bg-white rounded-xl p-6 border border-slate-100 shadow-sm">
              <div className="text-orange-400 text-sm mb-3">{"★".repeat(t.stars)}</div>
              <p className="text-sm text-gray-600 italic leading-relaxed mb-4">"{t.quote}"</p>
              <div className="text-sm font-bold text-indigo-950">{t.name}</div>
              <div className="text-xs text-gray-400">{t.role}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── FAQ ──────────────────────────────────────────────────────────────────────

const FAQ_ITEMS = [
  {
    q: "What's included in the free plan?",
    a: "The Starter plan includes online booking, up to 10 services, 1 branch, and basic analytics — completely free, forever.",
  },
  {
    q: "Can I cancel anytime?",
    a: "Yes. No contracts, no lock-in. Cancel from your dashboard anytime and you keep access until the end of your billing period.",
  },
  {
    q: "How does the AI voice calls feature work?",
    a: "Our AI answers incoming calls to your salon, books appointments, and handles common queries — 24/7, in natural language.",
  },
  {
    q: "Do I need technical skills to set up?",
    a: "None at all. Setup takes under 30 minutes. Add your services, staff, and branch details — we handle the rest.",
  },
];

function FaqSection() {
  const [open, setOpen] = useState<number | null>(null);
  return (
    <section id="faq" className="py-20 px-6">
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-12">
          <div className="text-xs font-bold text-orange-500 uppercase tracking-widest mb-2">Common questions</div>
          <h2 className="text-3xl font-black text-indigo-950">Frequently Asked</h2>
        </div>
        <div className="flex flex-col gap-3">
          {FAQ_ITEMS.map((item, i) => (
            <div key={i} className="bg-white rounded-xl border border-slate-100 overflow-hidden shadow-sm">
              <button
                onClick={() => setOpen(open === i ? null : i)}
                className="w-full flex items-center justify-between px-5 py-4 text-left"
              >
                <span className="font-semibold text-indigo-950 text-sm">{item.q}</span>
                {open === i ? <ChevronUp size={16} className="text-gray-400 flex-shrink-0" /> : <ChevronDown size={16} className="text-gray-400 flex-shrink-0" />}
              </button>
              {open === i && (
                <div className="px-5 pb-4 text-sm text-gray-500 leading-relaxed border-t border-slate-50">
                  <p className="pt-3">{item.a}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── Bottom CTA ───────────────────────────────────────────────────────────────

function BottomCta() {
  return (
    <section className="bg-gradient-to-br from-indigo-950 to-purple-900 py-20 px-6 text-center">
      <h2 className="text-3xl font-black text-white mb-3">Ready to grow your salon?</h2>
      <p className="text-white/60 mb-8 max-w-md mx-auto">
        Join 200+ salons already using GlowDesk. Start free, upgrade anytime.
      </p>
      <Link
        href="/register"
        className="inline-block text-sm font-bold text-white px-8 py-3 rounded-full bg-gradient-to-r from-orange-500 to-pink-500 hover:opacity-90 transition-opacity shadow-lg"
      >
        Start Free Trial →
      </Link>
    </section>
  );
}

// ─── Footer ───────────────────────────────────────────────────────────────────

function Footer() {
  return (
    <footer className="bg-slate-950 px-6 py-8">
      <div className="max-w-6xl mx-auto flex flex-wrap items-center justify-between gap-4">
        <div className="text-sm font-bold text-white/60">🌸 GlowDesk</div>
        <div className="flex items-center gap-6 text-xs text-white/30">
          <Link href="/login" className="hover:text-white/60 transition-colors">Login</Link>
          <a href="#" className="hover:text-white/60 transition-colors">Privacy Policy</a>
          <a href="#" className="hover:text-white/60 transition-colors">Terms</a>
          <a href="#" className="hover:text-white/60 transition-colors">Contact</a>
        </div>
        <div className="text-xs text-white/20">© 2025 GlowDesk</div>
      </div>
    </footer>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function LandingPage() {
  const [plans, setPlans] = useState<PublicPlan[]>([]);

  useEffect(() => {
    fetch("/api/public/plans")
      .then((r) => r.json())
      .then((data: PublicPlan[]) => setPlans(data))
      .catch(() => {});
  }, []);

  return (
    <div className="min-h-screen">
      <Navbar />
      <HeroSection />
      <SocialProofBar />
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
