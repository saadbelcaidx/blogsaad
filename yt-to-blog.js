// yt-to-blog.js
// Usage: node yt-to-blog.js <youtube-url>
//        node yt-to-blog.js --batch urls.txt
// Converts a YouTube video transcript → blog post → full week of social content

import "dotenv/config";
import fs from "fs";
import path from "path";
import { execSync } from "child_process";
import { fileURLToPath } from "url";
import { AzureOpenAI } from "openai";
import { YoutubeTranscript } from "youtube-transcript";
import { generateSchedule } from "./atomize.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const client = new AzureOpenAI({
  endpoint: process.env.AZURE_OPENAI_ENDPOINT,
  apiKey: process.env.AZURE_OPENAI_API_KEY,
  apiVersion: "2024-10-21",
  deployment: process.env.AZURE_OPENAI_DEPLOYMENT,
});

const CONTENT_DIR = path.join(__dirname, "content");

const SYSTEM_PROMPT = `You are ghostwriting a blog post for Saad Belcaid. Study and replicate this exact writing style:

VOICE & TONE:
- First person. Direct. Honest. Sounds like a smart founder thinking out loud — not a copywriter performing.
- Alternating sentence rhythm: short punchy sentence, then a longer explanatory one. Never more than 3 short sentences in a row.
- Em-dashes liberally — for asides, pivots, mid-thought corrections, emphasis. This is a signature.
- Parenthetical asides for casual qualifiers: "(like most things in life)", "(no one tells you this part)". Feels conversational, not academic.
- *Italics* for introducing concepts or terms. **Bold** only for key terms or section emphasis — never random words.
- Vulnerable but never soft. Admit problems and mistakes, then framework your way out with a system or mental model.
- Reference real concepts (psychology, behavioral economics, systems thinking) without being pretentious. Explain them in plain language.
- No fluff. No generic intros like "In today's world..." or "Let me tell you something." Just start with the point — a personal observation, a problem, a bold claim.

STRUCTURE:
- Open with 1-2 short paragraphs that hook immediately — a personal moment, a realization, a problem you noticed
- H2 sections to break up the piece. Each section opens with a punchy line.
- Mix tactical how-to content with personal reflection. Never pure listicle, never pure story — always both.
- Short paragraphs (2-4 sentences max). Single-sentence paragraphs for emphasis.
- End with a forward-looking statement or a direct challenge to the reader. No "hope this helped" energy.

Given this video transcript, write a 1500-2000 word blog post that:
- Has a short, punchy title — 2-5 words max. Naval-style. Conceptual, not instructional. Never "How to..." or listicle framing. Think: "Market Maker", "Own the Middle", "Infinite Player", "Already Confident", "Bouncer to Operator". The title names the idea, not the lesson.
- Has a meta description (under 155 chars)
- Has a URL slug (lowercase, hyphens, no special chars)
- Has a category. DEFAULT is always "Market Philosophy". Only use something else if the content is unmistakably about one of these: "Operator Reality" (closing tactics, identity shifts), "Platform Evolution" (Connector OS technical updates), "Building in Public" (origin stories, SSM/myoProcess history), "Thoughts" (books, pure philosophy, personal reflection). When in doubt — Market Philosophy.
- Includes the key insights from the video in written form
- Opens strong — first 100 words must contain the primary topic keyword

You MUST output the COMPLETE .mdx file with frontmatter and body. Use this exact format:

---
title: "Your Title Here"
meta_title: "Your Meta Title — Saad Belcaid"
description: "Meta description under 155 chars"
target_keywords: "keyword1, keyword2, keyword3"
date: "${new Date().toISOString().split("T")[0]}"
category: "Category Name"
---

Then the full blog post body in markdown. No H1 — the title is in frontmatter. Start with H2s for sections.

Do NOT wrap the output in code blocks. Output the raw .mdx content directly.`;

async function getTranscript(url) {
  try {
    const videoId = extractVideoId(url);
    if (!videoId) throw new Error(`Could not extract video ID from: ${url}`);

    console.log(`  Fetching transcript for video: ${videoId}`);
    const transcript = await YoutubeTranscript.fetchTranscript(videoId);
    const text = transcript.map((t) => t.text).join(" ");

    if (!text || text.length < 50) throw new Error("Transcript too short or empty");

    console.log(`  Got transcript: ${text.length} chars (${Math.round(text.split(" ").length)} words)`);
    return text;
  } catch (err) {
    console.log(`  YouTube Transcript API failed, trying yt-dlp...`);
    return await getTranscriptYtDlp(url);
  }
}

