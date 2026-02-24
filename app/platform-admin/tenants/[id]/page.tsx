import { redirect, notFound } from 'next/navigation';
import Link from 'next/link';
import { getPlatformAdminSession } from '@/lib/auth';
import { db, tenants } from '@/lib/db';
import { formatDate } from '@/lib/utils';
import { eq } from 'drizzle-orm';
import { ArrowLeft, Save, ToggleLeft, ToggleRight } from 'lucide-react';

interface TenantEditPageProps {
  params: Promise<{ id: string }>;
}

export default async function TenantEditPage({ params }: TenantEditPageProps) {
  // Verify platform admin session
  const session = await getPlatformAdminSession();

  if (!session) {
    redirect('/platform-admin/login');
  }

  const resolvedParams = await params;
  const tenantId = parseInt(resolvedParams.id, 10);

  if (isNaN(tenantId)) {
    notFound();
  }

  // Fetch tenant
  const tenantResult = await db
    .select()
    .from(tenants)
    .where(eq(tenants.id, tenantId))
    .limit(1);

  const tenant = tenantResult[0];

  if (!tenant) {
    notFound();
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">SlabFlow Admin</h1>
            <p className="text-sm text-gray-500">Edit Tenant: {tenant.name}</p>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-600">{session.email}</span>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6">
          <Link
            href="/platform-admin/tenants"
            className="inline-flex items-center text-sm text-gray-500 hover:text-gray-700 transition-colors"
          >
            <ArrowLeft className="w-4 h-4 mr-1" />
            Back to tenants
          </Link>
        </div>

        <div className="bg-white shadow sm:rounded-lg">
          {/* Status Banner */}
          <div className={`px-6 py-3 ${tenant.isActive ? 'bg-green-50' : 'bg-red-50'}`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                {tenant.isActive ? (
                  <>
                    <ToggleRight className="w-5 h-5 text-green-600 mr-2" />
                    <span className="text-sm font-medium text-green-800">
                      Service Active
                    </span>
                  </>
                ) : (
                  <>
                    <ToggleLeft className="w-5 h-5 text-red-600 mr-2" />
                    <span className="text-sm font-medium text-red-800">
                      Service Suspended
                    </span>
                  </>
                )}
              </div>
              <span className="text-xs text-gray-500">
                Created {formatDate(tenant.createdAt)}
              </span>
            </div>
          </div>

          <form action={`/api/platform-admin/tenants/${tenant.id}`} method="POST" className="px-6 py-4 space-y-6">
            <input type="hidden" name="_method" value="PUT" />

            {/* Service Toggle */}
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div>
                <h3 className="text-sm font-medium text-gray-900">Service Status</h3>
                <p className="text-sm text-gray-500">
                  {tenant.isActive
                    ? 'Tenant website and API are accessible'
                    : 'Tenant website is showing suspended page'}
                </p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  name="isActive"
                  defaultChecked={tenant.isActive}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-gray-300 rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-black"></div>
              </label>
            </div>

            {/* Basic Info */}
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                  Business Name *
                </label>
                <input
                  type="text"
                  name="name"
                  id="name"
                  required
                  defaultValue={tenant.name}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent text-base"
                />
              </div>

              <div>
                <label htmlFor="domain" className="block text-sm font-medium text-gray-700">
                  Domain *
                </label>
                <input
                  type="text"
                  name="domain"
                  id="domain"
                  required
                  defaultValue={tenant.domain}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent text-base"
                />
              </div>
            </div>

            {/* Contact Info */}
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
              <div>
                <label htmlFor="contactEmail" className="block text-sm font-medium text-gray-700">
                  Contact Email
                </label>
                <input
                  type="email"
                  name="contactEmail"
                  id="contactEmail"
                  defaultValue={tenant.contactEmail || ''}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent text-base"
                />
              </div>

              <div>
                <label htmlFor="contactPhone" className="block text-sm font-medium text-gray-700">
                  Contact Phone
                </label>
                <input
                  type="tel"
                  name="contactPhone"
                  id="contactPhone"
                  defaultValue={tenant.contactPhone || ''}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent text-base"
                />
              </div>
            </div>

            <div>
              <label htmlFor="address" className="block text-sm font-medium text-gray-700">
                Address
              </label>
              <textarea
                name="address"
                id="address"
                rows={2}
                defaultValue={tenant.address || ''}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent text-base"
              />
            </div>

            {/* Theme */}
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
              <div>
                <label htmlFor="themePrimaryColor" className="block text-sm font-medium text-gray-700">
                  Primary Color
                </label>
                <div className="mt-1 flex items-center gap-2">
                  <input
                    type="color"
                    name="themePrimaryColor"
                    id="themePrimaryColor"
                    defaultValue={tenant.themePrimaryColor || '#000000'}
                    className="h-10 w-10 rounded border border-gray-300 cursor-pointer"
                  />
                </div>
              </div>

              <div className="sm:col-span-2">
                <label htmlFor="themeLogoUrl" className="block text-sm font-medium text-gray-700">
                  Logo URL
                </label>
                <input
                  type="url"
                  name="themeLogoUrl"
                  id="themeLogoUrl"
                  defaultValue={tenant.themeLogoUrl || ''}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent text-base"
                />
              </div>
            </div>

            <div>
              <label htmlFor="themeBannerUrl" className="block text-sm font-medium text-gray-700">
                Banner URL
              </label>
              <input
                type="url"
                name="themeBannerUrl"
                id="themeBannerUrl"
                defaultValue={tenant.themeBannerUrl || ''}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent text-base"
              />
            </div>

            {/* Features */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">Features</label>
              <div className="space-y-3">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    name="featureChatbot"
                    defaultChecked={tenant.featureChatbot ?? true}
                    className="h-4 w-4 text-black focus:ring-black border-gray-300 rounded"
                  />
                  <span className="ml-2 text-sm text-gray-700">AI Chatbot</span>
                </label>
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    name="featureCalculator"
                    defaultChecked={tenant.featureCalculator ?? true}
                    className="h-4 w-4 text-black focus:ring-black border-gray-300 rounded"
                  />
                  <span className="ml-2 text-sm text-gray-700">Price Calculator</span>
                </label>
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    name="feature3dReconstruction"
                    defaultChecked={tenant.feature3dReconstruction ?? false}
                    className="h-4 w-4 text-black focus:ring-black border-gray-300 rounded"
                  />
                  <span className="ml-2 text-sm text-gray-700">3D Scene Reconstruction</span>
                </label>
              </div>
            </div>

            {/* AI Budget */}
            <div>
              <label htmlFor="aiMonthlyBudget" className="block text-sm font-medium text-gray-700">
                Monthly AI Budget (CAD)
              </label>
              <input
                type="number"
                name="aiMonthlyBudget"
                id="aiMonthlyBudget"
                step="0.01"
                min="0"
                defaultValue={tenant.aiMonthlyBudget || '50.00'}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent text-base"
              />
            </div>

            {/* AI System Prompt */}
            <div>
              <label htmlFor="aiSystemPrompt" className="block text-sm font-medium text-gray-700">
                Custom AI System Prompt
              </label>
              <textarea
                name="aiSystemPrompt"
                id="aiSystemPrompt"
                rows={4}
                defaultValue={tenant.aiSystemPrompt || ''}
                placeholder="Leave empty to use the default prompt..."
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent text-base"
              />
              <p className="mt-1 text-xs text-gray-500">
                Custom instructions for the AI chatbot. If empty, the default prompt will be used.
              </p>
            </div>

            {/* Submit */}
            <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
              <Link
                href="/platform-admin/tenants"
                className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-900 transition-colors"
              >
                Cancel
              </Link>
              <button
                type="submit"
                className="inline-flex items-center px-4 py-2 bg-black text-white text-sm font-medium rounded-md hover:bg-gray-800 transition-colors"
              >
                <Save className="w-4 h-4 mr-2" />
                Save Changes
              </button>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
}
