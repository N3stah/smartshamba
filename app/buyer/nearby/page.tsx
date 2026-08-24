import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { prisma } from '@/lib/prisma';
import { ArrowLeft, MapPin } from 'lucide-react';
import MapView from '@/components/gis/MapView';

export const dynamic = 'force-dynamic';

export default async function BuyerNearbyPage() {
  const cookieStore = await cookies();
  const phone = cookieStore.get('smartshamba_buyer')?.value;
  if (!phone) redirect('/buyer/login');

  const buyer = await prisma.buyer.findFirst({ where: { phone } });
  if (!buyer) redirect('/buyer/login');

  const farmers = await prisma.farmer.findMany({
    where: { 
      latitude: { not: null }, 
      ProduceListing: { some: { status: 'ACTIVE' } } 
    },
    take: 50,
    select: { id: true, name: true, latitude: true, longitude: true, village: true }
  });

  const markers = farmers.map(f => ({
    id: f.id,
    name: f.name || 'Farmer',
    latitude: f.latitude!,
    longitude: f.longitude!,
    description: f.village || 'Kenya',
    type: 'FARMER' as const
  }));

  const center: [number, number] = buyer.latitude && buyer.longitude 
    ? [buyer.latitude, buyer.longitude] 
    : [0.1769, 37.9083];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between border-b border-gray-200 pb-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-green-100 rounded-lg">
            <MapPin className="w-6 h-6 text-[#00703C]" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Nearby Suppliers</h1>
            <p className="text-sm text-gray-500">Discover farmers with active listings on the map</p>
          </div>
        </div>
        <Link href="/buyer/dashboard" className="text-sm text-gray-500 hover:text-gray-900 flex items-center gap-1 bg-white px-3 py-2 rounded-lg border border-gray-200 shadow-sm">
          <ArrowLeft className="w-4 h-4" /> Back
        </Link>
      </div>

      <MapView markers={markers} center={center} zoom={6} />

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
        <h2 className="font-semibold text-gray-900 mb-4">Active Suppliers List</h2>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {farmers.map(f => (
            <div key={f.id} className="border border-gray-100 rounded-lg p-4">
              <p className="font-medium text-gray-900">{f.name}</p>
              <p className="text-xs text-gray-500 flex items-center gap-1 mt-1">
                <MapPin className="w-3 h-3" /> {f.village || 'Kenya'}
              </p>
            </div>
          ))}
          {farmers.length === 0 && <p className="text-gray-400 text-sm">No suppliers with active listings found.</p>}
        </div>
      </div>
    </div>
  );
}
