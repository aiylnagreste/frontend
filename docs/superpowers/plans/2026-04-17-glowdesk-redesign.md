# GlowDesk Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Redesign the super admin portal with a dark sidebar layout and build the GlowDesk SaaS landing page at `/`.

**Architecture:** Phase 1 adds a shared `layout.tsx` for all super admin pages that renders a `SuperSidebar` + `SuperTopbar` shell — existing page content stays untouched except removing their standalone headers. Phase 2 replaces the null root `app/page.tsx` with the full GlowDesk marketing landing page and updates middleware so `/` serves the landing page to unauthenticated visitors.

**Tech Stack:** Next.js 15 App Router, TypeScript, Tailwind CSS, TanStack Query, lucide-react, sonner

---

## File Map

**Created:**
- `app/(super)/super-admin/layout.tsx` — sidebar + topbar shell wrapping all super admin pages
- `app/(super)/super-admin/components/SuperSidebar.tsx` — dark sidebar nav component
- `app/(super)/super-admin/components/SuperTopbar.tsx` — topbar with page title + breadcrumb

**Modified:**
- `app/(super)/super-admin/dashboard/page.tsx` — remove standalone header (lines 88–168)
- `middleware.ts` — (a) protect `/super-admin/plans` and `/super-admin/payments`; (b) let `/` pass through for unauthenticated users
- `app/page.tsx` — replace `return null` with full landing page
- `app/(public)/register/page.tsx` — read `?plan_id` query param to pre-select plan

---

## Phase 1 — Super Admin Sidebar

---

### Task 1: Create SuperSidebar component

**Files:**
- Create: `app/(super)/super-admin/components/SuperSidebar.tsx`

- [ ] **Step 1: Create the component**

