import type { Metadata } from "next";
import { Geist_Mono } from "next/font/google";
import { Sidebar } from "@/components/sidebar";
import { getPostsByCategory } from "@/lib/content";
import "./globals.css";

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Saad's Blog",
  description: "Thoughts on building, design, and technology.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const postsByCategory = getPostsByCategory();

  // Simplify posts for the client sidebar component
  const sidebarData: Record<string, { slug: string; title: string; category: string }[]> = {};
  for (const [category, posts] of Object.entries(postsByCategory)) {
    sidebarData[category] = posts.map((p) => ({
      slug: p.slug,
      title: p.title,
      category: p.category,
    }));
  }

  return (
    <html lang="en">
      <body className={`${geistMono.variable} antialiased`}>
        <Sidebar postsByCategory={sidebarData} />
        <main className="min-h-screen lg:pl-64">
          <div className="mx-auto max-w-3xl px-6 py-16 pt-20 lg:pt-16">
            {children}
          </div>
        </main>
      </body>
    </html>
  );
}
