// components/ui/Card.tsx
import { cn } from "@/lib/utils";
import styles from "./Card.module.css";
import type { CSSProperties, ReactNode } from "react";

interface CardProps {
  children: ReactNode;
  className?: string;
  style?: CSSProperties;
}

export function Card({ children, className, style }: CardProps) {
  return (
    <div className={cn(styles.card, className)} style={style}>
      {children}
    </div>
  );
}

export function CardHeader({ children, className, style }: CardProps) {
  return (
    <div className={cn(styles.card__header, className)} style={style}>
      {children}
    </div>
  );
}

export function CardContent({ children, className, style }: CardProps) {
  return (
    <div className={cn(styles.card__content, className)} style={style}>
      {children}
    </div>
  );
}
