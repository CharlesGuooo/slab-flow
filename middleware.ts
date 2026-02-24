import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Routes that don't require tenant identification
const PUBLIC_ROUTES = [
  '/platform-admin',
  '/api/platform-admin',
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

  // For local development without a real database,
  // we skip tenant identification on localhost
  // In production, this will use the database
  if (domain === 'localhost' || domain.startsWith('localhost:')) {
    // Call our internal API to get tenant info
    try {
      const tenantResponse = await fetch(
        new URL('/api/internal/tenant-lookup', request.url),
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ domain }),
        }
      );

      if (tenantResponse.ok) {
        const tenant = await tenantResponse.json();

        if (!tenant.isActive) {
          // Tenant service is suspended
          if (pathname.startsWith('/admin')) {
            const response = NextResponse.next();
            response.headers.set('x-tenant-id', tenant.id.toString());
            response.headers.set('x-tenant-active', 'false');
            return response;
          }

          const url = request.nextUrl.clone();
          url.pathname = '/suspended';
          url.searchParams.set('tenant', tenant.name);
          return NextResponse.redirect(url);
        }

        // Tenant is active
        const response = NextResponse.next();
        response.headers.set('x-tenant-id', tenant.id.toString());
        response.headers.set('x-tenant-name', tenant.name);
        response.headers.set('x-tenant-active', 'true');
        response.headers.set(
          'x-tenant-features',
          JSON.stringify({
            chatbot: tenant.featureChatbot,
            calculator: tenant.featureCalculator,
            '3d-reconstruction': tenant.feature3dReconstruction,
          })
        );
        return response;
      }
    } catch (error) {
      console.error('Middleware tenant lookup error:', error);
    }

    // If lookup fails or no tenant found, pass through
    // Pages can handle missing tenant gracefully
    return NextResponse.next();
  }

  // For production domains, we would query the database directly
  // But since middleware runs in edge runtime, we use the API approach
  try {
    const tenantResponse = await fetch(
      new URL('/api/internal/tenant-lookup', request.url),
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ domain }),
      }
    );

    if (tenantResponse.ok) {
      const tenant = await tenantResponse.json();

      if (!tenant.isActive) {
        if (pathname.startsWith('/admin')) {
          const response = NextResponse.next();
          response.headers.set('x-tenant-id', tenant.id.toString());
          response.headers.set('x-tenant-active', 'false');
          return response;
        }

        const url = request.nextUrl.clone();
        url.pathname = '/suspended';
        url.searchParams.set('tenant', tenant.name);
        return NextResponse.redirect(url);
      }

      const response = NextResponse.next();
      response.headers.set('x-tenant-id', tenant.id.toString());
      response.headers.set('x-tenant-name', tenant.name);
      response.headers.set('x-tenant-active', 'true');
      response.headers.set(
        'x-tenant-features',
        JSON.stringify({
          chatbot: tenant.featureChatbot,
          calculator: tenant.featureCalculator,
          '3d-reconstruction': tenant.feature3dReconstruction,
        })
      );
      return response;
    }
  } catch (error) {
    console.error('Middleware tenant lookup error:', error);
  }

  // Tenant not found
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
