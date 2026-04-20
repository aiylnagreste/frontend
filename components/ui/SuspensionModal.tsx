"use client";

import type { SuspensionReason } from "@/lib/types";

type Props = { salonName?: string; reason?: SuspensionReason };

function getCopy(reason: SuspensionReason | undefined, salonName?: string) {
  const who = salonName ? `${salonName}'s account` : "Your salon account";
  
  switch (reason) {
    case "subscription_expired":
      return {
        icon: "⏰",
        title: "Subscription Expired",
        body: `${who} is paused because your subscription has expired. Renew your plan to restore access.`,
        ctaLabel: "Renew Subscription",
        ctaHref: "mailto:support@glowdesk.app?subject=Renew%20Subscription",
      };
    case "plan_deactivated":
      return {
        icon: "📋",
        title: "Plan Discontinued",
        body: `${who}'s plan is no longer available. Please contact support to move to a new plan.`,
        ctaLabel: "Contact Support",
        ctaHref: "mailto:support@glowdesk.app?subject=Plan%20Discontinued",
      };
    case "suspended":
    case "not_found":
    default:
      return {
        icon: "🔒",
        title: "Account Suspended",
        body: `${who} has been suspended. All actions are currently disabled. Please contact support to restore access.`,
        ctaLabel: "Contact Support",
        ctaHref: "mailto:support@glowdesk.app",
      };
  }
}

export function SuspensionModal({ salonName, reason }: Props) {
  const copy = getCopy(reason, salonName);
  
  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 50,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "rgba(17, 19, 24, 0.6)",
        backdropFilter: "blur(4px)",
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: "420px",
          margin: "0 16px",
          background: "#fff",
          borderRadius: 16,
          padding: "32px",
          boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)",
        }}
      >
        {/* Icon Container */}
        <div
          style={{
            width: 56,
            height: 56,
            borderRadius: "50%",
            background: "linear-gradient(135deg, rgba(181,72,75,0.12), rgba(107,48,87,0.08))",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            margin: "0 auto 24px auto",
            fontSize: "24px",
          }}
        >
          {copy.icon}
        </div>

        {/* Title */}
        <h2
          id="suspension-title"
          style={{
            fontFamily: "'Space Grotesk', sans-serif",
            fontSize: "20px",
            fontWeight: 700,
            color: "#1A1D23",
            letterSpacing: "-0.02em",
            textAlign: "center",
            margin: 0,
            marginBottom: "8px",
          }}
        >
          {copy.title}
        </h2>

        {/* Body Text */}
        <p
          style={{
            fontSize: "14px",
            color: "#5F6577",
            textAlign: "center",
            lineHeight: 1.6,
            margin: 0,
            marginBottom: "24px",
          }}
        >
          {copy.body}
        </p>

        {/* CTA Button */}
        <a
          //href={copy.ctaHref}
           href='#'
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            width: "100%",
            padding: "12px",
            background: "linear-gradient(135deg, #b5484b, #6b3057)",
            color: "#fff",
            borderRadius: 8,
            fontSize: "14px",
            fontWeight: 600,
            fontFamily: "'DM Sans', sans-serif",
            textDecoration: "none",
            boxShadow: "0 4px 14px rgba(181,72,75,0.25)",
            transition: "all 0.2s",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = "translateY(-1px)";
            e.currentTarget.style.boxShadow = "0 6px 20px rgba(181,72,75,0.35)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = "translateY(0)";
            e.currentTarget.style.boxShadow = "0 4px 14px rgba(181,72,75,0.25)";
          }}
        >
          {copy.ctaLabel}
        </a>
      </div>
    </div>
  );
}