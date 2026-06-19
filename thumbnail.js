// thumbnail.js
// Usage: node thumbnail.js "YOUR TEXT HERE" [options]
//        npm run thumb -- "THE $201K PLAYBOOK"
//        npm run thumb -- "F*CK LIMITING\nBELIEFS" --style dramatic
//        npm run thumb -- "CHARGE BOTH" --method swap --prompt "stripe notifications behind"

import "dotenv/config";
import Replicate from "replicate";
import sharp from "sharp";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const FACE_REF = path.join(__dirname, "public", "face-ref.jpg");  // clear front-facing selfie
const OUTPUT_DIR = path.join(__dirname, "thumbnails");

if (!fs.existsSync(OUTPUT_DIR)) fs.mkdirSync(OUTPUT_DIR, { recursive: true });

const replicate = new Replicate({ auth: process.env.REPLICATE_API_TOKEN });

// Retry wrapper for rate limits / credit propagation
async function runWithRetry(model, input, maxRetries = 3) {
  for (let i = 0; i <= maxRetries; i++) {
    try {
      return await replicate.run(model, { input });
    } catch (err) {
      const isRetryable = err.message?.includes("429") || err.message?.includes("402");
      if (isRetryable && i < maxRetries) {
        const wait = (i + 1) * 10;
        console.log(`    Rate limited — retrying in ${wait}s (${i + 1}/${maxRetries})...`);
        await new Promise((r) => setTimeout(r, wait * 1000));
      } else {
        throw err;
      }
    }
  }
}

// ── Style presets matching Saad's thumbnail aesthetic ──────────────────
const PRESETS = {
  dark: "dark moody wood-panel background, dramatic side lighting, wearing black turtleneck, serious confident expression, looking straight at camera",
  clean: "clean dark gradient background, soft professional studio lighting, wearing black crew-neck t-shirt, calm confident expression, direct eye contact",
  dramatic: "dark textured background with subtle warm glow, cinematic rim lighting, wearing black leather jacket, intense focused expression, hand on chin thoughtfully",
  proof: "dark green-tinted background, revenue dashboard and stripe notifications faintly visible behind, wearing black shirt, confident knowing expression",
  hype: "bold red and black gradient background, dramatic contrast lighting, wearing black hoodie, energetic excited expression, leaning slightly forward",
};

// ── Arg parsing ────────────────────────────────────────────────────────
function parseArgs(args) {
  const positional = [];
  const flags = {};
  for (let i = 0; i < args.length; i++) {
    if (args[i].startsWith("--") && i + 1 < args.length && !args[i + 1].startsWith("--")) {
      flags[args[i].slice(2)] = args[i + 1];
      i++;
    } else if (args[i].startsWith("--")) {
      flags[args[i].slice(2)] = true;
    } else {
      positional.push(args[i]);
    }
  }
  return {
    text: positional[0] || "",
    style: flags.style || "dark",
    prompt: flags.prompt || "",
    method: flags.method || "pulid",   // "pulid", "swap", or "lora"
    count: parseInt(flags.count || "2", 10),
    noText: !!flags["no-text"],
  };
}

// ── Method 1: PuLID (single-step, face baked into generation) ──────────
async function generateWithPulid(stylePrompt) {
  console.log("  [1/2] Generating image with your face (PuLID)...");

  const faceData = fs.readFileSync(FACE_REF);
  const faceUri = `data:image/jpeg;base64,${faceData.toString("base64")}`;

  const output = await runWithRetry(
    "bytedance/flux-pulid:8baa7ef2255075b46f4d91cd238c21d31181b3e6a864463f967960bb0112525b",
    {
      main_face_image: faceUri,
      prompt: `Professional YouTube thumbnail, photorealistic close-up portrait of this man positioned on the right third of frame, ${stylePrompt}, 16:9 composition, shallow depth of field, high quality, 4k`,
      width: 1344,
      height: 768,
      num_steps: 20,
      id_weight: 1.0,
      start_step: 2,
      guidance_scale: 4,
      true_cfg: 1.0,
      output_format: "webp",
      output_quality: 95,
      negative_prompt: "ugly, deformed, blurry, low quality, cartoon, anime, text, watermark, extra fingers, bad anatomy",
    }
  );

  // Output is an array of URLs
  const url = Array.isArray(output) ? (output[0]?.url?.() || output[0]) : (output?.url?.() || output);
  if (!url) throw new Error("No output URL from PuLID model. Got: " + JSON.stringify(output));
  const res = await fetch(typeof url === "string" ? url : url.toString());
  return Buffer.from(await res.arrayBuffer());
}

