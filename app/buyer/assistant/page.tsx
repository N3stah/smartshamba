import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import FullPageAssistant from '@/components/ai/FullPageAssistant';

export const dynamic = 'force-dynamic';

export default async function BuyerAssistantPage() {
  const cookieStore = await cookies();
  const phone = cookieStore.get('smartshamba_buyer')?.value;
  if (!phone) redirect('/buyer/login');

  return <FullPageAssistant role="BUYER" />;
}
