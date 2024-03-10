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
  const results = await cloudinary.v2.search
    .expression(`tags:${process.env.CLOUDINARY_TAG}`)
    .sort_by("public_id", "desc")
    .with_field("context")
    .execute();

  const images: ImageProps[] = [];

  for (let result of results.resources) {
    images.push({
      height: result.height,
      width: result.width,
      public_id: result.public_id,
      asset_id: result.asset_id,
      format: result.format,
      caption: result.context?.caption,
    });
  }

  return <ImageList images={images} />;
}
