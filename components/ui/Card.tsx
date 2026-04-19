// components/ui/Card.tsx
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
        background: "#fff",
        border: "1px solid #E6E4DF",
        borderRadius: "10px",
        boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
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
        borderBottom: "1px solid #E6E4DF",
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