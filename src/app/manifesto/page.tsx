import type { Metadata } from "next";
import { Newsletter } from "@/components/newsletter";

export const metadata: Metadata = {
  title: "The Connector Manifesto — Saad Belcaid",
  description: "How to build a $2M/yr connector business without getting lucky. 18 principles. This is the doctrine.",
  metadataBase: new URL("https://saadbelcaid.me"),
  openGraph: {
    title: "The Connector Manifesto — Saad Belcaid",
    description: "How to build a $2M/yr connector business without getting lucky. 18 principles. This is the doctrine.",
    url: "https://saadbelcaid.me/manifesto",
    images: [{ url: "/og-image.png", width: 1200, height: 630 }],
  },
  twitter: {
    card: "summary_large_image",
    site: "@belcaidsaaad",
    creator: "@belcaidsaaad",
    title: "The Connector Manifesto — Saad Belcaid",
    description: "How to build a $2M/yr connector business without getting lucky. 18 principles.",
    images: ["/og-image.png"],
  },
};

const principles = [
  `Seek deal flow, not clients. Every day, instead of asking "who can I work for?" — ask "where are deals already happening?" and put yourself in the middle of that movement.`,
  "Wealth comes from position, not labor. If you're doing the fulfillment, you're a vendor. If you control who meets who, you're the infrastructure.",
  "Ignore people building agencies. They gain revenue by adding headcount. You gain revenue by adding signal.",
  "You're not going to get rich selling services. You must own the flow of deals — the introductions, the access, the trust — to gain your freedom.",
  "You will get rich by connecting the right people at the right time. At scale. Pick a market where businesses already need each other but haven't met yet. That gap is your entire business.",
  "The internet has made every company reachable. Most people use this to spam. The smart ones use it to connect.",
  "Don't partner with people who chase trends. AI agents, automation agencies, lead gen — these come and go. Relationships are permanent.",
  "Signal is demand already moving in the market. A company hiring, expanding, launching a new offer — that is energy you can route.",
  "Signal is found by paying attention, not by prospecting. If you're cold calling, you're guessing. If you're reading signals, you're operating.",
  "Access means relationships. The person who knows the buyer and the seller captures the spread. This is the oldest form of wealth creation.",
  "Study markets, incentives, psychology, positioning, and timing. Not sales hacks.",
  "Set and enforce an aspirational hourly rate. If the work doesn't involve signal, matching, or routing — delegate it.",
  "The first win proves the model. After that, you don't need to work harder — you need to see better.",
  "After the first win, double down on the lane that worked. Don't chase new niches. Dominate the one that already paid you.",
  "Build a brand around that lane. Content, case studies, reputation. Inbound starts when people know you own that market.",
  "Stack more signals per week. Then stack more matches per signal. Then standardize the routing.",
  "A normal service business scales slowly because every new client needs more work. The connector model scales fast because the hard work is done by the companies you connect.",
  "Your job isn't to do more. It's to see more clearly and move more precisely. Apply signal, with leverage, and eventually you will get out of life what you deserve.",
];

export default function ManifestoPage() {
  return (
    <div>
      {/* Header */}
      <header className="mb-16">
        <p className="text-[11px] font-medium uppercase tracking-wider text-neutral-500">
          Doctrine
        </p>
        <h1 className="mt-2 font-[family-name:var(--font-geist-sans)] text-2xl font-semibold tracking-tight text-neutral-100 leading-snug">
          How to build a $2M/yr connector business
          <span className="text-neutral-500"> without getting lucky</span>
        </h1>
        <p className="mt-4 text-[13px] text-neutral-500 leading-relaxed max-w-lg">
          18 principles. Not a framework. Not a playbook. A doctrine — the operating system underneath everything I've built.
        </p>
        <div className="mt-6 flex items-center gap-4">
          <a
            href="https://x.com/belcaidsaaad"
            target="_blank"
            rel="noopener noreferrer"
            className="text-[12px] text-neutral-500 transition-colors hover:text-neutral-300"
          >
            @belcaidsaaad
          </a>
          <span className="text-neutral-700">·</span>
          <span className="text-[12px] text-neutral-500">$192K MRR · 318 operators</span>
        </div>
      </header>

      {/* Principles */}
      <div className="space-y-0">
        {principles.map((principle, i) => (
          <div
            key={i}
            className="group flex gap-6 border-t border-neutral-800/60 py-7 transition-colors hover:bg-neutral-900/20 px-1"
          >
            <span className="mt-0.5 shrink-0 font-[family-name:var(--font-geist-mono)] text-[12px] text-neutral-600 transition-colors group-hover:text-neutral-500 w-5 text-right">
              {i + 1}
            </span>
            <p className="text-[15px] leading-[1.75] text-neutral-300 transition-colors group-hover:text-neutral-100">
              {principle}
            </p>
          </div>
        ))}
        <div className="border-t border-neutral-800/60" />
      </div>

      {/* Footer CTA */}
      <div className="mt-16 space-y-8">
        <div className="rounded-lg border border-neutral-800 bg-neutral-900/40 px-6 py-8">
          <p className="text-[11px] font-medium uppercase tracking-wider text-neutral-500 mb-3">
            The Platform
          </p>
          <p className="text-[15px] text-neutral-300 leading-relaxed mb-5">
            Connector OS is the operating system for running this model at scale. Signal detection, dual-side matching, automated routing. Free.
          </p>
          <a
            href="https://connector-os.com"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 rounded-md bg-neutral-100 px-4 py-2 text-[13px] font-semibold text-neutral-900 transition-colors hover:bg-white"
          >
            connector-os.com →
          </a>
        </div>

        <Newsletter />
      </div>
    </div>
  );
}
