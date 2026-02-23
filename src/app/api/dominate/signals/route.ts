import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";

export const maxDuration = 120;
export const dynamic = "force-dynamic";

const DOMINATE_PASSWORD = process.env.DOMINATE_PASSWORD ?? "";
const YOUTUBE_API_KEY = process.env.YOUTUBE_API_KEY ?? "";

function getClient() {
  return new OpenAI({
    apiKey: process.env.AZURE_OPENAI_API_KEY ?? "",
    baseURL: `${process.env.AZURE_OPENAI_ENDPOINT}openai/deployments/${process.env.AZURE_OPENAI_DEPLOYMENT}`,
    defaultQuery: { "api-version": "2024-02-01" },
    defaultHeaders: { "api-key": process.env.AZURE_OPENAI_API_KEY ?? "" },
  });
}

// ─── Reddit Scraper ──────────────────────────────────────────────────────────

interface RedditComment {
  body: string;
  score: number;
  subreddit: string;
}

async function scrapeReddit(subreddits: string[], keywords: string[]): Promise<RedditComment[]> {
  const comments: RedditComment[] = [];

  for (const sub of subreddits) {
    for (const keyword of keywords) {
      try {
        const url = `https://www.reddit.com/r/${sub}/search.json?q=${encodeURIComponent(keyword)}&sort=relevance&t=month&limit=25`;
        const res = await fetch(url, {
          headers: { "User-Agent": "SignalMiner/1.0" },
        });
        if (!res.ok) continue;

        const data = await res.json();
        const posts = data?.data?.children ?? [];

        for (const post of posts) {
          const d = post.data;
          if (d.selftext && d.selftext.length > 30) {
            comments.push({
              body: `[POST] ${d.title}\n${d.selftext.slice(0, 500)}`,
              score: d.score ?? 0,
              subreddit: sub,
            });
          }

          // Fetch top comments from each post
          try {
            const commentsUrl = `https://www.reddit.com${d.permalink}.json?sort=top&limit=10`;
            const cRes = await fetch(commentsUrl, {
              headers: { "User-Agent": "SignalMiner/1.0" },
            });
            if (!cRes.ok) continue;

            const cData = await cRes.json();
            const topComments = cData?.[1]?.data?.children ?? [];

            for (const c of topComments) {
              if (c.data?.body && c.data.body.length > 30 && c.kind === "t1") {
                comments.push({
                  body: c.data.body.slice(0, 400),
                  score: c.data.score ?? 0,
                  subreddit: sub,
                });
              }
            }
          } catch {
            // Skip individual comment fetch errors
          }
        }

        // Rate limit: 1 second between requests
        await new Promise((r) => setTimeout(r, 1000));
      } catch {
        // Skip failed subreddit/keyword combos
      }
    }
  }

  return comments;
}

// ─── YouTube Channel ID Resolver ────────────────────────────────────────────

async function resolveChannelId(input: string): Promise<string | null> {
  const trimmed = input.trim();

  // Already a channel ID (starts with UC)
  if (/^UC[\w-]{22}$/.test(trimmed)) return trimmed;

  // Extract handle from URL: youtube.com/@handle or just @handle
  const handleMatch = trimmed.match(/@([\w.-]+)/);
  if (handleMatch) {
    try {
      const res = await fetch(
        `https://www.googleapis.com/youtube/v3/channels?key=${YOUTUBE_API_KEY}&forHandle=${handleMatch[1]}&part=id`
      );
      if (res.ok) {
        const data = await res.json();
        if (data.items?.[0]?.id) return data.items[0].id;
      }
    } catch { /* fall through */ }
  }

  // Extract channel ID from URL: youtube.com/channel/UCxxxxxxxx
  const channelMatch = trimmed.match(/\/channel\/(UC[\w-]{22})/);
  if (channelMatch) return channelMatch[1];

  // Try as a raw handle without @
  if (!trimmed.includes("/") && !trimmed.startsWith("UC")) {
    try {
      const res = await fetch(
        `https://www.googleapis.com/youtube/v3/channels?key=${YOUTUBE_API_KEY}&forHandle=${trimmed}&part=id`
      );
      if (res.ok) {
        const data = await res.json();
        if (data.items?.[0]?.id) return data.items[0].id;
      }
    } catch { /* fall through */ }
  }

  return null;
}

