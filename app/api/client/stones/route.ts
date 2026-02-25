import { NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { db, inventoryStones } from '@/lib/db';
import { eq, and } from 'drizzle-orm';

// GET - List all active stones for the tenant (client view)
export async function GET() {
  try {
    // Get tenant from headers
    const headersList = await headers();
    const tenantId = headersList.get('x-tenant-id');

    if (!tenantId) {
      return NextResponse.json(
        { error: 'Tenant not found' },
        { status: 400 }
      );
    }

    const stones = await db
      .select({
        id: inventoryStones.id,
        brand: inventoryStones.brand,
        series: inventoryStones.series,
        stoneType: inventoryStones.stoneType,
        pricePerSlab: inventoryStones.pricePerSlab,
        imageUrl: inventoryStones.imageUrl,
        name: inventoryStones.name,
      })
      .from(inventoryStones)
      .where(
        and(
          eq(inventoryStones.tenantId, parseInt(tenantId, 10)),
          eq(inventoryStones.isActive, true)
        )
      )
      .orderBy(inventoryStones.createdAt);

    return NextResponse.json({ stones });
  } catch (error) {
    console.error('Client stones API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
