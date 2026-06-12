import Link from 'next/link';

interface Props {
  href?: string;
  className?: string;
}

export default function Logo({ href = '/', className = '' }: Props) {
  const content = (
    <span className={`inline-flex items-center font-medium ${className}`}>
      <span className="text-lg tracking-tight">PayLance</span>
    </span>
  );
  return href ? <Link href={href}>{content}</Link> : content;
}
