import { NextResponse } from 'next/server';
import { db, calculationItems } from '@/lib/db';
import { eq } from 'drizzle-orm';
import { headers } from 'next/headers';

// GET - Get calculation items for tenant
export async function GET() {
  try {
    // Get tenant ID from middleware headers
    const headersList = await headers();
    const tenantId = headersList.get('x-tenant-id');

    if (!tenantId) {
      return NextResponse.json(
        { error: 'Tenant not found' },
        { status: 404 }
      );
    }

    const items = await db
      .select()
      .from(calculationItems)
      .where(eq(calculationItems.tenantId, parseInt(tenantId, 10)));

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