async function getTranscriptYtDlp(url) {
  const tmpFile = path.join(__dirname, `_tmp_sub_${Date.now()}`);
  try {
    execSync(
      `yt-dlp --write-auto-sub --sub-lang en --skip-download --sub-format vtt -o "${tmpFile}" "${url}"`,
      { stdio: "pipe" }
    );

    const vttFile = `${tmpFile}.en.vtt`;
    if (!fs.existsSync(vttFile)) throw new Error("yt-dlp did not produce a subtitle file");

    const vtt = fs.readFileSync(vttFile, "utf-8");
    fs.unlinkSync(vttFile);

    const text = vtt
      .split("\n")
      .filter(
        (line) =>
          line.trim() &&
          !line.startsWith("WEBVTT") &&
          !line.startsWith("Kind:") &&
          !line.startsWith("Language:") &&
          !line.match(/^\d{2}:\d{2}/) &&
          !line.match(/^\d+$/)
      )
      .map((line) => line.replace(/<[^>]+>/g, "").trim())
      .filter(Boolean)
      .join(" ");

    console.log(`  Got transcript via yt-dlp: ${text.length} chars`);
    return text;
  } catch (err) {
    try {
      const files = fs.readdirSync(__dirname).filter((f) => f.startsWith("_tmp_sub_"));
      files.forEach((f) => fs.unlinkSync(path.join(__dirname, f)));
    } catch (_) {}
    throw new Error(`Failed to get transcript: ${err.message}`);
  }
}

function extractVideoId(url) {
  const patterns = [
    /(?:youtube\.com\/watch\?v=)([a-zA-Z0-9_-]{11})/,
    /(?:youtu\.be\/)([a-zA-Z0-9_-]{11})/,
    /(?:youtube\.com\/shorts\/)([a-zA-Z0-9_-]{11})/,
    /(?:youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/,
  ];
  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) return match[1];
  }
  return null;
}

async function generatePost(transcript) {
  console.log("  Generating blog post with Azure OpenAI...");
  const response = await client.chat.completions.create({
    model: process.env.AZURE_OPENAI_DEPLOYMENT,
    messages: [
      { role: "system", content: SYSTEM_PROMPT },
      { role: "user", content: `Here is the video transcript. Convert it into a blog post:\n\n${transcript}` },
    ],
    temperature: 0.7,
    max_tokens: 4000,
  });

  const content = response.choices[0].message.content;
  if (!content) throw new Error("Empty response from Azure OpenAI");
  return content.trim();
}

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

async function processUrl(url) {
  console.log(`\nProcessing: ${url}`);

  const transcript = await getTranscript(url);
  let mdxContent = await generatePost(transcript);
  mdxContent = escapeJsxBraces(mdxContent);

  const slug = extractSlug(mdxContent);
  const filename = `${slug}.mdx`;
  const filepath = path.join(CONTENT_DIR, filename);

  fs.writeFileSync(filepath, mdxContent, "utf-8");
  console.log(`  Saved: content/${filename}`);
  console.log(`  Blog live at: /blog/${slug}`);

  // Auto-atomize into social content
  console.log(`\n  Atomizing into social content...`);
  await generateSchedule(slug);

  // Auto deploy
  console.log(`\n  Deploying to saadbelcaid.me...`);
  execSync(`git add content/${filename} && git commit -m "New post: ${slug}" && git push origin main && vercel --prod`, {
    stdio: "inherit",
    cwd: __dirname,
  });

  return { slug, filename };
}

async function main() {
  const args = process.argv.slice(2);

  if (args.length === 0) {
    console.log("Usage:");
    console.log("  node yt-to-blog.js <youtube-url>");
    console.log("  node yt-to-blog.js --batch urls.txt");
    process.exit(1);
  }

  if (
    !process.env.AZURE_OPENAI_ENDPOINT ||
    !process.env.AZURE_OPENAI_API_KEY ||
    !process.env.AZURE_OPENAI_DEPLOYMENT
  ) {
    console.error("Error: Missing .env vars. Need AZURE_OPENAI_ENDPOINT, AZURE_OPENAI_API_KEY, AZURE_OPENAI_DEPLOYMENT");
    process.exit(1);
  }

  if (args[0] === "--batch") {
    if (!args[1]) { console.error("Error: --batch requires a file path"); process.exit(1); }

    const urlFile = path.resolve(args[1]);
    if (!fs.existsSync(urlFile)) { console.error(`Error: File not found: ${urlFile}`); process.exit(1); }

    const urls = fs.readFileSync(urlFile, "utf-8")
      .split("\n")
      .map((u) => u.trim())
      .filter((u) => u && !u.startsWith("#"));

    console.log(`Batch mode: ${urls.length} URLs`);

    const results = [];
    for (const url of urls) {
      try {
        const { filename } = await processUrl(url);
        results.push({ url, filename, status: "ok" });
      } catch (err) {
        console.error(`  FAILED: ${err.message}`);
        results.push({ url, filename: null, status: err.message });
      }
    }

    console.log("\n--- Results ---");
    for (const r of results) {
      console.log(`  [${r.status === "ok" ? "+" : "x"}] ${r.url} → ${r.filename || r.status}`);
    }
    console.log(`\nDone: ${results.filter((r) => r.status === "ok").length}/${results.length} succeeded`);
  } else {
    try {
      await processUrl(args[0]);
      console.log("\nAll done. Blog post + social content ready.");
    } catch (err) {
      console.error(`\nFailed: ${err.message}`);
      process.exit(1);
    }
  }
}

main();
