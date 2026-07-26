export const dynamic = 'force-dynamic';

import { prisma } from '@/lib/prisma';
import { MapPin, Package, User } from 'lucide-react';
import InitiateTransactionButton from '@/components/InitiateTransactionButton';

export default async function BuyerProduceDirectory() {
  const listings = await prisma.produceListing.findMany({ 
    where: { status: 'ACTIVE' }, 
    include: { 
      farmer: {
        select: { name: true, location: true, village: true, verified: true }
      }
    },
    orderBy: { createdAt: 'desc' },
    take: 50,
  });

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-2">Available Produce</h1>
      <p className="text-gray-500 text-sm mb-8">Browse maize and beans posted directly by farmers across Kenya.</p>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {listings.length === 0 ? (
          <div className="col-span-full text-center py-12 bg-white border border-gray-200 rounded-xl text-gray-400">
            No produce has been posted by farmers yet. Check back soon!
          </div>
        ) : (
          listings.map((listing) => (
            <div key={listing.id} className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 hover:shadow-md transition-shadow flex flex-col">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                    <Package className="w-5 h-5 text-[#00703C]" /> {listing.product}
                  </h3>
                  <p className="text-sm text-gray-500 mt-1">
                    {listing.quantityBags} bags available
                  </p>
                </div>
                {listing.farmer?.verified && (
                  <span className="bg-green-100 text-[#00703C] text-xs font-bold px-3 py-1 rounded-full">
                    Verified Farmer
                  </span>
                )}
              </div>
              
              <div className="border-t border-gray-100 pt-4 mt-auto">
                <div className="flex justify-between items-center mb-3">
                  <p className="text-xs text-gray-500">Price per bag</p>
                  <p className="text-xl font-bold text-[#00703C]">KSh {listing.pricePerBag.toLocaleString()}</p>
                </div>
                
                <div className="text-sm text-gray-600 space-y-1 mb-4">
                  <p className="flex items-center gap-2">
                    <User className="w-4 h-4 text-gray-400" /> 
                    {listing.farmer?.name ?? 'Unknown Farmer'}
                  </p>
                  <p className="flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-gray-400" /> 
                    {listing.farmer?.village ?? listing.farmer?.location ?? 'Kenya'}
                  </p>
                </div>

                <InitiateTransactionButton listingId={listing.id} />
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
