"use client";
import { useState } from "react";

interface PropertyGateListing {
  id: string;
  address?: string;
  city?: string;
  state?: string;
  assumable_rate?: number;
  price?: number;
}

interface PropertyGateProps {
  onUnlock: () => void;
  onClose: () => void;
  listing?: PropertyGateListing;
}

function ConsentLine() {
  const [open, setOpen] = useState(false);
  return (
    <div className="mt-3 text-center">
      <p className="text-xs text-gray-400">
        We&apos;ll reach out to help you find the right property.{" "}
        <button
          type="button"
          onClick={() => setOpen(!open)}
          className="inline-flex items-center gap-0.5 text-gray-400 hover:text-gray-500 underline transition-colors"
        >
          Terms
          <svg width="10" height="10" viewBox="0 0 10 10" fill="currentColor" className={`transition-transform duration-200 ${open ? "rotate-180" : ""}`}>
            <path d="M5 7L1 3h8L5 7z"/>
          </svg>
        </button>
      </p>
      {open && (
        <div className="mt-2 text-left bg-gray-50 border border-gray-100 rounded-xl p-4 text-xs text-gray-500 space-y-2">
          <p>By submitting, you&apos;re giving us permission to contact you about assumable properties via phone, text, or email. You can opt out anytime, just reply STOP or let us know.</p>
          <p>We don&apos;t sell your info. This isn&apos;t a loan application. Assumption is subject to lender approval.</p>
        </div>
      )}
    </div>
  );
}

export default function PropertyGate({ onUnlock, onClose, listing }: PropertyGateProps) {
  const [mode, setMode] = useState<"register" | "returning">("register");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  function validateEmail(val: string) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val.trim());
  }
  function validatePhone(val: string) {
    const d = val.replace(/\D/g, "");
    const fake = ["0000000000","1111111111","2222222222","3333333333","4444444444","5555555555","6666666666","7777777777","8888888888","9999999999"];
    return d.length >= 10 && !fake.includes(d.slice(-10));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validateEmail(email)) { setError("Please enter a valid email address."); return; }
    if (mode === "register" && !validatePhone(phone)) { setError("Please enter a valid phone number."); return; }
    setError("");
    setSubmitting(true);
    try {
      const res = await fetch("/api/register-user", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, phone, returning: mode === "returning", listing }),
      });
      const data = await res.json();
      if (data.success) {
        localStorage.setItem("tag3_user", data.token);
        localStorage.setItem("tag3_user_exp", String(Date.now() + 30 * 24 * 60 * 60 * 1000));
        onUnlock();
      } else {
        setError("Something went wrong. Please try again.");
        setSubmitting(false);
      }
    } catch {
      setError("Something went wrong. Please try again.");
      setSubmitting(false);
    }
  }

  const canSubmit = mode === "register"
    ? (name.trim() && validateEmail(email) && validatePhone(phone))
    : validateEmail(email);

  return (
    <div className="fixed inset-0 bg-black/60 z-[9999] flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl max-w-md w-full p-6 md:p-8 shadow-2xl" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-xl font-bold text-gray-900">
            {mode === "register" ? "See Full Property Details" : "Welcome Back"}
          </h2>
          <button type="button" onClick={onClose} className="text-gray-400 hover:text-gray-600 text-2xl leading-none">&times;</button>
        </div>
        <p className="text-sm text-gray-500 mb-6">
          {mode === "register"
            ? "Enter your info to unlock the full address, photos, equity details, and more."
            : "Enter your email to pick up where you left off."}
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          {mode === "register" && (
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1 uppercase tracking-wide">Your Name <span className="text-red-500">*</span></label>
              <input type="text" placeholder="Alex Johnson" value={name} onChange={e => setName(e.target.value)} required className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#1D5C96] focus:border-transparent" />
            </div>
          )}
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1 uppercase tracking-wide">Email <span className="text-red-500">*</span></label>
            <input type="email" placeholder="alex@example.com" value={email} onChange={e => setEmail(e.target.value)} required className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#1D5C96] focus:border-transparent" />
          </div>
          {mode === "register" && (
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1 uppercase tracking-wide">Phone <span className="text-red-500">*</span></label>
              <input type="tel" placeholder="(719) 487-2200" value={phone} onChange={e => setPhone(e.target.value)} required className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#1D5C96] focus:border-transparent" />
            </div>
          )}
          {error && <p className="text-red-500 text-xs">{error}</p>}
          <button
            type="submit"
            disabled={submitting || !canSubmit}
            className="w-full bg-[#1D5C96] hover:bg-[#174a7a] text-white font-bold text-base py-4 rounded-xl transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {submitting ? "One moment\u2026" : mode === "register" ? "See Property Details \u2192" : "Unlock Properties \u2192"}
          </button>
          {mode === "register" && <ConsentLine />}
        </form>

        <div className="mt-4 text-center">
          {mode === "register" ? (
            <button type="button" onClick={() => { setMode("returning"); setError(""); }} className="text-xs text-gray-400 hover:text-[#1D5C96] underline transition-colors">
              Already registered? Enter your email
            </button>
          ) : (
            <button type="button" onClick={() => { setMode("register"); setError(""); }} className="text-xs text-gray-400 hover:text-[#1D5C96] underline transition-colors">
              New here? Register instead
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
