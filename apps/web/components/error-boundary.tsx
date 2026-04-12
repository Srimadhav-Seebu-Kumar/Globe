"use client";

import React from "react";

interface ErrorBoundaryProps {
  children: React.ReactNode;
  fallback: React.ReactNode;
  /** Optional label included in console.error output for debugging. */
  label?: string;
}

interface ErrorBoundaryState {
  hasError: boolean;
}

export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  override state: ErrorBoundaryState = { hasError: false };

  static getDerivedStateFromError(): ErrorBoundaryState {
    return { hasError: true };
  }

  override componentDidCatch(error: Error, info: React.ErrorInfo): void {
    const tag = this.props.label ? `[error-boundary:${this.props.label}]` : "[error-boundary]";
    // eslint-disable-next-line no-console
    console.error(tag, error, info);
  }

  override render(): React.ReactNode {
    if (this.state.hasError) return this.props.fallback;
    return this.props.children;
  }
}
