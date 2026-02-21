// dump-to-blog.js
// Route 2: Raw input → blog post → social content
//
// Usage:
//   node dump-to-blog.js "your raw thoughts here"
//   node dump-to-blog.js --file path/to/notes.txt
//   node dump-to-blog.js --image path/to/screenshot.png
//   node dump-to-blog.js --image shot.png --text "extra context here"

import "dotenv/config";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import OpenAI from "openai";
import { generateSchedule } from "./atomize.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const client = new OpenAI({
  apiKey: process.env.AZURE_OPENAI_API_KEY,
  baseURL: `${process.env.AZURE_OPENAI_ENDPOINT}openai/deployments/${process.env.AZURE_OPENAI_DEPLOYMENT}`,
  defaultQuery: { "api-version": "2024-02-01" },
  defaultHeaders: { "api-key": process.env.AZURE_OPENAI_API_KEY },
});

const CONTENT_DIR = path.join(__dirname, "content");

const SYSTEM_PROMPT = `You are ghostwriting a blog post for Saad Belcaid — founder of myoProcess ($192K MRR), Connector OS, and Sales Systems Mastery (318 operators).

You will receive raw input. It might be:
- A messy brain dump
- A member win or comment screenshot
- An observation from a call or conversation
- Half-formed thoughts and notes
- A mix of all of the above

Your job: find the core idea, extract the philosophy underneath it, and write a 1500-2000 word blog post in Saad's exact voice.

SAAD'S VOICE — follow these exactly:

- First person. Direct. Honest. Sounds like a founder thinking out loud, not a copywriter.
- Short paragraphs (1-3 sentences). Single-sentence paragraphs for emphasis.
- Short sentences land after long ones. Like this.
- Em-dashes — for asides, pivots, emphasis. This is his signature.
- Parenthetical asides: "(That's a genuine question. Sit with it.)" — casual, honest.
- Opens cold. No warmup. No preamble. First line is the point.
- Ends with a cold landing — not inspiration, not a CTA. A statement.
- Philosophical but grounded in real numbers.
- Anti-motivational poster. Never says "you've got this" or "hustle harder."
- Cold about wins: "Of course it's working." Not "amazing news everyone."
- Speaks directly to the reader as "you."

HIS ACTUAL PHRASES (use naturally, not forced):
- "operator" (never "entrepreneur" or "founder")
- "printing real cash"
- "That's it. That's the whole thing."
- "two-sided orchestration" / "motion protocol" / "signal-based"
- "encode / encoded markets"
- "rented land" / "the gap" / "infinite player"
- "the descent"

REAL METRICS TO USE (when relevant):
- $192K MRR, 318 operators in SSM
- 6 encoded markets: Biotech, Wealth Management, Recruitment, Marketing/Agency, Insurance, SaaS/Tech
- 34% of wealth management supply now routes correctly (was 0%)
- N²/2 = 50,653 potential connections between 318 members
- bouncer → banned Upwork freelancer → $2M/yr operator

WHAT HE NEVER DOES:
- No "in this post I'll cover..."
- No listicle as main structure
- No vague hustle advice
- No fake modesty
- No emojis in blog posts
- No "let me know in the comments"

STRUCTURE:
1. Hook (1-2 paragraphs) — personal moment, realization, or bold claim
2. H2 sections breaking down the philosophy
3. Evidence — member win, platform data, personal story
4. Cold landing — what this means, stated directly

TITLE RULE: 2-5 words max. Naval-style. Conceptual, not instructional. Never "How to..." or listicle framing. The title names the idea, not the lesson. Examples: "Market Maker", "Own the Middle", "Infinite Player", "Already Confident", "Bouncer to Operator", "The Descent".

OUTPUT FORMAT — complete .mdx file with frontmatter:

---
title: "Your Title Here"
meta_title: "Your Meta Title — Saad Belcaid"
description: "Meta description under 155 chars"
target_keywords: "keyword1, keyword2, keyword3"
date: "${new Date().toISOString().split("T")[0]}"
category: "Category Name"
---

Category DEFAULT is always "Market Philosophy". Only use something else if the content is unmistakably about one of these: "Operator Reality" (closing tactics, identity shifts), "Platform Evolution" (Connector OS technical updates), "Building in Public" (origin stories, SSM/myoProcess history), "Thoughts" (books, pure philosophy, personal reflection). When in doubt — Market Philosophy.

Do NOT wrap output in code blocks. Output raw .mdx content directly.`;

function extractSlug(mdxContent) {
  const titleMatch = mdxContent.match(/^title:\s*"(.+)"/m);
  if (titleMatch) {
    return titleMatch[1]
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, "")
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-")
      .replace(/^-|-$/g, "")
      .slice(0, 60);
  }
  return `post-${Date.now()}`;
}

