export interface MetadataItem {
  filename: string;
  title: string;
  /** City / region / country — from EXIF, GPS (reverse geocode), or manual. */
  location: string;
  src: string;
  width: number;
  height: number;
  iso: number | null;
  aperture: string | null;
  shutter: string | null;
  camera: string | null;
  lens?: string | null;
  date: string | null;
  blurhash: string;
  blurDataURL: string;
  /** Precomputed retro (palette-dithered) variant — baked at build, see scripts/dither-cpu.ts. */
  retroSrc: string;
  /** Hash of the dither params used for `retroSrc` — regenerate when it changes. */
  retroParamsHash: string;
  /** SHA-256 of raw source bytes in `images/` — skip reprocessing when unchanged (CI-safe). */
  sourceSha256?: string;
}
