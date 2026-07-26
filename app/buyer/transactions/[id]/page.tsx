import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import ChatWindow from '@/components/chat/ChatWindow';
import StatusBadge from '@/components/ui/StatusBadge';
import TransactionActions from '@/components/TransactionActions';
import { Truck, MapPin, Calendar, FileText } from 'lucide-react';

export default async function BuyerTransactionDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const cookieStore = await cookies();
  const phone = cookieStore.get('smartshamba_buyer')?.value;
  if (!phone) redirect('/buyer/login');

  const buyer = await prisma.buyer.findFirst({ where: { phone } });
  if (!buyer) redirect('/buyer/login');

  const transaction = await prisma.transaction.findUnique({
    where: { id },
    include: { farmer: true },
  });

  if (!transaction) redirect('/buyer/transactions');
  if (transaction.buyerId !== buyer.id) redirect('/buyer/transactions');

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Transaction Details</h1>
      
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
        <div className="flex justify-between items-start mb-6">
          <div>
            <p className="font-mono text-xs text-gray-500">{transaction.reference}</p>
            <h2 className="text-xl font-bold text-gray-900 mt-1">Farmer: {transaction.farmer.name ?? 'Unknown'}</h2>
          </div>
          <StatusBadge status={transaction.status} />
        </div>
        
        <div className="grid grid-cols-2 gap-4 text-sm border-t border-gray-100 pt-4 mb-6">
          <div><p className="text-gray-500">Bags</p><p className="font-medium text-gray-900">{transaction.quantityBags}</p></div>
          <div><p className="text-gray-500">Price per Bag</p><p className="font-medium text-gray-900">KSh {transaction.pricePerBag.toLocaleString()}</p></div>
          <div><p className="text-gray-500">Total Value</p><p className="font-bold text-[#00703C]">KSh {transaction.totalValue.toLocaleString()}</p></div>
        </div>

        {transaction.deliveryMethod && (
          <div className="bg-blue-50 border border-blue-100 rounded-lg p-4 mb-6">
            <h3 className="text-sm font-bold text-blue-800 mb-3 flex items-center gap-2"><Truck className="w-4 h-4" /> Logistics Details</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm text-blue-900">
              <p className="flex items-center gap-2"><span className="font-medium">Method:</span> {transaction.deliveryMethod}</p>
              <p className="flex items-center gap-2"><MapPin className="w-4 h-4" /> {transaction.deliveryLocation}</p>
              {transaction.scheduledDate && (
                <p className="flex items-center gap-2"><Calendar className="w-4 h-4" /> {new Date(transaction.scheduledDate).toLocaleString('en-KE')}</p>
              )}
              {transaction.fulfillmentNotes && (
                <p className="flex items-center gap-2"><FileText className="w-4 h-4" /> {transaction.fulfillmentNotes}</p>
              )}
            </div>
          </div>
        )}

        <div className="mt-6 pt-6 border-t border-gray-100">
          <h3 className="text-sm font-semibold text-gray-700 mb-3">Actions</h3>
          <TransactionActions transactionId={transaction.id} currentStatus={transaction.status} userRole="BUYER" />
        </div>
      </div>

      <div>
        <h3 className="text-lg font-bold text-gray-900 mb-4">Negotiation Chat</h3>
        <ChatWindow transactionId={transaction.id} currentUserId={transaction.buyerId} />
      </div>
    </div>
  );
}
