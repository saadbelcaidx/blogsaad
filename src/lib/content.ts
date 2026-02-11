import fs from "fs";
import path from "path";
import matter from "gray-matter";
import readingTime from "reading-time";

const contentDir = path.join(process.cwd(), "content");

export interface Post {
  slug: string;
  title: string;
  date: string;
  category: string;
  description: string;
  metaTitle: string;
  targetKeywords: string;
  readingTime: string;
  content: string;
}

export function getAllPosts(): Post[] {
  const files = fs.readdirSync(contentDir).filter((f) => f.endsWith(".mdx"));

  const posts = files.map((filename) => {
    const slug = filename.replace(/\.mdx$/, "");
    const filePath = path.join(contentDir, filename);
    const fileContent = fs.readFileSync(filePath, "utf-8");
    const { data, content } = matter(fileContent);
    const stats = readingTime(content);

    return {
      slug,
      title: data.title || slug,
      date: data.date || "",
      category: data.category || "Uncategorized",
      description: data.description || "",
      metaTitle: data.meta_title || "",
      targetKeywords: data.target_keywords || "",
      readingTime: stats.text,
      content,
    };
  });

  return posts.sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  );
}

export function getPostBySlug(slug: string): Post | undefined {
  const posts = getAllPosts();
  return posts.find((p) => p.slug === slug);
}

export function getPostsByCategory(): Record<string, Post[]> {
  const posts = getAllPosts();
  const grouped: Record<string, Post[]> = {};

  for (const post of posts) {
    if (!grouped[post.category]) {
      grouped[post.category] = [];
    }
    grouped[post.category].push(post);
  }

  return grouped;
}
