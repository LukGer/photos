import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { encode } from "blurhash";
import exifr from "exifr";
import sharp from "sharp";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, "..");

const sourceDir = path.join(projectRoot, "images");
const outputDir = path.join(projectRoot, "public", "photos");
const outputFile = path.join(projectRoot, "public", "meta.json");

async function generateMetadata() {
	if (!fs.existsSync(outputDir)) {
		fs.mkdirSync(outputDir, { recursive: true });
	}

	// Load existing metadata if it exists
	let existingMeta = {};
	if (fs.existsSync(outputFile)) {
		try {
			const existingData = JSON.parse(fs.readFileSync(outputFile, "utf-8"));
			// Create a map of existing metadata by filename for quick lookup
			existingMeta = Object.fromEntries(
				existingData.map((item) => [item.filename, item])
			);
			console.log(`📋 Loaded ${Object.keys(existingMeta).length} existing metadata entries`);
		} catch (err) {
			console.warn(`⚠️  Could not read existing metadata: ${err.message}`);
		}
	}

	const files = fs
		.readdirSync(sourceDir)
		.filter((f) => /\.(jpg|jpeg|png|heic|webp|avif)$/i.test(f));

	const result = [];

	for (const file of files) {
		const filePath = path.join(sourceDir, file);
		const baseName = path.parse(file).name;
		const outputFilename = `${baseName}.avif`;
		const outputPath = path.join(outputDir, outputFilename);

		try {
			console.log(`📸 Processing ${file}...`);

			// Read EXIF from source
			const exif = await exifr.parse(filePath, [
				"Model",
				"LensModel",
				"ISO",
				"FNumber",
				"ExposureTime",
				"DateTimeOriginal",
			]);

			// Process image with sharp: get metadata and convert to avif
			const image = sharp(filePath);
			const { width, height } = await image.metadata();

			// Generate blurhash
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

			// Generate blurDataURL for next/image
			const blurDataURL = await image
				.clone()
				.resize(12)
				.avif({ quality: 20 })
				.toBuffer()
				.then((b) => `data:image/avif;base64,${b.toString("base64")}`);

			await image.avif({ quality: 50 }).toFile(outputPath);

			// Check if this image already has metadata
			const existingEntry = existingMeta[outputFilename];

			result.push({
				filename: outputFilename,
				title: existingEntry?.title || "",
				subtitle: existingEntry?.subtitle || "",
				src: `/photos/${outputFilename}`,
				width,
				height,
				iso: exif?.ISO || null,
				aperture: exif?.FNumber ? `f/${exif.FNumber}` : null,
				shutter: exif?.ExposureTime ? formatExposure(exif.ExposureTime) : null,
				camera: exif?.Model || null,
				lens: exif?.LensModel || null,
				date: exif?.DateTimeOriginal || null,
				blurhash,
				blurDataURL,
			});
		} catch (err) {
			console.error(`❌ Error processing ${file}:`, err.message);
		}
	}

	fs.writeFileSync(outputFile, JSON.stringify(result, null, 2));
	console.log(`✅ Wrote metadata for ${result.length} photos to ${outputFile}`);
}

function formatExposure(val) {
	return val >= 1 ? `${val}s` : `1/${Math.round(1 / val)}s`;
}

generateMetadata().catch((e) => console.error("Fatal error:", e));
