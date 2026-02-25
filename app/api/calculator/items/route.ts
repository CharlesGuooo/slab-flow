import { NextResponse } from 'next/server';
import { db, calculationItems, tenants } from '@/lib/db';
import { eq } from 'drizzle-orm';

// GET - Get calculation items for tenant
export async function GET() {
  try {
    // Get tenant from host
    const host = process.env.NODE_ENV === 'development' ? 'localhost' : '';
    const subdomain = host.split('.')[0];

    // Get tenant
    const tenant = await db
      .select()
      .from(tenants)
      .where(eq(tenants.domain, subdomain === 'localhost' ? 'test-company.localhost' : `${subdomain}.localhost`))
      .limit(1);

    if (!tenant.length) {
      return NextResponse.json(
        { error: 'Tenant not found' },
        { status: 404 }
      );
    }

    const items = await db
      .select()
      .from(calculationItems)
      .where(eq(calculationItems.tenantId, tenant[0].id));

    return NextResponse.json({
      items,
    });
  } catch (error) {
    console.error('Get calculation items error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
