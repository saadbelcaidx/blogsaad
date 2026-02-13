import type { Metadata } from "next";
import Image from "next/image";
import {
  BookOpen,
  Music,
  Sun,
  TreePine,
  Coffee,
  Piano,
  Disc3,
  Beef,
  Timer,
  Brain,
  Users,
  Swords,
  BookMarked,
  Wrench,
  Headphones,
} from "lucide-react";

export const metadata: Metadata = {
  title: "About Saad Belcaid — Founder of myoProcess, Connector OS & SSM",
  description:
    "Founder of myoProcess, Connector OS, Sales Systems Mastery.",
};

const faqJsonLd = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: [
    {
      "@type": "Question",
      name: "Who is Saad Belcaid?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Saad Belcaid is a 27-year-old entrepreneur based in Limassol, Cyprus. He is the founder of myoProcess, Connector OS, and Sales Systems Mastery.",
      },
    },
    {
      "@type": "Question",
      name: "What is myoProcess?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "myoProcess is a B2B connector company founded by Saad Belcaid in 2023. It helps businesses grow through strategic introductions rather than cold outreach.",
      },
    },
    {
      "@type": "Question",
      name: "What is the Connector Model?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "The Connector Model is a B2B approach where you earn by facilitating introductions between businesses, rather than selling services directly.",
      },
    },
    {
      "@type": "Question",
      name: "What is Sales Systems Mastery?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Sales Systems Mastery (SSM) is a paid community teaching the connector model. Members have generated $826,745+ in verified results.",
      },
    },
    {
      "@type": "Question",
      name: "Where is Saad Belcaid based?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Saad Belcaid is based in Limassol, Cyprus. He is half Moroccan, half Italian.",
      },
    },
  ],
};

/* ── data ─────────────────────────────────────────────────────────── */

const bookCategories = [
  {
    name: "Jung & Psychology",
    icon: <Brain size={14} />,
    books: [
      { title: "Man and His Symbols", author: "Carl Jung" },
      {
        title: "The Archetypes and the Collective Unconscious",
        author: "Carl Jung",
      },
      { title: "Synchronicity", author: "Carl Jung" },
      { title: "Memories, Dreams, Reflections", author: "Carl Jung" },
      { title: "The Red Book", author: "Carl Jung" },
    ],
  },
  {
    name: "Philosophy",
    icon: <BookOpen size={14} />,
    books: [
      { title: "The Republic", author: "Plato" },
      { title: "Finite & Infinite Games", author: "James P. Carse" },
      { title: "Works of Cicero", author: "Cicero" },
      { title: "Works of Socrates", author: "Socrates" },
    ],
  },
  {
    name: "Systems & Strategy",
    icon: <Disc3 size={14} />,
    books: [
      { title: "Anti-fragile", author: "Nassim Nicholas Taleb" },
      { title: "Mental Models", author: "Various" },
      { title: "Thinking, Fast and Slow", author: "Daniel Kahneman" },
      { title: "Blitzscaling", author: "Reid Hoffman" },
      { title: "Way of Self Mastery", author: "" },
      { title: "Never Split the Difference", author: "Chris Voss" },
    ],
  },
  {
    name: "Business",
    icon: <Users size={14} />,
    books: [
      { title: "Poor Charlie's Almanack", author: "Charlie Munger" },
      {
        title: "Berkshire Hathaway Letters to Shareholders",
        author: "Warren Buffett",
      },
      { title: "Shoe Dog", author: "Phil Knight" },
      { title: "The Everything Store", author: "Brad Stone" },
      { title: "Made in America", author: "Sam Walton" },
    ],
  },
  {
    name: "History & Conquest",
    icon: <Swords size={14} />,
    books: [
      { title: "Commentaries on the Gallic Wars", author: "Julius Caesar" },
      { title: "The Second World War", author: "Winston Churchill" },
      {
        title: "A History of the British Empire",
        author: "James Belich",
      },
      { title: "Works of Napoleon", author: "Napoleon Bonaparte" },
      { title: "Works of Alexander the Great", author: "" },
      { title: "Works of Genghis Khan", author: "" },
      { title: "Works of Charles Darwin", author: "Charles Darwin" },
    ],
  },
  {
    name: "Esoteric",
    icon: <Sun size={14} />,
    books: [{ title: "Anything by Rudolf Steiner", author: "Rudolf Steiner" }],
  },
];

const artists = [
  { name: "Nujabes", note: "Chill hop pioneer" },
  { name: "Cise Starr", note: "Soulful lyricism" },
  { name: "Gibran Alcocer", note: "Ambient piano" },
];

