"use client";

import { FullImage } from "@/lib/types";
import { motion, useInView } from "framer-motion";
import { IKImage } from "imagekitio-next";
import Link from "next/link"; // added import
import { useRef } from "react";

interface ImageItemProps {
  image: FullImage;
  index: number;
}

const ImageItem = ({ image, index }: ImageItemProps) => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "100px" });

  return (
    <Link href={`/${image.name}`}>
      <motion.div
        ref={ref}
        className="group flex min-h-[200px] flex-col gap-2"
        initial={{ opacity: 0 }}
        animate={isInView ? { opacity: 1 } : {}}
        transition={{
          duration: 0.5,
          delay: 0.1 + index * 0.1,
          ease: "easeOut",
        }}
      >
        <motion.div
          initial={{ clipPath: "inset(100% 0 0 0)" }}
          animate={isInView ? { clipPath: "inset(0% 0 0 0)" } : {}}
          transition={{
            duration: 0.7,
            delay: 0.2 + index * 0.1,
            ease: "easeInOut",
          }}
        >
          <IKImage
            urlEndpoint={process.env.NEXT_PUBLIC_IMAGEKIT_URL_ENDPOINT}
            path={image.name}
            alt={image.name}
            className="h-auto w-full"
            loading="lazy"
            width={400}
            height={300}
          />
        </motion.div>

        <div className="flex flex-row items-center font-mono text-xs text-gray-900/30 transition-all select-none group-hover:font-bold group-hover:text-gray-900/60">
          <span>{index.toString().padStart(2, "0")}</span>
          <div className="flex-1"></div>
          <span className="bg-white">{image.name}</span>
        </div>
      </motion.div>
    </Link>
  );
};

export default ImageItem;
