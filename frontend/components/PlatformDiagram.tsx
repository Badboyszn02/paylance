'use client';

// Vertical 4-step flow illustration for the home hero; same visual language as the other diagrams.

interface Node {
  n: string;
  label: string;
  sub: string;
  emphasis?: boolean;
}

const NODES: Node[] = [
  { n: '01', label: 'Post', sub: 'Hirer sets the price' },
  { n: '02', label: 'Agree', sub: 'Both confirm the offer' },
  { n: '03', label: 'Fund', sub: 'USDC locks in escrow', emphasis: true },
  { n: '04', label: 'Release', sub: 'Both sides satisfied' },
];

const VB_W = 320;
const PAD_TOP = 56;
const GAP = 130;
const R = 28;
const R_OUTER = 38;
const CX = 90; // node column on the left, labels on the right

export default function PlatformDiagram() {
  const H = PAD_TOP + GAP * (NODES.length - 1) + R + 32;
  const cys = NODES.map((_, i) => PAD_TOP + i * GAP);

  const fullPath =
    `M ${CX} ${cys[0] + R} ` +
    cys.slice(1).map((y) => `L ${CX} ${y - R}`).join(' ');

  return (
    <div className="relative w-full mx-auto" style={{ maxWidth: 340 }}>
      <svg viewBox={`0 0 ${VB_W} ${H}`} className="w-full h-auto" aria-hidden>
        <defs>
          <path id="pd-trail" d={fullPath} />
          <radialGradient id="pd-node" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="rgba(103,232,249,0.22)" />
            <stop offset="100%" stopColor="rgba(8,145,178,0.03)" />
          </radialGradient>
          <radialGradient id="pd-node-strong" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="rgba(103,232,249,0.36)" />
            <stop offset="100%" stopColor="rgba(8,145,178,0.05)" />
          </radialGradient>
        </defs>

        {/* dashed connectors between adjacent nodes */}
        {cys.slice(0, -1).map((y, i) => (
          <line
            key={i}
            x1={CX} y1={y + R}
            x2={CX} y2={cys[i + 1] - R}
            stroke="rgba(255,255,255,0.16)"
            strokeWidth="1"
            strokeDasharray="3 4"
          />
        ))}

        {/* two tokens flowing top to bottom, staggered for continuous motion */}
        <circle r="4.5" fill="#67E8F9">
          <animateMotion dur="5.2s" repeatCount="indefinite" rotate="auto">
            <mpath href="#pd-trail" />
          </animateMotion>
          <animate
            attributeName="opacity"
            values="0;1;1;0"
            keyTimes="0;0.08;0.92;1"
            dur="5.2s"
            repeatCount="indefinite"
          />
        </circle>
        <circle r="3.5" fill="#67E8F9">
          <animateMotion dur="5.2s" repeatCount="indefinite" begin="2.6s">
            <mpath href="#pd-trail" />
          </animateMotion>
          <animate
            attributeName="opacity"
            values="0;0.7;0.7;0"
            keyTimes="0;0.08;0.92;1"
            dur="5.2s"
            repeatCount="indefinite"
            begin="2.6s"
          />
        </circle>

        {/* nodes + labels */}
        {NODES.map((node, i) => {
          const cy = cys[i];
          const strong = node.emphasis;
          return (
            <g key={node.n}>
              {(i === 0 || i === NODES.length - 1 || strong) && (
                <circle
                  cx={CX}
                  cy={cy}
                  r={R_OUTER}
                  fill="none"
                  stroke="rgba(103,232,249,0.18)"
                  strokeWidth="1"
                  strokeDasharray="2 5"
                />
              )}
              <circle
                cx={CX}
                cy={cy}
                r={R}
                fill={`url(#pd-${strong ? 'node-strong' : 'node'})`}
                stroke="rgba(103,232,249,0.5)"
                strokeWidth="1"
              />
              {strong && (
                <circle
                  cx={CX}
                  cy={cy}
                  r={R}
                  fill="none"
                  stroke="rgba(103,232,249,0.55)"
                  strokeWidth="1.4"
                  opacity="0"
                >
                  <animate
                    attributeName="r"
                    values={`${R};${R + 10}`}
                    dur="3.4s"
                    repeatCount="indefinite"
                  />
                  <animate
                    attributeName="opacity"
                    values="0.5;0"
                    dur="3.4s"
                    repeatCount="indefinite"
                  />
                </circle>
              )}
              <text
                x={CX}
                y={cy - 2}
                textAnchor="middle"
                fill="rgba(103,232,249,0.85)"
                fontSize="9"
                fontFamily="ui-monospace, monospace"
                letterSpacing="2"
              >
                {node.n}
              </text>
              <text
                x={CX}
                y={cy + 13}
                textAnchor="middle"
                fill="white"
                fontSize="12"
                fontWeight="500"
                fontFamily="var(--font-sans), sans-serif"
              >
                {node.label}
              </text>

              {/* right-side description */}
              <text
                x={CX + R + 22}
                y={cy - 2}
                fill="white"
                fontSize="13"
                fontWeight="500"
                fontFamily="var(--font-sans), sans-serif"
              >
                {node.label}
                {strong && (
                  <tspan
                    x={CX + R + 22}
                    dy="13"
                    fill="rgba(103,232,249,0.8)"
                    fontSize="9"
                    fontFamily="ui-monospace, monospace"
                    letterSpacing="2"
                  >
                    ESCROW ON ARC
                  </tspan>
                )}
              </text>
              <text
                x={CX + R + 22}
                y={cy + (strong ? 27 : 14)}
                fill="rgba(255,255,255,0.5)"
                fontSize="11"
                fontFamily="var(--font-sans), sans-serif"
              >
                {node.sub}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}