```tsx
// app/(super)/super-admin/components/SuperSidebar.tsx
"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";

interface ResetRequest { tenantId: string }

const NAV = [
  {
    section: "Overview",
    items: [
      { href: "/super-admin/dashboard", icon: "🏠", label: "Dashboard" },
      { href: "/super-admin/salons", icon: "🏪", label: "Salons", badge: "salons" },
    ],
  },
  {
    section: "Billing",
    items: [
      { href: "/super-admin/plans", icon: "📋", label: "Plans" },
      { href: "/super-admin/payments", icon: "💳", label: "Payments" },
    ],
  },
  {
    section: "System",
    items: [
      { href: "/super-admin/dashboard#resets", icon: "🔔", label: "Reset Requests", badge: "resets" },
      { href: "/super-admin/change-password", icon: "🔑", label: "Change Password" },
    ],
  },
];

export function SuperSidebar() {
  const pathname = usePathname();

  const { data: resetRequests = [] } = useQuery<ResetRequest[]>({
    queryKey: ["resetRequests"],
    queryFn: async () => {
      const res = await fetch("/super-admin/api/reset-requests", { credentials: "include" });
      if (!res.ok) return [];
      return res.json();
    },
    staleTime: 30_000,
  });

  const { data: tenants = [] } = useQuery<unknown[]>({
    queryKey: ["tenants"],
    queryFn: async () => {
      const res = await fetch("/super-admin/api/tenants", { credentials: "include" });
      if (!res.ok) return [];
      return res.json();
    },
    staleTime: 30_000,
  });

  function getBadge(key: string): number | null {
    if (key === "resets") return resetRequests.length > 0 ? resetRequests.length : null;
    if (key === "salons") return tenants.length > 0 ? tenants.length : null;
    return null;
  }

  function isActive(href: string) {
    const base = href.split("#")[0];
    if (base === "/super-admin/dashboard") return pathname === base;
    return pathname.startsWith(base);
  }

  return (
    <aside className="flex flex-col w-[200px] min-h-screen bg-slate-900 flex-shrink-0">
      {/* Logo */}
      <div className="flex items-center gap-3 px-4 py-5 border-b border-white/[0.07]">
        <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-purple-400 to-indigo-400 flex items-center justify-center text-sm flex-shrink-0">
          ⚡
        </div>
        <div>
          <div className="text-sm font-bold text-white leading-tight">GlowDesk</div>
          <div className="text-[10px] text-white/30 mt-0.5">Super Admin</div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-2 py-3 flex flex-col gap-0.5">
        {NAV.map((group) => (
          <div key={group.section}>
            <div className="text-[9px] font-bold text-white/25 uppercase tracking-widest px-2 py-2 mt-2 first:mt-0">
              {group.section}
            </div>
            {group.items.map((item) => {
              const active = isActive(item.href);
              const badge = "badge" in item ? getBadge(item.badge as string) : null;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-xs transition-colors ${
                    active
                      ? "bg-purple-500/25 text-purple-300 font-semibold"
                      : "text-white/50 hover:bg-white/[0.06] hover:text-white/80"
                  }`}
                >
                  <span className="w-4 text-center text-sm flex-shrink-0">{item.icon}</span>
                  <span className="flex-1">{item.label}</span>
                  {badge !== null && (
                    <span className={`text-[9px] font-bold rounded-full px-1.5 py-0.5 ${
                      item.badge === "resets" ? "bg-red-500 text-white" : "bg-white/10 text-white/50"
                    }`}>
                      {badge}
                    </span>
                  )}
                </Link>
              );
            })}
          </div>
        ))}
      </nav>

      {/* Bottom: user + logout */}
      <div className="border-t border-white/[0.07] px-2 py-3 flex flex-col gap-0.5">
        <div className="flex items-center gap-2.5 px-2.5 py-2">
          <div className="w-7 h-7 rounded-full bg-gradient-to-br from-purple-400 to-indigo-400 flex items-center justify-center text-[11px] font-bold text-white flex-shrink-0">
            SA
          </div>
          <div className="min-w-0">
            <div className="text-[11px] font-semibold text-white/80 truncate">Super Admin</div>
            <div className="text-[9px] text-white/30 truncate">admin@glowdesk.io</div>
          </div>
        </div>
        <a
          href="/super-admin/logout"
          className="flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-xs text-red-400/70 hover:bg-red-500/10 hover:text-red-400 transition-colors"
        >
          <span className="w-4 text-center text-sm">🚪</span>
          <span>Logout</span>
        </a>
      </div>
    </aside>
  );
}
```

- [ ] **Step 2: Verify no TypeScript errors**

```bash
cd "d:/vs self code/frontend" && npx tsc --noEmit 2>&1 | head -30
```

Expected: no errors related to the new file (other pre-existing errors are ok to ignore).

---

### Task 2: Create SuperTopbar component

**Files:**
- Create: `app/(super)/super-admin/components/SuperTopbar.tsx`

- [ ] **Step 1: Create the component**

```tsx
// app/(super)/super-admin/components/SuperTopbar.tsx
"use client";

import { usePathname } from "next/navigation";

const PAGE_META: Record<string, { title: string; crumb: string }> = {
  "/super-admin/dashboard": { title: "Dashboard", crumb: "Super Admin → Overview" },
  "/super-admin/salons":    { title: "Salons",    crumb: "Super Admin → Salons" },
  "/super-admin/plans":     { title: "Plans",     crumb: "Super Admin → Billing → Plans" },
  "/super-admin/payments":  { title: "Payments",  crumb: "Super Admin → Billing → Payments" },
  "/super-admin/change-password": { title: "Change Password", crumb: "Super Admin → System" },
};

export function SuperTopbar() {
  const pathname = usePathname();
  const meta = PAGE_META[pathname] ?? { title: "Super Admin", crumb: "Super Admin" };

  return (
    <header className="flex items-center justify-between px-5 py-3 bg-white border-b border-slate-100 flex-shrink-0">
      <div>
        <h1 className="text-[15px] font-bold text-slate-900 leading-tight">{meta.title}</h1>
        <p className="text-[11px] text-slate-400 mt-0.5">{meta.crumb}</p>
      </div>
      <div className="flex items-center gap-2">
        <button className="w-8 h-8 rounded-lg bg-slate-50 border border-slate-200 flex items-center justify-center text-sm hover:bg-slate-100 transition-colors">
          🔔
        </button>
      </div>
    </header>
  );
}
```

- [ ] **Step 2: Verify no TypeScript errors**

```bash
cd "d:/vs self code/frontend" && npx tsc --noEmit 2>&1 | head -30
```

Expected: no new errors.

---

### Task 3: Create super admin layout

**Files:**
- Create: `app/(super)/super-admin/layout.tsx`

- [ ] **Step 1: Create the layout**

```tsx
// app/(super)/super-admin/layout.tsx
import { SuperSidebar } from "./components/SuperSidebar";
import { SuperTopbar } from "./components/SuperTopbar";

