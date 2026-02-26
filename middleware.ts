import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Supported locales
const locales = ['en', 'zh', 'fr'] as const;
type Locale = (typeof locales)[number];
const defaultLocale: Locale = 'en';

// Platform domain patterns (SlabFlow admin)
const PLATFORM_DOMAINS = ['slabflow.site', 'www.slabflow.site'];

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

function shouldSkipTenantCheck(pathname: string): boolean {
  if (STATIC_PATTERNS.some((pattern) => pattern.test(pathname))) {
    return true;
  }
  if (PUBLIC_ROUTES.some((route) => pathname.startsWith(route))) {
    return true;
  }
  return false;
}

function getLocaleFromPathname(pathname: string): Locale | null {
  const segments = pathname.split('/').filter(Boolean);
  const firstSegment = segments[0];
  if (locales.includes(firstSegment as Locale)) {
    return firstSegment as Locale;
  }
  return null;
}

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

/**
 * Check if the host is a platform domain (slabflow.site)
 * Only exact domain matches count as platform domain.
 * Vercel deployment URLs (*.vercel.app) are treated as tenant domains
 * so we can preview the tenant site without a custom domain.
 */
function isPlatformDomain(host: string): boolean {
  // Only exact matches for slabflow.site
  if (PLATFORM_DOMAINS.some((d) => host === d)) return true;
  // slabflow.site without www
  if (host === 'slabflow.site') return true;
  return false;
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const host = request.headers.get('host') || '';

  // Skip middleware for static files and public routes
  if (shouldSkipTenantCheck(pathname)) {
    return NextResponse.next();
  }

  // ============================================
  // PLATFORM DOMAIN HANDLING (slabflow.site)
  // ============================================
  if (isPlatformDomain(host)) {
    // Root path on platform domain → redirect to platform admin login
    if (pathname === '/') {
      return NextResponse.redirect(new URL('/platform-admin/login', request.url));
    }
    // Allow platform-admin routes to pass through
    if (pathname.startsWith('/platform-admin') || pathname.startsWith('/api/platform-admin')) {
      return NextResponse.next();
    }
    // Block tenant routes on platform domain - redirect to platform admin
    if (pathname.startsWith('/admin') || pathname.startsWith('/api/admin')) {
      return NextResponse.redirect(new URL('/platform-admin/login', request.url));
    }
    // For locale routes on platform domain, redirect to platform admin
    const pathLocale = getLocaleFromPathname(pathname);
    if (pathLocale) {
      return NextResponse.redirect(new URL('/platform-admin/login', request.url));
    }
    return NextResponse.next();
  }

  // ============================================
  // TENANT DOMAIN HANDLING (e.g., chstone.shop)
  // ============================================

  // Determine locale
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

  // Root path on tenant domain → redirect to locale landing page
  if (pathname === '/') {
    return NextResponse.redirect(new URL(`/${locale}`, request.url));
  }

  const isLocalhost = host.startsWith('localhost');
  const isDev = process.env.NODE_ENV === 'development';

  // For local development, use a fixed development tenant
  if (isLocalhost || isDev) {
    const response = NextResponse.next();
    return setTenantHeaders(response, '1', 'Test Stone Company', locale);
  }

  // Production: resolve tenant
  // Try to match host against known tenant domains
  // For now, any non-platform domain defaults to tenant 1
  const defaultTenantId = process.env.DEFAULT_TENANT_ID || '1';
  const defaultTenantName = process.env.DEFAULT_TENANT_NAME || 'CH Stone';

  const response = NextResponse.next();
  return setTenantHeaders(response, defaultTenantId, defaultTenantName, locale);
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|public/).*)',
  ],
};
