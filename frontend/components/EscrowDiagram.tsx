'use client';

export default function EscrowDiagram({ compact = false }: { compact?: boolean }) {
  const H = compact ? 380 : 540;
  const yClient = compact ? 48 : 60;
  const yEscrow = compact ? 190 : 262;
  const yFreelancer = compact ? 332 : 464;
  const rClient = compact ? 28 : 36;
  const rEscrow = compact ? 38 : 48;
  const rEscrowOuter = compact ? 46 : 56;
  const labelY1 = (yClient + yEscrow) / 2 + 4;
  const labelY2 = (yEscrow + yFreelancer) / 2 + 4;
  const tokenR1 = compact ? 4 : 5;
  const tokenR2 = compact ? 3 : 4;
  const maxW = compact ? 240 : 360;
  const fontMain = compact ? 11 : 13;
  const fontEscrow = compact ? 12 : 14;
  const fontSub = compact ? 8 : 9;
  const fontLabel = compact ? 9 : 10;
  const uid = compact ? 'edc' : 'ed';
  const path1Id = `${uid}-path-1`;
  const path2Id = `${uid}-path-2`;
  const nodeId = `${uid}-node`;
  const nodeStrongId = `${uid}-node-strong`;
  const path1D = `M 160 ${yClient + rClient} L 160 ${yEscrow - rEscrow}`;
  const path2D = `M 160 ${yEscrow + rEscrow} L 160 ${yFreelancer - rClient}`;

  return (
    <div className="relative w-full mx-auto" style={{ maxWidth: maxW }}>
      <svg viewBox={`0 0 320 ${H}`} className="w-full h-auto" aria-hidden>
        <defs>
          <path id={path1Id} d={path1D} />
          <path id={path2Id} d={path2D} />
          <radialGradient id={nodeId} cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="rgba(103,232,249,0.22)" />
            <stop offset="100%" stopColor="rgba(8,145,178,0.03)" />
          </radialGradient>
          <radialGradient id={nodeStrongId} cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="rgba(103,232,249,0.32)" />
            <stop offset="100%" stopColor="rgba(8,145,178,0.05)" />
          </radialGradient>
        </defs>

        <use href={`#${path1Id}`} stroke="rgba(255,255,255,0.18)" strokeWidth="1" strokeDasharray="3 4" fill="none" />
        <use href={`#${path2Id}`} stroke="rgba(255,255,255,0.18)" strokeWidth="1" strokeDasharray="3 4" fill="none" />

        <text x="178" y={labelY1} fill="rgba(103,232,249,0.75)" fontSize={fontLabel} fontFamily="ui-monospace, monospace" letterSpacing="2">
          01 Â· LOCK USDC
        </text>
        <text x="178" y={labelY2} fill="rgba(103,232,249,0.75)" fontSize={fontLabel} fontFamily="ui-monospace, monospace" letterSpacing="2">
          02 Â· RELEASE
        </text>

        <circle r={tokenR1} fill="#AFA9EC">
          <animateMotion dur="2.6s" repeatCount="indefinite" rotate="auto">
            <mpath href={`#${path1Id}`} />
          </animateMotion>
          <animate attributeName="opacity" values="0;1;1;0" keyTimes="0;0.15;0.85;1" dur="2.6s" repeatCount="indefinite" />
        </circle>
        <circle r={tokenR2} fill="#AFA9EC">
          <animateMotion dur="2.6s" repeatCount="indefinite" begin="1.3s">
            <mpath href={`#${path1Id}`} />
          </animateMotion>
          <animate attributeName="opacity" values="0;0.7;0.7;0" keyTimes="0;0.15;0.85;1" dur="2.6s" repeatCount="indefinite" begin="1.3s" />
        </circle>

        <circle r={tokenR1} fill="#AFA9EC">
          <animateMotion dur="2.6s" repeatCount="indefinite" begin="0.6s">
            <mpath href={`#${path2Id}`} />
          </animateMotion>
          <animate attributeName="opacity" values="0;1;1;0" keyTimes="0;0.15;0.85;1" dur="2.6s" repeatCount="indefinite" begin="0.6s" />
        </circle>
        <circle r={tokenR2} fill="#AFA9EC">
          <animateMotion dur="2.6s" repeatCount="indefinite" begin="1.9s">
            <mpath href={`#${path2Id}`} />
          </animateMotion>
          <animate attributeName="opacity" values="0;0.7;0.7;0" keyTimes="0;0.15;0.85;1" dur="2.6s" repeatCount="indefinite" begin="1.9s" />
        </circle>

        <g transform={`translate(160, ${yClient})`}>
          <circle r={rClient} fill={`url(#${nodeId})`} stroke="rgba(103,232,249,0.42)" strokeWidth="1" />
          <text textAnchor="middle" dy="5" fill="white" fontSize={fontMain} fontWeight="500" fontFamily="var(--font-sans), sans-serif">Client</text>
        </g>

        <g transform={`translate(160, ${yEscrow})`}>
          <circle r={rEscrow} fill={`url(#${nodeStrongId})`} stroke="rgba(103,232,249,0.55)" strokeWidth="1" />
          <circle r={rEscrowOuter} fill="none" stroke="rgba(103,232,249,0.18)" strokeWidth="1" strokeDasharray="2 5" />
          <text textAnchor="middle" dy="-2" fill="white" fontSize={fontEscrow} fontWeight="500" fontFamily="var(--font-sans), sans-serif">Escrow</text>
          <text textAnchor="middle" dy="14" fill="rgba(103,232,249,0.75)" fontSize={fontSub} fontFamily="ui-monospace, monospace" letterSpacing="2">ON ARC</text>
        </g>

        <g transform={`translate(160, ${yFreelancer})`}>
          <circle r={rClient} fill={`url(#${nodeId})`} stroke="rgba(103,232,249,0.42)" strokeWidth="1" />
          <text textAnchor="middle" dy="5" fill="white" fontSize={fontMain} fontWeight="500" fontFamily="var(--font-sans), sans-serif">Freelancer</text>
        </g>
      </svg>
      {!compact && (
        <div className="mt-2 grid grid-cols-3 gap-2 font-mono uppercase tracking-[0.16em] text-[10px] text-txt-mute">
          <span>Funds the job</span>
          <span className="text-center">Holds in contract</span>
          <span className="text-right">Receives on release</span>
        </div>
      )}
    </div>
  );
}
