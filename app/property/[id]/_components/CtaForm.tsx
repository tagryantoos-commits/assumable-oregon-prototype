"use client";

import { useState } from "react";

interface Props {
  propertyId: string;
}

type Status = "idle" | "submitting" | "success" | "error";

export default function CtaForm({ propertyId }: Props) {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<Status>("idle");
  const [errorMsg, setErrorMsg] = useState("");

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("submitting");
    setErrorMsg("");
    try {
      const res = await fetch("/api/landing-form-submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ property_id: propertyId, name, phone, email }),
      });
      const data: { success?: boolean; error?: string } = await res
        .json()
        .catch(() => ({}));
      if (res.ok && data.success) {
        setStatus("success");
        return;
      }
      setStatus("error");
      setErrorMsg(data.error || `Server returned ${res.status}`);
    } catch (err) {
      setStatus("error");
      setErrorMsg(err instanceof Error ? err.message : "Network error");
    }
  }

  if (status === "success") {
    return (
      <div className="bg-[#1a4673] border border-accent/30 rounded-lg p-8 text-center">
        <p className="font-serif text-2xl sm:text-3xl text-accent mb-2">
          Thanks!
        </p>
        <p className="text-cream/85 text-base sm:text-lg">
          I&rsquo;ll call you within 15 minutes.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <p className="text-cream/70 text-sm font-mono uppercase tracking-[0.2em] mb-2">
        Or send me your contact info
      </p>
      <div className="grid grid-cols-1 gap-4">
        <div>
          <label htmlFor="name" className="sr-only">Name</label>
          <input
            id="name"
            name="name"
            type="text"
            required
            placeholder="Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full bg-[#1a4673] border border-cream/15 text-cream placeholder:text-cream/40 px-4 py-3 rounded-md focus:outline-none focus:border-accent/60 transition-colors"
          />
        </div>
        <div>
          <label htmlFor="phone" className="sr-only">Phone</label>
          <input
            id="phone"
            name="phone"
            type="tel"
            required
            placeholder="Phone"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            className="w-full bg-[#1a4673] border border-cream/15 text-cream placeholder:text-cream/40 px-4 py-3 rounded-md focus:outline-none focus:border-accent/60 transition-colors"
          />
        </div>
        <div>
          <label htmlFor="email" className="sr-only">Email</label>
          <input
            id="email"
            name="email"
            type="email"
            required
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full bg-[#1a4673] border border-cream/15 text-cream placeholder:text-cream/40 px-4 py-3 rounded-md focus:outline-none focus:border-accent/60 transition-colors"
          />
        </div>
      </div>
      <button
        type="submit"
        disabled={status === "submitting"}
        className="w-full sm:w-auto px-8 py-4 bg-accent text-bg font-mono uppercase tracking-[0.2em] text-sm font-semibold rounded-md hover:bg-accent/90 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
      >
        {status === "submitting" ? "Sending…" : "Send it my way"}
      </button>
      {status === "error" && (
        <p className="text-[#ff8a6f] text-sm" role="alert">
          {errorMsg || "Something went wrong. Please call (719) 624-3472 directly."}
        </p>
      )}
    </form>
  );
}
