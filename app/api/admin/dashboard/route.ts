import { NextResponse } from 'next/server';
import { getTenantAdminSession } from '@/lib/auth';
import { db, clientOrders, users, inventoryStones } from '@/lib/db';
import { eq, and, gte, sql, count } from 'drizzle-orm';

export async function GET() {
  try {
    const session = await getTenantAdminSession();

    if (!session) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      );
    }

    const tenantId = session.tenantId;

    // Get order counts by status
    const pendingQuotes = await db
      .select({ count: count() })
      .from(clientOrders)
      .where(
        and(
          eq(clientOrders.tenantId, tenantId),
          eq(clientOrders.status, 'pending_quote')
        )
      );

    const quotedOrders = await db
      .select({ count: count() })
      .from(clientOrders)
      .where(
        and(
          eq(clientOrders.tenantId, tenantId),
          eq(clientOrders.status, 'quoted')
        )
      );

    const inProgressOrders = await db
      .select({ count: count() })
      .from(clientOrders)
      .where(
        and(
          eq(clientOrders.tenantId, tenantId),
          eq(clientOrders.status, 'in_progress')
        )
      );

    const completedOrders = await db
      .select({ count: count() })
      .from(clientOrders)
      .where(
        and(
          eq(clientOrders.tenantId, tenantId),
          eq(clientOrders.status, 'completed')
        )
      );

    // Get new customers this month
    const now = new Date();
    const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const firstDayOfMonthStr = firstDayOfMonth.toISOString();

    const newCustomersThisMonth = await db
      .select({ count: count() })
      .from(users)
      .where(
        and(
          eq(users.tenantId, tenantId),
          gte(users.createdAt, firstDayOfMonthStr)
        )
      );

    // Calculate total revenue from completed orders
    const completedOrdersRevenue = await db
      .select({
        total: sql<string>`COALESCE(SUM(CAST(${clientOrders.finalQuotePrice} AS REAL)), 0)`,
      })
      .from(clientOrders)
      .where(
        and(
          eq(clientOrders.tenantId, tenantId),
          eq(clientOrders.status, 'completed')
        )
      );

    // Get recent orders with customer and stone info
    const recentOrdersRaw = await db
      .select({
        id: clientOrders.id,
        status: clientOrders.status,
        createdAt: clientOrders.createdAt,
        finalQuotePrice: clientOrders.finalQuotePrice,
        stoneId: clientOrders.stoneId,
        userId: clientOrders.userId,
      })
      .from(clientOrders)
      .where(eq(clientOrders.tenantId, tenantId))
      .orderBy(sql`${clientOrders.createdAt} DESC`)
      .limit(10);

    // Fetch customer names and stone names for recent orders
    const recentOrders = await Promise.all(
      recentOrdersRaw.map(async (order) => {
        // Get customer name
        const customer = await db
          .select({ username: users.username })
          .from(users)
          .where(eq(users.id, order.userId))
          .limit(1);

        // Get stone name if available
        let stoneName: string | null = null;
        if (order.stoneId) {
          const stone = await db
            .select({ name: inventoryStones.name })
            .from(inventoryStones)
            .where(eq(inventoryStones.id, order.stoneId))
            .limit(1);

          if (stone.length > 0 && stone[0].name) {
            try {
              const nameObj = JSON.parse(stone[0].name);
              stoneName = nameObj.en || stone[0].name;
            } catch {
              stoneName = stone[0].name;
            }
          }
        }

        return {
          id: order.id,
          customerName: customer[0]?.username || 'Unknown',
          stoneName,
          status: order.status,
          createdAt: order.createdAt,
          finalQuotePrice: order.finalQuotePrice,
        };
      })
    );

    return NextResponse.json({
      metrics: {
        pendingQuotes: pendingQuotes[0]?.count || 0,
        quotedOrders: quotedOrders[0]?.count || 0,
        inProgressOrders: inProgressOrders[0]?.count || 0,
        completedOrders: completedOrders[0]?.count || 0,
        newCustomersThisMonth: newCustomersThisMonth[0]?.count || 0,
        totalRevenue: parseFloat(completedOrdersRevenue[0]?.total || '0'),
      },
      recentOrders,
    });
  } catch (error) {
    console.error('Dashboard API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