// ── Method 2: LoRA (trained model, single-step, no face ref needed) ───
async function generateWithLora(stylePrompt) {
  console.log("  [1/2] Generating image with LoRA model...");

  const configPath = path.join(__dirname, ".lora-config.json");
  if (!fs.existsSync(configPath)) {
    throw new Error("LoRA not trained yet. Run: npm run train");
  }
  const config = JSON.parse(fs.readFileSync(configPath, "utf-8"));

  const output = await runWithRetry(
    `${config.model}:${config.version}`,
    {
      prompt: `${config.trigger_word}, professional YouTube thumbnail, photorealistic close-up portrait positioned on the right third of frame, ${stylePrompt}, 16:9 composition, shallow depth of field, high quality, 4k`,
      num_outputs: 1,
      aspect_ratio: "16:9",
      num_inference_steps: 28,
      guidance: 3.5,
      output_format: "webp",
      output_quality: 95,
    }
  );

  const url = Array.isArray(output) ? (output[0]?.url?.() || output[0]) : (output?.url?.() || output);
  if (!url) throw new Error("No output URL from LoRA model");
  const res = await fetch(typeof url === "string" ? url : url.toString());
  return Buffer.from(await res.arrayBuffer());
}

// ── Method 3: Flux generate + face swap (two-step) ────────────────────
async function generateBase(stylePrompt) {
  console.log("  [1/3] Generating base image (Flux)...");
  const output = await runWithRetry("black-forest-labs/flux-1.1-pro", {
    prompt: `Professional YouTube thumbnail, photorealistic portrait of a young man with short curly dark hair and trimmed beard, positioned on the right third of frame, ${stylePrompt}, 16:9 composition, shot on Sony A7III, high quality`,
    aspect_ratio: "16:9",
    output_format: "jpg",
    output_quality: 95,
  });

  const url = output?.url?.() || (typeof output === "string" ? output : output?.[0]);
  if (!url) throw new Error("No output URL from Flux model");
  const res = await fetch(url);
  return Buffer.from(await res.arrayBuffer());
}

async function swapFace(targetBuffer) {
  console.log("  [2/3] Swapping face...");

  const faceData = fs.readFileSync(FACE_REF);

  const output = await runWithRetry(
    "codeplugtech/face-swap:278a81e7ebb22db98bcba54de985d22cc1abeead2754eb1f2af717247be69b34",
    {
      input_image: `data:image/jpeg;base64,${targetBuffer.toString("base64")}`,
      swap_image: `data:image/jpeg;base64,${faceData.toString("base64")}`,
    }
  );

  const url = output?.url?.() || (typeof output === "string" ? output : output?.[0]);
  if (!url) throw new Error("No output URL from face-swap model");
  const res = await fetch(url);
  return Buffer.from(await res.arrayBuffer());
}

// ── Text overlay with Sharp + SVG ──────────────────────────────────────
function wrapText(text, maxChars) {
  const words = text.split(/\s+/);
  const lines = [];
  let cur = "";
  for (const w of words) {
    if (cur && (cur + " " + w).length > maxChars) {
      lines.push(cur);
      cur = w;
    } else {
      cur = cur ? cur + " " + w : w;
    }
  }
  if (cur) lines.push(cur);
  return lines;
}

