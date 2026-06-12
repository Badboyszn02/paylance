import Link from 'next/link';
import type { ReactNode } from 'react';

function IconLink({ href, label, children }: { href: string; label: string; children: ReactNode }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      aria-label={label}
      title={label}
      className="text-txt-dim hover:text-white inline-flex items-center justify-center w-9 h-9 rounded-md hover:bg-white/[0.04]"
    >
      {children}
    </a>
  );
}

const ICONS = {
  x: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M18.244 2H21.5l-7.5 8.567L22.5 22h-6.563l-5.14-6.72L4.94 22H1.68l8.04-9.183L1.5 2h6.72l4.65 6.146L18.244 2zm-1.15 18h1.8L7.02 4H5.13l11.964 16z"/></svg>
  ),
  discord: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M20.317 4.37a19.79 19.79 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028c.462-.63.873-1.295 1.226-1.994a.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128c.126-.094.252-.192.372-.291a.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.099.246.197.373.291a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.893.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.84 19.84 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.331c-1.182 0-2.157-1.086-2.157-2.42 0-1.332.956-2.418 2.157-2.418 1.21 0 2.176 1.096 2.157 2.418 0 1.334-.956 2.42-2.157 2.42zm7.974 0c-1.18 0-2.156-1.086-2.156-2.42 0-1.332.955-2.418 2.156-2.418 1.21 0 2.176 1.096 2.157 2.418 0 1.334-.946 2.42-2.157 2.42z"/></svg>
  ),
  github: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M12 .5C5.73.5.5 5.73.5 12c0 5.08 3.29 9.39 7.86 10.91.58.1.79-.25.79-.55v-2.02c-3.2.69-3.87-1.36-3.87-1.36-.52-1.32-1.27-1.67-1.27-1.67-1.04-.71.08-.7.08-.7 1.15.08 1.76 1.18 1.76 1.18 1.02 1.74 2.67 1.24 3.32.95.1-.74.4-1.24.72-1.53-2.55-.29-5.24-1.27-5.24-5.66 0-1.25.45-2.27 1.18-3.07-.12-.29-.51-1.46.11-3.04 0 0 .96-.31 3.15 1.17a10.97 10.97 0 0 1 5.73 0c2.19-1.48 3.15-1.17 3.15-1.17.62 1.58.23 2.75.11 3.04.74.8 1.18 1.82 1.18 3.07 0 4.4-2.7 5.36-5.27 5.65.41.36.78 1.06.78 2.14v3.17c0 .31.21.66.8.55C20.21 21.38 23.5 17.08 23.5 12 23.5 5.73 18.27.5 12 .5z"/></svg>
  ),
  telegram: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/></svg>
  ),
  mail: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="5" width="18" height="14" rx="2"/><path d="M3 7l9 6 9-6"/></svg>
  ),
};

const DOCS = [
  { href: '/docs', label: 'Docs' },
  { href: '/docs/terms', label: 'Terms' },
  { href: '/docs/privacy', label: 'Privacy' },
];

export default function Footer() {
  return (
    <footer className="mt-20 sm:mt-24 py-10">
      <div className="max-w-container mx-auto px-5 flex flex-col gap-8 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="text-xs uppercase tracking-wider text-txt-mute mb-3">Community</div>
          <div className="flex items-center gap-1 -ml-2">
            <IconLink href="https://x.com/paylance" label="X (Twitter)">{ICONS.x}</IconLink>
            <IconLink href="https://discord.gg/paylance" label="Discord">{ICONS.discord}</IconLink>
            <IconLink href="https://github.com/paylance" label="GitHub">{ICONS.github}</IconLink>
            <IconLink href="https://t.me/paylance" label="Telegram">{ICONS.telegram}</IconLink>
          </div>
        </div>

        <div>
          <div className="text-xs uppercase tracking-wider text-txt-mute mb-3">Contact</div>
          <span className="text-txt-mute inline-flex items-center w-9 h-9 justify-center">{ICONS.mail}</span>
        </div>

        <div>
          <div className="text-xs uppercase tracking-wider text-txt-mute mb-3">Resources</div>
          <ul className="flex flex-col gap-2 text-sm">
            {DOCS.map((d) => (
              <li key={d.href}>
                <Link href={d.href} className="text-txt-dim hover:text-white">{d.label}</Link>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="max-w-container mx-auto px-5 mt-8 flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between text-xs text-txt-mute">
        <div>© {new Date().getFullYear()} PayLance · Built on Arc</div>
        <div className="flex items-center gap-2">
          <span className="w-1.5 h-1.5 rounded-full bg-ok" />
          Arc
        </div>
      </div>
    </footer>
  );
}
