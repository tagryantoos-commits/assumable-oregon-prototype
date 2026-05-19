import { createHmac, timingSafeEqual } from 'crypto';

/**
 * Verify a Slack webhook request's signing secret per
 * https://api.slack.com/authentication/verifying-requests-from-slack.
 *
 * Returns true only if:
 *   - timestamp is within 5 minutes of now (replay-attack guard)
 *   - HMAC-SHA256(signingSecret, `v0:{ts}:{rawBody}`) matches x-slack-signature
 *
 * The caller must provide the RAW string body — not a re-serialized JSON
 * object — since the HMAC is computed over the exact bytes Slack sent.
 */
export function verifySlackSignature(
  rawBody: string,
  timestampHeader: string | null,
  signatureHeader: string | null,
  signingSecret: string,
  nowMs: number = Date.now(),
): boolean {
  if (!timestampHeader || !signatureHeader || !signingSecret) return false;

  const ts = Number(timestampHeader);
  if (!Number.isFinite(ts)) return false;
  // 5-minute skew window
  if (Math.abs(nowMs / 1000 - ts) > 300) return false;

  const base = `v0:${timestampHeader}:${rawBody}`;
  const expected = 'v0=' + createHmac('sha256', signingSecret).update(base).digest('hex');

  const a = Buffer.from(expected);
  const b = Buffer.from(signatureHeader);
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}