function escapeXml(s) {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

function buildTextSvg(text, width, height) {
  const lines = text.includes("\\n")
    ? text.split("\\n").map((l) => l.trim().toUpperCase())
    : wrapText(text.toUpperCase(), 16);

  const fontSize = Math.min(
    Math.floor(width * 0.075),
    Math.floor((height * 0.7) / lines.length)
  );
  const lineHeight = fontSize * 1.15;
  const totalH = lines.length * lineHeight;
  const startY = (height - totalH) / 2 + fontSize * 0.85;

  const textEls = lines
    .map((line, i) => {
      const y = Math.round(startY + i * lineHeight);
      return `<text x="60" y="${y}"
        font-family="Impact, 'Arial Black', Helvetica, sans-serif"
        font-size="${fontSize}" font-weight="900"
        fill="white" stroke="black" stroke-width="${Math.max(2, Math.round(fontSize * 0.025))}"
        letter-spacing="${Math.round(fontSize * 0.04)}">${escapeXml(line)}</text>`;
    })
    .join("\n");

  // Left-side dark gradient so text pops over any background
  return Buffer.from(
    `<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="g" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stop-color="black" stop-opacity="0.65"/>
          <stop offset="50%" stop-color="black" stop-opacity="0.15"/>
          <stop offset="100%" stop-color="black" stop-opacity="0"/>
        </linearGradient>
      </defs>
      <rect width="${Math.round(width * 0.6)}" height="${height}" fill="url(#g)"/>
      ${textEls}
    </svg>`
  );
}

async function addTextOverlay(imageBuffer, text) {
  const step = text ? "Adding text overlay..." : "Skipping text...";
  console.log(`  [final] ${step}`);

  if (!text) return imageBuffer;

  const meta = await sharp(imageBuffer).metadata();
  const w = meta.width || 1280;
  const h = meta.height || 720;

  const svg = buildTextSvg(text, w, h);

  return sharp(imageBuffer)
    .resize(1280, 720, { fit: "cover" })
    .composite([{ input: svg, top: 0, left: 0 }])
    .jpeg({ quality: 95 })
    .toBuffer();
}

// ── Main pipeline ──────────────────────────────────────────────────────
async function generate(opts) {
  const stylePrompt = PRESETS[opts.style] || PRESETS.dark;
  const fullPrompt = opts.prompt ? `${stylePrompt}, ${opts.prompt}` : stylePrompt;

  let image;

  if (opts.method === "lora") {
    // Single-step: trained LoRA model (best quality, no face ref needed)
    image = await generateWithLora(fullPrompt);
  } else if (opts.method === "swap") {
    // Two-step: generate generic person → swap face
    const base = await generateBase(fullPrompt);
    image = await swapFace(base);
  } else {
    // Single-step: PuLID generates with face identity
    image = await generateWithPulid(fullPrompt);
  }

  // Resize to exact YouTube thumbnail dimensions
  image = await sharp(image).resize(1280, 720, { fit: "cover" }).jpeg({ quality: 95 }).toBuffer();

  // Add text overlay
  if (!opts.noText && opts.text) {
    image = await addTextOverlay(image, opts.text);
  }

  return image;
}

async function main() {
  const opts = parseArgs(process.argv.slice(2));

  if (!opts.text && !opts.noText) {
    console.log(`
Thumbnail Generator — Saad Belcaid
────────────────────────────────────
Usage:
  node thumbnail.js "YOUR TEXT" [options]
  npm run thumb -- "YOUR TEXT" [options]

Options:
  --style <name>     Preset: dark, clean, dramatic, proof, hype (default: dark)
  --method <type>    pulid (default), swap, or lora (trained model, best quality)
  --prompt <desc>    Extra prompt details
  --count <n>        Generate n variations (default: 2)
  --no-text          Generate without text overlay

Methods:
  pulid              Single-step face identity injection (~$0.02/image)
  swap               Two-step: generate + face swap (~$0.04/image)
  lora               Trained LoRA model, no face ref needed (~$0.03/image)
                     Requires: npm run train (one-time ~$3-5, ~25 min)

Examples:
  npm run thumb -- "THE \\$201K PLAYBOOK"
  npm run thumb -- "F*CK LIMITING\\nBELIEFS" --style clean
  npm run thumb -- "CHARGE BOTH\\n2026 ROADMAP" --style proof
  npm run thumb -- "COLD OPERATOR" --method swap --style dramatic
  npm run thumb -- "THE \\$201K PLAYBOOK" --method lora --style dark
  npm run thumb -- --no-text --style dark --count 3
`);
    process.exit(0);
  }

  if (!process.env.REPLICATE_API_TOKEN) {
    console.error("Error: REPLICATE_API_TOKEN not set in .env");
    process.exit(1);
  }

  if (!fs.existsSync(FACE_REF)) {
    console.error(`Error: Face reference not found at ${FACE_REF}`);
    console.error("Place a clear photo of your face at public/saad.jpg");
    process.exit(1);
  }

  console.log(`\nGenerating ${opts.count} thumbnail(s)...`);
  console.log(`  Style: ${opts.style} | Method: ${opts.method} | Text: "${opts.text}"\n`);

  const results = [];

  for (let i = 0; i < opts.count; i++) {
    console.log(`── Variation ${i + 1}/${opts.count} ──`);
    try {
      const result = await generate(opts);
      const filename = `thumb-${Date.now()}-v${i + 1}.jpg`;
      const outPath = path.join(OUTPUT_DIR, filename);
      fs.writeFileSync(outPath, result);
      results.push(outPath);
      console.log(`  Done: thumbnails/${filename} (${Math.round(result.length / 1024)}KB)\n`);
    } catch (err) {
      console.error(`  Failed: ${err.message}\n`);
    }
  }

  if (results.length > 0) {
    console.log(`\nAll done! ${results.length} thumbnail(s) saved to thumbnails/`);
    console.log("Cost: ~$" + (results.length * 0.02).toFixed(2));
  }
}

main().catch((err) => {
  console.error("Error:", err.message);
  process.exit(1);
});
