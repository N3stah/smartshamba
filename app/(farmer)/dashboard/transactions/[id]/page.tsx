import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import ChatWindow from '@/components/chat/ChatWindow';
import StatusBadge from '@/components/ui/StatusBadge';
import TransactionActions from '@/components/TransactionActions';

export default async function FarmerTransactionDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const cookieStore = await cookies();
  const phone = cookieStore.get('smartshamba_farmer')?.value;
  if (!phone) redirect('/dashboard/login');

  const farmer = await prisma.farmer.findUnique({ where: { phone } });
  if (!farmer) redirect('/dashboard/login');

  const transaction = await prisma.transaction.findUnique({
    where: { id },
    include: { buyer: true },
  });

  if (!transaction) redirect('/dashboard/transactions');
  if (transaction.farmerId !== farmer.id) redirect('/dashboard/transactions');

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Transaction Details</h1>
      
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
        <div className="flex justify-between items-start mb-6">
          <div>
            <p className="font-mono text-xs text-gray-500">{transaction.reference}</p>
            <h2 className="text-xl font-bold text-gray-900 mt-1">Buyer: {transaction.buyer.name}</h2>
          </div>
          <StatusBadge status={transaction.status} />
        </div>
        
        <div className="grid grid-cols-2 gap-4 text-sm border-t border-gray-100 pt-4">
          <div><p className="text-gray-500">Bags</p><p className="font-medium text-gray-900">{transaction.quantityBags}</p></div>
          <div><p className="text-gray-500">Price per Bag</p><p className="font-medium text-gray-900">KSh {transaction.pricePerBag.toLocaleString()}</p></div>
          <div><p className="text-gray-500">Total Value</p><p className="font-bold text-[#00703C]">KSh {transaction.totalValue.toLocaleString()}</p></div>
          {transaction.deliveryMethod && <div><p className="text-gray-500">Delivery Method</p><p className="font-medium text-gray-900">{transaction.deliveryMethod}</p></div>}
          {transaction.deliveryLocation && <div><p className="text-gray-500">Delivery Location</p><p className="font-medium text-gray-900">{transaction.deliveryLocation}</p></div>}
        </div>

        <div className="mt-6 pt-6 border-t border-gray-100">
          <h3 className="text-sm font-semibold text-gray-700 mb-3">Actions</h3>
          <TransactionActions transactionId={transaction.id} currentStatus={transaction.status} userRole="FARMER" />
        </div>
      </div>

      <div>
        <h3 className="text-lg font-bold text-gray-900 mb-4">Negotiation Chat</h3>
        <ChatWindow transactionId={transaction.id} currentUserId={transaction.farmerId} />
      </div>
    </div>
  );
}
