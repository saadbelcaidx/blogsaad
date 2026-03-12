// train-lora.js
// One-time LoRA training script for Saad's face
// Usage: node train-lora.js                        (full pipeline)
//        node train-lora.js --poll <training_id>   (resume polling)
//        npm run train

import "dotenv/config";
import Replicate from "replicate";
import sharp from "sharp";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import archiver from "archiver";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const REPLICATE_OWNER = "saadbelcaidx";
const MODEL_NAME = "saad-face";
const TRIGGER_WORD = "SAAD";
const TRAINER_VERSION =
  "26dce37af90b9d997eeb970d92e47de3064d46c300504ae376c75bef6a9022d2";
const CONFIG_FILE = path.join(__dirname, ".lora-config.json");
const TEMP_DIR = path.join(__dirname, ".training-images");

// 4 real photos — resize to 1024px max, auto-rotate EXIF
const REAL_PHOTOS = [
  { file: "public/face-ref.jpg", label: "front-facing selfie" },
  { file: "public/face-ref-2.png", label: "thinking pose" },
  { file: "public/face-ref-3.jpg", label: "EXIF rotation fix" },
  { file: "public/saad.jpg", label: "blog photo" },
];

// 10 YouTube thumbnails — crop right 60% to isolate face, then resize
const YT_VIDEO_IDS = [
  "WCTJBOPQnBA",
  "vs7RBtKBMqY",
  "wGuA-mQ18RU",
  "WOmLkaiCr0E",
  "gXoTYHwHoY4",
  "M9D77nMgioo",
  "2RacWWTuPAs",
  "iFsqGQYt0B0",
  "uFEc3t6q044",
  "tODPz6Y9fWc",
];

const replicate = new Replicate({ auth: process.env.REPLICATE_API_TOKEN });

// ── Image preparation ───────────────────────────────────────────────

async function processRealPhoto(photo, index) {
  const filePath = path.join(__dirname, photo.file);
  console.log(`  [${index + 1}/14] ${photo.label}: ${photo.file}`);

  const outputPath = path.join(TEMP_DIR, `real-${index + 1}.jpg`);
  await sharp(filePath)
    .rotate() // auto-rotate based on EXIF orientation
    .resize(1024, 1024, { fit: "inside", withoutEnlargement: true })
    .jpeg({ quality: 95 })
    .toFile(outputPath);

  return outputPath;
}

async function downloadThumbnail(videoId) {
  const urls = [
    `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`,
    `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`,
  ];

  for (const url of urls) {
    try {
      const res = await fetch(url);
      if (res.ok) return Buffer.from(await res.arrayBuffer());
    } catch {
      // try next URL
    }
  }
  throw new Error(`Could not download thumbnail for ${videoId}`);
}

async function processYouTubeThumbnail(videoId, index) {
  const num = REAL_PHOTOS.length + index + 1;
  console.log(`  [${num}/14] YouTube: ${videoId}`);

  const buffer = await downloadThumbnail(videoId);
  const meta = await sharp(buffer).metadata();

  // Keep right 60% (face side), discard left 40% (text overlays)
  const cropLeft = Math.floor(meta.width * 0.4);
  const cropWidth = meta.width - cropLeft;

  const outputPath = path.join(TEMP_DIR, `yt-${index + 1}.jpg`);
  await sharp(buffer)
    .extract({ left: cropLeft, top: 0, width: cropWidth, height: meta.height })
    .resize(1024, 1024, { fit: "inside", withoutEnlargement: true })
    .jpeg({ quality: 95 })
    .toFile(outputPath);

  return outputPath;
}

// ── Zip creation ─────────────────────────────────────────────────────

function createZip(imageFiles) {
  return new Promise((resolve, reject) => {
    const zipPath = path.join(__dirname, ".training-data.zip");
    const output = fs.createWriteStream(zipPath);
    const archive = archiver("zip", { zlib: { level: 9 } });

    output.on("close", () => resolve(zipPath));
    archive.on("error", reject);
    archive.pipe(output);

    for (const file of imageFiles) {
      archive.file(file, { name: path.basename(file) });
    }

    archive.finalize();
  });
}

// ── Replicate API ────────────────────────────────────────────────────

async function ensureModel() {
  console.log(`\nCreating model ${REPLICATE_OWNER}/${MODEL_NAME}...`);
  try {
    await replicate.models.create(REPLICATE_OWNER, MODEL_NAME, {
      visibility: "private",
      hardware: "gpu-t4",
      description: "LoRA model of Saad's face for thumbnail generation",
    });
    console.log("  Model created.");
  } catch (err) {
    if (
      err.message?.includes("already exists") ||
      err.response?.status === 409 ||
      err.status === 409
    ) {
      console.log("  Model already exists, reusing.");
    } else {
      throw err;
    }
  }
}

