import { NextRequest, NextResponse } from 'next/server';
import { db, tenants } from '@/lib/db';
import { getPlatformAdminSession } from '@/lib/auth';
import { eq } from 'drizzle-orm';

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    // Verify platform admin session
    const session = await getPlatformAdminSession();

    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const resolvedParams = await params;
    const tenantId = parseInt(resolvedParams.id, 10);

    if (isNaN(tenantId)) {
      return NextResponse.json(
        { error: 'Invalid tenant ID' },
        { status: 400 }
      );
    }

    // Fetch tenant
    const tenantResult = await db
      .select()
      .from(tenants)
      .where(eq(tenants.id, tenantId))
      .limit(1);

    const tenant = tenantResult[0];

    if (!tenant) {
      return NextResponse.json(
        { error: 'Tenant not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ tenant });
  } catch (error) {
    console.error('Get tenant error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch tenant' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    // Verify platform admin session
    const session = await getPlatformAdminSession();

    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const resolvedParams = await params;
    const tenantId = parseInt(resolvedParams.id, 10);

    if (isNaN(tenantId)) {
      return NextResponse.json(
        { error: 'Invalid tenant ID' },
        { status: 400 }
      );
    }

    // Check if tenant exists
    const existingTenant = await db
      .select()
      .from(tenants)
      .where(eq(tenants.id, tenantId))
      .limit(1);

    if (existingTenant.length === 0) {
      return NextResponse.json(
        { error: 'Tenant not found' },
        { status: 404 }
      );
    }

    const formData = await request.formData();

    // Extract form data
    const name = formData.get('name') as string;
    const domain = formData.get('domain') as string;
    const isActive = formData.get('isActive') === 'on';
    const contactEmail = formData.get('contactEmail') as string | null;
    const contactPhone = formData.get('contactPhone') as string | null;
    const address = formData.get('address') as string | null;
    const themePrimaryColor = formData.get('themePrimaryColor') as string;
    const themeLogoUrl = formData.get('themeLogoUrl') as string | null;
    const themeBannerUrl = formData.get('themeBannerUrl') as string | null;
    const featureChatbot = formData.get('featureChatbot') === 'on';
    const featureCalculator = formData.get('featureCalculator') === 'on';
    const feature3dReconstruction = formData.get('feature3dReconstruction') === 'on';
    const aiMonthlyBudget = formData.get('aiMonthlyBudget') as string;
    const aiSystemPrompt = formData.get('aiSystemPrompt') as string | null;

    // Validate required fields
    if (!name || !domain) {
      return NextResponse.json(
        { error: 'Name and domain are required' },
        { status: 400 }
      );
    }

    // Check if domain is taken by another tenant
    if (domain !== existingTenant[0].domain) {
      const domainCheck = await db
        .select()
        .from(tenants)
        .where(eq(tenants.domain, domain))
        .limit(1);

      if (domainCheck.length > 0) {
        return NextResponse.json(
          { error: 'Domain already in use by another tenant' },
          { status: 400 }
        );
      }
    }

    // Update tenant
    const [updatedTenant] = await db
      .update(tenants)
      .set({
        name,
        domain,
        isActive,
        contactEmail: contactEmail || null,
        contactPhone: contactPhone || null,
        address: address || null,
        themePrimaryColor: themePrimaryColor || '#000000',
        themeLogoUrl: themeLogoUrl || null,
        themeBannerUrl: themeBannerUrl || null,
        featureChatbot,
        featureCalculator,
        feature3dReconstruction,
        aiMonthlyBudget: aiMonthlyBudget || '50.00',
        aiSystemPrompt: aiSystemPrompt || null,
      })
      .where(eq(tenants.id, tenantId))
      .returning();

    return NextResponse.json({
      success: true,
      tenant: updatedTenant,
    });
  } catch (error) {
    console.error('Update tenant error:', error);
    return NextResponse.json(
      { error: 'Failed to update tenant' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    // Verify platform admin session
    const session = await getPlatformAdminSession();

    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const resolvedParams = await params;
    const tenantId = parseInt(resolvedParams.id, 10);

    if (isNaN(tenantId)) {
      return NextResponse.json(
        { error: 'Invalid tenant ID' },
        { status: 400 }
      );
    }

    // Check if tenant exists
    const existingTenant = await db
      .select()
      .from(tenants)
      .where(eq(tenants.id, tenantId))
      .limit(1);

    if (existingTenant.length === 0) {
      return NextResponse.json(
        { error: 'Tenant not found' },
        { status: 404 }
      );
    }

    // Delete tenant (in production, you might want to soft delete)
    await db.delete(tenants).where(eq(tenants.id, tenantId));

    return NextResponse.json({
      success: true,
      message: 'Tenant deleted successfully',
    });
  } catch (error) {
    console.error('Delete tenant error:', error);
    return NextResponse.json(
      { error: 'Failed to delete tenant' },
      { status: 500 }
    );
  }
}
