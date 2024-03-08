import getResults from "@/utils/cachedImages";
import cloudinary from "@/utils/cloudinary";
import type { ImageProps } from "@/utils/types";
import ImageView from "./ImageView";

export default async function Page({
  params,
}: {
  params: { asset_id: string };
}) {
  const results = await getResults();

  let reducedResults: ImageProps[] = [];
  for (let result of results.resources) {
    reducedResults.push({
      height: result.height,
      width: result.width,
      public_id: result.public_id,
      asset_id: result.asset_id,
      format: result.format,
      caption: result.context?.caption,
    });
  }

  const currentPhoto = reducedResults.find(
    (img) => img.asset_id === params.asset_id,
  );

  return <ImageView currentPhoto={currentPhoto} />;
}

export async function generateStaticParams() {
  const results = await cloudinary.v2.search
    .expression(`folder:${process.env.CLOUDINARY_FOLDER}/*`)
    .sort_by("public_id", "desc")
    .max_results(400)
    .execute();

  let fullPaths = [];
  for (const result of results.resources) {
    fullPaths.push({ params: { asset_id: result.asset_id } });
  }

  return fullPaths;
}
