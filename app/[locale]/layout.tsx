import { headers } from 'next/headers';
import Link from 'next/link';
import { db, tenants } from '@/lib/db';
import { eq } from 'drizzle-orm';
import { LanguageSwitcher } from '@/components/LanguageSwitcher';
import { ThemeToggle } from '@/components/ThemeToggle';
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

  // Validate locale
  if (!locales.includes(locale as Locale)) {
    notFound();
  }

  // Get tenant info from headers (set by middleware)
  const headersList = await headers();
  const tenantId = headersList.get('x-tenant-id');
  const currentLocale = await getLocale();
  const t = await createTranslator('nav');
  const tFooter = await createTranslator('footer');

  // Get messages for the locale
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

  const primaryColor = tenant?.themePrimaryColor || '#3b82f6';

  return (
    <NextIntlClientProvider messages={messages}>
      <div className="min-h-screen flex flex-col bg-white dark:bg-gray-900">
        {/* Header */}
        <header
          className="sticky top-0 z-40 border-b bg-white dark:bg-gray-900"
          style={{ borderColor: primaryColor + '30' }}
        >
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-16">
              {/* Logo / Brand */}
              <div className="flex-shrink-0">
                <Link href={`/${locale}`} className="flex items-center gap-3">
                  {tenant?.themeLogoUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={tenant.themeLogoUrl}
                      alt={tenant.name}
                      className="h-8 w-auto"
                    />
                  ) : (
                    <span
                      className="text-xl font-bold"
                      style={{ color: primaryColor }}
                    >
                      {tenant?.name || 'SlabFlow'}
                    </span>
                  )}
                </Link>
              </div>

              {/* Navigation - Center */}
              <nav className="hidden md:flex items-center gap-6">
                <Link
                  href={`/${locale}/browse`}
                  className="text-sm font-medium text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors whitespace-nowrap"
                >
                  {t('browse')}
                </Link>
                {tenant?.featureChatbot && (
                  <Link
                    href={`/${locale}/chat`}
                    className="text-sm font-medium text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors whitespace-nowrap"
                  >
                    {t('chat')}
                  </Link>
                )}
                {tenant?.featureCalculator && (
                  <Link
                    href={`/${locale}/calculator`}
                    className="text-sm font-medium text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors whitespace-nowrap"
                  >
                    {t('calculator')}
                  </Link>
                )}
              </nav>

              {/* Right side: theme, language, auth */}
              <div className="flex items-center gap-2 sm:gap-3">
                <ThemeToggle />
                <LanguageSwitcher currentLocale={currentLocale} />
                <Link
                  href={`/${locale}/login`}
                  className="text-sm font-medium text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors whitespace-nowrap"
                >
                  {t('login')}
                </Link>
                <Link
                  href={`/${locale}/register`}
                  className="inline-flex items-center px-4 py-2 text-sm font-medium text-white rounded-lg transition-colors whitespace-nowrap"
                  style={{ backgroundColor: primaryColor }}
                >
                  {t('register')}
                </Link>
              </div>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="flex-1">
          {children}
        </main>

        {/* Footer */}
        <footer className="border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {/* Brand */}
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white mb-3">
                  {tenant?.name || 'SlabFlow'}
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Premium stone surfaces for your home
                </p>
              </div>

              {/* Contact */}
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white mb-3">{tFooter('contact')}</h3>
                <div className="space-y-2 text-sm text-gray-500 dark:text-gray-400">
                  {tenant?.contactPhone && (
                    <p>{tFooter('phone')}: {tenant.contactPhone}</p>
                  )}
                  {tenant?.contactEmail && (
                    <p>{tFooter('email')}: {tenant.contactEmail}</p>
                  )}
                  {tenant?.address && (
                    <p>{tFooter('address')}: {tenant.address}</p>
                  )}
                </div>
              </div>

              {/* Quick Links */}
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white mb-3">{tFooter('quickLinks')}</h3>
                <div className="space-y-2 text-sm">
                  <Link href={`/${locale}/browse`} className="block text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white">
                    {t('browse')}
                  </Link>
                  {tenant?.featureChatbot && (
                    <Link href={`/${locale}/chat`} className="block text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white">
                      {t('chat')}
                    </Link>
                  )}
                  {tenant?.featureCalculator && (
                    <Link href={`/${locale}/calculator`} className="block text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white">
                      {t('calculator')}
                    </Link>
                  )}
                  <Link href={`/${locale}/account`} className="block text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white">
                    {t('account')}
                  </Link>
                </div>
              </div>
            </div>

            <div className="mt-8 pt-8 border-t border-gray-200 dark:border-gray-700 text-center text-sm text-gray-400">
              &copy; {new Date().getFullYear()} {tenant?.name || 'SlabFlow'}. {tFooter('copyright')}.
            </div>
          </div>
        </footer>
      </div>
    </NextIntlClientProvider>
  );
}
