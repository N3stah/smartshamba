import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Wallet } from 'lucide-react';
import WalletStatement from '@/components/finance/WalletStatement';

export const dynamic = 'force-dynamic';

export default async function FarmerWalletPage() {
  const cookieStore = await cookies();
  const phone = cookieStore.get('smartshamba_farmer')?.value;
  if (!phone) redirect('/dashboard/login');

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between border-b border-gray-200 pb-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-farmer-secondary rounded-lg">
            <Wallet className="w-6 h-6 text-farmer-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">My Wallet</h1>
            <p className="text-sm text-gray-500">View your earnings and transaction history</p>
          </div>
        </div>
        
      </div>
      <WalletStatement role="FARMER" />
    </div>
  );
}
