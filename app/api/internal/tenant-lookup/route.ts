import { NextRequest, NextResponse } from 'next/server';
import { db, tenants } from '@/lib/db';
import { eq } from 'drizzle-orm';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { domain } = body;

    if (!domain) {
      return NextResponse.json(
        { error: 'Domain is required' },
        { status: 400 }
      );
    }

    // Special case: return the first active tenant for development
    if (domain === '__default__') {
      const tenantResult = await db
        .select()
        .from(tenants)
        .where(eq(tenants.isActive, true))
        .limit(1);

      const tenant = tenantResult[0];

      if (!tenant) {
        return NextResponse.json(
          { error: 'No active tenant found' },
          { status: 404 }
        );
      }

      return NextResponse.json(tenant);
    }

    // Query the database for the tenant
    const tenantResult = await db
      .select()
      .from(tenants)
      .where(eq(tenants.domain, domain))
      .limit(1);

    const tenant = tenantResult[0];

    if (!tenant) {
      return NextResponse.json(
        { error: 'Tenant not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(tenant);
  } catch (error) {
    console.error('Tenant lookup error:', error);
    return NextResponse.json(
      { error: 'Failed to lookup tenant' },
      { status: 500 }
    );
  }
}
