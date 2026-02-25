import { NextResponse } from 'next/server';
import { getTenantAdminSession } from '@/lib/auth';
import { db, users, clientOrders } from '@/lib/db';
import { eq, and, count, desc } from 'drizzle-orm';

// GET - List all customers for the tenant
export async function GET() {
  try {
    const session = await getTenantAdminSession();

    if (!session) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      );
    }

    // Get all customers for this tenant
    const customersRaw = await db
      .select()
      .from(users)
      .where(eq(users.tenantId, session.tenantId))
      .orderBy(desc(users.createdAt));

    // Get order count for each customer
    const customers = await Promise.all(
      customersRaw.map(async (customer) => {
        const orderCount = await db
          .select({ count: count() })
          .from(clientOrders)
          .where(eq(clientOrders.userId, customer.id));

        return {
          ...customer,
          orderCount: orderCount[0]?.count || 0,
        };
      })
    );

    // Remove sensitive PIN hash from response
    const safeCustomers = customers.map(({ pin, ...rest }) => rest);

    return NextResponse.json({ customers: safeCustomers });
  } catch (error) {
    console.error('Customers API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
