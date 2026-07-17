"use client";

import { IconChevronLeft } from "@tabler/icons-react";
import { useRetroMode } from "@/lib/retro-mode";
import { Button } from "./ui/button";

export function BackButton() {
  const retro = useRetroMode();

  return (
    <Button
      size="icon"
      className="rounded-full text-white [@media(hover:hover)_and_(pointer:fine)]:hover:scale-[1.04]"
      asChild
    >
      <a href={retro ? "/?retro=1" : "/"}>
        <IconChevronLeft className="h-6 w-6" />
      </a>
    </Button>
  );
}
