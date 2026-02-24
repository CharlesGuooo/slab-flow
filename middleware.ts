import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

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
];

// Static file patterns to skip
const STATIC_PATTERNS = [
  /\.(jpg|jpeg|png|gif|webp|svg|ico|woff|woff2|ttf|eot|css|js)$/i,
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

  return false;
}

/**
 * Extract domain from host header
 */
function extractDomain(host: string | null): string | null {
  if (!host) return null;

  // Remove port if present
  const domain = host.split(':')[0];

  return domain;
}

export async function middleware(request: NextRequest) {
  const { pathname, searchParams } = request.nextUrl;

  // Skip tenant check for public routes and static files
  if (shouldSkipTenantCheck(pathname)) {
    return NextResponse.next();
  }

  // Get the host from the request
  const host = request.headers.get('host');
  let domain = extractDomain(host);

  // For local development, allow ?tenant= query parameter to specify tenant domain
  const tenantOverride = searchParams.get('tenant');
  if (tenantOverride && (domain === 'localhost' || domain?.startsWith('localhost:'))) {
    domain = tenantOverride;
  }

  if (!domain) {
    // No domain found, redirect to platform home or 404
    const url = request.nextUrl.clone();
    url.pathname = '/';
    return NextResponse.redirect(url);
  }

  // For local development on localhost without tenant override,
  // set a default tenant header for development convenience
  if (domain === 'localhost' || domain.startsWith('localhost:')) {
    // For local development, use a fixed development tenant
    // This allows testing without needing to set up subdomains
    const response = NextResponse.next();
    response.headers.set('x-tenant-id', '1');  // Default to first tenant
    response.headers.set('x-tenant-name', 'Test Stone Company');
    response.headers.set('x-tenant-active', 'true');
    response.headers.set(
      'x-tenant-features',
      JSON.stringify({
        chatbot: true,
        calculator: true,
        '3d-reconstruction': false,
      })
    );
    return response;
  }

  // For production domains, we need to look up the tenant
  // Since middleware runs in edge runtime and can't access SQLite directly,
  // we'll use a redirect-based approach where the frontend makes an API call
  // For now, for any non-localhost domain, redirect to tenant not found
  // In production, this would be replaced with a proper database lookup
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