export default function SuperAdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen bg-slate-50">
      <SuperSidebar />
      <div className="flex flex-col flex-1 min-w-0">
        <SuperTopbar />
        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Run dev server and verify layout loads**

```bash
cd "d:/vs self code/frontend" && npm run dev
```

Open `http://localhost:3001/super-admin/login`, log in, then navigate to `/super-admin/dashboard`.

Expected: sidebar visible on the left, topbar at the top, existing dashboard content below — but the old header is still there (doubled). Fix that in the next task.

---

### Task 4: Remove standalone header from dashboard page

**Files:**
- Modify: `app/(super)/super-admin/dashboard/page.tsx`

The current page has a standalone header block (the `<div>` containing the title and nav links — roughly the block starting at the first inner `<div style={{ background: "#fff", padding: "20px 28px"...` after `<div style={{ maxWidth: "1400px"...`). Remove it. Also remove the outer wrapper `<div style={{ minHeight: "100vh", background: "#f4f7fc", padding: "24px 16px"...` and `<div style={{ maxWidth: "1400px", margin: "0 auto" }}>` — the layout now provides the shell.

- [ ] **Step 1: Replace the page's outer wrapper and header**

In `app/(super)/super-admin/dashboard/page.tsx`, change the `return` statement:

**Before (lines 78–168):**
```tsx
return (
  <div
    style={{
      minHeight: "100vh",
      background: "#f4f7fc",
      padding: "24px 16px",
      fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
    }}
  >
    <div style={{ maxWidth: "1400px", margin: "0 auto" }}>
      {/* Header */}
      <div
        style={{
          background: "#fff",
          padding: "20px 28px",
          borderRadius: "16px",
          marginBottom: "28px",
          boxShadow: "0 2px 8px rgba(0,0,0,0.05)",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: "16px",
        }}
      >
        <h1 style={{ fontSize: "24px", fontWeight: 700, color: "#1e2a5e", margin: 0 }}>
          🏢 Super Admin Portal
        </h1>
        <div style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
          <a href="/super-admin/plans" style={{ background: "#eff6ff", color: "#1d4ed8", padding: "8px 16px", textDecoration: "none", borderRadius: "40px", fontWeight: 500, fontSize: "13px", border: "1px solid #bfdbfe" }}>
            📋 Plans
          </a>
          <a href="/super-admin/payments" style={{ background: "#eff6ff", color: "#1d4ed8", padding: "8px 16px", textDecoration: "none", borderRadius: "40px", fontWeight: 500, fontSize: "13px", border: "1px solid #bfdbfe" }}>
            💳 Payments
          </a>
          <button onClick={() => setShowChangePwd(true)} style={{ background: "#f0fdf4", color: "#166534", padding: "8px 16px", border: "1px solid #bbf7d0", borderRadius: "40px", cursor: "pointer", fontSize: "13px", fontWeight: 500 }}>
            🔑 Change Password
          </button>
          <a href="/super-admin/logout" style={{ background: "#f1f3f5", color: "#c0392b", padding: "8px 20px", textDecoration: "none", borderRadius: "40px", fontWeight: 500, fontSize: "13px", border: "1px solid #ffe2df" }}>
            🚪 Logout
          </a>
        </div>
      </div>

      {/* Stats Cards ... rest of content */}
```

**After:**
```tsx
return (
  <div style={{ padding: "24px 28px", fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif" }}>
    {/* Stats Cards ... rest of content stays exactly the same */}
```

The closing `</div></div>` at the bottom (the two outer wrappers) becomes a single `</div>`.

- [ ] **Step 2: Also remove the ChangeSuperPasswordModal trigger from the header**

