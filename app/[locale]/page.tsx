import { headers } from 'next/headers';
import Link from 'next/link';
import { db, tenants, inventoryStones } from '@/lib/db';
import { eq } from 'drizzle-orm';

export default async function TenantLandingPage({ params }: { params: { locale: string } }) {
  const { locale } = params;
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

    featuredStones = await db
      .select()
      .from(inventoryStones)
      .where(eq(inventoryStones.tenantId, parseInt(tenantId, 10)))
      .limit(6);
  }

  const companyName = tenant?.name || 'Premium Stone';

  const getStoneName = (name: unknown): string => {
    if (!name) return 'Stone';
    if (typeof name === 'string') {
      try {
        const parsed = JSON.parse(name);
        return parsed[locale] || parsed.en || parsed.zh || name;
      } catch {
        return name;
      }
    }
    if (typeof name === 'object' && name !== null) {
      const n = name as Record<string, string>;
      return n[locale] || n.en || n.zh || 'Stone';
    }
    return 'Stone';
  };

  return (
    <div className="bg-stone-50">
      {/* ============================================ */}
      {/* HERO SECTION - Full viewport with SVG animation */}
      {/* ============================================ */}
      <section className="relative min-h-[90vh] flex items-center justify-center overflow-hidden bg-gradient-to-b from-stone-900 via-stone-800 to-stone-900">
        {/* Animated marble veining SVG background */}
        <div className="absolute inset-0 opacity-20">
          <svg className="w-full h-full" viewBox="0 0 1440 900" preserveAspectRatio="xMidYMid slice" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <linearGradient id="marbleGrad1" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#D4A574" stopOpacity="0.6">
                  <animate attributeName="stopOpacity" values="0.6;0.3;0.6" dur="8s" repeatCount="indefinite" />
                </stop>
                <stop offset="50%" stopColor="#8B7355" stopOpacity="0.4">
                  <animate attributeName="stopOpacity" values="0.4;0.7;0.4" dur="6s" repeatCount="indefinite" />
                </stop>
                <stop offset="100%" stopColor="#C4A882" stopOpacity="0.5">
                  <animate attributeName="stopOpacity" values="0.5;0.2;0.5" dur="10s" repeatCount="indefinite" />
                </stop>
              </linearGradient>
              <linearGradient id="marbleGrad2" x1="100%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#E8D5B7" stopOpacity="0.3" />
                <stop offset="100%" stopColor="#A0845C" stopOpacity="0.5" />
              </linearGradient>
              <filter id="marble-blur">
                <feTurbulence type="fractalNoise" baseFrequency="0.015" numOctaves="3" seed="5" />
                <feDisplacementMap in="SourceGraphic" scale="60" />
              </filter>
            </defs>
            
            {/* Marble vein paths with flowing animation */}
            <path d="M-50,200 C200,150 400,300 600,200 S900,100 1100,250 S1300,350 1500,200" 
              stroke="url(#marbleGrad1)" strokeWidth="3" fill="none" strokeLinecap="round">
              <animate attributeName="d" 
                values="M-50,200 C200,150 400,300 600,200 S900,100 1100,250 S1300,350 1500,200;
                        M-50,250 C200,200 400,100 600,250 S900,300 1100,150 S1300,250 1500,300;
                        M-50,200 C200,150 400,300 600,200 S900,100 1100,250 S1300,350 1500,200" 
                dur="12s" repeatCount="indefinite" />
            </path>
            <path d="M-50,400 C300,350 500,500 700,380 S1000,300 1200,450 S1400,500 1500,400" 
              stroke="url(#marbleGrad2)" strokeWidth="2" fill="none" strokeLinecap="round" opacity="0.6">
              <animate attributeName="d" 
                values="M-50,400 C300,350 500,500 700,380 S1000,300 1200,450 S1400,500 1500,400;
                        M-50,350 C300,450 500,300 700,420 S1000,500 1200,350 S1400,400 1500,450;
                        M-50,400 C300,350 500,500 700,380 S1000,300 1200,450 S1400,500 1500,400" 
                dur="15s" repeatCount="indefinite" />
            </path>
            <path d="M-50,600 C200,550 450,700 650,580 S850,500 1050,650 S1250,700 1500,600" 
              stroke="url(#marbleGrad1)" strokeWidth="2.5" fill="none" strokeLinecap="round" opacity="0.4">
              <animate attributeName="d" 
                values="M-50,600 C200,550 450,700 650,580 S850,500 1050,650 S1250,700 1500,600;
                        M-50,650 C200,700 450,550 650,620 S850,700 1050,550 S1250,600 1500,550;
                        M-50,600 C200,550 450,700 650,580 S850,500 1050,650 S1250,700 1500,600" 
                dur="18s" repeatCount="indefinite" />
            </path>
            
            {/* Subtle floating particles */}
            <circle cx="200" cy="300" r="2" fill="#D4A574" opacity="0.3">
              <animate attributeName="cy" values="300;250;300" dur="6s" repeatCount="indefinite" />
              <animate attributeName="opacity" values="0.3;0.6;0.3" dur="6s" repeatCount="indefinite" />
            </circle>
            <circle cx="800" cy="500" r="1.5" fill="#C4A882" opacity="0.4">
              <animate attributeName="cy" values="500;450;500" dur="8s" repeatCount="indefinite" />
              <animate attributeName="opacity" values="0.4;0.7;0.4" dur="8s" repeatCount="indefinite" />
            </circle>
            <circle cx="1200" cy="200" r="2.5" fill="#E8D5B7" opacity="0.2">
              <animate attributeName="cy" values="200;150;200" dur="10s" repeatCount="indefinite" />
              <animate attributeName="opacity" values="0.2;0.5;0.2" dur="10s" repeatCount="indefinite" />
            </circle>
            <circle cx="500" cy="700" r="1.8" fill="#D4A574" opacity="0.3">
              <animate attributeName="cy" values="700;650;700" dur="7s" repeatCount="indefinite" />
            </circle>
            <circle cx="1000" cy="400" r="2" fill="#A0845C" opacity="0.25">
              <animate attributeName="cy" values="400;350;400" dur="9s" repeatCount="indefinite" />
            </circle>
          </svg>
        </div>

        {/* Warm ambient glow */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-0 left-1/4 w-96 h-96 bg-amber-700/10 rounded-full blur-[120px]" />
          <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-amber-600/8 rounded-full blur-[120px]" />
        </div>

        {/* Hero Content */}
        <div className="relative z-10 text-center px-4 max-w-4xl mx-auto">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-amber-500/10 border border-amber-500/20 rounded-full mb-8">
            <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
            <span className="text-amber-300 text-sm font-medium tracking-wide">Premium Natural Stone</span>
          </div>
          
          <h1 className="text-5xl md:text-7xl font-bold text-white mb-6 leading-tight tracking-tight">
            Crafted by Nature,
            <br />
            <span className="bg-gradient-to-r from-amber-300 via-amber-400 to-amber-500 bg-clip-text text-transparent">
              Perfected for You
            </span>
          </h1>
          
          <p className="text-lg md:text-xl text-stone-300 mb-10 max-w-2xl mx-auto leading-relaxed">
            Discover our curated collection of premium marble, granite, and quartz surfaces. 
            Each piece tells a story millions of years in the making.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href={`/${locale}/browse`}
              className="inline-flex items-center justify-center px-8 py-4 text-base font-semibold text-stone-900 bg-gradient-to-r from-amber-300 to-amber-400 rounded-xl hover:from-amber-200 hover:to-amber-300 transition-all shadow-lg shadow-amber-500/20 group"
            >
              Explore Collection
              <svg className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
              </svg>
            </Link>
            <Link
              href={`/${locale}/login`}
              className="inline-flex items-center justify-center px-8 py-4 text-base font-semibold text-amber-300 border-2 border-amber-500/30 rounded-xl hover:bg-amber-500/10 transition-all"
            >
              Sign In
            </Link>
          </div>
        </div>

        {/* Scroll indicator */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2">
          <span className="text-xs text-stone-400 uppercase tracking-widest">Scroll</span>
          <div className="w-6 h-10 border-2 border-stone-500/30 rounded-full flex justify-center">
            <div className="w-1.5 h-3 bg-amber-400/60 rounded-full mt-2 animate-bounce" />
          </div>
        </div>
      </section>

      {/* ============================================ */}
      {/* FEATURED STONES SECTION */}
      {/* ============================================ */}
      {featuredStones.length > 0 && (
        <section className="py-20 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-14">
              <span className="text-amber-600 text-sm font-semibold uppercase tracking-widest">Our Collection</span>
              <h2 className="text-3xl md:text-4xl font-bold text-stone-900 mt-3 mb-4">
                Featured Stones
              </h2>
              <div className="w-16 h-1 bg-gradient-to-r from-amber-400 to-amber-600 mx-auto rounded-full" />
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
              {featuredStones.map((stone) => (
                <Link
                  key={stone.id}
                  href={`/${locale}/browse/${stone.id}`}
                  className="group relative bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-500 border border-stone-100"
                >
                  <div className="aspect-[4/3] relative bg-stone-100 overflow-hidden">
                    {stone.imageUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={stone.imageUrl}
                        alt={getStoneName(stone.name)}
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                      />
                    ) : (
                      <div className="flex items-center justify-center h-full">
                        <svg className="w-16 h-16 text-stone-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                      </div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                    <span className="absolute top-3 right-3 px-3 py-1 text-xs font-semibold bg-white/90 backdrop-blur-sm rounded-full capitalize text-stone-700 shadow-sm">
                      {stone.stoneType}
                    </span>
                  </div>
                  <div className="p-5">
                    <h3 className="font-semibold text-stone-900 text-lg group-hover:text-amber-700 transition-colors">
                      {getStoneName(stone.name)}
                    </h3>
                    <p className="text-sm text-stone-500 mt-1">{stone.brand}</p>
                    {stone.pricePerSlab && (
                      <p className="text-xl font-bold text-amber-700 mt-3">
                        ${parseFloat(stone.pricePerSlab).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                        <span className="text-sm font-normal text-stone-400 ml-1">/ slab</span>
                      </p>
                    )}
                  </div>
                </Link>
              ))}
            </div>
            
            <div className="text-center mt-12">
              <Link
                href={`/${locale}/browse`}
                className="inline-flex items-center px-8 py-3 text-base font-semibold text-amber-700 border-2 border-amber-600 rounded-xl hover:bg-amber-50 transition-all group"
              >
                View All Collection
                <svg className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                </svg>
              </Link>
            </div>
          </div>
        </section>
      )}

      {/* ============================================ */}
      {/* WHY CHOOSE US SECTION */}
      {/* ============================================ */}
      <section className="py-20 bg-stone-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-14">
            <span className="text-amber-600 text-sm font-semibold uppercase tracking-widest">Why Choose Us</span>
            <h2 className="text-3xl md:text-4xl font-bold text-stone-900 mt-3 mb-4">
              Excellence in Every Slab
            </h2>
            <div className="w-16 h-1 bg-gradient-to-r from-amber-400 to-amber-600 mx-auto rounded-full" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Feature 1 */}
            <div className="bg-white rounded-2xl p-8 shadow-sm border border-stone-100 hover:shadow-lg transition-all duration-300 group">
              <div className="w-14 h-14 bg-amber-50 rounded-xl flex items-center justify-center mb-6 group-hover:bg-amber-100 transition-colors">
                <svg className="w-7 h-7 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-stone-900 mb-3">Premium Quality</h3>
              <p className="text-stone-500 leading-relaxed">
                Hand-selected stones from the world&apos;s finest quarries. Each slab is inspected for quality, color consistency, and structural integrity.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="bg-white rounded-2xl p-8 shadow-sm border border-stone-100 hover:shadow-lg transition-all duration-300 group">
              <div className="w-14 h-14 bg-amber-50 rounded-xl flex items-center justify-center mb-6 group-hover:bg-amber-100 transition-colors">
                <svg className="w-7 h-7 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-stone-900 mb-3">Smart Recommendations</h3>
              <p className="text-stone-500 leading-relaxed">
                Our AI-powered assistant helps you find the perfect stone for your project, matching your style preferences and budget requirements.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="bg-white rounded-2xl p-8 shadow-sm border border-stone-100 hover:shadow-lg transition-all duration-300 group">
              <div className="w-14 h-14 bg-amber-50 rounded-xl flex items-center justify-center mb-6 group-hover:bg-amber-100 transition-colors">
                <svg className="w-7 h-7 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-stone-900 mb-3">Instant Pricing</h3>
              <p className="text-stone-500 leading-relaxed">
                Get accurate cost estimates instantly with our built-in calculator. Factor in dimensions, edge profiles, and installation for transparent pricing.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ============================================ */}
      {/* CTA SECTION */}
      {/* ============================================ */}
      <section className="py-20 bg-gradient-to-br from-stone-900 via-stone-800 to-stone-900 relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <svg className="w-full h-full" viewBox="0 0 1440 400" preserveAspectRatio="xMidYMid slice">
            <path d="M-50,100 C200,50 400,200 600,100 S900,50 1100,150 S1300,200 1500,100" 
              stroke="#D4A574" strokeWidth="2" fill="none" opacity="0.5">
              <animate attributeName="d" 
                values="M-50,100 C200,50 400,200 600,100 S900,50 1100,150 S1300,200 1500,100;
                        M-50,150 C200,100 400,50 600,150 S900,200 1100,100 S1300,150 1500,50;
                        M-50,100 C200,50 400,200 600,100 S900,50 1100,150 S1300,200 1500,100" 
                dur="12s" repeatCount="indefinite" />
            </path>
            <path d="M-50,300 C300,250 500,350 700,280 S1000,200 1200,320 S1400,350 1500,300" 
              stroke="#C4A882" strokeWidth="1.5" fill="none" opacity="0.3">
              <animate attributeName="d" 
                values="M-50,300 C300,250 500,350 700,280 S1000,200 1200,320 S1400,350 1500,300;
                        M-50,250 C300,350 500,250 700,320 S1000,350 1200,250 S1400,300 1500,350;
                        M-50,300 C300,250 500,350 700,280 S1000,200 1200,320 S1400,350 1500,300" 
                dur="16s" repeatCount="indefinite" />
            </path>
          </svg>
        </div>
        
        <div className="relative z-10 max-w-3xl mx-auto text-center px-4">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">
            Ready to Transform Your Space?
          </h2>
          <p className="text-lg text-stone-300 mb-10 leading-relaxed">
            Browse our extensive collection or speak with our AI assistant to find the perfect stone for your project.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href={`/${locale}/chat`}
              className="inline-flex items-center justify-center px-8 py-4 text-base font-semibold text-stone-900 bg-gradient-to-r from-amber-300 to-amber-400 rounded-xl hover:from-amber-200 hover:to-amber-300 transition-all shadow-lg shadow-amber-500/20"
            >
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
              Chat with AI Assistant
            </Link>
            <Link
              href={`/${locale}/calculator`}
              className="inline-flex items-center justify-center px-8 py-4 text-base font-semibold text-amber-300 border-2 border-amber-500/30 rounded-xl hover:bg-amber-500/10 transition-all"
            >
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
              </svg>
              Get a Quote
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
