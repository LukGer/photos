"use client";

import { Magnetic } from "@/components/Magnetic";
import { Polaroid } from "@/components/Polaroid";
import { useRetroMode } from "@/lib/retro-mode";
import type { MetadataItem } from "@/lib/types";
import { useReducedMotion } from "motion/react";

export function Gallery({ items }: { items: MetadataItem[] }) {
  const retro = useRetroMode();
  const reduceMotion = useReducedMotion();

  return (
    <div className="grid flex-1 grid-cols-[repeat(auto-fill,minmax(min(100%,300px),1fr))] gap-6">
      {items.map((item, index) => (
        <a
          key={item.filename}
          href={`/p/${item.filename}`}
          className="gallery-card-enter relative block min-h-0 min-w-0"
          style={{ animationDelay: reduceMotion ? "0ms" : `${Math.min(index, 12) * 42}ms` }}
        >
          <Magnetic maxTilt={8} contentClassName={retro ? "rounded-none" : undefined}>
            <Polaroid item={item} />
          </Magnetic>
        </a>
      ))}
    </div>
  );
}
