// atomize.js
// Usage: node atomize.js <blog-slug>
// Example: node atomize.js the-connector-thesis
// Takes a blog post from content/ and generates a full week of LinkedIn + X content.

import "dotenv/config";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import OpenAI from "openai";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const client = new OpenAI({
  apiKey: process.env.AZURE_OPENAI_API_KEY,
  baseURL: `${process.env.AZURE_OPENAI_ENDPOINT}openai/deployments/${process.env.AZURE_OPENAI_DEPLOYMENT}`,
  defaultQuery: { "api-version": "2024-02-01" },
  defaultHeaders: { "api-key": process.env.AZURE_OPENAI_API_KEY },
});

const VOICE_GUIDE = `
You are writing content for Saad Belcaid — founder of myoProcess ($192K MRR), Connector OS, and Sales Systems Mastery (318 operators).

VOICE RULES — follow these exactly:

WHAT HE SOUNDS LIKE:
- Opens cold and direct. No warmup. No preamble.
- Short paragraphs. 1-3 sentences max.
- Short sentences land after long ones. Like this.
- Uses dashes — to add weight mid-sentence.
- Speaks directly to the reader. "You." Never "one" or "they."
- Honest asides in parentheses: "(That's a genuine question. Sit with it.)"
- Philosophical but grounded in real numbers. Never abstract without evidence.
- Anti-motivational: never says "you've got this", "believe in yourself", "hustle harder"
- Cold about wins: "Of course it's working." Not "amazing news everyone."

PHRASES HE ACTUALLY USES:
- "operator" (not entrepreneur or founder)
- "printing real cash"
- "That's it. That's the whole thing."
- "two-sided orchestration"
- "signal-based"
- "encode / encoded markets"
- "motion protocol"
- "rented land"
- "the gap"
- "infinite player"
- "forthinking"
- "the descent"
- "Wonderful, truly wonderful." (rare, for personal reflections only)

WHAT HE NEVER DOES:
- No "in this post I'll cover..."
- No bullet-point listicles as the main structure
- No vague hustle advice
- No fake modesty or humble bragging
- No emojis (except occasional 👇 for X threads)
- No engagement bait ("comment below", "let me know what you think")
- No overexplaining — state the point, move on

REAL METRICS TO USE (pick what's relevant):
- $192K MRR
- 318 operators in SSM
- 6 encoded markets: Biotech, Wealth Management, Recruitment, Marketing/Agency, Insurance, SaaS/Tech
- 34% of wealth management supply now routes correctly (was 0%)
- Bouncer → banned Upwork freelancer → $2M/yr operator
- N²/2 = 50,653 potential connections between 318 members

CONTENT PILLARS:
1. Market Philosophy — how markets actually work, access vs delivery, hidden game
2. Operator Reality — truth about building, closing, scaling
3. Platform Evolution — what Connector OS is becoming, documenting the build
`;

const LINKEDIN_TEMPLATE = `
LINKEDIN FORMAT:
- 200-300 words per post
- Short paragraphs (1-3 sentences)
- No headers
- Ends with either a question OR a positioning statement (never both)
- Always includes at least one real metric
- Professional but human
- Hashtags at end: #b2b #operators #founders (keep minimal)

POST TYPES FOR THE WEEK:
- Monday: Market Philosophy — the main thesis of the blog post (300 words)
- Wednesday: Two-sided / platform angle — a specific mechanism from the blog (250 words)
- Friday: Platform Evolution — what was built/shipped, connected to the blog's theme (200 words)
`;

const TWITTER_TEMPLATE = `
X/TWITTER FORMAT:
- Single tweets: max 280 characters, sharp, one idea
- Threads: Hook tweet → 8-10 numbered tweets expanding → final CTA tweet
- Thread tweets are short. 2-4 sentences each max.
- Hook must make someone stop scrolling. Bold claim or contrarian truth.
- CTA tweet at end points to blog post

POSTS FOR THE WEEK:
- Saturday (same day as blog): Blog promo tweet (2 tweets)
- Sunday: Personal/reflection tweet (references the journey, Tangier, the descent)
- Monday: Single insight tweet (delivery vs access angle)
- Tuesday: Full 10-tweet thread (the core framework from the blog)
- Wednesday: Single insight tweet (mechanism/platform angle)
- Thursday: Member win tweet (reference Jai+Beau or Johnny's $2.8K close if no new win)
- Friday: Platform vision tweet (what's being built)
`;

