"use client";

import { motion, useMotionValue, useSpring } from "motion/react";
import * as React from "react";
import { useMagneticContext } from "./MagneticContext";

type MagneticProps = {
	children: React.ReactNode;
	radius?: number; // px: how far the "magnet" reaches
	strength?: number; // 0..1+: how much it moves
	className?: string;
};

let idCounter = 0;

export function Magnetic({
	children,
	radius = 400,
	strength = 0.05,
	className,
}: MagneticProps) {
	const ref = React.useRef<HTMLDivElement | null>(null);
	const idRef = React.useRef<string>(`magnetic-${++idCounter}`);

	const rawX = useMotionValue(0);
	const rawY = useMotionValue(0);

	// Spring for smoothness
	const x = useSpring(rawX, { stiffness: 350, damping: 25, mass: 0.6 });
	const y = useSpring(rawY, { stiffness: 350, damping: 25, mass: 0.6 });

	const { register, unregister, getNearestId } = useMagneticContext();

	React.useEffect(() => {
		const el = ref.current;
		if (!el) return;

		// Register this element with the context
		register(idRef.current, el, radius);

		const handleMove = (e: PointerEvent) => {
			const nearestId = getNearestId(e.clientX, e.clientY);

			// Only apply magnetic effect if this is the nearest item
			if (nearestId !== idRef.current) {
				rawX.set(0);
				rawY.set(0);
				return;
			}

			const r = el.getBoundingClientRect();
			const cx = r.left + r.width / 2;
			const cy = r.top + r.height / 2;

			const dx = e.clientX - cx;
			const dy = e.clientY - cy;

			const dist = Math.hypot(dx, dy);

			if (dist > radius) {
				rawX.set(0);
				rawY.set(0);
				return;
			}

			// 0 at edge, 1 at center
			const pull = (1 - dist / radius) * strength;

			rawX.set(dx * pull);
			rawY.set(dy * pull);
		};

		const handleLeave = () => {
			rawX.set(0);
			rawY.set(0);
		};

		// Pointer events handle mouse + pen + touch (where supported)
		window.addEventListener("pointermove", handleMove, { passive: true });
		el.addEventListener("pointerleave", handleLeave);

		return () => {
			window.removeEventListener("pointermove", handleMove);
			el.removeEventListener("pointerleave", handleLeave);
			unregister(idRef.current);
		};
	}, [radius, strength, rawX, rawY, register, unregister, getNearestId]);

	return (
		<motion.div
			ref={ref}
			className={className}
			style={{ x, y, willChange: "transform" }}
		>
			{children}
		</motion.div>
	);
}
