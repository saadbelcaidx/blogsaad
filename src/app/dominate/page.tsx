"use client";

import { useState, useRef, useEffect } from "react";
import {
  Youtube,
  FileText,
  ImageIcon,
  Copy,
  Check,
  Loader2,
  Rocket,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  BarChart2,
  Calendar,
  Send,
  TrendingUp,
  Twitter,
  Linkedin,
  Globe,
  Users,
  Radar,
  Zap,
  ArrowRight,
  AlertTriangle,
  Flame,
  Target,
  Sparkles,
  Scissors,
  Film,
  Play,
  Clapperboard,
  MessageSquare,
} from "lucide-react";

// ─── Types ───────────────────────────────────────────────────────────────────

type Tab = "generate" | "metrics" | "calendar" | "autopost" | "signals" | "clips";
type Mode = "youtube" | "text" | "image";
type Step =
  | "idle"
  | "fetching"
  | "generating"
  | "social"
  | "done"
  | "publishing"
  | "published";
type WeekStatus = "not-started" | "writing" | "published";

interface Result {
  slug: string;
  title: string;
  mdxContent: string;
  socialContent: string;
}

interface SocialSection {
  label: string;
  platform: "linkedin" | "twitter";
  content: string;
}

interface WeeklyMetrics {
  xImpressions: string;
  liImpressions: string;
  blogVisitors: string;
  ssmSignups: string;
}

const GOALS = {
  xImpressions: 100000,
  liImpressions: 50000,
  blogVisitors: 5000,
  ssmSignups: 20,
};

const CALENDAR_WEEKS = [
  { week: 1, title: "The Connector Thesis", category: "Market Philosophy", theme: "access vs delivery, deal flow mindset" },
  { week: 2, title: "Why The Middle Wins", category: "Market Philosophy", theme: "two-sided orchestration, position over labor" },
  { week: 3, title: "Signal-Based Deal Flow", category: "Market Philosophy", theme: "signal detection methodology, reading vs guessing" },
  { week: 4, title: "The Operator Identity Shift", category: "Market Philosophy", theme: "$10K → $100K transformation, not tactics" },
  { week: 5, title: "What Closing Actually Looks Like", category: "Operator Reality", theme: "real deal mechanics, no BS" },
  { week: 6, title: "The $50K/Month Operating System", category: "Operator Reality", theme: "daily workflow, stack of signals" },
  { week: 7, title: "Why Most Operators Stay Small", category: "Operator Reality", theme: "headcount trap, vendor mindset" },
  { week: 8, title: "The Network Effect Thesis", category: "Operator Reality", theme: "relationships compound, trends don't" },
  { week: 9, title: "Encoding Markets", category: "Platform Evolution", theme: "Connector OS methodology, 6 markets encoded" },
  { week: 10, title: "From Tool To Infrastructure", category: "Platform Evolution", theme: "what Connector OS is becoming" },
  { week: 11, title: "Vertical-Aware Routing", category: "Platform Evolution", theme: "biotech, WM, recruitment, agency, insurance, SaaS" },
  { week: 12, title: "The Connector OS Roadmap", category: "Platform Evolution", theme: "where this goes next" },
];

const STEP_LABELS: Record<Step, string> = {
  idle: "",
  fetching: "Fetching transcript...",
  generating: "Writing blog post...",
  social: "Generating social content...",
  done: "",
  publishing: "Publishing to saadbelcaid.me...",
  published: "",
};

// ─── Utilities ────────────────────────────────────────────────────────────────

function parseSocial(raw: string): SocialSection[] {
  const sections: SocialSection[] = [];
  const lines = raw.split("\n");
  let platform: "linkedin" | "twitter" = "linkedin";
  let currentLabel = "";
  let currentLines: string[] = [];

  const flush = () => {
    if (currentLabel && currentLines.length) {
      const content = currentLines.join("\n").trim();
      if (content) sections.push({ label: currentLabel, platform, content });
    }
    currentLines = [];
  };

  for (const line of lines) {
    if (line.startsWith("## LINKEDIN")) { platform = "linkedin"; continue; }
    if (line.startsWith("## X / TWITTER")) { platform = "twitter"; continue; }
    if (line.startsWith("## POSTING SCHEDULE")) { flush(); break; }
    if (line.startsWith("---") && !currentLabel) continue;
    if (line.startsWith("### ")) {
      flush();
      currentLabel = line.replace("### ", "").trim();
    } else if (currentLabel) {
      currentLines.push(line);
    }
  }
  flush();
  return sections;
}

function formatNum(val: number): string {
  if (val >= 1000) return `${(val / 1000).toFixed(1)}K`;
  return String(val);
}

function progress(val: number, goal: number): number {
  return Math.min(100, Math.round((val / goal) * 100));
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  const copy = () => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <button
      onClick={copy}
      className="flex items-center gap-1.5 rounded-md px-2.5 py-1 text-[11px] font-medium text-neutral-400 transition-colors hover:bg-neutral-800 hover:text-neutral-200"
    >
      {copied ? <Check size={12} className="text-green-400" /> : <Copy size={12} />}
      {copied ? "Copied" : "Copy"}
    </button>
  );
}

function SocialCard({ section }: { section: SocialSection }) {
  const [open, setOpen] = useState(false);
  const isLinkedin = section.platform === "linkedin";
  return (
    <div className="rounded-lg border border-neutral-800 bg-neutral-900/40">
      <button
        onClick={() => setOpen(!open)}
        className="flex w-full items-center justify-between px-4 py-3 text-left"
      >
        <div className="flex items-center gap-2.5">
          <span
            className={`rounded px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${isLinkedin ? "bg-blue-500/10 text-blue-400" : "bg-neutral-700 text-neutral-300"}`}
          >
            {isLinkedin ? "LI" : "X"}
          </span>
          <span className="text-[13px] font-medium text-neutral-300">{section.label}</span>
        </div>
        {open ? <ChevronUp size={14} className="text-neutral-500" /> : <ChevronDown size={14} className="text-neutral-500" />}
      </button>
      {open && (
        <div className="border-t border-neutral-800 px-4 pb-4 pt-3">
          <div className="mb-2 flex justify-end">
            <CopyButton text={section.content} />
          </div>
          <pre className="whitespace-pre-wrap font-[family-name:var(--font-geist-mono)] text-[12px] leading-relaxed text-neutral-400">
            {section.content}
          </pre>
        </div>
      )}
    </div>
  );
}

