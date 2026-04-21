import { encode } from "blurhash";
import exifr from "exifr";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";
import { inferLocation } from "./infer-location";
import type { MetadataItem } from "../src/lib/types";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(__dirname, "..");

const sourceDir = path.join(projectRoot, "images");
const outputDir = path.join(projectRoot, "public", "photos");
const outputFile = path.join(projectRoot, "public", "meta.json");

function loadExistingByFilename(): Map<string, MetadataItem> {
  if (!fs.existsSync(outputFile)) {
    return new Map();
  }
  try {
    const raw = fs.readFileSync(outputFile, "utf-8");
    const existingData = JSON.parse(raw) as MetadataItem[];
    const map = new Map(
      existingData.map((item) => [item.filename, item] as const),
    );
    console.log(`📋 Loaded ${map.size} existing metadata entries`);
    return map;
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.warn(`⚠️  Could not read existing metadata: ${message}`);
    return new Map();
  }
}

/** Non-empty after trim → treat as user-set (do not overwrite). */
function userStringOrEmpty(value: string | null | undefined): string {
  const t = value?.trim();
  return t ? t : "";
}

function mergePreservedCopy(
  existing: MetadataItem | undefined,
  fresh: MetadataItem,
): MetadataItem {
  const title =
    existing && userStringOrEmpty(existing.title)
      ? existing.title.trim()
      : fresh.title;
  const location =
    existing && userStringOrEmpty(existing.location)
      ? existing.location.trim()
      : fresh.location;

  return {
    ...fresh,
    title,
    location,
  };
}

function formatExposure(val: number): string {
  return val >= 1 ? `${val}s` : `1/${Math.round(1 / val)}s`;
}

function toIsoDate(value: unknown): string | null {
  if (value == null) {
    return null;
  }
  if (value instanceof Date) {
    return value.toISOString();
  }
  const d = new Date(value as string | number);
  return Number.isNaN(d.getTime()) ? null : d.toISOString();
}

export async function generateMetadata(): Promise<void> {
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  const existingByFilename = loadExistingByFilename();
  const files = fs
    .readdirSync(sourceDir)
    .filter((f) => /\.(jpg|jpeg|png|heic|webp|avif)$/i.test(f));

  const result: MetadataItem[] = [];

  for (const file of files) {
    const filePath = path.join(sourceDir, file);
    const baseName = path.parse(file).name;
    const outputFilename = `${baseName}.avif`;
    const outputPath = path.join(outputDir, outputFilename);
    const existingEntry = existingByFilename.get(outputFilename);

    try {
      console.log(`📸 Processing ${file}...`);

      const parsed = await exifr.parse(filePath, true);
      const tags = (
        parsed && typeof parsed === "object" ? parsed : {}
      ) as Record<string, unknown>;

      const image = sharp(filePath);
      const { width, height } = await image.metadata();

      if (width == null || height == null) {
        console.warn(`⚠️  Skipping ${file}: missing dimensions`);
        continue;
      }

      const { data, info } = await image
        .clone()
        .raw()
        .ensureAlpha()
        .resize(32, 32, { fit: "inside" })
        .toBuffer({ resolveWithObject: true });

      const blurhash = encode(
        new Uint8ClampedArray(data),
        info.width,
        info.height,
        4,
        4,
      );

      const blurDataURL = await image
        .clone()
        .resize(12)
        .avif({ quality: 20 })
        .toBuffer()
        .then((b) => `data:image/avif;base64,${b.toString("base64")}`);

      await image.avif({ quality: 50 }).toFile(outputPath);

      const location =
        existingEntry && userStringOrEmpty(existingEntry.location)
          ? existingEntry.location.trim()
          : await inferLocation(tags);

      const fresh: MetadataItem = {
        filename: outputFilename,
        title: "",
        location,
        src: `/photos/${outputFilename}`,
        width,
        height,
        iso: (tags.ISO as number | undefined) ?? null,
        aperture: tags.FNumber != null ? `f/${tags.FNumber as number}` : null,
        shutter:
          tags.ExposureTime != null
            ? formatExposure(tags.ExposureTime as number)
            : null,
        camera: (tags.Model as string | undefined) ?? null,
        lens: (tags.LensModel as string | undefined) ?? null,
        date: toIsoDate(tags.DateTimeOriginal),
        blurhash,
        blurDataURL,
      };

      result.push(mergePreservedCopy(existingEntry, fresh));
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      console.error(`❌ Error processing ${file}:`, message);
    }
  }

  fs.writeFileSync(outputFile, `${JSON.stringify(result, null, 2)}\n`);
  console.log(`✅ Wrote metadata for ${result.length} photos to ${outputFile}`);
}

void generateMetadata().catch((e) => {
  console.error("Fatal error:", e);
  process.exitCode = 1;
});
