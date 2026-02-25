import { NextResponse } from 'next/server';
import { getTenantAdminSession } from '@/lib/auth';
import { db, calculationItems } from '@/lib/db';
import { eq } from 'drizzle-orm';

// GET - List all calculation items for the tenant
export async function GET() {
  try {
    const session = await getTenantAdminSession();

    if (!session) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      );
    }

    const items = await db
      .select()
      .from(calculationItems)
      .where(eq(calculationItems.tenantId, session.tenantId))
      .orderBy(calculationItems.sortOrder);

    return NextResponse.json({ items });
  } catch (error) {
    console.error('Calculator settings API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST - Create a new calculation item
export async function POST(request: Request) {
  try {
    const session = await getTenantAdminSession();

    if (!session) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { name, unit, pricePerUnit, sortOrder } = body;

    if (!name || !unit || pricePerUnit === undefined) {
      return NextResponse.json(
        { error: 'Name, unit, and price are required' },
        { status: 400 }
      );
    }

    const newItem = await db
      .insert(calculationItems)
      .values({
        tenantId: session.tenantId,
        name,
        unit,
        pricePerUnit,
        sortOrder: sortOrder || 0,
      })
      .returning();

    return NextResponse.json({ item: newItem[0] }, { status: 201 });
  } catch (error) {
    console.error('Create calculation item error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
