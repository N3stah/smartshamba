import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import ListingForm from '@/components/ListingForm';

export default async function FarmerListings() {
  const cookieStore = await cookies();
  const phone = cookieStore.get('smartshamba_farmer')?.value;
  if (!phone) redirect('/dashboard/login');

  const farmer = await prisma.farmer.findUnique({ where: { phone }, include: { ProduceListing: true } });
  if (!farmer) redirect('/dashboard/login');

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Sell Produce</h1>
      <div className="grid lg:grid-cols-2 gap-8">
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
          <h2 className="text-lg font-bold mb-4">Create New Listing</h2>
          <ListingForm />
        </div>
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
          <h2 className="text-lg font-bold mb-4">Active Listings</h2>
          {farmer.ProduceListing.length === 0 ? (
            <p className="text-gray-400 text-sm">No active listings.</p>
          ) : (
            <div className="space-y-3">
              {farmer.ProduceListing.map(l => (
                <div key={l.id} className="border border-gray-100 p-3 rounded-lg flex justify-between">
                  <div>
                    <p className="font-medium text-gray-900">{l.product}</p>
                    <p className="text-xs text-gray-500">{l.quantityBags} bags @ KSh {l.pricePerBag}</p>
                  </div>
                  <span className="text-xs font-bold text-green-700 bg-green-100 px-2 py-1 rounded-full h-fit">{l.status}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
