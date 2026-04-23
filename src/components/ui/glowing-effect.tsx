"use client";

import { memo, useCallback, useEffect, useRef, type CSSProperties } from "react";
import { cn } from "@/lib/utils";

interface GlowingEffectProps {
  blur?: number;
  inactiveZone?: number;
  proximity?: number;
  spread?: number;
  variant?: "default" | "white";
  glow?: boolean;
  className?: string;
  disabled?: boolean;
  movementDuration?: number;
  borderWidth?: number;
}

const easeOutCubic = (value: number) => 1 - Math.pow(1 - value, 3);

const normalizeAngle = (angle: number) => {
  const normalized = angle % 360;
  return normalized < 0 ? normalized + 360 : normalized;
};

const getShortestAngle = (current: number, target: number) =>
  current + ((((target - current) % 360) + 540) % 360) - 180;

const GlowingEffect = memo(
  ({
    blur = 0,
    inactiveZone = 0.7,
    proximity = 0,
    spread = 20,
    variant = "default",
    glow = false,
    className,
    movementDuration = 0.6,
    borderWidth = 1,
    disabled = true,
  }: GlowingEffectProps) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const lastPosition = useRef({ x: 0, y: 0 });
    const measureFrameRef = useRef<number>(0);
    const angleFrameRef = useRef<number>(0);
    const angleRef = useRef(0);

    const stopAngleAnimation = useCallback(() => {
      if (angleFrameRef.current) {
        cancelAnimationFrame(angleFrameRef.current);
        angleFrameRef.current = 0;
      }
    }, []);

    const animateToAngle = useCallback(
      (targetAngle: number, element: HTMLDivElement) => {
        stopAngleAnimation();

        const startAngle = angleRef.current;
        const resolvedTarget = getShortestAngle(startAngle, targetAngle);
        const duration = Math.max(movementDuration, 0.05) * 1000;
        const startTime = performance.now();

        const tick = (now: number) => {
          const progress = Math.min((now - startTime) / duration, 1);
          const easedProgress = easeOutCubic(progress);
          const nextAngle = startAngle + (resolvedTarget - startAngle) * easedProgress;

          angleRef.current = nextAngle;
          element.style.setProperty("--start", String(normalizeAngle(nextAngle)));

          if (progress < 1) {
            angleFrameRef.current = requestAnimationFrame(tick);
            return;
          }

          angleFrameRef.current = 0;
        };

        angleFrameRef.current = requestAnimationFrame(tick);
      },
      [movementDuration, stopAngleAnimation]
    );

    const handleMove = useCallback(
      (event?: MouseEvent | PointerEvent | { x: number; y: number }) => {
        if (!containerRef.current) return;

        if (measureFrameRef.current) {
          cancelAnimationFrame(measureFrameRef.current);
        }

        measureFrameRef.current = requestAnimationFrame(() => {
          const element = containerRef.current;
          if (!element) return;

          const { left, top, width, height } = element.getBoundingClientRect();
          const mouseX = event?.x ?? lastPosition.current.x;
          const mouseY = event?.y ?? lastPosition.current.y;

          if (event) {
            lastPosition.current = { x: mouseX, y: mouseY };
          }

          const centerX = left + width * 0.5;
          const centerY = top + height * 0.5;
          const distanceFromCenter = Math.hypot(mouseX - centerX, mouseY - centerY);
          const inactiveRadius = 0.5 * Math.min(width, height) * inactiveZone;

          if (distanceFromCenter < inactiveRadius) {
            element.style.setProperty("--active", "0");
            return;
          }

          const isActive =
            mouseX > left - proximity &&
            mouseX < left + width + proximity &&
            mouseY > top - proximity &&
            mouseY < top + height + proximity;

          element.style.setProperty("--active", isActive ? "1" : "0");

          if (!isActive) return;

          const targetAngle =
            (180 * Math.atan2(mouseY - centerY, mouseX - centerX)) / Math.PI + 90;

          animateToAngle(targetAngle, element);
        });
      },
      [animateToAngle, inactiveZone, proximity]
    );

    useEffect(() => {
      if (disabled) return;

      const handleScroll = () => handleMove();
      const handlePointerMove = (event: PointerEvent) => handleMove(event);

      window.addEventListener("scroll", handleScroll, { passive: true });
      document.addEventListener("pointermove", handlePointerMove, { passive: true });

      return () => {
        if (measureFrameRef.current) {
          cancelAnimationFrame(measureFrameRef.current);
        }
        stopAngleAnimation();
        window.removeEventListener("scroll", handleScroll);
        document.removeEventListener("pointermove", handlePointerMove);
      };
    }, [disabled, handleMove, stopAngleAnimation]);

    const style = {
      "--blur": `${blur}px`,
      "--spread": spread,
      "--start": "0",
      "--active": glow ? "1" : "0",
      "--glowingeffect-border-width": `${borderWidth}px`,
      "--repeating-conic-gradient-times": "5",
      "--gradient":
        variant === "white"
          ? `repeating-conic-gradient(
              from 236.84deg at 50% 50%,
              rgba(255, 255, 255, 0.9) 0%,
              rgba(255, 255, 255, 0.9) calc(100% / var(--repeating-conic-gradient-times))
            )`
          : `radial-gradient(circle, #f472b6 10%, transparent 20%),
            radial-gradient(circle at 40% 40%, #f59e0b 5%, transparent 15%),
            radial-gradient(circle at 60% 60%, #84cc16 10%, transparent 20%),
            radial-gradient(circle at 40% 60%, #38bdf8 10%, transparent 20%),
            repeating-conic-gradient(
              from 236.84deg at 50% 50%,
              #f472b6 0%,
              #f59e0b calc(25% / var(--repeating-conic-gradient-times)),
              #84cc16 calc(50% / var(--repeating-conic-gradient-times)),
              #38bdf8 calc(75% / var(--repeating-conic-gradient-times)),
              #f472b6 calc(100% / var(--repeating-conic-gradient-times))
            )`,
    } as CSSProperties;

    return (
      <div
        ref={containerRef}
        aria-hidden="true"
        style={style}
        className={cn(
          "pointer-events-none absolute inset-0 rounded-[inherit] transition-opacity duration-300",
          blur > 0 && "blur-[var(--blur)]",
          disabled && "hidden",
          className
        )}
      >
        <div
          className={cn(
            "absolute inset-0 rounded-[inherit]",
            'after:content-[""] after:absolute after:inset-[calc(-1*var(--glowingeffect-border-width))] after:rounded-[inherit]',
            "after:[border:var(--glowingeffect-border-width)_solid_transparent]",
            "after:[background:var(--gradient)] after:[background-attachment:fixed]",
            "after:opacity-[var(--active)] after:transition-opacity after:duration-300",
            "after:[mask-clip:padding-box,border-box]",
            "after:[mask-composite:intersect]",
            "after:[mask-image:linear-gradient(#0000,#0000),conic-gradient(from_calc((var(--start)-var(--spread))*1deg),#00000000_0deg,#fff,#00000000_calc(var(--spread)*2deg))]"
          )}
        />
      </div>
    );
  }
);

GlowingEffect.displayName = "GlowingEffect";

export { GlowingEffect };
