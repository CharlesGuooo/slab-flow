import { redirect } from 'next/navigation';

/**
 * Admin login page now redirects to the unified login page
 * Merchants log in through the same login page as customers
 */
export default function TenantAdminLoginPage() {
  redirect('/en/login');
}
