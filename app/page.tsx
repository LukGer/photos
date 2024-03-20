import cloudinary from "@/lib/cloudinary";
import getBase64ImageUrl from "@/lib/generateBlurPlaceholder";
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
    images.push({
      height: result.height,
      width: result.width,
      public_id: result.public_id,
      format: result.format,
      origianlUrl: result.url,
      caption: result.context["custom"]["caption"],
      cameraModel: result.context["custom"]["Camera"],
      exposureTime: result.context["custom"]["ExposureTime"],
      apertureValue: result.context["custom"]["FNumber"],
      focalLength: result.context["custom"]["FocalLength"],
      iso: result.context["custom"]["ISO"],
    });
  }

  const blurImagePromises = images.map((image: ImageProps) => {
    return getBase64ImageUrl(image);
  });

  const imagesWithBlurDataUrls = await Promise.all(blurImagePromises);

  for (let i = 0; i < images.length; i++) {
    images[i].blurDataUrl = imagesWithBlurDataUrls[i];
  }

  return <ImageList images={images} />;
}
