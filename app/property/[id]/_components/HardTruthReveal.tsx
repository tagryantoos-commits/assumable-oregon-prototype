"use client";

import { useEffect, useRef, useState } from "react";

const LINES = [
  "It wasn't the price.",
  "It wasn't the photos.",
  "It wasn't the staging.",
];

const CLOSER = ["Nobody told the buyers", "your loan was assumable."];

export default function HardTruthReveal() {
  const ref = useRef<HTMLDivElement | null>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const node = ref.current;
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
      { threshold: 0.35, rootMargin: "0px 0px -10% 0px" },
    );
    obs.observe(node);
    return () => obs.disconnect();
  }, []);

  return (
    <div ref={ref} className="space-y-6 sm:space-y-8 text-center">
      {LINES.map((line, i) => (
        <p
          key={i}
          className={`font-serif text-3xl sm:text-5xl font-light text-cream transition-all duration-700 ease-out ${
            visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
          }`}
          style={{ transitionDelay: visible ? `${i * 350}ms` : "0ms" }}
        >
          {line}
        </p>
      ))}
      <div
        className={`pt-8 sm:pt-12 transition-all duration-700 ease-out ${
          visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
        }`}
        style={{ transitionDelay: visible ? `${LINES.length * 350 + 200}ms` : "0ms" }}
      >
        {CLOSER.map((line, i) => (
          <p
            key={i}
            className="font-serif text-3xl sm:text-5xl font-semibold text-accent italic leading-tight"
          >
            {line}
          </p>
        ))}
      </div>
    </div>
  );
}
