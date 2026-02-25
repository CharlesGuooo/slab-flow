import { NextResponse } from 'next/server';
import { headers } from 'next/headers';
import bcrypt from 'bcryptjs';
import { db, users, tenants } from '@/lib/db';
import { eq } from 'drizzle-orm';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { username, email, phone } = body;

    // Validate required fields
    if (!username || !email) {
      return NextResponse.json(
        { error: 'Username and email are required' },
        { status: 400 }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: 'Invalid email format' },
        { status: 400 }
      );
    }

    // Get tenant from headers
    const headersList = await headers();
    const tenantId = headersList.get('x-tenant-id');

    if (!tenantId) {
      return NextResponse.json(
        { error: 'Tenant not found' },
        { status: 400 }
      );
    }

    // Check if email already exists for this tenant
    const existingUser = await db
      .select()
      .from(users)
      .where(eq(users.email, email))
      .limit(1);

    if (existingUser.length > 0 && existingUser[0].tenantId === parseInt(tenantId, 10)) {
      return NextResponse.json(
        { error: 'An account with this email already exists' },
        { status: 400 }
      );
    }

    // Generate 6-digit PIN
    const pin = Math.floor(100000 + Math.random() * 900000).toString();

    // Hash PIN
    const saltRounds = 10;
    const hashedPin = await bcrypt.hash(pin, saltRounds);

    // Create user
    const newUser = await db
      .insert(users)
      .values({
        tenantId: parseInt(tenantId, 10),
        username,
        email,
        phone: phone || null,
        pin: hashedPin,
        aiCredits: '10.00',
      })
      .returning();

    // Get tenant info for email (in production, would send actual email)
    const tenant = await db
      .select()
      .from(tenants)
      .where(eq(tenants.id, parseInt(tenantId, 10)))
      .limit(1);

    // In production, send email with PIN
    // For development, return PIN in response
    console.log(`[DEV] Registration PIN for ${email}: ${pin}`);

    return NextResponse.json({
      success: true,
      message: 'Registration successful! Your PIN has been sent to your email.',
      // Remove this in production!
      devPin: process.env.NODE_ENV === 'development' ? pin : undefined,
    });
  } catch (error) {
    console.error('Registration error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
