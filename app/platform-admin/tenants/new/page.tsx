import { redirect } from 'next/navigation';
import Link from 'next/link';
import { getPlatformAdminSession } from '@/lib/auth';
import { ArrowLeft } from 'lucide-react';

export default async function NewTenantPage() {
  // Verify platform admin session
  const session = await getPlatformAdminSession();

  if (!session) {
    redirect('/platform-admin/login');
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">SlabFlow Admin</h1>
            <p className="text-sm text-gray-500">Create New Tenant</p>
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
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-medium text-gray-900">Tenant Information</h2>
            <p className="mt-1 text-sm text-gray-500">
              Create a new tenant for a stone fabrication business.
            </p>
          </div>

          <form action="/api/platform-admin/tenants" method="POST" className="px-6 py-4 space-y-6">
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
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent text-base"
                  placeholder="StoneMaster NYC"
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
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent text-base"
                  placeholder="stonemaster.example.com"
                />
                <p className="mt-1 text-xs text-gray-500">
                  The domain where this tenant&apos;s site will be accessible
                </p>
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
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent text-base"
                  placeholder="contact@stonemaster.com"
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
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent text-base"
                  placeholder="+1 (555) 123-4567"
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
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent text-base"
                placeholder="123 Main Street, New York, NY 10001"
              />
            </div>

            {/* Theme */}
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
              <div>
                <label htmlFor="themePrimaryColor" className="block text-sm font-medium text-gray-700">
                  Primary Color
                </label>
                <div className="mt-1 flex items-center gap-2">
                  <input
                    type="color"
                    name="themePrimaryColor"
                    id="themePrimaryColor"
                    defaultValue="#000000"
                    className="h-10 w-10 rounded border border-gray-300 cursor-pointer"
                  />
                  <input
                    type="text"
                    defaultValue="#000000"
                    className="block flex-1 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent text-base"
                    placeholder="#000000"
                    pattern="^#[0-9A-Fa-f]{6}$"
                    onChange={(e) => {
                      const colorInput = document.getElementById('themePrimaryColor') as HTMLInputElement;
                      if (colorInput) colorInput.value = e.target.value;
                    }}
                  />
                </div>
              </div>

              <div>
                <label htmlFor="themeLogoUrl" className="block text-sm font-medium text-gray-700">
                  Logo URL
                </label>
                <input
                  type="url"
                  name="themeLogoUrl"
                  id="themeLogoUrl"
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent text-base"
                  placeholder="https://example.com/logo.png"
                />
              </div>
            </div>

            {/* Features */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">Features</label>
              <div className="space-y-3">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    name="featureChatbot"
                    defaultChecked
                    className="h-4 w-4 text-black focus:ring-black border-gray-300 rounded"
                  />
                  <span className="ml-2 text-sm text-gray-700">AI Chatbot</span>
                </label>
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    name="featureCalculator"
                    defaultChecked
                    className="h-4 w-4 text-black focus:ring-black border-gray-300 rounded"
                  />
                  <span className="ml-2 text-sm text-gray-700">Price Calculator</span>
                </label>
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    name="feature3dReconstruction"
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
                defaultValue="50.00"
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent text-base"
              />
              <p className="mt-1 text-xs text-gray-500">
                Maximum AI usage cost per month for this tenant
              </p>
            </div>

            {/* Admin Credentials Info */}
            <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
              <h3 className="text-sm font-medium text-blue-800 mb-2">
                Admin Account
              </h3>
              <p className="text-sm text-blue-700">
                A tenant admin account will be created automatically. You will receive the credentials after creating the tenant.
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
                className="px-4 py-2 bg-black text-white text-sm font-medium rounded-md hover:bg-gray-800 transition-colors"
              >
                Create Tenant
              </button>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
}
