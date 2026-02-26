import { redirect } from 'next/navigation';
import Link from 'next/link';
import { getPlatformAdminSession } from '@/lib/auth';
import { db, tenants } from '@/lib/db';
import { formatDate } from '@/lib/utils';
import { PlatformLogoutButton } from '@/components/PlatformLogoutButton';

export default async function PlatformAdminTenantsPage() {
  const session = await getPlatformAdminSession();

  if (!session) {
    redirect('/platform-admin/login');
  }

  const allTenants = await db
    .select()
    .from(tenants)
    .orderBy(tenants.createdAt);

  return (
    <div className="min-h-screen bg-slate-900">
      {/* Header */}
      <header className="bg-slate-800/50 backdrop-blur-xl border-b border-white/5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <svg width="36" height="36" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
              <rect x="4" y="4" width="56" height="56" rx="12" fill="url(#logoGrad2)" />
              <path d="M20 44V20h6l8 14 8-14h6v24h-6V30l-8 14-8-14v14h-6z" fill="white" fillOpacity="0.95"/>
              <defs>
                <linearGradient id="logoGrad2" x1="4" y1="4" x2="60" y2="60" gradientUnits="userSpaceOnUse">
                  <stop stopColor="#D4A574"/>
                  <stop offset="1" stopColor="#8B6914"/>
                </linearGradient>
              </defs>
            </svg>
            <div>
              <h1 className="text-xl font-bold text-white">SlabFlow</h1>
              <p className="text-xs text-slate-400">Platform Administration</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm text-slate-400">{session.email}</span>
            <PlatformLogoutButton />
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h2 className="text-2xl font-bold text-white">Tenants</h2>
            <p className="text-sm text-slate-400 mt-1">{allTenants.length} registered stone businesses</p>
          </div>
          <Link
            href="/platform-admin/tenants/new"
            className="inline-flex items-center px-5 py-2.5 bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-500 hover:to-amber-600 text-white text-sm font-semibold rounded-xl transition-all shadow-lg shadow-amber-900/20"
          >
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Add Tenant
          </Link>
        </div>

        {allTenants.length === 0 ? (
          <div className="text-center py-16 bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10">
            <svg className="w-16 h-16 mx-auto text-slate-600 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
            <p className="text-slate-400 mb-4">No tenants found</p>
            <Link
              href="/platform-admin/tenants/new"
              className="text-amber-400 hover:text-amber-300 font-medium transition-colors"
            >
              Create your first tenant
            </Link>
          </div>
        ) : (
          <div className="grid gap-4">
            {allTenants.map((tenant) => (
              <div
                key={tenant.id}
                className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6 hover:bg-white/[0.08] transition-all group"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div
                      className="w-12 h-12 rounded-xl flex items-center justify-center text-white font-bold text-lg"
                      style={{ backgroundColor: tenant.themePrimaryColor || '#D4A574' }}
                    >
                      {tenant.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-white">{tenant.name}</h3>
                      <p className="text-sm text-slate-400">{tenant.contactEmail || 'No email'}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-6">
                    {/* Domain */}
                    <div className="hidden md:block text-right">
                      <p className="text-xs text-slate-500 uppercase tracking-wider mb-1">Domain</p>
                      <p className="text-sm text-slate-300 font-mono">{tenant.domain}</p>
                    </div>

                    {/* Status */}
                    <div className="hidden sm:block">
                      {tenant.isActive ? (
                        <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 mr-2" />
                          Active
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-red-500/10 text-red-400 border border-red-500/20">
                          <span className="w-1.5 h-1.5 rounded-full bg-red-400 mr-2" />
                          Suspended
                        </span>
                      )}
                    </div>

                    {/* Features */}
                    <div className="hidden lg:flex gap-1.5">
                      {tenant.featureChatbot && (
                        <span className="px-2 py-1 rounded-lg text-xs font-medium bg-blue-500/10 text-blue-400 border border-blue-500/20">
                          Chat
                        </span>
                      )}
                      {tenant.featureCalculator && (
                        <span className="px-2 py-1 rounded-lg text-xs font-medium bg-purple-500/10 text-purple-400 border border-purple-500/20">
                          Calc
                        </span>
                      )}
                      {tenant.feature3dReconstruction && (
                        <span className="px-2 py-1 rounded-lg text-xs font-medium bg-orange-500/10 text-orange-400 border border-orange-500/20">
                          3D
                        </span>
                      )}
                    </div>

                    {/* Created */}
                    <div className="hidden xl:block text-right">
                      <p className="text-xs text-slate-500 uppercase tracking-wider mb-1">Created</p>
                      <p className="text-sm text-slate-400">{formatDate(tenant.createdAt)}</p>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-2">
                      {tenant.domain && (
                        <a
                          href={`https://${tenant.domain}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition-all"
                          title="Visit tenant site"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                          </svg>
                        </a>
                      )}
                      <Link
                        href={`/platform-admin/tenants/${tenant.id}`}
                        className="p-2 rounded-xl text-slate-400 hover:text-amber-400 hover:bg-amber-500/10 transition-all"
                        title="Edit tenant"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
