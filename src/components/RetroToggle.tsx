"use client";

import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { setRetroMode, useRetroMode } from "@/lib/retro-mode";
import { IconDeviceGamepad, IconPhoto } from "@tabler/icons-react";

export function RetroToggle() {
  const retro = useRetroMode();

  return (
    <Tabs
      value={retro ? "retro" : "normal"}
      onValueChange={(value) => setRetroMode(value === "retro")}
    >
      <TabsList className="h-8">
        <TabsTrigger value="normal" aria-label="Normal mode" title="Normal">
          <IconPhoto />
        </TabsTrigger>
        <TabsTrigger value="retro" aria-label="Retro mode" title="Retro">
          <IconDeviceGamepad className="text-lime-600" />
        </TabsTrigger>
      </TabsList>
    </Tabs>
  );
}
