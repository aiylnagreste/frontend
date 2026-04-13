import { cn } from "@/lib/utils";

interface SkeletonProps {
  className?: string;
  style?: React.CSSProperties;
}

export function Skeleton({ className, style }: SkeletonProps) {
  return (
    <div
      className={cn("animate-pulse rounded", className)}
      style={{
        background: "linear-gradient(90deg, #f0eeed 25%, #e8e3e0 50%, #f0eeed 75%)",
        backgroundSize: "200% 100%",
        animation: "skeleton-shimmer 1.5s ease-in-out infinite",
        borderRadius: "6px",
        ...style,
      }}
    />
  );
}

export function KpiSkeleton() {
  return (
    <div
      style={{
        background: "var(--color-surface)",
        border: "1px solid var(--color-border)",
        borderRadius: "var(--radius-md)",
        padding: "20px 24px",
        display: "flex",
        flexDirection: "column",
        gap: "8px",
      }}
    >
      <Skeleton style={{ height: "12px", width: "60%" }} />
      <Skeleton style={{ height: "32px", width: "40%" }} />
    </div>
  );
}
