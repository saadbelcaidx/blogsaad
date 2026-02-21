"use client";

import { useState, FormEvent } from "react";

export function Newsletter() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!email) return;

    setStatus("loading");

    try {
      const res = await fetch(
        `https://saadbelcaid.substack.com/api/v1/free?email=${encodeURIComponent(email)}`,
        { method: "POST", mode: "no-cors" }
      );
      // no-cors means we can't read the response, but the subscription goes through
      setStatus("success");
      setEmail("");
    } catch {
      // Fallback: open Substack subscribe page
      window.open(`https://saadbelcaid.substack.com/subscribe?email=${encodeURIComponent(email)}`, "_blank");
      setStatus("success");
      setEmail("");
    }
  }

  return (
    <div className="mt-16 rounded-lg border border-neutral-800 bg-neutral-900/50 px-6 py-8">
      <h3 className="font-[family-name:var(--font-geist-sans)] text-lg font-semibold tracking-tight text-neutral-100">
        The operator memo.
      </h3>
      <p className="mt-2 text-[13px] leading-relaxed text-neutral-400">
        One essay every Saturday. What I&apos;m building, what the market is doing, what most operators are missing. No fluff. Read it or don&apos;t.
      </p>

      {status === "success" ? (
        <p className="mt-5 text-[13px] font-medium text-green-400">
          You&apos;re in. Check your inbox to confirm.
        </p>
      ) : (
        <form onSubmit={handleSubmit} className="mt-5 flex gap-2">
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="your@email.com"
            className="flex-1 rounded-md border border-neutral-800 bg-neutral-950 px-3 py-2 text-[13px] text-neutral-200 placeholder-neutral-600 outline-none transition-colors focus:border-neutral-600"
          />
          <button
            type="submit"
            disabled={status === "loading"}
            className="shrink-0 rounded-md bg-neutral-100 px-4 py-2 text-[13px] font-medium text-neutral-900 transition-colors hover:bg-white disabled:opacity-50"
          >
            {status === "loading" ? "..." : "Subscribe"}
          </button>
        </form>
      )}
    </div>
  );
}
