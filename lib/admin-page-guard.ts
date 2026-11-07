import { redirect } from 'next/navigation';
import { getAdminSession } from '@/lib/auth';

/**
 * Server-side guard for admin pages. Redirects to /admin/login if:
 *   - no session (no cookie, or cookie doesn't match a Staff record)
 *   - session.id === 'legacy' (ADMIN_API_KEY fallback — must not access admin UI)
 *
 * Per S1.5, getAdminSession already fails closed when ADMIN_API_KEY is unset.
 * This helper adds the legacy-rejection layer for page-level access.
 *
 * S2 will replace this with signed-session verification.
 */
export async function requireAdminPage() {
  const session = await getAdminSession();
  if (!session || session.id === 'legacy') {
    redirect('/admin/login');
  }
  return session;
}
