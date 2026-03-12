import { NextRequest, NextResponse } from "next/server";
import Replicate from "replicate";
import sharp from "sharp";
import fs from "fs";
import path from "path";

export const maxDuration = 120;

const DOMINATE_PASSWORD = process.env.DOMINATE_PASSWORD ?? "";
const REPLICATE_API_TOKEN = process.env.REPLICATE_API_TOKEN ?? "";

// ── Part prompt lookups ─────────────────────────────────────────────

const BACKGROUNDS: Record<string, string> = {
  "dark-wood": "dark moody wood-panel background, dramatic side lighting",
  "studio": "clean dark gradient background, soft professional studio lighting",
  "cinematic": "dark textured background with subtle warm glow, cinematic rim lighting",
  "office": "dark luxury office background, mahogany desk, dim ambient lighting",
  "neon": "dark background with neon blue and purple accent lighting, cyberpunk feel",
  "red-black": "bold red and black gradient background, dramatic contrast lighting",
  "green-money": "dark green-tinted background, subtle cash and revenue vibes",
  "outdoor": "outdoor urban rooftop background, golden hour sunset lighting, city skyline",
  "gym": "dark industrial gym background, moody overhead lighting",
  "concrete": "raw concrete wall background, harsh directional lighting, underground vibe",
  "dashboard": "revenue dashboard and stripe notifications faintly visible behind, dark background",
  "whiteboard": "dark room with whiteboard covered in diagrams and numbers behind",
};

const OUTFITS: Record<string, string> = {
  "turtleneck": "wearing black turtleneck",
  "tshirt": "wearing black crew-neck t-shirt",
  "hoodie": "wearing black hoodie",
  "leather": "wearing black leather jacket",
  "suit": "wearing sharp black suit with open collar, no tie",
  "dress-shirt": "wearing crisp white dress shirt, sleeves rolled up",
  "tank": "wearing black tank top, athletic build",
};

const EXPRESSIONS: Record<string, string> = {
  "serious": "serious confident expression, looking straight at camera",
  "thinking": "hand on chin thoughtfully, intense focused expression",
  "knowing": "confident knowing smirk, one eyebrow slightly raised",
  "shocked": "shocked surprised expression, mouth slightly open, wide eyes",
  "intense": "intense piercing stare, jaw clenched, powerful energy",
  "calm": "calm composed expression, quiet confidence, direct eye contact",
  "angry": "frustrated angry expression, furrowed brows, confrontational energy",
  "excited": "energetic excited expression, leaning slightly forward, eyes lit up",
};

const PROPS: Record<string, string> = {
  "none": "",
  "cash": "holding a thick stack of cash",
  "laptop": "holding open laptop showing charts",
  "phone": "holding phone showing notifications",
  "pointing": "pointing finger directly at camera",
  "arms-crossed": "arms crossed confidently",
  "fist": "fist raised in determination",
  "hands-up": "both hands up showing disbelief",
};

// ── Text overlay helpers ────────────────────────────────────────────

