'use client';

import { useRouter } from 'next/navigation';

export function PlatformLogoutButton() {
  const router = useRouter();

  const handleLogout = async () => {
    try {
      await fetch('/api/platform-admin/auth/logout', { method: 'POST' });
    } catch (error) {
      console.error('Logout error:', error);
    }
    // Always redirect to login page regardless of API response
    router.push('/platform-admin/login');
  };

  return (
    <button
      onClick={handleLogout}
      className="text-sm text-slate-400 hover:text-white px-3 py-1.5 rounded-lg hover:bg-white/5 transition-all"
    >
      Sign out
    </button>
  );
}
