import { imagekit } from "@/lib/imagekit";
import { FullImage } from "@/lib/types";
import { Metadata } from "next";
import ImageList from "./ImageList";

export const metadata: Metadata = {
  title: "Photos - Lukas Gerhold",
  description:
    "Photography portfolio by Lukas Gerhold. A collection of photos taken in the last years.",
  creator: "Lukas Gerhold",
};

export default async function Page() {
  const images = (await imagekit.listFiles({
    type: "file",
  })) as unknown as FullImage[];

  return (
    <main className="flex h-full flex-col">
      <div className="flex flex-row items-center px-4 pt-4 font-mono text-sm text-gray-900/30">
        <span className="font-bold">The Gallery</span>

        <div className="flex-1"></div>

        <a href="https://www.lukger.dev" target="_blank">
          (c) Lukas Gerhold {new Date().getFullYear()}
        </a>
      </div>
      <ImageList images={images} />
      <div className="pointer-events-none absolute inset-0 grid grid-cols-[repeat(auto-fit,minmax(200px,1fr))] gap-6">
        <div className="col-span-full row-span-full animate-[fade-in_1s_ease-out] border-zinc-800/30 [background-image:radial-gradient(circle,rgb(82_82_82/0.3)_1px,transparent_1px)] [background-size:24px_24px] [background-position:12px_12px]" />
      </div>
    </main>
  );
}
