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
    </main>
  );
}
