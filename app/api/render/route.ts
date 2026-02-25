import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { jwtVerify } from 'jose';
import { db, tenants, inventoryStones } from '@/lib/db';
import { eq } from 'drizzle-orm';
import { generateStoneRendering, checkRenderingService } from '@/lib/rendering';

const JWT_SECRET = new TextEncoder().encode(
  process.env.AUTH_SECRET || 'default-secret-change-in-production'
);

/**
 * GET - Check if rendering service is available
 */
export async function GET() {
  const status = await checkRenderingService();
  return NextResponse.json(status);
}

/**
 * POST - Generate a stone rendering
 */
export async function POST(request: Request) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('user_session')?.value;

    let tenantId: number | null = null;

    if (token) {
      try {
        const { payload } = await jwtVerify(token, JWT_SECRET);
        tenantId = payload.tenantId as number;
      } catch {
        // Token invalid, continue without tenant
      }
    }

    const body = await request.json();
    const { stoneId, roomType, style, cabinetColor, customStoneName, customStoneType } = body;

    let stoneName = customStoneName;
    let stoneType = customStoneType;

    // If stoneId provided, get stone details from database
    if (stoneId) {
      const stone = await db
        .select()
        .from(inventoryStones)
        .where(eq(inventoryStones.id, stoneId))
        .limit(1);

      if (stone.length > 0) {
        // Parse stone name from JSON if needed
        try {
          const nameObj = stone[0].name as { en?: string; zh?: string } | null;
          stoneName = nameObj?.en || nameObj?.zh || `${stone[0].brand} ${stone[0].series}`;
        } catch {
          stoneName = `${stone[0].brand} ${stone[0].series}`;
        }
        stoneType = stone[0].stoneType;
      }
    }

    if (!stoneName || !stoneType) {
      return NextResponse.json(
        { error: 'Stone name and type are required' },
        { status: 400 }
      );
    }

    console.log(`[RENDER API] Generating rendering for ${stoneName} (${stoneType})`);

    const result = await generateStoneRendering({
      stoneName,
      stoneType,
      roomType: roomType || 'kitchen',
      style: style || 'modern',
      cabinetColor: cabinetColor || 'white',
    });

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || 'Failed to generate rendering' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      imageUrl: result.imageUrl,
      revisedPrompt: result.revisedPrompt,
    });
  } catch (error) {
    console.error('[RENDER API] Error:', error);
    return NextResponse.json(
      { error: 'Failed to process rendering request' },
      { status: 500 }
    );
  }
}
