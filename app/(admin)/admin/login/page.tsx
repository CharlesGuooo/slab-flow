'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, Building2 } from 'lucide-react';

export default function TenantAdminLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [tenantInfo, setTenantInfo] = useState<{
    id: number;
    name: string;
    active: boolean;
  } | null>(null);

  // Fetch tenant info on mount
  useEffect(() => {
    const fetchTenantInfo = async () => {
      try {
        const response = await fetch('/api/admin/tenant-info');
        if (response.ok) {
          const data = await response.json();
          setTenantInfo(data);
        }
      } catch (err) {
        console.error('Failed to fetch tenant info:', err);
      }
    };
    fetchTenantInfo();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const response = await fetch('/api/admin/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Login failed');
        setIsLoading(false);
        return;
      }

      // Redirect to dashboard on success
      router.push('/admin/dashboard');
    } catch (err) {
      setError('An error occurred. Please try again.');
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <div className="flex justify-center">
            <Building2 className="h-12 w-12 text-gray-400" />
          </div>
          <h1 className="mt-4 text-center text-3xl font-bold text-gray-900">
            {tenantInfo?.name || 'Tenant Admin'}
          </h1>
          <h2 className="mt-2 text-center text-xl font-semibold text-gray-600">
            Admin Portal
          </h2>
          <p className="mt-2 text-center text-sm text-gray-500">
            Sign in to manage your business
          </p>
        </div>

        {!tenantInfo?.active && tenantInfo && (
          <div className="rounded-md bg-yellow-50 p-4 border border-yellow-200">
            <p className="text-sm text-yellow-700">
              Your service is currently suspended. You can still log in to view your account.
            </p>
          </div>
        )}

        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="rounded-md shadow-sm -space-y-px">
            <div>
              <label htmlFor="email" className="sr-only">
                Email address
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                className="appearance-none rounded-none relative block w-full px-3 py-3 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-t-md focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent focus:z-10 text-base"
                placeholder="Email address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div>
              <label htmlFor="password" className="sr-only">
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
                className="appearance-none rounded-none relative block w-full px-3 py-3 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-b-md focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent focus:z-10 text-base"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
          </div>

          {error && (
            <div className="rounded-md bg-red-50 p-4">
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}

          <div>
            <button
              type="submit"
              disabled={isLoading}
              className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-base font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isLoading ? (
                <>
                  <Loader2 className="animate-spin -ml-1 mr-2 h-5 w-5" />
                  Signing in...
                </>
              ) : (
                'Sign in'
              )}
            </button>
          </div>
        </form>

        <div className="text-center">
          <a
            href="/"
            className="text-sm text-gray-500 hover:text-gray-700 transition-colors"
          >
            &larr; Back to home
          </a>
        </div>
      </div>
    </div>
  );
}
