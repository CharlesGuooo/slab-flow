import { headers } from 'next/headers';
import Link from 'next/link';
import { db, tenants } from '@/lib/db';
import { eq } from 'drizzle-orm';
import { LanguageSwitcher } from '@/components/LanguageSwitcher';
import { ClientNav } from '@/components/ClientNav';
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
  const featuresJson = headersList.get('x-tenant-features');
  const currentLocale = await getLocale();
  const t = await createTranslator('nav');
  const tFooter = await createTranslator('footer');
  const tCommon = await createTranslator('common');
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

  const features = featuresJson
    ? JSON.parse(featuresJson)
    : { chatbot: true, calculator: true, '3d-reconstruction': true };

  const navTranslations = {
    home: t('home'),
    browse: t('browse'),
    chat: t('chat'),
    calculator: t('calculator'),
    threeDGen: t('threeDGen'),
    account: t('account'),
    login: t('login'),
    logout: t('logout'),
  };

  return (
    <NextIntlClientProvider messages={messages}>
      <div className="min-h-screen flex flex-col bg-white">
        {/* ============================================ */}
        {/* HEADER - Clean, minimal, jwstone.ca inspired */}
        {/* ============================================ */}
        <header className="sticky top-0 z-40 bg-white border-b border-stone-100 relative">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-[72px]">
              {/* Logo / Brand */}
              <div className="flex-shrink-0">
                <Link href={`/${locale}`} className="flex items-center gap-3 group">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src="/logo.png"
                    alt={tenant?.name || 'CH Stone'}
                    className="h-12 w-auto"
                  />
                </Link>
              </div>

              {/* Center Navigation + Right Side Auth */}
              <ClientNav
                translations={navTranslations}
                features={features}
                loginRequiredText={tCommon('loginRequired')}
                loginRequiredDesc={tCommon('loginRequiredDesc')}
                signInNowText={tCommon('signInNow')}
                createAccountText={tCommon('createAccount')}
              />

              {/* Language Switcher - always visible */}
              <div className="hidden lg:block">
                <LanguageSwitcher currentLocale={currentLocale} />
              </div>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="flex-1">
          {children}
        </main>

        {/* ============================================ */}
        {/* FOOTER - Elegant, warm stone tones */}
        {/* ============================================ */}
        <footer className="bg-stone-900 text-stone-300">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-10">
              {/* Brand */}
              <div className="md:col-span-2">
                <div className="flex items-center gap-3 mb-5">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src="/logo.png" alt={tenant?.name || 'CH Stone'} className="h-10 w-auto rounded-md bg-white/95 px-2 py-1" />
                </div>
                <p className="text-stone-400 text-sm leading-relaxed max-w-md">
                  {tFooter('description')}
                </p>
              </div>

              {/* Contact */}
              <div>
                <h3 className="font-semibold text-white mb-4 text-xs uppercase tracking-[0.15em]">{tFooter('contact')}</h3>
                <div className="space-y-3 text-sm text-stone-400">
                  {tenant?.contactPhone && (
                    <p className="flex items-center gap-2">
                      <svg className="w-4 h-4 text-amber-500/70" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                      </svg>
                      {tenant.contactPhone}
                    </p>
                  )}
                  {tenant?.contactEmail && (
                    <p className="flex items-center gap-2">
                      <svg className="w-4 h-4 text-amber-500/70" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                      </svg>
                      {tenant.contactEmail}
                    </p>
                  )}
                  {tenant?.address && (
                    <p className="flex items-start gap-2">
                      <svg className="w-4 h-4 text-amber-500/70 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                      {tenant.address}
                    </p>
                  )}
                </div>
              </div>

              {/* Quick Links */}
              <div>
                <h3 className="font-semibold text-white mb-4 text-xs uppercase tracking-[0.15em]">{tFooter('quickLinks')}</h3>
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
                  {tenant?.feature3dReconstruction && (
                    <Link href={`/${locale}/3d-gen`} className="block text-stone-400 hover:text-amber-400 transition-colors">
                      {t('threeDGen')}
                    </Link>
                  )}
                </div>
              </div>
            </div>

            <div className="mt-14 pt-8 border-t border-stone-800 flex flex-col sm:flex-row justify-between items-center gap-4">
              <p className="text-xs text-stone-500">
                &copy; {new Date().getFullYear()} {tenant?.name || 'Stone Gallery'}. {tFooter('copyright')}.
              </p>
              <p className="text-xs text-stone-600">
                {tFooter('poweredBy')} <span className="text-amber-500 font-medium">SlabFlow</span>
              </p>
            </div>
          </div>
        </footer>
      </div>
    </NextIntlClientProvider>
  );
}
