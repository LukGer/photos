"use client";

import { useRetroMode } from "@/lib/retro-mode";
import { cn } from "@/lib/utils";
import { useDeferredValue, useEffect, useLayoutEffect, useRef, useState } from "react";

type CrossfadeImageProps = {
  blurSrc: string;
  src: string;
  /** Precomputed retro (palette-dithered) variant, baked at build time. */
  retroSrc: string;
  alt: string;
  loading?: "lazy" | "eager";
  /** `cover` fills a square (gallery). `contain` sizes to the image (detail). */
  fit?: "cover" | "contain";
  width?: number;
  height?: number;
  className?: string;
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
  retroSrc,
  alt,
  loading = "lazy",
  fit = "cover",
  width,
  height,
  className,
}: CrossfadeImageProps) {
  const [loaded, setLoaded] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);
  const genRef = useRef(0);

  // Defer the image reveal so a toggle click paints the control immediately and
  // the (heavier) crossfade across every tile follows as a low-priority update.
  const retro = useDeferredValue(useRetroMode());
  const retroImgRef = useRef<HTMLImageElement>(null);
  const [retroLoaded, setRetroLoaded] = useState(false);

  const contain = fit === "contain";

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

  // Decode the retro bitmap while it's still hidden so toggling doesn't trigger a
  // decode storm across every tile (which would jank the crossfade + tab animation).
  const markRetroReady = () => {
    const img = retroImgRef.current;
    if (!img) return;
    void (typeof img.decode === "function" ? img.decode().catch(() => undefined) : Promise.resolve())
      .then(() => setRetroLoaded(true));
  };

  // The retro <img> loads eagerly, so it may already be complete (cache hit)
  // before React attaches onLoad. Reconcile against the actual element.
  useEffect(() => {
    const img = retroImgRef.current;
    if (img && isFetched(img)) markRetroReady();
    else setRetroLoaded(false);
  }, [retroSrc]);

  if (contain && width && height) {
    return (
      <div
        className={cn("relative max-h-[80vh] max-w-full", className)}
        style={{
          aspectRatio: `${width} / ${height}`,
          width: `min(100%, calc(80vh * ${width} / ${height}))`,
        }}
      >
        <img
          src={blurSrc}
          alt=""
          aria-hidden
          width={width}
          height={height}
          data-loaded={loaded}
          className="pointer-events-none absolute inset-0 size-full scale-105 object-cover blur-xl transition-opacity duration-500 ease-out data-[loaded=false]:opacity-100 data-[loaded=true]:opacity-0"
        />
        <img
          ref={imgRef}
          src={src}
          alt={alt}
          width={width}
          height={height}
          loading={loading}
          decoding="async"
          onLoad={() => revealWhenCurrent(genRef.current)}
          className={cn(
            "relative size-full object-cover transition-opacity duration-500 ease-out",
            loaded ? "opacity-100" : "opacity-0",
          )}
        />
        <img
          ref={retroImgRef}
          src={retroSrc}
          alt=""
          aria-hidden
          loading="lazy"
          decoding="async"
          fetchPriority="low"
          onLoad={() => setRetroLoaded(true)}
          data-ready={retro && retroLoaded}
          style={{ imageRendering: "pixelated" }}
          className="pointer-events-none absolute inset-0 size-full object-cover opacity-0 transition-opacity duration-500 ease-out data-[ready=true]:opacity-100"
        />
      </div>
    );
  }

  return (
    <>
      <img
        src={blurSrc}
        alt=""
        aria-hidden
        width={width}
        height={height}
        data-loaded={loaded}
        className="absolute inset-0 size-full scale-110 object-cover blur-xl transition-opacity duration-500 ease-out data-[loaded=false]:opacity-100 data-[loaded=true]:opacity-0"
      />
      <img
        ref={imgRef}
        src={src}
        alt={alt}
        width={width}
        height={height}
        loading={loading}
        decoding="async"
        onLoad={() => revealWhenCurrent(genRef.current)}
        className={`absolute inset-0 size-full object-cover transition-opacity duration-500 ease-out ${
          loaded ? "opacity-100" : "opacity-0"
        }`}
      />
      <img
        ref={retroImgRef}
        src={retroSrc}
        alt=""
        aria-hidden
        loading="lazy"
        decoding="async"
        fetchPriority="low"
        onLoad={markRetroReady}
        data-ready={retro && retroLoaded}
        style={{ imageRendering: "pixelated", willChange: "opacity", transform: "translateZ(0)" }}
        className="pointer-events-none absolute inset-0 size-full object-cover opacity-0 transition-opacity duration-500 ease-out data-[ready=true]:opacity-100"
      />
    </>
  );
}
