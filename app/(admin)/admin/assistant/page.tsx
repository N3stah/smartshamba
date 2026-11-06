import { requireAdminPage } from '@/lib/admin-page-guard';
import FullPageAssistant from '@/components/ai/FullPageAssistant';

export const dynamic = 'force-dynamic';

export default async function AdminAssistantPage() {
  await requireAdminPage();

  return <FullPageAssistant role="STAFF" />;
}