async function startTraining(zipPath) {
  console.log("\nStarting LoRA training...");
  console.log("  ~25 minutes, ~$3-5 one-time cost.\n");

  const zipData = fs.readFileSync(zipPath);
  const zipUri = `data:application/zip;base64,${zipData.toString("base64")}`;

  const training = await replicate.trainings.create(
    "ostris",
    "flux-dev-lora-trainer",
    TRAINER_VERSION,
    {
      destination: `${REPLICATE_OWNER}/${MODEL_NAME}`,
      input: {
        input_images: zipUri,
        trigger_word: TRIGGER_WORD,
        autocaption: true,
        autocaption_prefix: `${TRIGGER_WORD}, `,
        steps: 1000,
        learning_rate: 0.0004,
        lora_rank: 16,
      },
    }
  );

  console.log(`  Training ID: ${training.id}`);
  console.log(`  URL: https://replicate.com/p/${training.id}`);
  console.log(
    `  If interrupted, resume: node train-lora.js --poll ${training.id}\n`
  );

  return training.id;
}

async function pollTraining(trainingId) {
  console.log(`\nPolling training ${trainingId}...\n`);

  let lastStatus = "";

  while (true) {
    const training = await replicate.trainings.get(trainingId);

    if (training.status !== lastStatus) {
      console.log(`  Status: ${training.status}`);
      lastStatus = training.status;
    }

    // Show latest progress line
    if (training.logs) {
      const lines = training.logs.split("\n");
      const progress = lines.filter(
        (l) => l.includes("step") || l.includes("%")
      );
      if (progress.length) {
        console.log(`  Progress: ${progress[progress.length - 1].trim()}`);
      }
    }

    if (training.status === "succeeded") {
      const version = training.output?.version;
      if (!version) {
        console.error("  Training succeeded but no version in output.");
        console.log(
          "  Full output:",
          JSON.stringify(training.output, null, 2)
        );
        process.exit(1);
      }

      console.log(`\nTraining complete!`);
      console.log(`  Model version: ${version}`);
      saveConfig(version);
      return version;
    }

    if (training.status === "failed" || training.status === "canceled") {
      console.error(`\nTraining ${training.status}.`);
      if (training.error) console.error(`  Error: ${training.error}`);
      process.exit(1);
    }

    await new Promise((r) => setTimeout(r, 30_000));
  }
}

function saveConfig(version) {
  const config = {
    model: `${REPLICATE_OWNER}/${MODEL_NAME}`,
    version,
    trigger_word: TRIGGER_WORD,
    trained_at: new Date().toISOString(),
  };
  fs.writeFileSync(CONFIG_FILE, JSON.stringify(config, null, 2));
  console.log(`  Config saved to .lora-config.json`);
}

function cleanup() {
  if (fs.existsSync(TEMP_DIR)) fs.rmSync(TEMP_DIR, { recursive: true });
  const zip = path.join(__dirname, ".training-data.zip");
  if (fs.existsSync(zip)) fs.unlinkSync(zip);
}

// ── Main ─────────────────────────────────────────────────────────────

async function main() {
  if (!process.env.REPLICATE_API_TOKEN) {
    console.error("Error: REPLICATE_API_TOKEN not set in .env");
    process.exit(1);
  }

  console.log("\nLoRA Training Pipeline — Saad's Face");
  console.log("=".repeat(40));

  // Step 1: Prepare images
  console.log("\nPreparing 14 training images...");

  if (fs.existsSync(TEMP_DIR)) fs.rmSync(TEMP_DIR, { recursive: true });
  fs.mkdirSync(TEMP_DIR, { recursive: true });

  const imageFiles = [];

  for (let i = 0; i < REAL_PHOTOS.length; i++) {
    const f = await processRealPhoto(REAL_PHOTOS[i], i);
    imageFiles.push(f);
  }

  for (let i = 0; i < YT_VIDEO_IDS.length; i++) {
    try {
      const f = await processYouTubeThumbnail(YT_VIDEO_IDS[i], i);
      imageFiles.push(f);
    } catch (err) {
      console.log(`    Skipped ${YT_VIDEO_IDS[i]}: ${err.message}`);
    }
  }

  console.log(`\n  ${imageFiles.length} images prepared.`);

  // Step 2: Create zip
  console.log("\nCreating training zip...");
  const zipPath = await createZip(imageFiles);
  const zipMB = (fs.statSync(zipPath).size / 1024 / 1024).toFixed(1);
  console.log(`  Zip: ${zipMB}MB`);

  // Step 3: Create model on Replicate
  await ensureModel();

  // Step 4: Start training
  const trainingId = await startTraining(zipPath);

  // Step 5: Clean up temp files
  cleanup();

  // Step 6: Poll until done
  await pollTraining(trainingId);

  console.log(`\nDone! Generate thumbnails with:`);
  console.log(`  npm run thumb -- "YOUR TEXT" --method lora\n`);
}

// ── Entry point ──────────────────────────────────────────────────────

const args = process.argv.slice(2);
const pollIdx = args.indexOf("--poll");

if (pollIdx !== -1 && args[pollIdx + 1]) {
  if (!process.env.REPLICATE_API_TOKEN) {
    console.error("Error: REPLICATE_API_TOKEN not set in .env");
    process.exit(1);
  }
  pollTraining(args[pollIdx + 1]).catch((err) => {
    console.error("Error:", err.message);
    process.exit(1);
  });
} else {
  main().catch((err) => {
    console.error("Error:", err.message);
    process.exit(1);
  });
}
