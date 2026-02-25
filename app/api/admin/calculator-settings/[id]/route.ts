import { NextResponse } from 'next/server';
import { getTenantAdminSession } from '@/lib/auth';
import { db, calculationItems } from '@/lib/db';
import { eq, and } from 'drizzle-orm';

// PUT - Update a calculation item
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

    const itemId = parseInt(params.id, 10);
    const body = await request.json();

    // Verify the item belongs to this tenant
    const existing = await db
      .select()
      .from(calculationItems)
      .where(
        and(
          eq(calculationItems.id, itemId),
          eq(calculationItems.tenantId, session.tenantId)
        )
      )
      .limit(1);

    if (existing.length === 0) {
      return NextResponse.json(
        { error: 'Item not found' },
        { status: 404 }
      );
    }

    const updateData: Record<string, unknown> = {};

    if (body.name !== undefined) updateData.name = body.name;
    if (body.unit !== undefined) updateData.unit = body.unit;
    if (body.pricePerUnit !== undefined) updateData.pricePerUnit = body.pricePerUnit;
    if (body.sortOrder !== undefined) updateData.sortOrder = body.sortOrder;

    const updated = await db
      .update(calculationItems)
      .set(updateData)
      .where(eq(calculationItems.id, itemId))
      .returning();

    return NextResponse.json({ item: updated[0] });
  } catch (error) {
    console.error('Update calculation item error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// DELETE - Delete a calculation item
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

    const itemId = parseInt(params.id, 10);

    // Verify the item belongs to this tenant
    const existing = await db
      .select()
      .from(calculationItems)
      .where(
        and(
          eq(calculationItems.id, itemId),
          eq(calculationItems.tenantId, session.tenantId)
        )
      )
      .limit(1);

    if (existing.length === 0) {
      return NextResponse.json(
        { error: 'Item not found' },
        { status: 404 }
      );
    }

    await db
      .delete(calculationItems)
      .where(eq(calculationItems.id, itemId));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Delete calculation item error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
