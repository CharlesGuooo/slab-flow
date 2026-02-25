import { NextResponse } from 'next/server';
import { getTenantAdminSession } from '@/lib/auth';
import { db, clientOrders, users, inventoryStones, orderPhotos } from '@/lib/db';
import { eq, and } from 'drizzle-orm';

// GET - Get a single order with full details
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

    const orderId = parseInt(params.id, 10);

    // Get order with tenant check
    const orderRaw = await db
      .select()
      .from(clientOrders)
      .where(
        and(
          eq(clientOrders.id, orderId),
          eq(clientOrders.tenantId, session.tenantId)
        )
      )
      .limit(1);

    if (orderRaw.length === 0) {
      return NextResponse.json(
        { error: 'Order not found' },
        { status: 404 }
      );
    }

    const order = orderRaw[0];

    // Get customer info
    const customer = await db
      .select()
      .from(users)
      .where(eq(users.id, order.userId))
      .limit(1);

    // Get stone info if available
    let stone = null;
    if (order.stoneId) {
      const stoneData = await db
        .select()
        .from(inventoryStones)
        .where(eq(inventoryStones.id, order.stoneId))
        .limit(1);

      if (stoneData.length > 0) {
        stone = stoneData[0];
      }
    }

    // Get order photos
    const photos = await db
      .select()
      .from(orderPhotos)
      .where(eq(orderPhotos.orderId, orderId));

    return NextResponse.json({
      order,
      customer: customer[0] || null,
      stone,
      photos,
    });
  } catch (error) {
    console.error('Get order error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// PUT - Update order (status, quote price)
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

    const orderId = parseInt(params.id, 10);
    const body = await request.json();

    // First verify the order belongs to this tenant
    const existing = await db
      .select()
      .from(clientOrders)
      .where(
        and(
          eq(clientOrders.id, orderId),
          eq(clientOrders.tenantId, session.tenantId)
        )
      )
      .limit(1);

    if (existing.length === 0) {
      return NextResponse.json(
        { error: 'Order not found' },
        { status: 404 }
      );
    }

    // Prepare update data
    const updateData: Record<string, unknown> = {
      updatedAt: new Date().toISOString(),
    };

    if (body.status !== undefined) {
      updateData.status = body.status;
    }
    if (body.finalQuotePrice !== undefined) {
      updateData.finalQuotePrice = body.finalQuotePrice;
    }
    if (body.notes !== undefined) {
      updateData.notes = body.notes;
    }

    const updated = await db
      .update(clientOrders)
      .set(updateData)
      .where(eq(clientOrders.id, orderId))
      .returning();

    return NextResponse.json({ order: updated[0] });
  } catch (error) {
    console.error('Update order error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
