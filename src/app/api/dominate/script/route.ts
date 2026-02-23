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

// ─── Script Generation Prompt ────────────────────────────────────────────────

const SCRIPT_PROMPT = `You are a YouTube script strategist for Saad Belcaid, a B2B operator who teaches the "Connector Model" — connecting companies and getting paid for introductions/deals. He runs a $192K MRR agency (myoProcess), a community (SSM, 318 members), and Connector OS (a free platform).

CRITICAL RULES:
- "Connector" is NEVER in the title — it's revealed inside the video as the answer
- Titles use PROBLEM LANGUAGE the audience already uses
- Target audience: stuck agency/automation operators making $0-20K/month
- Saad's voice: direct, cold, philosophical, no motivational fluff, real numbers, stoic about wins

You will receive a pain signal and a selected title direction. Generate:

1. TITLE VARIANTS: 15 YouTube titles. Rules:
   - Under 60 characters each
   - No "Connector" in any title
   - Use proven formats: "Why X stops working after $Y", "The hidden reason X happens", "I stopped doing X — everything changed", "The $X/month secret nobody explains"
   - Must trigger curiosity in cold viewers watching agency/cold email/business model content
   - Vary the angle: some contrarian, some curiosity-driven, some authority-based

2. THUMBNAIL TEXT: 3 options for thumbnail overlay text. Rules:
   - Max 4 words each
   - High contrast emotion: shock, disbelief, revelation
   - Examples: "IT'S A TRAP", "$0 → $192K", "STOP SELLING", "THE REAL GAME"

3. SCRIPT SKELETON: A full video script structure. Format:

   HOOK (0:00 - 0:30):
   - Pattern interrupt: One surprising statement or proof shot (show real Slack message, client reply, revenue screenshot)
   - Name the specific pain: "If you're running an agency and you've hit [specific ceiling]..."
   - Authority anchor: Quick proof ("After building a $192K/month business...")
   - Promise: What they'll understand by watching ("By the end of this, you'll see why [insight]")

   SETUP (0:30 - 2:00):
   - Describe the problem in their language. Make them feel seen.
   - "Most operators do X... and it works until Y."
   - Build the tension: why the obvious solutions don't work

   INSIGHT (2:00 - 5:00):
   - The mental model shift. This is where you start revealing the Connector thinking WITHOUT naming it yet.
   - Use a story or case study from your own journey (Upwork ban, Limassol walk, first connector deal)
   - Each point = insight → example → micro-realization (45-60 second loops)

   FRAMEWORK (5:00 - 8:00):
   - NOW name the Connector Model explicitly
   - Break it into 3 clear steps they can understand
   - Use real numbers: "One of our operators went from $3K to $27K in 90 days"
   - Make it concrete, not abstract

   PROOF (8:00 - 10:00):
   - Show 2-3 member wins or your own results
   - Specific: names (with permission), dollar amounts, timeframes
   - "This isn't theory. Here's what happens when you apply this."

   CTA (10:00 - 11:00):
   - Cold: "If this resonated, the link to Connector OS is below. It's free."
   - Inclusive: "Whether you're at $0 or $50K, the system is the same."
   - No hype. No urgency tricks. State the price, state the point, move on.

   B-ROLL SUGGESTIONS:
   - List 5-8 visual suggestions for each section (screen recordings, Slack messages, revenue screenshots, whiteboard, walk-and-talk shots)

Return ONLY valid JSON in this exact format:
{
  "titles": ["title1", "title2", ...],
  "thumbnails": ["text1", "text2", "text3"],
  "script": {
    "hook": "Full word-for-word script for the hook section",
    "setup": "Full word-for-word script for the setup section",
    "insight": "Full word-for-word script for the insight section",
    "framework": "Full word-for-word script for the framework section",
    "proof": "Full word-for-word script for the proof section",
    "cta": "Full word-for-word script for the CTA section"
  },
  "broll": ["suggestion1", "suggestion2", ...],
  "estimated_length": "10-12 minutes",
  "hook_type": "proof-first|story-first|stat-first"
}

Only valid JSON, no markdown.`;

// ─── Main Handler ────────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  const pw = req.headers.get("x-dominate-password") ?? "";
  if (!pw || pw !== DOMINATE_PASSWORD) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  let body: {
    pain?: string;
    selectedTitle?: string;
    emotion?: string;
    hook_suggestion?: string;
  };

  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON." }, { status: 400 });
  }

  if (!body.pain) {
    return NextResponse.json({ error: "Missing 'pain' field." }, { status: 400 });
  }

  try {
    const client = getClient();

    const userPrompt = [
      `PAIN SIGNAL: ${body.pain}`,
      body.selectedTitle ? `SELECTED TITLE DIRECTION: ${body.selectedTitle}` : "",
      body.emotion ? `DOMINANT EMOTION: ${body.emotion}` : "",
      body.hook_suggestion ? `EXISTING HOOK IDEA: ${body.hook_suggestion}` : "",
      "",
      "Generate the full script package for this pain signal.",
    ]
      .filter(Boolean)
      .join("\n");

    const response = await client.chat.completions.create({
      model: process.env.AZURE_OPENAI_DEPLOYMENT ?? "gpt-4o",
      messages: [
        { role: "system", content: SCRIPT_PROMPT },
        { role: "user", content: userPrompt },
      ],
      temperature: 0.8,
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
      titles: parsed.titles ?? [],
      thumbnails: parsed.thumbnails ?? [],
      script: parsed.script ?? {},
      broll: parsed.broll ?? [],
      estimated_length: parsed.estimated_length ?? "10-12 minutes",
      hook_type: parsed.hook_type ?? "proof-first",
      generated_at: new Date().toISOString(),
    });
  } catch (err) {
    console.error("Script generation error:", err);
    return NextResponse.json(
      { error: "Script generation failed. Check server logs." },
      { status: 500 }
    );
  }
}