const lifestyle = [
  { icon: <Sun size={18} />, title: "Walks in the sun", description: "Daily ritual. Clears the mind." },
  { icon: <TreePine size={18} />, title: "Reading in the woods", description: "Nature + books. That's the spot." },
  { icon: <Coffee size={18} />, title: "Lattes", description: "Non-negotiable." },
  { icon: <Piano size={18} />, title: "Piano", description: "Love it." },
  { icon: <Disc3 size={18} />, title: "Tennis", description: "Competitive by nature." },
  { icon: <Beef size={18} />, title: "Animal-based", description: "One big steak a day." },
  { icon: <Timer size={18} />, title: "OMAD & Fasting", description: "Fast all day. Feast once." },
];

const timeline = [
  { year: "2019–2022", title: "Nightclub Security", description: "Where discipline started. Working doors, reading people, learning control." },
  { year: "2022–2023", title: "Freelance Automation", description: "6 months on Upwork building lead gen systems. Got banned at the end." },
  { year: "2023", title: "Founded myoProcess", description: "Realized the leverage is in introductions, not outreach. Built the connector model." },
  { year: "Dec 2024", title: "Launched Sales Systems Mastery", description: "Paid community teaching the connector model. $826K+ in member results." },
  { year: "Dec 2025", title: "Launched Connector OS", description: "Free software for running a connector business at scale." },
];

const currently = [
  { icon: <BookMarked size={16} />, label: "Reading", value: "Sufi literature — Arabic consciousness" },
  { icon: <Wrench size={16} />, label: "Building", value: "Scaling myoProcess & Connector OS" },
  { icon: <Headphones size={16} />, label: "Listening", value: "Nujabes, Cise Starr, Gibran Alcocer" },
];

/* ── page ─────────────────────────────────────────────────────────── */

