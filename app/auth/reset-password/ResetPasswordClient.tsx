'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { createClient } from '../../../lib/supabase/client';

type Phase = 'verifying' | 'ready' | 'invalid' | 'submitting' | 'success';

export default function ResetPasswordClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const supabase = useMemo(() => createClient(), []);

  const [phase, setPhase] = useState<Phase>('verifying');
  const [error, setError] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');

  useEffect(() => {
    let cancelled = false;
    const callbackError = searchParams.get('error');

    (async () => {
      await new Promise(r => setTimeout(r, 100));
      if (cancelled) return;

      const { data } = await supabase.auth.getSession();
      if (cancelled) return;

      if (data.session) {
        setPhase('ready');
        return;
      }

      if (callbackError) {
        setError(
          callbackError === 'missing_code'
            ? 'This reset link is invalid or has expired. Please request a new one.'
            : decodeURIComponent(callbackError)
        );
        setPhase('invalid');
        return;
      }

      setError('This reset link is invalid or has expired. Please request a new one.');
      setPhase('invalid');
    })();

    return () => {
      cancelled = true;
    };
  }, [supabase, searchParams]);

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      if (password.length < 8) {
        setError('Password must be at least 8 characters.');
        return;
      }
      if (password !== confirm) {
        setError('Passwords do not match.');
        return;
      }
      setError('');
      setPhase('submitting');

      const { error: updateError } = await supabase.auth.updateUser({ password });

      if (updateError) {
        setError(updateError.message);
        setPhase('ready');
        return;
      }

      setPhase('success');
      setTimeout(() => router.push('/'), 2500);
    },
    [password, confirm, supabase, router]
  );

  return (
    <div className="min-h-[70vh] flex items-center justify-center px-4 py-16 bg-gray-50">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl p-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Reset your password</h1>
        <p className="text-sm text-gray-500 mb-6">
          Choose a new password for your Assumable Guy account.
        </p>

        {phase === 'verifying' && (
          <div className="text-center py-6">
            <div className="inline-block w-8 h-8 border-3 border-gray-200 border-t-brand rounded-full animate-spin mb-3" />
            <p className="text-sm text-gray-500">Verifying your reset link...</p>
          </div>
        )}

        {phase === 'invalid' && (
          <div className="text-center py-4">
            <div className="text-4xl mb-3">⚠️</div>
            <p className="text-sm text-gray-700 mb-4">
              {error || 'This reset link is no longer valid.'}
            </p>
            <Link
              href="/"
              className="inline-block bg-brand hover:bg-brand-dark text-white font-semibold px-6 py-3 rounded-xl transition-colors"
            >
              Back to home
            </Link>
          </div>
        )}

        {phase === 'success' && (
          <div className="text-center py-4">
            <div className="text-4xl mb-3">✅</div>
            <p className="text-gray-900 font-semibold mb-2">Password updated.</p>
            <p className="text-sm text-gray-500">Redirecting you home...</p>
          </div>
        )}

        {(phase === 'ready' || phase === 'submitting') && (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="new-password" className="block text-sm font-medium text-gray-700 mb-1">
                New password
              </label>
              <input
                id="new-password"
                type="password"
                required
                minLength={8}
                autoComplete="new-password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand focus:border-transparent"
                placeholder="At least 8 characters"
              />
            </div>
            <div>
              <label htmlFor="confirm-password" className="block text-sm font-medium text-gray-700 mb-1">
                Confirm password
              </label>
              <input
                id="confirm-password"
                type="password"
                required
                minLength={8}
                autoComplete="new-password"
                value={confirm}
                onChange={e => setConfirm(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand focus:border-transparent"
                placeholder="Re-enter your new password"
              />
            </div>

            {error && (
              <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={phase === 'submitting'}
              className="w-full bg-brand hover:bg-brand-dark text-white font-bold px-6 py-3 rounded-xl transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {phase === 'submitting' ? 'Updating...' : 'Update password'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
