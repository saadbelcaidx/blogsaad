const fs = require("fs");
const path = require("path");

const MEDIUM_TOKEN = process.env.MEDIUM_TOKEN;
const DEVTO_API_KEY = process.env.DEVTO_API_KEY;

const CONTENT_DIR = path.join(__dirname, "content");
const SITE_URL = "https://www.saadbelcaid.me/blog";

// Map mdx filenames to canonical URLs
const SLUG_MAP = {
  "how-i-built-myoprocess": "how-i-built-myoprocess",
  "building-ssm": "building-ssm",
  "from-bouncer-to-ceo": "from-bouncer-to-ceo",
  "why-i-built-connector-os": "why-i-built-connector-os",
};

// Tags per article for better discoverability
const TAGS_MAP = {
  "how-i-built-myoprocess": ["startup", "entrepreneurship", "b2b", "saas", "business"],
  "building-ssm": ["community", "entrepreneurship", "sales", "business"],
  "from-bouncer-to-ceo": ["entrepreneurship", "motivation", "startup", "career"],
  "why-i-built-connector-os": ["saas", "startup", "automation", "b2b", "technology"],
};

function parseMdx(filename) {
  const raw = fs.readFileSync(path.join(CONTENT_DIR, filename), "utf-8");
  const match = raw.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
  if (!match) throw new Error(`Could not parse frontmatter in ${filename}`);

  const frontmatter = {};
  match[1].split("\n").forEach((line) => {
    const m = line.match(/^(\w+):\s*"?(.*?)"?\s*$/);
    if (m) frontmatter[m[1]] = m[2];
  });

  // Strip image references (they point to local assets)
  let body = match[2].trim();
  body = body.replace(/!\[.*?\]\(\/.*?\)\n?/g, "");

  return { frontmatter, body };
}

// Append canonical link back to your site
function addCanonical(body, slug) {
  return body + `\n\n---\n\n*Originally published on [saadbelcaid.me](${SITE_URL}/${slug})*`;
}

// ── Medium ──
async function getMediumUserId() {
  const res = await fetch("https://api.medium.com/v1/me", {
    headers: { Authorization: `Bearer ${MEDIUM_TOKEN}` },
  });
  if (!res.ok) throw new Error(`Medium /me failed: ${res.status} ${await res.text()}`);
  const data = await res.json();
  return data.data.id;
}

async function publishToMedium(userId, title, body, tags, canonicalUrl) {
  const res = await fetch(`https://api.medium.com/v1/users/${userId}/posts`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${MEDIUM_TOKEN}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      title,
      contentFormat: "markdown",
      content: `# ${title}\n\n${body}`,
      tags: tags.slice(0, 5),
      canonicalUrl,
      publishStatus: "public",
    }),
  });
  if (!res.ok) throw new Error(`Medium publish failed: ${res.status} ${await res.text()}`);
  const data = await res.json();
  return data.data.url;
}

// ── Dev.to ──
async function publishToDevTo(title, body, tags, canonicalUrl) {
  const res = await fetch("https://dev.to/api/articles", {
    method: "POST",
    headers: {
      "api-key": DEVTO_API_KEY,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      article: {
        title,
        body_markdown: body,
        published: true,
        tags: tags.slice(0, 4),
        canonical_url: canonicalUrl,
      },
    }),
  });
  if (!res.ok) throw new Error(`Dev.to publish failed: ${res.status} ${await res.text()}`);
  const data = await res.json();
  return data.url;
}

// ── Main ──
async function main() {
  const args = process.argv.slice(2);
  const targets = args.length > 0 ? args : Object.keys(SLUG_MAP);

  // Validate tokens
  if (!MEDIUM_TOKEN && !DEVTO_API_KEY) {
    console.error("Set MEDIUM_TOKEN and/or DEVTO_API_KEY environment variables.");
    console.error("  MEDIUM_TOKEN  → medium.com/me/settings → Integration tokens");
    console.error("  DEVTO_API_KEY → dev.to/settings/extensions → Generate API Key");
    process.exit(1);
  }

  let mediumUserId = null;
  if (MEDIUM_TOKEN) {
    try {
      mediumUserId = await getMediumUserId();
      console.log(`✓ Medium authenticated\n`);
    } catch (e) {
      console.error(`✗ Medium auth failed: ${e.message}\n`);
    }
  }

  for (const slug of targets) {
    const filename = `${slug}.mdx`;
    if (!fs.existsSync(path.join(CONTENT_DIR, filename))) {
      console.error(`✗ File not found: ${filename}`);
      continue;
    }

    const { frontmatter, body } = parseMdx(filename);
    const title = frontmatter.title;
    const tags = TAGS_MAP[slug] || ["business"];
    const canonicalUrl = `${SITE_URL}/${SLUG_MAP[slug]}`;
    const bodyWithCanonical = addCanonical(body, SLUG_MAP[slug]);

    console.log(`── ${title} ──`);

    // Medium
    if (mediumUserId) {
      try {
        const url = await publishToMedium(mediumUserId, title, bodyWithCanonical, tags, canonicalUrl);
        console.log(`  ✓ Medium: ${url}`);
      } catch (e) {
        console.error(`  ✗ Medium: ${e.message}`);
      }
    }

    // Dev.to
    if (DEVTO_API_KEY) {
      try {
        const url = await publishToDevTo(title, bodyWithCanonical, tags, canonicalUrl);
        console.log(`  ✓ Dev.to: ${url}`);
      } catch (e) {
        console.error(`  ✗ Dev.to: ${e.message}`);
      }
    }

    console.log();
  }

  console.log("Done.");
}

main();