function MetricBar({ label, icon: Icon, color, value, goal, unit = "" }: {
  label: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
  color: string;
  value: number;
  goal: number;
  unit?: string;
}) {
  const pct = progress(value, goal);
  return (
    <div className="rounded-lg border border-neutral-800 bg-neutral-900/40 p-5">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2 text-neutral-400">
          <Icon size={14} className={color} />
          <span className="text-[12px] font-medium uppercase tracking-wider text-neutral-500">{label}</span>
        </div>
        <span className={`text-[11px] font-semibold ${pct >= 100 ? "text-green-400" : pct >= 50 ? "text-neutral-300" : "text-neutral-500"}`}>
          {pct}%
        </span>
      </div>
      <div className="flex items-end gap-1.5 mb-3">
        <span className="text-2xl font-semibold text-neutral-100 font-[family-name:var(--font-geist-sans)]">
          {value === 0 ? "—" : formatNum(value)}{unit}
        </span>
        <span className="text-[12px] text-neutral-600 mb-0.5">/ {formatNum(goal)}{unit} goal</span>
      </div>
      <div className="h-1 w-full rounded-full bg-neutral-800 overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-500 ${pct >= 100 ? "bg-green-500" : "bg-neutral-400"}`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

// ─── TABS ─────────────────────────────────────────────────────────────────────

function GenerateTab({ storedPassword }: { storedPassword: string }) {
  const [mode, setMode] = useState<Mode>("youtube");
  const [url, setUrl] = useState("");
  const [ytTranscript, setYtTranscript] = useState("");
  const [showYtFallback, setShowYtFallback] = useState(false);
  const [text, setText] = useState("");
  const [image, setImage] = useState<File | null>(null);
  const [extraText, setExtraText] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  const [step, setStep] = useState<Step>("idle");
  const [error, setError] = useState("");
  const [result, setResult] = useState<Result | null>(null);
  const [socialSections, setSocialSections] = useState<SocialSection[]>([]);
  const [publishedUrl, setPublishedUrl] = useState("");

  const generate = async () => {
    setError("");
    setResult(null);
    setSocialSections([]);
    setPublishedUrl("");

    try {
      const form = new FormData();
      form.append("type", mode);

      if (mode === "youtube") {
        setStep("fetching");
        if (ytTranscript.trim()) {
          // User pasted transcript manually — treat as text with youtube context
          form.set("type", "text");
          form.append("text", ytTranscript);
        } else {
          form.append("url", url);
        }
      } else if (mode === "image") {
        if (!image) { setError("Please select an image."); return; }
        form.append("image", image);
        form.append("text", extraText);
      } else {
        form.append("text", text);
      }

      setStep("generating");

      const res = await fetch("/api/dominate/generate", {
        method: "POST",
        headers: { "x-dominate-password": storedPassword },
        body: form,
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.error || `Generation failed (${res.status})`);
        setStep("idle");
        if (mode === "youtube" && !ytTranscript.trim()) {
          setShowYtFallback(true);
        }
        return;
      }

      setStep("social");
      const data = await res.json();

      setResult(data);
      setSocialSections(parseSocial(data.socialContent));
      setStep("done");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Request failed. Try again.");
      setStep("idle");
    }
  };

  const publish = async () => {
    if (!result) return;
    setStep("publishing");
    setError("");

    try {
      const res = await fetch("/api/dominate/publish", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-dominate-password": storedPassword,
        },
        body: JSON.stringify({ slug: result.slug, mdxContent: result.mdxContent }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Publish failed.");
        setStep("done");
        return;
      }

      setPublishedUrl(data.url);
      setStep("published");
    } catch {
      setError("Publish failed. Try again.");
      setStep("done");
    }
  };

  const loading =
    step === "fetching" || step === "generating" || step === "social" || step === "publishing";
  const blogBody = result?.mdxContent.replace(/^---[\s\S]*?---\n/, "").trim() || "";

  return (
    <div>
      {/* Mode selector */}
      <div className="mb-6 flex gap-2">
        {(["youtube", "text", "image"] as Mode[]).map((m) => {
          const icons = { youtube: Youtube, text: FileText, image: ImageIcon };
          const labels = { youtube: "YouTube", text: "Dump", image: "Screenshot" };
          const Icon = icons[m];
          return (
            <button
              key={m}
              onClick={() => { setMode(m); setError(""); }}
              className={`flex items-center gap-2 rounded-md px-3 py-2 text-[13px] font-medium transition-colors ${
                mode === m
                  ? "bg-neutral-800 text-neutral-100"
                  : "text-neutral-500 hover:bg-neutral-900 hover:text-neutral-300"
              }`}
            >
              <Icon size={14} />
              {labels[m]}
            </button>
          );
        })}
      </div>

      {/* Input area */}
      <div className="mb-6 rounded-lg border border-neutral-800 bg-neutral-900/40 p-4">
        {mode === "youtube" && (
          <div className="space-y-3">
            <input
              type="url"
              value={url}
              onChange={(e) => { setUrl(e.target.value); setShowYtFallback(false); setYtTranscript(""); }}
              placeholder="https://youtube.com/watch?v=..."
              className="w-full bg-transparent text-[14px] text-neutral-200 placeholder-neutral-600 outline-none"
            />
            {showYtFallback && (
              <div className="border-t border-neutral-800/60 pt-3 space-y-2">
                <p className="text-[12px] text-amber-400">
                  YouTube blocked auto-fetch. Paste the transcript below instead.
                </p>
                <p className="text-[11px] text-neutral-600">
                  On YouTube: click <span className="text-neutral-400">···</span> → <span className="text-neutral-400">Show transcript</span> → select all → copy
                </p>
                <textarea
                  value={ytTranscript}
                  onChange={(e) => setYtTranscript(e.target.value)}
                  placeholder="Paste transcript here..."
                  rows={6}
                  className="w-full resize-none bg-transparent text-[13px] leading-relaxed text-neutral-200 placeholder-neutral-600 outline-none"
                />
              </div>
            )}
          </div>
        )}
        {mode === "text" && (
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Brain dump it. Member win, observation, half-formed thought, voice note transcript — whatever you've got..."
            rows={6}
            className="w-full resize-none bg-transparent text-[14px] leading-relaxed text-neutral-200 placeholder-neutral-600 outline-none"
          />
        )}
        {mode === "image" && (
          <div className="space-y-3">
            <div
              onClick={() => fileRef.current?.click()}
              className="flex cursor-pointer flex-col items-center justify-center rounded-md border border-dashed border-neutral-700 py-8 transition-colors hover:border-neutral-600"
            >
              {image ? (
                <p className="text-[13px] text-neutral-300">{image.name}</p>
              ) : (
                <>
                  <ImageIcon size={20} className="mb-2 text-neutral-600" />
                  <p className="text-[13px] text-neutral-500">Click to upload screenshot</p>
                </>
              )}
            </div>
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => setImage(e.target.files?.[0] || null)}
            />
            <textarea
              value={extraText}
              onChange={(e) => setExtraText(e.target.value)}
              placeholder="Extra context (optional) — what angle you want, who said it, why it matters..."
              rows={2}
              className="w-full resize-none bg-transparent text-[13px] leading-relaxed text-neutral-400 placeholder-neutral-600 outline-none"
            />
          </div>
        )}
      </div>

      {/* Generate button */}
      <button
        onClick={generate}
        disabled={loading || (mode === "youtube" && !url) || (mode === "text" && !text) || (mode === "image" && !image)}
        className="flex items-center gap-2 rounded-md bg-neutral-100 px-5 py-2.5 text-[13px] font-semibold text-neutral-900 transition-colors hover:bg-white disabled:cursor-not-allowed disabled:opacity-40"
      >
        {loading ? (
          <>
            <Loader2 size={14} className="animate-spin" />
            {STEP_LABELS[step]}
          </>
        ) : (
          "Generate →"
        )}
      </button>

      {/* Error */}
      {error && (
        <div className="mt-4 rounded-md border border-red-900/50 bg-red-950/30 px-4 py-3 text-[13px] text-red-400">
          {error}
        </div>
      )}

      {/* Results */}
      {result && step !== "fetching" && step !== "generating" && (
        <div className="mt-12 space-y-10">
          {/* Blog post */}
          <div>
            <div className="mb-4 flex items-center justify-between">
              <div>
                <p className="text-[11px] font-medium uppercase tracking-wider text-neutral-500">Blog Post</p>
                <h2 className="mt-0.5 font-[family-name:var(--font-geist-sans)] text-lg font-semibold text-neutral-100">
                  {result.title}
                </h2>
                <p className="text-[12px] text-neutral-500">saadbelcaid.me/blog/{result.slug}</p>
              </div>
              <CopyButton text={result.mdxContent} />
            </div>
            <div className="max-h-96 overflow-y-auto rounded-lg border border-neutral-800 bg-neutral-900/40 p-5">
              <pre className="whitespace-pre-wrap font-[family-name:var(--font-geist-mono)] text-[12px] leading-relaxed text-neutral-400">
                {blogBody}
              </pre>
            </div>
          </div>

          {/* Social content */}
          {socialSections.length > 0 && (
            <div>
              <p className="mb-4 text-[11px] font-medium uppercase tracking-wider text-neutral-500">
                Social Content — Week of Posts
              </p>
              <div className="space-y-2">
                {socialSections.map((s, i) => (
                  <SocialCard key={i} section={s} />
                ))}
              </div>
            </div>
          )}

          {/* Publish */}
          {step !== "published" && (
            <div className="border-t border-neutral-800 pt-8">
              <button
                onClick={publish}
                disabled={step === "publishing"}
                className="flex items-center gap-2 rounded-md bg-neutral-100 px-5 py-2.5 text-[13px] font-semibold text-neutral-900 transition-colors hover:bg-white disabled:opacity-40"
              >
                {step === "publishing" ? (
                  <><Loader2 size={14} className="animate-spin" /> Publishing...</>
                ) : (
                  <><Rocket size={14} /> Publish to saadbelcaid.me</>
                )}
              </button>
            </div>
          )}

          {/* Published confirmation */}
          {step === "published" && publishedUrl && (
            <div className="border-t border-neutral-800 pt-8">
              <div className="rounded-lg border border-green-900/50 bg-green-950/20 px-5 py-4">
                <p className="text-[13px] font-medium text-green-400">Live.</p>
                <a
                  href={publishedUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-1 flex items-center gap-1.5 text-[13px] text-neutral-400 transition-colors hover:text-neutral-200"
                >
                  {publishedUrl}
                  <ExternalLink size={12} />
                </a>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function MetricsTab() {
  const STORAGE_KEY = "dominate_metrics";
  const emptyMetrics = (): WeeklyMetrics => ({
    xImpressions: "",
    liImpressions: "",
    blogVisitors: "",
    ssmSignups: "",
  });

  const [metrics, setMetrics] = useState<WeeklyMetrics>(emptyMetrics());
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState<WeeklyMetrics>(emptyMetrics());
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try { setMetrics(JSON.parse(stored)); } catch { /* ignore */ }
    }
  }, []);

  const startEdit = () => {
    setDraft({ ...metrics });
    setEditing(true);
  };

  const saveEdit = () => {
    setMetrics(draft);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(draft));
    setEditing(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const parseVal = (s: string) => {
    const n = parseInt(s.replace(/[^0-9]/g, ""), 10);
    return isNaN(n) ? 0 : n;
  };

  const xVal = parseVal(metrics.xImpressions);
  const liVal = parseVal(metrics.liImpressions);
  const blogVal = parseVal(metrics.blogVisitors);
  const ssmVal = parseVal(metrics.ssmSignups);

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <p className="text-[11px] font-medium uppercase tracking-wider text-neutral-500">This Month</p>
          <p className="mt-0.5 text-[13px] text-neutral-500">Track your numbers vs the goals.</p>
        </div>
        {!editing ? (
          <button
            onClick={startEdit}
            className="rounded-md border border-neutral-800 px-3 py-1.5 text-[12px] text-neutral-400 transition-colors hover:border-neutral-700 hover:text-neutral-200"
          >
            Update numbers
          </button>
        ) : (
          <div className="flex gap-2">
            <button
              onClick={() => setEditing(false)}
              className="rounded-md border border-neutral-800 px-3 py-1.5 text-[12px] text-neutral-500 transition-colors hover:text-neutral-300"
            >
              Cancel
            </button>
            <button
              onClick={saveEdit}
              className="flex items-center gap-1.5 rounded-md bg-neutral-100 px-3 py-1.5 text-[12px] font-semibold text-neutral-900 transition-colors hover:bg-white"
            >
              {saved ? <Check size={12} /> : null}
              {saved ? "Saved" : "Save"}
            </button>
          </div>
        )}
      </div>

      {editing ? (
        <div className="space-y-3">
          {[
            { key: "xImpressions" as keyof WeeklyMetrics, label: "X Impressions", placeholder: "e.g. 42000" },
            { key: "liImpressions" as keyof WeeklyMetrics, label: "LinkedIn Impressions", placeholder: "e.g. 18000" },
            { key: "blogVisitors" as keyof WeeklyMetrics, label: "Blog Visitors", placeholder: "e.g. 2400" },
            { key: "ssmSignups" as keyof WeeklyMetrics, label: "SSM Signups", placeholder: "e.g. 7" },
          ].map(({ key, label, placeholder }) => (
            <div key={key} className="rounded-lg border border-neutral-800 bg-neutral-900/40 px-4 py-3">
              <label className="text-[11px] font-medium uppercase tracking-wider text-neutral-500 block mb-1.5">
                {label}
              </label>
              <input
                type="text"
                value={draft[key]}
                onChange={(e) => setDraft({ ...draft, [key]: e.target.value })}
                placeholder={placeholder}
                className="w-full bg-transparent text-[14px] text-neutral-200 placeholder-neutral-600 outline-none"
              />
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <MetricBar
            label="X / Twitter"
            icon={Twitter}
            color="text-neutral-300"
            value={xVal}
            goal={GOALS.xImpressions}
          />
          <MetricBar
            label="LinkedIn"
            icon={Linkedin}
            color="text-blue-400"
            value={liVal}
            goal={GOALS.liImpressions}
          />
          <MetricBar
            label="Blog visitors"
            icon={Globe}
            color="text-neutral-400"
            value={blogVal}
            goal={GOALS.blogVisitors}
          />
          <MetricBar
            label="SSM Signups"
            icon={Users}
            color="text-neutral-400"
            value={ssmVal}
            goal={GOALS.ssmSignups}
          />
        </div>
      )}

      {/* Goals reference */}
      {!editing && (
        <div className="mt-8 rounded-lg border border-neutral-800/60 px-5 py-4">
          <p className="text-[11px] font-medium uppercase tracking-wider text-neutral-600 mb-3">Monthly Goals</p>
          <div className="grid grid-cols-2 gap-x-8 gap-y-1.5">
            {[
              { label: "X impressions", val: "100K" },
              { label: "LinkedIn impressions", val: "50K" },
              { label: "Blog visitors", val: "5K" },
              { label: "SSM signups", val: "20" },
            ].map(({ label, val }) => (
              <div key={label} className="flex items-center justify-between">
                <span className="text-[12px] text-neutral-600">{label}</span>
                <span className="text-[12px] font-medium text-neutral-500">{val}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function CalendarTab() {
  const STORAGE_KEY = "dominate_calendar";
  const [statuses, setStatuses] = useState<Record<number, WeekStatus>>({});

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try { setStatuses(JSON.parse(stored)); } catch { /* ignore */ }
    }
  }, []);

  const cycleStatus = (week: number) => {
    const current = statuses[week] || "not-started";
    const next: WeekStatus =
      current === "not-started" ? "writing" :
      current === "writing" ? "published" : "not-started";
    const updated = { ...statuses, [week]: next };
    setStatuses(updated);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  };

  const statusStyle: Record<WeekStatus, string> = {
    "not-started": "bg-neutral-800 text-neutral-500",
    "writing": "bg-amber-500/15 text-amber-400",
    "published": "bg-green-500/15 text-green-400",
  };

  const statusLabel: Record<WeekStatus, string> = {
    "not-started": "Not started",
    "writing": "Writing",
    "published": "Live",
  };

  const categoryColor: Record<string, string> = {
    "Market Philosophy": "text-neutral-400",
    "Operator Reality": "text-neutral-400",
    "Platform Evolution": "text-neutral-400",
  };

  const published = CALENDAR_WEEKS.filter((w) => (statuses[w.week] || "not-started") === "published").length;

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <p className="text-[11px] font-medium uppercase tracking-wider text-neutral-500">12-Week Calendar</p>
          <p className="mt-0.5 text-[13px] text-neutral-500">{published} / 12 published. Click status to cycle.</p>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="h-1.5 w-24 rounded-full bg-neutral-800 overflow-hidden">
            <div
              className="h-full rounded-full bg-neutral-400 transition-all"
              style={{ width: `${(published / 12) * 100}%` }}
            />
          </div>
          <span className="text-[11px] text-neutral-600">{Math.round((published / 12) * 100)}%</span>
        </div>
      </div>

      <div className="space-y-0">
        {CALENDAR_WEEKS.map((item) => {
          const status = statuses[item.week] || "not-started";
          return (
            <div
              key={item.week}
              className="group flex items-start gap-5 border-t border-neutral-800/60 py-4 px-1 transition-colors hover:bg-neutral-900/20"
            >
              <span className="mt-0.5 shrink-0 font-[family-name:var(--font-geist-mono)] text-[12px] text-neutral-600 w-6 text-right">
                W{item.week}
              </span>
              <div className="flex-1 min-w-0">
                <p className="text-[14px] font-medium text-neutral-200 leading-snug">{item.title}</p>
                <p className="mt-0.5 text-[12px] text-neutral-600 truncate">{item.theme}</p>
                <p className={`mt-0.5 text-[11px] uppercase tracking-wider font-medium ${categoryColor[item.category]}`}>
                  {item.category}
                </p>
              </div>
              <button
                onClick={() => cycleStatus(item.week)}
                className={`shrink-0 rounded-md px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide transition-colors ${statusStyle[status]}`}
              >
                {statusLabel[status]}
              </button>
            </div>
          );
        })}
        <div className="border-t border-neutral-800/60" />
      </div>
    </div>
  );
}

function AutoPostTab({ storedPassword }: { storedPassword: string }) {
  const [content, setContent] = useState("");
  const [scheduleMode, setScheduleMode] = useState<"next-free-slot" | "now">("next-free-slot");
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");
  const [sentUrl, setSentUrl] = useState("");

  const charCount = content.length;
  const isThread = content.includes("\n---\n");
  const isOver = !isThread && charCount > 280;

  const send = async () => {
    if (!content.trim()) return;
    setSending(true);
    setError("");
    setSent(false);
    setSentUrl("");

    try {
      const res = await fetch("/api/dominate/autopost", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-dominate-password": storedPassword,
        },
        body: JSON.stringify({ content, scheduleMode }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Failed to send to Typefully.");
        setSending(false);
        return;
      }

      setSent(true);
      if (data.share_url) setSentUrl(data.share_url);
      setContent("");
    } catch {
      setError("Request failed. Try again.");
    } finally {
      setSending(false);
    }
  };

  return (
    <div>
      <div className="mb-6">
        <p className="text-[11px] font-medium uppercase tracking-wider text-neutral-500">Auto-Post</p>
        <p className="mt-0.5 text-[13px] text-neutral-500">
          Compose and send directly to X via Typefully. Use <code className="rounded bg-neutral-800 px-1 text-neutral-300">---</code> on its own line to split into a thread.
        </p>
      </div>

      {/* Compose */}
      <div className="rounded-lg border border-neutral-800 bg-neutral-900/40 p-4 mb-4">
        <textarea
          value={content}
          onChange={(e) => { setContent(e.target.value); setSent(false); setError(""); }}
          placeholder={`What are you saying?\n\nFor a thread, separate tweets with a line containing only ---\n\nTweet 1...\n---\nTweet 2...\n---\nTweet 3...`}
          rows={10}
          className="w-full resize-none bg-transparent text-[14px] leading-relaxed text-neutral-200 placeholder-neutral-600 outline-none"
        />
        <div className="mt-2 flex items-center justify-between border-t border-neutral-800/60 pt-2">
          <span className="text-[11px] text-neutral-600 font-[family-name:var(--font-geist-mono)]">
            {isThread ? `Thread mode` : `${charCount} / 280`}
          </span>
          {isOver && !isThread && (
            <span className="text-[11px] text-amber-400">Too long — add --- to split into thread</span>
          )}
        </div>
      </div>

      {/* Schedule mode */}
      <div className="mb-5 flex gap-2">
        {(["next-free-slot", "now"] as const).map((m) => (
          <button
            key={m}
            onClick={() => setScheduleMode(m)}
            className={`rounded-md px-3 py-1.5 text-[12px] font-medium transition-colors ${
              scheduleMode === m
                ? "bg-neutral-800 text-neutral-100"
                : "text-neutral-500 hover:bg-neutral-900 hover:text-neutral-300"
            }`}
          >
            {m === "next-free-slot" ? "Schedule (next slot)" : "Send now"}
          </button>
        ))}
      </div>

      {/* Send button */}
      <button
        onClick={send}
        disabled={sending || !content.trim() || isOver}
        className="flex items-center gap-2 rounded-md bg-neutral-100 px-5 py-2.5 text-[13px] font-semibold text-neutral-900 transition-colors hover:bg-white disabled:cursor-not-allowed disabled:opacity-40"
      >
        {sending ? (
          <><Loader2 size={14} className="animate-spin" /> Sending to Typefully...</>
        ) : (
          <><Send size={14} /> {scheduleMode === "now" ? "Post now" : "Add to queue"}</>
        )}
      </button>

      {/* Error */}
      {error && (
        <div className="mt-4 rounded-md border border-red-900/50 bg-red-950/30 px-4 py-3 text-[13px] text-red-400">
          {error}
        </div>
      )}

      {/* Success */}
      {sent && (
        <div className="mt-4 rounded-lg border border-green-900/50 bg-green-950/20 px-5 py-4">
          <p className="text-[13px] font-medium text-green-400">
            {scheduleMode === "now" ? "Posted." : "Added to Typefully queue."}
          </p>
          {sentUrl && (
            <a
              href={sentUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-1 flex items-center gap-1.5 text-[12px] text-neutral-400 transition-colors hover:text-neutral-200"
            >
              View in Typefully <ExternalLink size={11} />
            </a>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Signals Tab ──────────────────────────────────────────────────────────────

interface Signal {
  pain: string;
  frequency: string;
  emotion: string;
  sources: string[];
  curiosity_gap: number;
  pain_intensity: number;
  audience_size: number;
  authority_match: number;
  total: number;
  titles: string[];
  hook_suggestion: string;
}

interface GeneratedScript {
  titles: string[];
  thumbnails: string[];
  script: {
    hook: string;
    setup: string;
    insight: string;
    framework: string;
    proof: string;
    cta: string;
  };
  broll: string[];
  estimated_length: string;
  hook_type: string;
}

interface Clip {
  clip_number: number;
  start_time: string;
  end_time: string;
  duration_seconds: number;
  transcript_excerpt: string;
  hook_line: string;
  category: string;
  x_post: string;
  linkedin_post: string;
  shorts_description: string;
  virality_score: number;
}

const DEFAULT_SUBREDDITS = [
  "Entrepreneur",
  "SaaS",
  "coldoutreach",
  "digital_marketing",
  "agency",
];

const DEFAULT_KEYWORDS = [
  "agency stuck",
  "cold email not working",
  "can't get clients",
  "outbound dying",
  "AI agency",
  "freelancing plateau",
  "lead generation difficult",
  "business model stuck",
];

function SignalsTab({ storedPassword }: { storedPassword: string }) {
  const [mining, setMining] = useState(false);
  const [signals, setSignals] = useState<Signal[]>([]);
  const [rawCount, setRawCount] = useState(0);
  const [sources, setSources] = useState<{ reddit: number; youtube: number }>({ reddit: 0, youtube: 0 });
  const [error, setError] = useState("");
  const [expandedIdx, setExpandedIdx] = useState<number | null>(null);
  const [copiedTitle, setCopiedTitle] = useState("");
  const [minedAt, setMinedAt] = useState("");

  // Script generation state
  const [generatingScript, setGeneratingScript] = useState<number | null>(null);
  const [generatedScripts, setGeneratedScripts] = useState<Record<number, GeneratedScript>>({});
  const [scriptError, setScriptError] = useState("");
  const [activeScriptSection, setActiveScriptSection] = useState<string>("hook");

  // Config
  const [showConfig, setShowConfig] = useState(false);
  const [subreddits, setSubreddits] = useState(DEFAULT_SUBREDDITS.join(", "));
  const [keywords, setKeywords] = useState(DEFAULT_KEYWORDS.join(", "));
  const [ytChannelIds, setYtChannelIds] = useState("");

  const mine = async () => {
    setMining(true);
    setError("");
    setSignals([]);

    try {
      const res = await fetch("/api/dominate/signals", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-dominate-password": storedPassword,
        },
        body: JSON.stringify({
          subreddits: subreddits.split(",").map((s) => s.trim()).filter(Boolean),
          keywords: keywords.split(",").map((s) => s.trim()).filter(Boolean),
          youtubeChannelIds: ytChannelIds.split(",").map((s) => s.trim()).filter(Boolean),
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Mining failed.");
        setMining(false);
        return;
      }

      if (data.error && data.signals?.length === 0) {
        setError(data.error);
      }

      setSignals(data.signals ?? []);
      setRawCount(data.raw_count ?? 0);
      setSources(data.sources ?? { reddit: 0, youtube: 0 });
      setMinedAt(data.mined_at ?? "");
    } catch {
      setError("Request failed. Try again.");
    } finally {
      setMining(false);
    }
  };

  const copyTitle = (title: string) => {
    navigator.clipboard.writeText(title);
    setCopiedTitle(title);
    setTimeout(() => setCopiedTitle(""), 2000);
  };

  const generateScript = async (idx: number) => {
    const signal = signals[idx];
    if (!signal) return;
    setGeneratingScript(idx);
    setScriptError("");

    try {
      const res = await fetch("/api/dominate/script", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-dominate-password": storedPassword,
        },
        body: JSON.stringify({
          pain: signal.pain,
          selectedTitle: signal.titles[0] ?? "",
          emotion: signal.emotion,
          hook_suggestion: signal.hook_suggestion,
        }),
      });

      const data = await res.json();
      if (!res.ok || data.error) {
        setScriptError(data.error || "Script generation failed.");
        setGeneratingScript(null);
        return;
      }

      setGeneratedScripts((prev) => ({ ...prev, [idx]: data }));
      setActiveScriptSection("hook");
    } catch {
      setScriptError("Request failed. Try again.");
    } finally {
      setGeneratingScript(null);
    }
  };

  const emotionIcon = (emotion: string) => {
    switch (emotion) {
      case "frustration": return <Flame size={12} className="text-red-400" />;
      case "anxiety": return <AlertTriangle size={12} className="text-amber-400" />;
      case "confusion": return <Target size={12} className="text-blue-400" />;
      case "curiosity": return <Sparkles size={12} className="text-purple-400" />;
      default: return <Zap size={12} className="text-neutral-400" />;
    }
  };

  const scoreColor = (total: number) => {
    if (total >= 32) return "text-green-400 bg-green-500/10";
    if (total >= 28) return "text-amber-400 bg-amber-500/10";
    return "text-neutral-400 bg-neutral-800";
  };

  return (
    <div>
      <div className="mb-6">
        <p className="text-[11px] font-medium uppercase tracking-wider text-neutral-500">Signal Miner</p>
        <p className="mt-0.5 text-[13px] text-neutral-500">
          Mine Reddit + YouTube for audience pain signals. Get scored video ideas with ready-to-use titles.
        </p>
      </div>

      {/* Config toggle */}
      <button
        onClick={() => setShowConfig(!showConfig)}
        className="mb-4 flex items-center gap-1.5 text-[12px] text-neutral-500 hover:text-neutral-300 transition-colors"
      >
        {showConfig ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
        Configure sources
      </button>

      {showConfig && (
        <div className="mb-6 space-y-3 rounded-lg border border-neutral-800 bg-neutral-900/40 p-4">
          <div>
            <label className="text-[11px] font-medium uppercase tracking-wider text-neutral-500 block mb-1.5">
              Subreddits (comma-separated)
            </label>
            <input
              type="text"
              value={subreddits}
              onChange={(e) => setSubreddits(e.target.value)}
              className="w-full bg-transparent text-[13px] text-neutral-200 placeholder-neutral-600 outline-none"
            />
          </div>
          <div>
            <label className="text-[11px] font-medium uppercase tracking-wider text-neutral-500 block mb-1.5">
              Search keywords (comma-separated)
            </label>
            <input
              type="text"
              value={keywords}
              onChange={(e) => setKeywords(e.target.value)}
              className="w-full bg-transparent text-[13px] text-neutral-200 placeholder-neutral-600 outline-none"
            />
          </div>
          <div>
            <label className="text-[11px] font-medium uppercase tracking-wider text-neutral-500 block mb-1.5">
              YouTube Channels (optional, comma-separated)
            </label>
            <input
              type="text"
              value={ytChannelIds}
              onChange={(e) => setYtChannelIds(e.target.value)}
              placeholder="@SaadBelcaid, https://youtube.com/@AlexHormozi, UCxxxxxxxx"
              className="w-full bg-transparent text-[13px] text-neutral-200 placeholder-neutral-600 outline-none"
            />
            <p className="mt-1 text-[11px] text-neutral-600">
              Paste URLs, @handles, or channel IDs. Leave empty to mine Reddit only.
            </p>
          </div>
        </div>
      )}

      {/* Mine button */}
      <button
        onClick={mine}
        disabled={mining}
        className="flex items-center gap-2 rounded-md bg-neutral-100 px-5 py-2.5 text-[13px] font-semibold text-neutral-900 transition-colors hover:bg-white disabled:cursor-not-allowed disabled:opacity-40"
      >
        {mining ? (
          <>
            <Loader2 size={14} className="animate-spin" />
            Mining signals...
          </>
        ) : (
          <>
            <Radar size={14} />
            Mine Signals
          </>
        )}
      </button>

      {/* Error */}
      {error && (
        <div className="mt-4 rounded-md border border-red-900/50 bg-red-950/30 px-4 py-3 text-[13px] text-red-400">
          {error}
        </div>
      )}

      {/* Results */}
      {signals.length > 0 && (
        <div className="mt-8 space-y-6">
          {/* Stats bar */}
          <div className="flex items-center gap-6 text-[12px] text-neutral-500">
            <span>{rawCount} raw signals mined</span>
            <span>Reddit: {sources.reddit}</span>
            <span>YouTube: {sources.youtube}</span>
            {minedAt && (
              <span className="ml-auto text-[11px] text-neutral-600">
                {new Date(minedAt).toLocaleString()}
              </span>
            )}
          </div>

          {/* Signal cards */}
          <div className="space-y-3">
            {signals.map((signal, idx) => (
              <div
                key={idx}
                className="rounded-lg border border-neutral-800 bg-neutral-900/40 overflow-hidden"
              >
                {/* Signal header */}
                <button
                  onClick={() => setExpandedIdx(expandedIdx === idx ? null : idx)}
                  className="flex w-full items-start justify-between px-4 py-4 text-left"
                >
                  <div className="flex-1 min-w-0 pr-4">
                    <div className="flex items-center gap-2 mb-1.5">
                      <span className={`rounded px-1.5 py-0.5 text-[11px] font-bold font-[family-name:var(--font-geist-mono)] ${scoreColor(signal.total)}`}>
                        {signal.total}
                      </span>
                      {emotionIcon(signal.emotion)}
                      <span className="text-[11px] text-neutral-500 uppercase tracking-wider">
                        {signal.emotion}
                      </span>
                      <span className={`text-[10px] px-1.5 py-0.5 rounded uppercase tracking-wider font-medium ${
                        signal.frequency === "high"
                          ? "bg-red-500/10 text-red-400"
                          : signal.frequency === "medium"
                          ? "bg-amber-500/10 text-amber-400"
                          : "bg-neutral-800 text-neutral-500"
                      }`}>
                        {signal.frequency}
                      </span>
                    </div>
                    <p className="text-[14px] font-medium text-neutral-200 leading-snug">
                      {signal.pain}
                    </p>
                  </div>
                  <div className="shrink-0 mt-1">
                    {expandedIdx === idx ? (
                      <ChevronUp size={14} className="text-neutral-500" />
                    ) : (
                      <ChevronDown size={14} className="text-neutral-500" />
                    )}
                  </div>
                </button>

                {/* Expanded content */}
                {expandedIdx === idx && (
                  <div className="border-t border-neutral-800 px-4 pb-5 pt-4 space-y-5">
                    {/* Scores breakdown */}
                    <div className="grid grid-cols-4 gap-3">
                      {[
                        { label: "Curiosity", val: signal.curiosity_gap },
                        { label: "Pain", val: signal.pain_intensity },
                        { label: "Audience", val: signal.audience_size },
                        { label: "Authority", val: signal.authority_match },
                      ].map(({ label, val }) => (
                        <div key={label} className="text-center">
                          <div className="text-[18px] font-semibold text-neutral-200 font-[family-name:var(--font-geist-mono)]">
                            {val}
                          </div>
                          <div className="text-[10px] uppercase tracking-wider text-neutral-500 mt-0.5">
                            {label}
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Title suggestions */}
                    {signal.titles.length > 0 && (
                      <div>
                        <p className="text-[11px] font-medium uppercase tracking-wider text-neutral-500 mb-2">
                          Title Suggestions
                        </p>
                        <div className="space-y-1.5">
                          {signal.titles.map((title, tIdx) => (
                            <div
                              key={tIdx}
                              className="group flex items-center justify-between rounded-md border border-neutral-800/60 px-3 py-2.5 hover:border-neutral-700 transition-colors"
                            >
                              <span className="text-[13px] text-neutral-300">{title}</span>
                              <button
                                onClick={(e) => { e.stopPropagation(); copyTitle(title); }}
                                className="shrink-0 ml-3 flex items-center gap-1 rounded px-2 py-0.5 text-[11px] text-neutral-500 hover:bg-neutral-800 hover:text-neutral-300 transition-colors"
                              >
                                {copiedTitle === title ? (
                                  <><Check size={10} className="text-green-400" /> Copied</>
                                ) : (
                                  <><Copy size={10} /> Copy</>
                                )}
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Hook suggestion */}
                    {signal.hook_suggestion && (
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <p className="text-[11px] font-medium uppercase tracking-wider text-neutral-500">
                            Hook (First 15 Seconds)
                          </p>
                          <CopyButton text={signal.hook_suggestion} />
                        </div>
                        <div className="rounded-md border border-neutral-800/60 bg-neutral-950/50 px-4 py-3">
                          <pre className="whitespace-pre-wrap font-[family-name:var(--font-geist-mono)] text-[12px] leading-relaxed text-neutral-400">
                            {signal.hook_suggestion}
                          </pre>
                        </div>
                      </div>
                    )}

                    {/* Sources */}
                    <div className="flex items-center gap-2 flex-wrap">
                      {signal.sources.map((src, sIdx) => (
                        <span
                          key={sIdx}
                          className="rounded bg-neutral-800 px-2 py-0.5 text-[10px] font-medium text-neutral-500 uppercase tracking-wider"
                        >
                          {src}
                        </span>
                      ))}
                    </div>

                    {/* Generate Script Button */}
                    <div className="border-t border-neutral-800/60 pt-4">
                      {!generatedScripts[idx] ? (
                        <button
                          onClick={(e) => { e.stopPropagation(); generateScript(idx); }}
                          disabled={generatingScript === idx}
                          className="flex items-center gap-2 rounded-md bg-neutral-100 px-4 py-2 text-[13px] font-semibold text-neutral-900 transition-colors hover:bg-white disabled:opacity-40"
                        >
                          {generatingScript === idx ? (
                            <><Loader2 size={14} className="animate-spin" /> Generating script...</>
                          ) : (
                            <><Clapperboard size={14} /> Generate Full Script</>
                          )}
                        </button>
                      ) : (
                        <div className="space-y-4">
                          <p className="text-[11px] font-medium uppercase tracking-wider text-green-400">
                            Script Generated — {generatedScripts[idx].estimated_length} • {generatedScripts[idx].hook_type} hook
                          </p>

                          {/* Extra title variants */}
                          <div>
                            <p className="text-[11px] font-medium uppercase tracking-wider text-neutral-500 mb-2">
                              15 Title Variants
                            </p>
                            <div className="space-y-1 max-h-48 overflow-y-auto">
                              {generatedScripts[idx].titles.map((t, tIdx) => (
                                <div key={tIdx} className="group flex items-center justify-between rounded-md border border-neutral-800/60 px-3 py-2 hover:border-neutral-700 transition-colors">
                                  <span className="text-[12px] text-neutral-300">{t}</span>
                                  <button
                                    onClick={(e) => { e.stopPropagation(); copyTitle(t); }}
                                    className="shrink-0 ml-2 flex items-center gap-1 rounded px-2 py-0.5 text-[10px] text-neutral-500 hover:bg-neutral-800 hover:text-neutral-300"
                                  >
                                    {copiedTitle === t ? <><Check size={10} className="text-green-400" /> Copied</> : <><Copy size={10} /> Copy</>}
                                  </button>
                                </div>
                              ))}
                            </div>
                          </div>

                          {/* Thumbnail text options */}
                          <div>
                            <p className="text-[11px] font-medium uppercase tracking-wider text-neutral-500 mb-2">
                              Thumbnail Text
                            </p>
                            <div className="flex gap-2">
                              {generatedScripts[idx].thumbnails.map((thumb, tIdx) => (
                                <div key={tIdx} className="rounded-md border border-neutral-700 bg-neutral-950 px-3 py-2 text-[13px] font-bold text-neutral-100 uppercase tracking-wide">
                                  {thumb}
                                </div>
                              ))}
                            </div>
                          </div>

                          {/* Script sections */}
                          <div>
                            <p className="text-[11px] font-medium uppercase tracking-wider text-neutral-500 mb-2">
                              Full Script
                            </p>
                            <div className="flex gap-1 mb-3 flex-wrap">
                              {(["hook", "setup", "insight", "framework", "proof", "cta"] as const).map((section) => (
                                <button
                                  key={section}
                                  onClick={(e) => { e.stopPropagation(); setActiveScriptSection(section); }}
                                  className={`rounded-md px-2.5 py-1 text-[11px] font-medium uppercase tracking-wider transition-colors ${
                                    activeScriptSection === section
                                      ? "bg-neutral-700 text-neutral-100"
                                      : "text-neutral-500 hover:bg-neutral-800 hover:text-neutral-300"
                                  }`}
                                >
                                  {section}
                                </button>
                              ))}
                            </div>
                            <div className="rounded-md border border-neutral-800/60 bg-neutral-950/50 px-4 py-3">
                              <div className="flex justify-end mb-2">
                                <CopyButton text={generatedScripts[idx].script[activeScriptSection as keyof typeof generatedScripts[typeof idx]["script"]] ?? ""} />
                              </div>
                              <pre className="whitespace-pre-wrap font-[family-name:var(--font-geist-mono)] text-[12px] leading-relaxed text-neutral-400">
                                {generatedScripts[idx].script[activeScriptSection as keyof typeof generatedScripts[typeof idx]["script"]] ?? ""}
                              </pre>
                            </div>
                          </div>

                          {/* B-roll suggestions */}
                          {generatedScripts[idx].broll.length > 0 && (
                            <div>
                              <p className="text-[11px] font-medium uppercase tracking-wider text-neutral-500 mb-2">
                                B-Roll Suggestions
                              </p>
                              <div className="space-y-1">
                                {generatedScripts[idx].broll.map((br, bIdx) => (
                                  <div key={bIdx} className="flex items-start gap-2 text-[12px] text-neutral-400">
                                    <Film size={11} className="mt-0.5 shrink-0 text-neutral-600" />
                                    {br}
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      )}

                      {scriptError && expandedIdx === idx && (
                        <div className="mt-3 rounded-md border border-red-900/50 bg-red-950/30 px-3 py-2 text-[12px] text-red-400">
                          {scriptError}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Clips Tab ────────────────────────────────────────────────────────────────

function ClipsTab({ storedPassword }: { storedPassword: string }) {
  const [youtubeUrl, setYoutubeUrl] = useState("");
  const [manualTranscript, setManualTranscript] = useState("");
  const [showManual, setShowManual] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [error, setError] = useState("");
  const [videoTitle, setVideoTitle] = useState("");
  const [totalDuration, setTotalDuration] = useState("");
  const [clips, setClips] = useState<Clip[]>([]);
  const [expandedClip, setExpandedClip] = useState<number | null>(null);
  const [copiedText, setCopiedText] = useState("");
  const [postingClip, setPostingClip] = useState<string | null>(null);
  const [postedClips, setPostedClips] = useState<Record<string, string>>({});

  const copyText = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedText(text);
    setTimeout(() => setCopiedText(""), 2000);
  };

  const postToTypefully = async (content: string, platform: "x" | "linkedin", clipKey: string) => {
    setPostingClip(clipKey);
    try {
      const res = await fetch("/api/dominate/autopost", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-dominate-password": storedPassword,
        },
        body: JSON.stringify({ content, scheduleMode: "next-free-slot", platform }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Failed to post.");
        setPostingClip(null);
        return;
      }
      setPostedClips((prev) => ({ ...prev, [clipKey]: platform }));
    } catch {
      setError("Post failed. Try again.");
    } finally {
      setPostingClip(null);
    }
  };

  const analyze = async () => {
    setAnalyzing(true);
    setError("");
    setClips([]);
    setVideoTitle("");
    setTotalDuration("");

    try {
      const res = await fetch("/api/dominate/clips", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-dominate-password": storedPassword,
        },
        body: JSON.stringify({
          youtubeUrl: youtubeUrl || undefined,
          transcript: manualTranscript || undefined,
        }),
      });

      const data = await res.json();

      if (data.needs_manual_transcript) {
        setShowManual(true);
        setError(data.error);
        setAnalyzing(false);
        return;
      }

      if (!res.ok || data.error) {
        setError(data.error || "Analysis failed.");
        setAnalyzing(false);
        return;
      }

      setVideoTitle(data.video_title ?? "");
      setTotalDuration(data.total_duration ?? "");
      setClips(data.clips ?? []);
    } catch {
      setError("Request failed. Try again.");
    } finally {
      setAnalyzing(false);
    }
  };

  const categoryColor = (cat: string) => {
    switch (cat) {
      case "contrarian": return "bg-red-500/10 text-red-400";
      case "proof": return "bg-green-500/10 text-green-400";
      case "framework": return "bg-blue-500/10 text-blue-400";
      case "story": return "bg-purple-500/10 text-purple-400";
      case "golden-nugget": return "bg-amber-500/10 text-amber-400";
      case "quote": return "bg-neutral-700 text-neutral-300";
      default: return "bg-neutral-800 text-neutral-400";
    }
  };

  return (
    <div>
      <div className="mb-6">
        <p className="text-[11px] font-medium uppercase tracking-wider text-neutral-500">Clip + Distribution</p>
        <p className="mt-0.5 text-[13px] text-neutral-500">
          Paste a video URL or transcript. Get 5-8 clip-worthy segments with ready-to-post social copy.
        </p>
      </div>

      {/* Input */}
      <div className="mb-4 rounded-lg border border-neutral-800 bg-neutral-900/40 p-4 space-y-3">
        <input
          type="url"
          value={youtubeUrl}
          onChange={(e) => { setYoutubeUrl(e.target.value); setShowManual(false); }}
          placeholder="https://youtube.com/watch?v=..."
          className="w-full bg-transparent text-[14px] text-neutral-200 placeholder-neutral-600 outline-none"
        />

        <button
          onClick={() => setShowManual(!showManual)}
          className="flex items-center gap-1.5 text-[12px] text-neutral-500 hover:text-neutral-300 transition-colors"
        >
          {showManual ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
          {showManual ? "Hide transcript input" : "Paste transcript manually"}
        </button>

        {showManual && (
          <div className="space-y-2">
            <p className="text-[11px] text-neutral-600">
              On YouTube: click <span className="text-neutral-400">...</span> → <span className="text-neutral-400">Show transcript</span> → select all → copy
            </p>
            <textarea
              value={manualTranscript}
              onChange={(e) => setManualTranscript(e.target.value)}
              placeholder="Paste full video transcript here..."
              rows={8}
              className="w-full resize-none bg-transparent text-[13px] leading-relaxed text-neutral-200 placeholder-neutral-600 outline-none"
            />
          </div>
        )}
      </div>

      {/* Analyze button */}
      <button
        onClick={analyze}
        disabled={analyzing || (!youtubeUrl && !manualTranscript)}
        className="flex items-center gap-2 rounded-md bg-neutral-100 px-5 py-2.5 text-[13px] font-semibold text-neutral-900 transition-colors hover:bg-white disabled:cursor-not-allowed disabled:opacity-40"
      >
        {analyzing ? (
          <><Loader2 size={14} className="animate-spin" /> Analyzing video...</>
        ) : (
          <><Scissors size={14} /> Find Clips</>
        )}
      </button>

      {/* Error */}
      {error && (
        <div className="mt-4 rounded-md border border-red-900/50 bg-red-950/30 px-4 py-3 text-[13px] text-red-400">
          {error}
        </div>
      )}

      {/* Results */}
      {clips.length > 0 && (
        <div className="mt-8 space-y-6">
          {/* Video info */}
          <div className="flex items-center gap-6 text-[12px] text-neutral-500">
            {videoTitle && <span className="text-neutral-300 font-medium">{videoTitle}</span>}
            {totalDuration && <span>{totalDuration}</span>}
            <span>{clips.length} clips found</span>
          </div>

          {/* Clip cards */}
          <div className="space-y-3">
            {clips.map((clip) => (
              <div
                key={clip.clip_number}
                className="rounded-lg border border-neutral-800 bg-neutral-900/40 overflow-hidden"
              >
                <button
                  onClick={() => setExpandedClip(expandedClip === clip.clip_number ? null : clip.clip_number)}
                  className="flex w-full items-start justify-between px-4 py-4 text-left"
                >
                  <div className="flex-1 min-w-0 pr-4">
                    <div className="flex items-center gap-2 mb-1.5">
                      <span className="rounded px-1.5 py-0.5 text-[11px] font-bold font-[family-name:var(--font-geist-mono)] bg-neutral-700 text-neutral-200">
                        #{clip.clip_number}
                      </span>
                      <span className={`rounded px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wider ${categoryColor(clip.category)}`}>
                        {clip.category}
                      </span>
                      <span className="text-[11px] text-neutral-500 font-[family-name:var(--font-geist-mono)]">
                        {clip.start_time} → {clip.end_time}
                      </span>
                      <span className="text-[11px] text-neutral-600">
                        {clip.duration_seconds}s
                      </span>
                      <span className={`ml-auto rounded px-1.5 py-0.5 text-[11px] font-bold font-[family-name:var(--font-geist-mono)] ${
                        clip.virality_score >= 8 ? "bg-green-500/10 text-green-400" :
                        clip.virality_score >= 6 ? "bg-amber-500/10 text-amber-400" :
                        "bg-neutral-800 text-neutral-400"
                      }`}>
                        {clip.virality_score}/10
                      </span>
                    </div>
                    <p className="text-[14px] font-medium text-neutral-200 leading-snug">
                      {clip.hook_line}
                    </p>
                  </div>
                  <div className="shrink-0 mt-1">
                    {expandedClip === clip.clip_number ? (
                      <ChevronUp size={14} className="text-neutral-500" />
                    ) : (
                      <ChevronDown size={14} className="text-neutral-500" />
                    )}
                  </div>
                </button>

                {expandedClip === clip.clip_number && (
                  <div className="border-t border-neutral-800 px-4 pb-5 pt-4 space-y-5">
                    {/* Transcript excerpt */}
                    <div>
                      <p className="text-[11px] font-medium uppercase tracking-wider text-neutral-500 mb-2">
                        Transcript
                      </p>
                      <div className="rounded-md border border-neutral-800/60 bg-neutral-950/50 px-4 py-3">
                        <pre className="whitespace-pre-wrap font-[family-name:var(--font-geist-mono)] text-[12px] leading-relaxed text-neutral-400">
                          {clip.transcript_excerpt}
                        </pre>
                      </div>
                    </div>

                    {/* X/Twitter post */}
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <Twitter size={12} className="text-neutral-400" />
                          <p className="text-[11px] font-medium uppercase tracking-wider text-neutral-500">
                            X / Twitter
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={(e) => { e.stopPropagation(); copyText(clip.x_post); }}
                            className="flex items-center gap-1 rounded px-2 py-0.5 text-[10px] text-neutral-500 hover:bg-neutral-800 hover:text-neutral-300"
                          >
                            {copiedText === clip.x_post ? <><Check size={10} className="text-green-400" /> Copied</> : <><Copy size={10} /> Copy</>}
                          </button>
                          {postedClips[`${clip.clip_number}-x`] ? (
                            <span className="flex items-center gap-1 text-[10px] text-green-400"><Check size={10} /> Queued</span>
                          ) : (
                            <button
                              onClick={(e) => { e.stopPropagation(); postToTypefully(clip.x_post, "x", `${clip.clip_number}-x`); }}
                              disabled={postingClip === `${clip.clip_number}-x`}
                              className="flex items-center gap-1 rounded bg-neutral-800 px-2 py-0.5 text-[10px] font-medium text-neutral-300 hover:bg-neutral-700 disabled:opacity-40 transition-colors"
                            >
                              {postingClip === `${clip.clip_number}-x` ? <Loader2 size={10} className="animate-spin" /> : <Send size={10} />}
                              Queue to X
                            </button>
                          )}
                        </div>
                      </div>
                      <div className="rounded-md border border-neutral-800/60 px-3 py-2.5">
                        <p className="text-[13px] text-neutral-300">{clip.x_post}</p>
                      </div>
                    </div>

                    {/* LinkedIn post */}
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <Linkedin size={12} className="text-blue-400" />
                          <p className="text-[11px] font-medium uppercase tracking-wider text-neutral-500">
                            LinkedIn
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={(e) => { e.stopPropagation(); copyText(clip.linkedin_post); }}
                            className="flex items-center gap-1 rounded px-2 py-0.5 text-[10px] text-neutral-500 hover:bg-neutral-800 hover:text-neutral-300"
                          >
                            {copiedText === clip.linkedin_post ? <><Check size={10} className="text-green-400" /> Copied</> : <><Copy size={10} /> Copy</>}
                          </button>
                          {postedClips[`${clip.clip_number}-li`] ? (
                            <span className="flex items-center gap-1 text-[10px] text-green-400"><Check size={10} /> Queued</span>
                          ) : (
                            <button
                              onClick={(e) => { e.stopPropagation(); postToTypefully(clip.linkedin_post, "linkedin", `${clip.clip_number}-li`); }}
                              disabled={postingClip === `${clip.clip_number}-li`}
                              className="flex items-center gap-1 rounded bg-blue-900/30 px-2 py-0.5 text-[10px] font-medium text-blue-300 hover:bg-blue-900/50 disabled:opacity-40 transition-colors"
                            >
                              {postingClip === `${clip.clip_number}-li` ? <Loader2 size={10} className="animate-spin" /> : <Send size={10} />}
                              Queue to LinkedIn
                            </button>
                          )}
                        </div>
                      </div>
                      <div className="rounded-md border border-neutral-800/60 px-3 py-2.5">
                        <pre className="whitespace-pre-wrap text-[12px] leading-relaxed text-neutral-400">
                          {clip.linkedin_post}
                        </pre>
                      </div>
                    </div>

                    {/* Shorts description */}
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <Play size={12} className="text-red-400" />
                          <p className="text-[11px] font-medium uppercase tracking-wider text-neutral-500">
                            YouTube Shorts
                          </p>
                        </div>
                        <button
                          onClick={(e) => { e.stopPropagation(); copyText(clip.shorts_description); }}
                          className="flex items-center gap-1 rounded px-2 py-0.5 text-[10px] text-neutral-500 hover:bg-neutral-800 hover:text-neutral-300"
                        >
                          {copiedText === clip.shorts_description ? <><Check size={10} className="text-green-400" /> Copied</> : <><Copy size={10} /> Copy</>}
                        </button>
                      </div>
                      <div className="rounded-md border border-neutral-800/60 px-3 py-2.5">
                        <p className="text-[12px] text-neutral-400">{clip.shorts_description}</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function DominatePage() {
  const [authed, setAuthed] = useState(false);
  const [password, setPassword] = useState("");
  const [passwordError, setPasswordError] = useState(false);
  const [storedPassword, setStoredPassword] = useState("");
  const [activeTab, setActiveTab] = useState<Tab>("signals");

  useEffect(() => {
    const saved = sessionStorage.getItem("dominate_pw");
    if (saved) { setStoredPassword(saved); setAuthed(true); }
  }, []);

  const handleAuth = (e: React.FormEvent) => {
    e.preventDefault();
    setStoredPassword(password);
    sessionStorage.setItem("dominate_pw", password);
    setAuthed(true);
    setPasswordError(false);
  };

  // Password gate
  if (!authed) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="w-full max-w-sm">
          <h1 className="mb-1 font-[family-name:var(--font-geist-sans)] text-xl font-semibold tracking-tight text-neutral-100">
            Dominate
          </h1>
          <p className="mb-8 text-[13px] text-neutral-500">Your content machine. Operators only.</p>
          <form onSubmit={handleAuth} className="space-y-3">
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Password"
              autoFocus
              className="w-full rounded-md border border-neutral-800 bg-neutral-950 px-3 py-2.5 text-[13px] text-neutral-200 placeholder-neutral-600 outline-none transition-colors focus:border-neutral-600"
            />
            {passwordError && <p className="text-[12px] text-red-400">Wrong password.</p>}
            <button
              type="submit"
              className="w-full rounded-md bg-neutral-100 py-2.5 text-[13px] font-semibold text-neutral-900 transition-colors hover:bg-white"
            >
              Enter
            </button>
          </form>
        </div>
      </div>
    );
  }

  const tabs: { id: Tab; label: string; icon: React.ComponentType<{ size?: number; className?: string }> }[] = [
    { id: "signals", label: "Signals", icon: Radar },
    { id: "clips", label: "Clips", icon: Scissors },
    { id: "generate", label: "Generate", icon: Rocket },
    { id: "metrics", label: "Metrics", icon: TrendingUp },
    { id: "calendar", label: "Calendar", icon: Calendar },
    { id: "autopost", label: "Auto-Post", icon: Send },
  ];

  return (
    <div>
      {/* Header */}
      <div className="mb-8">
        <p className="text-[11px] font-medium uppercase tracking-wider text-neutral-500">Content Machine</p>
        <h1 className="mt-1 font-[family-name:var(--font-geist-sans)] text-2xl font-semibold tracking-tight text-neutral-100">
          Dominate
        </h1>
      </div>

      {/* Tab bar */}
      <div className="mb-8 flex gap-1 border-b border-neutral-800/60 pb-0">
        {tabs.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setActiveTab(id)}
            className={`flex items-center gap-2 px-3 py-2 text-[13px] font-medium transition-colors border-b-2 -mb-px ${
              activeTab === id
                ? "border-neutral-300 text-neutral-100"
                : "border-transparent text-neutral-500 hover:text-neutral-300"
            }`}
          >
            <Icon size={13} />
            {label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {activeTab === "signals" && <SignalsTab storedPassword={storedPassword} />}
      {activeTab === "clips" && <ClipsTab storedPassword={storedPassword} />}
      {activeTab === "generate" && <GenerateTab storedPassword={storedPassword} />}
      {activeTab === "metrics" && <MetricsTab />}
      {activeTab === "calendar" && <CalendarTab />}
      {activeTab === "autopost" && <AutoPostTab storedPassword={storedPassword} />}
    </div>
  );
}
