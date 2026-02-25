'use client';

import { useParams } from 'next/navigation';

/**
 * Hook that returns a function to create locale-prefixed paths.
 * Use this in client components to ensure all internal links include the locale prefix.
 */
export function useLocalePath() {
  const params = useParams();
  const locale = (params?.locale as string) || 'en';

  return (path: string) => `/${locale}${path.startsWith('/') ? path : `/${path}`}`;
}
