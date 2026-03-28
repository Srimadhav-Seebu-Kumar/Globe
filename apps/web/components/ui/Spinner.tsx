"use client";

interface SpinnerProps {
  size?: "sm" | "md" | "lg";
  color?: string;
  className?: string;
  label?: string;
}

const sizeMap = { sm: "w-4 h-4 border-[1.5px]", md: "w-6 h-6 border-2", lg: "w-8 h-8 border-[2.5px]" };

export function Spinner({ size = "md", color = "var(--accent-primary)", className = "", label = "Loading…" }: SpinnerProps) {
  return (
    <span
      role="status"
      aria-label={label}
      className={`inline-block rounded-full animate-spin border-current border-t-transparent ${sizeMap[size]} ${className}`}
      style={{ borderColor: `${color} transparent transparent transparent` }}
    />
  );
}
