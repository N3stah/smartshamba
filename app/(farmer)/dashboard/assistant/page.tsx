import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import FullPageAssistant from '@/components/ai/FullPageAssistant';

export const dynamic = 'force-dynamic';

export default async function FarmerAssistantPage() {
  const cookieStore = await cookies();
  const phone = cookieStore.get('smartshamba_farmer')?.value;
  if (!phone) redirect('/dashboard/login');

  return <FullPageAssistant role="FARMER" />;
}
