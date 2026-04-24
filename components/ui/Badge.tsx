
import { cn } from "@/lib/utils";

const STATUS_STYLES: Record<string, { bg: string; color: string; dot: string }> = {
  confirmed:  { bg: "#dcfce7", color: "#15803d", dot: "#22c55e" },
  arrived:    { bg: "#fef3c7", color: "#92400e", dot: "#f59e0b" },
  completed:  { bg: "#dbeafe", color: "#1e40af", dot: "#3b82f6" },
  canceled:   { bg: "#fee2e2", color: "#b91c1c", dot: "#ef4444" },
  no_show:    { bg: "#f1f5f9", color: "#475569", dot: "#94a3b8" },
  archived:   { bg: "#f1f5f9", color: "#64748b", dot: "#94a3b8" },
  active:     { bg: "#dcfce7", color: "#15803d", dot: "#22c55e" },
  inactive:   { bg: "#fee2e2", color: "#b91c1c", dot: "#ef4444" },
  suspended:  { bg: "#fef3c7", color: "#92400e", dot: "#f59e0b" },
  pending:    { bg: "#fef3c7", color: "#92400e", dot: "#f59e0b" },
  frozen:     { bg: "#f1f5f9", color: "#475569", dot: "#94a3b8" },
  warning:    { bg: "#fef3c7", color: "#92400e", dot: "#f59e0b" },
};

interface BadgeProps {
  status: string;
  label?: string;
  className?: string;
}

export function Badge({ status, label, className }: BadgeProps) {
  const style = STATUS_STYLES[status] ?? { bg: "#f1f5f9", color: "#475569", dot: "#94a3b8" };
  const text = label ?? status.replace(/_/g, " ");

  return (
    <span
      className={cn(className)}
      style={{
        background: style.bg,
        color: style.color,
        fontSize: "11px",
        fontWeight: 600,
        padding: "3px 10px",
        borderRadius: "100px",
        textTransform: "capitalize",
        whiteSpace: "nowrap",
        display: "inline-flex",
        alignItems: "center",
        gap: "5px",
        letterSpacing: "0.01em",
      }}
    >
      <span
        style={{
          width: 6,
          height: 6,
          borderRadius: "50%",
          background: style.dot,
          flexShrink: 0,
        }}
      />
      {text}
    </span>
  );
}