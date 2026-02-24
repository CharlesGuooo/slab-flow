import { NextRequest, NextResponse } from 'next/server';
import { SignJWT } from 'jose';
import { headers } from 'next/headers';
import { db, admins, tenants } from '@/lib/db';
import { eq, and } from 'drizzle-orm';
import bcrypt from 'bcryptjs';

const JWT_SECRET = new TextEncoder().encode(
  process.env.AUTH_SECRET || 'default-secret-change-in-production'
);

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      );
    }

    // Get tenant ID from headers (set by middleware)
    const headersList = await headers();
    const tenantIdHeader = headersList.get('x-tenant-id');

    if (!tenantIdHeader) {
      return NextResponse.json(
        { error: 'Tenant not identified. Please access via your tenant domain.' },
        { status: 400 }
      );
    }

    const tenantId = parseInt(tenantIdHeader, 10);

    // Query admin with email AND tenantId for tenant isolation
    const adminResults = await db
      .select({
        admin: admins,
        tenant: tenants,
      })
      .from(admins)
      .innerJoin(tenants, eq(admins.tenantId, tenants.id))
      .where(
        and(
          eq(admins.email, email),
          eq(admins.tenantId, tenantId),
          eq(admins.role, 'tenant_admin')
        )
      )
      .limit(1);

    if (adminResults.length === 0) {
      return NextResponse.json(
        { error: 'Invalid credentials' },
        { status: 401 }
      );
    }

    const { admin, tenant } = adminResults[0];

    // Verify password
    const isValidPassword = await bcrypt.compare(password, admin.passwordHash);

    if (!isValidPassword) {
      return NextResponse.json(
        { error: 'Invalid credentials' },
        { status: 401 }
      );
    }

    // Create JWT token
    const token = await new SignJWT({
      adminId: admin.id,
      email: admin.email,
      role: admin.role,
      tenantId: admin.tenantId,
    })
      .setProtectedHeader({ alg: 'HS256' })
      .setIssuedAt()
      .setExpirationTime('7d')
      .sign(JWT_SECRET);

    // Set cookie and return success
    const response = NextResponse.json({
      success: true,
      admin: {
        id: admin.id,
        email: admin.email,
        role: admin.role,
      },
      tenant: {
        id: tenant.id,
        name: tenant.name,
      },
    });

    response.cookies.set('tenant_admin_session', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7, // 7 days
      path: '/',
    });

    return response;
  } catch (error) {
    console.error('Tenant admin login error:', error);
    return NextResponse.json(
      { error: 'An error occurred during login' },
      { status: 500 }
    );
  }
}
