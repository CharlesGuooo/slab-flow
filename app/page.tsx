export default function HomePage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24">
      <div className="text-center">
        <h1 className="text-4xl font-bold mb-4">Welcome to SlabFlow</h1>
        <p className="text-lg text-gray-600 mb-8">
          Multi-tenant SaaS Platform for Stone Fabrication
        </p>
        <div className="space-x-4">
          <a
            href="/platform-admin/login"
            className="inline-block px-6 py-3 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors"
          >
            Platform Admin
          </a>
        </div>
        <p className="mt-8 text-sm text-gray-500">
          Configure your tenant domain to access your branded portal.
        </p>
      </div>
    </main>
  );
}
