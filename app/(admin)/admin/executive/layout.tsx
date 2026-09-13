import { getAdminSession } from '@/lib/auth';
import { redirect } from 'next/navigation';

export default async function ExecutiveLayout({ children }: { children: React.ReactNode }) {
  const session = await getAdminSession();
  
  // Must be authenticated
  if (!session) {
    redirect('/admin/login');
  }
  
  // Legacy ADMIN_API_KEY cannot access executive area (must use Staff login)
  if (session.id === 'legacy') {
    redirect('/admin');
  }
  
  return <>{children}</>;
}
