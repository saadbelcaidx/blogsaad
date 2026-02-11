import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Sidebar } from "@/components/sidebar";
import { getPostsByCategory } from "@/lib/content";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Saad Belcaid — Founder of myoProcess, Connector OS & Sales Systems Mastery",
  description: "Saad Belcaid is the founder of myoProcess, Connector OS, and Sales Systems Mastery. $826K+ collected by SSM members using the connector framework.",
  metadataBase: new URL("https://saadbelcaid.me"),
  icons: {
    icon: "/saad.jpg",
    apple: "/saad.jpg",
  },
};

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "Person",
  name: "Saad Belcaid",
  jobTitle: "Founder",
  worksFor: [
    { "@type": "Organization", name: "myoProcess" },
    { "@type": "Organization", name: "Connector OS" },
    { "@type": "Organization", name: "Sales Systems Mastery" },
  ],
  url: "https://saadbelcaid.me",
  sameAs: [
    "https://linkedin.com/in/saadbelcaid",
    "https://x.com/belcaidsaaad",
    "https://connector-os.com",
    "https://skool.com/ssmasters/about",
  ],
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
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
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
