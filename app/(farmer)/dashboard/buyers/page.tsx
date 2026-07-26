import { prisma } from '@/lib/prisma';
import { ShieldCheck, MapPin, Star } from 'lucide-react';

export default async function FarmerBuyerDirectory() {
  const buyers = await prisma.buyer.findMany({ 
    where: { active: true }, 
    orderBy: { pricePerBag: 'desc' } 
  });

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Buyer Directory</h1>
        <p className="text-gray-500 text-sm mt-1">Connect directly with trusted grain millers across Kenya.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {buyers.map((buyer) => (
          <div key={buyer.id} className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 hover:shadow-md transition-shadow flex flex-col">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="text-lg font-bold text-gray-900">{buyer.name}</h3>
                <p className="text-sm text-gray-500 flex items-center gap-1 mt-1">
                  <MapPin className="w-4 h-4" /> {buyer.location}
                </p>
              </div>
              <span className="bg-green-100 text-[#00703C] text-xs font-bold px-3 py-1 rounded-full flex items-center gap-1">
                <ShieldCheck className="w-3 h-3" /> Verified
              </span>
            </div>
            
            <div className="border-t border-gray-100 pt-4 mt-auto">
              <p className="text-xs text-gray-500">Current Offer (90kg bag)</p>
              <p className="text-2xl font-bold text-[#00703C]">KSh {buyer.pricePerBag.toLocaleString()}</p>
              <p className="text-xs text-gray-500 mt-2">Demand: {buyer.capacityBags.toLocaleString()} bags</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
