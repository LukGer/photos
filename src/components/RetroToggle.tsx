"use client";

import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { setRetroMode, useRetroMode } from "@/lib/retro-mode";
import { cn } from "@/lib/utils";
import { IconDeviceGamepad, IconPhoto } from "@tabler/icons-react";

export function RetroToggle({ variant = "default" }: { variant?: "default" | "dark" }) {
  const retro = useRetroMode();
  const dark = variant === "dark";

  return (
    <Tabs
      value={retro ? "retro" : "normal"}
      onValueChange={(value) => setRetroMode(value === "retro")}
    >
      <TabsList
        className={cn(
          "h-8",
          dark &&
            "bg-white/10 text-white/45 [&_[data-slot=tabs-indicator]]:bg-white/15 [&_[data-slot=tabs-indicator]]:shadow-none",
        )}
      >
        <TabsTrigger
          value="normal"
          aria-label="Normal mode"
          title="Normal"
          className={dark ? "data-selected:text-white" : undefined}
        >
          <IconPhoto />
        </TabsTrigger>
        <TabsTrigger
          value="retro"
          aria-label="Retro mode"
          title="Retro"
          className={dark ? "data-selected:text-lime-400" : undefined}
        >
          <IconDeviceGamepad className={dark ? "text-lime-400" : "text-lime-600"} />
        </TabsTrigger>
      </TabsList>
    </Tabs>
  );
}
