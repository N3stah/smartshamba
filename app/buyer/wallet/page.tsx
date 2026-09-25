import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Wallet } from 'lucide-react';
import WalletStatement from '@/components/finance/WalletStatement';

export const dynamic = 'force-dynamic';

export default async function BuyerWalletPage() {
  const cookieStore = await cookies();
  const phone = cookieStore.get('smartshamba_buyer')?.value;
  if (!phone) redirect('/buyer/login');

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between border-b border-gray-200 pb-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-buyer-secondary rounded-lg">
            <Wallet className="w-6 h-6 text-buyer-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Procurement Wallet</h1>
            <p className="text-sm text-gray-500">View your payment history and statements</p>
          </div>
        </div>
        
      </div>
      <WalletStatement role="BUYER" />
    </div>
  );
}
