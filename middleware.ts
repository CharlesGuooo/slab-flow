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

/**
 * Set tenant headers on the response for a given tenant
 */
function setTenantHeaders(
  response: NextResponse,
  tenantId: string,
  tenantName: string,
  locale: Locale,
  features?: { chatbot: boolean; calculator: boolean; '3d-reconstruction': boolean }
): NextResponse {
  response.headers.set('x-tenant-id', tenantId);
  response.headers.set('x-tenant-name', tenantName);
  response.headers.set('x-tenant-active', 'true');
  response.headers.set('x-locale', locale);
  response.headers.set(
    'x-tenant-features',
    JSON.stringify(
      features || {
        chatbot: true,
        calculator: true,
        '3d-reconstruction': true,
      }
    )
  );
  return response;
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

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

  const host = request.headers.get('host') || '';
  const isLocalhost = host.startsWith('localhost');
  const isDev = process.env.NODE_ENV === 'development';

  // For local development, use a fixed development tenant
  if (isLocalhost || isDev) {
    const response = NextResponse.next();
    return setTenantHeaders(response, '1', 'Test Stone Company', locale);
  }

  // For production: resolve tenant from domain
  // 
  // Strategy:
  // 1. If DEFAULT_TENANT_ID env var is set, use it (single-tenant / demo mode)
  // 2. Otherwise, try to match host against tenant domains in the database
  // 3. If no match, try subdomain-based lookup (e.g., tenant-name.slabflow.app)
  //
  // For now, we support single-tenant mode via DEFAULT_TENANT_ID,
  // and Vercel domain / custom domain access.

  const defaultTenantId = process.env.DEFAULT_TENANT_ID;

  if (defaultTenantId) {
    // Single-tenant / demo mode: all requests go to this tenant
    const tenantName = process.env.DEFAULT_TENANT_NAME || 'SlabFlow';
    const response = NextResponse.next();
    return setTenantHeaders(response, defaultTenantId, tenantName, locale);
  }

  // Multi-tenant mode: try to resolve tenant from subdomain
  // e.g., test-company.slab-flow-zeta.vercel.app or test-company.yourdomain.com
  const baseDomain = process.env.BASE_DOMAIN || '';
  if (baseDomain && host.endsWith(baseDomain)) {
    const subdomain = host.replace(`.${baseDomain}`, '').split('.')[0];
    if (subdomain && subdomain !== 'www') {
      // TODO: Look up tenant by subdomain from database via edge-compatible fetch
      // For now, fall through to default
    }
  }

  // Fallback: If no tenant resolution strategy matched, default to tenant 1
  // This ensures the app works on any Vercel preview/production URL
  const response = NextResponse.next();
  return setTenantHeaders(response, '1', 'Test Stone Company', locale);
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
