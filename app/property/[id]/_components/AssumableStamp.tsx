/**
 * Round wax-stamp graphic with the assumable rate centered.
 * Pure SVG + CSS animation — no client JS needed, but rendered as a Server
 * Component so it ships zero JS to the client.
 */

interface Props {
  rate: number;
}

export default function AssumableStamp({ rate }: Props) {
  return (
    <div className="relative w-44 h-44 sm:w-56 sm:h-56 mx-auto stamp-spin">
      <svg
        viewBox="0 0 200 200"
        className="w-full h-full drop-shadow-[0_4px_24px_rgba(125,176,222,0.22)]"
        aria-hidden="true"
      >
        {/* Outer ring */}
        <circle
          cx="100"
          cy="100"
          r="92"
          fill="none"
          stroke="#7db0de"
          strokeWidth="3"
          opacity="0.65"
        />
        {/* Inner ring */}
        <circle
          cx="100"
          cy="100"
          r="80"
          fill="none"
          stroke="#7db0de"
          strokeWidth="1.5"
          opacity="0.4"
        />
        {/* Curved label "ASSUMABLE • {rate}%" */}
        <defs>
          <path
            id="stampArcTop"
            d="M 30 100 A 70 70 0 0 1 170 100"
            fill="none"
          />
          <path
            id="stampArcBottom"
            d="M 30 100 A 70 70 0 0 0 170 100"
            fill="none"
          />
        </defs>
        <text
          fill="#7db0de"
          fontSize="14"
          fontFamily="ui-monospace, SFMono-Regular, Menlo, monospace"
          letterSpacing="6"
        >
          <textPath href="#stampArcTop" startOffset="50%" textAnchor="middle">
            ASSUMABLE
          </textPath>
        </text>
        <text
          fill="#7db0de"
          fontSize="11"
          fontFamily="ui-monospace, SFMono-Regular, Menlo, monospace"
          letterSpacing="6"
          opacity="0.7"
        >
          <textPath href="#stampArcBottom" startOffset="50%" textAnchor="middle">
            • LOCKED IN •
          </textPath>
        </text>
        {/* Center rate */}
        <text
          x="100"
          y="108"
          textAnchor="middle"
          fill="#7db0de"
          fontSize="38"
          fontWeight="700"
          fontFamily="Georgia, 'Times New Roman', serif"
        >
          {rate}%
        </text>
      </svg>
    </div>
  );
}
