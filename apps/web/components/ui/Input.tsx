"use client";

import { forwardRef } from "react";
import type { InputHTMLAttributes, ReactNode } from "react";

interface InputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, "prefix"> {
  label?: string | undefined;
  error?: string | undefined;
  hint?: string | undefined;
  prefix?: ReactNode | undefined;
  suffix?: ReactNode | undefined;
  fullWidth?: boolean | undefined;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  { label, error, hint, prefix, suffix, fullWidth, className = "", id, ...props },
  ref
) {
  const inputId = id ?? `input-${Math.random().toString(36).slice(2, 7)}`;

  return (
    <div className={`flex flex-col gap-1.5 ${fullWidth ? "w-full" : ""}`}>
      {label && (
        <label
          htmlFor={inputId}
          className="text-[var(--text-caption)] font-medium text-[var(--text-secondary)] tracking-wide"
        >
          {label}
        </label>
      )}
      <div className={`relative flex items-center ${fullWidth ? "w-full" : ""}`}>
        {prefix && (
          <span className="absolute left-3 text-[var(--text-tertiary)] pointer-events-none flex items-center">
            {prefix}
          </span>
        )}
        <input
          ref={ref}
          id={inputId}
          aria-invalid={!!error}
          aria-describedby={error ? `${inputId}-error` : hint ? `${inputId}-hint` : undefined}
          className={[
            "h-8 w-full rounded-[var(--radius-md)] border bg-[var(--bg-input)] text-[var(--text-primary)]",
            "text-[13px] placeholder:text-[var(--text-tertiary)]",
            "transition-colors duration-[var(--duration-fast)]",
            "focus:outline-none focus:ring-2 focus:ring-[var(--border-focus)] focus:ring-offset-1 focus:ring-offset-[var(--bg-base)]",
            error
              ? "border-[var(--accent-danger)] focus:ring-[var(--accent-danger)]"
              : "border-[var(--border-default)] hover:border-[var(--border-strong)]",
            prefix ? "pl-9" : "pl-3",
            suffix ? "pr-9" : "pr-3",
            className
          ].join(" ")}
          {...props}
        />
        {suffix && (
          <span className="absolute right-3 text-[var(--text-tertiary)] pointer-events-none flex items-center">
            {suffix}
          </span>
        )}
      </div>
      {error && (
        <p id={`${inputId}-error`} role="alert" className="text-[11px] text-[var(--accent-danger)]">
          {error}
        </p>
      )}
      {hint && !error && (
        <p id={`${inputId}-hint`} className="text-[11px] text-[var(--text-tertiary)]">
          {hint}
        </p>
      )}
    </div>
  );
});
