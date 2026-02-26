import Link from 'next/link';

export default function HomePage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-8 bg-gradient-to-b from-gray-50 to-gray-100">
      <div className="text-center max-w-3xl">
        <h1 className="text-4xl font-bold mb-2 text-gray-900">Welcome to SlabFlow</h1>
        <p className="text-lg text-gray-600 mb-8">
          Multi-tenant SaaS Platform for Stone Fabrication
        </p>

        {/* Quick Access Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          {/* Platform Admin */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 text-left hover:shadow-md transition-shadow">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">Platform Admin</h3>
                <p className="text-sm text-gray-500">Manage all tenants</p>
              </div>
            </div>
            <Link
              href="/platform-admin/login"
              className="block w-full text-center px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors text-sm"
            >
              Login as Super Admin
            </Link>
          </div>

          {/* Tenant Admin */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 text-left hover:shadow-md transition-shadow">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">Tenant Admin</h3>
                <p className="text-sm text-gray-500">Manage your business</p>
              </div>
            </div>
            <Link
              href="/admin/login"
              className="block w-full text-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm"
            >
              Login as Tenant Admin
            </Link>
          </div>

          {/* Client Portal */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 text-left hover:shadow-md transition-shadow">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                </svg>
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">Client Portal</h3>
                <p className="text-sm text-gray-500">Browse & order stones</p>
              </div>
            </div>
            <Link
              href="/en/browse"
              className="block w-full text-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
            >
              Enter Client Portal
            </Link>
          </div>
        </div>

        {/* Quick Links */}
        <div className="flex flex-wrap justify-center gap-2 mb-6">
          <Link href="/en/browse" className="px-3 py-1 text-sm bg-gray-200 text-gray-700 rounded-full hover:bg-gray-300">
            Browse Stones
          </Link>
          <Link href="/en/chat" className="px-3 py-1 text-sm bg-gray-200 text-gray-700 rounded-full hover:bg-gray-300">
            AI Chat
          </Link>
          <Link href="/en/calculator" className="px-3 py-1 text-sm bg-gray-200 text-gray-700 rounded-full hover:bg-gray-300">
            Calculator
          </Link>
          <Link href="/zh" className="px-3 py-1 text-sm bg-gray-200 text-gray-700 rounded-full hover:bg-gray-300">
            中文版
          </Link>
          <Link href="/fr" className="px-3 py-1 text-sm bg-gray-200 text-gray-700 rounded-full hover:bg-gray-300">
            Français
          </Link>
        </div>

        <p className="text-xs text-gray-400">
          SlabFlow © 2026
        </p>
      </div>
    </main>
  );
}
