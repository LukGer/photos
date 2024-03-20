"use client";

import Modal from "@/components/ui/Modal";
import { ImageProps } from "@/lib/types";
import {
  AnimatePresence,
  MotionValue,
  motion,
  useScroll,
  useTransform,
} from "framer-motion";
import Image from "next/image";
import { useRef, useState } from "react";

export default function ImageList({ images }: { images: ImageProps[] }) {
  const gridRef = useRef<any>(null);

  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);

  const { scrollYProgress } = useScroll({
    container: gridRef,
  });

  const translateFirst = useTransform(scrollYProgress, [0, 1], [0, -100]);
  const translateSecond = useTransform(scrollYProgress, [0, 1], [0, 0]);
  const translateThird = useTransform(scrollYProgress, [0, 1], [0, 100]);

  const third = Math.ceil(images.length / 3);

  const firstPart = images.slice(0, third);
  const secondPart = images.slice(third, 2 * third);
  const thirdPart = images.slice(2 * third);

  return (
    <>
      <main
        className="w-full items-start overflow-y-auto bg-slate-50 dark:bg-slate-950 dark:text-white"
        ref={gridRef}
      >
        <div className="flex flex-row items-center bg-slate-50 px-20 py-5 dark:bg-slate-950 dark:text-white">
          <a className="text-xl font-bold" href="/">
            The Gallery
          </a>
        </div>
        <div
          className="mx-auto grid max-w-5xl grid-cols-1 items-start  gap-5 px-10 pt-10 md:grid-cols-2 lg:grid-cols-3"
          ref={gridRef}
        >
          <div className="grid gap-5">
            {firstPart.map((image) => (
              <GridImage
                index={images.indexOf(image)}
                key={image.public_id}
                image={image}
                translateY={translateFirst}
                setSelectedIndex={setSelectedIndex}
              />
            ))}
          </div>
          <div className="grid gap-5">
            {secondPart.map((image) => (
              <GridImage
                index={images.indexOf(image)}
                key={image.public_id}
                image={image}
                translateY={translateSecond}
                setSelectedIndex={setSelectedIndex}
              />
            ))}
          </div>
          <div className="grid gap-5">
            {thirdPart.map((image) => (
              <GridImage
                index={images.indexOf(image)}
                key={image.public_id}
                image={image}
                translateY={translateThird}
                setSelectedIndex={setSelectedIndex}
              />
            ))}
          </div>
        </div>
        <div className="grid place-items-center py-10">
          <span className="font-bold">by Lukas Gerhold</span>
        </div>
      </main>
      <AnimatePresence>
        <Modal
          key={selectedIndex}
          images={images}
          selectedIndex={selectedIndex}
          setSelectedIndex={setSelectedIndex}
        />
      </AnimatePresence>
    </>
  );
}

function GridImage({
  index,
  image,
  translateY,
  setSelectedIndex,
}: {
  index: number;
  image: ImageProps;
  translateY: MotionValue;
  setSelectedIndex: (index: number) => void;
}) {
  return (
    <motion.div
      className="group relative overflow-y-clip"
      style={{ y: translateY }}
      whileHover={{ scale: 1.025, transition: { duration: 0.2 } }}
      whileTap={{ scale: 0.975, transition: { duration: 0.2 } }}
      onClick={() => setSelectedIndex(index)}
    >
      <Image
        alt={image.caption}
        blurDataURL={image.blurDataUrl}
        placeholder="blur"
        className="transform rounded-lg brightness-100 transition will-change-auto group-hover:brightness-110"
        style={{ transform: "translate3d(0, 0, 0)" }}
        src={`https://res.cloudinary.com/${process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME}/image/upload/c_scale,w_720/${image.public_id}.${image.format}`}
        width={720}
        height={480}
        sizes="(max-width: 640px) 100vw,
                  (max-width: 1280px) 50vw,
                  (max-width: 1536px) 33vw,
                  25vw"
      />
      <div className="absolute bottom-2 flex w-full translate-y-full flex-col items-center text-white opacity-0 transition-all group-hover:translate-y-0 group-hover:opacity-100">
        <span>{image.caption}</span>
      </div>
    </motion.div>
  );
}
