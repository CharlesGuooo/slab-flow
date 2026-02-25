import { cookies } from 'next/headers';
import { headers } from 'next/headers';
import { locales, defaultLocale, type Locale } from './config';

type Messages = typeof import('../../messages/en.json');

const messagesCache: Record<string, Messages> = {};

/**
 * Get the current locale from headers or cookies
 */
export async function getLocale(): Promise<Locale> {
  const headersList = await headers();
  const headerLocale = headersList.get('x-locale');

  if (headerLocale && locales.includes(headerLocale as Locale)) {
    return headerLocale as Locale;
  }

  const cookieStore = await cookies();
  const cookieLocale = cookieStore.get('locale')?.value;

  if (cookieLocale && locales.includes(cookieLocale as Locale)) {
    return cookieLocale as Locale;
  }

  return defaultLocale;
}

/**
 * Get messages for a specific locale
 */
export async function getMessages(locale?: Locale): Promise<Messages> {
  const targetLocale = locale || (await getLocale());

  if (!messagesCache[targetLocale]) {
    try {
      messagesCache[targetLocale] = (await import(`../../messages/${targetLocale}.json`)).default;
    } catch {
      messagesCache[targetLocale] = (await import('../../messages/en.json')).default;
    }
  }

  return messagesCache[targetLocale];
}

/**
 * Get a translation by key path (e.g., 'common.loading')
 */
export async function t(keyPath: string, locale?: Locale): Promise<string> {
  const messages = await getMessages(locale);
  const keys = keyPath.split('.');
  let value: unknown = messages;

  for (const key of keys) {
    if (value && typeof value === 'object' && key in value) {
      value = (value as Record<string, unknown>)[key];
    } else {
      return keyPath; // Return key path if not found
    }
  }

  return typeof value === 'string' ? value : keyPath;
}

/**
 * Create a translation function bound to a specific locale
 */
export async function createTranslator(namespace?: string) {
  const locale = await getLocale();
  const messages = await getMessages(locale);

  return (key: string, params?: Record<string, string | number>): string => {
    const fullKey = namespace ? `${namespace}.${key}` : key;
    const keys = fullKey.split('.');
    let value: unknown = messages;

    for (const k of keys) {
      if (value && typeof value === 'object' && k in value) {
        value = (value as Record<string, unknown>)[k];
      } else {
        return fullKey;
      }
    }

    if (typeof value !== 'string') {
      return fullKey;
    }

    // Replace parameters like {orderId} with actual values
    if (params) {
      return Object.entries(params).reduce(
        (str, [paramKey, paramValue]) => str.replace(new RegExp(`\\{${paramKey}\\}`, 'g'), String(paramValue)),
        value
      );
    }

    return value;
  };
}
