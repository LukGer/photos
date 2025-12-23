import type { MetadataItem } from "@/lib/types";

export function ImageInfos({ image }: { image: MetadataItem }) {
	return (
		<div className="flex flex-col text-gray-50 font-mono">
			<span>{image.title}</span>
			<span>{image.subtitle}</span>
			<span>{image.date}</span>
			<span>{image.camera}</span>
			<span>{image.lens}</span>
			<span>{image.aperture}</span>
			<span>{image.shutter}</span>
			<span>{image.iso}</span>
		</div>
	);
}
