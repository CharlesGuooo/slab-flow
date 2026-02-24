import { NextRequest, NextResponse } from 'next/server';
import { db, tenants, admins, calculationItems } from '@/lib/db';
import { getPlatformAdminSession } from '@/lib/auth';
import bcrypt from 'bcryptjs';
import { eq } from 'drizzle-orm';

// Default calculation items for new tenants
const DEFAULT_CALCULATION_ITEMS = [
  { name: 'Straight Cut (直切)', unit: 'per_sqft' as const, pricePerUnit: '30.00', sortOrder: 1 },
  { name: '45-degree Cut (45度切)', unit: 'per_sqft' as const, pricePerUnit: '45.00', sortOrder: 2 },
  { name: 'Waterfall (瀑布边)', unit: 'per_sqft' as const, pricePerUnit: '60.00', sortOrder: 3 },
  { name: 'Double Edge (双边)', unit: 'per_sqft' as const, pricePerUnit: '50.00', sortOrder: 4 },
  { name: 'Single Edge (单边)', unit: 'per_sqft' as const, pricePerUnit: '35.00', sortOrder: 5 },
  { name: 'Labour Cost (人工费)', unit: 'per_hour' as const, pricePerUnit: '40.00', sortOrder: 6 },
  { name: 'Fabrication Material (加工材料)', unit: 'per_sqft' as const, pricePerUnit: '3.00', sortOrder: 7 },
];

export async function POST(request: NextRequest) {
  try {
    // Verify platform admin session
    const session = await getPlatformAdminSession();

    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const formData = await request.formData();

    // Extract form data
    const name = formData.get('name') as string;
    const domain = formData.get('domain') as string;
    const contactEmail = formData.get('contactEmail') as string | null;
    const contactPhone = formData.get('contactPhone') as string | null;
    const address = formData.get('address') as string | null;
    const themePrimaryColor = formData.get('themePrimaryColor') as string || '#000000';
    const themeLogoUrl = formData.get('themeLogoUrl') as string | null;
    const featureChatbot = formData.get('featureChatbot') === 'on';
    const featureCalculator = formData.get('featureCalculator') === 'on';
    const feature3dReconstruction = formData.get('feature3dReconstruction') === 'on';
    const aiMonthlyBudget = formData.get('aiMonthlyBudget') as string || '50.00';

    // Validate required fields
    if (!name || !domain) {
      return NextResponse.json(
        { error: 'Name and domain are required' },
        { status: 400 }
      );
    }

    // Check if domain already exists
    const existingTenant = await db
      .select()
      .from(tenants)
      .where(eq(tenants.domain, domain))
      .limit(1);

    if (existingTenant.length > 0) {
      return NextResponse.json(
        { error: 'Domain already in use' },
        { status: 400 }
      );
    }

    // Create tenant
    const [newTenant] = await db
      .insert(tenants)
      .values({
        name,
        domain,
        contactEmail: contactEmail || null,
        contactPhone: contactPhone || null,
        address: address || null,
        themePrimaryColor,
        themeLogoUrl: themeLogoUrl || null,
        featureChatbot,
        featureCalculator,
        feature3dReconstruction,
        aiMonthlyBudget,
        isActive: true,
      })
      .returning();

    // Generate admin credentials
    const adminEmail = contactEmail || `admin@${domain}`;
    const generatedPassword = Math.random().toString(36).slice(-12) + Math.random().toString(36).slice(-4).toUpperCase();
    const passwordHash = await bcrypt.hash(generatedPassword, 10);

    // Create tenant admin
    const [newAdmin] = await db
      .insert(admins)
      .values({
        tenantId: newTenant.id,
        email: adminEmail,
        passwordHash,
        role: 'tenant_admin',
      })
      .returning();

    // Create default calculation items
    await db.insert(calculationItems).values(
      DEFAULT_CALCULATION_ITEMS.map(item => ({
        tenantId: newTenant.id,
        name: item.name,
        unit: item.unit,
        pricePerUnit: item.pricePerUnit,
        sortOrder: item.sortOrder,
      }))
    );

    return NextResponse.json({
      success: true,
      tenant: {
        id: newTenant.id,
        name: newTenant.name,
        domain: newTenant.domain,
      },
      admin: {
        id: newAdmin.id,
        email: newAdmin.email,
        generatedPassword, // Only shown once
      },
    });
  } catch (error) {
    console.error('Create tenant error:', error);
    return NextResponse.json(
      { error: 'Failed to create tenant' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    // Verify platform admin session
    const session = await getPlatformAdminSession();

    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Fetch all tenants
    const allTenants = await db
      .select()
      .from(tenants)
      .orderBy(tenants.createdAt);

    return NextResponse.json({
      tenants: allTenants,
    });
  } catch (error) {
    console.error('Get tenants error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch tenants' },
      { status: 500 }
    );
  }
}
