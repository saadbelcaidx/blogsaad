import { NextRequest, NextResponse } from "next/server";

export const maxDuration = 30;

const DOMINATE_PASSWORD = process.env.DOMINATE_PASSWORD ?? "";
const TYPEFULLY_API_KEY = process.env.TYPEFULLY_API_KEY ?? "";

export async function POST(req: NextRequest) {
  // Auth
  const pw = req.headers.get("x-dominate-password") ?? "";
  if (!pw || pw !== DOMINATE_PASSWORD) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  if (!TYPEFULLY_API_KEY) {
    return NextResponse.json({ error: "TYPEFULLY_API_KEY not configured." }, { status: 500 });
  }

  let body: { content?: string; scheduleMode?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON." }, { status: 400 });
  }

  const { content, scheduleMode = "next-free-slot" } = body;

  if (!content || !content.trim()) {
    return NextResponse.json({ error: "No content provided." }, { status: 400 });
  }

  // Build Typefully payload
  // Split by "---" separator for threads
  const tweets = content
    .split(/\n---\n/)
    .map((t) => t.trim())
    .filter(Boolean);

  const typefullyBody: Record<string, unknown> = {
    content: tweets.join("\n\n"),
  };

  if (scheduleMode === "next-free-slot") {
    typefullyBody["schedule-date"] = "next-free-slot";
  } else {
    // "now" — Typefully will post immediately when no date set and threadify is triggered
    typefullyBody["share"] = true;
  }

  const typefullyRes = await fetch("https://api.typefully.com/v1/drafts/", {
    method: "POST",
    headers: {
      "X-API-KEY": `Bearer ${TYPEFULLY_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(typefullyBody),
  });

  if (!typefullyRes.ok) {
    const errText = await typefullyRes.text();
    console.error("Typefully error:", errText);
    return NextResponse.json(
      { error: `Typefully error: ${typefullyRes.status}` },
      { status: 500 }
    );
  }

  const data = await typefullyRes.json();

  return NextResponse.json({
    success: true,
    id: data.id,
    share_url: data.share_url ?? null,
    scheduled_date: data.scheduled_date ?? null,
  });
}