export default function AboutPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
      />
    <div>
      {/* ── Hero ──────────────────────────────────────────── */}
      <header className="mb-14">
        <div className="flex items-start gap-5">
          <Image
            src="/saad.jpg"
            alt="Saad Belcaid"
            width={72}
            height={72}
            className="rounded-full object-cover"
            style={{ width: 72, height: 72 }}
            priority
          />
          <div>
            <p className="text-[11px] font-medium uppercase tracking-wider text-neutral-500">
              About
            </p>
            <h1 className="mt-1 font-[family-name:var(--font-geist-sans)] text-2xl font-semibold tracking-tight text-neutral-100">
              Saad Belcaid
            </h1>
            <p className="mt-1 text-[13px] text-neutral-400">
              Founder of myoProcess, Connector OS, Sales Systems Mastery.
            </p>
          </div>
        </div>
        <blockquote className="mt-8 border-l-2 border-neutral-700 pl-4 text-[14px] italic leading-relaxed text-neutral-500">
          &ldquo;When you die, you&apos;ll die alone. But solitude, if embraced, prepares you for death — and in doing so, gives you life.&rdquo;
        </blockquote>
      </header>

      {/* ── Who I Am ────────────────────────────────────────── */}
      <section className="mb-16">
        <h2 className="about-section-title font-[family-name:var(--font-geist-sans)]">
          Who I Am
        </h2>
        <div className="space-y-4 text-[15px] leading-[1.75] text-neutral-400">
          <p>
            An intuitive introvert — I focus inward on thoughts, ideas, and
            feelings rather than the outside world. I think deeply, prefer
            solitude, and have a natural ability to sense patterns, connections,
            and possibilities.
          </p>
          <p>
            But there&apos;s another side. Carl Jung would call it my other
            &quot;self&quot; — the socialite. I balance introspection with social
            charm. People call me outgoing, charming. My friends are often
            surprised at how easily I strike up conversations with strangers, and
            how comfortable and open they feel around me.
          </p>
          <p>
            I went from working nightclub security jobs to building one of the
            fastest-growing connector companies in the B2B space. At 24, I
            founded myoProcess — now 3 years running. A new way of doing B2B
            growth that isn&apos;t about blasting cold emails or expensive ads, but
            about owning deal flow by connecting the right people at the right
            time. Based in Limassol, Cyprus.
          </p>
          <p>
            Underneath the business side, there&apos;s a personal journey —
            discipline, solitude, inner work, and constant refinement — because
            systems only work long-term when the operator behind them is stable,
            honest, and improving.
          </p>
          <p>
            <a href="/winners" className="text-[#a78bfa] hover:text-[#c4b5fd] transition-colors">
              $826,745+ in verified member results &rarr; Wall of Winners
            </a>
          </p>
        </div>
      </section>

      {/* ── Timeline ─────────────────────────────────────────── */}
      <section className="mb-16">
        <h2 className="about-section-title font-[family-name:var(--font-geist-sans)]">
          Timeline
        </h2>
        <div className="relative ml-3 border-l border-neutral-800 pl-6">
          {timeline.map((item, i) => (
            <div key={i} className="relative mb-8 last:mb-0">
              <div className="absolute -left-[31px] top-1 h-2.5 w-2.5 rounded-full border-2 border-neutral-700 bg-neutral-950" />
              <p className="text-[11px] font-medium uppercase tracking-wider text-neutral-500">
                {item.year}
              </p>
              <p className="mt-1 text-[14px] font-medium text-neutral-200">
                {item.title}
              </p>
              <p className="mt-0.5 text-[13px] leading-relaxed text-neutral-500">
                {item.description}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Currently ─────────────────────────────────────────── */}
      <section className="mb-16">
        <h2 className="about-section-title font-[family-name:var(--font-geist-sans)]">
          Currently
        </h2>
        <div className="grid gap-3 sm:grid-cols-3">
          {currently.map((item) => (
            <div key={item.label} className="about-card group flex items-center gap-3">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-neutral-800 text-neutral-400 transition-colors group-hover:bg-purple-500/10 group-hover:text-purple-400">
                {item.icon}
              </div>
              <div>
                <p className="text-[11px] font-medium uppercase tracking-wider text-neutral-500">
                  {item.label}
                </p>
                <p className="text-[13px] text-neutral-300">
                  {item.value}
                </p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── Books ───────────────────────────────────────────── */}
      <section className="mb-16">
        <h2 className="about-section-title font-[family-name:var(--font-geist-sans)]">
          Books I&apos;ve Read
        </h2>
        <p className="mb-8 text-[13px] text-neutral-500">
          Yes, I read all of these.
        </p>

        <div className="grid gap-6 sm:grid-cols-2">
          {bookCategories.map((cat) => (
            <div key={cat.name} className="about-card group">
              <div className="mb-4 flex items-center gap-2 text-neutral-500">
                {cat.icon}
                <h3 className="text-[11px] font-semibold uppercase tracking-wider">
                  {cat.name}
                </h3>
              </div>
              <ul className="space-y-2.5">
                {cat.books.map((book) => (
                  <li key={book.title} className="flex items-start gap-2">
                    <span className="mt-[7px] h-1 w-1 shrink-0 rounded-full bg-neutral-700" />
                    <div>
                      <p className="text-[13px] font-medium leading-snug text-neutral-300">
                        {book.title}
                      </p>
                      {book.author && (
                        <p className="text-[11px] text-neutral-500">
                          {book.author}
                        </p>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </section>

      {/* ── Music ───────────────────────────────────────────── */}
      <section className="mb-16">
        <h2 className="about-section-title font-[family-name:var(--font-geist-sans)]">
          Music I Listen To
        </h2>
        <p className="mb-8 text-[13px] text-neutral-500">
          I listen to mostly everything, but these are my people.
        </p>

        <div className="mb-8 grid gap-3 sm:grid-cols-3">
          {artists.map((a) => (
            <div key={a.name} className="about-card group text-center">
              <div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-neutral-800 text-neutral-400 transition-colors group-hover:bg-purple-500/10 group-hover:text-purple-400">
                <Music size={18} />
              </div>
              <p className="text-[14px] font-medium text-neutral-200">
                {a.name}
              </p>
              <p className="mt-0.5 text-[11px] text-neutral-500">{a.note}</p>
            </div>
          ))}
        </div>

        {/* Spotify link */}
        <a
          href="https://open.spotify.com/user/31r2mvg4kompwjsctgrshjyowgfa"
          target="_blank"
          rel="noopener noreferrer"
          className="about-card group flex items-center gap-4 no-underline"
        >
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#1DB954]/10 text-[#1DB954] transition-colors group-hover:bg-[#1DB954]/20">
            <Music size={18} />
          </div>
          <div>
            <p className="text-[14px] font-medium text-neutral-200">
              Listen on Spotify
            </p>
            <p className="mt-0.5 text-[11px] text-neutral-500">
              Follow my profile for playlists &amp; vibes
            </p>
          </div>
        </a>
      </section>

      {/* ── Lifestyle ───────────────────────────────────────── */}
      <section className="mb-16">
        <h2 className="about-section-title font-[family-name:var(--font-geist-sans)]">
          What I Do
        </h2>

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {lifestyle.map((item) => (
            <div key={item.title} className="about-card group flex items-start gap-3.5">
              <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-neutral-800 text-neutral-400 transition-colors group-hover:bg-purple-500/10 group-hover:text-purple-400">
                {item.icon}
              </div>
              <div>
                <p className="text-[13px] font-medium text-neutral-200">
                  {item.title}
                </p>
                <p className="mt-0.5 text-[11px] leading-relaxed text-neutral-500">
                  {item.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </section>

    </div>
    </>
  );
}
