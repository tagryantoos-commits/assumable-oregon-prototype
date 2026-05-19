const FRED_CSV_URL = 'https://fred.stlouisfed.org/graph/fredgraph.csv?id=MORTGAGE30US';

export const FALLBACK_MARKET_RATE = 6.30;

const FETCH_TIMEOUT_MS = 4000;

export async function getMarketRate(): Promise<number> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
  try {
    const res = await fetch(FRED_CSV_URL, {
      next: { revalidate: 86400 },
      headers: { Accept: 'text/csv' },
      signal: controller.signal,
    });
    if (!res.ok) return FALLBACK_MARKET_RATE;
    const csv = await res.text();
    const lines = csv.trim().split('\n');
    for (let i = lines.length - 1; i >= 1; i--) {
      const parts = lines[i].split(',');
      const value = parseFloat(parts[1]);
      if (Number.isFinite(value) && value > 0) return value;
    }
    return FALLBACK_MARKET_RATE;
  } catch {
    return FALLBACK_MARKET_RATE;
  } finally {
    clearTimeout(timer);
  }
}
