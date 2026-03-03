import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { jwtVerify } from 'jose';
import { db, users } from '@/lib/db';
import { eq, and } from 'drizzle-orm';

export const dynamic = 'force-dynamic';

const JWT_SECRET = new TextEncoder().encode(
  process.env.AUTH_SECRET || 'default-secret-change-in-production'
);

// POST - Refund credits when AI generation fails
export async function POST(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('user_session')?.value;
    if (!token) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const { payload } = await jwtVerify(token, JWT_SECRET);
    const userId = payload.userId as number;
    const tenantId = payload.tenantId as number;

    const body = await request.json();
    const { action } = body as { action: string };

    // Define refund amounts (same as costs)
    const REFUNDS: Record<string, number> = {
      'image_generation': 0.15,
      '3d_quick': 0.50,
      '3d_high': 2.00,
    };

    const refundAmount = REFUNDS[action];
    if (!refundAmount) {
      return NextResponse.json({ error: 'Invalid action for refund' }, { status: 400 });
    }

    // Get current balance
    const userResult = await db
      .select({ aiCredits: users.aiCredits })
      .from(users)
      .where(and(eq(users.id, userId), eq(users.tenantId, tenantId)))
      .limit(1);

    if (userResult.length === 0) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const currentBalance = parseFloat(userResult[0].aiCredits || '0');
    const newBalance = currentBalance + refundAmount;

    // Add credits back
    await db
      .update(users)
      .set({ aiCredits: newBalance.toFixed(2) })
      .where(and(eq(users.id, userId), eq(users.tenantId, tenantId)));

    console.log(`[Refund] User ${userId}: refunded $${refundAmount} for ${action}. Balance: $${currentBalance} -> $${newBalance}`);

    return NextResponse.json({
      success: true,
      refunded: refundAmount,
      balance: newBalance,
      action,
    });
  } catch (error) {
    console.error('Refund API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
