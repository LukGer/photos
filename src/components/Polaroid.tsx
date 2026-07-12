"use client";

import { CrossfadeImage } from "@/components/CrossfadeImage";
import { useRetroMode } from "@/lib/retro-mode";
import type { MetadataItem } from "@/lib/types";

export function Polaroid({ item }: { item: MetadataItem }) {
  const retro = useRetroMode();
  const rotation =
    (item.filename.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0) % 100) / 10 - 5;

  return (
    <div
      className={`flex h-full transform-[translateZ(0.01px)] cursor-pointer flex-col bg-white p-4 ${
        retro ? "rounded-none" : "rounded-sm"
      }`}
    >
      <div
        className={`relative aspect-square w-full overflow-hidden bg-gray-100 ${
          retro ? "rounded-none" : "rounded-xs"
        }`}
      >
        <CrossfadeImage
          blurSrc={item.blurDataURL}
          src={item.src}
          alt={item.title || item.filename}
        />
      </div>
      <div className="mt-4 flex h-20 flex-col pt-2">
        <div className="relative flex h-8 items-center justify-center">
          <span
            aria-hidden={retro}
            className={`font-handwritten absolute text-center text-2xl font-black transition-opacity duration-500 ease-out ${
              retro ? "opacity-0" : "opacity-100"
            }`}
            style={{ transform: `rotate(${rotation}deg)` }}
          >
            {item.title}
          </span>
          <span
            aria-hidden={!retro}
            className={`font-retro absolute text-center text-[10px] leading-relaxed uppercase transition-opacity duration-500 ease-out ${
              retro ? "opacity-100" : "opacity-0"
            }`}
          >
            {item.title}
          </span>
        </div>
        <div className="flex-1"></div>

        <div className="flex flex-row items-center justify-between">
          <span className="font-mono text-xs text-gray-400">{item.location}</span>

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
