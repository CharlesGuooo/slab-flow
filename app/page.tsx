import { redirect } from 'next/navigation';
import { headers } from 'next/headers';

/**
 * Root page: determines routing based on domain
 * - slabflow.site → redirect to platform admin login
 * - tenant domains (e.g., chstone.shop) → redirect to tenant landing page
 */
export default async function RootPage() {
  const headersList = await headers();
  const host = headersList.get('host') || '';
  const isPlatformDomain = host.includes('slabflow.site') || host.includes('slabflow') || host.includes('slab-flow');

  if (isPlatformDomain) {
    redirect('/platform-admin/login');
  }

  // For tenant domains, redirect to the locale landing page
  redirect('/en');
}
