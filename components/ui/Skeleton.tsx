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
      // inline: public-API style passthrough — callers pass arbitrary dimensions / overrides
      style={style}
    />
  );
}

export function KpiSkeleton() {
  return (
    <div className={styles.kpiSkeleton}>
      <Skeleton className={styles.kpiSkeleton__label} />
      <Skeleton className={styles.kpiSkeleton__value} />
    </div>
  );
}
