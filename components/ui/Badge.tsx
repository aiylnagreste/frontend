
import { cn } from "@/lib/utils";
import styles from "./Badge.module.css";

const KNOWN_STATUSES = new Set([
  "confirmed",
  "arrived",
  "completed",
  "canceled",
  "no_show",
  "archived",
  "active",
  "inactive",
  "suspended",
  "pending",
  "frozen",
  "warning",
]);

interface BadgeProps {
  status: string;
  label?: string;
  className?: string;
}

export function Badge({ status, label, className }: BadgeProps) {
  const text = label ?? status.replace(/_/g, " ");
  const modifierKey = KNOWN_STATUSES.has(status) ? status : null;
  const modifierClass = modifierKey ? styles[`badge--${modifierKey}`] : undefined;

  return (
    <span className={cn(styles.badge, modifierClass, className)}>
      <span className={styles.badge__dot} />
      {text}
    </span>
  );
}
