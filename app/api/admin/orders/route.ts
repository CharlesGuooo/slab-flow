import { NextResponse } from 'next/server';
import { getTenantAdminSession } from '@/lib/auth';
import { db, clientOrders, users, inventoryStones } from '@/lib/db';
import { eq, and, desc } from 'drizzle-orm';

// GET - List all orders for the tenant
export async function GET(request: Request) {
  try {
    const session = await getTenantAdminSession();

    if (!session) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const statusParam = searchParams.get('status');

    // Valid status values
    const validStatuses = ['pending_quote', 'quoted', 'in_progress', 'completed', 'cancelled'] as const;
    type OrderStatus = typeof validStatuses[number];

    // Build query conditions
    const conditions = [eq(clientOrders.tenantId, session.tenantId)];
    if (statusParam && statusParam !== 'all' && validStatuses.includes(statusParam as OrderStatus)) {
      conditions.push(eq(clientOrders.status, statusParam as OrderStatus));
    }

    const ordersRaw = await db
      .select({
        id: clientOrders.id,
        userId: clientOrders.userId,
        stoneId: clientOrders.stoneId,
        stoneSelectionText: clientOrders.stoneSelectionText,
        desiredDate: clientOrders.desiredDate,
        isContractor: clientOrders.isContractor,
        totalBudget: clientOrders.totalBudget,
        notes: clientOrders.notes,
        status: clientOrders.status,
        finalQuotePrice: clientOrders.finalQuotePrice,
        createdAt: clientOrders.createdAt,
        updatedAt: clientOrders.updatedAt,
      })
      .from(clientOrders)
      .where(and(...conditions))
      .orderBy(desc(clientOrders.createdAt));

    // Fetch customer and stone info for each order
    const orders = await Promise.all(
      ordersRaw.map(async (order) => {
        // Get customer info
        const customer = await db
          .select({ username: users.username, email: users.email, phone: users.phone })
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
              const nameObj = typeof stone[0].name === 'string'
                ? JSON.parse(stone[0].name)
                : stone[0].name;
              stoneName = nameObj.en || nameObj.zh || stone[0].name;
            } catch {
              stoneName = typeof stone[0].name === 'string' ? stone[0].name : 'Unknown';
            }
          }
        }

        return {
          ...order,
          customer: customer[0] || { username: 'Unknown', email: '', phone: '' },
          stoneName,
        };
      })
    );

    return NextResponse.json({ orders });
  } catch (error) {
    console.error('Orders API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
