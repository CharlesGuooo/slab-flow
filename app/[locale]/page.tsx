import { headers } from 'next/headers';
import Link from 'next/link';
import { db, tenants, inventoryStones } from '@/lib/db';
import { eq } from 'drizzle-orm';

export default async function HomePage({ params }: { params: { locale: string } }) {
  const { locale } = params;
  // Get tenant info
  const headersList = await headers();
  const tenantId = headersList.get('x-tenant-id');

  let tenant = null;
  let featuredStones: typeof inventoryStones.$inferSelect[] = [];

  if (tenantId) {
    const result = await db
      .select()
      .from(tenants)
      .where(eq(tenants.id, parseInt(tenantId, 10)))
      .limit(1);
    tenant = result[0];

    // Get featured stones (first 4)
    featuredStones = await db
      .select()
      .from(inventoryStones)
      .where(eq(inventoryStones.tenantId, parseInt(tenantId, 10)))
      .limit(4);
  }

  const primaryColor = tenant?.themePrimaryColor || '#3b82f6';

  const getStoneName = (name: unknown): string => {
    if (!name) return 'Stone';
    if (typeof name === 'string') {
      try {
        const parsed = JSON.parse(name);
        return parsed.en || parsed.zh || name;
      } catch {
        return name;
      }
    }
    if (typeof name === 'object' && name !== null) {
      return (name as { en?: string; zh?: string }).en || (name as { en?: string; zh?: string }).zh || 'Stone';
    }
    return 'Stone';
  };

  return (
    <div>
      {/* Hero Section */}
      <section
        className="relative py-20 lg:py-32 bg-gray-50 dark:bg-gray-800"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-4xl lg:text-5xl font-bold text-gray-900 dark:text-white mb-6">
              Premium Stone Surfaces
            </h1>
            <p className="text-lg text-gray-600 dark:text-gray-300 max-w-2xl mx-auto mb-8">
              Discover our curated collection of quartz, granite, and marble surfaces.
              Transform your space with timeless elegance.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href={`/${locale}/browse`}
                className="inline-flex items-center justify-center px-6 py-3 text-base font-medium text-white rounded-lg transition-colors"
                style={{ backgroundColor: primaryColor }}
              >
                Browse Collection
              </Link>
              <Link
                href={`/${locale}/chat`}
                className="inline-flex items-center justify-center px-6 py-3 text-base font-medium border-2 rounded-lg transition-colors"
                style={{
                  borderColor: primaryColor,
                  color: primaryColor,
                }}
              >
                Get AI Recommendations
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Stones */}
      {featuredStones.length > 0 && (
        <section className="py-16 bg-white dark:bg-gray-900">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
                Featured Stones
              </h2>
              <p className="text-gray-600 dark:text-gray-400">
                Explore our most popular selections
              </p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {featuredStones.map((stone) => (
                <Link
                  key={stone.id}
                  href={`/${locale}/browse/${stone.id}`}
                  className="group bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden hover:shadow-lg transition-shadow"
                >
                  <div className="aspect-square relative bg-gray-100 dark:bg-gray-700">
                    {stone.imageUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={stone.imageUrl}
                        alt={getStoneName(stone.name)}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    ) : (
                      <div className="flex items-center justify-center h-full text-gray-400">
                        No Image
                      </div>
                    )}
                    <span className="absolute top-2 right-2 px-2 py-1 text-xs font-medium bg-white/90 dark:bg-gray-800/90 dark:text-gray-200 rounded-full capitalize">
                      {stone.stoneType}
                    </span>
                  </div>
                  <div className="p-4">
                    <h3 className="font-semibold text-gray-900 dark:text-white truncate">
                      {getStoneName(stone.name)}
                    </h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                      {stone.brand}
                    </p>
                    {stone.pricePerSlab && (
                      <p className="text-lg font-semibold mt-2" style={{ color: primaryColor }}>
                        ${parseFloat(stone.pricePerSlab).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                      </p>
                    )}
                  </div>
                </Link>
              ))}
            </div>
            <div className="text-center mt-8">
              <Link
                href={`/${locale}/browse`}
                className="inline-flex items-center text-sm font-medium transition-colors"
                style={{ color: primaryColor }}
              >
                View All Stones →
              </Link>
            </div>
          </div>
        </section>
      )}

      {/* Features Section */}
      <section className="py-16 bg-gray-50 dark:bg-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <div
                className="w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center"
                style={{ backgroundColor: primaryColor + '15' }}
              >
                <svg className="w-8 h-8" style={{ color: primaryColor }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                Premium Quality
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                Only the finest stones from trusted quarries worldwide
              </p>
            </div>
            <div className="text-center">
              <div
                className="w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center"
                style={{ backgroundColor: primaryColor + '15' }}
              >
                <svg className="w-8 h-8" style={{ color: primaryColor }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                AI-Powered Recommendations
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                Get personalized stone suggestions based on your style
              </p>
            </div>
            <div className="text-center">
              <div
                className="w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center"
                style={{ backgroundColor: primaryColor + '15' }}
              >
                <svg className="w-8 h-8" style={{ color: primaryColor }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                Local Service
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                Expert installation and support in your area
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Disclaimer */}
      <section className="py-8 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <p className="text-xs text-gray-400 text-center">
            Note: Stone images are for representation purposes. Actual product may vary in color, pattern, and texture.
            Please visit our showroom to see actual stone samples.
          </p>
        </div>
      </section>
    </div>
  );
}
