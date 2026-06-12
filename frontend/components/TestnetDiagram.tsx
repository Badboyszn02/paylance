'use client';

const NODES = [
  { n: '01', label: 'Wallet' },
  { n: '02', label: 'Arc' },
  { n: '03', label: 'USDC' },
  { n: '04', label: 'Listing' },
  { n: '05', label: 'Settle' },
];

const VB_W = 220;
const PAD_TOP = 40;
const GAP = 110;
const R = 26;
const R_OUTER = 34;

export default function TestnetDiagram() {
  const H = PAD_TOP + GAP * (NODES.length - 1) + R + 20;
  const cx = VB_W / 2;
  const cys = NODES.map((_, i) => PAD_TOP + i * GAP);

  const fullPath =
    `M ${cx} ${cys[0] + R} ` +
    cys.slice(1).map((y) => `L ${cx} ${y - R}`).join(' ');

  return (
    <div className="relative w-full mx-auto" style={{ maxWidth: 220 }}>
      <svg viewBox={`0 0 ${VB_W} ${H}`} className="w-full h-auto" aria-hidden>
        <defs>
          <path id="tn-trail" d={fullPath} />
          <radialGradient id="tn-node" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="rgba(103,232,249,0.22)" />
            <stop offset="100%" stopColor="rgba(8,145,178,0.03)" />
          </radialGradient>
        </defs>

        {/* connectors (dashed) between every adjacent pair */}
        {cys.slice(0, -1).map((y, i) => (
          <line
            key={i}
            x1={cx} y1={y + R}
            x2={cx} y2={cys[i + 1] - R}
            stroke="rgba(255,255,255,0.18)"
            strokeWidth="1"
            strokeDasharray="3 4"
          />
        ))}

        {/* flowing token along the full path */}
        <circle r="4" fill="#AFA9EC">
          <animateMotion dur="6s" repeatCount="indefinite" rotate="auto">
            <mpath href="#tn-trail" />
          </animateMotion>
          <animate attributeName="opacity" values="0;1;1;0" keyTimes="0;0.1;0.9;1" dur="6s" repeatCount="indefinite" />
        </circle>
        <circle r="3" fill="#AFA9EC">
          <animateMotion dur="6s" repeatCount="indefinite" begin="3s">
            <mpath href="#tn-trail" />
          </animateMotion>
          <animate attributeName="opacity" values="0;0.6;0.6;0" keyTimes="0;0.1;0.9;1" dur="6s" repeatCount="indefinite" begin="3s" />
        </circle>

        {/* nodes */}
        {NODES.map((node, i) => (
          <g key={node.n} transform={`translate(${cx}, ${cys[i]})`}>
            {/* outer dashed halo on first and last for emphasis */}
            {(i === 0 || i === NODES.length - 1) && (
              <circle r={R_OUTER} fill="none" stroke="rgba(103,232,249,0.18)" strokeWidth="1" strokeDasharray="2 5" />
            )}
            <circle r={R} fill="url(#tn-node)" stroke="rgba(103,232,249,0.45)" strokeWidth="1" />
            <text
              textAnchor="middle"
              dy="-3"
              fill="rgba(103,232,249,0.85)"
              fontSize="9"
              fontFamily="ui-monospace, monospace"
              letterSpacing="2"
            >
              {node.n}
            </text>
            <text
              textAnchor="middle"
              dy="12"
              fill="white"
              fontSize="11"
              fontWeight="500"
              fontFamily="var(--font-sans), sans-serif"
            >
              {node.label}
            </text>
          </g>
        ))}
      </svg>
    </div>
  );
}
