import { NextResponse } from 'next/server';
import { getTenantAdminSession, getTenantById, getAdminById } from '@/lib/auth';

export async function GET() {
  try {
    const session = await getTenantAdminSession();

    if (!session) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      );
    }

    // Get tenant info
    const tenant = await getTenantById(session.tenantId);
    if (!tenant) {
      return NextResponse.json(
        { error: 'Tenant not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      adminId: session.adminId,
      email: session.email,
      role: session.role,
      tenantId: session.tenantId,
      tenantName: tenant.name,
    });
  } catch (error) {
    console.error('Auth verification error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
