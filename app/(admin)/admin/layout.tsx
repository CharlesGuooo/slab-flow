'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  Users,
  Calculator,
  LogOut,
  Menu,
  X,
  ExternalLink,
} from 'lucide-react';

interface AdminLayoutProps {
  children: React.ReactNode;
}

const navigation = [
  { name: 'Dashboard', href: '/admin/dashboard', icon: LayoutDashboard },
  { name: 'Inventory', href: '/admin/inventory', icon: Package },
  { name: 'Orders', href: '/admin/orders', icon: ShoppingCart },
  { name: 'Customers', href: '/admin/customers', icon: Users },
  { name: 'Calculator', href: '/admin/calculator', icon: Calculator },
];

export default function AdminLayout({ children }: AdminLayoutProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [tenantName, setTenantName] = useState('Loading...');
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const response = await fetch('/api/admin/auth/verify');
        if (response.ok) {
          const data = await response.json();
          setTenantName(data.tenantName || 'Admin');
          setIsAuthenticated(true);
        } else {
          router.push('/en/login');
        }
      } catch (error) {
        console.error('Auth check failed:', error);
        router.push('/en/login');
      } finally {
        setIsLoading(false);
      }
    };

    if (pathname === '/admin/login') {
      setIsLoading(false);
      setIsAuthenticated(true);
      return;
    }

    checkAuth();
  }, [pathname, router]);

  const handleLogout = async () => {
    try {
      await fetch('/api/admin/auth/logout', { method: 'POST' });
      router.push('/en/login');
    } catch (error) {
      console.error('Logout failed:', error);
      router.push('/en/login');
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#faf8f5]">
        <div className="flex flex-col items-center gap-3">
          <div className="animate-spin rounded-full h-10 w-10 border-2 border-amber-700 border-t-transparent"></div>
          <p className="text-sm text-stone-500">Loading...</p>
        </div>
      </div>
    );
  }

  if (pathname === '/admin/login') {
    return <>{children}</>;
  }

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="min-h-screen bg-[#faf8f5]">
      {/* Mobile sidebar overlay */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/30 backdrop-blur-sm lg:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-64 bg-stone-900 transform transition-transform duration-300 ease-in-out lg:translate-x-0 ${
          isSidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex flex-col h-full">
          {/* Logo area */}
          <div className="flex items-center justify-between h-16 px-5 border-b border-stone-700/50">
            <Link href="/admin/dashboard" className="flex items-center space-x-3">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/logo.png" alt="Logo" className="h-9 w-auto brightness-0 invert" />
              <span className="text-base font-semibold text-white tracking-wide">{tenantName}</span>
            </Link>
            <button
              onClick={() => setIsSidebarOpen(false)}
              className="lg:hidden p-1.5 rounded-lg text-stone-400 hover:text-white hover:bg-stone-700/50"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-3 py-5 space-y-1 overflow-y-auto">
            <p className="px-3 mb-3 text-[10px] font-semibold uppercase tracking-[0.15em] text-stone-500">
              Management
            </p>
            {navigation.map((item) => {
              const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  onClick={() => setIsSidebarOpen(false)}
                  className={`flex items-center px-3 py-2.5 text-sm font-medium rounded-lg transition-all ${
                    isActive
                      ? 'bg-amber-700/20 text-amber-400'
                      : 'text-stone-400 hover:bg-stone-800 hover:text-stone-200'
                  }`}
                >
                  <item.icon
                    className={`mr-3 h-[18px] w-[18px] flex-shrink-0 ${
                      isActive ? 'text-amber-500' : 'text-stone-500'
                    }`}
                  />
                  {item.name}
                </Link>
              );
            })}
          </nav>

          {/* Bottom actions */}
          <div className="px-3 py-3 space-y-1 border-t border-stone-700/50">
            <Link
              href="/en"
              target="_blank"
              className="flex items-center px-3 py-2.5 text-sm font-medium text-stone-400 rounded-lg hover:bg-stone-800 hover:text-stone-200 transition-all"
            >
              <ExternalLink className="mr-3 h-[18px] w-[18px] text-stone-500" />
              View Storefront
            </Link>
            <button
              onClick={handleLogout}
              className="flex items-center w-full px-3 py-2.5 text-sm font-medium text-stone-400 rounded-lg hover:bg-red-900/30 hover:text-red-400 transition-all"
            >
              <LogOut className="mr-3 h-[18px] w-[18px]" />
              Sign out
            </button>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <div className="lg:pl-64">
        {/* Top bar for mobile */}
        <header className="sticky top-0 z-30 bg-[#faf8f5]/80 backdrop-blur-xl border-b border-stone-200/50 lg:hidden">
          <div className="flex items-center justify-between h-14 px-4">
            <button
              onClick={() => setIsSidebarOpen(true)}
              className="p-2 rounded-lg text-stone-500 hover:text-stone-700 hover:bg-stone-100"
            >
              <Menu className="h-5 w-5" />
            </button>
            <div className="flex items-center gap-2">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/logo.png" alt="Logo" className="h-7 w-auto" />
              <span className="text-sm font-semibold text-stone-900">{tenantName}</span>
            </div>
            <div className="w-10" />
          </div>
        </header>

        {/* Page content */}
        <main className="p-6 lg:p-8">{children}</main>
      </div>
    </div>
  );
}
