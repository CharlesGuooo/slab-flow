import { headers } from 'next/headers';
import Link from 'next/link';
import { db, tenants } from '@/lib/db';
import { eq } from 'drizzle-orm';
import { LanguageSwitcher } from '@/components/LanguageSwitcher';
import { getLocale, createTranslator } from '@/lib/i18n';
import { locales, type Locale } from '@/lib/i18n/config';
import { notFound } from 'next/navigation';
import { NextIntlClientProvider } from 'next-intl';
import { getMessages } from 'next-intl/server';

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: { locale: string };
}) {
  const { locale } = params;

  if (!locales.includes(locale as Locale)) {
    notFound();
  }

  const headersList = await headers();
  const tenantId = headersList.get('x-tenant-id');
  const currentLocale = await getLocale();
  const t = await createTranslator('nav');
  const tFooter = await createTranslator('footer');
  const messages = await getMessages();

  let tenant = null;
  if (tenantId) {
    const result = await db
      .select()
      .from(tenants)
      .where(eq(tenants.id, parseInt(tenantId, 10)))
      .limit(1);
    tenant = result[0];
  }

  return (
    <NextIntlClientProvider messages={messages}>
      <div className="min-h-screen flex flex-col bg-stone-50">
        {/* ============================================ */}
        {/* PREMIUM HEADER */}
        {/* ============================================ */}
        <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-xl border-b border-stone-200/50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-16">
              {/* Logo / Brand */}
              <div className="flex-shrink-0">
                <Link href={`/${locale}`} className="flex items-center gap-3 group">
                  {tenant?.themeLogoUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={tenant.themeLogoUrl}
                      alt={tenant.name}
                      className="h-8 w-auto"
                    />
                  ) : (
                    <>
                      {/* Stone icon */}
                      <svg className="w-8 h-8 text-amber-600" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M4 10L16 4L28 10V22L16 28L4 22V10Z" fill="currentColor" fillOpacity="0.1" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"/>
                        <path d="M16 4V28M4 10L28 22M28 10L4 22" stroke="currentColor" strokeWidth="1" strokeOpacity="0.3"/>
                      </svg>
                      <span className="text-xl font-bold text-stone-800 group-hover:text-amber-700 transition-colors">
                        {tenant?.name || 'Stone Gallery'}
                      </span>
                    </>
                  )}
                </Link>
              </div>

              {/* Navigation */}
              <nav className="hidden md:flex items-center gap-8">
                <Link
                  href={`/${locale}`}
                  className="text-sm font-medium text-stone-600 hover:text-amber-700 transition-colors"
                >
                  Home
                </Link>
                <Link
                  href={`/${locale}/browse`}
                  className="text-sm font-medium text-stone-600 hover:text-amber-700 transition-colors"
                >
                  {t('browse')}
                </Link>
                {tenant?.featureChatbot && (
                  <Link
                    href={`/${locale}/chat`}
                    className="text-sm font-medium text-stone-600 hover:text-amber-700 transition-colors"
                  >
                    {t('chat')}
                  </Link>
                )}
                {tenant?.featureCalculator && (
                  <Link
                    href={`/${locale}/calculator`}
                    className="text-sm font-medium text-stone-600 hover:text-amber-700 transition-colors"
                  >
                    {t('calculator')}
                  </Link>
                )}
              </nav>

              {/* Right side */}
              <div className="flex items-center gap-3">
                <LanguageSwitcher currentLocale={currentLocale} />
                <Link
                  href={`/${locale}/login`}
                  className="inline-flex items-center px-5 py-2 text-sm font-semibold text-white bg-gradient-to-r from-amber-600 to-amber-700 rounded-lg hover:from-amber-500 hover:to-amber-600 transition-all shadow-sm"
                >
                  {t('login')}
                </Link>
              </div>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="flex-1">
          {children}
        </main>

        {/* ============================================ */}
        {/* PREMIUM FOOTER */}
        {/* ============================================ */}
        <footer className="bg-stone-900 text-stone-300">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
              {/* Brand */}
              <div className="md:col-span-2">
                <div className="flex items-center gap-3 mb-4">
                  <svg className="w-8 h-8 text-amber-500" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M4 10L16 4L28 10V22L16 28L4 22V10Z" fill="currentColor" fillOpacity="0.2" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"/>
                    <path d="M16 4V28M4 10L28 22M28 10L4 22" stroke="currentColor" strokeWidth="1" strokeOpacity="0.3"/>
                  </svg>
                  <span className="text-xl font-bold text-white">
                    {tenant?.name || 'Stone Gallery'}
                  </span>
                </div>
                <p className="text-stone-400 text-sm leading-relaxed max-w-md">
                  Premium natural stone surfaces for residential and commercial projects. 
                  Discover the beauty of marble, granite, and quartz crafted by nature.
                </p>
              </div>

              {/* Contact */}
              <div>
                <h3 className="font-semibold text-white mb-4 text-sm uppercase tracking-wider">{tFooter('contact')}</h3>
                <div className="space-y-3 text-sm text-stone-400">
                  {tenant?.contactPhone && (
                    <p className="flex items-center gap-2">
                      <svg className="w-4 h-4 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                      </svg>
                      {tenant.contactPhone}
                    </p>
                  )}
                  {tenant?.contactEmail && (
                    <p className="flex items-center gap-2">
                      <svg className="w-4 h-4 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                      </svg>
                      {tenant.contactEmail}
                    </p>
                  )}
                  {tenant?.address && (
                    <p className="flex items-start gap-2">
                      <svg className="w-4 h-4 text-amber-500 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                      {tenant.address}
                    </p>
                  )}
                </div>
              </div>

              {/* Quick Links */}
              <div>
                <h3 className="font-semibold text-white mb-4 text-sm uppercase tracking-wider">{tFooter('quickLinks')}</h3>
                <div className="space-y-3 text-sm">
                  <Link href={`/${locale}/browse`} className="block text-stone-400 hover:text-amber-400 transition-colors">
                    {t('browse')}
                  </Link>
                  {tenant?.featureChatbot && (
                    <Link href={`/${locale}/chat`} className="block text-stone-400 hover:text-amber-400 transition-colors">
                      {t('chat')}
                    </Link>
                  )}
                  {tenant?.featureCalculator && (
                    <Link href={`/${locale}/calculator`} className="block text-stone-400 hover:text-amber-400 transition-colors">
                      {t('calculator')}
                    </Link>
                  )}
                  <Link href={`/${locale}/login`} className="block text-stone-400 hover:text-amber-400 transition-colors">
                    {t('login')}
                  </Link>
                </div>
              </div>
            </div>

            <div className="mt-12 pt-8 border-t border-stone-800 flex flex-col sm:flex-row justify-between items-center gap-4">
              <p className="text-xs text-stone-500">
                &copy; {new Date().getFullYear()} {tenant?.name || 'Stone Gallery'}. {tFooter('copyright')}.
              </p>
              <p className="text-xs text-stone-600">
                Powered by <span className="text-amber-500 font-medium">SlabFlow</span>
              </p>
            </div>
          </div>
        </footer>
      </div>
    </NextIntlClientProvider>
  );
}
