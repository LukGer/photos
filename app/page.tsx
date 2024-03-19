import cloudinary from "@/lib/cloudinary";
import type { ImageProps } from "@/lib/types";
import { Metadata } from "next";
import ImageList from "./ImageList";

export const metadata: Metadata = {
  title: "Photos - Lukas Gerhold",
  description:
    "Photography portfolio by Lukas Gerhold. A collection of photos taken in the last years.",
};

export default async function Page() {
  const results = await cloudinary.v2.api.resources_by_tag(
    process.env.CLOUDINARY_TAG,
    { context: true },
  );

  const images: ImageProps[] = [];

  for (let result of results.resources) {
    console.log(result.exif);
    images.push({
      height: result.height,
      width: result.width,
      public_id: result.public_id,
      asset_id: result.asset_id,
      format: result.format,
      caption: result.context["custom"]["caption"],
    });
  }

  return <ImageList images={images} />;
}
