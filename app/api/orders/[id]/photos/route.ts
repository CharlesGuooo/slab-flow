import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { jwtVerify } from 'jose';
import { db, orderPhotos, clientOrders } from '@/lib/db';
import { eq, and } from 'drizzle-orm';
import { writeFile, mkdir } from 'fs/promises';
import path from 'path';

const JWT_SECRET = new TextEncoder().encode(
  process.env.AUTH_SECRET || 'default-secret-change-in-production'
);

// GET - List photos for an order
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

    const orderId = parseInt(params.id);

    // Verify order belongs to user and tenant
    const order = await db
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

    if (!order.length) {
      return NextResponse.json(
        { error: 'Order not found' },
        { status: 404 }
      );
    }

    const photos = await db
      .select()
      .from(orderPhotos)
      .where(eq(orderPhotos.orderId, orderId));

    return NextResponse.json({
      success: true,
      photos,
    });
  } catch (error) {
    console.error('Get photos error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST - Upload photo to order
export async function POST(
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

    const orderId = parseInt(params.id);

    // Verify order belongs to user and tenant
    const order = await db
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

    if (!order.length) {
      return NextResponse.json(
        { error: 'Order not found' },
        { status: 404 }
      );
    }

    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    const photoType = formData.get('photoType') as string || 'user_upload';

    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      );
    }

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { error: 'Invalid file type. Only images are allowed.' },
        { status: 400 }
      );
    }

    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json(
        { error: 'File too large. Maximum size is 10MB.' },
        { status: 400 }
      );
    }

    // Create upload directory
    const uploadDir = path.join(process.cwd(), 'public', 'uploads', String(tenantId), 'orders', String(orderId));
    await mkdir(uploadDir, { recursive: true });

    // Generate unique filename
    const timestamp = Date.now();
    const randomStr = Math.random().toString(36).substring(7);
    const ext = file.name.split('.').pop() || 'jpg';
    const filename = `${timestamp}-${randomStr}.${ext}`;
    const filepath = path.join(uploadDir, filename);

    // Write file
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    await writeFile(filepath, buffer);

    // Public URL
    const publicUrl = `/uploads/${tenantId}/orders/${orderId}/${filename}`;

    // Create photo record
    const newPhoto = await db
      .insert(orderPhotos)
      .values({
        tenantId,
        orderId,
        imageUrl: publicUrl,
        photoType: photoType as 'user_upload' | 'ai_generated',
      })
      .returning();

    return NextResponse.json({
      success: true,
      photo: newPhoto[0],
    });
  } catch (error) {
    console.error('Upload photo error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
