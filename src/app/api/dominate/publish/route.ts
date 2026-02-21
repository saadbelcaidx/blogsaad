import { NextRequest, NextResponse } from "next/server";

export const maxDuration = 60;

export async function POST(request: NextRequest) {
  const password = request.headers.get("x-dominate-password");
  if (password !== process.env.DOMINATE_PASSWORD) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { slug, mdxContent } = await request.json();
  if (!slug || !mdxContent) {
    return NextResponse.json({ error: "Missing slug or content" }, { status: 400 });
  }

  const token = process.env.GITHUB_TOKEN;
  const owner = process.env.GITHUB_OWNER;
  const repo = process.env.GITHUB_REPO;

  if (!token || !owner || !repo) {
    return NextResponse.json({ error: "GitHub not configured" }, { status: 500 });
  }

  const filePath = `content/${slug}.mdx`;
  const encodedContent = Buffer.from(mdxContent).toString("base64");
  const apiUrl = `https://api.github.com/repos/${owner}/${repo}/contents/${filePath}`;

  // Check if file already exists (need SHA to update)
  let sha: string | undefined;
  try {
    const check = await fetch(apiUrl, {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/vnd.github+json",
      },
    });
    if (check.ok) {
      const data = await check.json();
      sha = data.sha;
    }
  } catch {
    // File doesn't exist, that's fine
  }

  // Commit to GitHub
  const body: Record<string, string> = {
    message: `New post: ${slug}`,
    content: encodedContent,
    branch: "main",
  };
  if (sha) body.sha = sha;

  const res = await fetch(apiUrl, {
    method: "PUT",
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "application/vnd.github+json",
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const err = await res.json();
    return NextResponse.json({ error: err.message || "GitHub commit failed" }, { status: 500 });
  }

  // Trigger Vercel deploy hook if configured
  const deployHook = process.env.VERCEL_DEPLOY_HOOK;
  if (deployHook) {
    await fetch(deployHook, { method: "POST" }).catch(() => {});
  }

  return NextResponse.json({
    success: true,
    url: `https://saadbelcaid.me/blog/${slug}`,
  });
}
