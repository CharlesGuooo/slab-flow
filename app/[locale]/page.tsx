import { headers } from 'next/headers';
import Link from 'next/link';
import { db, tenants, inventoryStones } from '@/lib/db';
import { eq } from 'drizzle-orm';
import { createTranslator } from '@/lib/i18n';

export default async function TenantLandingPage({ params }: { params: { locale: string } }) {
  const { locale } = params;
  const headersList = await headers();
  const tenantId = headersList.get('x-tenant-id');
  const t = await createTranslator('home');

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
    <div className="bg-white">
      {/* ============================================ */}
      {/* HERO SECTION - Warm, elegant, jwstone-inspired */}
      {/* ============================================ */}
      <section className="relative min-h-[85vh] flex items-center overflow-hidden">
        {/* Background: warm cream/beige with subtle marble texture SVG */}
        <div className="absolute inset-0 bg-gradient-to-br from-[#f5f0ea] via-[#ece4d9] to-[#e8ddd3]" />
        
        {/* Animated marble veining SVG */}
        <div className="absolute inset-0 opacity-[0.12]">
          <svg className="w-full h-full" viewBox="0 0 1440 900" preserveAspectRatio="xMidYMid slice" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <linearGradient id="vein1" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#8B7355" stopOpacity="0.8" />
                <stop offset="100%" stopColor="#A0845C" stopOpacity="0.4" />
              </linearGradient>
              <linearGradient id="vein2" x1="100%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#6B5B3E" stopOpacity="0.6" />
                <stop offset="100%" stopColor="#C4A882" stopOpacity="0.3" />
              </linearGradient>
            </defs>
            
            {/* Main marble veins - slow, organic flowing animation */}
            <path d="M-100,300 C100,250 350,400 550,280 S800,180 1000,320 S1250,400 1540,250" 
              stroke="url(#vein1)" strokeWidth="2.5" fill="none" strokeLinecap="round">
              <animate attributeName="d" 
                values="M-100,300 C100,250 350,400 550,280 S800,180 1000,320 S1250,400 1540,250;
                        M-100,350 C100,300 350,200 550,330 S800,380 1000,220 S1250,300 1540,350;
                        M-100,300 C100,250 350,400 550,280 S800,180 1000,320 S1250,400 1540,250" 
                dur="20s" repeatCount="indefinite" />
            </path>
            <path d="M-100,500 C200,450 400,600 650,480 S900,400 1100,550 S1350,580 1540,450" 
              stroke="url(#vein2)" strokeWidth="1.8" fill="none" strokeLinecap="round">
              <animate attributeName="d" 
                values="M-100,500 C200,450 400,600 650,480 S900,400 1100,550 S1350,580 1540,450;
                        M-100,450 C200,550 400,400 650,520 S900,580 1100,420 S1350,480 1540,520;
                        M-100,500 C200,450 400,600 650,480 S900,400 1100,550 S1350,580 1540,450" 
                dur="25s" repeatCount="indefinite" />
            </path>
            <path d="M-100,700 C150,650 380,780 580,680 S780,600 980,730 S1200,760 1540,650" 
              stroke="url(#vein1)" strokeWidth="1.5" fill="none" strokeLinecap="round" opacity="0.5">
              <animate attributeName="d" 
                values="M-100,700 C150,650 380,780 580,680 S780,600 980,730 S1200,760 1540,650;
                        M-100,730 C150,780 380,650 580,720 S780,760 980,630 S1200,700 1540,720;
                        M-100,700 C150,650 380,780 580,680 S780,600 980,730 S1200,760 1540,650" 
                dur="30s" repeatCount="indefinite" />
            </path>
            
            {/* Subtle secondary veins */}
            <path d="M-50,150 C200,120 400,200 600,140 S850,100 1050,180 S1300,220 1500,140" 
              stroke="url(#vein2)" strokeWidth="1" fill="none" strokeLinecap="round" opacity="0.4">
              <animate attributeName="d" 
                values="M-50,150 C200,120 400,200 600,140 S850,100 1050,180 S1300,220 1500,140;
                        M-50,180 C200,200 400,120 600,170 S850,200 1050,130 S1300,170 1500,190;
                        M-50,150 C200,120 400,200 600,140 S850,100 1050,180 S1300,220 1500,140" 
                dur="22s" repeatCount="indefinite" />
            </path>
          </svg>
        </div>

        {/* Content */}
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-white/60 backdrop-blur-sm border border-stone-200/60 rounded-full mb-8">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-600" />
              <span className="text-stone-600 text-xs font-medium tracking-[0.15em] uppercase">{t('tagline')}</span>
            </div>
            
            <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold text-stone-900 mb-6 leading-[1.1] tracking-tight">
              {t('heroTitle')}
              <br />
              <span className="text-amber-800">
                {t('heroTitleHighlight')}
              </span>
            </h1>
            
            <p className="text-base md:text-lg text-stone-600 mb-10 max-w-xl leading-relaxed">
              {t('heroSubtitle')}
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4">
              <Link
                href={`/${locale}/browse`}
                className="inline-flex items-center justify-center px-7 py-3.5 text-sm font-medium text-white bg-stone-900 rounded-md hover:bg-stone-800 transition-all group"
              >
                {t('exploreCollection')}
                <svg className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                </svg>
              </Link>
              <Link
                href={`/${locale}/login`}
                className="inline-flex items-center justify-center px-7 py-3.5 text-sm font-medium text-stone-700 border border-stone-300 rounded-md hover:bg-stone-50 transition-all"
              >
                {t('signIn')}
              </Link>
            </div>
          </div>
        </div>

        {/* Scroll indicator */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2">
          <span className="text-[10px] text-stone-400 uppercase tracking-[0.2em]">{t('scroll')}</span>
          <div className="w-5 h-8 border border-stone-300/60 rounded-full flex justify-center">
            <div className="w-1 h-2.5 bg-stone-400/50 rounded-full mt-1.5 animate-bounce" />
          </div>
        </div>
      </section>

      {/* ============================================ */}
      {/* FEATURED STONES - Clean grid like jwstone.ca */}
      {/* ============================================ */}
      {featuredStones.length > 0 && (
        <section className="py-20 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-14">
              <span className="text-amber-700 text-xs font-medium uppercase tracking-[0.2em]">{t('featuredTitle')}</span>
              <h2 className="text-3xl md:text-4xl font-bold text-stone-900 mt-3 mb-4 tracking-tight">
                {t('featuredHeading')}
              </h2>
              <div className="w-12 h-[2px] bg-amber-700 mx-auto" />
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {featuredStones.map((stone) => (
                <Link
                  key={stone.id}
                  href={`/${locale}/browse/${stone.id}`}
                  className="group relative bg-white overflow-hidden border border-stone-100 hover:border-stone-200 transition-all duration-300"
                >
                  <div className="aspect-[4/3] relative bg-stone-50 overflow-hidden">
                    {stone.imageUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={stone.imageUrl}
                        alt={getStoneName(stone.name)}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                      />
                    ) : (
                      <div className="flex items-center justify-center h-full">
                        <svg className="w-16 h-16 text-stone-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                      </div>
                    )}
                    {/* Model number badge */}
                    <span className="absolute top-3 left-3 px-2.5 py-1 text-[10px] font-bold bg-stone-900/80 text-white backdrop-blur-sm uppercase tracking-wider">
                      {stone.series}
                    </span>
                    {/* Quick View overlay */}
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors duration-300 flex items-center justify-center">
                      <span className="opacity-0 group-hover:opacity-100 transition-opacity duration-300 px-4 py-2 bg-white/90 text-stone-900 text-xs font-medium tracking-wider uppercase">
                        Quick View
                      </span>
                    </div>
                  </div>
                  <div className="p-4">
                    <h3 className="font-medium text-stone-900 text-sm group-hover:text-amber-800 transition-colors">
                      {getStoneName(stone.name)}
                    </h3>
                    <p className="text-xs text-stone-400 mt-1 uppercase tracking-wider">{stone.brand} &middot; {stone.stoneType}</p>
                    {stone.pricePerSlab && (
                      <p className="text-base font-semibold text-stone-900 mt-2">
                        ${parseFloat(stone.pricePerSlab).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                        <span className="text-xs font-normal text-stone-400 ml-1">{t('perSlab')}</span>
                      </p>
                    )}
                  </div>
                </Link>
              ))}
            </div>
            
            <div className="text-center mt-12">
              <Link
                href={`/${locale}/browse`}
                className="inline-flex items-center px-7 py-3 text-sm font-medium text-stone-900 border border-stone-900 rounded-md hover:bg-stone-900 hover:text-white transition-all group"
              >
                {t('viewAll')}
                <svg className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                </svg>
              </Link>
            </div>

            {/* Image disclaimer */}
            <p className="text-center text-[10px] text-stone-400 mt-6">{t('imageDisclaimer')}</p>
          </div>
        </section>
      )}

      {/* ============================================ */}
      {/* WHY CHOOSE US - Clean, warm cards */}
      {/* ============================================ */}
      <section className="py-20 bg-[#faf8f5]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-14">
            <span className="text-amber-700 text-xs font-medium uppercase tracking-[0.2em]">{t('whyChooseUs')}</span>
            <h2 className="text-3xl md:text-4xl font-bold text-stone-900 mt-3 mb-4 tracking-tight">
              {t('excellenceTitle')}
            </h2>
            <div className="w-12 h-[2px] bg-amber-700 mx-auto" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Feature 1 */}
            <div className="bg-white p-8 border border-stone-100 hover:shadow-md transition-all duration-300 group">
              <div className="w-12 h-12 bg-[#f5f0ea] rounded-sm flex items-center justify-center mb-6 group-hover:bg-amber-50 transition-colors">
                <svg className="w-6 h-6 text-amber-800" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-stone-900 mb-3">{t('premiumQuality')}</h3>
              <p className="text-sm text-stone-500 leading-relaxed">
                {t('premiumQualityDesc')}
              </p>
            </div>

            {/* Feature 2 */}
            <div className="bg-white p-8 border border-stone-100 hover:shadow-md transition-all duration-300 group">
              <div className="w-12 h-12 bg-[#f5f0ea] rounded-sm flex items-center justify-center mb-6 group-hover:bg-amber-50 transition-colors">
                <svg className="w-6 h-6 text-amber-800" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-stone-900 mb-3">{t('smartRecommendations')}</h3>
              <p className="text-sm text-stone-500 leading-relaxed">
                {t('smartRecommendationsDesc')}
              </p>
            </div>

            {/* Feature 3 */}
            <div className="bg-white p-8 border border-stone-100 hover:shadow-md transition-all duration-300 group">
              <div className="w-12 h-12 bg-[#f5f0ea] rounded-sm flex items-center justify-center mb-6 group-hover:bg-amber-50 transition-colors">
                <svg className="w-6 h-6 text-amber-800" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-stone-900 mb-3">{t('instantPricing')}</h3>
              <p className="text-sm text-stone-500 leading-relaxed">
                {t('instantPricingDesc')}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ============================================ */}
      {/* CTA SECTION - Warm, inviting */}
      {/* ============================================ */}
      <section className="py-20 bg-stone-900 relative overflow-hidden">
        {/* Subtle marble veins on dark */}
        <div className="absolute inset-0 opacity-[0.06]">
          <svg className="w-full h-full" viewBox="0 0 1440 400" preserveAspectRatio="xMidYMid slice">
            <path d="M-50,100 C200,50 400,200 600,100 S900,50 1100,150 S1300,200 1500,100" 
              stroke="#D4A574" strokeWidth="2" fill="none">
              <animate attributeName="d" 
                values="M-50,100 C200,50 400,200 600,100 S900,50 1100,150 S1300,200 1500,100;
                        M-50,150 C200,100 400,50 600,150 S900,200 1100,100 S1300,150 1500,50;
                        M-50,100 C200,50 400,200 600,100 S900,50 1100,150 S1300,200 1500,100" 
                dur="18s" repeatCount="indefinite" />
            </path>
            <path d="M-50,300 C300,250 500,350 700,280 S1000,200 1200,320 S1400,350 1500,300" 
              stroke="#C4A882" strokeWidth="1.5" fill="none">
              <animate attributeName="d" 
                values="M-50,300 C300,250 500,350 700,280 S1000,200 1200,320 S1400,350 1500,300;
                        M-50,250 C300,350 500,250 700,320 S1000,350 1200,250 S1400,300 1500,350;
                        M-50,300 C300,250 500,350 700,280 S1000,200 1200,320 S1400,350 1500,300" 
                dur="22s" repeatCount="indefinite" />
            </path>
          </svg>
        </div>
        
        <div className="relative z-10 max-w-3xl mx-auto text-center px-4">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-6 tracking-tight">
            {t('ctaTitle')}
          </h2>
          <p className="text-base text-stone-400 mb-10 leading-relaxed">
            {t('ctaSubtitle')}
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href={`/${locale}/chat`}
              className="inline-flex items-center justify-center px-7 py-3.5 text-sm font-medium text-stone-900 bg-white rounded-md hover:bg-stone-50 transition-all"
            >
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
              {t('chatWithAI')}
            </Link>
            <Link
              href={`/${locale}/login`}
              className="inline-flex items-center justify-center px-7 py-3.5 text-sm font-medium text-stone-300 border border-stone-600 rounded-md hover:bg-stone-800 hover:text-white transition-all"
            >
              {t('getQuote')}
            </Link>
          </div>
        </div>
      </section>

      {/* LET YOUR SPACE BE ART - inspired by jwstone.ca */}
      <section className="py-16 bg-[#f5f0ea]">
        <div className="max-w-4xl mx-auto text-center px-4">
          <h2 className="text-2xl md:text-3xl font-light text-stone-800 tracking-[0.05em] uppercase">
            Let Your Space Be Art
          </h2>
          <div className="w-12 h-[1px] bg-amber-700/40 mx-auto mt-4" />
        </div>
      </section>
    </div>
  );
}
