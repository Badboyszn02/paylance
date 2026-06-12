'use client';
import { useEffect, useRef, useState } from 'react';

interface Props {
  end: number;
  format?: (n: number) => string;
  duration?: number;
  className?: string;
}

export default function CountUp({ end, format, duration = 1400, className = '' }: Props) {
  const [val, setVal] = useState(0);
  const fromRef = useRef(0);

  useEffect(() => {
    const from = fromRef.current;
    if (from === end) return;
    const start = performance.now();
    let raf = 0;
    const step = (now: number) => {
      const t = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - t, 3);
      const v = from + (end - from) * eased;
      setVal(v);
      if (t < 1) {
        raf = requestAnimationFrame(step);
      } else {
        fromRef.current = end;
        setVal(end);
      }
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [end, duration]);

  return (
    <span className={`tabular-nums ${className}`}>
      {format ? format(val) : Math.round(val).toLocaleString()}
    </span>
  );
}
