import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { jwtVerify } from 'jose';
import { db, users } from '@/lib/db';
import { eq, and, sql } from 'drizzle-orm';

const JWT_SECRET = new TextEncoder().encode(
  process.env.AUTH_SECRET || 'default-secret-change-in-production'
);

// GET - Fetch current balance
export async function GET() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('user_session')?.value;
    if (!token) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const { payload } = await jwtVerify(token, JWT_SECRET);
    const userId = payload.userId as number;
    const tenantId = payload.tenantId as number;

    const userResult = await db
      .select({ aiCredits: users.aiCredits })
      .from(users)
      .where(and(eq(users.id, userId), eq(users.tenantId, tenantId)))
      .limit(1);

    if (userResult.length === 0) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const balance = parseFloat(userResult[0].aiCredits || '10.00');
    return NextResponse.json({ balance });
  } catch (error) {
    console.error('Balance API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST - Deduct credits for AI usage
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
    const { action, amount } = body as { action: string; amount?: number };

    // Define costs for each action
    const COSTS: Record<string, number> = {
      'chat_message': 0.02,       // $0.02 per chat message
      'image_generation': 0.15,   // $0.15 per image generation
      '3d_quick': 0.50,           // $0.50 per quick 3D generation
      '3d_high': 2.00,            // $2.00 per high quality 3D generation
    };

    const cost = amount || COSTS[action];
    if (!cost) {
      return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
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
    
    if (currentBalance < cost) {
      return NextResponse.json({
        error: 'Insufficient credits',
        balance: currentBalance,
        required: cost,
      }, { status: 402 });
    }

    // Deduct credits
    const newBalance = Math.max(0, currentBalance - cost);
    await db
      .update(users)
      .set({ aiCredits: newBalance.toFixed(2) })
      .where(and(eq(users.id, userId), eq(users.tenantId, tenantId)));

    return NextResponse.json({
      success: true,
      cost,
      balance: newBalance,
      action,
    });
  } catch (error) {
    console.error('Balance deduction error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
