import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { db } from './lib/db';
import { tenants } from './lib/db';
import { eq } from 'drizzle-orm';

// Routes that don't require tenant identification
const PUBLIC_ROUTES = [
  '/platform-admin',
  '/api/platform-admin',
  '/_next',
  '/favicon.ico',
  '/robots.txt',
  '/sitemap.xml',
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

  // For localhost development, use the full host
  if (domain === 'localhost' || domain.startsWith('localhost:')) {
    return domain;
  }

  return domain;
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Skip tenant check for public routes and static files
  if (shouldSkipTenantCheck(pathname)) {
    return NextResponse.next();
  }

  // Get the host from the request
  const host = request.headers.get('host');
  const domain = extractDomain(host);

  if (!domain) {
    // No domain found, redirect to platform home or 404
    const url = request.nextUrl.clone();
    url.pathname = '/';
    return NextResponse.redirect(url);
  }

  try {
    // Query the database for the tenant
    const tenantResult = await db
      .select()
      .from(tenants)
      .where(eq(tenants.domain, domain))
      .limit(1);

    const tenant = tenantResult[0];

    if (!tenant) {
      // Tenant not found, redirect to platform 404 or landing page
      const url = request.nextUrl.clone();
      url.pathname = '/not-found';
      return NextResponse.redirect(url);
    }

    if (!tenant.isActive) {
      // Tenant service is suspended
      // Allow access to admin routes so tenant admin can check status
      if (pathname.startsWith('/admin')) {
        // Inject tenant info but allow access
        const response = NextResponse.next();
        response.headers.set('x-tenant-id', tenant.id.toString());
        response.headers.set('x-tenant-active', 'false');
        return response;
      }

      // For non-admin routes, show suspended page
      const url = request.nextUrl.clone();
      url.pathname = '/suspended';
      url.searchParams.set('tenant', tenant.name);
      return NextResponse.redirect(url);
    }

    // Tenant is active, inject tenant info into headers
    const response = NextResponse.next();
    response.headers.set('x-tenant-id', tenant.id.toString());
    response.headers.set('x-tenant-name', tenant.name);
    response.headers.set('x-tenant-active', 'true');

    // Add feature flags
    response.headers.set(
      'x-tenant-features',
      JSON.stringify({
        chatbot: tenant.featureChatbot,
        calculator: tenant.featureCalculator,
        '3d-reconstruction': tenant.feature3dReconstruction,
      })
    );

    return response;
  } catch (error) {
    console.error('Middleware database error:', error);

    // On database error, allow request to continue
    // The page can handle missing tenant gracefully
    return NextResponse.next();
  }
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
