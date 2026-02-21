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
} from "lucide-react";

type Mode = "youtube" | "text" | "image";
type Step = "idle" | "fetching" | "generating" | "social" | "done" | "publishing" | "published";

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

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  const copy = () => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <button onClick={copy} className="flex items-center gap-1.5 rounded-md px-2.5 py-1 text-[11px] font-medium text-neutral-400 transition-colors hover:bg-neutral-800 hover:text-neutral-200">
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
          <span className={`rounded px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${isLinkedin ? "bg-blue-500/10 text-blue-400" : "bg-neutral-700 text-neutral-300"}`}>
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

const STEP_LABELS: Record<Step, string> = {
  idle: "",
  fetching: "Fetching transcript...",
  generating: "Writing blog post...",
  social: "Generating social content...",
  done: "",
  publishing: "Publishing to saadbelcaid.me...",
  published: "",
};

export default function DominatePage() {
  const [authed, setAuthed] = useState(false);
  const [password, setPassword] = useState("");
  const [passwordError, setPasswordError] = useState(false);
  const [storedPassword, setStoredPassword] = useState("");

  const [mode, setMode] = useState<Mode>("youtube");
  const [url, setUrl] = useState("");
  const [text, setText] = useState("");
  const [image, setImage] = useState<File | null>(null);
  const [extraText, setExtraText] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  const [step, setStep] = useState<Step>("idle");
  const [error, setError] = useState("");
  const [result, setResult] = useState<Result | null>(null);
  const [socialSections, setSocialSections] = useState<SocialSection[]>([]);
  const [publishedUrl, setPublishedUrl] = useState("");

  useEffect(() => {
    const saved = sessionStorage.getItem("dominate_pw");
    if (saved) { setStoredPassword(saved); setAuthed(true); }
  }, []);

  const handleAuth = (e: React.FormEvent) => {
    e.preventDefault();
    // Verify via a dummy request
    setStoredPassword(password);
    sessionStorage.setItem("dominate_pw", password);
    setAuthed(true);
    setPasswordError(false);
  };

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
        form.append("url", url);
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

      setStep("social");
      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Something went wrong.");
        setStep("idle");
        return;
      }

      setResult(data);
      setSocialSections(parseSocial(data.socialContent));
      setStep("done");
    } catch (err) {
      setError("Request failed. Try again.");
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

  const loading = step === "fetching" || step === "generating" || step === "social" || step === "publishing";
  const blogBody = result?.mdxContent.replace(/^---[\s\S]*?---\n/, "").trim() || "";

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

  return (
    <div>
      {/* Header */}
      <div className="mb-10">
        <p className="text-[11px] font-medium uppercase tracking-wider text-neutral-500">Content Machine</p>
        <h1 className="mt-1 font-[family-name:var(--font-geist-sans)] text-2xl font-semibold tracking-tight text-neutral-100">
          Dominate
        </h1>
        <p className="mt-1 text-[13px] text-neutral-500">
          Drop a YouTube link or a brain dump. Get a live post + full week of content.
        </p>
      </div>

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
          <input
            type="url"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://youtube.com/watch?v=..."
            className="w-full bg-transparent text-[14px] text-neutral-200 placeholder-neutral-600 outline-none"
          />
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
            <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={(e) => setImage(e.target.files?.[0] || null)} />
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
