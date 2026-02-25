import { headers } from 'next/headers';
import { notFound } from 'next/navigation';
import { getRequestConfig } from 'next-intl/server';
import { locales, type Locale } from './lib/i18n/config';

export default getRequestConfig(async () => {
  const headersList = await headers();
  const locale = headersList.get('x-locale') || 'en';

  // Validate locale
  if (!locales.includes(locale as Locale)) {
    notFound();
  }

  return {
    locale,
    messages: (await import(`./messages/${locale}.json`)).default,
  };
});
