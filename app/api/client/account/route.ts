import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { jwtVerify } from 'jose';
import { db, users, clientOrders, inventoryStones } from '@/lib/db';
import { eq, and, desc } from 'drizzle-orm';

const JWT_SECRET = new TextEncoder().encode(
  process.env.AUTH_SECRET || 'default-secret-change-in-production'
);

export async function GET() {
  try {
    // Verify session
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

    // Get user info
    const userResult = await db
      .select()
      .from(users)
      .where(
        and(
          eq(users.id, userId),
          eq(users.tenantId, tenantId)
        )
      )
      .limit(1);

    if (userResult.length === 0) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Get orders
    const ordersRaw = await db
      .select()
      .from(clientOrders)
      .where(eq(clientOrders.userId, userId))
      .orderBy(desc(clientOrders.createdAt));

    // Get stone names
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

    // Strip sensitive data before returning
    const { pin, ...safeUser } = userResult[0];

    return NextResponse.json({
      user: safeUser,
      orders,
    });
  } catch (error) {
    console.error('Account API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
