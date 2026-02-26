'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useLocalePath } from '@/lib/hooks/useLocalePath';

type LoginMode = 'customer' | 'merchant';

export default function UnifiedLoginPage() {
  const router = useRouter();
  const localePath = useLocalePath();
  const [mode, setMode] = useState<LoginMode>('customer');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

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
        setError(data.error || 'Login failed');
        setIsLoading(false);
        return;
      }

      router.push(localePath('/account'));
    } catch (err) {
      setError('An unexpected error occurred');
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
        setError(data.error || 'Login failed');
        setIsLoading(false);
        return;
      }

      router.push('/admin/dashboard');
    } catch (err) {
      setError('An unexpected error occurred');
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center py-12 px-4 bg-gradient-to-b from-stone-50 to-white">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <svg className="w-12 h-12 text-amber-600 mx-auto mb-4" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M4 10L16 4L28 10V22L16 28L4 22V10Z" fill="currentColor" fillOpacity="0.1" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"/>
            <path d="M16 4V28M4 10L28 22M28 10L4 22" stroke="currentColor" strokeWidth="1" strokeOpacity="0.3"/>
          </svg>
          <h1 className="text-2xl font-bold text-stone-900">Welcome Back</h1>
          <p className="mt-2 text-sm text-stone-500">
            Sign in to your account
          </p>
        </div>

        {/* Mode Switcher */}
        <div className="bg-stone-100 rounded-xl p-1 flex mb-6">
          <button
            type="button"
            onClick={() => { setMode('customer'); setError(''); }}
            className={`flex-1 py-2.5 text-sm font-semibold rounded-lg transition-all ${
              mode === 'customer'
                ? 'bg-white text-stone-900 shadow-sm'
                : 'text-stone-500 hover:text-stone-700'
            }`}
          >
            Customer
          </button>
          <button
            type="button"
            onClick={() => { setMode('merchant'); setError(''); }}
            className={`flex-1 py-2.5 text-sm font-semibold rounded-lg transition-all ${
              mode === 'merchant'
                ? 'bg-white text-stone-900 shadow-sm'
                : 'text-stone-500 hover:text-stone-700'
            }`}
          >
            Merchant
          </button>
        </div>

        {/* Login Form Card */}
        <div className="bg-white rounded-2xl shadow-sm border border-stone-200 p-6">
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          {mode === 'customer' ? (
            <form onSubmit={handleCustomerLogin} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-stone-700 mb-1.5">
                  Email Address
                </label>
                <input
                  type="email"
                  value={customerEmail}
                  onChange={(e) => setCustomerEmail(e.target.value)}
                  required
                  className="w-full px-4 py-3 bg-stone-50 border border-stone-200 rounded-xl text-stone-900 placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500/50 transition-all"
                  placeholder="your@email.com"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-stone-700 mb-1.5">
                  6-Digit PIN
                </label>
                <input
                  type="text"
                  value={customerPin}
                  onChange={(e) => setCustomerPin(e.target.value)}
                  maxLength={6}
                  required
                  className="w-full px-4 py-3 bg-stone-50 border border-stone-200 rounded-xl text-stone-900 placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500/50 transition-all"
                  placeholder="123456"
                />
                <p className="mt-1.5 text-xs text-stone-400">
                  Your PIN was sent to your email when you registered
                </p>
              </div>
              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3 px-4 bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-500 hover:to-amber-600 text-white font-semibold rounded-xl transition-all disabled:opacity-50 shadow-sm"
              >
                {isLoading ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"/>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/>
                    </svg>
                    Signing in...
                  </span>
                ) : (
                  'Sign In'
                )}
              </button>
              <p className="text-center text-sm text-stone-500">
                Don&apos;t have an account?{' '}
                <Link href={localePath('/register')} className="text-amber-600 hover:text-amber-700 font-semibold">
                  Register
                </Link>
              </p>
            </form>
          ) : (
            <form onSubmit={handleMerchantLogin} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-stone-700 mb-1.5">
                  Merchant Email
                </label>
                <input
                  type="email"
                  value={merchantEmail}
                  onChange={(e) => setMerchantEmail(e.target.value)}
                  required
                  className="w-full px-4 py-3 bg-stone-50 border border-stone-200 rounded-xl text-stone-900 placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500/50 transition-all"
                  placeholder="admin@yourcompany.com"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-stone-700 mb-1.5">
                  Password
                </label>
                <input
                  type="password"
                  value={merchantPassword}
                  onChange={(e) => setMerchantPassword(e.target.value)}
                  required
                  className="w-full px-4 py-3 bg-stone-50 border border-stone-200 rounded-xl text-stone-900 placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500/50 transition-all"
                  placeholder="Enter your password"
                />
              </div>
              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3 px-4 bg-gradient-to-r from-stone-800 to-stone-900 hover:from-stone-700 hover:to-stone-800 text-white font-semibold rounded-xl transition-all disabled:opacity-50 shadow-sm"
              >
                {isLoading ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"/>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/>
                    </svg>
                    Signing in...
                  </span>
                ) : (
                  'Merchant Sign In'
                )}
              </button>
              <p className="text-center text-xs text-stone-400">
                Merchant accounts are managed by the platform administrator
              </p>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
