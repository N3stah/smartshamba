import { prisma } from '@/lib/prisma';
import { MapPin, Package, User } from 'lucide-react';
import AcceptDemandButton from '@/components/AcceptDemandButton';

export default async function FarmerDemandsPage() {
  // Fetch all active demands. In the future, we can filter this by farmer's county or crops.
  const demands = await prisma.buyerDemand.findMany({ 
    where: { status: 'ACTIVE' }, 
    include: { 
      buyer: {
        select: { name: true, location: true }
      }
    },
    orderBy: { createdAt: 'desc' },
  });

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-2">Active Buyer Demands</h1>
      <p className="text-gray-500 text-sm mb-8">Browse what buyers are actively looking to purchase. If you have the produce, accept the demand to initiate a transaction.</p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {demands.length === 0 ? (
          <div className="col-span-full text-center py-12 bg-white border border-gray-200 rounded-xl text-gray-400">
            No active buyer demands right now. Check back soon!
          </div>
        ) : (
          demands.map((demand) => (
            <div key={demand.id} className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 hover:shadow-md transition-shadow flex flex-col">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                    <Package className="w-5 h-5 text-[#00703C]" /> {demand.product}
                  </h3>
                  <p className="text-sm text-gray-500 mt-1">
                    Needs: {demand.quantityBags} bags
                  </p>
                </div>
                <span className="bg-blue-100 text-blue-700 text-xs font-bold px-3 py-1 rounded-full">
                  Active
                </span>
              </div>
              
              <div className="border-t border-gray-100 pt-4 mt-auto">
                <div className="text-sm text-gray-600 space-y-1 mb-4">
                  <p className="flex items-center gap-2">
                    <User className="w-4 h-4 text-gray-400" /> 
                    {demand.buyer?.name ?? 'Unknown Buyer'}
                  </p>
                  <p className="flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-gray-400" /> 
                    Delivery to: {demand.location}
                  </p>
                </div>

                <AcceptDemandButton demandId={demand.id} />
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