function readBlogPost(slug) {
  const filePath = path.join(__dirname, "content", `${slug}.mdx`);
  if (!fs.existsSync(filePath)) {
    console.error(`Error: No file found at content/${slug}.mdx`);
    process.exit(1);
  }
  const raw = fs.readFileSync(filePath, "utf-8");
  // Strip frontmatter
  const content = raw.replace(/^---[\s\S]*?---\n/, "").trim();
  return content;
}

function extractTitle(slug) {
  const filePath = path.join(__dirname, "content", `${slug}.mdx`);
  const raw = fs.readFileSync(filePath, "utf-8");
  const match = raw.match(/^title:\s*"(.+)"/m);
  return match ? match[1] : slug;
}

async function generateLinkedIn(blogContent, title) {
  console.log("Generating LinkedIn posts...");
  const response = await client.chat.completions.create({
    model: process.env.AZURE_OPENAI_DEPLOYMENT,
    messages: [
      {
        role: "system",
        content: VOICE_GUIDE + "\n\n" + LINKEDIN_TEMPLATE,
      },
      {
        role: "user",
        content: `Blog post title: "${title}"\n\nBlog post content:\n\n${blogContent}\n\nGenerate 3 LinkedIn posts (Monday, Wednesday, Friday) atomized from this blog post. Format clearly with ### Monday, ### Wednesday, ### Friday headers. Each post should be copy/paste ready.`,
      },
    ],
    temperature: 0.7,
    max_tokens: 2000,
  });
  return response.choices[0].message.content;
}

async function generateTwitter(blogContent, title) {
  console.log("Generating X/Twitter content...");
  const response = await client.chat.completions.create({
    model: process.env.AZURE_OPENAI_DEPLOYMENT,
    messages: [
      {
        role: "system",
        content: VOICE_GUIDE + "\n\n" + TWITTER_TEMPLATE,
      },
      {
        role: "user",
        content: `Blog post title: "${title}"\n\nBlog post content:\n\n${blogContent}\n\nGenerate all 7 X/Twitter posts for the week (Saturday through Friday) atomized from this blog post. Format clearly with ### Day headers. The Tuesday thread should be numbered Tweet 1/ through Tweet 10/. All content should be copy/paste ready.`,
      },
    ],
    temperature: 0.7,
    max_tokens: 5000,
  });
  return response.choices[0].message.content;
}

async function generateSchedule(slug) {
  const title = extractTitle(slug);
  const blogContent = readBlogPost(slug);

  console.log(`\nAtomizing: "${title}"\n`);

  const [linkedin, twitter] = await Promise.all([
    generateLinkedIn(blogContent, title),
    generateTwitter(blogContent, title),
  ]);

  const output = `# Social Content — ${title}
Generated from: content/${slug}.mdx
Date: ${new Date().toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}

---

## LINKEDIN (3 posts)

${linkedin}

---

## X / TWITTER (7 posts)

${twitter}

---

## POSTING SCHEDULE

| Day | Platform | Type |
|-----|----------|------|
| Saturday | X | Blog promo (2 tweets) |
| Sunday | X | Personal reflection |
| Monday | LinkedIn + X | Market philosophy |
| Tuesday | X | Full thread |
| Wednesday | LinkedIn + X | Mechanism/platform angle |
| Thursday | X | Member win |
| Friday | LinkedIn + X | Platform evolution |
`;

  const outputPath = path.join(__dirname, `${slug}-social.md`);
  fs.writeFileSync(outputPath, output);

  console.log(`Done. File saved: ${slug}-social.md\n`);
}

export { generateSchedule };

// Run directly if called as main script
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const slug = process.argv[2];
  if (!slug) {
    console.error("Usage: node atomize.js <blog-slug>");
    console.error("Example: node atomize.js the-connector-thesis");
    process.exit(1);
  }
  generateSchedule(slug).catch((err) => {
    console.error("Error:", err.message);
    process.exit(1);
  });
}
