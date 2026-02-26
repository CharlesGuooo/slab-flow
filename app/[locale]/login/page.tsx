'use client';

import { useState } from 'react';
import { useRouter, useParams, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { useLocalePath } from '@/lib/hooks/useLocalePath';

type LoginMode = 'customer' | 'merchant';

export default function UnifiedLoginPage() {
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();
  const locale = (params?.locale as string) || 'en';
  const localePath = useLocalePath();
  const t = useTranslations('auth');
  const tNav = useTranslations('nav');
  const [mode, setMode] = useState<LoginMode>('customer');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const redirectTo = searchParams.get('redirect') || localePath('/account');

  // Customer fields
  const [customerEmail, setCustomerEmail] = useState('');
  const [customerPin, setCustomerPin] = useState('');

  // Merchant fields
  const [merchantEmail, setMerchantEmail] = useState('');
  const [merchantPassword, setMerchantPassword] = useState('');

  const handleCustomerLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: customerEmail, pin: customerPin }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || t('loginError'));
        setIsLoading(false);
        return;
      }

      router.push(redirectTo);
    } catch {
      setError(t('loginError'));
      setIsLoading(false);
    }
  };

  const handleMerchantLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const response = await fetch('/api/admin/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: merchantEmail, password: merchantPassword }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || t('loginError'));
        setIsLoading(false);
        return;
      }

      router.push('/admin/dashboard');
    } catch {
      setError(t('loginError'));
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center py-12 px-4 bg-[#faf8f5]">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <svg className="w-12 h-12 text-amber-700 mx-auto mb-4" viewBox="0 0 36 36" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M18 3L33 11V25L18 33L3 25V11L18 3Z" fill="currentColor" fillOpacity="0.08" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round"/>
            <path d="M18 3V33" stroke="currentColor" strokeWidth="0.8" strokeOpacity="0.3"/>
            <path d="M3 11L33 25" stroke="currentColor" strokeWidth="0.8" strokeOpacity="0.3"/>
            <path d="M33 11L3 25" stroke="currentColor" strokeWidth="0.8" strokeOpacity="0.3"/>
          </svg>
          <h1 className="text-2xl font-bold text-stone-900">{t('loginTitle')}</h1>
        </div>

        {/* Mode Switcher */}
        <div className="bg-stone-100 rounded-lg p-1 flex mb-6">
          <button
            type="button"
            onClick={() => { setMode('customer'); setError(''); }}
            className={`flex-1 py-2.5 text-sm font-medium rounded-md transition-all ${
              mode === 'customer' ? 'bg-white text-stone-900 shadow-sm' : 'text-stone-500 hover:text-stone-700'
            }`}
          >
            {t('customerLogin')}
          </button>
          <button
            type="button"
            onClick={() => { setMode('merchant'); setError(''); }}
            className={`flex-1 py-2.5 text-sm font-medium rounded-md transition-all ${
              mode === 'merchant' ? 'bg-white text-stone-900 shadow-sm' : 'text-stone-500 hover:text-stone-700'
            }`}
          >
            {t('merchantLogin')}
          </button>
        </div>

        {/* Description */}
        <p className="text-xs text-stone-400 text-center mb-4">
          {mode === 'customer' ? t('customerDesc') : t('merchantDesc')}
        </p>

        {/* Login Form Card */}
        <div className="bg-white rounded-xl border border-stone-100 shadow-sm p-6">
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-100 rounded-lg">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          {mode === 'customer' ? (
            <form onSubmit={handleCustomerLogin} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-stone-700 mb-1.5">{t('email')}</label>
                <input
                  type="email"
                  value={customerEmail}
                  onChange={(e) => setCustomerEmail(e.target.value)}
                  required
                  className="w-full px-4 py-3 bg-[#faf8f5] border border-stone-200 rounded-lg text-stone-900 placeholder-stone-400 focus:outline-none focus:ring-1 focus:ring-amber-300 focus:border-amber-300 transition-all text-sm"
                  placeholder="your@email.com"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-stone-700 mb-1.5">{t('pin')}</label>
                <input
                  type="text"
                  value={customerPin}
                  onChange={(e) => setCustomerPin(e.target.value)}
                  maxLength={6}
                  required
                  className="w-full px-4 py-3 bg-[#faf8f5] border border-stone-200 rounded-lg text-stone-900 placeholder-stone-400 focus:outline-none focus:ring-1 focus:ring-amber-300 focus:border-amber-300 transition-all text-sm tracking-[0.3em] text-center font-mono"
                  placeholder="------"
                />
              </div>
              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3 px-4 bg-stone-900 hover:bg-stone-800 text-white text-sm font-medium rounded-lg transition-all disabled:opacity-50"
              >
                {isLoading ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"/>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                    </svg>
                    ...
                  </span>
                ) : (
                  tNav('login')
                )}
              </button>
              <p className="text-center text-sm text-stone-500">
                {tNav('register')}?{' '}
                <Link href={localePath('/register')} className="text-amber-700 hover:text-amber-800 font-medium">
                  {tNav('register')}
                </Link>
              </p>
            </form>
          ) : (
            <form onSubmit={handleMerchantLogin} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-stone-700 mb-1.5">{t('email')}</label>
                <input
                  type="email"
                  value={merchantEmail}
                  onChange={(e) => setMerchantEmail(e.target.value)}
                  required
                  className="w-full px-4 py-3 bg-[#faf8f5] border border-stone-200 rounded-lg text-stone-900 placeholder-stone-400 focus:outline-none focus:ring-1 focus:ring-amber-300 focus:border-amber-300 transition-all text-sm"
                  placeholder="admin@yourcompany.com"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-stone-700 mb-1.5">{t('password')}</label>
                <input
                  type="password"
                  value={merchantPassword}
                  onChange={(e) => setMerchantPassword(e.target.value)}
                  required
                  className="w-full px-4 py-3 bg-[#faf8f5] border border-stone-200 rounded-lg text-stone-900 placeholder-stone-400 focus:outline-none focus:ring-1 focus:ring-amber-300 focus:border-amber-300 transition-all text-sm"
                  placeholder="Enter your password"
                />
              </div>
              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3 px-4 bg-stone-900 hover:bg-stone-800 text-white text-sm font-medium rounded-lg transition-all disabled:opacity-50"
              >
                {isLoading ? '...' : t('merchantLogin')}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
