import { ImageProps } from "@/lib/types";
import ColorThief from "colorthief";
import { AnimatePresence, motion } from "framer-motion";
import { ApertureIcon, CameraIcon, RulerIcon } from "lucide-react";
import Image from "next/image";
import { useEffect, useRef, useState } from "react";

export default function Modal({
  images,
  selectedIndex,
  setSelectedIndex,
}: {
  images: ImageProps[];
  selectedIndex: number | null;
  setSelectedIndex: (index: number | null) => void;
}) {
  function prev(event: Event) {
    event.stopPropagation();
    setSelectedIndex(selectedIndex - 1);
  }

  function next(event: Event) {
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
      initial={{ backgroundColor: "rgba(0, 0, 0, 0)" }}
      animate={{ backgroundColor: `rgba(${dominantColor.join(", ")}, 0.6)` }}
      exit={{ backgroundColor: "rgba(0, 0, 0, 0)" }}
      className="fixed inset-0 flex items-center justify-center gap-6"
      onClick={() => setSelectedIndex(null)}
    >
      {selectedIndex !== 0 && (
        <motion.button
          initial={{ opacity: 0, x: 50 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: 50 }}
          transition={{ duration: 0.3 }}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.95 }}
          className="rounded-full bg-white p-2"
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
      )}
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
              className="transform rounded-lg brightness-100 transition will-change-auto group-hover:brightness-110"
              style={{ transform: "translate3d(0, 0, 0)" }}
              src={`https://res.cloudinary.com/${process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME}/image/upload/f_auto,q_auto/${image.public_id}`}
              width={720}
              height={480}
              priority
            />

            <button
              className="absolute right-2 top-2 rounded-full bg-white p-1"
              onClick={() => setShowImageInfo((prev) => !prev)}
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
                  d="m11.25 11.25.041-.02a.75.75 0 0 1 1.063.852l-.708 2.836a.75.75 0 0 0 1.063.853l.041-.021M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9-3.75h.008v.008H12V8.25Z"
                />
              </svg>
            </button>
          </div>
        </div>

        <AnimatePresence>
          {showImageInfo && (
            <motion.div
              className="absolute bottom-0 left-0 flex h-12 w-full flex-row items-center gap-2 bg-white px-4"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
            >
              <CameraIcon></CameraIcon>

              <span className="font-bold">{image.cameraModel ?? "-"}</span>

              <ApertureIcon></ApertureIcon>

              <span className="font-bold">{image.apertureValue ?? "-"}</span>

              <RulerIcon></RulerIcon>

              <span className="font-bold">{image.focalLength ?? "-"}</span>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {selectedIndex !== images.length - 1 && (
        <motion.button
          initial={{ opacity: 0, x: -50 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -50 }}
          transition={{ duration: 0.3 }}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.95 }}
          className="rounded-full bg-white p-2"
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
      )}
    </motion.div>
  );
}
