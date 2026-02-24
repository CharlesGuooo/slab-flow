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
