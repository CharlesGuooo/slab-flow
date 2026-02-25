import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { jwtVerify } from 'jose';
import { db, clientOrders, inventoryStones, orderPhotos } from '@/lib/db';
import { eq, and } from 'drizzle-orm';

const JWT_SECRET = new TextEncoder().encode(
  process.env.AUTH_SECRET || 'default-secret-change-in-production'
);

// GET - Get a single order for the logged-in user
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('user_session')?.value;

    if (!token) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      );
    }

    const { payload } = await jwtVerify(token, JWT_SECRET);
    const userId = payload.userId as number;
    const tenantId = payload.tenantId as number;

    const orderId = parseInt(params.id, 10);

    // Get order with user and tenant check
    const orderData = await db
      .select()
      .from(clientOrders)
      .where(
        and(
          eq(clientOrders.id, orderId),
          eq(clientOrders.userId, userId),
          eq(clientOrders.tenantId, tenantId)
        )
      )
      .limit(1);

    if (orderData.length === 0) {
      return NextResponse.json(
        { error: 'Order not found' },
        { status: 404 }
      );
    }

    const order = orderData[0];

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