function escapeJsxBraces(mdxContent) {
  const parts = mdxContent.split("---");
  if (parts.length < 3) return mdxContent;
  const frontmatter = parts[1];
  const body = parts.slice(2).join("---");
  const escapedBody = body.replace(/(?<!\\)\{([^}]*)\}/g, (match, inner) => {
    if (inner.includes("(") || inner.includes("=>") || inner.includes("import")) return match;
    return `\\{${inner}\\}`;
  });
  return `---${frontmatter}---${escapedBody}`;
}

function imageToBase64(imagePath) {
  const resolved = path.resolve(imagePath);
  if (!fs.existsSync(resolved)) throw new Error(`Image not found: ${resolved}`);
  const buffer = fs.readFileSync(resolved);
  const ext = path.extname(imagePath).toLowerCase().replace(".", "");
  const mime = ext === "jpg" ? "jpeg" : ext;
  return { base64: buffer.toString("base64"), mime: `image/${mime}` };
}

async function generateFromText(rawInput) {
  console.log("  Generating blog post from text input...");
  const response = await client.chat.completions.create({
    model: process.env.AZURE_OPENAI_DEPLOYMENT,
    messages: [
      { role: "system", content: SYSTEM_PROMPT },
      {
        role: "user",
        content: `Here is my raw input. Extract the core idea and write the blog post:\n\n${rawInput}`,
      },
    ],
    temperature: 0.7,
    max_tokens: 4000,
  });
  return response.choices[0].message.content?.trim();
}

async function generateFromImage(imagePath, extraText = "") {
  console.log("  Reading screenshot and generating blog post...");
  const { base64, mime } = imageToBase64(imagePath);

  const userContent = [
    {
      type: "image_url",
      image_url: { url: `data:${mime};base64,${base64}` },
    },
  ];

  if (extraText) {
    userContent.push({
      type: "text",
      text: `Additional context from me:\n\n${extraText}`,
    });
  }

  userContent.push({
    type: "text",
    text: "Read everything in this screenshot. Extract the core idea and write the blog post.",
  });

  const response = await client.chat.completions.create({
    model: process.env.AZURE_OPENAI_DEPLOYMENT,
    messages: [
      { role: "system", content: SYSTEM_PROMPT },
      { role: "user", content: userContent },
    ],
    temperature: 0.7,
    max_tokens: 4000,
  });
  return response.choices[0].message.content?.trim();
}

async function main() {
  const args = process.argv.slice(2);

  if (args.length === 0) {
    console.log("Usage:");
    console.log('  node dump-to-blog.js "your raw thoughts"');
    console.log("  node dump-to-blog.js --file notes.txt");
    console.log("  node dump-to-blog.js --image screenshot.png");
    console.log('  node dump-to-blog.js --image screenshot.png --text "extra context"');
    process.exit(1);
  }

  let mdxContent;

  if (args[0] === "--image") {
    const imagePath = args[1];
    if (!imagePath) { console.error("Error: --image requires a file path"); process.exit(1); }

    let extraText = "";
    const textFlagIndex = args.indexOf("--text");
    if (textFlagIndex !== -1 && args[textFlagIndex + 1]) {
      extraText = args[textFlagIndex + 1];
    }

    console.log(`\nRoute: Screenshot → Blog`);
    console.log(`Image: ${imagePath}`);
    if (extraText) console.log(`Extra context: "${extraText}"`);

    mdxContent = await generateFromImage(imagePath, extraText);

  } else if (args[0] === "--file") {
    const filePath = args[1];
    if (!filePath) { console.error("Error: --file requires a file path"); process.exit(1); }
    if (!fs.existsSync(path.resolve(filePath))) { console.error(`Error: File not found: ${filePath}`); process.exit(1); }

    const rawInput = fs.readFileSync(path.resolve(filePath), "utf-8");
    console.log(`\nRoute: File → Blog`);
    console.log(`File: ${filePath} (${rawInput.length} chars)`);

    mdxContent = await generateFromText(rawInput);

  } else {
    // Raw text passed directly
    const rawInput = args.join(" ");
    console.log(`\nRoute: Text Dump → Blog`);
    console.log(`Input: "${rawInput.slice(0, 80)}${rawInput.length > 80 ? "..." : ""}"`);

    mdxContent = await generateFromText(rawInput);
  }

  if (!mdxContent) { console.error("Error: No content generated"); process.exit(1); }

  mdxContent = escapeJsxBraces(mdxContent);
  const slug = extractSlug(mdxContent);
  const filename = `${slug}.mdx`;
  const filepath = path.join(CONTENT_DIR, filename);

  fs.writeFileSync(filepath, mdxContent, "utf-8");
  console.log(`\n  Blog post saved: content/${filename}`);
  console.log(`  Live at: /blog/${slug}`);

  console.log(`\n  Atomizing into social content...`);
  await generateSchedule(slug);

  console.log("\nAll done. Blog post + social content ready.");
}

main().catch((err) => {
  console.error("Error:", err.message);
  process.exit(1);
});
