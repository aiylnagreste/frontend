"use client";

import type { SuspensionReason } from "@/lib/types";
import styles from "./SuspensionModal.module.css";

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
    <div className={styles.overlay}>
      <div className={styles.card}>
        {/* Icon Container */}
        <div className={styles.iconWrap}>{copy.icon}</div>

        {/* Title */}
        <h2 id="suspension-title" className={styles.title}>{copy.title}</h2>

        {/* Body Text */}
        <p className={styles.body}>{copy.body}</p>

        {/* CTA Button */}
        <a
          //href={copy.ctaHref}
          href="#"
          className={styles.cta}
        >
          {copy.ctaLabel}
        </a>
      </div>
    </div>
  );
}
