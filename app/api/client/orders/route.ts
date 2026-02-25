import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { jwtVerify } from 'jose';
import { db, clientOrders, inventoryStones } from '@/lib/db';
import { eq, and, desc } from 'drizzle-orm';

const JWT_SECRET = new TextEncoder().encode(
  process.env.AUTH_SECRET || 'default-secret-change-in-production'
);

// GET - Get all orders for the logged-in user
export async function GET() {
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

    // Get all orders for this user
    const orders = await db
      .select()
      .from(clientOrders)
      .where(
        and(
          eq(clientOrders.userId, userId),
          eq(clientOrders.tenantId, tenantId)
        )
      )
      .orderBy(desc(clientOrders.createdAt));

    // Get stone info for each order
    const ordersWithStones = await Promise.all(
      orders.map(async (order) => {
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

        return {
          ...order,
          stone,
        };
      })
    );

    return NextResponse.json({
      orders: ordersWithStones,
    });
  } catch (error) {
    console.error('Get orders error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
