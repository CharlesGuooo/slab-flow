import { NextResponse } from 'next/server';
import { getTenantAdminSession } from '@/lib/auth';
import { db, inventoryStones } from '@/lib/db';
import { eq, and } from 'drizzle-orm';

// GET - List all inventory stones for the tenant
export async function GET() {
  try {
    const session = await getTenantAdminSession();

    if (!session) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      );
    }

    const stones = await db
      .select()
      .from(inventoryStones)
      .where(
        and(
          eq(inventoryStones.tenantId, session.tenantId),
          eq(inventoryStones.isActive, true)
        )
      )
      .orderBy(inventoryStones.createdAt);

    return NextResponse.json({ stones });
  } catch (error) {
    console.error('Inventory API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST - Create a new inventory stone
export async function POST(request: Request) {
  try {
    const session = await getTenantAdminSession();

    if (!session) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const {
      brand,
      series,
      stoneType,
      pricePerSlab,
      imageUrl,
      name,
      description,
      tags,
    } = body;

    // Validate required fields
    if (!brand || !series || !imageUrl) {
      return NextResponse.json(
        { error: 'Brand, series, and image URL are required' },
        { status: 400 }
      );
    }

    const newStone = await db
      .insert(inventoryStones)
      .values({
        tenantId: session.tenantId,
        brand,
        series,
        stoneType: stoneType || 'quartz',
        pricePerSlab: pricePerSlab || '0.00',
        imageUrl,
        name: name || { en: series },
        description: description || {},
        tags: tags || [],
        isActive: true,
      })
      .returning();

    return NextResponse.json({ stone: newStone[0] }, { status: 201 });
  } catch (error) {
    console.error('Create inventory error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