The `setShowChangePwd` button was in the removed header. The modal `{showChangePwd && <ChangeSuperPasswordModal ... />}` at the bottom of the return stays — we just no longer have a button to open it from the header. The sidebar links to `/super-admin/change-password` (a future page). For now, remove the dead state variables to keep the code clean:

Remove `const [showChangePwd, setShowChangePwd] = useState(false);` from the top of `SuperDashboardPage`.

Remove `{showChangePwd && (<ChangeSuperPasswordModal onClose={() => setShowChangePwd(false)} />)}` from the JSX.

Keep `ChangeSuperPasswordModal` function in the file — it will be used by a dedicated change-password page later.

- [ ] **Step 3: Verify dashboard page in browser**

Navigate to `http://localhost:3001/super-admin/dashboard`.

Expected: sidebar on left, topbar at top showing "Dashboard / Super Admin → Overview", stats cards and table render cleanly below — no duplicate header.

- [ ] **Step 4: Commit Phase 1 so far**

```bash
cd "d:/vs self code/frontend" && git add app/\(super\)/super-admin/ && git commit -m "feat: add super admin sidebar layout and topbar"
```

---

### Task 5: Update middleware to protect plans and payments

**Files:**
- Modify: `middleware.ts`

Currently only `/super-admin/dashboard` is in `SUPER_PROTECTED`. Plans and payments must also require auth.

- [ ] **Step 1: Update SUPER_PROTECTED array**

In `middleware.ts`, change:

```ts
const SUPER_PROTECTED = ["/super-admin/dashboard"];
```

To:

```ts
const SUPER_PROTECTED = [
  "/super-admin/dashboard",
  "/super-admin/plans",
  "/super-admin/payments",
  "/super-admin/change-password",
];
```

- [ ] **Step 2: Add plans and payments to matcher config**

In the `config.matcher` array at the bottom of `middleware.ts`, add:

```ts
"/super-admin/plans",
"/super-admin/plans/:path*",
"/super-admin/payments",
"/super-admin/payments/:path*",
```

- [ ] **Step 3: Verify protection works**

Open an incognito window, navigate to `http://localhost:3001/super-admin/plans`.

Expected: redirected to `/super-admin/login`.

- [ ] **Step 4: Commit**

```bash
cd "d:/vs self code/frontend" && git add middleware.ts && git commit -m "fix: protect super-admin plans and payments routes in middleware"
```

---

### Task 5b: Create change-password page

**Files:**
- Create: `app/(super)/super-admin/change-password/page.tsx`

The sidebar links to `/super-admin/change-password`. The `ChangeSuperPasswordModal` function was preserved in the dashboard file — extract its form into a standalone page.

- [ ] **Step 1: Create the page**

```tsx
// app/(super)/super-admin/change-password/page.tsx
"use client";

import { useState } from "react";
import { api } from "@/lib/api";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

export default function ChangePasswordPage() {
  const router = useRouter();
  const [form, setForm] = useState({ currentPassword: "", newPassword: "", confirmPassword: "" });
  const [loading, setLoading] = useState(false);

  async function handleSave() {
    if (form.newPassword.length < 6) { toast.error("Password must be at least 6 characters"); return; }
    if (form.newPassword !== form.confirmPassword) { toast.error("Passwords do not match"); return; }
    setLoading(true);
    try {
      await api.put("/super-admin/api/change-password", {
        currentPassword: form.currentPassword,
        newPassword: form.newPassword,
      });
      toast.success("Password changed successfully");
      router.push("/super-admin/dashboard");
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Failed to change password");
    } finally {
      setLoading(false);
    }
  }

  const fields = [
    { key: "currentPassword" as const, label: "Current Password" },
    { key: "newPassword" as const, label: "New Password" },
    { key: "confirmPassword" as const, label: "Confirm New Password" },
  ];

  return (
    <div className="p-6 max-w-md">
      <p className="text-sm text-slate-500 mb-6">Update your super admin account password.</p>
      <div className="bg-white rounded-xl border border-slate-200 p-6 flex flex-col gap-4 shadow-sm">
        {fields.map((f) => (
          <div key={f.key}>
            <label className="block text-xs font-semibold text-slate-600 mb-1.5">{f.label}</label>
            <input
              type="password"
              value={form[f.key]}
              onChange={(e) => setForm((prev) => ({ ...prev, [f.key]: e.target.value }))}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm outline-none focus:border-violet-400 focus:ring-1 focus:ring-violet-400 transition-colors"
            />
          </div>
        ))}
        <div className="flex gap-3 pt-2">
          <button
            onClick={() => router.back()}
            className="px-4 py-2 text-sm rounded-lg text-slate-600 bg-slate-100 hover:bg-slate-200 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={loading}
            className="flex-1 py-2 text-sm font-semibold rounded-lg bg-slate-900 text-white hover:bg-slate-800 disabled:opacity-50 transition-colors"
          >
            {loading ? "Saving…" : "Update Password"}
          </button>
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Remove ChangeSuperPasswordModal from dashboard**

In `app/(super)/super-admin/dashboard/page.tsx`, delete the entire `ChangeSuperPasswordModal` function (lines ~502–549) since it is now replaced by the page above.

Also remove the `showChangePwd` state and its modal render if not already done in Task 4.

- [ ] **Step 3: Verify in browser**

Navigate to `http://localhost:3001/super-admin/change-password`.

