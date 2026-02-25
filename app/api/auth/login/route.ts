import { NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { SignJWT } from 'jose';
import bcrypt from 'bcryptjs';
import { db, users } from '@/lib/db';
import { eq, and } from 'drizzle-orm';

const JWT_SECRET = new TextEncoder().encode(
  process.env.AUTH_SECRET || 'default-secret-change-in-production'
);

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email, pin } = body;

    // Validate required fields
    if (!email || !pin) {
      return NextResponse.json(
        { error: 'Email and PIN are required' },
        { status: 400 }
      );
    }

    // Get tenant from headers
    const headersList = await headers();
    const tenantId = headersList.get('x-tenant-id');

    if (!tenantId) {
      return NextResponse.json(
        { error: 'Tenant not found' },
        { status: 400 }
      );
    }

    // Find user with email AND tenantId
    const userResult = await db
      .select()
      .from(users)
      .where(
        and(
          eq(users.email, email),
          eq(users.tenantId, parseInt(tenantId, 10))
        )
      )
      .limit(1);

    if (userResult.length === 0) {
      return NextResponse.json(
        { error: 'Invalid email or PIN' },
        { status: 401 }
      );
    }

    const user = userResult[0];

    // Verify PIN
    if (!user.pin) {
      return NextResponse.json(
        { error: 'Account not properly set up. Please register again.' },
        { status: 401 }
      );
    }

    const isValidPin = await bcrypt.compare(pin, user.pin);
    if (!isValidPin) {
      return NextResponse.json(
        { error: 'Invalid email or PIN' },
        { status: 401 }
      );
    }

    // Create JWT token
    const token = await new SignJWT({
      userId: user.id,
      email: user.email,
      tenantId: user.tenantId,
    })
      .setProtectedHeader({ alg: 'HS256' })
      .setIssuedAt()
      .setExpirationTime('7d')
      .sign(JWT_SECRET);

    // Set cookie and return success
    const response = NextResponse.json({
      success: true,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
      },
    });

    response.cookies.set('user_session', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7, // 7 days
      path: '/',
    });

    return response;
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
