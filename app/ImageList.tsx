"use client";

import ImageItem from "@/components/ImageItem";
import { FullImage } from "@/lib/types";

const ImageList = ({ images }: { images: FullImage[] }) => {
  return (
    <div className="grid grid-cols-[repeat(auto-fit,minmax(200px,1fr))] gap-6 p-4 [&>*]:relative [&>*]:z-10">
      {images.map((image, index) => (
        <ImageItem key={image.name} image={image} index={index} />
      ))}
    </div>
  );
};

export default ImageList;
