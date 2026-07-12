"use client";

import { ditherImage } from "@/lib/dither";
import { useRetroMode } from "@/lib/retro-mode";
import { useEffect, useLayoutEffect, useRef, useState } from "react";

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

export function CrossfadeImage({ blurSrc, src, alt, loading = "lazy" }: CrossfadeImageProps) {
  const [loaded, setLoaded] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);
  const genRef = useRef(0);

  const retro = useRetroMode();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [retroReady, setRetroReady] = useState(false);

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

  // Precompute the retro (dithered) frame as soon as the image is loaded, so
  // toggling retro is just an opacity switch. Not gated on `retro`.
  useEffect(() => {
    if (!loaded) {
      setRetroReady(false);
      return;
    }
    const img = imgRef.current;
    const canvas = canvasRef.current;
    if (!img || !canvas || !isFetched(img)) return;

    let cancelled = false;
    const run = () => {
      if (cancelled) return;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const rect = img.getBoundingClientRect();
      const w = Math.round(rect.width * dpr);
      const h = Math.round(rect.height * dpr);
      if (w === 0 || h === 0) return;

      void ditherImage(img, w, h).then((bitmap) => {
        if (cancelled || !bitmap) return;
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext("2d");
        if (!ctx) return;
        ctx.drawImage(bitmap, 0, 0);
        setRetroReady(true);
      });
    };

    // If retro is already active, compute now; otherwise warm the cache during
    // idle time so the first toggle is instant.
    let idleId: number | undefined;
    if (retro) {
      run();
    } else if (typeof window.requestIdleCallback === "function") {
      idleId = window.requestIdleCallback(run);
    } else {
      idleId = window.setTimeout(run, 1);
    }

    return () => {
      cancelled = true;
      if (idleId === undefined) return;
      if (typeof window.cancelIdleCallback === "function") {
        window.cancelIdleCallback(idleId);
      } else {
        window.clearTimeout(idleId);
      }
    };
  }, [retro, loaded, src]);

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
      <canvas
        ref={canvasRef}
        aria-hidden
        data-ready={retro && retroReady}
        style={{ imageRendering: "pixelated" }}
        className="absolute inset-0 size-full object-cover opacity-0 transition-opacity duration-500 ease-out data-[ready=true]:opacity-100"
      />
    </>
  );
}
