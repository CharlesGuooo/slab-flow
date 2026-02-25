import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Supported locales
const locales = ['en', 'zh', 'fr'] as const;
type Locale = (typeof locales)[number];
const defaultLocale: Locale = 'en';

// Routes that don't require tenant identification
const PUBLIC_ROUTES = [
  '/platform-admin',
  '/api/platform-admin',
  '/api/internal',
  '/_next',
  '/favicon.ico',
  '/robots.txt',
  '/sitemap.xml',
  '/suspended',
  '/not-found',
  '/api/auth',
  '/api/chat',
  '/api/upload',
  '/api/render',
  '/api/reconstruct',
  '/api/test-email',
  '/images',
];

// Static file patterns to skip
const STATIC_PATTERNS = [
  /\.(jpg|jpeg|png|gif|webp|avif|svg|ico|woff|woff2|ttf|eot|css|js)$/i,
];

/**
 * Check if a path should skip tenant identification
 */
function shouldSkipTenantCheck(pathname: string): boolean {
  // Check for static files
  if (STATIC_PATTERNS.some((pattern) => pattern.test(pathname))) {
    return true;
  }

  // Check for public routes
  if (PUBLIC_ROUTES.some((route) => pathname.startsWith(route))) {
    return true;
  }

  // Root path
  if (pathname === '/') {
    return true;
  }

  return false;
}

/**
 * Extract locale from pathname
 */
function getLocaleFromPathname(pathname: string): Locale | null {
  const segments = pathname.split('/').filter(Boolean);
  const firstSegment = segments[0];

  if (locales.includes(firstSegment as Locale)) {
    return firstSegment as Locale;
  }

  return null;
}

/**
 * Get locale from Accept-Language header
 */
function getLocaleFromHeader(acceptLanguage: string | null): Locale {
  if (!acceptLanguage) return defaultLocale;

  const languages = acceptLanguage.split(',').map((lang) => {
    const [locale] = lang.trim().split(';');
    return locale.split('-')[0].toLowerCase();
  });

  for (const lang of languages) {
    if (locales.includes(lang as Locale)) {
      return lang as Locale;
    }
  }

  return defaultLocale;
}

export async function middleware(request: NextRequest) {
  const { pathname, searchParams } = request.nextUrl;

  // Skip middleware for public routes and static files
  if (shouldSkipTenantCheck(pathname)) {
    return NextResponse.next();
  }

  // Determine locale - priority: URL path > cookie > Accept-Language header
  const pathLocale = getLocaleFromPathname(pathname);
  const cookieLocale = request.cookies.get('locale')?.value;

  let locale: Locale;

  if (pathLocale) {
    locale = pathLocale;
  } else if (cookieLocale && locales.includes(cookieLocale as Locale)) {
    locale = cookieLocale as Locale;
  } else {
    locale = getLocaleFromHeader(request.headers.get('accept-language'));
  }

  // For local development, use a fixed development tenant
  // This allows testing without needing to set up subdomains
  const host = request.headers.get('host') || '';
  const isLocalhost = host.startsWith('localhost');

  if (isLocalhost) {
    const response = NextResponse.next();
    response.headers.set('x-tenant-id', '1');  // Default to first tenant
    response.headers.set('x-tenant-name', 'Test Stone Company');
    response.headers.set('x-tenant-active', 'true');
    response.headers.set('x-locale', locale);
    response.headers.set(
      'x-tenant-features',
      JSON.stringify({
        chatbot: true,
        calculator: true,
        '3d-reconstruction': true,
      })
    );
    return response;
  }

  // For production domains, look up tenant
  // Since middleware runs in edge runtime and can't access SQLite directly,
  // redirect to not-found page for unknown domains
  const url = request.nextUrl.clone();
  url.pathname = '/not-found';
  return NextResponse.redirect(url);
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder files
     */
    '/((?!_next/static|_next/image|favicon.ico|public/).*)',
  ],
};
