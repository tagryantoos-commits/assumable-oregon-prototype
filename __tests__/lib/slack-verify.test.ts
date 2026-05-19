/**
 * Slack HMAC verification tests.
 * Spec: https://api.slack.com/authentication/verifying-requests-from-slack
 */
import { describe, it, expect } from 'vitest';
import { createHmac } from 'crypto';
import { verifySlackSignature } from '../../lib/slack-verify';

const SECRET = 'test-signing-secret';

function sign(body: string, tsSecs: number): string {
  const base = `v0:${tsSecs}:${body}`;
  return 'v0=' + createHmac('sha256', SECRET).update(base).digest('hex');
}

describe('verifySlackSignature', () => {
  const BODY = '{"type":"event_callback","event":{"type":"app_mention"}}';
  const NOW_MS = 1_776_900_000_000; // arbitrary fixed "now"
  const FRESH_TS = String(Math.floor(NOW_MS / 1000));

  it('accepts a correctly-signed request within the 5-minute window', () => {
    const sig = sign(BODY, Number(FRESH_TS));
    expect(verifySlackSignature(BODY, FRESH_TS, sig, SECRET, NOW_MS)).toBe(true);
  });

  it('rejects if the signing secret is wrong', () => {
    const sig = sign(BODY, Number(FRESH_TS));
    expect(verifySlackSignature(BODY, FRESH_TS, sig, 'wrong-secret', NOW_MS)).toBe(false);
  });

  it('rejects if the body has been tampered with', () => {
    const sig = sign(BODY, Number(FRESH_TS));
    expect(verifySlackSignature(BODY + 'X', FRESH_TS, sig, SECRET, NOW_MS)).toBe(false);
  });

  it('rejects timestamps older than 5 minutes (replay attack guard)', () => {
    const oldTs = String(Math.floor(NOW_MS / 1000) - 301); // 5min 1s ago
    const sig = sign(BODY, Number(oldTs));
    expect(verifySlackSignature(BODY, oldTs, sig, SECRET, NOW_MS)).toBe(false);
  });

  it('accepts timestamps within 5 minutes (just inside boundary)', () => {
    const ts = String(Math.floor(NOW_MS / 1000) - 299);
    const sig = sign(BODY, Number(ts));
    expect(verifySlackSignature(BODY, ts, sig, SECRET, NOW_MS)).toBe(true);
  });

  it('rejects missing timestamp header', () => {
    const sig = sign(BODY, Number(FRESH_TS));
    expect(verifySlackSignature(BODY, null, sig, SECRET, NOW_MS)).toBe(false);
  });

  it('rejects missing signature header', () => {
    expect(verifySlackSignature(BODY, FRESH_TS, null, SECRET, NOW_MS)).toBe(false);
  });

  it('rejects empty signing secret', () => {
    const sig = sign(BODY, Number(FRESH_TS));
    expect(verifySlackSignature(BODY, FRESH_TS, sig, '', NOW_MS)).toBe(false);
  });

  it('rejects non-numeric timestamp', () => {
    const sig = sign(BODY, Number(FRESH_TS));
    expect(verifySlackSignature(BODY, 'not-a-number', sig, SECRET, NOW_MS)).toBe(false);
  });

  it('uses timing-safe comparison (length-equal but different sigs rejected)', () => {
    const sig = sign(BODY, Number(FRESH_TS));
    const tampered = sig.replace(/.$/, c => (c === '0' ? '1' : '0'));
    expect(verifySlackSignature(BODY, FRESH_TS, tampered, SECRET, NOW_MS)).toBe(false);
  });
});
