"use client";

import Carousel from "@/components/Carousel";
import { ImageProps } from "@/utils/types";
import { useSearchParams } from "next/navigation";

export default function ImageView({
  currentPhoto,
}: {
  currentPhoto: ImageProps;
}) {
  const params = useSearchParams();

  const asset_id = params.get("asset_id");

  let index = 0;

  const currentPhotoUrl = `https://res.cloudinary.com/${process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME}/image/upload/c_scale,w_2560/${currentPhoto.public_id}.${currentPhoto.format}`;

  return (
    <>
      <main className="mx-auto max-w-[1960px] p-4">
        <Carousel currentPhoto={currentPhoto} index={index} />
      </main>
    </>
  );
}
