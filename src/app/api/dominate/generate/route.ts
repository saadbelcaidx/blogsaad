import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";

export const maxDuration = 60;
export const dynamic = "force-dynamic";

function getClient() {
  return new OpenAI({
    apiKey: process.env.AZURE_OPENAI_API_KEY ?? "",
    baseURL: `${process.env.AZURE_OPENAI_ENDPOINT}openai/deployments/${process.env.AZURE_OPENAI_DEPLOYMENT}`,
    defaultQuery: { "api-version": "2024-02-01" },
    defaultHeaders: { "api-key": process.env.AZURE_OPENAI_API_KEY ?? "" },
  });
}

const VOICE_GUIDE = `
You are ghostwriting content for Saad Belcaid — founder of myoProcess ($192K MRR), Connector OS, and Sales Systems Mastery (318 operators).

VOICE RULES:
- First person. Direct. Honest. Sounds like a founder thinking out loud, not a copywriter.
- Short paragraphs (1-3 sentences). Single-sentence paragraphs for emphasis.
- Short sentences land after long ones. Like this.
- Em-dashes — for asides, pivots, emphasis.
- Parenthetical asides: "(That's a genuine question. Sit with it.)"
- Opens cold. No warmup. No preamble. First line is the point.
- Ends with a cold landing — not inspiration, not a CTA. A statement.
- Philosophical but grounded in real numbers.
- Anti-motivational. Never says "you've got this" or "hustle harder."
- Speaks directly to the reader as "you."

HIS PHRASES (use naturally):
- "operator" (never "entrepreneur")
- "printing real cash" / "That's it. That's the whole thing."
- "two-sided orchestration" / "motion protocol" / "signal-based"
- "encode / encoded markets" / "rented land" / "the gap" / "infinite player"

REAL METRICS:
- $192K MRR, 318 operators in SSM
- 6 encoded markets: Biotech, Wealth Management, Recruitment, Marketing/Agency, Insurance, SaaS/Tech
- 34% of wealth management supply now routes correctly (was 0%)
- N²/2 = 50,653 potential connections between 318 members

WHAT HE NEVER DOES:
- No "in this post I'll cover..." / No listicle structure / No fake modesty
- No emojis in blog posts / No "let me know in the comments"

TITLE RULE: 2-5 words max. Naval-style. Conceptual, not instructional. Never "How to...".
Examples: "Market Maker", "Own the Middle", "Infinite Player", "Already Confident"

CATEGORY: DEFAULT is always "Market Philosophy". Only use others if unmistakably:
"Operator Reality" (closing tactics, identity), "Platform Evolution" (Connector OS updates),
"Building in Public" (origin stories), "Thoughts" (books, personal reflection).
`;

const BLOG_SYSTEM_PROMPT = `${VOICE_GUIDE}

Write a 1500-2000 word blog post. Structure:
1. Hook (1-2 paragraphs) — personal moment, realization, or bold claim. No warmup.
2. H2 sections breaking down the philosophy
3. Evidence — member win, platform data, personal story
4. Cold landing — stated directly, no inspiration

OUTPUT: Complete .mdx file with frontmatter. Format exactly:
---
title: "Short Title Here"
meta_title: "Short Title — Saad Belcaid"
description: "Meta description under 155 chars"
target_keywords: "keyword1, keyword2"
date: "${new Date().toISOString().split("T")[0]}"
category: "Market Philosophy"
---

[blog body here, no H1, start with H2s]

Do NOT wrap in code blocks. Output raw .mdx directly.`;

const SOCIAL_SYSTEM_PROMPT = `${VOICE_GUIDE}

Generate social content atomized from this blog post.

LINKEDIN (3 posts):
- Monday: Market Philosophy (300 words) — main thesis
- Wednesday: Mechanism/platform angle (250 words)
- Friday: Platform Evolution (200 words)
Format with ### Monday, ### Wednesday, ### Friday headers.

X/TWITTER (7 posts):
- Saturday: Blog promo tweet (2 lines + link placeholder)
- Sunday: Personal/reflection tweet (Tangier, the descent, journey)
- Monday: Single insight tweet (max 280 chars)
- Tuesday: Full 10-tweet thread (Hook + 8 expansion tweets + CTA)
- Wednesday: Single insight tweet
- Thursday: Member win tweet (reference Jai+Beau or real wins)
- Friday: Platform vision tweet
Format with ### Saturday, ### Sunday etc headers. Thread tweets numbered 1/ through 10/.

Output LinkedIn section first under ## LINKEDIN, then X under ## X / TWITTER.`;

