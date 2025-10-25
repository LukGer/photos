// app/photos/page.tsx
import Masonry, { MasonryItem } from "@/components/Masonry";
import { readFileSync } from "fs";
import { Metadata } from "next";
import { join } from "path";

export const metadata: Metadata = {
  title: "Photos - Lukas Gerhold",
  description:
    "Photography portfolio by Lukas Gerhold. A collection of photos taken in the last years.",
  creator: "Lukas Gerhold",
};

// Tell Next.js to statically revalidate this page every 24h (optional)
export const revalidate = 86400; // seconds = 1 day

interface MetadataItem {
  filename: string;
  src: string;
  iso: number | null;
  aperture: string | null;
  shutter: string | null;
  camera: string | null;
  lens: string | null;
  date: string | null;
  width: number;
  height: number;
}

function getItems(): MasonryItem[] {
  const filePath = join(process.cwd(), "public", "meta.json");
  const fileContents = readFileSync(filePath, "utf8");
  const items = JSON.parse(fileContents) as MetadataItem[];

  return items
    .sort(
      (a, b) =>
        new Date(b.date || 0).getTime() - new Date(a.date || 0).getTime(),
    )
    .map((item) => ({
      id: item.filename,
      img: item.src,
      url: `/p/${item.filename}`,
      height: item.height * 0.5,
      width: item.width,
    }));
}

export default function Page() {
  const items = getItems();

  return (
    <main className="flex flex-col gap-2 p-4">
      <div className="flex flex-row px-1.5">
        <h1 className="font-mono text-4xl font-bold">The Gallery</h1>

        <div className="flex-1"></div>

        <span className="text-xs">(c) 2025 Lukas Gerhold</span>
      </div>
      <div className="flex-1">
        <Masonry
          items={items}
          ease="power3.out"
          duration={0.6}
          stagger={0.1}
          animateFrom="bottom"
          scaleOnHover
          hoverScale={0.95}
          blurToFocus
          colorShiftOnHover
        />
      </div>
    </main>
  );
}
