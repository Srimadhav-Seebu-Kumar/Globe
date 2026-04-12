"use client";

interface DividerProps {
  orientation?: "horizontal" | "vertical";
  className?: string;
}

export function Divider({ orientation = "horizontal", className = "" }: DividerProps) {
  if (orientation === "vertical") {
    return <span className={`inline-block w-px h-full bg-[var(--border-subtle)] ${className}`} aria-hidden="true" />;
  }
  return <hr className={`border-0 border-t border-[var(--border-subtle)] w-full ${className}`} aria-hidden="true" />;
}