Expected: form renders inside the sidebar layout. Submitting with mismatched passwords shows error toast.

- [ ] **Step 4: Commit**

```bash
cd "d:/vs self code/frontend" && git add app/\(super\)/super-admin/change-password/ app/\(super\)/super-admin/dashboard/page.tsx && git commit -m "feat: add change-password page for super admin"
```

---

## Phase 2 — GlowDesk Landing Page

---

### Task 6: Update middleware for root route

**Files:**
- Modify: `middleware.ts`

Currently `/` always redirects — either to `/dashboard` or `/login`. For the landing page, unauthenticated visitors must see the landing page instead of being sent to `/login`.

- [ ] **Step 1: Update the root route handler**

In `middleware.ts`, change:

```ts
// Redirect root to dashboard or login
if (pathname === "/") {
  const tenantToken = req.cookies.get("tenantToken");
  return NextResponse.redirect(
    new URL(tenantToken ? "/dashboard" : "/login", req.url),
  );
}
```

To:

```ts
// Root: authenticated tenants go to dashboard, guests see the landing page
if (pathname === "/") {
  const tenantToken = req.cookies.get("tenantToken");
  if (tenantToken) return NextResponse.redirect(new URL("/dashboard", req.url));
  return NextResponse.next();
}
```

- [ ] **Step 2: Verify in browser**

Open incognito, navigate to `http://localhost:3001/`.

