import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { jwtVerify } from 'jose';

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
      return NextResponse.json({ authenticated: false }, { status: 200 });
    }

    const { payload } = await jwtVerify(token, JWT_SECRET);

    return NextResponse.json({
      authenticated: true,
      userId: payload.userId,
      email: payload.email,
    });
  } catch {
    return NextResponse.json({ authenticated: false }, { status: 200 });
  }
}
