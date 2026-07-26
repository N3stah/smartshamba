import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import DemandForm from '@/components/DemandForm';

export default async function BuyerDemands() {
  const cookieStore = await cookies();
  const phone = cookieStore.get('smartshamba_buyer')?.value;
  if (!phone) redirect('/buyer/login');

  const buyer = await prisma.buyer.findFirst({ where: { phone }, include: { BuyerDemand: true } });
  if (!buyer) redirect('/buyer/login');

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Post Demand</h1>
      <div className="grid lg:grid-cols-2 gap-8">
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
          <h2 className="text-lg font-bold mb-4">Create New Demand Request</h2>
          <DemandForm />
        </div>
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
          <h2 className="text-lg font-bold mb-4">Active Demands</h2>
          {buyer.BuyerDemand.length === 0 ? (
            <p className="text-gray-400 text-sm">No active demands.</p>
          ) : (
            <div className="space-y-3">
              {buyer.BuyerDemand.map(d => (
                <div key={d.id} className="border border-gray-100 p-3 rounded-lg flex justify-between">
                  <div>
                    <p className="font-medium text-gray-900">{d.product}</p>
                    <p className="text-xs text-gray-500">{d.quantityBags} bags needed in {d.location}</p>
                  </div>
                  <span className="text-xs font-bold text-blue-700 bg-blue-100 px-2 py-1 rounded-full h-fit">{d.status}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
