import Link from 'next/link';
import { prisma } from '@/lib/prisma';
import TrustScoreBadge from '@/components/reputation/TrustScoreBadge';
import { ArrowLeft, MapPin, Package } from 'lucide-react';

export const dynamic = 'force-dynamic';

export default async function PublicProfilePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  // Try to find as Farmer first
  const farmer = await prisma.farmer.findUnique({
    where: { id },
    include: { 
      ProduceListing: { 
        where: { status: 'ACTIVE' }, 
        select: { id: true, product: true, quantityBags: true, pricePerBag: true } 
      } 
    }
  });

  let user: { id: string; name: string | null; location: string | null; village: string | null } | null = null;
  let userType: 'FARMER' | 'BUYER' = 'FARMER';
  let activeListings: { id: string; product: string; quantityBags: number; pricePerBag: number }[] = [];

  if (farmer) {
    user = farmer;
    userType = 'FARMER';
    activeListings = farmer.ProduceListing;
  } else {
    const buyer = await prisma.buyer.findUnique({
      where: { id }
    });
    if (buyer) {
      user = { id: buyer.id, name: buyer.name, location: buyer.location, village: null };
      userType = 'BUYER';
    }
  }

  if (!user) {
    return <div className="p-8 text-center">User not found.</div>;
  }

  // Fetch Trust Score separately
  const trustScore = await prisma.trustScore.findUnique({
    where: { userId_userType: { userId: user.id, userType } }
  });

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-2xl mx-auto bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
        <div className="bg-linear-to-r from-[#00703C] to-[#004d29] p-8 text-white text-center">
          <div className="w-24 h-24 bg-white/20 rounded-full mx-auto mb-4 flex items-center justify-center text-4xl font-bold">
            {user.name?.charAt(0) || 'U'}
          </div>
          <h1 className="text-3xl font-bold">{user.name}</h1>
          <p className="text-green-100 text-sm mt-1 flex items-center justify-center gap-1">
            <MapPin className="w-4 h-4" /> {user.village || user.location || 'Kenya'}
          </p>
        </div>
        
        <div className="p-6 space-y-6">
          <div className="flex flex-col items-center border-b pb-6">
            <h2 className="text-sm font-bold uppercase text-gray-500 mb-2">Trust Score</h2>
            <TrustScoreBadge trustScore={trustScore} size="lg" />
          </div>

          {userType === 'FARMER' && (
            <div>
              <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2"><Package className="w-5 h-5 text-[#00703C]" /> Active Listings</h3>
              <div className="grid grid-cols-2 gap-4">
                {activeListings.map((l) => (
                  <div key={l.id} className="bg-gray-50 p-4 rounded-lg border border-gray-100">
                    <p className="font-bold text-gray-900">{l.product}</p>
                    <p className="text-sm text-gray-600">{l.quantityBags} bags @ KSh {l.pricePerBag}</p>
                  </div>
                ))}
                {activeListings.length === 0 && (
                  <p className="text-gray-400 text-sm col-span-2 text-center py-4">No active listings.</p>
                )}
              </div>
            </div>
          )}

          <Link href="/" className="text-sm text-gray-500 hover:text-gray-900 flex items-center gap-1">
            <ArrowLeft className="w-4 h-4" /> Back to Home
          </Link>
        </div>
      </div>
    </div>
  );
}
