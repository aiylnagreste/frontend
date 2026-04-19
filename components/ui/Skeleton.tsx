import { cn } from "@/lib/utils";

interface SkeletonProps {
  className?: string;
  style?: React.CSSProperties;
}

export function Skeleton({ className, style }: SkeletonProps) {
  return (
    <div
      className={cn("skeleton-shimmer", className)}
      style={{
        background: "linear-gradient(90deg, #f0eeed 25%, #e6e4df 50%, #f0eeed 75%)",
        backgroundSize: "200% 100%",
        borderRadius: "8px",
        ...style,
      }}
    />
  );
}

export function KpiSkeleton() {
  return (
    <div
      style={{
        background: "#fff",
        border: "1px solid #E6E4DF",
        borderRadius: "10px",
        padding: "20px 24px",
        display: "flex",
        flexDirection: "column",
        gap: "10px",
      }}
    >
      <Skeleton style={{ height: "12px", width: "55%" }} />
      <Skeleton style={{ height: "28px", width: "35%" }} />
    </div>
  );
}