"use client";

import * as React from "react";

type MagneticItem = {
	id: string;
	element: HTMLDivElement;
	radius: number;
};

type MagneticContextValue = {
	register: (id: string, element: HTMLDivElement, radius: number) => void;
	unregister: (id: string) => void;
	getNearestId: (x: number, y: number) => string | null;
};

const MagneticContext = React.createContext<MagneticContextValue | null>(null);

export function MagneticProvider({ children }: { children: React.ReactNode }) {
	const itemsRef = React.useRef<Map<string, MagneticItem>>(new Map());

	const register = React.useCallback(
		(id: string, element: HTMLDivElement, radius: number) => {
			itemsRef.current.set(id, { id, element, radius });
		},
		[],
	);

	const unregister = React.useCallback((id: string) => {
		itemsRef.current.delete(id);
	}, []);

	const getNearestId = React.useCallback((x: number, y: number) => {
		let nearestId: string | null = null;
		let minDist = Number.POSITIVE_INFINITY;

		Array.from(itemsRef.current.entries()).forEach(([id, item]) => {
			const r = item.element.getBoundingClientRect();
			const cx = r.left + r.width / 2;
			const cy = r.top + r.height / 2;

			const dx = x - cx;
			const dy = y - cy;
			const dist = Math.hypot(dx, dy);

			// Only consider items within their radius
			if (dist <= item.radius && dist < minDist) {
				minDist = dist;
				nearestId = id;
			}
		});

		return nearestId;
	}, []);

	const value = React.useMemo(
		() => ({ register, unregister, getNearestId }),
		[register, unregister, getNearestId],
	);

	return (
		<MagneticContext.Provider value={value}>
			{children}
		</MagneticContext.Provider>
	);
}

export function useMagneticContext() {
	const context = React.useContext(MagneticContext);
	if (!context) {
		throw new Error("useMagneticContext must be used within MagneticProvider");
	}
	return context;
}
