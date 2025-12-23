"use client";

import { IconChevronLeft } from "@tabler/icons-react";
import { motion } from "motion/react";
import Link from "next/link";
import { Button } from "./ui/button";

export function BackButton() {
	return (
		<motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
			<Button size="icon" className="text-white rounded-full" asChild>
				<Link href="/">
					<IconChevronLeft className="h-6 w-6" />
				</Link>
			</Button>
		</motion.div>
	);
}
