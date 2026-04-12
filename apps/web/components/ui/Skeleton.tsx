"use client";

interface SkeletonProps {
  className?: string;
  width?: string | number;
  height?: string | number;
  circle?: boolean;
}

export function Skeleton({ className = "", width, height, circle = false }: SkeletonProps) {
  return (
    <span
      aria-hidden="true"
      className={[
        "block skeleton",
        circle ? "rounded-full" : "rounded-[var(--radius-md)]",
        className
      ].join(" ")}
      style={{ width, height }}
    />
  );
}

export function SkeletonText({ lines = 1, className = "" }: { lines?: number; className?: string }) {
  return (
    <div className={`flex flex-col gap-2 ${className}`} aria-hidden="true">
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton key={i} height={12} width={i === lines - 1 && lines > 1 ? "70%" : "100%"} />
      ))}
    </div>
  );
}

export function SkeletonCard({ className = "" }: { className?: string }) {
  return (
    <div className={`p-4 rounded-[var(--radius-lg)] bg-[var(--bg-surface)] border border-[var(--border-subtle)] flex flex-col gap-3 ${className}`} aria-hidden="true">
      <div className="flex items-center gap-3">
        <Skeleton circle width={32} height={32} />
        <div className="flex-1 flex flex-col gap-2">
          <Skeleton height={12} width="60%" />
          <Skeleton height={10} width="40%" />
        </div>
      </div>
      <SkeletonText lines={2} />
      <div className="flex gap-2">
        <Skeleton height={20} width={60} />
        <Skeleton height={20} width={50} />
      </div>
    </div>
  );
}
