import { readFileSync } from "fs";
import Image from "next/image";
import { join } from "path";

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

function getImageData(slug: string): MetadataItem | null {
  try {
    const filePath = join(process.cwd(), "public", "meta.json");
    const fileContents = readFileSync(filePath, "utf8");
    const items = JSON.parse(fileContents) as MetadataItem[];

    return items.find((item) => item.filename === slug) || null;
  } catch (error) {
    console.error("Error reading metadata:", error);
    return null;
  }
}

export default async function PhotoPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const imageData = getImageData(slug);

  if (!imageData) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <h1 className="mb-2 text-2xl font-bold">Image not found</h1>
          <p className="text-gray-600">
            The requested image could not be found.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen justify-center bg-black pt-[10vh]">
      <div className="relative max-h-[80vh] max-w-full">
        <Image
          src={imageData.src}
          alt={imageData.filename}
          width={imageData.width}
          height={imageData.height}
          className="max-h-[80vh] max-w-full object-contain"
          priority
        />
      </div>
    </div>
  );
}
