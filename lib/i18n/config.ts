import { Pathnames, LocalePrefix } from 'next-intl/routing';

export const locales = ['en', 'zh', 'fr'] as const;
export type Locale = (typeof locales)[number];

export const defaultLocale: Locale = 'en';

export const pathnames: Pathnames<typeof locales> = {
  '/': '/',
  '/browse': '/browse',
  '/chat': '/chat',
  '/calculator': '/calculator',
  '/login': '/login',
  '/register': '/register',
  '/account': '/account',
  '/account/orders': '/account/orders',
  '/account/new-quote': '/account/new-quote',
};

export const localePrefix: LocalePrefix<typeof locales> = 'always';
