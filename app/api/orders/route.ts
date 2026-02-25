import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { jwtVerify } from 'jose';
import { db, clientOrders, tenants, admins, orderPhotos, users, inventoryStones } from '@/lib/db';
import { eq } from 'drizzle-orm';
import { sendEmail, generateNewOrderEmail, generateAdminNotificationEmail } from '@/lib/email';

const JWT_SECRET = new TextEncoder().encode(
  process.env.AUTH_SECRET || 'default-secret-change-in-production'
);

// POST - Create a new quote request
export async function POST(request: Request) {
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

    const body = await request.json();
    const {
      stoneId,
      stoneSelectionText,
      desiredDate,
      isContractor,
      totalBudget,
      notes,
      photos,
    } = body;

    // Validate required fields
    if (!desiredDate) {
      return NextResponse.json(
        { error: 'Desired timeline is required' },
        { status: 400 }
      );
    }

    if (!stoneId && !stoneSelectionText) {
      return NextResponse.json(
        { error: 'Please select a stone or describe what you\'re looking for' },
        { status: 400 }
      );
    }

    // Create order
    const newOrder = await db
      .insert(clientOrders)
      .values({
        tenantId,
        userId,
        stoneId: stoneId || null,
        stoneSelectionText: stoneSelectionText || null,
        desiredDate,
        isContractor: isContractor || false,
        totalBudget: totalBudget || null,
        notes: notes || null,
        status: 'pending_quote',
      })
      .returning();

    const orderId = newOrder[0].id;

    // Create photo records if photos were uploaded
    if (photos && Array.isArray(photos) && photos.length > 0) {
      for (const photoUrl of photos) {
        await db.insert(orderPhotos).values({
          tenantId,
          orderId,
          imageUrl: photoUrl,
          photoType: 'user_upload',
        });
      }
      console.log(`[DEV] Created ${photos.length} photo records for order #${orderId}`);
    }

    // Get user and tenant info for email notifications
    const userData = await db
      .select()
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    const tenantAdmin = await db
      .select()
      .from(admins)
      .where(eq(admins.tenantId, tenantId))
      .limit(1);

    const tenant = await db
      .select()
      .from(tenants)
      .where(eq(tenants.id, tenantId))
      .limit(1);

    const user = userData[0];
    const admin = tenantAdmin[0];
    const tenantInfo = tenant[0];

    // Get stone name if selected
    let stoneName = null;
    if (stoneId) {
      const stone = await db
        .select({ name: inventoryStones.name, brand: inventoryStones.brand, series: inventoryStones.series })
        .from(inventoryStones)
        .where(eq(inventoryStones.id, stoneId))
        .limit(1);

      if (stone.length > 0) {
        if (stone[0].name) {
          try {
            const parsed = JSON.parse(stone[0].name as string);
            stoneName = parsed.en || parsed.zh || stone[0].name;
          } catch {
            stoneName = stone[0].name as string;
          }
        } else {
          stoneName = `${stone[0].brand} ${stone[0].series}`;
        }
      }
    }

    // Send confirmation email to customer
    if (user?.email && tenantInfo?.name) {
      const customerEmail = generateNewOrderEmail(
        user.username,
        orderId,
        stoneName || stoneSelectionText || null,
        tenantInfo.name
      );
      customerEmail.to = user.email;
      await sendEmail(customerEmail);
    }

    // Send notification email to admin
    if (admin?.email && tenantInfo?.name && user) {
      const adminEmail = generateAdminNotificationEmail(
        admin.email.split('@')[0], // Use email username as admin name
        orderId,
        user.username,
        user.email,
        tenantInfo.name
      );
      adminEmail.to = admin.email;
      await sendEmail(adminEmail);
    }

    return NextResponse.json({
      success: true,
      order: newOrder[0],
      message: 'Your quote request has been submitted successfully!',
    });
  } catch (error) {
    console.error('Create order error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
