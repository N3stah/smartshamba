import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, FileText } from 'lucide-react';
import ContractsDashboard from '@/components/contracts/ContractsDashboard';

export const dynamic = 'force-dynamic';

export default async function BuyerContractsPage() {
  const cookieStore = await cookies();
  const phone = cookieStore.get('smartshamba_buyer')?.value;
  if (!phone) redirect('/buyer/login');

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between border-b border-gray-200 pb-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-buyer-secondary rounded-lg">
            <FileText className="w-6 h-6 text-buyer-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Purchase Contracts</h1>
            <p className="text-sm text-gray-500">View and manage your procurement agreements</p>
          </div>
        </div>
        
      </div>
      <ContractsDashboard role="BUYER" />
    </div>
  );
}
