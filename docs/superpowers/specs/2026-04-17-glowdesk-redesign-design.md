# GlowDesk Redesign — Design Spec
**Date:** 2026-04-17  
**Scope:** Two independent redesigns — Super Admin Portal (sidebar layout) + Public Landing Page (full SaaS landing)

---

## 1. Super Admin Portal Redesign

### Goal
Replace the current header-nav layout with a persistent dark wide sidebar. Navigation moves from scattered header buttons into a structured left sidebar. All 4 existing pages (Dashboard, Salons, Plans, Payments) become children of a shared layout.

### Layout Shell
A new `app/(super)/super-admin/layout.tsx` wraps all super admin pages. It renders:

```
┌──────────────────────────────────────────┐
│  Sidebar (200px fixed)  │  Main content   │
│  ─────────────────────  │  ─────────────  │
│  Logo + brand           │  Topbar         │
│  Nav items              │  Page content   │
│  ─────────────────────  │                 │
│  User info + logout     │                 │
└──────────────────────────────────────────┘
```

### Sidebar Design
- **Background:** `#0f172a` (deep slate)
- **Width:** 200px, fixed, full height
- **Brand area:** Icon (purple gradient) + "GlowDesk" + "Super Admin" subtitle
- **Nav sections:**
  - *Overview:* Dashboard, Salons (with active tenant count badge)
  - *Billing:* Plans, Payments
  - *System:* Reset Requests (red badge when pending), Change Password
- **Active state:** `rgba(139,92,246,0.25)` background + `#c4b5fd` text
- **Bottom:** Avatar + admin name/email + Logout button (red tint)

### Topbar
- White, border-bottom `#f1f5f9`
- Left: page title (bold) + breadcrumb (e.g. "Super Admin → Overview")
- Right: notification bell + contextual action button (e.g. "+ New Salon" on dashboard)

### Page Changes
Each existing page sheds its standalone header. The content area renders as-is — only the outer wrapper is replaced by the shared layout. Inline styles on the dashboard page can be left alone; the sidebar/topbar provide the chrome.

### Color Palette (Admin)
| Token | Value |
|-------|-------|
| Sidebar bg | `#0f172a` |
| Active nav | `rgba(139,92,246,0.25)` bg / `#c4b5fd` text |
| Brand gradient | `linear-gradient(135deg, #c084fc, #818cf8)` |
| Topbar bg | `#ffffff` |
| Content bg | `#f8fafc` |

---

## 2. GlowDesk Landing Page

### Goal
Replace the minimal `/register` page with a full SaaS marketing landing page. The landing page markets GlowDesk, shows plans live from the API, and funnels visitors into the existing register flow.

### Route
`app/page.tsx` — the landing page replaces the current root page (which renders null and redirects). The existing `/register` page stays as-is for the actual sign-up flow. Plan cards on the landing page link to `/register?plan_id=<id>` (pre-selecting the plan).

**Middleware update required:** Currently `/` redirects unauthenticated users to `/login`. Change to: if `tenantToken` present → redirect `/dashboard`; if no token → let through (serve landing page). Remove `/login` as the unauthenticated `/` destination.

> Alternative considered: embed register inline on landing page. Rejected — keeps the landing page focused on conversion, register page focused on data capture. Simpler implementation.

### Visual Style
- **Background:** warm gradient `linear-gradient(160deg, #fff7ed 0%, #fdf4ff 50%, #eff6ff 100%)`
- **Accent:** `linear-gradient(135deg, #f97316, #ec4899)` (orange → pink)
- **Text primary:** `#1e1b4b`
- **Text secondary:** `#6b7280`
- **CTA buttons:** gradient accent, pill shape (`border-radius: 9999px`)

### Sections (top to bottom)

#### 1. Navbar
Sticky, frosted glass (`backdrop-filter: blur(8px)`), white bg at 90% opacity.  
- Left: 🌸 GlowDesk logo
- Center: Features · How it Works · Pricing · FAQ (smooth scroll anchors)
- Right: Login link + "Start Free" gradient CTA button

#### 2. Hero
Full-width, warm gradient bg.
- Eyebrow badge: "✨ Built for beauty businesses"
- H1: "Your salon, **beautifully managed**" — "beautifully managed" in gradient text
- Subtext: feature summary line
- CTAs: "Start Free Trial →" (primary) + "▶ Watch 2-min demo" (secondary ghost)

#### 3. Social Proof Bar
White strip with 4 stats: `200+ Salons · 50k+ Bookings/mo · 4.9★ Avg Rating · 98% Uptime`  
Placeholder values — replace when real data is available.

#### 4. Features Grid
6-card grid (3×2), warm gradient card bg.  
Cards: Smart Bookings, WhatsApp Chat, AI Voice Calls, Analytics, Staff & Branches, Deals & Packages.  
Each: emoji icon + title + 1-line description.

#### 5. How It Works
3-step visual with numbered circles connected by a gradient line.  
Steps: Pick a Plan → Set Up Your Salon → Go Live.

#### 6. Pricing
**Live data from `/api/public/plans`.** Cards rendered the same way as the existing register page plan cards, but with a cleaner card design matching the landing page theme.  
- Most-popular plan gets a "⭐ Most Popular" badge (the plan with highest `price_cents` below max, or manually flagged — use middle plan by default)
- CTA on each card: "Get Started" → `/register?plan_id=<id>`

#### 7. Testimonials
3 testimonial cards, warm gradient section bg. Placeholder content — 3 Pakistani salon owner quotes. Structure: stars + quote + name + role/city.

#### 8. FAQ
4 accordion items. Questions: free plan contents, cancellation, AI calls explanation, setup difficulty.  
Uses simple `useState` toggle — no external accordion library.

#### 9. Bottom CTA Banner
Deep indigo bg (`#1e1b4b` → `#4c1d95` gradient), centered "Ready to grow your salon?" + primary CTA.

#### 10. Footer
Dark bg (`#0f172a`). Logo left, links center (Login · Privacy · Terms · Contact), copyright right.

### Register Page Integration
The existing `/register` page is **not replaced** — it becomes the second step after landing page interest.  
`/register?plan_id=123` pre-selects that plan, skipping the plan selection step (or auto-selecting it).

---

## 3. Implementation Notes

### New Files
- `app/(super)/super-admin/layout.tsx` — shared sidebar+topbar shell
- `app/(super)/super-admin/components/SuperSidebar.tsx` — sidebar component
- `app/(super)/super-admin/components/SuperTopbar.tsx` — topbar component
- `app/(public)/page.tsx` — landing page (replaces or creates root public page)

### Modified Files
- `app/(super)/super-admin/dashboard/page.tsx` — remove standalone header
- `app/(super)/super-admin/plans/page.tsx` — remove standalone header (already clean)
- `app/(super)/super-admin/payments/page.tsx` — already clean, minor wrapper tweak
- `middleware.ts` — verify `/` route handling doesn't block public landing page
- `app/(public)/register/page.tsx` — accept `?plan_id` query param to pre-select plan

### Tailwind vs Inline Styles
- New landing page: Tailwind classes (consistent with plans/payments pages)
- Admin sidebar/topbar: Tailwind classes
- Existing dashboard page inline styles: leave untouched (only outer shell changes)

### No Backend Changes Needed
All data for both pages comes from existing APIs:
- `/api/public/plans` — landing page pricing section
- All super admin APIs — unchanged, just re-wrapped in new layout

---

## 4. Out of Scope
- Dark mode
- Mobile/responsive layout (desktop-first, same as current)
- Real testimonial/stats data
- Animated transitions beyond CSS hover states
- A/B testing or analytics integration