// ─── YouTube Comments Scraper ────────────────────────────────────────────────

interface YouTubeComment {
  text: string;
  likeCount: number;
  channel: string;
}

async function scrapeYouTubeComments(channelInputs: string[]): Promise<YouTubeComment[]> {
  if (!YOUTUBE_API_KEY) return [];

  // Resolve all inputs to channel IDs
  const channelIds: string[] = [];
  for (const input of channelInputs) {
    const resolved = await resolveChannelId(input);
    if (resolved) channelIds.push(resolved);
  }

  const comments: YouTubeComment[] = [];

  for (const channelId of channelIds) {
    try {
      // Get recent videos from channel
      const searchUrl = `https://www.googleapis.com/youtube/v3/search?key=${YOUTUBE_API_KEY}&channelId=${channelId}&part=snippet&order=date&maxResults=10&type=video`;
      const searchRes = await fetch(searchUrl);
      if (!searchRes.ok) continue;

      const searchData = await searchRes.json();
      const videoIds = (searchData.items ?? []).map((item: { id?: { videoId?: string } }) => item.id?.videoId).filter(Boolean);

      for (const videoId of videoIds.slice(0, 5)) {
        try {
          const commentsUrl = `https://www.googleapis.com/youtube/v3/commentThreads?key=${YOUTUBE_API_KEY}&videoId=${videoId}&part=snippet&maxResults=50&order=relevance`;
          const cRes = await fetch(commentsUrl);
          if (!cRes.ok) continue;

          const cData = await cRes.json();
          for (const item of cData.items ?? []) {
            const snippet = item.snippet?.topLevelComment?.snippet;
            if (snippet?.textDisplay && snippet.textDisplay.length > 20) {
              comments.push({
                text: snippet.textDisplay.slice(0, 400),
                likeCount: snippet.likeCount ?? 0,
                channel: channelId,
              });
            }
          }
        } catch {
          // Skip individual video comment errors
        }
      }
    } catch {
      // Skip channel errors
    }
  }

  return comments;
}

// ─── AI Analysis ─────────────────────────────────────────────────────────────

const ANALYSIS_PROMPT = `You are a YouTube content strategist analyzing audience pain signals for a B2B operator channel.

CONTEXT: The channel owner (Saad Belcaid) teaches the "Connector Model" — a business model where operators connect companies/people and get paid for introductions/deals. He runs a $192K MRR agency (myoProcess) and a community (SSM, 318 members). He also built Connector OS, a free platform.

IMPORTANT: The word "Connector" has ZERO YouTube search demand. Titles must use PROBLEM LANGUAGE that the audience already uses. "Connector" is the answer revealed inside the video, never in the title.

TARGET AUDIENCE: Stuck agency/automation operators making $0-20K/month who feel a ceiling but can't name why.

Analyze the following raw signals (Reddit posts/comments, YouTube comments) and extract:

1. PAIN SIGNALS: What specific problems, frustrations, and questions keep appearing?
2. SCORED IDEAS: For each pain signal, score on:
   - curiosity_gap (0-10): Can this be framed as surprising?
   - pain_intensity (0-10): How urgent does this feel?
   - audience_size (0-10): How many people experience this?
   - authority_match (0-10): Can Saad credibly speak on this?
   - total: sum of all four
3. TITLE SUGGESTIONS: For each top idea (score >= 28), generate 3 YouTube titles using problem language. Rules:
   - Under 60 characters
   - No "Connector" in title
   - Use formats that work: "Why X stops working after $Y", "The hidden reason X happens", "I stopped doing X — everything changed"
   - Must trigger curiosity in cold viewers who watch agency/cold email/business model content

Return ONLY valid JSON in this exact format:
{
  "signals": [
    {
      "pain": "description of the pain point",
      "frequency": "high|medium|low",
      "emotion": "frustration|anxiety|confusion|curiosity",
      "sources": ["reddit:subreddit", "youtube:channelId"],
      "curiosity_gap": 8,
      "pain_intensity": 9,
      "audience_size": 7,
      "authority_match": 9,
      "total": 33,
      "titles": [
        "Title suggestion 1",
        "Title suggestion 2",
        "Title suggestion 3"
      ],
      "hook_suggestion": "First 15 seconds script suggestion using proof-first format"
    }
  ]
}

Return the top 10 signals sorted by total score descending. Only valid JSON, no markdown.`;

