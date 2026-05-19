/**
 * Market rate helper tests.
 *
 * getMarketRate() pulls the latest 30Y fixed from FRED's public CSV.
 * Must fall back to the hard-coded constant if:
 *   - fetch throws
 *   - response is not ok
 *   - CSV is empty/malformed
 *   - request times out (4s AbortController)
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

const mockFetch = vi.fn();
global.fetch = mockFetch as unknown as typeof fetch;

describe('getMarketRate', () => {
  beforeEach(() => {
    vi.resetModules();
    mockFetch.mockReset();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('parses the latest rate from a normal FRED CSV response', async () => {
    mockFetch.mockResolvedValueOnce(
      new Response(
        'observation_date,MORTGAGE30US\n2026-04-09,6.37\n2026-04-16,6.30\n',
        { status: 200, headers: { 'content-type': 'text/csv' } }
      )
    );
    const { getMarketRate } = await import('../../lib/marketRate');
    expect(await getMarketRate()).toBe(6.30);
  });

  it('falls back when fetch returns non-ok', async () => {
    mockFetch.mockResolvedValueOnce(new Response('', { status: 503 }));
    const { getMarketRate, FALLBACK_MARKET_RATE } = await import('../../lib/marketRate');
    expect(await getMarketRate()).toBe(FALLBACK_MARKET_RATE);
  });

  it('falls back when fetch throws', async () => {
    mockFetch.mockRejectedValueOnce(new Error('network down'));
    const { getMarketRate, FALLBACK_MARKET_RATE } = await import('../../lib/marketRate');
    expect(await getMarketRate()).toBe(FALLBACK_MARKET_RATE);
  });

  it('falls back when CSV body has no usable rows', async () => {
    mockFetch.mockResolvedValueOnce(
      new Response('observation_date,MORTGAGE30US\n', { status: 200 })
    );
    const { getMarketRate, FALLBACK_MARKET_RATE } = await import('../../lib/marketRate');
    expect(await getMarketRate()).toBe(FALLBACK_MARKET_RATE);
  });

  it('falls back when the last rate is not a finite positive number', async () => {
    mockFetch.mockResolvedValueOnce(
      new Response(
        'observation_date,MORTGAGE30US\n2026-04-16,.\n',
        { status: 200 }
      )
    );
    const { getMarketRate, FALLBACK_MARKET_RATE } = await import('../../lib/marketRate');
    expect(await getMarketRate()).toBe(FALLBACK_MARKET_RATE);
  });

  it('skips malformed trailing rows and returns the last good value', async () => {
    mockFetch.mockResolvedValueOnce(
      new Response(
        'observation_date,MORTGAGE30US\n2026-04-09,6.37\n2026-04-16,.\n',
        { status: 200 }
      )
    );
    const { getMarketRate } = await import('../../lib/marketRate');
    expect(await getMarketRate()).toBe(6.37);
  });

  it('falls back when fetch is aborted (simulated timeout)', async () => {
    mockFetch.mockImplementationOnce((_url: string, opts: { signal?: AbortSignal }) =>
      new Promise((_, reject) => {
        opts.signal?.addEventListener('abort', () =>
          reject(new DOMException('aborted', 'AbortError'))
        );
      })
    );
    const { getMarketRate, FALLBACK_MARKET_RATE } = await import('../../lib/marketRate');
    // Use real timers but don't actually wait 4s — trigger abort immediately.
    const promise = getMarketRate();
    // The AbortController inside getMarketRate fires after 4s. For this test,
    // the mock listens to the signal and rejects on abort, so we only need
    // to wait until the setTimeout fires — fake timers keep this fast.
    vi.useFakeTimers();
    vi.advanceTimersByTime(5000);
    vi.useRealTimers();
    // With real timers back, the promise chain resolves via catch branch.
    expect(await promise).toBe(FALLBACK_MARKET_RATE);
  });
});
