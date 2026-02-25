import { NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { db, inventoryStones } from '@/lib/db';
import { eq, and } from 'drizzle-orm';

// GET - Get a single stone for client view
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const headersList = await headers();
    const tenantId = headersList.get('x-tenant-id');

    if (!tenantId) {
      return NextResponse.json(
        { error: 'Tenant not found' },
        { status: 400 }
      );
    }

    const stoneId = parseInt(params.id, 10);

    const stone = await db
      .select()
      .from(inventoryStones)
      .where(
        and(
          eq(inventoryStones.id, stoneId),
          eq(inventoryStones.tenantId, parseInt(tenantId, 10)),
          eq(inventoryStones.isActive, true)
        )
      )
      .limit(1);

    if (stone.length === 0) {
      return NextResponse.json(
        { error: 'Stone not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ stone: stone[0] });
  } catch (error) {
    console.error('Get stone error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
