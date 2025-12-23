import { readFileSync } from "node:fs";
import { join } from "node:path";
import Image from "next/image";
import { BackButton } from "@/components/BackButton";
import { ImageInfos } from "@/components/ImageInfos";
import type { MetadataItem } from "@/lib/types";

function getMetadata(): MetadataItem[] {
	try {
		const filePath = join(process.cwd(), "public", "meta.json");
		const fileContents = readFileSync(filePath, "utf8");
		return JSON.parse(fileContents) as MetadataItem[];
	} catch (error) {
		console.error("Error reading metadata:", error);
		return [];
	}
}

export function generateStaticParams() {
	const items = getMetadata();
	return items.map((item) => ({
		slug: item.filename,
	}));
}

function getImageData(slug: string): MetadataItem | null {
	const items = getMetadata();
	return items.find((item) => item.filename === slug) || null;
}

export default async function PhotoPage({
	params,
}: {
	params: Promise<{ slug: string }>;
}) {
	const { slug } = await params;
	const imageData = getImageData(slug);

	if (!imageData) {
		return (
			<div className="flex min-h-screen items-center justify-center">
				<div className="text-center">
					<h1 className="mb-2 text-2xl font-bold">Image not found</h1>
					<p className="text-gray-600">
						The requested image could not be found.
					</p>
				</div>
			</div>
		);
	}

	return (
		<div className="flex min-h-screen justify-center bg-black pt-[10vh] relative">
			<div className="absolute top-4 left-4 ">
				<BackButton />
			</div>
			<div className="absolute bottom-4 left-4 ">
				<ImageInfos image={imageData} />
			</div>
			<div className="max-h-[80vh] max-w-full">
				<Image
					src={imageData.src}
					alt={imageData.filename}
					width={imageData.width}
					height={imageData.height}
					className="max-h-[80vh] max-w-full object-contain"
					priority
				/>
			</div>
		</div>
	);
}
