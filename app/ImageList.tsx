"use client";

import ImageItem from "@/components/ImageItem";
import { FullImage } from "@/lib/types";
import { motion } from "framer-motion";

const ImageList = ({ images }: { images: FullImage[] }) => {
  return (
    <div className="relative flex-1">
      <div className="grid grid-cols-[repeat(auto-fit,minmax(200px,1fr))] gap-6 p-4 [&>*]:relative [&>*]:z-10">
        {images.map((image, index) => (
          <ImageItem key={image.name} image={image} index={index} />
        ))}
      </div>
      <div className="pointer-events-none absolute inset-0 grid grid-cols-[repeat(auto-fit,minmax(200px,1fr))] gap-6">
        <motion.div
          className="col-span-full row-span-full border-zinc-800/30 [background-image:radial-gradient(circle,rgb(82_82_82/0.3)_1px,transparent_1px)] [background-size:24px_24px] [background-position:12px_12px]"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{
            duration: 1,
            ease: "easeOut",
          }}
        />
      </div>
    </div>
  );
};

export default ImageList;
