/**
 * Equal Housing Opportunity logo — house outline with equals sign inside.
 * Hand-rolled SVG. The EHO mark is widely used in real estate marketing.
 */
export default function EhoLogo({ className = "w-6 h-6" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 32 32"
      className={className}
      role="img"
      aria-label="Equal Housing Opportunity"
    >
      {/* House outline */}
      <path
        d="M 4 16 L 16 6 L 28 16 L 28 28 L 4 28 Z"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
      {/* Equals sign inside */}
      <rect x="11" y="17" width="10" height="2" fill="currentColor" />
      <rect x="11" y="22" width="10" height="2" fill="currentColor" />
    </svg>
  );
}
