import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { jwtVerify } from 'jose';

// Force dynamic rendering - NEVER cache this route
// Without this, Vercel CDN caches the response and all users get the same result
export const dynamic = 'force-dynamic';
export const revalidate = 0;

const JWT_SECRET = new TextEncoder().encode(
  process.env.AUTH_SECRET || 'default-secret-change-in-production'
);

// Lightweight auth check - only verifies JWT, no DB query
// Used by ClientNav and other components to quickly check login state
export async function GET() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('user_session')?.value;

    if (!token) {
      const response = NextResponse.json({ authenticated: false }, { status: 200 });
      response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
      response.headers.set('Pragma', 'no-cache');
      response.headers.set('Expires', '0');
      return response;
    }

    const { payload } = await jwtVerify(token, JWT_SECRET);

    const response = NextResponse.json({
      authenticated: true,
      userId: payload.userId,
      email: payload.email,
    });
    response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    response.headers.set('Pragma', 'no-cache');
    response.headers.set('Expires', '0');
    return response;
  } catch {
    const response = NextResponse.json({ authenticated: false }, { status: 200 });
    response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    response.headers.set('Pragma', 'no-cache');
    response.headers.set('Expires', '0');
    return response;
  }
}
