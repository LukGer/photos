import { ImageProps } from "@/lib/types";
import ColorThief from "colorthief";
import { AnimatePresence, motion } from "framer-motion";
import {
  ApertureIcon,
  CameraIcon,
  CircleArrowOutUpRight,
  InfoIcon,
  RulerIcon,
  TimerIcon,
} from "lucide-react";
import Image from "next/image";
import { UIEvent, useEffect, useRef, useState } from "react";

export default function Modal({
  images,
  selectedIndex,
  setSelectedIndex,
}: {
  images: ImageProps[];
  selectedIndex: number | null;
  setSelectedIndex: (index: number | null) => void;
}) {
  function prev(event: UIEvent | KeyboardEvent) {
    event.stopPropagation();
    setSelectedIndex(selectedIndex - 1);
  }

  function next(event: UIEvent | KeyboardEvent) {
    event.stopPropagation();
    setSelectedIndex(selectedIndex + 1);
  }

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setSelectedIndex(null);
      } else if (
        event.key === "ArrowRight" &&
        selectedIndex !== images.length - 1
      ) {
        next(event);
      } else if (event.key === "ArrowLeft" && selectedIndex !== 0) {
        prev(event);
      }
    }

    window.addEventListener("keydown", onKeyDown);

    return () => {
      window.removeEventListener("keydown", onKeyDown);
    };
  });

  const imageRef = useRef<HTMLImageElement>(null);

  const [showImageInfo, setShowImageInfo] = useState(false);
  const [dominantColor, setDominantColor] = useState([0, 0, 0]);

  const colorThief = new ColorThief();

  useEffect(() => {
    imageRef?.current?.addEventListener("load", function () {
      if (imageRef.current === null) return;
      const color = colorThief.getColor(imageRef.current);

      setDominantColor(color);
    });
  }, [imageRef]);

  if (selectedIndex === null) return null;

  const image = images[selectedIndex];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{
        backgroundColor: `rgba(${dominantColor.join(", ")}, 0.75)`,
        opacity: 1,
      }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 flex items-center justify-center gap-6"
      onClick={() => setSelectedIndex(null)}
    >
      <motion.button
        disabled={selectedIndex === 0}
        initial={{ opacity: 0, x: 50 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: 50 }}
        transition={{ duration: 0.3 }}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.95 }}
        className="rounded-full bg-white p-2 disabled:!opacity-50"
        onClick={(e) => prev(e)}
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={1.5}
          stroke="currentColor"
          className="h-6 w-6"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M10.5 19.5 3 12m0 0 7.5-7.5M3 12h18"
          />
        </svg>
      </motion.button>

      <motion.div
        initial={{
          opacity: 0,
        }}
        animate={{
          opacity: 1,
        }}
        exit={{
          opacity: 0,
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex flex-col gap-2">
          <span className="text-xl text-white">
            {images[selectedIndex].caption}
          </span>

          <div className="relative">
            <Image
              ref={imageRef}
              alt={image.caption}
              blurDataURL={image.blurDataUrl}
              placeholder="blur"
              className="rounded-lg"
              src={`https://res.cloudinary.com/${process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME}/image/upload/q_auto:best/${image.public_id}`}
              width={image.width}
              height={image.height}
              layout="responsive"
              priority
            />

            <div className="absolute right-3 top-3 flex flex-col gap-3">
              <button
                className="rounded-full bg-white p-1"
                onClick={() => setShowImageInfo((prev) => !prev)}
              >
                <InfoIcon></InfoIcon>
              </button>

              <a
                className="rounded-full bg-white p-1"
                href={image.originalUrl}
                target="_blank"
              >
                <CircleArrowOutUpRight />
              </a>
            </div>

            <AnimatePresence>
              {showImageInfo && (
                <motion.div
                  className="absolute bottom-0 left-0 flex h-12 w-full flex-row items-center justify-between gap-2 rounded-b-lg bg-black/50 px-4 text-white"
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 5 }}
                >
                  <div className="flex flex-row items-center gap-2">
                    <CameraIcon></CameraIcon>

                    <span className=" font-bold">
                      {image.cameraModel ?? "-"}
                    </span>
                  </div>

                  <div className="flex flex-row items-center gap-2">
                    <ApertureIcon></ApertureIcon>

                    <span className=" font-bold">
                      {image.apertureValue ?? "-"}
                    </span>
                  </div>

                  <div className="flex flex-row items-center gap-2">
                    <RulerIcon></RulerIcon>

                    <span className="font-bold">
                      {image.focalLength ?? "-"}
                    </span>
                  </div>

                  <div className="flex flex-row items-center gap-2">
                    <TimerIcon></TimerIcon>

                    <span className=" font-bold">
                      {image.exposureTime ?? "-"}
                    </span>
                  </div>

                  <div className="flex flex-row items-center gap-2">
                    <div className="rounded-md border-2 border-white px-[2px]">
                      <span className="text-xs font-bold">ISO</span>
                    </div>

                    <span className="font-bold">{image.iso ?? "-"}</span>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </motion.div>

      <motion.button
        disabled={selectedIndex === images.length - 1}
        initial={{ opacity: 0, x: -50 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: -50 }}
        transition={{ duration: 0.3 }}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.95 }}
        className="rounded-full bg-white p-2 disabled:!opacity-50"
        onClick={(e) => next(e)}
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={1.5}
          stroke="currentColor"
          className="h-6 w-6"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3"
          />
        </svg>
      </motion.button>
    </motion.div>
  );
}