// ─── Main Handler ────────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  const pw = req.headers.get("x-dominate-password") ?? "";
  if (!pw || pw !== DOMINATE_PASSWORD) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  let body: {
    subreddits?: string[];
    keywords?: string[];
    youtubeChannelIds?: string[];
  };

  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON." }, { status: 400 });
  }

  const subreddits = body.subreddits ?? [
    "Entrepreneur",
    "SaaS",
    "coldoutreach",
    "digital_marketing",
    "agency",
  ];

  const keywords = body.keywords ?? [
    "agency stuck",
    "cold email not working",
    "can't get clients",
    "outbound dying",
    "AI agency",
    "freelancing plateau",
    "lead generation difficult",
    "business model stuck",
  ];

  const youtubeChannelIds = body.youtubeChannelIds ?? [];

  try {
    // Mine signals in parallel
    const [redditSignals, youtubeSignals] = await Promise.all([
      scrapeReddit(subreddits, keywords),
      scrapeYouTubeComments(youtubeChannelIds),
    ]);

    // Combine all raw signals
    const allSignals: string[] = [];

    for (const r of redditSignals.sort((a, b) => b.score - a.score).slice(0, 60)) {
      allSignals.push(`[Reddit r/${r.subreddit} | score:${r.score}] ${r.body}`);
    }

    for (const y of youtubeSignals.sort((a, b) => b.likeCount - a.likeCount).slice(0, 40)) {
      allSignals.push(`[YouTube ${y.channel} | likes:${y.likeCount}] ${y.text}`);
    }

    if (allSignals.length === 0) {
      return NextResponse.json({
        signals: [],
        raw_count: 0,
        sources: { reddit: 0, youtube: 0 },
        error: "No signals found. Try different subreddits or keywords.",
      });
    }

    // Analyze with AI
    const client = getClient();
    const response = await client.chat.completions.create({
      model: process.env.AZURE_OPENAI_DEPLOYMENT ?? "gpt-4o",
      messages: [
        { role: "system", content: ANALYSIS_PROMPT },
        {
          role: "user",
          content: `Here are ${allSignals.length} raw signals to analyze:\n\n${allSignals.join("\n\n---\n\n")}`,
        },
      ],
      temperature: 0.7,
      max_tokens: 4000,
    });

    const rawOutput = response.choices[0]?.message?.content ?? "{}";

    // Parse AI response
    let parsed;
    try {
      // Strip markdown code fences if present
      const cleaned = rawOutput.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
      parsed = JSON.parse(cleaned);
    } catch {
      return NextResponse.json({
        signals: [],
        raw_output: rawOutput,
        raw_count: allSignals.length,
        sources: { reddit: redditSignals.length, youtube: youtubeSignals.length },
        error: "AI returned invalid JSON. Raw output included.",
      });
    }

    return NextResponse.json({
      signals: parsed.signals ?? [],
      raw_count: allSignals.length,
      sources: {
        reddit: redditSignals.length,
        youtube: youtubeSignals.length,
      },
      mined_at: new Date().toISOString(),
    });
  } catch (err) {
    console.error("Signal mining error:", err);
    return NextResponse.json(
      { error: "Signal mining failed. Check server logs." },
      { status: 500 }
    );
  }
}
