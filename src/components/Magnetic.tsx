"use client";

import { cn } from "@/lib/utils";
import {
  motion,
  useMotionValue,
  useReducedMotion,
  useSpring,
  useTransform,
} from "motion/react";
import * as React from "react";

const spring = { stiffness: 320, damping: 28, mass: 0.45 };

/** Radial highlight diameter (px), similar to Built-With-Code 3d card sheen. */
const SHEEN_SIZE = 480;

const mouseSpring = { stiffness: 420, damping: 38, mass: 0.22 };

type MagneticProps = {
  children: React.ReactNode;
  className?: string;
  /** Max tilt in degrees (pointer at card edge). */
  maxTilt?: number;
  /** Scale while pointer is over the card. */
  hoverScale?: number;
  /** translateZ in px while hovered (lift). */
  hoverLift?: number;
  /** Peak sheen opacity while hovered (0–1). */
  sheenOpacity?: number;
};

export function Magnetic({
  children,
  className,
  maxTilt = 11,
  hoverScale = 1.045,
  hoverLift = 22,
  sheenOpacity: sheenOpacityTarget = 0.28,
}: MagneticProps) {
  const rawRotateX = useMotionValue(0);
  const rawRotateY = useMotionValue(0);
  const rawScale = useMotionValue(1);
  const rawLift = useMotionValue(0);

  const rotateX = useSpring(rawRotateX, spring);
  const rotateY = useSpring(rawRotateY, spring);
  const scale = useSpring(rawScale, { ...spring, stiffness: 380 });
  const lift = useSpring(rawLift, { ...spring, stiffness: 380 });

  const mouseX = useSpring(0, mouseSpring);
  const mouseY = useSpring(0, mouseSpring);
  const sheenOpacity = useSpring(0, { stiffness: 380, damping: 34, mass: 0.2 });

  const sheenX = useTransform(mouseX, (x) => x - SHEEN_SIZE / 2);
  const sheenY = useTransform(mouseY, (y) => y - SHEEN_SIZE / 2);

  const transform = useTransform(
    [rotateX, rotateY, scale, lift],
    ([rx, ry, s, z]) =>
      `translate3d(0,0,${z}px) rotateX(${rx}deg) rotateY(${ry}deg) scale3d(${s},${s},1)`,
  );

  const shouldReduceMotion = useReducedMotion();

  const reset = React.useCallback(() => {
    rawRotateX.set(0);
    rawRotateY.set(0);
    rawScale.set(1);
    rawLift.set(0);
    sheenOpacity.set(0);
  }, [rawRotateX, rawRotateY, rawScale, rawLift, sheenOpacity]);

  React.useEffect(() => {
    if (shouldReduceMotion !== true) return;
    reset();
    mouseX.jump(0);
    mouseY.jump(0);
  }, [shouldReduceMotion, reset, mouseX, mouseY]);

  const syncMouse = React.useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      const el = e.currentTarget;
      const r = el.getBoundingClientRect();
      if (r.width < 1 || r.height < 1) return;
      mouseX.set(e.clientX - r.left);
      mouseY.set(e.clientY - r.top);
    },
    [mouseX, mouseY],
  );

  const handlePointerEnter = React.useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      if (shouldReduceMotion === true) return;
      syncMouse(e);
      sheenOpacity.set(sheenOpacityTarget);
      rawScale.set(hoverScale);
      rawLift.set(hoverLift);
    },
    [
      shouldReduceMotion,
      syncMouse,
      sheenOpacity,
      sheenOpacityTarget,
      rawScale,
      rawLift,
      hoverScale,
      hoverLift,
    ],
  );

  const handlePointerMove = React.useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      if (shouldReduceMotion === true) return;
      const el = e.currentTarget;
      const r = el.getBoundingClientRect();
      if (r.width < 1 || r.height < 1) return;

      const px = ((e.clientX - r.left) / r.width) * 2 - 1;
      const py = ((e.clientY - r.top) / r.height) * 2 - 1;
      const nx = Math.max(-1, Math.min(1, px));
      const ny = Math.max(-1, Math.min(1, py));
      rawRotateY.set(nx * maxTilt);
      rawRotateX.set(-ny * maxTilt);
      syncMouse(e);
    },
    [shouldReduceMotion, maxTilt, rawRotateY, rawRotateX, syncMouse],
  );

  const handlePointerLeave = React.useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      if (shouldReduceMotion === true) return;
      const el = e.currentTarget;
      const r = el.getBoundingClientRect();
      if (r.width >= 1 && r.height >= 1) {
        mouseX.jump(r.width / 2);
        mouseY.jump(r.height / 2);
      }
      reset();
    },
    [shouldReduceMotion, mouseX, mouseY, reset],
  );

  return (
    <div
      className={cn(
        "relative perspective-[min(96vw,920px)] transform-3d",
        className,
      )}
      style={{ perspectiveOrigin: "50% 50%" }}
    >
      <motion.div
        className="pointer-events-none relative transform-gpu overflow-hidden rounded-sm shadow-md backface-hidden transform-3d"
        style={{ transform, willChange: "transform" }}
      >
        {children}
        {shouldReduceMotion !== true ? (
          <motion.div
            aria-hidden
            className="pointer-events-none absolute z-10 rounded-full blur-md"
            style={{
              width: SHEEN_SIZE,
              height: SHEEN_SIZE,
              left: sheenX,
              top: sheenY,
              opacity: sheenOpacity,
              background:
                "radial-gradient(circle closest-side, rgba(255,255,255,0.55) 0%, rgba(255,255,255,0.12) 42%, transparent 72%)",
            }}
          />
        ) : null}
      </motion.div>
      <div
        className="pointer-events-auto absolute inset-0 z-1 cursor-pointer"
        aria-hidden
        onPointerEnter={handlePointerEnter}
        onPointerMove={handlePointerMove}
        onPointerLeave={handlePointerLeave}
      />
    </div>
  );
}
