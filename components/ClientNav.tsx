'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useParams, useRouter, usePathname } from 'next/navigation';

interface ClientNavProps {
  translations: {
    home: string;
    browse: string;
    chat: string;
    calculator: string;
    threeDGen: string;
    account: string;
    login: string;
    logout: string;
  };
  features: {
    chatbot: boolean;
    calculator: boolean;
    '3d-reconstruction': boolean;
  };
  loginRequiredText: string;
  loginRequiredDesc: string;
  signInNowText: string;
  createAccountText: string;
}

export function ClientNav({ translations, features, loginRequiredText, loginRequiredDesc, signInNowText, createAccountText }: ClientNavProps) {
  const params = useParams();
  const router = useRouter();
  const pathname = usePathname();
  const locale = (params?.locale as string) || 'en';
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [pendingRedirect, setPendingRedirect] = useState('');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const res = await fetch('/api/client/account');
        setIsAuthenticated(res.ok);
      } catch {
        setIsAuthenticated(false);
      }
    };
    checkAuth();
  }, []);

  const handleProtectedClick = useCallback((e: React.MouseEvent, href: string) => {
    if (isAuthenticated === false) {
      e.preventDefault();
      setPendingRedirect(href);
      setShowLoginModal(true);
    }
  }, [isAuthenticated]);

  const isActive = (path: string) => pathname === `/${locale}${path}` || pathname === `/${locale}${path}/`;

  const navLinkClass = (path: string) =>
    `text-[13px] font-medium tracking-wide uppercase transition-colors duration-200 ${
      isActive(path)
        ? 'text-stone-900 border-b-2 border-amber-700 pb-0.5'
        : 'text-stone-500 hover:text-stone-900'
    }`;

  return (
    <>
      {/* Desktop Nav */}
      <nav className="hidden lg:flex items-center gap-8">
        <Link href={`/${locale}`} className={navLinkClass('')}>
          {translations.home}
        </Link>
        <Link href={`/${locale}/browse`} className={navLinkClass('/browse')}>
          {translations.browse}
        </Link>
        {features.chatbot && (
          <Link
            href={`/${locale}/chat`}
            className={navLinkClass('/chat')}
            onClick={(e) => handleProtectedClick(e, `/${locale}/chat`)}
          >
            {translations.chat}
          </Link>
        )}
        {features.calculator && (
          <Link
            href={`/${locale}/calculator`}
            className={navLinkClass('/calculator')}
            onClick={(e) => handleProtectedClick(e, `/${locale}/calculator`)}
          >
            {translations.calculator}
          </Link>
        )}
        {features['3d-reconstruction'] && (
          <Link
            href={`/${locale}/3d-gen`}
            className={navLinkClass('/3d-gen')}
            onClick={(e) => handleProtectedClick(e, `/${locale}/3d-gen`)}
          >
            {translations.threeDGen}
          </Link>
        )}
      </nav>

      {/* Auth Button */}
      <div className="hidden lg:flex items-center">
        {isAuthenticated === null ? (
          <div className="w-20 h-8 bg-stone-100 rounded animate-pulse" />
        ) : isAuthenticated ? (
          <Link
            href={`/${locale}/account`}
            className="inline-flex items-center gap-2 px-4 py-2 text-[13px] font-medium text-stone-700 hover:text-stone-900 border border-stone-200 rounded-md hover:border-stone-300 transition-all"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
            {translations.account}
          </Link>
        ) : (
          <Link
            href={`/${locale}/login`}
            className="inline-flex items-center px-5 py-2 text-[13px] font-medium text-white bg-stone-900 rounded-md hover:bg-stone-800 transition-all"
          >
            {translations.login}
          </Link>
        )}
      </div>

      {/* Mobile Menu Button */}
      <button
        className="lg:hidden p-2 text-stone-600 hover:text-stone-900"
        onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
      >
        {mobileMenuOpen ? (
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        ) : (
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        )}
      </button>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="absolute top-full left-0 right-0 bg-white border-b border-stone-200 shadow-lg lg:hidden z-50">
          <div className="px-4 py-4 space-y-3">
            <Link href={`/${locale}`} className="block text-sm font-medium text-stone-700 hover:text-amber-700 py-2" onClick={() => setMobileMenuOpen(false)}>
              {translations.home}
            </Link>
            <Link href={`/${locale}/browse`} className="block text-sm font-medium text-stone-700 hover:text-amber-700 py-2" onClick={() => setMobileMenuOpen(false)}>
              {translations.browse}
            </Link>
            {features.chatbot && (
              <Link href={`/${locale}/chat`} className="block text-sm font-medium text-stone-700 hover:text-amber-700 py-2"
                onClick={(e) => { handleProtectedClick(e, `/${locale}/chat`); setMobileMenuOpen(false); }}>
                {translations.chat}
              </Link>
            )}
            {features.calculator && (
              <Link href={`/${locale}/calculator`} className="block text-sm font-medium text-stone-700 hover:text-amber-700 py-2"
                onClick={(e) => { handleProtectedClick(e, `/${locale}/calculator`); setMobileMenuOpen(false); }}>
                {translations.calculator}
              </Link>
            )}
            {features['3d-reconstruction'] && (
              <Link href={`/${locale}/3d-gen`} className="block text-sm font-medium text-stone-700 hover:text-amber-700 py-2"
                onClick={(e) => { handleProtectedClick(e, `/${locale}/3d-gen`); setMobileMenuOpen(false); }}>
                {translations.threeDGen}
              </Link>
            )}
            <div className="border-t border-stone-100 pt-3">
              {isAuthenticated ? (
                <Link href={`/${locale}/account`} className="block text-sm font-medium text-stone-700 hover:text-amber-700 py-2" onClick={() => setMobileMenuOpen(false)}>
                  {translations.account}
                </Link>
              ) : (
                <Link href={`/${locale}/login`} className="block text-sm font-medium text-amber-700 py-2" onClick={() => setMobileMenuOpen(false)}>
                  {translations.login}
                </Link>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Login Required Modal */}
      {showLoginModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-sm" onClick={() => setShowLoginModal(false)}>
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full mx-4 p-8" onClick={(e) => e.stopPropagation()}>
            <div className="text-center">
              <div className="w-16 h-16 bg-amber-50 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-stone-900 mb-2">{loginRequiredText}</h3>
              <p className="text-sm text-stone-500 mb-6">{loginRequiredDesc}</p>
              <div className="flex flex-col sm:flex-row gap-3">
                <Link
                  href={`/${locale}/login?redirect=${encodeURIComponent(pendingRedirect)}`}
                  className="flex-1 inline-flex items-center justify-center px-5 py-2.5 text-sm font-medium text-white bg-stone-900 rounded-lg hover:bg-stone-800 transition-all"
                  onClick={() => setShowLoginModal(false)}
                >
                  {signInNowText}
                </Link>
                <Link
                  href={`/${locale}/register`}
                  className="flex-1 inline-flex items-center justify-center px-5 py-2.5 text-sm font-medium text-stone-700 border border-stone-200 rounded-lg hover:bg-stone-50 transition-all"
                  onClick={() => setShowLoginModal(false)}
                >
                  {createAccountText}
                </Link>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