async function fetchTranscript(videoId: string): Promise<string> {
  const apiKey = process.env.SUPADATA_API_KEY;
  if (!apiKey) throw new Error("SUPADATA_API_KEY not configured.");

  const res = await fetch(
    `https://api.supadata.ai/v1/youtube/transcript?videoId=${videoId}&text=true`,
    { headers: { "x-api-key": apiKey } }
  );

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Supadata error ${res.status}: ${err.slice(0, 100)}`);
  }

  const data = await res.json() as { content?: string; error?: string };
  const text = (data.content ?? "").trim();

  if (!text || text.length < 100) throw new Error("Transcript is empty. The video may have no spoken content.");

  return text;
}

function extractVideoId(url: string): string | null {
  const patterns = [
    /(?:youtube\.com\/watch\?v=)([a-zA-Z0-9_-]{11})/,
    /(?:youtu\.be\/)([a-zA-Z0-9_-]{11})/,
    /(?:youtube\.com\/shorts\/)([a-zA-Z0-9_-]{11})/,
  ];
  for (const p of patterns) {
    const m = url.match(p);
    if (m) return m[1];
  }
  return null;
}

function extractSlug(mdx: string): string {
  const m = mdx.match(/^title:\s*"(.+)"/m);
  if (m) {
    return m[1].toLowerCase().replace(/[^a-z0-9\s-]/g, "").replace(/\s+/g, "-").replace(/-+/g, "-").replace(/^-|-$/g, "").slice(0, 60);
  }
  return `post-${Date.now()}`;
}

function extractTitle(mdx: string): string {
  const m = mdx.match(/^title:\s*"(.+)"/m);
  return m ? m[1] : "Untitled";
}

function escapeJsxBraces(mdx: string): string {
  const parts = mdx.split("---");
  if (parts.length < 3) return mdx;
  const body = parts.slice(2).join("---");
  const escaped = body.replace(/(?<!\\)\{([^}]*)\}/g, (match, inner) => {
    if (inner.includes("(") || inner.includes("=>")) return match;
    return `\\{${inner}\\}`;
  });
  return `---${parts[1]}---\n${escaped}`;
}

export async function POST(request: NextRequest) {
  // Auth
  const password = request.headers.get("x-dominate-password");
  if (password !== process.env.DOMINATE_PASSWORD) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const contentType = request.headers.get("content-type") || "";
  let rawInput = "";
  let imageBase64 = "";
  let imageMime = "";
  let inputType: "youtube" | "text" | "image" = "text";

  if (contentType.includes("multipart/form-data")) {
    const form = await request.formData();
    const type = form.get("type") as string;
    inputType = type as typeof inputType;

    if (type === "youtube") {
      const url = form.get("url") as string;
      const videoId = extractVideoId(url);
      if (!videoId) return NextResponse.json({ error: "Invalid YouTube URL" }, { status: 400 });

      try {
        rawInput = await fetchTranscript(videoId);
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : "Unknown error";
        return NextResponse.json({ error: `Could not fetch transcript: ${msg}` }, { status: 400 });
      }
    } else if (type === "image") {
      const file = form.get("image") as File;
      const text = form.get("text") as string || "";
      const buffer = await file.arrayBuffer();
      imageBase64 = Buffer.from(buffer).toString("base64");
      imageMime = file.type || "image/png";
      rawInput = text;
    } else {
      rawInput = form.get("text") as string;
    }
  } else {
    const body = await request.json();
    inputType = body.type;
    rawInput = body.text || body.url || "";
  }

  // Guard: must have content
  if (inputType !== "image" && !rawInput.trim()) {
    return NextResponse.json({ error: "No content to generate from. Please provide a URL, text, or image." }, { status: 400 });
  }

  // Generate blog post
  const client = getClient();
  let blogMessages: Parameters<typeof client.chat.completions.create>[0]["messages"];

  if (inputType === "image") {
    const userContent: OpenAI.Chat.ChatCompletionContentPart[] = [
      { type: "image_url", image_url: { url: `data:${imageMime};base64,${imageBase64}` } },
    ];
    if (rawInput) userContent.push({ type: "text", text: `My additional context:\n\n${rawInput}` });
    userContent.push({ type: "text", text: "Read everything in this. Extract the core idea and write the blog post." });
    blogMessages = [
      { role: "system", content: BLOG_SYSTEM_PROMPT },
      { role: "user", content: userContent },
    ];
  } else {
    const userText = inputType === "youtube"
      ? `Here is the video transcript. Convert it into a blog post:\n\n${rawInput}`
      : `Here is my raw input. Extract the core idea and write the blog post:\n\n${rawInput}`;
    blogMessages = [
      { role: "system", content: BLOG_SYSTEM_PROMPT },
      { role: "user", content: userText },
    ];
  }

  let mdxContent: string;
  let slug: string;
  let title: string;

  try {
    const blogRes = await client.chat.completions.create({
      model: process.env.AZURE_OPENAI_DEPLOYMENT!,
      messages: blogMessages,
      temperature: 0.7,
      max_tokens: 4000,
    });

    mdxContent = blogRes.choices[0].message.content?.trim() || "";
    mdxContent = escapeJsxBraces(mdxContent);
    slug = extractSlug(mdxContent);
    title = extractTitle(mdxContent);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: `Blog generation failed: ${msg}` }, { status: 500 });
  }

  // Generate social content — if this fails, still return the blog
  let socialContent = "";
  try {
    const blogBody = mdxContent.replace(/^---[\s\S]*?---\n/, "").trim();

    const socialRes = await client.chat.completions.create({
      model: process.env.AZURE_OPENAI_DEPLOYMENT!,
      messages: [
        { role: "system", content: SOCIAL_SYSTEM_PROMPT },
        { role: "user", content: `Blog title: "${title}"\n\nBlog content:\n\n${blogBody}\n\nGenerate the full week of social content.` },
      ],
      temperature: 0.7,
      max_tokens: 5000,
    });

    socialContent = socialRes.choices[0].message.content?.trim() || "";
  } catch {
    // Social failed but blog succeeded — return blog without social
  }

  return NextResponse.json({ slug, title, mdxContent, socialContent });
}
