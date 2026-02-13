import { notFound } from "next/navigation";
import { MDXRemote } from "next-mdx-remote/rsc";
import { getAllPosts, getPostBySlug } from "@/lib/content";
import { Newsletter } from "@/components/newsletter";

interface PageProps {
  params: Promise<{ slug: string }>;
}

export function generateStaticParams() {
  const posts = getAllPosts();
  return posts.map((post) => ({ slug: post.slug }));
}

export async function generateMetadata({ params }: PageProps) {
  const { slug } = await params;
  const post = getPostBySlug(slug);
  if (!post) return { title: "Not Found" };
  return {
    title: post.metaTitle || `${post.title} — Saad Belcaid`,
    description: post.description,
    keywords: post.targetKeywords || undefined,
  };
}

export default async function BlogPost({ params }: PageProps) {
  const { slug } = await params;
  const post = getPostBySlug(slug);

  if (!post) {
    notFound();
  }

  return (
    <article>
      <header className="mb-10">
        <p className="text-[11px] font-medium uppercase tracking-wider text-neutral-500">
          {post.category}
        </p>
        <h1 className="mt-2 font-[family-name:var(--font-geist-sans)] text-2xl font-semibold tracking-tight text-neutral-100">
          {post.title}
        </h1>
        <div className="mt-3 flex items-center gap-3 text-[12px] text-neutral-400">
          <time>
            {new Date(post.date).toLocaleDateString("en-US", {
              month: "long",
              day: "numeric",
              year: "numeric",
            })}
          </time>
          <span>&middot;</span>
          <span>{post.readingTime}</span>
        </div>
      </header>

      <div className="prose">
        <MDXRemote source={post.content} />
      </div>

      <div className="mt-12 border-t border-neutral-800 pt-8">
        <a href="/about" className="group flex items-center gap-4">
          <img
            src="/saad.jpg"
            alt="Saad Belcaid"
            className="h-10 w-10 rounded-full object-cover"
          />
          <div>
            <p className="text-[13px] font-medium text-neutral-300 group-hover:text-neutral-100 transition-colors">
              Saad Belcaid
            </p>
            <p className="text-[11px] text-neutral-500">
              Founder of myoProcess, Connector OS, Sales Systems Mastery.
            </p>
          </div>
        </a>
      </div>

      <Newsletter />
    </article>
  );
}
