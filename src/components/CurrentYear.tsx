'use client';

import { useEffect, useState } from 'react';

export function CurrentYear() {
  const [year, setYear] = useState<number | null>(null);

  useEffect(() => {
    setYear(new Date().getFullYear());
  }, []);

  if (year === null) return <span>2026</span>;

  return <>{year}</>;
}