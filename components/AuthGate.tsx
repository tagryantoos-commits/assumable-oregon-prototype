'use client';

import { useState, useEffect } from 'react';
import { createClient } from '../lib/supabase/client';
import { trackMetaLead } from './MetaPixel';
import { trackActivity } from '../lib/tracking';

interface AuthGateListing {
  id: string;
  address?: string;
  city?: string;
  state?: string;
  assumable_rate?: number;
  price?: number;
}

interface AuthGateProps {
  onUnlock: () => void;
  onClose: () => void;
  listing?: AuthGateListing;
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

function EyeToggle({ show, onClick }: { show: boolean; onClick: () => void }) {
  return (
    <button type="button" onClick={onClick} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors" tabIndex={-1}>
      {show ? (
        <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88" />
        </svg>
      ) : (
        <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      )}
    </button>
  );
}

export default function AuthGate({ onUnlock, onClose, listing }: AuthGateProps) {
  const [mode, setMode] = useState<'register' | 'login' | 'forgot'>('register');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [userType, setUserType] = useState('buyer');
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [resetSent, setResetSent] = useState(false);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [onClose]);

  function validateEmail(val: string) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val.trim());
  }
  function validatePhone(val: string) {
    const d = val.replace(/\D/g, '');
    const fake = ['0000000000','1111111111','2222222222','3333333333','4444444444','5555555555','6666666666','7777777777','8888888888','9999999999'];
    return d.length >= 10 && !fake.includes(d.slice(-10));
  }

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault();
    if (!validateEmail(email)) { setError('Please enter a valid email address.'); return; }
    if (!validatePhone(phone)) { setError('Please enter a valid phone number.'); return; }
    if (password.length < 6) { setError('Password must be at least 6 characters.'); return; }
    setError('');
    setSubmitting(true);

    try {
      const supabase = createClient();
      const { data, error: signUpError } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: {
          data: {
            first_name: firstName.trim(),
            last_name: lastName.trim(),
            phone: phone.trim(),
            user_type: userType,
          },
        },
      });

      if (signUpError) {
        setError(signUpError.message);
        setSubmitting(false);
        return;
      }

      // Always fire lead-tracking + FUB + Telegram once signUp succeeds, even
      // if Supabase didn't return a session (email-confirmation flow). The
      // registration is a real lead the moment the user submits the form —
      // whether they've clicked the email link yet is a separate concern.
      if (data.user) {
        trackMetaLead({ em: email.trim(), ph: phone.trim(), fn: firstName.trim() });

        fetch('/api/auth/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            firstName: firstName.trim(),
            lastName: lastName.trim(),
            email: email.trim(),
            phone: phone.trim(),
            userType,
            listing,
          }),
        }).catch(() => {});
      }

      if (data.session) {
        // Auto-confirmed — unlock immediately.
        if (listing) {
          trackActivity('property_viewed', {
            listing_id: listing.id,
            address: listing.address,
            city: listing.city,
            assumable_rate: listing.assumable_rate,
            price: listing.price,
            page_url: window.location.href,
          });
        }
        onUnlock();
      } else {
        // Email confirmation required — tell the user but keep the lead tracked.
        setError('Check your email to confirm your account, then log in.');
        setSubmitting(false);
      }
    } catch {
      setError('Something went wrong. Please try again.');
      setSubmitting(false);
    }
  }

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    if (!validateEmail(email)) { setError('Please enter a valid email address.'); return; }
    if (!password) { setError('Please enter your password.'); return; }
    setError('');
    setSubmitting(true);

    try {
      const supabase = createClient();
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });

      if (signInError) {
        setError(signInError.message);
        setSubmitting(false);
        return;
      }

      onUnlock();
    } catch {
      setError('Something went wrong. Please try again.');
      setSubmitting(false);
    }
  }

  async function handleForgotPassword(e: React.FormEvent) {
    e.preventDefault();
    if (!validateEmail(email)) { setError('Please enter a valid email address.'); return; }
    setError('');
    setSubmitting(true);

    try {
      const supabase = createClient();
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(
        email.trim(),
        { redirectTo: `${window.location.origin}/auth/callback?next=/auth/reset-password` }
      );

      if (resetError) {
        setError(resetError.message);
        setSubmitting(false);
        return;
      }

      setResetSent(true);
      setSubmitting(false);
    } catch {
      setError('Something went wrong. Please try again.');
      setSubmitting(false);
    }
  }

  const inputClass = "w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#1D5C96] focus:border-transparent";

  const canRegister = firstName.trim() && lastName.trim() && validateEmail(email) && validatePhone(phone) && password.length >= 6;
  const canLogin = validateEmail(email) && password.length > 0;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[9999] flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl max-w-md w-full p-6 md:p-8 shadow-2xl max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-xl font-bold text-gray-900">
            {mode === 'register' && 'Create Your Account'}
            {mode === 'login' && 'Welcome Back'}
            {mode === 'forgot' && 'Reset Password'}
          </h2>
          <button type="button" onClick={onClose} className="text-gray-400 hover:text-gray-600 text-2xl leading-none">&times;</button>
        </div>
        <p className="text-sm text-gray-500 mb-6">
          {mode === 'register' && 'Unlock full addresses, photos, equity details, and more.'}
          {mode === 'login' && 'Log in to access your saved properties and details.'}
          {mode === 'forgot' && 'Enter your email and we\'ll send you a reset link.'}
        </p>

        {/* ── Register Form ── */}
        {mode === 'register' && (
          <form onSubmit={handleRegister} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1 uppercase tracking-wide">First Name <span className="text-red-500">*</span></label>
                <input type="text" placeholder="Alex" value={firstName} onChange={e => setFirstName(e.target.value)} required className={inputClass} />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1 uppercase tracking-wide">Last Name <span className="text-red-500">*</span></label>
                <input type="text" placeholder="Johnson" value={lastName} onChange={e => setLastName(e.target.value)} required className={inputClass} />
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1 uppercase tracking-wide">Email <span className="text-red-500">*</span></label>
              <input type="email" placeholder="alex@example.com" value={email} onChange={e => setEmail(e.target.value)} required className={inputClass} />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1 uppercase tracking-wide">Phone <span className="text-red-500">*</span></label>
              <input type="tel" placeholder="(719) 487-2200" value={phone} onChange={e => setPhone(e.target.value)} required className={inputClass} />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1 uppercase tracking-wide">Password <span className="text-red-500">*</span></label>
              <div className="relative">
                <input type={showPassword ? 'text' : 'password'} placeholder="At least 6 characters" value={password} onChange={e => setPassword(e.target.value)} required minLength={6} className={inputClass + ' pr-10'} />
                <EyeToggle show={showPassword} onClick={() => setShowPassword(!showPassword)} />
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1 uppercase tracking-wide">Who are you?</label>
              <select value={userType} onChange={e => setUserType(e.target.value)} className={inputClass + ' text-gray-700'}>
                <option value="buyer">Buyer</option>
                <option value="agent">Agent</option>
                <option value="investor">Investor</option>
              </select>
            </div>

            {error && <p className="text-red-500 text-xs">{error}</p>}

            <button
              type="submit"
              disabled={submitting || !canRegister}
              className="w-full bg-[#1D5C96] hover:bg-[#174a7a] text-white font-bold text-base py-4 rounded-xl transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {submitting ? 'Creating Account\u2026' : 'Create My Account \u2192'}
            </button>

            <ConsentLine />
          </form>
        )}

        {/* ── Login Form ── */}
        {mode === 'login' && (
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1 uppercase tracking-wide">Email <span className="text-red-500">*</span></label>
              <input type="email" placeholder="alex@example.com" value={email} onChange={e => setEmail(e.target.value)} required className={inputClass} />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1 uppercase tracking-wide">Password <span className="text-red-500">*</span></label>
              <div className="relative">
                <input type={showPassword ? 'text' : 'password'} placeholder="Your password" value={password} onChange={e => setPassword(e.target.value)} required className={inputClass + ' pr-10'} />
                <EyeToggle show={showPassword} onClick={() => setShowPassword(!showPassword)} />
              </div>
            </div>

            {error && <p className="text-red-500 text-xs">{error}</p>}

            <button
              type="submit"
              disabled={submitting || !canLogin}
              className="w-full bg-[#1D5C96] hover:bg-[#174a7a] text-white font-bold text-base py-4 rounded-xl transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {submitting ? 'Logging In\u2026' : 'Log In \u2192'}
            </button>

            <div className="text-center">
              <button type="button" onClick={() => { setMode('forgot'); setError(''); }} className="text-xs text-gray-400 hover:text-[#1D5C96] underline transition-colors">
                Forgot password?
              </button>
            </div>
          </form>
        )}

        {/* ── Forgot Password ── */}
        {mode === 'forgot' && (
          resetSent ? (
            <div className="text-center py-4">
              <p className="text-sm text-gray-600 mb-4">Check your email for a password reset link.</p>
              <button type="button" onClick={() => { setMode('login'); setResetSent(false); setError(''); }} className="text-sm text-[#1D5C96] hover:underline font-medium">
                Back to Log In
              </button>
            </div>
          ) : (
            <form onSubmit={handleForgotPassword} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1 uppercase tracking-wide">Email <span className="text-red-500">*</span></label>
                <input type="email" placeholder="alex@example.com" value={email} onChange={e => setEmail(e.target.value)} required className={inputClass} />
              </div>

              {error && <p className="text-red-500 text-xs">{error}</p>}

              <button
                type="submit"
                disabled={submitting || !validateEmail(email)}
                className="w-full bg-[#1D5C96] hover:bg-[#174a7a] text-white font-bold text-base py-4 rounded-xl transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {submitting ? 'Sending\u2026' : 'Send Reset Link \u2192'}
              </button>
            </form>
          )
        )}

        {/* ── Mode Toggle ── */}
        <div className="mt-4 text-center">
          {mode === 'register' ? (
            <button type="button" onClick={() => { setMode('login'); setError(''); }} className="text-xs text-gray-400 hover:text-[#1D5C96] transition-colors">
              Already have an account? <span className="underline font-medium">Log in</span>
            </button>
          ) : (mode === 'login' || mode === 'forgot') && (
            <button type="button" onClick={() => { setMode('register'); setError(''); setResetSent(false); }} className="text-xs text-gray-400 hover:text-[#1D5C96] transition-colors">
              New here? <span className="underline font-medium">Create an account</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
