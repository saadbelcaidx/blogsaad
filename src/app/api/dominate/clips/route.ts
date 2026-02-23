import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";

export const maxDuration = 120;
export const dynamic = "force-dynamic";

const DOMINATE_PASSWORD = process.env.DOMINATE_PASSWORD ?? "";

function getClient() {
  return new OpenAI({
    apiKey: process.env.AZURE_OPENAI_API_KEY ?? "",
    baseURL: `${process.env.AZURE_OPENAI_ENDPOINT}openai/deployments/${process.env.AZURE_OPENAI_DEPLOYMENT}`,
    defaultQuery: { "api-version": "2024-02-01" },
    defaultHeaders: { "api-key": process.env.AZURE_OPENAI_API_KEY ?? "" },
  });
}

// ─── YouTube Transcript Fetcher ──────────────────────────────────────────────

async function fetchYouTubeTranscript(videoId: string): Promise<string | null> {
  try {
    // Try to get auto-generated captions via YouTube's timedtext API
    const pageRes = await fetch(`https://www.youtube.com/watch?v=${videoId}`, {
      headers: { "User-Agent": "Mozilla/5.0" },
    });
    if (!pageRes.ok) return null;

    const html = await pageRes.text();

    // Extract captions track URL from the page
    const captionMatch = html.match(/"captionTracks":\[.*?"baseUrl":"(.*?)"/);
    if (!captionMatch) return null;

    const captionUrl = captionMatch[1].replace(/\\u0026/g, "&");
    const captionRes = await fetch(captionUrl);
    if (!captionRes.ok) return null;

    const xml = await captionRes.text();

    // Parse XML transcript
    const segments: string[] = [];
    const regex = /<text start="([\d.]+)"[^>]*>([\s\S]*?)<\/text>/g;
    let match;
    while ((match = regex.exec(xml)) !== null) {
      const time = parseFloat(match[1]);
      const text = match[2]
        .replace(/&amp;/g, "&")
        .replace(/&lt;/g, "<")
        .replace(/&gt;/g, ">")
        .replace(/&#39;/g, "'")
        .replace(/&quot;/g, '"')
        .replace(/<[^>]*>/g, "")
        .trim();

      if (text) {
        const mins = Math.floor(time / 60);
        const secs = Math.floor(time % 60);
        segments.push(`[${mins}:${secs.toString().padStart(2, "0")}] ${text}`);
      }
    }

    return segments.length > 0 ? segments.join("\n") : null;
  } catch {
    return null;
  }
}

// ─── Clip Analysis Prompt ────────────────────────────────────────────────────

const CLIPS_PROMPT = `You are a short-form content strategist for Saad Belcaid's YouTube channel. He teaches the Connector Model — a B2B business model where operators connect companies and earn from introductions/deals. He runs a $192K MRR agency and a 318-member community.

You will receive a full video transcript with timestamps. Your job is to identify 5-8 segments that would make viral short-form clips (YouTube Shorts, X posts, LinkedIn posts).

WHAT MAKES A GOOD CLIP:
- Contrarian statements ("Everyone says X, but actually...")
- Emotional spikes (frustration, revelation, confidence)
- Actionable golden nuggets (specific steps, frameworks)
- Quotable one-liners (philosophy, sharp observations)
- Proof moments (showing results, member wins, real numbers)
- Pattern interrupts (surprising turns in logic)

FOR EACH CLIP, PROVIDE:
1. Timestamp range (start - end, aim for 30-90 seconds each)
2. The exact transcript text for that segment
3. A hook line (the first sentence for the short — must be scroll-stopping)
4. Platform-specific copy:
   - X/Twitter: Under 280 chars, sharp, standalone insight
   - LinkedIn: 200-300 words, professional but human, data-backed
   - Shorts description: Under 100 chars, includes hashtags

CLIP SELECTION RULES:
- Each clip must be self-contained (makes sense without watching the full video)
- No intro/outro fluff — cut to the meat
- Prioritize moments where Saad sounds most natural and convicted
- If he mentions specific numbers ($192K, 318 operators, etc.), that's always clip-worthy
- If he tells a personal story (Upwork ban, Limassol, Tangier), that's clip-worthy
- If he drops a framework or mental model, that's clip-worthy

Return ONLY valid JSON in this exact format:
{
  "video_title": "Title of the video if identifiable",
  "total_duration": "estimated total video length",
  "clips": [
    {
      "clip_number": 1,
      "start_time": "2:15",
      "end_time": "3:30",
      "duration_seconds": 75,
      "transcript_excerpt": "The exact words spoken in this segment",
      "hook_line": "The scroll-stopping first line for the short",
      "category": "contrarian|proof|framework|story|golden-nugget|quote",
      "x_post": "Twitter-ready post under 280 chars",
      "linkedin_post": "LinkedIn post 200-300 words",
      "shorts_description": "YouTube Shorts description with hashtags",
      "virality_score": 8
    }
  ]
}

Sort clips by virality_score descending. Only valid JSON, no markdown.`;

// ─── Main Handler ────────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  const pw = req.headers.get("x-dominate-password") ?? "";
  if (!pw || pw !== DOMINATE_PASSWORD) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  let body: {
    youtubeUrl?: string;
    transcript?: string;
  };

  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON." }, { status: 400 });
  }

  let transcript = body.transcript ?? "";

  // If YouTube URL provided, try to fetch transcript
  if (body.youtubeUrl && !transcript) {
    const videoIdMatch = body.youtubeUrl.match(
      /(?:v=|\/shorts\/|youtu\.be\/)([a-zA-Z0-9_-]{11})/
    );
    if (!videoIdMatch) {
      return NextResponse.json(
        { error: "Invalid YouTube URL." },
        { status: 400 }
      );
    }

    const fetched = await fetchYouTubeTranscript(videoIdMatch[1]);
    if (!fetched) {
      return NextResponse.json({
        error:
          "Could not fetch transcript. YouTube may have blocked the request. Paste the transcript manually instead.",
        needs_manual_transcript: true,
      });
    }
    transcript = fetched;
  }

  if (!transcript) {
    return NextResponse.json(
      {
        error: "No transcript provided. Paste a YouTube URL or raw transcript.",
      },
      { status: 400 }
    );
  }

  try {
    const client = getClient();

    // Trim transcript to fit context window (keep first ~12K chars)
    const trimmedTranscript =
      transcript.length > 12000
        ? transcript.slice(0, 12000) + "\n\n[TRANSCRIPT TRUNCATED]"
        : transcript;

    const response = await client.chat.completions.create({
      model: process.env.AZURE_OPENAI_DEPLOYMENT ?? "gpt-4o",
      messages: [
        { role: "system", content: CLIPS_PROMPT },
        {
          role: "user",
          content: `Analyze this video transcript and identify the best short-form clips:\n\n${trimmedTranscript}`,
        },
      ],
      temperature: 0.7,
      max_tokens: 6000,
    });

    const rawOutput = response.choices[0]?.message?.content ?? "{}";

    let parsed;
    try {
      const cleaned = rawOutput
        .replace(/```json\n?/g, "")
        .replace(/```\n?/g, "")
        .trim();
      parsed = JSON.parse(cleaned);
    } catch {
      return NextResponse.json({
        error: "AI returned invalid JSON. Raw output included.",
        raw_output: rawOutput,
      });
    }

    return NextResponse.json({
      video_title: parsed.video_title ?? "",
      total_duration: parsed.total_duration ?? "",
      clips: parsed.clips ?? [],
      clip_count: (parsed.clips ?? []).length,
      generated_at: new Date().toISOString(),
    });
  } catch (err) {
    console.error("Clip analysis error:", err);
    return NextResponse.json(
      { error: "Clip analysis failed. Check server logs." },
      { status: 500 }
    );
  }
}
