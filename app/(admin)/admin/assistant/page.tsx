import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import FullPageAssistant from '@/components/ai/FullPageAssistant';

export const dynamic = 'force-dynamic';

export default async function AdminAssistantPage() {
  const cookieStore = await cookies();
  const isAdmin = cookieStore.get('smartshamba_admin')?.value === process.env.ADMIN_API_KEY;
  if (!isAdmin) redirect('/admin/login');

  return <FullPageAssistant role="ADMIN" />;
}
