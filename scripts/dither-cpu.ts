/**
 * Build-time CPU port of the WebGL palette-dither (see src/lib/dither.ts, the
 * reference spec). Produces a fixed-resolution, chunky retro variant as an
 * indexed PNG so the look is baked at build instead of computed per-visitor.
 *
 * The algorithm mirrors the shader exactly: Bayer-8 ordered dithering between
 * the two nearest palette colors, in raw sRGB byte space (no linearization),
 * strength = 1.0 so the threshold is the pure Bayer value.
 */

import { createHash } from "node:crypto";
import type { Sharp } from "sharp";
import sharp from "sharp";

// 12-color reference palette: cool teal -> azure ramp against a warm rust -> sand ramp.
const PALETTE_HEX = [
  "#062427", "#1F4C5D", "#26718B", "#3381B3", "#4C9ECF", "#79B1CA",
  "#3E1E14", "#6E4630", "#A68464", "#CBB89F", "#DED5C3", "#E1EAE4",
];

/** Long edge of the baked retro image; CSS upscales it with `image-rendering: pixelated`. */
const LONG_EDGE = 512;
/** Dither at 1px blocks — the chunky grid comes from the low LONG_EDGE, not big blocks. */
const PIXEL_SIZE = 1;
const STRENGTH = 1.0;

/** Bump implicitly via any param change — hashed into meta so retro PNGs regenerate on tweak. */
const ALGO_VERSION = 1;

function hexToRgb255(hex: string): [number, number, number] {
  const n = parseInt(hex.slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

const PALETTE = PALETTE_HEX.map(hexToRgb255);

// 8x8 Bayer matrix, values normalized to [0,1) — matches bayer8() in the shader.
const BAYER = [
  0, 32, 8, 40, 2, 34, 10, 42, 48, 16, 56, 24, 50, 18, 58, 26,
  12, 44, 4, 36, 14, 46, 6, 38, 60, 28, 52, 20, 62, 30, 54, 22,
  3, 35, 11, 43, 1, 33, 9, 41, 51, 19, 59, 27, 49, 17, 57, 25,
  15, 47, 7, 39, 13, 45, 5, 37, 63, 31, 55, 23, 61, 29, 53, 21,
].map((v) => v / 64);

/** Hash of every parameter that affects the output — stored per-item for cache invalidation. */
export const RETRO_PARAMS_HASH: string = createHash("sha256")
  .update(JSON.stringify({ PALETTE_HEX, LONG_EDGE, PIXEL_SIZE, STRENGTH, ALGO_VERSION }))
  .digest("hex")
  .slice(0, 16);

/** Squared distances to the two nearest palette entries; returns their indices. */
function nearest2(r: number, g: number, b: number): [number, number] {
  let d1 = Infinity;
  let d2 = Infinity;
  let i1 = 0;
  let i2 = 1;
  for (let i = 0; i < PALETTE.length; i++) {
    const [pr, pg, pb] = PALETTE[i];
    const er = r - pr;
    const eg = g - pg;
    const eb = b - pb;
    const d = er * er + eg * eg + eb * eb;
    if (d < d1) {
      d2 = d1;
      i2 = i1;
      d1 = d;
      i1 = i;
    } else if (d < d2) {
      d2 = d;
      i2 = i;
    }
  }
  return [i1, i2];
}

/**
 * Renders the palette-dithered retro PNG for `image` and returns the buffer.
 * Downscales to LONG_EDGE first so the pixel grid is stable regardless of
 * display size, then dithers per pixel.
 */
export async function renderRetroPng(image: Sharp): Promise<Buffer> {
  const { data, info } = await image
    .clone()
    .resize(LONG_EDGE, LONG_EDGE, { fit: "inside", withoutEnlargement: false })
    .removeAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });

  const { width, height, channels } = info;
  const out = Buffer.alloc(width * height * 3);

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const si = (y * width + x) * channels;
      const r = data[si];
      const g = data[si + 1];
      const b = data[si + 2];

      const [i1, i2] = nearest2(r, g, b);
      const [c1r, c1g, c1b] = PALETTE[i1];
      const [c2r, c2g, c2b] = PALETTE[i2];

      // Project src onto the c1->c2 axis to get the mix parameter t (as in the shader).
      const dr = c2r - c1r;
      const dg = c2g - c1g;
      const db = c2b - c1b;
      const denom = dr * dr + dg * dg + db * db + 1e-6;
      let t = ((r - c1r) * dr + (g - c1g) * dg + (b - c1b) * db) / denom;
      t = t < 0 ? 0 : t > 1 ? 1 : t;

      const qx = Math.floor(x / PIXEL_SIZE) & 7;
      const qy = Math.floor(y / PIXEL_SIZE) & 7;
      const thr = 0.5 * (1 - STRENGTH) + BAYER[qy * 8 + qx] * STRENGTH;

      const chosen = t > thr ? [c2r, c2g, c2b] : [c1r, c1g, c1b];
      const di = (y * width + x) * 3;
      out[di] = chosen[0];
      out[di + 1] = chosen[1];
      out[di + 2] = chosen[2];
    }
  }

  return sharp(out, { raw: { width, height, channels: 3 } })
    .png({ palette: true, colors: PALETTE.length })
    .toBuffer();
}
