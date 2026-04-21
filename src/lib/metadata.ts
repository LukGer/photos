import { readFileSync } from "node:fs";
import { join } from "node:path";
import type { MetadataItem } from "./types";

export function loadMetadata(): MetadataItem[] {
  const filePath = join(process.cwd(), "public", "meta.json");
  const fileContents = readFileSync(filePath, "utf8");
  return JSON.parse(fileContents) as MetadataItem[];
}

export function getSortedMetadata(): MetadataItem[] {
  const items = loadMetadata();
  return items.sort(
    (a, b) => new Date(b.date || 0).getTime() - new Date(a.date || 0).getTime(),
  );
}
