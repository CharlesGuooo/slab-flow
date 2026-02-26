import { NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { db, inventoryStones } from '@/lib/db';
import { eq, and } from 'drizzle-orm';

/**
 * GET - List all active stones for the tenant (public, no auth required)
 * Used by the chat page to display stone cards inline.
 */
export async function GET() {
  try {
    const headersList = await headers();
    const tenantId = headersList.get('x-tenant-id') || '1';

    const stones = await db
      .select({
        id: inventoryStones.id,
        brand: inventoryStones.brand,
        series: inventoryStones.series,
        stoneType: inventoryStones.stoneType,
        pricePerSlab: inventoryStones.pricePerSlab,
        imageUrl: inventoryStones.imageUrl,
        name: inventoryStones.name,
        description: inventoryStones.description,
      })
      .from(inventoryStones)
      .where(
        and(
          eq(inventoryStones.tenantId, parseInt(tenantId, 10)),
          eq(inventoryStones.isActive, true)
        )
      )
      .orderBy(inventoryStones.createdAt);

    // Parse JSON name fields and format for frontend
    const formatted = stones.map((s) => {
      let displayName = s.series;
      try {
        if (s.name) {
          const parsed = JSON.parse(s.name);
          displayName = parsed.en || parsed.zh || s.series;
        }
      } catch {
        displayName = s.name || s.series;
      }

      return {
        id: s.id,
        name: displayName,
        brand: s.brand,
        series: s.series,
        stoneType: s.stoneType,
        price: s.pricePerSlab || 'TBD',
        imageUrl: s.imageUrl || '',
      };
    });

    return NextResponse.json({ stones: formatted });
  } catch (error) {
    console.error('Stones API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