function escapeXml(s: string) {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

function wrapText(text: string, maxChars: number): string[] {
  const words = text.split(/\s+/);
  const lines: string[] = [];
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

function buildTextSvg(text: string, width: number, height: number): Buffer {
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

// ── Route handler ───────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  const pw = req.headers.get("x-dominate-password") ?? "";
  if (!pw || pw !== DOMINATE_PASSWORD) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  if (!REPLICATE_API_TOKEN) {
    return NextResponse.json({ error: "REPLICATE_API_TOKEN not configured." }, { status: 500 });
  }

  let body: {
    text?: string;
    method?: string;
    parts?: { bg?: string; outfit?: string; expression?: string; prop?: string };
    // legacy support
    style?: string;
    extraPrompt?: string;
  };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON." }, { status: 400 });
  }

  const { text = "", method = "lora" } = body;

  // Build scene prompt from parts (mix-and-match) or legacy style string
  let scenePrompt: string;
  if (body.parts) {
    const bgPrompt = BACKGROUNDS[body.parts.bg ?? "dark-wood"] ?? BACKGROUNDS["dark-wood"];
    const outfitPrompt = OUTFITS[body.parts.outfit ?? "turtleneck"] ?? OUTFITS["turtleneck"];
    const exprPrompt = EXPRESSIONS[body.parts.expression ?? "serious"] ?? EXPRESSIONS["serious"];
    const propPrompt = PROPS[body.parts.prop ?? "none"] ?? "";
    scenePrompt = [bgPrompt, outfitPrompt, exprPrompt, propPrompt].filter(Boolean).join(", ");
  } else {
    // Legacy: single style string
    const LEGACY_PRESETS: Record<string, string> = {
      dark: "dark moody wood-panel background, dramatic side lighting, wearing black turtleneck, serious confident expression, looking straight at camera",
      clean: "clean dark gradient background, soft professional studio lighting, wearing black crew-neck t-shirt, calm confident expression, direct eye contact",
      dramatic: "dark textured background with subtle warm glow, cinematic rim lighting, wearing black leather jacket, intense focused expression, hand on chin thoughtfully",
      proof: "dark green-tinted background, revenue dashboard and stripe notifications faintly visible behind, wearing black shirt, confident knowing expression",
      hype: "bold red and black gradient background, dramatic contrast lighting, wearing black hoodie, energetic excited expression, leaning slightly forward",
    };
    scenePrompt = LEGACY_PRESETS[body.style ?? "dark"] ?? LEGACY_PRESETS.dark;
    if (body.extraPrompt) scenePrompt += `, ${body.extraPrompt}`;
  }

  const replicate = new Replicate({ auth: REPLICATE_API_TOKEN });

  try {
    let imageBuffer: Buffer;

    if (method === "lora") {
      const configPath = path.join(process.cwd(), ".lora-config.json");
      if (!fs.existsSync(configPath)) {
        return NextResponse.json(
          { error: "LoRA model not trained yet. Run: npm run train" },
          { status: 400 }
        );
      }
      const config = JSON.parse(fs.readFileSync(configPath, "utf-8"));

      const output = await replicate.run(
        `${config.model}:${config.version}` as `${string}/${string}:${string}`,
        {
          input: {
            prompt: `${config.trigger_word}, professional YouTube thumbnail, photorealistic close-up portrait positioned on the right third of frame, ${scenePrompt}, 16:9 composition, shallow depth of field, high quality, 4k`,
            num_outputs: 1,
            aspect_ratio: "16:9",
            num_inference_steps: 28,
            guidance: 3.5,
            output_format: "webp",
            output_quality: 95,
          },
        }
      );

      const url = Array.isArray(output)
        ? (typeof output[0] === "object" && output[0]?.url ? output[0].url() : output[0])
        : (typeof output === "object" && output !== null && "url" in output
            ? (output as { url: () => string }).url()
            : output);
      if (!url) throw new Error("No output from LoRA model");
      const res = await fetch(String(url));
      imageBuffer = Buffer.from(await res.arrayBuffer());
    } else {
      // PuLID fallback
      const faceRefPath = path.join(process.cwd(), "public", "face-ref.jpg");
      if (!fs.existsSync(faceRefPath)) {
        return NextResponse.json({ error: "Face reference image not found." }, { status: 500 });
      }
      const faceData = fs.readFileSync(faceRefPath);
      const faceUri = `data:image/jpeg;base64,${faceData.toString("base64")}`;

      const output = await replicate.run(
        "bytedance/flux-pulid:8baa7ef2255075b46f4d91cd238c21d31181b3e6a864463f967960bb0112525b",
        {
          input: {
            main_face_image: faceUri,
            prompt: `Professional YouTube thumbnail, photorealistic close-up portrait of this man positioned on the right third of frame, ${scenePrompt}, 16:9 composition, shallow depth of field, high quality, 4k`,
            width: 1344,
            height: 768,
            num_steps: 20,
            id_weight: 1.0,
            start_step: 2,
            guidance_scale: 4,
            true_cfg: 1.0,
            output_format: "webp",
            output_quality: 95,
            negative_prompt:
              "ugly, deformed, blurry, low quality, cartoon, anime, text, watermark, extra fingers, bad anatomy",
          },
        }
      );

      const url = Array.isArray(output)
        ? (typeof output[0] === "object" && output[0]?.url ? output[0].url() : output[0])
        : (typeof output === "object" && output !== null && "url" in output
            ? (output as { url: () => string }).url()
            : output);
      if (!url) throw new Error("No output from PuLID model");
      const res = await fetch(String(url));
      imageBuffer = Buffer.from(await res.arrayBuffer());
    }

    // Resize to 1280x720
    imageBuffer = await sharp(imageBuffer)
      .resize(1280, 720, { fit: "cover" })
      .jpeg({ quality: 95 })
      .toBuffer();

    // Add text overlay if provided
    if (text.trim()) {
      const svg = buildTextSvg(text, 1280, 720);
      imageBuffer = await sharp(imageBuffer)
        .composite([{ input: svg, top: 0, left: 0 }])
        .jpeg({ quality: 95 })
        .toBuffer();
    }

    const base64 = imageBuffer.toString("base64");
    return NextResponse.json({
      image: `data:image/jpeg;base64,${base64}`,
      size: `${Math.round(imageBuffer.length / 1024)}KB`,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
