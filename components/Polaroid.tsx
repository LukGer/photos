"use client";

import { motion } from "motion/react";
import Image from "next/image";
import type { MetadataItem } from "@/lib/types";

export function Polaroid({ item }: { item: MetadataItem }) {
	const rotation =
		(item.filename
			.split("")
			.reduce((acc, char) => acc + char.charCodeAt(0), 0) %
			100) /
			10 -
		5;

	return (
		<motion.div
			whileHover={{ scale: 1.025 }}
			className="bg-white rounded-sm shadow-md flex flex-col p-4 h-full cursor-pointer"
		>
			<div className="relative aspect-square w-full rounded-xs overflow-hidden bg-gray-100">
				<Image
					src={item.src}
					alt={item.title || item.filename}
					fill
					className="object-cover"
					placeholder="blur"
					blurDataURL={item.blurDataURL}
				/>
			</div>
			<div className="mt-4 flex flex-col h-20 pt-2">
				<span
					className="font-handwritten text-2xl self-center"
					style={{ transform: `rotate(${rotation}deg)` }}
				>
					{item.title}
				</span>
				<div className="flex-1"></div>
				<span className="text-xs font-mono text-gray-800">
					{item.subtitle}
					{", "}
					{new Date(item.date).toLocaleDateString("en-US", {
						year: "numeric",
						month: "long",
					})}
				</span>
			</div>
		</motion.div>
	);
}
