"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";

interface SidebarPost {
  slug: string;
  title: string;
  category: string;
}

interface SidebarProps {
  postsByCategory: Record<string, SidebarPost[]>;
}

export function Sidebar({ postsByCategory }: SidebarProps) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  // Close sidebar on route change (mobile)
  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  // Prevent body scroll when mobile sidebar is open
  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  return (
    <>
      {/* Mobile hamburger */}
      <button
        onClick={() => setOpen(!open)}
        className="fixed top-4 left-4 z-50 flex h-8 w-8 items-center justify-center rounded-md border border-neutral-200 bg-white/80 backdrop-blur-sm lg:hidden"
        aria-label="Toggle menu"
      >
        <svg
          width="16"
          height="16"
          viewBox="0 0 16 16"
          fill="none"
          className="text-neutral-600"
        >
          {open ? (
            <path
              d="M4 4L12 12M12 4L4 12"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
            />
          ) : (
            <>
              <path
                d="M2 4H14"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
              />
              <path
                d="M2 8H14"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
              />
              <path
                d="M2 12H14"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
              />
            </>
          )}
        </svg>
      </button>

      {/* Overlay */}
      {open && (
        <div
          className="fixed inset-0 z-30 bg-black/20 backdrop-blur-sm lg:hidden"
          onClick={() => setOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-40 w-64 border-r border-neutral-200 bg-neutral-50/80 backdrop-blur-md transition-transform duration-200 ease-in-out lg:translate-x-0 ${
          open ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex h-full flex-col overflow-y-auto px-4 py-6">
          {/* Logo / Title */}
          <Link
            href="/"
            className="mb-8 block text-sm font-medium tracking-tight text-neutral-900"
          >
            Saad&apos;s Blog
          </Link>

          {/* Navigation */}
          <nav className="flex-1 space-y-6">
            {Object.entries(postsByCategory).map(([category, posts]) => (
              <div key={category}>
                <h3 className="mb-2 text-[11px] font-medium uppercase tracking-wider text-neutral-400">
                  {category}
                </h3>
                <ul className="space-y-0.5">
                  {posts.map((post) => {
                    const href = `/blog/${post.slug}`;
                    const isActive = pathname === href;
                    return (
                      <li key={post.slug}>
                        <Link
                          href={href}
                          className={`block rounded-md px-2.5 py-1.5 text-[13px] transition-colors ${
                            isActive
                              ? "bg-neutral-200/70 font-medium text-neutral-900"
                              : "text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900"
                          }`}
                        >
                          {post.title}
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              </div>
            ))}
          </nav>
        </div>
      </aside>
    </>
  );
}
