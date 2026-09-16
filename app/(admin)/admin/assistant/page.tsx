import { getAdminSession } from '@/lib/auth';
import { redirect } from 'next/navigation';
import FullPageAssistant from '@/components/ai/FullPageAssistant';

export const dynamic = 'force-dynamic';

export default async function AdminAssistantPage() {
  const session = await getAdminSession();
  if (!session) redirect('/admin/login');

  return <FullPageAssistant role="STAFF" />;
}
