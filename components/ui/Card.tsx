import { cn } from "@/lib/utils";
import type { CSSProperties, ReactNode } from "react";

interface CardProps {
  children: ReactNode;
  className?: string;
  style?: CSSProperties;
}

export function Card({ children, className, style }: CardProps) {
  return (
    <div
      className={cn(className)}
      style={{
        background: "var(--color-surface)",
        border: "1px solid var(--color-border)",
        borderRadius: "var(--radius-md)",
        boxShadow: "var(--shadow-sm)",
        ...style,
      }}
    >
      {children}
    </div>
  );
}

export function CardHeader({
  children,
  className,
  style,
}: CardProps) {
  return (
    <div
      className={cn(className)}
      style={{
        padding: "16px 20px",
        borderBottom: "1px solid var(--color-border)",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: "12px",
        ...style,
      }}
    >
      {children}
    </div>
  );
}

export function CardContent({ children, className, style }: CardProps) {
  return (
    <div
      className={cn(className)}
      style={{ padding: "20px", ...style }}
    >
      {children}
    </div>
  );
}
