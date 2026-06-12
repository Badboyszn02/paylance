'use client';

export default function MarketplaceDiagram() {
  return (
    <div className="w-full max-w-md mx-auto">
      <svg viewBox="0 0 360 280" className="w-full h-auto" aria-hidden>
        <defs>
          <radialGradient id="mp-node" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="rgba(103,232,249,0.22)" />
            <stop offset="100%" stopColor="rgba(8,145,178,0.03)" />
          </radialGradient>
          <radialGradient id="mp-node-strong" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="rgba(103,232,249,0.34)" />
            <stop offset="100%" stopColor="rgba(8,145,178,0.05)" />
          </radialGradient>
          {/* Path A: Freelancer (bottom-left) to Escrow (top-center) */}
          <path id="mp-a" d="M 82 198 L 158 90" />
          {/* Path B: Client (bottom-right) to Escrow (top-center) */}
          <path id="mp-b" d="M 278 198 L 202 90" />
          {/* Path C: Escrow to Freelancer (curved return for the release) */}
          <path id="mp-c" d="M 150 96 Q 60 150 62 192" />
        </defs>

        {/* Dashed connectors */}
        <use href="#mp-a" stroke="rgba(255,255,255,0.18)" strokeWidth="1" strokeDasharray="3 4" fill="none" />
        <use href="#mp-b" stroke="rgba(255,255,255,0.18)" strokeWidth="1" strokeDasharray="3 4" fill="none" />
        <use href="#mp-c" stroke="rgba(103,232,249,0.32)" strokeWidth="1" strokeDasharray="3 4" fill="none" />

        {/* Tokens on path A (Listing) */}
        <circle r="4" fill="#AFA9EC">
          <animateMotion dur="3s" repeatCount="indefinite">
            <mpath href="#mp-a" />
          </animateMotion>
          <animate attributeName="opacity" values="0;1;1;0" keyTimes="0;0.15;0.85;1" dur="3s" repeatCount="indefinite" />
        </circle>

        {/* Tokens on path B (Funds) */}
        <circle r="4" fill="#AFA9EC">
          <animateMotion dur="3s" repeatCount="indefinite" begin="1s">
            <mpath href="#mp-b" />
          </animateMotion>
          <animate attributeName="opacity" values="0;1;1;0" keyTimes="0;0.15;0.85;1" dur="3s" repeatCount="indefinite" begin="1s" />
        </circle>

        {/* Tokens on path C (Release) */}
        <circle r="4" fill="#AFA9EC">
          <animateMotion dur="3s" repeatCount="indefinite" begin="2s">
            <mpath href="#mp-c" />
          </animateMotion>
          <animate attributeName="opacity" values="0;1;1;0" keyTimes="0;0.15;0.85;1" dur="3s" repeatCount="indefinite" begin="2s" />
        </circle>

        {/* Escrow node (top center, larger) */}
        <g transform="translate(180, 60)">
          <circle r="44" fill="none" stroke="rgba(103,232,249,0.18)" strokeWidth="1" strokeDasharray="2 5" />
          <circle r="36" fill="url(#mp-node-strong)" stroke="rgba(103,232,249,0.55)" strokeWidth="1" />
          <text textAnchor="middle" dy="-2" fill="white" fontSize="12" fontWeight="500" fontFamily="var(--font-sans), sans-serif">Escrow</text>
          <text textAnchor="middle" dy="12" fill="rgba(103,232,249,0.75)" fontSize="8" fontFamily="ui-monospace, monospace" letterSpacing="2">ON ARC</text>
        </g>

        {/* Freelancer / Creator (bottom left) */}
        <g transform="translate(60, 220)">
          <circle r="28" fill="url(#mp-node)" stroke="rgba(103,232,249,0.42)" strokeWidth="1" />
          <text textAnchor="middle" dy="-2" fill="white" fontSize="10" fontWeight="500" fontFamily="var(--font-sans), sans-serif">Freelancer</text>
          <text textAnchor="middle" dy="11" fill="rgba(103,232,249,0.75)" fontSize="8" fontFamily="ui-monospace, monospace" letterSpacing="1.5">/ CREATOR</text>
        </g>

        {/* Client (bottom right) */}
        <g transform="translate(300, 220)">
          <circle r="28" fill="url(#mp-node)" stroke="rgba(103,232,249,0.42)" strokeWidth="1" />
          <text textAnchor="middle" dy="3" fill="white" fontSize="11" fontWeight="500" fontFamily="var(--font-sans), sans-serif">Client</text>
        </g>
      </svg>
      <div className="mt-5 grid grid-cols-3 gap-2 font-mono uppercase tracking-[0.16em] text-[10px] text-txt-mute">
        <span>01 Â· Listing</span>
        <span className="text-center">02 Â· Funds</span>
        <span className="text-right">03 Â· Release</span>
      </div>
    </div>
  );
}
