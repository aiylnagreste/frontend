// components/ui/Skeleton.tsx
import { cn } from "@/lib/utils";
import styles from "./Skeleton.module.css";

interface SkeletonProps {
  className?: string;
  style?: React.CSSProperties;
}

export function Skeleton({ className, style }: SkeletonProps) {
  return (
    <div
      className={cn(styles.skeleton, className)}
      style={style}
    />
  );
}

export function KpiSkeleton() {
  return (
    <div className={styles.kpiSkeleton}>
      <Skeleton style={{ height: "12px", width: "55%" }} />
      <Skeleton style={{ height: "28px", width: "35%" }} />
    </div>
  );
}
