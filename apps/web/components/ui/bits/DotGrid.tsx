"use client";

import { useCallback, useEffect, useMemo, useRef } from "react";
import type { CSSProperties } from "react";

// ── Types ─────────────────────────────────────────────────────────────────────

interface Dot {
  cx: number; cy: number;  // home position
  x: number;  y: number;   // current position
  vx: number; vy: number;  // velocity
}

export interface DotGridProps {
  dotSize?: number;
  gap?: number;
  baseColor?: string;
  activeColor?: string;
  /** Optional extra color sources: each entry pulls nearby dots to a tint color */
  hotspots?: { x: number; y: number; color: string; radius?: number }[];
  proximity?: number;
  speedTrigger?: number;
  shockRadius?: number;
  shockStrength?: number;
  /** Velocity decay per frame (0–1). Higher = slower decay = longer slide. */
  resistance?: number;
  /** Spring force pulling dot home (0–1). Higher = snappier return. */
  returnStrength?: number;
  /** Damping applied to velocity each frame (0–1). Higher = overdamped. */
  returnDamping?: number;
  className?: string;
  style?: CSSProperties;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function hexToRgb(hex: string): { r: number; g: number; b: number } {
  const m = hex.replace("#", "").match(/([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})/i);
  if (!m || !m[1] || !m[2] || !m[3]) return { r: 0, g: 0, b: 0 };
  return { r: parseInt(m[1], 16), g: parseInt(m[2], 16), b: parseInt(m[3], 16) };
}

function lerpColor(
  a: { r: number; g: number; b: number },
  b: { r: number; g: number; b: number },
  t: number
): string {
  const r = Math.round(a.r + (b.r - a.r) * t);
  const g = Math.round(a.g + (b.g - a.g) * t);
  const bl = Math.round(a.b + (b.b - a.b) * t);
  return `rgb(${r},${g},${bl})`;
}

// ── Component ─────────────────────────────────────────────────────────────────

export function DotGrid({
  dotSize = 6,
  gap = 28,
  baseColor = "#1e3a5f",
  activeColor = "#60a5fa",
  hotspots = [],
  proximity = 140,
  speedTrigger = 120,
  shockRadius = 260,
  shockStrength = 6,
  resistance = 0.82,
  returnStrength = 0.08,
  returnDamping = 0.72,
  className = "",
  style
}: DotGridProps) {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const dotsRef = useRef<Dot[]>([]);
  const pointer = useRef({ x: -9999, y: -9999, vx: 0, vy: 0, speed: 0, lastX: 0, lastY: 0, lastT: 0 });

  const baseRgb = useMemo(() => hexToRgb(baseColor), [baseColor]);
  const activeRgb = useMemo(() => hexToRgb(activeColor), [activeColor]);
  // Build a stable primitive key so the memo only invalidates on actual hotspot
  // changes instead of every render (avoids the JSON.stringify-in-deps anti-pattern).
  const hotspotsKey = hotspots
    .map((h) => `${h.x},${h.y},${h.color},${h.radius ?? 80}`)
    .join("|");
  const hotspotRgbs = useMemo(
    () => hotspots.map((h) => ({ ...h, rgb: hexToRgb(h.color) })),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [hotspotsKey]
  );

  // Pre-build a reusable circle Path2D
  const circlePath = useMemo(() => {
    if (typeof window === "undefined" || !window.Path2D) return null;
    const p = new Path2D();
    p.arc(0, 0, dotSize / 2, 0, Math.PI * 2);
    return p;
  }, [dotSize]);

  // Build the dot grid based on wrapper dimensions
  const buildGrid = useCallback(() => {
    const wrap = wrapperRef.current;
    const canvas = canvasRef.current;
    if (!wrap || !canvas) return;

    const { width, height } = wrap.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;

    canvas.width = width * dpr;
    canvas.height = height * dpr;
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;

    const ctx = canvas.getContext("2d");
    if (ctx) ctx.scale(dpr, dpr);

    const cell = dotSize + gap;
    const cols = Math.floor((width + gap) / cell);
    const rows = Math.floor((height + gap) / cell);

    const gridW = cell * cols - gap;
    const gridH = cell * rows - gap;

    const startX = (width - gridW) / 2 + dotSize / 2;
    const startY = (height - gridH) / 2 + dotSize / 2;

    const dots: Dot[] = [];
    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < cols; col++) {
        const cx = startX + col * cell;
        const cy = startY + row * cell;
        dots.push({ cx, cy, x: cx, y: cy, vx: 0, vy: 0 });
      }
    }
    dotsRef.current = dots;
  }, [dotSize, gap]);

  // Main rAF render + physics loop
  useEffect(() => {
    if (!circlePath) return;

    let rafId: number;
    const proxSq = proximity * proximity;

    const frame = () => {
      const canvas = canvasRef.current;
      if (!canvas) { rafId = requestAnimationFrame(frame); return; }
      const ctx = canvas.getContext("2d");
      if (!ctx) { rafId = requestAnimationFrame(frame); return; }

      const { x: px, y: py } = pointer.current;

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      for (const dot of dotsRef.current) {
        // ── Physics ──────────────────────────────────────────────
        // Spring toward home
        dot.vx += (dot.cx - dot.x) * returnStrength;
        dot.vy += (dot.cy - dot.y) * returnStrength;
        // Damping
        dot.vx *= returnDamping;
        dot.vy *= returnDamping;
        // Integrate
        dot.x += dot.vx;
        dot.y += dot.vy;

        // ── Color ────────────────────────────────────────────────
        const dx = dot.cx - px;
        const dy = dot.cy - py;
        const dsq = dx * dx + dy * dy;

        let fillStyle = baseColor;

        // Mouse proximity color
        if (dsq < proxSq) {
          const t = 1 - Math.sqrt(dsq) / proximity;
          fillStyle = lerpColor(baseRgb, activeRgb, t);
        }

        // Hotspot tint (market pins, etc.) — last one wins
        for (const h of hotspotRgbs) {
          const hr = h.radius ?? 80;
          const hx = h.x - dot.cx;
          const hy = h.y - dot.cy;
          const hd = Math.sqrt(hx * hx + hy * hy);
          if (hd < hr) {
            const t = (1 - hd / hr) * 0.6;
            fillStyle = lerpColor(baseRgb, h.rgb, t);
          }
        }

        // ── Draw ─────────────────────────────────────────────────
        ctx.save();
        ctx.translate(dot.x, dot.y);
        ctx.fillStyle = fillStyle;
        ctx.fill(circlePath);
        ctx.restore();
      }

      rafId = requestAnimationFrame(frame);
    };

    rafId = requestAnimationFrame(frame);
    return () => cancelAnimationFrame(rafId);
  }, [baseColor, activeColor, baseRgb, activeRgb, hotspotRgbs, proximity, returnStrength, returnDamping, circlePath]);

  // Grid rebuild on mount + resize. lib.dom declares ResizeObserver on Window,
  // so TS treats the `"ResizeObserver" in window` check as always-true and
  // narrows the else branch to `never`. Use a runtime feature check via a
  // cast so both branches remain type-valid.
  useEffect(() => {
    buildGrid();
    const resizeObserverCtor = (window as Window & { ResizeObserver?: typeof ResizeObserver }).ResizeObserver;
    let ro: ResizeObserver | null = null;
    if (resizeObserverCtor) {
      ro = new resizeObserverCtor(buildGrid);
      if (wrapperRef.current) ro.observe(wrapperRef.current);
    } else {
      window.addEventListener("resize", buildGrid);
    }
    return () => {
      if (ro) {
        ro.disconnect();
      } else {
        window.removeEventListener("resize", buildGrid);
      }
    };
  }, [buildGrid]);

  // Mouse move — track velocity + push nearby dots
  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      const canvas = canvasRef.current;
      if (!canvas) return;

      const now = performance.now();
      const pr = pointer.current;
      const dt = pr.lastT ? now - pr.lastT : 16;
      const dx = e.clientX - pr.lastX;
      const dy = e.clientY - pr.lastY;
      const vx = (dx / dt) * 1000;
      const vy = (dy / dt) * 1000;
      const speed = Math.hypot(vx, vy);

      pr.lastT = now;
      pr.lastX = e.clientX;
      pr.lastY = e.clientY;
      pr.vx = vx;
      pr.vy = vy;
      pr.speed = speed;

      const rect = canvas.getBoundingClientRect();
      pr.x = e.clientX - rect.left;
      pr.y = e.clientY - rect.top;

      if (speed > speedTrigger) {
        for (const dot of dotsRef.current) {
          const dist = Math.hypot(dot.cx - pr.x, dot.cy - pr.y);
          if (dist < proximity) {
            dot.vx += (dot.cx - pr.x) * 0.4 + vx * 0.003;
            dot.vy += (dot.cy - pr.y) * 0.4 + vy * 0.003;
          }
        }
      }
    };

    window.addEventListener("mousemove", onMove, { passive: true });
    return () => window.removeEventListener("mousemove", onMove);
  }, [speedTrigger, proximity]);

  // Click — shockwave
  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const rect = canvas.getBoundingClientRect();
      const cx = e.clientX - rect.left;
      const cy = e.clientY - rect.top;

      for (const dot of dotsRef.current) {
        const dist = Math.hypot(dot.cx - cx, dot.cy - cy);
        if (dist < shockRadius) {
          const falloff = 1 - dist / shockRadius;
          dot.vx += (dot.cx - cx) * shockStrength * falloff;
          dot.vy += (dot.cy - cy) * shockStrength * falloff;
        }
      }
    };

    window.addEventListener("click", onClick);
    return () => window.removeEventListener("click", onClick);
  }, [shockRadius, shockStrength]);

  const wrapStyle: CSSProperties = { position: "relative", width: "100%", height: "100%", ...style };

  return (
    <div ref={wrapperRef} className={`relative w-full h-full ${className}`} style={wrapStyle}>
      <canvas
        ref={canvasRef}
        className="absolute inset-0 w-full h-full"
        style={{ pointerEvents: "none" }}
        role="img"
        aria-label="Interactive background animation"
      />
    </div>
  );
}
