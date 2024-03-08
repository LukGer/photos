import cloudinary from "../utils/cloudinary";
import type { ImageProps } from "../utils/types";
import ImageList from "./ImageList";

export default async function Page() {
  const results = await cloudinary.v2.search
    .expression(`folder:${process.env.CLOUDINARY_FOLDER}/*`)
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
      caption: results.context?.caption,
    });
  }

  console.log(images);

  return <ImageList images={images} />;
}
