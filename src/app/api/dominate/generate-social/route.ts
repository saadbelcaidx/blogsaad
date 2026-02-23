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

export async function POST(request: NextRequest) {
  const password = request.headers.get("x-dominate-password");
  if (password !== process.env.DOMINATE_PASSWORD) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { title, blogBody } = await request.json();

  if (!title || !blogBody) {
    return NextResponse.json({ error: "Missing title or blogBody" }, { status: 400 });
  }

  const client = getClient();

  try {
    const socialRes = await client.chat.completions.create({
      model: process.env.AZURE_OPENAI_DEPLOYMENT!,
      messages: [
        { role: "system", content: SOCIAL_SYSTEM_PROMPT },
        { role: "user", content: `Blog title: "${title}"\n\nBlog content:\n\n${blogBody}\n\nGenerate the full week of social content.` },
      ],
      temperature: 0.7,
      max_tokens: 5000,
    });

    const socialContent = socialRes.choices[0].message.content?.trim() || "";
    return NextResponse.json({ socialContent });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: `Social generation failed: ${msg}` }, { status: 500 });
  }
}
