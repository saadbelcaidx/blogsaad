import Link from "next/link";
import { getAllPosts } from "@/lib/content";

export default function Home() {
  const posts = getAllPosts();

  return (
    <div>
      <div className="mb-12">
        <h1 className="text-2xl font-semibold tracking-tight text-neutral-900">
          Saad&apos;s Blog
        </h1>
        <p className="mt-2 text-sm text-neutral-500">
          Thoughts on building, design, and technology.
        </p>
      </div>

      <div className="space-y-1">
        {posts.map((post) => (
          <Link
            key={post.slug}
            href={`/blog/${post.slug}`}
            className="group flex items-baseline justify-between rounded-md px-3 py-3 transition-colors hover:bg-neutral-50"
          >
            <div className="min-w-0 flex-1">
              <h2 className="text-[14px] font-medium text-neutral-800 group-hover:text-neutral-900">
                {post.title}
              </h2>
              <p className="mt-0.5 text-[12px] text-neutral-400">
                {post.description}
              </p>
            </div>
            <time className="ml-4 shrink-0 text-[12px] text-neutral-400">
              {new Date(post.date).toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
                year: "numeric",
              })}
            </time>
          </Link>
        ))}
      </div>
    </div>
  );
}
