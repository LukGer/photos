"use client";

import { useLayoutEffect, useRef, useState } from "react";

type CrossfadeImageProps = {
  blurSrc: string;
  src: string;
  alt: string;
  loading?: "lazy" | "eager";
};

function isFetched(img: HTMLImageElement) {
  return img.complete && img.naturalWidth > 0;
}

/** Resolves when the bitmap is decoded and safe to show (unlike `complete` / `load` alone). */
async function waitPaintable(img: HTMLImageElement): Promise<void> {
  if (typeof img.decode !== "function") return Promise.resolve();
  return img.decode().catch(() => undefined);
}

export function CrossfadeImage({
  blurSrc,
  src,
  alt,
  loading = "lazy",
}: CrossfadeImageProps) {
  const [loaded, setLoaded] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);
  const genRef = useRef(0);

  const revealWhenCurrent = (gen: number) => {
    const img = imgRef.current;
    if (!img) return;
    void waitPaintable(img).then(() => {
      if (genRef.current === gen) setLoaded(true);
    });
  };

  useLayoutEffect(() => {
    const gen = ++genRef.current;
    setLoaded(false);

    const img = imgRef.current;
    if (img && isFetched(img)) {
      revealWhenCurrent(gen);
    }
  }, [src]);

  return (
    <>
      <img
        src={blurSrc}
        alt=""
        aria-hidden
        data-loaded={loaded}
        className="absolute inset-0 size-full scale-110 object-cover blur-xl transition-opacity duration-500 ease-out data-[loaded=false]:opacity-100 data-[loaded=true]:opacity-0"
      />
      <img
        ref={imgRef}
        src={src}
        alt={alt}
        loading={loading}
        decoding="async"
        onLoad={() => revealWhenCurrent(genRef.current)}
        className={`absolute inset-0 size-full object-cover transition-opacity duration-500 ease-out ${
          loaded ? "opacity-100" : "opacity-0"
        }`}
      />
    </>
  );
}
