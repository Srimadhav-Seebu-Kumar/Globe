"use client";

import { forwardRef } from "react";
import type { ButtonHTMLAttributes, ReactNode } from "react";

type Variant = "primary" | "secondary" | "ghost" | "danger" | "outline";
type Size = "xs" | "sm" | "md" | "lg";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  loading?: boolean;
  icon?: ReactNode;
  iconPosition?: "left" | "right";
  fullWidth?: boolean;
}

const variantStyles: Record<Variant, string> = {
  primary: "bg-[var(--accent-primary)] hover:bg-[var(--accent-primary-hover)] text-white border-transparent shadow-[var(--shadow-glow-blue)]",
  secondary: "bg-[var(--bg-elevated)] hover:bg-[var(--border-subtle)] text-[var(--text-primary)] border-[var(--border-default)]",
  ghost: "bg-transparent hover:bg-[var(--bg-elevated)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] border-transparent",
  danger: "bg-[var(--accent-danger)] hover:bg-[var(--accent-danger-hover)] text-white border-transparent",
  outline: "bg-transparent hover:bg-[var(--bg-elevated)] text-[var(--accent-primary)] border-[var(--accent-primary)]"
};

const sizeStyles: Record<Size, string> = {
  xs: "h-6 px-2 text-[11px] gap-1",
  sm: "h-7 px-3 text-[12px] gap-1.5",
  md: "h-8 px-4 text-[13px] gap-2",
  lg: "h-10 px-5 text-[14px] gap-2"
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { variant = "secondary", size = "md", loading = false, icon, iconPosition = "left", fullWidth, className = "", children, disabled, ...props },
  ref
) {
  const isDisabled = disabled || loading;

  return (
    <button
      ref={ref}
      disabled={isDisabled}
      className={[
        "inline-flex items-center justify-center font-medium rounded-[var(--radius-md)] border",
        "transition-all duration-[var(--duration-fast)] cursor-pointer select-none",
        "focus-visible:outline-2 focus-visible:outline-[var(--border-focus)] focus-visible:outline-offset-2",
        "disabled:opacity-40 disabled:cursor-not-allowed disabled:pointer-events-none",
        "active:scale-[0.97]",
        variantStyles[variant],
        sizeStyles[size],
        fullWidth ? "w-full" : "",
        className
      ].join(" ")}
      {...props}
    >
      {loading ? (
        <span className="animate-spin w-3 h-3 border-2 border-current border-t-transparent rounded-full" aria-hidden="true" />
      ) : (
        iconPosition === "left" && icon && <span className="shrink-0 w-4 h-4 flex items-center justify-center" aria-hidden="true">{icon}</span>
      )}
      {children && <span>{children}</span>}
      {!loading && iconPosition === "right" && icon && (
        <span className="shrink-0 w-4 h-4 flex items-center justify-center" aria-hidden="true">{icon}</span>
      )}
    </button>
  );
});
