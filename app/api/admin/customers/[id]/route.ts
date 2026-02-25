import { NextResponse } from 'next/server';
import { getTenantAdminSession } from '@/lib/auth';
import { db, users, clientOrders, inventoryStones } from '@/lib/db';
import { eq, and, desc } from 'drizzle-orm';

// GET - Get a single customer with order history
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

    const customerId = parseInt(params.id, 10);

    // Get customer with tenant check
    const customer = await db
      .select()
      .from(users)
      .where(
        and(
          eq(users.id, customerId),
          eq(users.tenantId, session.tenantId)
        )
      )
      .limit(1);

    if (customer.length === 0) {
      return NextResponse.json(
        { error: 'Customer not found' },
        { status: 404 }
      );
    }

    // Get order history
    const ordersRaw = await db
      .select()
      .from(clientOrders)
      .where(eq(clientOrders.userId, customerId))
      .orderBy(desc(clientOrders.createdAt));

    // Get stone names for orders
    const orders = await Promise.all(
      ordersRaw.map(async (order) => {
        let stoneName: string | null = null;
        if (order.stoneId) {
          const stone = await db
            .select({ name: inventoryStones.name })
            .from(inventoryStones)
            .where(eq(inventoryStones.id, order.stoneId))
            .limit(1);

          if (stone.length > 0 && stone[0].name) {
            try {
              const nameObj = typeof stone[0].name === 'string'
                ? JSON.parse(stone[0].name)
                : stone[0].name;
              stoneName = nameObj.en || nameObj.zh || 'Unknown';
            } catch {
              stoneName = typeof stone[0].name === 'string' ? stone[0].name : 'Unknown';
            }
          }
        }
        return { ...order, stoneName };
      })
    );

    // Remove sensitive PIN hash from response
    const { pin: _pin, ...safeCustomer } = customer[0];

    return NextResponse.json({
      customer: safeCustomer,
      orders,
    });
  } catch (error) {
    console.error('Get customer error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// PUT - Update customer (mainly for adding AI credits)
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

    const customerId = parseInt(params.id, 10);
    const body = await request.json();

    // First verify the customer belongs to this tenant
    const existing = await db
      .select()
      .from(users)
      .where(
        and(
          eq(users.id, customerId),
          eq(users.tenantId, session.tenantId)
        )
      )
      .limit(1);

    if (existing.length === 0) {
      return NextResponse.json(
        { error: 'Customer not found' },
        { status: 404 }
      );
    }

    // Only allow updating aiCredits
    const updateData: Record<string, unknown> = {};

    if (body.aiCredits !== undefined) {
      updateData.aiCredits = body.aiCredits;
    }

    if (Object.keys(updateData).length === 0) {
      const { pin: _pin2, ...safeExisting } = existing[0];
      return NextResponse.json({ customer: safeExisting });
    }

    const updated = await db
      .update(users)
      .set(updateData)
      .where(eq(users.id, customerId))
      .returning();

    // Remove sensitive PIN hash from response
    const { pin: _updatedPin, ...safeUpdated } = updated[0];
    return NextResponse.json({ customer: safeUpdated });
  } catch (error) {
    console.error('Update customer error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
