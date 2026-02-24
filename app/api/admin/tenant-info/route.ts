import { NextResponse } from 'next/server';
import { headers } from 'next/headers';

export async function GET() {
  const headersList = await headers();

  const tenantId = headersList.get('x-tenant-id');
  const tenantName = headersList.get('x-tenant-name');
  const tenantActive = headersList.get('x-tenant-active');

  if (!tenantId) {
    return NextResponse.json(
      { error: 'Tenant not found' },
      { status: 404 }
    );
  }

  return NextResponse.json({
    id: parseInt(tenantId, 10),
    name: tenantName || 'Unknown Tenant',
    active: tenantActive === 'true',
  });
}
