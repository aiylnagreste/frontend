// components/Sidebar.tsx
"use client";

import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { fetchBranches, fetchStaff, fetchGeneral, QK } from "@/lib/queries";
import type { Branch, Staff } from "@/lib/types";
import { BranchDrawer } from "@/components/settings/BranchDrawer";
import { StaffDrawer } from "@/components/settings/StaffDrawer";
import css from "./Sidebar.module.css";

export default function Sidebar() {
  const pathname = usePathname();
  const [bookingsOpen, setBookingsOpen] = useState(pathname.startsWith("/bookings"));
  const [showBranchDrawer, setShowBranchDrawer] = useState(false);
  const [showStaffDrawer, setShowStaffDrawer] = useState(false);

  // ──────────────────────────────────────────────────────────────
  // 1. Hydration Safety: isMounted pattern
  // ──────────────────────────────────────────────────────────────
  // Server: isMounted is always false.
  // Client: becomes true immediately on mount.
  const [isMounted, setIsMounted] = useState(false);

  const [branding, setBranding] = useState<{ logo: string | null; name: string }>({
    logo: null,
    name: "Salon",
  });

  useEffect(() => {
    // Run only on Client
    setIsMounted(true);

    // Load from LocalStorage instantly
    try {
      const cached = localStorage.getItem("salon_branding");
      if (cached) {
        setBranding(JSON.parse(cached));
      }
    } catch (e) {
      // Ignore
    }
  }, []);

  // ──────────────────────────────────────────────────────────────
  // Data Fetching
  // ──────────────────────────────────────────────────────────────
  const { data: branches = [] } = useQuery<Branch[]>({
    queryKey: QK.branches(),
    queryFn: fetchBranches,
    staleTime: 10 * 60 * 1000,
  });

  const { data: staff = [] } = useQuery<Staff[]>({
    queryKey: QK.staff(),
    queryFn: fetchStaff,
    staleTime: 10 * 60 * 1000,
  });

  const { data: general, isLoading: isGeneralLoading } = useQuery({
    queryKey: QK.general(),
    queryFn: fetchGeneral,
    staleTime: 10 * 60 * 1000,
  });

  // ──────────────────────────────────────────────────────────────
  // 2. Sync Data: When API loads, update State + LocalStorage
  // ──────────────────────────────────────────────────────────────
  useEffect(() => {
    if (general) {
      const newBranding = {
        logo: general.logo_data_uri ?? null,
        name: general.salon_name?.trim() || "Salon",
      };
      setBranding(newBranding);
      try {
        localStorage.setItem("salon_branding", JSON.stringify(newBranding));
      } catch (e) {
        // Storage might be full or disabled
      }
    }
  }, [general]);

  const isActive = (href: string) => pathname === href || pathname.startsWith(href + "/");

  function navigate(href: string) {
    window.location.href = href;
  }

  function handleBookingsClick() {
    if (branches.length === 0) {
      setShowBranchDrawer(true);
    } else {
      setBookingsOpen((o) => !o);
    }
  }

  function handleBranchSaved() {
    if (staff.length === 0) {
      setShowStaffDrawer(true);
    }
  }

  // ──────────────────────────────────────────────────────────────
  // 3. Render Logic
  // ──────────────────────────────────────────────────────────────
  // Show skeleton if: NOT mounted (Server) OR (Loading AND no cached data)
  const showSkeleton = !isMounted || (isGeneralLoading && !branding.logo);

  return (
    <aside className={css.sidebar}>
      {/* Background glow */}
      <div className={css.glow1} />
      <div className={css.glow2} />

      {/* Brand Block */}
      {showSkeleton ? (
        // Skeleton Loader (Server + Initial Client Paint)
        <div className={css.brand}>
          <div className={css.skeletonIcon} />
          <div className={css.skeletonRow}>
            <div className={css.skeletonTitle} />
            <div className={css.skeletonSub} />
          </div>
        </div>
      ) : (
        // Real Brand (Client only, after mount)
        <div className={css.brand}>
          <div className={`${css.brandIcon} ${branding.logo ? css["brandIcon--logo"] : ""}`}>
            {branding.logo ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={branding.logo}
                alt={`${branding.name} logo`}
                className={css.brandLogoImg}
              />
            ) : (
              <span>✨</span>
            )}
          </div>
          <div>
            <div className={css.brandTitle}>{branding.name}</div>
            <div className={css.brandSub}>Management Portal</div>
          </div>
        </div>
      )}

      {/* Navigation */}
      <nav className={css.nav}>
        <div className={css.sectionLabel}>Main</div>

        <NavItem
          icon="⊞"
          label="Dashboard"
          active={isActive("/dashboard")}
          onClick={() => navigate("/dashboard")}
        />

        {/* Bookings with sub-menu */}
        <div>
          <NavItem
            icon="📅"
            label="Bookings"
            active={isActive("/bookings")}
            onClick={handleBookingsClick}
            suffix={
              <span className={`${css.navItemChevron} ${bookingsOpen ? css["navItemChevron--open"] : css["navItemChevron--closed"]}`}>
                ▾
              </span>
            }
          />

          {bookingsOpen && (
            <div className={css.subItems}>
              {branches.map((b) => (
                <SubItem
                  key={b.id}
                  label={b.name}
                  active={pathname === `/bookings/${b.id}`}
                  onClick={() => navigate(`/bookings/${b.id}`)}
                />
              ))}
            </div>
          )}
        </div>

        <NavItem
          icon="💼"
          label="Staff"
          active={isActive("/staff")}
          onClick={() => navigate("/staff")}
        />

        <div className={css.sectionLabel}>Catalogue</div>

        <NavItem
          icon="✨"
          label="Packages & Prices"
          active={isActive("/packages")}
          onClick={() => navigate("/packages")}
        />
        <NavItem
          icon="🎁"
          label="Deals & Offers"
          active={isActive("/deals")}
          onClick={() => navigate("/deals")}
        />

        <div className={css.sectionLabel}>System</div>

        <NavItem
          icon="📊"
          label="Reports"
          active={isActive("/reports")}
          onClick={() => navigate("/reports")}
        />
        <NavItem
          icon="⚙️"
          label="Settings"
          active={isActive("/settings")}
          onClick={() => navigate("/settings")}
        />
      </nav>

      {/* Setup Drawers */}
      <BranchDrawer
        open={showBranchDrawer}
        onClose={() => setShowBranchDrawer(false)}
        editing={null}
        onSaved={handleBranchSaved}
      />
      <StaffDrawer
        open={showStaffDrawer}
        onClose={() => setShowStaffDrawer(false)}
        editing={null}
      />

      {/* Footer */}
      <div className={css.footer}>
        <button
          onClick={async () => {
            await fetch("/salon-admin/logout", { credentials: "include" }).catch(() => {});
            window.location.href = "/login";
          }}
          className={css.logoutBtn}
        >
          <span className={css.logoutBtnIcon}>↩</span>
          <span>Logout</span>
        </button>
      </div>
    </aside>
  );
}

/* ── NavItem ── */
function NavItem({
  icon,
  label,
  active,
  onClick,
  suffix,
}: {
  icon: string;
  label: string;
  active: boolean;
  onClick: () => void;
  suffix?: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={`${css.navItem} ${active ? css["navItem--active"] : ""}`}
    >
      <span className={css.navItemIcon}>{icon}</span>
      <span className={css.navItemLabel}>{label}</span>
      {suffix}
    </button>
  );
}

/* ── SubItem ── */
function SubItem({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`${css.subItem} ${active ? css["subItem--active"] : ""}`}
    >
      <span className={css.subItemBullet}>◈</span>
      <span style={{ textAlign: "left" }}>{label}</span>
    </button>
  );
}
