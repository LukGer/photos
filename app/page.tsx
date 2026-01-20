// app/page.tsx
import { readFileSync } from "node:fs";
import { join } from "node:path";

import type { Metadata } from "next";
import Link from "next/link";
import { Magnetic } from "@/components/Magnetic";
import { MagneticProvider } from "@/components/MagneticContext";
import { Polaroid } from "@/components/Polaroid";
import type { MetadataItem } from "@/lib/types";

export const metadata: Metadata = {
	title: "Photos - Lukas Gerhold",
	description:
		"Photography portfolio by Lukas Gerhold. A collection of photos taken in the last years.",
	creator: "Lukas Gerhold",
};

function getImages(): MetadataItem[] {
	const filePath = join(process.cwd(), "public", "meta.json");
	const fileContents = readFileSync(filePath, "utf8");
	const items: MetadataItem[] = JSON.parse(fileContents);

	return items.sort(
		(a, b) => new Date(b.date || 0).getTime() - new Date(a.date || 0).getTime(),
	);
}

export default function Page() {
	const items = getImages();

	return (
		<main className="flex flex-col gap-2 p-4">
			<div className="flex flex-row px-1.5">
				<h1 className="font-mono text-4xl font-bold">The Gallery</h1>

				<div className="flex-1"></div>

				<span className="text-xs">(c) 2025 Lukas Gerhold</span>
			</div>
			<MagneticProvider>
				<div className="flex-1 grid grid-cols-[repeat(auto-fill,minmax(min(100%,300px),1fr))] gap-6">
					{items.map((item) => (
						<Link key={item.filename} href={`/p/${item.filename}`}>
							<Magnetic>
								<Polaroid item={item} />
							</Magnetic>
						</Link>
					))}
				</div>
			</MagneticProvider>
		</main>
	);
}
