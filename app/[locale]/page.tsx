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
                        {locale === 'zh' ? '快速查看' : locale === 'fr' ? 'Aperçu rapide' : 'Quick View'}
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

            {/* Feature 3 - AI Visualization */}
            <div className="bg-white p-8 border border-stone-100 hover:shadow-md transition-all duration-300 group">
              <div className="w-12 h-12 bg-[#f5f0ea] rounded-sm flex items-center justify-center mb-6 group-hover:bg-amber-50 transition-colors">
                <svg className="w-6 h-6 text-amber-800" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-stone-900 mb-3">{t('aiVisualization')}</h3>
              <p className="text-sm text-stone-500 leading-relaxed">
                {t('aiVisualizationDesc')}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ============================================ */}
      {/* AI FEATURES TUTORIAL - How to use AI Assistant & 3D Scene */}
      {/* ============================================ */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-14">
            <span className="text-amber-700 text-xs font-medium uppercase tracking-[0.2em]">
              {locale === 'zh' ? 'AI功能指南' : locale === 'fr' ? 'Guide des fonctionnalit\u00e9s IA' : 'AI Features Guide'}
            </span>
            <h2 className="text-3xl md:text-4xl font-bold text-stone-900 mt-3 mb-4 tracking-tight">
              {locale === 'zh' ? '体验智能石材选购' : locale === 'fr' ? 'Exp\u00e9rience d\'achat intelligente' : 'Experience Smart Stone Shopping'}
            </h2>
            <div className="w-12 h-[2px] bg-amber-700 mx-auto" />
          </div>

          {/* AI Assistant Tutorial */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 mb-16">
            <div className="flex flex-col justify-center">
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-amber-50 border border-amber-100 rounded-full w-fit mb-4">
                <svg className="w-4 h-4 text-amber-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
                <span className="text-xs font-medium text-amber-800">
                  {locale === 'zh' ? 'AI石材顾问' : locale === 'fr' ? 'Consultant IA' : 'AI Stone Consultant'}
                </span>
              </div>
              <h3 className="text-2xl font-bold text-stone-900 mb-4">
                {locale === 'zh' ? '与AI助手对话，找到完美石材' : locale === 'fr' ? 'Discutez avec l\'IA pour trouver la pierre parfaite' : 'Chat with AI to Find Your Perfect Stone'}
              </h3>
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <div className="w-7 h-7 bg-amber-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-xs font-bold text-amber-800">1</span>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-stone-800">
                      {locale === 'zh' ? '描述您的项目需求' : locale === 'fr' ? 'D\u00e9crivez votre projet' : 'Describe Your Project'}
                    </p>
                    <p className="text-xs text-stone-500 mt-0.5">
                      {locale === 'zh' ? '告诉AI您的预算、风格偏好和安装位置' : locale === 'fr' ? 'Indiquez votre budget, style et emplacement' : 'Tell the AI your budget, style preferences, and installation location'}
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-7 h-7 bg-amber-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-xs font-bold text-amber-800">2</span>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-stone-800">
                      {locale === 'zh' ? '上传您的空间照片' : locale === 'fr' ? 'T\u00e9l\u00e9chargez une photo de votre espace' : 'Upload a Photo of Your Space'}
                    </p>
                    <p className="text-xs text-stone-500 mt-0.5">
                      {locale === 'zh' ? '拍一张您的厨房或卫生间照片，AI将分析您的空间' : locale === 'fr' ? 'Prenez une photo de votre cuisine ou salle de bain' : 'Take a photo of your kitchen or bathroom for AI analysis'}
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-7 h-7 bg-amber-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-xs font-bold text-amber-800">3</span>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-stone-800">
                      {locale === 'zh' ? '获取AI效果图预览' : locale === 'fr' ? 'Obtenez un aper\u00e7u IA' : 'Get AI-Rendered Previews'}
                    </p>
                    <p className="text-xs text-stone-500 mt-0.5">
                      {locale === 'zh' ? 'AI将渲染石材在您空间中的逼真效果图' : locale === 'fr' ? 'L\'IA rendra un aper\u00e7u r\u00e9aliste de la pierre dans votre espace' : 'AI renders a photorealistic preview of the stone in your space'}
                    </p>
                  </div>
                </div>
              </div>
              <Link
                href={`/${locale}/chat`}
                className="inline-flex items-center gap-2 mt-6 px-6 py-2.5 text-sm font-medium text-white bg-stone-900 rounded-md hover:bg-stone-800 transition-all w-fit"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
                {locale === 'zh' ? '开始对话' : locale === 'fr' ? 'Commencer la conversation' : 'Start Chatting'}
              </Link>
            </div>
            <div className="bg-[#faf8f5] rounded-xl border border-stone-100 p-6 flex flex-col justify-center">
              <div className="space-y-3">
                {/* Mock chat bubbles */}
                <div className="flex gap-2 justify-end">
                  <div className="bg-stone-900 text-white rounded-xl px-4 py-2.5 max-w-[80%]">
                    <p className="text-sm">
                      {locale === 'zh' ? '我想给厨房岛台换一块白色大理石台面，预算在$2000左右' : locale === 'fr' ? 'Je cherche un comptoir en marbre blanc pour mon \u00eelot de cuisine, budget ~$2000' : 'I want a white marble countertop for my kitchen island, budget around $2000'}
                    </p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <div className="w-7 h-7 bg-[#f5f0ea] rounded-full flex items-center justify-center flex-shrink-0">
                    <svg className="w-3.5 h-3.5 text-amber-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                    </svg>
                  </div>
                  <div className="bg-white border border-stone-100 rounded-xl px-4 py-2.5 max-w-[80%]">
                    <p className="text-sm text-stone-700">
                      {locale === 'zh' ? '根据您的预算和风格，我推荐Calacatta Gold系列。想看看它在您厨房中的效果吗？' : locale === 'fr' ? 'Selon votre budget et style, je recommande le Calacatta Gold. Voulez-vous voir un aper\u00e7u dans votre cuisine ?' : 'Based on your budget and style, I recommend our Calacatta Gold. Would you like to see a preview in your kitchen?'}
                    </p>
                  </div>
                </div>
                <div className="flex gap-2 justify-end">
                  <div className="bg-stone-900 text-white rounded-xl px-4 py-2.5">
                    <p className="text-sm">
                      {locale === 'zh' ? '好的，请生成效果图！' : locale === 'fr' ? 'Oui, g\u00e9n\u00e9rez un aper\u00e7u !' : 'Yes, generate a preview!'}
                    </p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <div className="w-7 h-7 bg-[#f5f0ea] rounded-full flex items-center justify-center flex-shrink-0">
                    <svg className="w-3.5 h-3.5 text-amber-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                    </svg>
                  </div>
                  <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 max-w-[80%]">
                    <div className="flex items-center gap-2 mb-1">
                      <svg className="w-3.5 h-3.5 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      <span className="text-xs font-medium text-amber-800">
                        {locale === 'zh' ? 'AI效果图已生成' : locale === 'fr' ? 'Visualisation IA g\u00e9n\u00e9r\u00e9e' : 'AI Visualization Generated'}
                      </span>
                    </div>
                    <div className="w-full h-24 bg-gradient-to-br from-stone-200 via-amber-100 to-stone-300 rounded-lg flex items-center justify-center">
                      <svg className="w-8 h-8 text-amber-600/50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* 3D Scene Tutorial */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            <div className="bg-[#faf8f5] rounded-xl border border-stone-100 p-6 flex flex-col justify-center order-2 lg:order-1">
              <div className="space-y-4">
                <div className="bg-white border border-stone-100 rounded-xl p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <svg className="w-5 h-5 text-amber-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M14 10l-2 1m0 0l-2-1m2 1v2.5M20 7l-2 1m2-1l-2-1m2 1v2.5M14 4l-2-1-2 1M4 7l2-1M4 7l2 1M4 7v2.5M12 21l-2-1m2 1l2-1m-2 1v-2.5M6 18l-2-1v-2.5M18 18l2-1v-2.5" />
                    </svg>
                    <span className="text-sm font-semibold text-stone-800">
                      {locale === 'zh' ? '3D场景生成器' : locale === 'fr' ? 'G\u00e9n\u00e9rateur de sc\u00e8ne 3D' : '3D Scene Generator'}
                    </span>
                  </div>
                  <div className="w-full h-32 bg-gradient-to-br from-stone-100 via-amber-50 to-stone-200 rounded-lg flex items-center justify-center relative overflow-hidden">
                    <div className="absolute inset-0 bg-[conic-gradient(from_0deg,transparent,rgba(180,140,100,0.1),transparent,rgba(180,140,100,0.05),transparent)] animate-spin" style={{animationDuration: '8s'}} />
                    <svg className="w-12 h-12 text-amber-600/40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M14 10l-2 1m0 0l-2-1m2 1v2.5M20 7l-2 1m2-1l-2-1m2 1v2.5M14 4l-2-1-2 1M4 7l2-1M4 7l2 1M4 7v2.5M12 21l-2-1m2 1l2-1m-2 1v-2.5M6 18l-2-1v-2.5M18 18l2-1v-2.5" />
                    </svg>
                  </div>
                  <div className="mt-3 flex items-center gap-2">
                    <div className="flex-1 bg-stone-100 rounded-full h-1.5">
                      <div className="bg-amber-500 h-1.5 rounded-full w-[75%]" />
                    </div>
                    <span className="text-[10px] text-stone-400">75%</span>
                  </div>
                  <p className="text-xs text-stone-500 mt-1">
                    {locale === 'zh' ? '正在重建3D几何体...' : locale === 'fr' ? 'Reconstruction de la g\u00e9om\u00e9trie 3D...' : 'Reconstructing 3D geometry...'}
                  </p>
                </div>
              </div>
            </div>
            <div className="flex flex-col justify-center order-1 lg:order-2">
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-amber-50 border border-amber-100 rounded-full w-fit mb-4">
                <svg className="w-4 h-4 text-amber-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M14 10l-2 1m0 0l-2-1m2 1v2.5M20 7l-2 1m2-1l-2-1m2 1v2.5M14 4l-2-1-2 1M4 7l2-1M4 7l2 1M4 7v2.5M12 21l-2-1m2 1l2-1m-2 1v-2.5M6 18l-2-1v-2.5M18 18l2-1v-2.5" />
                </svg>
                <span className="text-xs font-medium text-amber-800">
                  {locale === 'zh' ? '3D沉浸式体验' : locale === 'fr' ? 'Exp\u00e9rience 3D immersive' : 'Immersive 3D Experience'}
                </span>
              </div>
              <h3 className="text-2xl font-bold text-stone-900 mb-4">
                {locale === 'zh' ? '将效果图转化为3D沉浸式场景' : locale === 'fr' ? 'Transformez les aper\u00e7us en sc\u00e8nes 3D immersives' : 'Transform Previews into Immersive 3D Scenes'}
              </h3>
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <div className="w-7 h-7 bg-amber-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-xs font-bold text-amber-800">1</span>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-stone-800">
                      {locale === 'zh' ? '选择AI效果图' : locale === 'fr' ? 'S\u00e9lectionnez une visualisation IA' : 'Select an AI Visualization'}
                    </p>
                    <p className="text-xs text-stone-500 mt-0.5">
                      {locale === 'zh' ? '在AI助手中生成的效果图会自动保存到这里' : locale === 'fr' ? 'Les visualisations g\u00e9n\u00e9r\u00e9es dans l\'assistant IA sont automatiquement sauvegard\u00e9es ici' : 'Visualizations generated in AI Assistant are automatically saved here'}
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-7 h-7 bg-amber-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-xs font-bold text-amber-800">2</span>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-stone-800">
                      {locale === 'zh' ? '选择体验模式' : locale === 'fr' ? 'Choisissez le mode d\'exp\u00e9rience' : 'Choose Experience Mode'}
                    </p>
                    <p className="text-xs text-stone-500 mt-0.5">
                      {locale === 'zh' ? '快速预览(~30秒)或高清沉浸式体验(~5分钟)' : locale === 'fr' ? 'Aper\u00e7u rapide (~30s) ou exp\u00e9rience HD immersive (~5min)' : 'Quick Preview (~30s) or HD Immersive Experience (~5min)'}
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-7 h-7 bg-amber-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-xs font-bold text-amber-800">3</span>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-stone-800">
                      {locale === 'zh' ? '探索互动式3D场景' : locale === 'fr' ? 'Explorez la sc\u00e8ne 3D interactive' : 'Explore the Interactive 3D Scene'}
                    </p>
                    <p className="text-xs text-stone-500 mt-0.5">
                      {locale === 'zh' ? '在浏览器中360°旋转、缩放，身临其境感受设计效果' : locale === 'fr' ? 'Rotation 360\u00b0 et zoom dans votre navigateur pour une exp\u00e9rience immersive' : 'Rotate 360\u00b0 and zoom in your browser for a truly immersive experience'}
                    </p>
                  </div>
                </div>
              </div>
              <Link
                href={`/${locale}/3d-gen`}
                className="inline-flex items-center gap-2 mt-6 px-6 py-2.5 text-sm font-medium text-white bg-stone-900 rounded-md hover:bg-stone-800 transition-all w-fit"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M14 10l-2 1m0 0l-2-1m2 1v2.5M20 7l-2 1m2-1l-2-1m2 1v2.5M14 4l-2-1-2 1M4 7l2-1M4 7l2 1M4 7v2.5M12 21l-2-1m2 1l2-1m-2 1v-2.5M6 18l-2-1v-2.5M18 18l2-1v-2.5" />
                </svg>
                {locale === 'zh' ? '体验3D场景' : locale === 'fr' ? 'Essayer la sc\u00e8ne 3D' : 'Try 3D Scene'}
              </Link>
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
            {locale === 'zh' ? '让您的空间成为艺术' : locale === 'fr' ? 'Laissez votre espace devenir art' : 'Let Your Space Be Art'}
          </h2>
          <div className="w-12 h-[1px] bg-amber-700/40 mx-auto mt-4" />
        </div>
      </section>
    </div>
  );
}
