'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';

interface HeroAuthButtonProps {
  loginText: string;
  accountText: string;
}

export function HeroAuthButton({ loginText, accountText }: HeroAuthButtonProps) {
  const params = useParams();
  const locale = (params?.locale as string) || 'en';
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const res = await fetch(`/api/auth/check?t=${Date.now()}`, { cache: 'no-store' });
        if (res.ok) {
          const data = await res.json();
          setIsAuthenticated(data.authenticated === true);
        } else {
          setIsAuthenticated(false);
        }
      } catch {
        setIsAuthenticated(false);
      }
    };
    checkAuth();

    const handleAuthChange = () => checkAuth();
    window.addEventListener('auth-changed', handleAuthChange);
    return () => window.removeEventListener('auth-changed', handleAuthChange);
  }, []);

  if (isAuthenticated === null) {
    return (
      <div className="inline-flex items-center justify-center px-7 py-3.5 text-sm font-medium text-stone-400 border border-stone-200 rounded-md">
        <div className="w-16 h-4 bg-stone-100 rounded animate-pulse" />
      </div>
    );
  }

  if (isAuthenticated) {
    return (
      <Link
        href={`/${locale}/account`}
        className="inline-flex items-center justify-center px-7 py-3.5 text-sm font-medium text-stone-700 border border-stone-300 rounded-md hover:bg-stone-50 transition-all"
      >
        <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
        </svg>
        {accountText}
      </Link>
    );
  }

  return (
    <Link
      href={`/${locale}/login`}
      className="inline-flex items-center justify-center px-7 py-3.5 text-sm font-medium text-stone-700 border border-stone-300 rounded-md hover:bg-stone-50 transition-all"
    >
      {loginText}
    </Link>
  );
}
