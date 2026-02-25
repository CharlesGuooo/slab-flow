import { NextResponse } from 'next/server';
import { getTenantAdminSession } from '@/lib/auth';
import { db, inventoryStones } from '@/lib/db';
import { eq, and } from 'drizzle-orm';

// GET - Get a single inventory stone
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getTenantAdminSession();

    if (!session) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      );
    }

    const stoneId = parseInt(params.id, 10);

    const stone = await db
      .select()
      .from(inventoryStones)
      .where(
        and(
          eq(inventoryStones.id, stoneId),
          eq(inventoryStones.tenantId, session.tenantId)
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
    console.error('Get inventory item error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// PUT - Update an inventory stone
export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getTenantAdminSession();

    if (!session) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      );
    }

    const stoneId = parseInt(params.id, 10);
    const body = await request.json();

    // First verify the stone belongs to this tenant
    const existing = await db
      .select()
      .from(inventoryStones)
      .where(
        and(
          eq(inventoryStones.id, stoneId),
          eq(inventoryStones.tenantId, session.tenantId)
        )
      )
      .limit(1);

    if (existing.length === 0) {
      return NextResponse.json(
        { error: 'Stone not found' },
        { status: 404 }
      );
    }

    // Update the stone
    const updateData: Record<string, unknown> = {};

    if (body.brand !== undefined) updateData.brand = body.brand;
    if (body.series !== undefined) updateData.series = body.series;
    if (body.stoneType !== undefined) updateData.stoneType = body.stoneType;
    if (body.pricePerSlab !== undefined) updateData.pricePerSlab = body.pricePerSlab;
    if (body.imageUrl !== undefined) updateData.imageUrl = body.imageUrl;
    if (body.name !== undefined) updateData.name = body.name;
    if (body.description !== undefined) updateData.description = body.description;
    if (body.tags !== undefined) updateData.tags = body.tags;
    if (body.isActive !== undefined) updateData.isActive = body.isActive;

    const updated = await db
      .update(inventoryStones)
      .set(updateData)
      .where(eq(inventoryStones.id, stoneId))
      .returning();

    return NextResponse.json({ stone: updated[0] });
  } catch (error) {
    console.error('Update inventory error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// DELETE - Soft delete an inventory stone
export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getTenantAdminSession();

    if (!session) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      );
    }

    const stoneId = parseInt(params.id, 10);

    // First verify the stone belongs to this tenant
    const existing = await db
      .select()
      .from(inventoryStones)
      .where(
        and(
          eq(inventoryStones.id, stoneId),
          eq(inventoryStones.tenantId, session.tenantId)
        )
      )
      .limit(1);

    if (existing.length === 0) {
      return NextResponse.json(
        { error: 'Stone not found' },
        { status: 404 }
      );
    }

    // Soft delete by setting isActive to false
    await db
      .update(inventoryStones)
      .set({ isActive: false })
      .where(eq(inventoryStones.id, stoneId));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Delete inventory error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