Expected: page loads (currently shows blank/null render from `app/page.tsx` — that's fine, landing page comes next).

Logged-in tenant navigating to `/` should still redirect to `/dashboard`.

---

### Task 7: Build the GlowDesk landing page

**Files:**
- Modify: `app/page.tsx`

This is the full landing page. Replace the entire file.

- [ ] **Step 1: Write the landing page**

```tsx
// app/page.tsx
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Check, ChevronDown, ChevronUp, MessageCircle, Share2, Users, Phone } from "lucide-react";
import type { PublicPlan } from "@/lib/types";

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
    <section className="bg-gradient-to-br from-orange-50 via-fuchsia-50 to-blue-50 py-20 px-6 text-center">
      <div className="max-w-3xl mx-auto">
        <div className="inline-block bg-orange-500/10 text-orange-600 text-xs font-semibold px-4 py-1.5 rounded-full mb-6">
          ✨ Built for beauty businesses
        </div>
        <h1 className="text-4xl md:text-5xl font-black text-indigo-950 leading-tight mb-5">
          Your salon,{" "}
          <span className="bg-gradient-to-r from-orange-500 to-pink-500 bg-clip-text text-transparent">
            beautifully managed
          </span>
        </h1>
        <p className="text-lg text-gray-500 mb-8 max-w-xl mx-auto">
          Bookings, WhatsApp, AI calls, staff, clients & analytics — all in one platform built for modern salons.
        </p>
        <div className="flex flex-wrap items-center justify-center gap-3">
          <Link
            href="/register"
            className="text-sm font-bold text-white px-6 py-3 rounded-full bg-gradient-to-r from-orange-500 to-pink-500 hover:opacity-90 transition-opacity shadow-md"
          >
            Start Free Trial →
          </Link>
          <button className="text-sm font-semibold text-gray-700 bg-white border border-gray-200 px-6 py-3 rounded-full hover:bg-gray-50 transition-colors shadow-sm">
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
            <div key={f.title} className="bg-gradient-to-br from-orange-50 to-fuchsia-50 rounded-xl p-5 border border-orange-100">
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
            <div key={t.name} className="bg-white rounded-xl p-6 border border-slate-100 shadow-sm">
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
      <FeaturesSection />
      <HowItWorksSection />
      <PricingSection plans={plans} />
      <TestimonialsSection />
      <FaqSection />
      <BottomCta />
      <Footer />
    </div>
  );
}
```

- [ ] **Step 2: Verify in browser**

Navigate to `http://localhost:3001/` (in incognito).

Expected: full landing page with navbar, hero, stats bar, features grid, how-it-works, pricing cards, testimonials, FAQ accordion, bottom CTA, footer. Pricing cards show "Loading plans…" until `/api/public/plans` responds (dev server must be proxying to the Express backend).

- [ ] **Step 3: Commit**

```bash
cd "d:/vs self code/frontend" && git add app/page.tsx middleware.ts && git commit -m "feat: add GlowDesk landing page and update middleware for root route"
```

---

### Task 8: Pre-select plan from landing page

**Files:**
- Modify: `app/(public)/register/page.tsx`

When a user clicks "Start Free Trial" on a pricing card, they land on `/register?plan_id=2`. The register page should auto-select that plan.

- [ ] **Step 1: Read plan_id from URL and pre-select**

At the top of `RegisterPage`, add:

```tsx
import { useSearchParams } from "next/navigation";
```

Inside the component, after the existing `useEffect` that fetches plans, add:

```tsx
const searchParams = useSearchParams();

// Pre-select plan from URL query param (e.g. /register?plan_id=2)
useEffect(() => {
  if (plans.length === 0) return;
  const planIdParam = searchParams.get("plan_id");
  if (!planIdParam) return;
  const planId = parseInt(planIdParam, 10);
  const match = plans.find((p) => p.id === planId);
  if (match && !selectedPlan) setSelectedPlan(match);
}, [plans, searchParams]);
```

- [ ] **Step 2: Wrap RegisterPage in Suspense**

`useSearchParams()` requires a Suspense boundary. In `app/(public)/register/page.tsx`, the export should wrap the component:

```tsx
import { Suspense } from "react";

function RegisterPageContent() {
  // ... all the existing RegisterPage code ...
}

export default function RegisterPage() {
  return (
    <Suspense>
      <RegisterPageContent />
    </Suspense>
  );
}
```

Rename the existing `export default function RegisterPage` to `function RegisterPageContent`.

- [ ] **Step 3: Verify pre-selection works**

Navigate to `http://localhost:3001/register?plan_id=1`.

Expected: plan with id=1 is already highlighted on step 1. User can click Continue directly.

- [ ] **Step 4: Final commit**

```bash
cd "d:/vs self code/frontend" && git add app/\(public\)/register/page.tsx && git commit -m "feat: pre-select plan on register page from URL query param"
```

---

## Verification Checklist

After all tasks are complete, verify:

- [ ] `/super-admin/dashboard` — sidebar visible, no duplicate header, stats and table load correctly
- [ ] `/super-admin/plans` — sidebar visible, plan cards load, drawer opens for create/edit
- [ ] `/super-admin/payments` — sidebar visible, subscriptions table loads
- [ ] Navigating between super admin pages — active nav item highlights correctly
- [ ] Reset request badge in sidebar shows count when requests exist
- [ ] `/super-admin/plans` and `/super-admin/payments` redirect to `/super-admin/login` when not authenticated (incognito)
- [ ] `/` in incognito — landing page renders, all sections visible
- [ ] `/` logged in as tenant — redirects to `/dashboard`
- [ ] Pricing section — plan cards load from API, "Most Popular" badge on middle plan
- [ ] `/register?plan_id=2` — plan 2 is pre-selected on load
- [ ] FAQ accordion — items expand and collapse correctly
- [ ] Navbar links scroll to sections smoothly
