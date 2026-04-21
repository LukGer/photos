"use client";

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
    <div className="flex h-full transform-[translateZ(0.01px)] cursor-pointer flex-col rounded-sm bg-white p-4">
      <div className="relative aspect-square w-full overflow-hidden rounded-xs bg-gray-100">
        <img
          src={item.blurDataURL}
          alt=""
          aria-hidden
          className="absolute inset-0 size-full scale-110 object-cover blur-xl"
        />
        <img
          src={item.src}
          alt={item.title || item.filename}
          loading="lazy"
          decoding="async"
          className="absolute inset-0 size-full object-cover"
        />
      </div>
      <div className="mt-4 flex h-20 flex-col pt-2">
        <span
          className="font-handwritten self-center text-2xl font-black"
          style={{ transform: `rotate(${rotation}deg)` }}
        >
          {item.title}
        </span>
        <div className="flex-1"></div>

        <div className="flex flex-row items-center justify-between">
          <span className="font-mono text-xs text-gray-400">
            {item.location}
          </span>

          <span className="font-mono text-xs text-gray-400">
            {item.date
              ? new Date(item.date).toLocaleDateString("en-US", {
                  year: "numeric",
                  month: "short",
                })
              : ""}
          </span>
        </div>
      </div>
    </div>
  );
}
