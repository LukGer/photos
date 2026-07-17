"use client";

import type { ReactNode } from "react";
import { useRetroMode } from "@/lib/retro-mode";
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
      <span className="text-right text-white/25 transition-colors duration-200 ease-[cubic-bezier(0.23,1,0.32,1)] md:group-hover:text-white">
        {label}
      </span>
      <span className="text-left font-bold text-gray-50">{value}</span>
    </div>
  );
}

export function ImageInfos({ image }: { image: MetadataItem }) {
  const retro = useRetroMode();

  return (
    <div
      className={cn(
        "grid max-w-lg grid-cols-[max-content_1fr] gap-x-6 gap-y-1 text-sm",
        retro ? "font-retro text-[10px] leading-relaxed" : "font-mono",
      )}
    >
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
