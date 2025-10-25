import exifr from "exifr";
import fs from "fs";
import path from "path";
import sharp from "sharp";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, "..");

const photosDir = path.join(projectRoot, "public", "photos");
const outputFile = path.join(projectRoot, "public", "meta.json");

async function generateMetadata() {
  const files = fs
    .readdirSync(photosDir)
    .filter((f) => /\.(jpg|jpeg|png|heic|webp|avif)$/i.test(f));

  const result = [];

  for (const file of files) {
    const filePath = path.join(photosDir, file);
    try {
      // Read EXIF
      const exif = await exifr.parse(filePath, [
        "Model",
        "LensModel",
        "ISO",
        "FNumber",
        "ExposureTime",
        "DateTimeOriginal",
      ]);

      // Read dimensions
      const { width, height } = await sharp(filePath).metadata();

      result.push({
        filename: file,
        src: `/photos/${file}`,
        width,
        height,
        iso: exif?.ISO || null,
        aperture: exif?.FNumber ? `f/${exif.FNumber}` : null,
        shutter: exif?.ExposureTime ? formatExposure(exif.ExposureTime) : null,
        camera: exif?.Model || null,
        lens: exif?.LensModel || null,
        date: exif?.DateTimeOriginal || null,
      });
    } catch (err) {
      console.error(`❌ Error parsing ${file}:`, err.message);
    }
  }

  fs.writeFileSync(outputFile, JSON.stringify(result, null, 2));
  console.log(`✅ Wrote metadata for ${result.length} photos to ${outputFile}`);
}

function formatExposure(val) {
  return val >= 1 ? `${val}s` : `1/${Math.round(1 / val)}s`;
}

generateMetadata().catch((e) => console.error("Fatal error:", e));
