import { cn } from "@/lib/utils";

const STATUS_STYLES: Record<string, { bg: string; color: string }> = {
  confirmed:  { bg: "#dcfce7", color: "#16a34a" },
  completed:  { bg: "#dbeafe", color: "#1d4ed8" },
  canceled:   { bg: "#fee2e2", color: "#dc2626" },
  no_show:    { bg: "#f3f4f6", color: "#6b7280" },
  archived:   { bg: "#f3f4f6", color: "#9ca3af" },
  active:     { bg: "#dcfce7", color: "#16a34a" },
  inactive:   { bg: "#fee2e2", color: "#dc2626" },
  suspended:  { bg: "#fee2e2", color: "#dc2626" },
  pending:    { bg: "#fef3c7", color: "#d97706" },
};

interface BadgeProps {
  status: string;
  label?: string;
  className?: string;
}

export function Badge({ status, label, className }: BadgeProps) {
  const style = STATUS_STYLES[status] ?? { bg: "#f3f4f6", color: "#6b7280" };
  const text = label ?? status.replace("_", "-");

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
        display: "inline-block",
      }}
    >
      {text}
    </span>
  );
}
