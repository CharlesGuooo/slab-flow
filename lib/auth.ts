import { cookies } from 'next/headers';
import { jwtVerify } from 'jose';
import { db, admins, tenants } from './db';
import { eq } from 'drizzle-orm';

const JWT_SECRET = new TextEncoder().encode(
  process.env.AUTH_SECRET || 'default-secret-change-in-production'
);

export interface PlatformAdminSession {
  adminId: number;
  email: string;
  role: 'super_admin';
}

export interface TenantAdminSession {
  adminId: number;
  email: string;
  role: 'tenant_admin';
  tenantId: number;
}

export interface UserSession {
  userId: number;
  email: string;
  tenantId: number;
}

/**
 * Verify platform admin session from cookie
 */
export async function getPlatformAdminSession(): Promise<PlatformAdminSession | null> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('platform_admin_session')?.value;

    if (!token) {
      return null;
    }

    const { payload } = await jwtVerify(token, JWT_SECRET);

    if (payload.role !== 'super_admin') {
      return null;
    }

    return {
      adminId: payload.adminId as number,
      email: payload.email as string,
      role: 'super_admin',
    };
  } catch (error) {
    return null;
  }
}

/**
 * Verify tenant admin session from cookie
 */
export async function getTenantAdminSession(): Promise<TenantAdminSession | null> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('tenant_admin_session')?.value;

    if (!token) {
      return null;
    }

    const { payload } = await jwtVerify(token, JWT_SECRET);

    if (payload.role !== 'tenant_admin') {
      return null;
    }

    return {
      adminId: payload.adminId as number,
      email: payload.email as string,
      role: 'tenant_admin',
      tenantId: payload.tenantId as number,
    };
  } catch (error) {
    return null;
  }
}

/**
 * Verify user session from cookie
 */
export async function getUserSession(): Promise<UserSession | null> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('user_session')?.value;

    if (!token) {
      return null;
    }

    const { payload } = await jwtVerify(token, JWT_SECRET);

    return {
      userId: payload.userId as number,
      email: payload.email as string,
      tenantId: payload.tenantId as number,
    };
  } catch (error) {
    return null;
  }
}

/**
 * Get tenant ID from request headers (set by middleware)
 */
export function getTenantIdFromHeaders(request: Request): number | null {
  const tenantId = request.headers.get('x-tenant-id');
  return tenantId ? parseInt(tenantId, 10) : null;
}

/**
 * Get tenant by ID
 */
export async function getTenantById(tenantId: number) {
  const result = await db
    .select()
    .from(tenants)
    .where(eq(tenants.id, tenantId))
    .limit(1);

  return result[0] || null;
}

/**
 * Get admin by ID
 */
export async function getAdminById(adminId: number) {
  const result = await db
    .select()
    .from(admins)
    .where(eq(admins.id, adminId))
    .limit(1);

  return result[0] || null;
}
