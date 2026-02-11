import Link from "next/link";
import { getAllPosts } from "@/lib/content";
import { AnimatedCounter } from "@/components/counter";

export default function Home() {
  const posts = getAllPosts();

  return (
    <div>
      <div className="mb-12">
        <h1 className="font-[family-name:var(--font-geist-sans)] text-2xl font-semibold tracking-tight text-neutral-100">
          Saad Belcaid
        </h1>
        <p className="mt-2 text-sm text-neutral-500">
          Founder of myoProcess, Connector OS, Sales Systems Mastery.
        </p>
      </div>

      {/* Cash collected counter */}
      <div className="mb-12 rounded-lg border border-neutral-800 bg-neutral-900/50 px-6 py-8 text-center">
        <p className="font-[family-name:var(--font-geist-sans)] text-3xl font-bold tracking-tight text-neutral-100 sm:text-4xl">
          <AnimatedCounter target={826745} prefix="$" suffix="+" />
        </p>
        <p className="mt-2 text-sm text-neutral-500">
          in cash collected by SSM members
        </p>
      </div>

      <div className="space-y-1">
        {posts.map((post) => (
          <Link
            key={post.slug}
            href={`/blog/${post.slug}`}
            className="group flex items-baseline justify-between rounded-md px-3 py-3 transition-colors hover:bg-neutral-900"
          >
            <div className="min-w-0 flex-1">
              <h2 className="text-[14px] font-medium text-neutral-300 group-hover:text-neutral-100">
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
