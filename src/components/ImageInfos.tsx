import type { ReactNode } from "react";
import type { MetadataItem } from "@/lib/types";
import { cn } from "@/lib/utils";

function InfoRow({
  label,
  value,
  className,
}: {
  label: string;
  value: ReactNode;
  className?: string;
}) {
  if (!value) return null;

  return (
    <div className={cn("group contents", className)}>
      <span className="text-right text-gray-200 opacity-100 transition-opacity duration-200 ease-[cubic-bezier(0.23,1,0.32,1)] md:opacity-10 md:group-hover:opacity-100">
        {label}
      </span>
      <span className="text-left font-bold text-gray-50">{value}</span>
    </div>
  );
}

export function ImageInfos({ image }: { image: MetadataItem }) {
  return (
    <div className="grid max-w-lg grid-cols-[max-content_1fr] gap-x-6 gap-y-1 font-mono text-sm">
      <InfoRow label="Title" value={image.title} />
      <InfoRow label="Location" value={image.location} />
      <InfoRow
        label="Date"
        value={
          image.date
            ? new Date(image.date).toLocaleDateString(undefined, {
                year: "numeric",
                month: "long",
                day: "numeric",
              })
            : null
        }
      />
      <InfoRow label="Camera" value={image.camera} />
      <InfoRow label="Lens" value={image.lens} />
      <InfoRow label="Aperture" value={image.aperture} />
      <InfoRow label="Shutter" value={image.shutter} />
      <InfoRow label="ISO" value={image.iso?.toString()} />
    </div>
  );
}
