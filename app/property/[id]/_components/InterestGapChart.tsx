"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  Area,
  CartesianGrid,
  ComposedChart,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  cumulativeInterestAtMonth,
  formatCompactCurrency,
} from "../_lib/math";

interface Props {
  originalLoanAmount: number;
  assumableRate: number;
  comparisonRate: number;
}

interface Point {
  year: number;
  assumable: number;
  market: number;
  gap: number;
}

export default function InterestGapChart({
  originalLoanAmount,
  assumableRate,
  comparisonRate,
}: Props) {
  // Recharts plays its draw-on animation on mount, so the chart needs to
  // mount only after it scrolls into view — otherwise the user lands on
  // already-drawn lines and never sees the 30-year reveal.
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const node = containerRef.current;
    if (!node) return;
    const obs = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) {
            setVisible(true);
            obs.disconnect();
            break;
          }
        }
      },
      { threshold: 0.25, rootMargin: "0px 0px -10% 0px" },
    );
    obs.observe(node);
    return () => obs.disconnect();
  }, []);

  const data = useMemo<Point[]>(() => {
    const points: Point[] = [];
    for (let year = 0; year <= 30; year++) {
      const assumable = cumulativeInterestAtMonth(
        originalLoanAmount,
        assumableRate,
        360,
        year * 12,
      );
      const market = cumulativeInterestAtMonth(
        originalLoanAmount,
        comparisonRate,
        360,
        year * 12,
      );
      points.push({
        year,
        assumable: Math.round(assumable),
        market: Math.round(market),
        gap: Math.round(market - assumable),
      });
    }
    return points;
  }, [originalLoanAmount, assumableRate, comparisonRate]);

  return (
    <div ref={containerRef} className="w-full h-[320px] sm:h-[420px]">
      {visible ? (
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart
          data={data}
          margin={{ top: 24, right: 16, left: 16, bottom: 16 }}
        >
          <defs>
            <linearGradient id="gapGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#7db0de" stopOpacity={0.35} />
              <stop offset="100%" stopColor="#7db0de" stopOpacity={0.06} />
            </linearGradient>
          </defs>
          <CartesianGrid stroke="#2d4d6d" strokeDasharray="3 3" vertical={false} />
          <XAxis
            dataKey="year"
            stroke="rgba(243,239,232,0.6)"
            tick={{ fill: "rgba(243,239,232,0.6)", fontSize: 11, fontFamily: "ui-monospace, monospace" }}
            tickLine={false}
            axisLine={{ stroke: "#2d4d6d" }}
            label={{
              value: "YEAR",
              position: "insideBottom",
              offset: -8,
              fill: "rgba(243,239,232,0.6)",
              fontSize: 10,
              letterSpacing: "0.2em",
            }}
          />
          <YAxis
            stroke="rgba(243,239,232,0.6)"
            tick={{ fill: "rgba(243,239,232,0.6)", fontSize: 11, fontFamily: "ui-monospace, monospace" }}
            tickLine={false}
            axisLine={{ stroke: "#2d4d6d" }}
            tickFormatter={(v: number) => formatCompactCurrency(v)}
            width={64}
          />
          <Tooltip
            contentStyle={{
              background: "#12395d",
              border: "1px solid #2d4d6d",
              borderRadius: 6,
              color: "#f3efe8",
              fontSize: 12,
              letterSpacing: "0.04em",
            }}
            labelFormatter={(year) => `YEAR ${year}`}
            formatter={(value, name) => [
              formatCompactCurrency(Number(value)),
              name === "market"
                ? `${comparisonRate}%`
                : name === "assumable"
                ? `${assumableRate}%`
                : "GAP",
            ]}
          />
          <Area
            type="monotone"
            dataKey="gap"
            stroke="none"
            fill="url(#gapGradient)"
            isAnimationActive
            animationDuration={3000}
            animationEasing="ease-out"
          />
          <Line
            type="monotone"
            dataKey="market"
            stroke="#1d5c96"
            strokeWidth={2}
            dot={false}
            isAnimationActive
            animationDuration={3000}
            animationEasing="ease-out"
            name="market"
          />
          <Line
            type="monotone"
            dataKey="assumable"
            stroke="#7db0de"
            strokeWidth={2}
            dot={false}
            isAnimationActive
            animationDuration={3000}
            animationEasing="ease-out"
            name="assumable"
          />
        </ComposedChart>
      </ResponsiveContainer>
      ) : null}
    </div>
  );
}
