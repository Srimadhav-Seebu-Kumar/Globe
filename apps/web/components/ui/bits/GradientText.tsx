"use client";

import { useInsertionEffect, type CSSProperties, type ReactNode } from "react";

interface GradientTextProps {
  children: ReactNode;
  colors?: string[];
  animationSpeed?: number;
  className?: string;
}

// Hoist the @keyframes definition so it is injected exactly once per document
// instead of once per GradientText mount (which previously created a duplicate
// <style> tag in every <span>'s sibling position).
let keyframesInjected = false;

function useGradientKeyframes(): void {
  useInsertionEffect(() => {
    if (keyframesInjected || typeof document === "undefined") return;
    keyframesInjected = true;
    const el = document.createElement("style");
    el.setAttribute("data-gradient-text", "");
    el.textContent =
      "@keyframes gradientShift{0%{background-position:0% center;}100%{background-position:200% center;}}";
    document.head.appendChild(el);
  }, []);
}

export function GradientText({
  children,
  colors = ["#60a5fa", "#a78bfa", "#38bdf8"],
  animationSpeed = 6,
  className
}: GradientTextProps) {
  useGradientKeyframes();

  const gradient = `linear-gradient(90deg, ${[...colors, ...colors].join(", ")})`;

  const style: CSSProperties = {
    backgroundImage: gradient,
    backgroundSize: "200% auto",
    WebkitBackgroundClip: "text",
    backgroundClip: "text",
    WebkitTextFillColor: "transparent",
    color: "transparent",
    animation: `gradientShift ${animationSpeed}s linear infinite`
  };

  return (
    <span style={style} className={className}>
      {children}
    </span>
  );
}
