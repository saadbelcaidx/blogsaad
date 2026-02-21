"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";
import { Linkedin, Youtube, Sun, Moon, Menu, X, Twitter } from "lucide-react";

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
  const [isLight, setIsLight] = useState(false);

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

  const toggleTheme = () => {
    document.documentElement.classList.toggle("light");
    setIsLight(!isLight);
  };

  return (
    <>
      {/* Mobile hamburger */}
      <button
        onClick={() => setOpen(!open)}
        className="fixed top-4 left-4 z-50 flex h-8 w-8 items-center justify-center rounded-md border border-neutral-800 bg-neutral-900/80 backdrop-blur-sm lg:hidden"
        aria-label="Toggle menu"
      >
        {open ? (
          <X size={16} className="text-neutral-400" />
        ) : (
          <Menu size={16} className="text-neutral-400" />
        )}
      </button>

      {/* Overlay */}
      {open && (
        <div
          className="fixed inset-0 z-30 bg-black/50 backdrop-blur-sm lg:hidden"
          onClick={() => setOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-40 w-64 border-r border-neutral-800 bg-neutral-950/80 backdrop-blur-md transition-transform duration-200 ease-in-out lg:translate-x-0 ${
          open ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex h-full flex-col overflow-y-auto px-4 py-6">
          {/* Profile */}
          <Link href="/" className="mb-8 flex items-center gap-3">
            <Image
              src="/saad.jpg"
              alt="Saad Belcaid"
              width={32}
              height={32}
              className="rounded-full object-cover"
              style={{ width: 32, height: 32 }}
            />
            <span className="text-sm font-medium tracking-tight text-neutral-100">
              Saad Belcaid
            </span>
          </Link>

          {/* Navigation */}
          <nav className="flex-1 space-y-6">
            {/* Wall of Winners — standalone page */}
            <div>
              <h3 className="mb-2 text-[11px] font-medium uppercase tracking-wider text-neutral-500">
                Purpose
              </h3>
              <ul className="space-y-0.5">
                <li>
                  <Link
                    href="/winners"
                    className={`block truncate rounded-md px-2.5 py-1.5 text-[13px] transition-colors ${
                      pathname === "/winners"
                        ? "bg-neutral-800/70 font-medium text-neutral-100"
                        : "text-neutral-400 hover:bg-neutral-800/50 hover:text-neutral-200"
                    }`}
                  >
                    Wall of Winners
                  </Link>
                </li>
                <li>
                  <Link
                    href="/about"
                    className={`block truncate rounded-md px-2.5 py-1.5 text-[13px] transition-colors ${
                      pathname === "/about"
                        ? "bg-neutral-800/70 font-medium text-neutral-100"
                        : "text-neutral-400 hover:bg-neutral-800/50 hover:text-neutral-200"
                    }`}
                  >
                    About
                  </Link>
                </li>
              </ul>
            </div>

            {Object.entries(postsByCategory).sort(([a], [b]) => {
              const order = ["Market Philosophy", "Operator Reality", "Platform Evolution", "Building in Public", "Thoughts"];
              const ai = order.indexOf(a) === -1 ? 99 : order.indexOf(a);
              const bi = order.indexOf(b) === -1 ? 99 : order.indexOf(b);
              return ai - bi;
            }).map(([category, posts]) => (
              <div key={category}>
                <h3 className="mb-2 text-[11px] font-medium uppercase tracking-wider text-neutral-500">
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
                          title={post.title}
                          className={`block truncate rounded-md px-2.5 py-1.5 text-[13px] transition-colors ${
                            isActive
                              ? "bg-neutral-800/70 font-medium text-neutral-100"
                              : "text-neutral-400 hover:bg-neutral-800/50 hover:text-neutral-200"
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

          {/* Wiki */}
          <div className="mt-6 border-t border-neutral-800 pt-4">
            <Link
              href="/wiki/saadbelcaid"
              className={`block truncate rounded-md px-2.5 py-1.5 text-[13px] transition-colors ${
                pathname === "/wiki/saadbelcaid"
                  ? "bg-neutral-800/70 font-medium text-neutral-100"
                  : "text-neutral-400 hover:bg-neutral-800/50 hover:text-neutral-200"
              }`}
            >
              Wiki
            </Link>
          </div>

          {/* Social Links */}
          <div className="mt-4 border-t border-neutral-800 pt-4 space-y-1">
            <a
              href="https://x.com/belcaidsaaad"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2.5 rounded-md px-2.5 py-1.5 text-[13px] text-neutral-400 transition-colors hover:bg-neutral-800/50 hover:text-neutral-200"
            >
              <Twitter size={14} />
              X / Twitter
            </a>
            <a
              href="https://www.linkedin.com/in/saadbelcaid/"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2.5 rounded-md px-2.5 py-1.5 text-[13px] text-neutral-400 transition-colors hover:bg-neutral-800/50 hover:text-neutral-200"
            >
              <Linkedin size={14} />
              LinkedIn
            </a>
            <a
              href="https://www.youtube.com/@SaadBelcaid"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2.5 rounded-md px-2.5 py-1.5 text-[13px] text-neutral-400 transition-colors hover:bg-neutral-800/50 hover:text-neutral-200"
            >
              <Youtube size={14} />
              YouTube
            </a>
            <a
              href="https://skool.com/ssmasters/about"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2.5 rounded-md px-2.5 py-1.5 text-[13px] text-neutral-400 transition-colors hover:bg-neutral-800/50 hover:text-neutral-200"
            >
              <Image src="/myoprocess.png" alt="SSM" width={14} height={14} className="rounded-sm" />
              SSM Community
            </a>
            <a
              href="https://www.myoprocess.com"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2.5 rounded-md px-2.5 py-1.5 text-[13px] text-neutral-400 transition-colors hover:bg-neutral-800/50 hover:text-neutral-200"
            >
              <Image src="/myoprocess.png" alt="myoProcess" width={14} height={14} className="rounded-sm" />
              myoProcess
            </a>
            <a
              href="https://connector-os.com"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2.5 rounded-md px-2.5 py-1.5 text-[13px] text-neutral-400 transition-colors hover:bg-neutral-800/50 hover:text-neutral-200"
            >
              <Image src="/connector-os.png" alt="Connector OS" width={14} height={14} className="rounded-sm" />
              Connector OS
            </a>
          </div>

          {/* Theme Toggle */}
          <div className="mt-4 border-t border-neutral-800 pt-4">
            <button
              onClick={toggleTheme}
              className="flex w-full items-center gap-2.5 rounded-md px-2.5 py-1.5 text-[13px] text-neutral-400 transition-colors hover:bg-neutral-800/50 hover:text-neutral-200"
            >
              {isLight ? <Moon size={14} /> : <Sun size={14} />}
              {isLight ? "Back to the dark side" : "Too dark? Fix that"}
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}
