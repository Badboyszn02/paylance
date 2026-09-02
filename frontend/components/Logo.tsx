import Link from 'next/link';

interface Props {
  href?: string;
  className?: string;
}

export default function Logo({ href = '/', className = '' }: Props) {
  const content = (
    <span className={`inline-flex items-center gap-2 ${className}`}>
      <span
        aria-hidden
        className="inline-flex h-6 w-6 items-center justify-center rounded-md bg-purple-accent/15 ring-1 ring-purple-accent/30"
      >
        <span className="h-2 w-2 rounded-sm bg-purple-light" />
      </span>
      <span className="text-[15px] sm:text-base font-semibold tracking-tight">PayLance</span>
    </span>
  );
  return href ? (
    <Link href={href} className="shrink-0 hover:opacity-90 transition-opacity">
      {content}
    </Link>
  ) : (
    content
  );
}
